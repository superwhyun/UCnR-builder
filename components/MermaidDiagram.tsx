'use client';

import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface MermaidDiagramProps {
  chart: string;
  className?: string;
}

export function MermaidDiagram({ chart, className = '' }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#f5f5f4',
        primaryTextColor: '#1c1917',
        primaryBorderColor: '#a8a29e',
        lineColor: '#78716c',
        secondaryColor: '#fafaf9',
        tertiaryColor: '#e7e5e4',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        fontSize: '14px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
      },
      sequence: {
        diagramMarginX: 50,
        diagramMarginY: 10,
        actorMargin: 50,
        width: 150,
        height: 65,
        boxMargin: 10,
        boxTextMargin: 5,
        noteMargin: 10,
        messageMargin: 35,
        mirrorActors: true,
        bottomMarginAdj: 1,
        useMaxWidth: true,
        rightAngles: false,
        showSequenceNumbers: false,
      },
    });
  }, []);

  useEffect(() => {
    if (ref.current && chart) {
      setIsLoading(true);
      setError(null);
      
      const renderDiagram = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          if (ref.current) {
            ref.current.innerHTML = svg;
          }
        } catch (err) {
          setError('Failed to render diagram');
          console.error('Mermaid render error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      renderDiagram();
    }
  }, [chart]);

  if (!chart) {
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
        className={`mermaid-diagram ${isLoading ? 'hidden' : ''}`}
        style={{ display: 'flex', justifyContent: 'center' }}
      />
    </Card>
  );
}
