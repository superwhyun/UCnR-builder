'use client';

import { useState } from 'react';
import { UseCase, Requirement } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Check, Filter, Trash2 } from 'lucide-react';

interface RequirementsPanelProps {
  useCase: UseCase;
  onGenerateRequirements: (prompt: string) => Promise<void>;
  onToggleRequirement: (reqId: string) => void;
  onDeleteRequirement: (reqId: string) => void;
  isGenerating?: boolean;
}

export function RequirementsPanel({ 
  useCase, 
  onGenerateRequirements, 
  onToggleRequirement,
  onDeleteRequirement,
  isGenerating = false 
}: RequirementsPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [filter, setFilter] = useState<'all' | 'functional' | 'non-functional'>('all');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerateRequirements(prompt.trim());
    setPrompt('');
  };

  const filteredRequirements = useCase.requirements.filter(req => {
    if (filter === 'all') return true;
    return req.type === filter;
  });

  const selectedCount = useCase.requirements.filter(r => r.selected).length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'low': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate Section */}
      <Card className="p-5 border-0 shadow-elegant">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          요구사항 도출
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          이 유즈케이스에 대해 추가로 알려주시면 AI가 요구사항을 생성합니다.
        </p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 보안 요구사항, 성능 기준, 에러 처리 방식 등..."
          className="min-h-[80px] text-sm mb-3 resize-none"
        />
        <Button 
          onClick={handleGenerate} 
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              요구사항 생성
            </>
          )}
        </Button>
      </Card>

      {useCase.requirements.length > 0 && (
        <>
          <Separator />

          {/* Filter & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {(['all', 'functional', 'non-functional'] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="text-xs h-7 capitalize"
                  >
                    {f === 'all' ? '전체' : f === 'functional' ? '기능' : '비기능'}
                  </Button>
                ))}
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {selectedCount} / {useCase.requirements.length} 선택됨
            </span>
          </div>

          {/* Requirements List */}
          <div className="space-y-2">
            {filteredRequirements.map((req) => (
              <Card
                key={req.id}
                className={`p-4 border-0 shadow-elegant transition-all cursor-pointer ${
                  req.selected ? 'ring-1 ring-primary' : ''
                }`}
                onClick={() => onToggleRequirement(req.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox 
                    checked={req.selected} 
                    className="mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                    onCheckedChange={() => onToggleRequirement(req.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {req.type === 'functional' ? '기능' : '비기능'}
                        </Badge>
                        <Badge variant="outline" className={`text-xs ${getPriorityColor(req.priority)}`}>
                          {req.priority === 'high' ? '높음' : req.priority === 'medium' ? '중간' : '낮음'}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteRequirement(req.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className={`text-sm ${req.selected ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {req.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
