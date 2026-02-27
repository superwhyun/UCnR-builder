'use client';

import { UseCase } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight, Users, ListOrdered, Trash2 } from 'lucide-react';

interface UseCaseCardProps {
  useCase: UseCase;
  isSelected?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
}

export function UseCaseCard({ useCase, isSelected = false, onClick, onDelete }: UseCaseCardProps) {
  return (
    <Card
      onClick={onClick}
      className={`
        cursor-pointer p-4 transition-all duration-200 border-0
        ${isSelected 
          ? 'bg-primary text-primary-foreground shadow-elegant' 
          : 'bg-card hover:bg-accent shadow-elegant hover:shadow-elegant-hover'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm truncate ${
            isSelected ? 'text-primary-foreground' : 'text-foreground'
          }`}>
            {useCase.title}
          </h4>
          <p className={`text-xs mt-1 line-clamp-2 ${
            isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {useCase.description}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${isSelected ? 'text-primary-foreground/70 hover:text-primary-foreground' : 'text-muted-foreground hover:text-destructive'}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <ChevronRight className={`h-4 w-4 ${
            isSelected ? 'text-primary-foreground/50' : 'text-muted-foreground'
          }`} />
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3">
        <div className={`flex items-center gap-1.5 text-xs ${
          isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
        }`}>
          <Users className="h-3 w-3" />
          <span>{useCase.actors.length} Actor{useCase.actors.length !== 1 ? 's' : ''}</span>
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${
          isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
        }`}>
          <ListOrdered className="h-3 w-3" />
          <span>{useCase.flow.length} Steps</span>
        </div>
      </div>

      {useCase.requirements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10">
          <Badge 
            variant="secondary" 
            className={`text-xs ${
              isSelected 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {useCase.requirements.filter(r => r.selected).length} / {useCase.requirements.length} Requirements
          </Badge>
        </div>
      )}
    </Card>
  );
}
