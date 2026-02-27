'use client';

import { useEffect, useState } from 'react';
import { UseCase } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MermaidDiagram } from './MermaidDiagram';
import { Users, ArrowRight, Check } from 'lucide-react';

interface UseCaseDetailProps {
  useCase: UseCase;
  onMermaidDiagramChange?: (diagram: string) => void;
  onRegenerateMermaidDiagram?: () => void;
}

export function UseCaseDetail({
  useCase,
  onMermaidDiagramChange,
  onRegenerateMermaidDiagram,
}: UseCaseDetailProps) {
  const [diagramDraft, setDiagramDraft] = useState(useCase.mermaidDiagram);

  useEffect(() => {
    setDiagramDraft(useCase.mermaidDiagram);
  }, [useCase.id, useCase.mermaidDiagram]);

  const handleChangeDiagram = (value: string) => {
    setDiagramDraft(value);
    onMermaidDiagramChange?.(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{useCase.title}</h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {useCase.description}
        </p>
      </div>

      {/* Actors */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Actors:</span>
        <div className="flex gap-2">
          {useCase.actors.map((actor, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs font-normal">
              {actor}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      {/* Flow */}
      <div>
        <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-muted-foreground">
          동작 흐름
        </h3>
        <div className="space-y-3">
          {useCase.flow.map((step, idx) => (
            <Card 
              key={idx} 
              className="p-4 border-0 shadow-elegant hover:shadow-elegant-hover transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-xs font-medium shrink-0">
                  {step.order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline" className="text-xs font-normal">
                      {step.actor}
                    </Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    {step.target && (
                      <>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {step.target}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </>
                    )}
                    <span className="font-medium">{step.action}</span>
                  </div>
                  {step.result && (
                    <p className="text-xs text-muted-foreground mt-2 pl-1">
                      → {step.result}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* UML Diagram */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            시퀀스 다이어그램
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={onRegenerateMermaidDiagram}
          >
            흐름 기준 재생성
          </Button>
        </div>
        <Textarea
          value={diagramDraft}
          onChange={(e) => handleChangeDiagram(e.target.value)}
          className="min-h-44 font-mono text-xs resize-y mb-3"
          placeholder="Mermaid 시퀀스 다이어그램 코드를 직접 수정하세요."
        />
        <MermaidDiagram chart={diagramDraft} />
      </div>
    </div>
  );
}
