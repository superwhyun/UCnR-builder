'use client';

import { useEffect, useRef, useState } from 'react';
import { D2 } from '@terrastruct/d2';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface D2DiagramProps {
  chart: string;
  className?: string;
}

export function D2Diagram({ chart, className = '' }: D2DiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const d2Ref = useRef<D2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    d2Ref.current = new D2();
  }, []);

  useEffect(() => {
    if (!ref.current || !chart.trim() || !d2Ref.current) {
      return;
    }

    let cancelled = false;

    const renderDiagram = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await d2Ref.current!.compile(chart, {
          options: {
            layout: 'dagre',
            pad: 24,
            scale: 1,
            center: true,
            themeID: 0,
          },
        });

        const svg = await d2Ref.current!.render(result.diagram, {
          ...result.renderOptions,
          center: true,
          pad: 24,
          scale: 1,
          noXMLTag: true,
        });

        if (cancelled || !ref.current) return;

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

    renderDiagram();

    return () => {
      cancelled = true;
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
        style={{ display: 'flex', justifyContent: 'center' }}
      />
    </Card>
  );
}
