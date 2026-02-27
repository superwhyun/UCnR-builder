'use client';

import { UseCase } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MermaidDiagram } from './MermaidDiagram';
import { Users, ArrowRight, Check } from 'lucide-react';

interface UseCaseDetailProps {
  useCase: UseCase;
}

export function UseCaseDetail({ useCase }: UseCaseDetailProps) {
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
        <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-muted-foreground">
          시퀀스 다이어그램
        </h3>
        <MermaidDiagram chart={useCase.mermaidDiagram} />
      </div>
    </div>
  );
}
