'use client';

import { useEffect, useState } from 'react';
import { Step, UseCase } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { D2Diagram } from './D2Diagram';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Loader2, Trash2, Pencil } from 'lucide-react';

interface UseCaseDetailProps {
  useCase: UseCase;
  onUpdateUseCaseContent?: (updates: Partial<Pick<UseCase, 'title' | 'description' | 'assumptions' | 'actors' | 'flow'>>) => void;
  onReviseUseCase?: (
    prompt: string,
    editableClauses: { description: boolean; assumptions: boolean; actors: boolean; useCase: boolean }
  ) => Promise<void>;
  isRevisingUseCase?: boolean;
  onGenerateSequence?: (prompt: string) => Promise<void>;
  isGeneratingSequence?: boolean;
  onD2DiagramChange?: (diagram: string) => void;
}

export function UseCaseDetail({
  useCase,
  onUpdateUseCaseContent,
  onReviseUseCase,
  isRevisingUseCase = false,
  onGenerateSequence,
  isGeneratingSequence = false,
  onD2DiagramChange,
}: UseCaseDetailProps) {
  const [diagramDraft, setDiagramDraft] = useState(useCase.d2Diagram);
  const [revisePrompt, setRevisePrompt] = useState('');
  const [sequencePrompt, setSequencePrompt] = useState('');
  const [assumptionsDraft, setAssumptionsDraft] = useState(useCase.assumptions.join('\n'));
  const [descriptionDraft, setDescriptionDraft] = useState(useCase.description);
  const [editableClauses, setEditableClauses] = useState({
    description: true,
    assumptions: true,
    actors: true,
    useCase: true,
  });
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [stepDraft, setStepDraft] = useState<Step | null>(null);
  const [editingActorIndex, setEditingActorIndex] = useState<number | null>(null);
  const [actorDraft, setActorDraft] = useState<{ name: string; description: string } | null>(null);

  useEffect(() => {
    setDiagramDraft(useCase.d2Diagram);
    setAssumptionsDraft((useCase.assumptions || []).join('\n'));
    setDescriptionDraft(useCase.description);
    setEditingStepIndex(null);
    setStepDraft(null);
    setEditingActorIndex(null);
    setActorDraft(null);
  }, [useCase.id, useCase.d2Diagram, useCase.assumptions, useCase.description, useCase.actors]);

  const handleChangeDiagram = (value: string) => {
    setDiagramDraft(value);
    onD2DiagramChange?.(value);
  };

  const handleUpdateStep = (index: number, updates: Partial<Step>) => {
    const nextFlow = useCase.flow.map((step, i) => (
      i === index ? { ...step, ...updates } : step
    ));
    onUpdateUseCaseContent?.({ flow: nextFlow });
  };

  const handleDeleteStep = (index: number) => {
    const nextFlow = useCase.flow
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, order: i + 1 }));
    onUpdateUseCaseContent?.({ flow: nextFlow });
  };

  const handleStartEditStep = (index: number) => {
    setEditingStepIndex(index);
    setStepDraft({ ...useCase.flow[index] });
  };

  const handleCancelEditStep = () => {
    setEditingStepIndex(null);
    setStepDraft(null);
  };

  const handleSaveEditStep = (index: number) => {
    if (!stepDraft) return;
    handleUpdateStep(index, {
      actor: stepDraft.actor,
      target: stepDraft.target,
      action: stepDraft.action,
      result: stepDraft.result,
    });
    setEditingStepIndex(null);
    setStepDraft(null);
  };

  const handleAssumptionBlur = () => {
    const assumptions = assumptionsDraft
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    onUpdateUseCaseContent?.({ assumptions });
  };

  const handleDescriptionBlur = () => {
    onUpdateUseCaseContent?.({ description: descriptionDraft.trim() });
  };

  const handleStartEditActor = (index: number) => {
    setEditingActorIndex(index);
    setActorDraft({ ...useCase.actors[index] });
  };

  const handleCancelEditActor = () => {
    setEditingActorIndex(null);
    setActorDraft(null);
  };

  const handleSaveEditActor = (index: number) => {
    if (!actorDraft?.name.trim()) return;
    const nextActors = useCase.actors.map((actor, i) =>
      i === index
        ? { name: actorDraft.name.trim(), description: actorDraft.description.trim() || '역할 설명 없음' }
        : actor
    );
    onUpdateUseCaseContent?.({ actors: nextActors });
    setEditingActorIndex(null);
    setActorDraft(null);
  };

  const handleDeleteActor = (index: number) => {
    const nextActors = useCase.actors.filter((_, i) => i !== index);
    onUpdateUseCaseContent?.({ actors: nextActors });
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 border-0 shadow-elegant">
        <h3 className="text-sm font-medium mb-2">유즈케이스 수정 요청</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={editableClauses.description}
              onCheckedChange={(checked) => setEditableClauses((prev) => ({ ...prev, description: !!checked }))}
            />
            Description 수정
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={editableClauses.assumptions}
              onCheckedChange={(checked) => setEditableClauses((prev) => ({ ...prev, assumptions: !!checked }))}
            />
            Assumption 수정
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={editableClauses.actors}
              onCheckedChange={(checked) => setEditableClauses((prev) => ({ ...prev, actors: !!checked }))}
            />
            Actors 수정
          </label>
          <label className="flex items-center gap-2 text-xs">
            <Checkbox
              checked={editableClauses.useCase}
              onCheckedChange={(checked) => setEditableClauses((prev) => ({ ...prev, useCase: !!checked }))}
            />
            Use Case 수정
          </label>
        </div>
        <div className="flex gap-2">
          <Textarea
            value={revisePrompt}
            onChange={(e) => setRevisePrompt(e.target.value)}
            placeholder="현재 유즈케이스에 반영할 추가 수정사항을 입력하세요."
            className="min-h-20"
          />
          <Button
            onClick={async () => {
              if (!revisePrompt.trim() || !onReviseUseCase) return;
              await onReviseUseCase(revisePrompt.trim(), editableClauses);
              setRevisePrompt('');
            }}
            disabled={!revisePrompt.trim() || isRevisingUseCase}
          >
            {isRevisingUseCase ? <Loader2 className="h-4 w-4 animate-spin" /> : '반영'}
          </Button>
        </div>
      </Card>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{useCase.title}</h2>
      </div>

      {/* Description */}
      <div>
        <h3 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        <Textarea
          value={descriptionDraft}
          onChange={(e) => setDescriptionDraft(e.target.value)}
          onBlur={handleDescriptionBlur}
          className="min-h-28"
          placeholder="서비스 필요성, 베네핏, 큰 그림의 동작 방식을 설명하세요."
        />
      </div>

      <Separator />

      {/* Assumption */}
      <div>
        <h3 className="text-sm font-medium mb-3 uppercase tracking-wide text-muted-foreground">
          Assumption
        </h3>
        <Textarea
          value={assumptionsDraft}
          onChange={(e) => setAssumptionsDraft(e.target.value)}
          onBlur={handleAssumptionBlur}
          className="min-h-24"
          placeholder="한 줄에 하나씩 사전 가정사항을 입력하세요."
        />
      </div>

      <Separator />

      {/* Actors */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Actors</h3>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[14rem_minmax(0,1fr)] gap-3 px-3 text-xs text-muted-foreground uppercase tracking-wide">
            <span>Actor</span>
            <span>Description</span>
          </div>
          {useCase.actors.map((actor, idx) => (
            <Card key={idx} className="p-3 border-0 shadow-elegant">
              {editingActorIndex === idx && actorDraft ? (
                <div className="grid grid-cols-[14rem_minmax(0,1fr)_auto] gap-3 items-start">
                  <Input
                    value={actorDraft.name}
                    onChange={(e) => setActorDraft({ ...actorDraft, name: e.target.value })}
                    placeholder="Actor name"
                  />
                  <Textarea
                    value={actorDraft.description}
                    onChange={(e) => setActorDraft({ ...actorDraft, description: e.target.value })}
                    className="min-h-16"
                    placeholder="Actor description"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEditActor(idx)}>저장</Button>
                    <Button variant="outline" size="sm" onClick={handleCancelEditActor}>취소</Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[14rem_minmax(0,1fr)_auto] gap-3 items-start">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="text-xs font-normal max-w-full truncate">
                      {actor.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{actor.description}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" onClick={() => handleStartEditActor(idx)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteActor(idx)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Use Case */}
      <div>
        <h3 className="text-sm font-medium mb-4 uppercase tracking-wide text-muted-foreground">
          Use Case
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
                  {editingStepIndex === idx && stepDraft ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <Input
                          value={stepDraft.actor}
                          onChange={(e) => setStepDraft({ ...stepDraft, actor: e.target.value })}
                          placeholder="Actor"
                        />
                        <Input
                          value={stepDraft.target || ''}
                          onChange={(e) => setStepDraft({ ...stepDraft, target: e.target.value })}
                          placeholder="Target"
                        />
                      </div>
                      <Textarea
                        value={stepDraft.action}
                        onChange={(e) => setStepDraft({ ...stepDraft, action: e.target.value })}
                        className="mt-2 min-h-16"
                        placeholder="Action 문장 (주어 포함)"
                      />
                      <Textarea
                        value={stepDraft.result || ''}
                        onChange={(e) => setStepDraft({ ...stepDraft, result: e.target.value })}
                        className="mt-2 min-h-14"
                        placeholder="Result 문장 (주어 포함)"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs font-normal">
                          {step.actor}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {step.target || '대상 없음'}
                        </Badge>
                      </div>
                      <p className="text-sm mt-2 leading-relaxed">{step.action}</p>
                      {step.result && (
                        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                          결과: {step.result}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  {editingStepIndex === idx ? (
                    <>
                      <Button size="sm" onClick={() => handleSaveEditStep(idx)}>
                        저장
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCancelEditStep}>
                        취소
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartEditStep(idx)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStep(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
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
          <Badge variant="outline">수정 가능</Badge>
        </div>
        <Card className="p-4 border-0 shadow-elegant mb-3">
          <h4 className="text-sm font-medium mb-2">시퀀스 생성 요청</h4>
          <div className="flex gap-2">
            <Textarea
              value={sequencePrompt}
              onChange={(e) => setSequencePrompt(e.target.value)}
              placeholder="시퀀스에 반영할 추가 요구사항(예: 인증 단계 세분화, 파라미터 강화)을 입력하세요."
              className="min-h-20"
            />
            <Button
              onClick={async () => {
                if (!onGenerateSequence) return;
                await onGenerateSequence(sequencePrompt.trim());
                setSequencePrompt('');
              }}
              disabled={isGeneratingSequence}
            >
              {isGeneratingSequence ? <Loader2 className="h-4 w-4 animate-spin" /> : '생성'}
            </Button>
          </div>
        </Card>
        <Textarea
          value={diagramDraft}
          onChange={(e) => handleChangeDiagram(e.target.value)}
          className="min-h-44 font-mono text-xs resize-y mb-3"
          placeholder="D2 다이어그램 코드를 직접 수정하세요."
        />
        <D2Diagram chart={diagramDraft} />
      </div>
    </div>
  );
}
