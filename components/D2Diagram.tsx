'use client';

import { useEffect, useRef, useState } from 'react';
import { D2 } from '@terrastruct/d2';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface D2DiagramProps {
  chart: string;
  className?: string;
}

const DIAGRAM_SCALE = 0.82;
const FONT_SCALE = 1.5;
const RENDER_DEBOUNCE_MS = 180;

function upscaleSvgFont(svg: string, factor: number): string {
  const scale = (value: string) => `${Math.max(1, Number(value) * factor).toFixed(2)}`;

  let updated = svg.replace(/font-size="([\d.]+)"/g, (_, raw) => `font-size="${scale(raw)}"`);
  updated = updated.replace(/font-size:\s*([\d.]+)px/g, (_, raw) => `font-size:${scale(raw)}px`);
  updated = updated.replace(/font:\s*([\d.]+)px/g, (_, raw) => `font:${scale(raw)}px`);

  return updated;
}

function normalizeD2QuotedNewlines(source: string): string {
  let normalized = '';
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];

    if (ch === '"' && !escaped) {
      inQuote = !inQuote;
      normalized += ch;
      continue;
    }

    if ((ch === '\n' || ch === '\r') && inQuote) {
      normalized += '\\n';
      if (ch === '\r' && source[i + 1] === '\n') {
        i += 1;
      }
      escaped = false;
      continue;
    }

    normalized += ch;

    if (ch === '\\' && !escaped) {
      escaped = true;
    } else {
      escaped = false;
    }
  }

  return normalized;
}

export function D2Diagram({ chart, className = '' }: D2DiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const d2Ref = useRef<D2 | null>(null);
  const lastRenderedChartRef = useRef('');
  const renderNonceRef = useRef(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [svgMarkup, setSvgMarkup] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    d2Ref.current = new D2();
  }, []);

  useEffect(() => {
    const safeChart = normalizeD2QuotedNewlines(chart);

    if (!safeChart.trim()) {
      setIsLoading(false);
      setError(null);
      setSvgMarkup('');
      lastRenderedChartRef.current = '';
      if (ref.current) ref.current.innerHTML = '';
      return;
    }

    if (!ref.current || !d2Ref.current) {
      return;
    }

    if (safeChart === lastRenderedChartRef.current) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const nonce = renderNonceRef.current + 1;
    renderNonceRef.current = nonce;

    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await d2Ref.current!.compile(safeChart, {
          options: {
            layout: 'dagre',
            pad: 24,
            scale: DIAGRAM_SCALE,
            center: true,
            themeID: 0,
          },
        });

        const rawSvg = await d2Ref.current!.render(result.diagram, {
          ...result.renderOptions,
          center: true,
          pad: 24,
          scale: DIAGRAM_SCALE,
          noXMLTag: true,
        });
        const svg = upscaleSvgFont(rawSvg, FONT_SCALE);

        if (cancelled || !ref.current || nonce !== renderNonceRef.current) return;

        lastRenderedChartRef.current = safeChart;
        setSvgMarkup(svg);
        ref.current.innerHTML = svg;
        const svgElement = ref.current.querySelector('svg');
        if (svgElement) {
          svgElement.style.maxWidth = '100%';
          svgElement.style.height = 'auto';
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to render D2 diagram');
          console.error('D2 render error:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      renderDiagram();
    }, RENDER_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [chart]);

  if (!chart.trim()) {
    return (
      <Card className="p-8 flex items-center justify-center min-h-[200px] border-dashed border-2">
        <p className="text-muted-foreground text-sm">다이어그램이 생성되지 않았습니다</p>
      </Card>
    );
  }

  return (
    <Card className={`p-6 overflow-auto ${className}`}>
      {isLoading && (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {error && (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      <div
        ref={ref}
        className={`d2-diagram ${isLoading ? 'hidden' : ''}`}
        style={{ display: 'flex', justifyContent: 'center', cursor: 'zoom-in' }}
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(true);
          }
        }}
      />
      <Dialog open={isExpanded} onOpenChange={setIsExpanded}>
        <DialogContent className="w-[95vw] max-w-[95vw] h-[90vh] p-4 sm:max-w-[95vw]">
          <DialogHeader>
            <DialogTitle>시퀀스 다이어그램 (확대 보기)</DialogTitle>
          </DialogHeader>
          <div className="h-full overflow-auto rounded-md border bg-card p-3">
            <div className="min-w-max" dangerouslySetInnerHTML={{ __html: svgMarkup }} />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
