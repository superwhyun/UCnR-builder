'use client';

import { useState, useEffect } from 'react';
import { UseCase, Message, Requirement } from '@/types';
import { ChatPanel } from '@/components/ChatPanel';
import { UseCaseCard } from '@/components/UseCaseCard';
import { UseCaseDetail } from '@/components/UseCaseDetail';
import { RequirementsPanel } from '@/components/RequirementsPanel';
import { SettingsDialog } from '@/components/SettingsDialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Layers, FileText, Check, AlertCircle, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Settings, getDefaultSettings, loadSettings } from '@/lib/settings';
import {
  generateUseCaseFromPrompt,
  generateRequirements,
  reviseUseCaseFromPrompt,
  generateSequenceDiagramFromPrompt,
} from '@/lib/openai';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

const APP_STATE_KEY = 'usecase-builder-app-state';
const DETAIL_LAYOUT_BREAKPOINT = 1680;

interface PersistedState {
  useCases: Array<Omit<UseCase, 'createdAt'> & { createdAt: string }>;
  selectedUseCaseId: string | null;
  messages: Array<Omit<Message, 'timestamp'> & { timestamp: string }>;
  view: 'chat' | 'detail';
}

export default function Home() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReqs, setIsGeneratingReqs] = useState(false);
  const [isRevisingUseCase, setIsRevisingUseCase] = useState(false);
  const [isGeneratingSequence, setIsGeneratingSequence] = useState(false);
  const [view, setView] = useState<'chat' | 'detail'>('chat');
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [error, setError] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(0);
  const [compactFocus, setCompactFocus] = useState<'left' | 'right'>('right');

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(APP_STATE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored) as PersistedState;
      const restoredUseCases: UseCase[] = (parsed.useCases || []).map((useCase) => ({
        ...useCase,
        assumptions: useCase.assumptions || [],
        actors: Array.isArray(useCase.actors)
          ? useCase.actors.map((actor: any) =>
              typeof actor === 'string'
                ? { name: actor, description: '역할 설명 없음' }
                : { name: actor.name, description: actor.description || '역할 설명 없음' }
            )
          : [],
        createdAt: new Date(useCase.createdAt),
      }));
      const restoredMessages: Message[] = (parsed.messages || []).map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp),
      }));
      const selectedIdExists = restoredUseCases.some((useCase) => useCase.id === parsed.selectedUseCaseId);

      setUseCases(restoredUseCases);
      setMessages(restoredMessages);
      setSelectedUseCaseId(selectedIdExists ? parsed.selectedUseCaseId : null);
      setView(selectedIdExists && parsed.view === 'detail' ? 'detail' : 'chat');
    } catch (e) {
      console.error('Failed to restore app state:', e);
    }
  }, []);

  useEffect(() => {
    try {
      const stateToSave: PersistedState = {
        useCases: useCases.map((useCase) => ({
          ...useCase,
          createdAt: useCase.createdAt.toISOString(),
        })),
        selectedUseCaseId,
        messages: messages.map((message) => ({
          ...message,
          timestamp: message.timestamp.toISOString(),
        })),
        view,
      };
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save app state:', e);
    }
  }, [useCases, selectedUseCaseId, messages, view]);

  const selectedUseCase = useCases.find(uc => uc.id === selectedUseCaseId);

  const handleSendMessage = async (content: string) => {
    setError(null);
    
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const useCase = await generateUseCaseFromPrompt(content, settings);
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `다음 유즈케이스를 분석했습니다: **${useCase.title}**\n\n승인하시면 목록에 등록됩니다.`,
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setUseCases(prev => [useCase, ...prev]);
      setSelectedUseCaseId(useCase.id);
      setView('detail');
    } catch (err: any) {
      setError(err.message || '유즈케이스 생성 중 오류가 발생했습니다.');
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `오류: ${err.message || '알 수 없는 오류가 발생했습니다.'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateRequirements = async (prompt: string) => {
    if (!selectedUseCase) return;
    
    setError(null);
    setIsGeneratingReqs(true);
    
    try {
      const newRequirements = await generateRequirements(selectedUseCase, prompt, settings);
      setUseCases(prev => prev.map(uc => {
        if (uc.id === selectedUseCase.id) {
          return { ...uc, requirements: [...uc.requirements, ...newRequirements] };
        }
        return uc;
      }));
    } catch (err: any) {
      setError(err.message || '요구사항 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingReqs(false);
    }
  };

  const handleToggleRequirement = (reqId: string) => {
    setUseCases(prev => prev.map(uc => {
      if (uc.id === selectedUseCaseId) {
        return {
          ...uc,
          requirements: uc.requirements.map(req => 
            req.id === reqId ? { ...req, selected: !req.selected } : req
          )
        };
      }
      return uc;
    }));
  };

  const handleDeleteRequirement = (reqId: string) => {
    setUseCases(prev => prev.map(uc => {
      if (uc.id === selectedUseCaseId) {
        return {
          ...uc,
          requirements: uc.requirements.filter(req => req.id !== reqId)
        };
      }
      return uc;
    }));
  };

  const handleNewUseCase = () => {
    setSelectedUseCaseId(null);
    setView('chat');
    setError(null);
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    setError(null);
  };

  const handleDeleteUseCase = (useCaseId: string) => {
    setUseCases(prev => prev.filter(uc => uc.id !== useCaseId));
    if (selectedUseCaseId === useCaseId) {
      setSelectedUseCaseId(null);
      setView('chat');
      setError(null);
    }
  };

  const handleDownloadUseCase = (useCase: UseCase) => {
    const safe = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ').trim();
    const slug = useCase.title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'usecase';

    const assumptionsMd = useCase.assumptions.length
      ? useCase.assumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')
      : '- (none)';

    const actorsMd = useCase.actors.length
      ? useCase.actors.map((actor) => `| ${safe(actor.name)} | ${safe(actor.description)} |`).join('\n')
      : '| - | - |';

    const flowMd = useCase.flow.length
      ? useCase.flow.map((step) => {
          const target = step.target || '-';
          const result = step.result || '-';
          return `| ${step.order} | ${safe(step.actor)} | ${safe(target)} | ${safe(step.action)} | ${safe(result)} |`;
        }).join('\n')
      : '| - | - | - | - | - |';

    const requirementsMd = useCase.requirements.length
      ? useCase.requirements.map((req) => `| ${req.priority} | ${req.type} | ${req.selected ? 'yes' : 'no'} | ${safe(req.description)} |`).join('\n')
      : '| - | - | - | - |';

    const markdown = `# ${useCase.title}

## Description
${useCase.description}

## Assumptions
${assumptionsMd}

## Actors
| Name | Description |
| --- | --- |
${actorsMd}

## Use Case Flow
| Order | Actor | Target | Action | Result |
| --- | --- | --- | --- | --- |
${flowMd}

## Sequence Diagram (Mermaid)
\`\`\`mermaid
${useCase.mermaidDiagram || 'sequenceDiagram\n  %% not generated yet'}
\`\`\`

## Requirements
| Priority | Type | Selected | Description |
| --- | --- | --- | --- |
${requirementsMd}
`;

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpdateMermaidDiagram = (diagram: string) => {
    if (!selectedUseCaseId) return;
    setUseCases(prev => prev.map(uc =>
      uc.id === selectedUseCaseId ? { ...uc, mermaidDiagram: diagram } : uc
    ));
  };

  const handleUpdateUseCaseContent = (updates: Partial<Pick<UseCase, 'title' | 'description' | 'assumptions' | 'actors' | 'flow'>>) => {
    if (!selectedUseCaseId) return;
    setUseCases(prev => prev.map(uc => (
      uc.id === selectedUseCaseId ? { ...uc, ...updates } : uc
    )));
  };

  const handleReviseUseCase = async (
    prompt: string,
    editableClauses: { description: boolean; assumptions: boolean; actors: boolean; useCase: boolean }
  ) => {
    if (!selectedUseCase) return;
    setError(null);
    setIsRevisingUseCase(true);
    try {
      const revised = await reviseUseCaseFromPrompt(selectedUseCase, prompt, editableClauses, settings);
      setUseCases(prev => prev.map(uc =>
        uc.id === selectedUseCase.id
          ? {
              ...uc,
              title: revised.title,
              description: editableClauses.description ? revised.description : uc.description,
              assumptions: editableClauses.assumptions ? revised.assumptions : uc.assumptions,
              actors: editableClauses.actors ? revised.actors : uc.actors,
              flow: editableClauses.useCase ? revised.flow : uc.flow,
            }
          : uc
      ));
    } catch (err: any) {
      setError(err.message || '유즈케이스 수정 중 오류가 발생했습니다.');
    } finally {
      setIsRevisingUseCase(false);
    }
  };

  const handleGenerateSequence = async (prompt: string) => {
    if (!selectedUseCase) return;
    setError(null);
    setIsGeneratingSequence(true);
    try {
      const mermaid = await generateSequenceDiagramFromPrompt(selectedUseCase, prompt, settings);
      setUseCases(prev => prev.map(uc =>
        uc.id === selectedUseCase.id ? { ...uc, mermaidDiagram: mermaid } : uc
      ));
    } catch (err: any) {
      setError(err.message || '시퀀스 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingSequence(false);
    }
  };

  const totalRequirements = useCases.reduce((sum, uc) => sum + uc.requirements.filter(r => r.selected).length, 0);
  const hasApiKey = !!settings.openaiApiKey;
  const isDetailCompact = view === 'detail' && windowWidth > 0 && windowWidth < DETAIL_LAYOUT_BREAKPOINT;
  const showLeftSidebar = !isDetailCompact || compactFocus === 'left';
  const showRightPane = !isDetailCompact || compactFocus === 'right';

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {showLeftSidebar ? (
      <div className="w-80 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              <h1 className="font-semibold tracking-tight">UseCase Builder</h1>
            </div>
            <SettingsDialog onSettingsChange={handleSettingsChange} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            AI-powered requirements engineering
          </p>
        </div>

        {/* Stats */}
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">유즈케이스</span>
            </div>
            <span className="font-medium">{useCases.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">선택된 요구사항</span>
            </div>
            <span className="font-medium">{totalRequirements}</span>
          </div>
        </div>

        {/* New Button */}
        <div className="p-4">
          <Button 
            onClick={handleNewUseCase}
            className="w-full"
            variant={view === 'chat' ? 'default' : 'outline'}
            disabled={!hasApiKey}
          >
            <Plus className="h-4 w-4 mr-2" />
            새 유즈케이스
          </Button>
          {!hasApiKey && (
            <p className="text-xs text-destructive mt-2">
              설정에서 OpenAI API 키를 입력해주세요
            </p>
          )}
        </div>

        {/* UseCase List */}
        <div className="flex-1 overflow-y-auto overflow-x-visible">
          <div className="space-y-2 px-4 pb-4 pr-6">
            {useCases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-muted-foreground">
                  아직 등록된 유즈케이스가 없습니다.
                </p>
              </div>
            ) : (
              useCases.map(useCase => (
                <UseCaseCard
                  key={useCase.id}
                  useCase={useCase}
                  isSelected={selectedUseCaseId === useCase.id}
                  onDownload={() => handleDownloadUseCase(useCase)}
                  onDelete={() => handleDeleteUseCase(useCase.id)}
                  onClick={() => {
                    setSelectedUseCaseId(useCase.id);
                    setView('detail');
                    setError(null);
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
      ) : (
        <div className="w-12 shrink-0 border-r border-border bg-card flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCompactFocus('left')}
            title="유즈케이스 목록 펼치기"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {error && (
          <Alert variant="destructive" className="m-4 mb-0">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {view === 'chat' ? (
          <ChatPanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder={hasApiKey 
              ? "어떤 시스템을 설계하고 싶으신가요? 예: 로그인 기능, 상품 주문 시스템 등" 
              : "설정 메뉴에서 OpenAI API 키를 먼저 입력해주세요"
            }
          />
        ) : selectedUseCase ? (
          <div className="flex h-full min-h-0 overflow-hidden">
            {/* UseCase Detail */}
            <div className="w-[56rem] min-w-[56rem] shrink-0 min-h-0 border-r border-border overflow-x-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setView('chat')}
                  className="text-muted-foreground"
                >
                  ← 뒤로
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <span className="text-sm text-muted-foreground">유즈케이스 상세</span>
                {isDetailCompact && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompactFocus('right')}
                      className="text-muted-foreground"
                    >
                      요구사항 보기
                    </Button>
                  </>
                )}
              </div>
              <ScrollArea className="h-full">
                <div className="p-6 max-w-3xl">
                  <UseCaseDetail
                    useCase={selectedUseCase}
                    onUpdateUseCaseContent={handleUpdateUseCaseContent}
                    onReviseUseCase={handleReviseUseCase}
                    isRevisingUseCase={isRevisingUseCase}
                    onGenerateSequence={handleGenerateSequence}
                    isGeneratingSequence={isGeneratingSequence}
                    onMermaidDiagramChange={handleUpdateMermaidDiagram}
                  />
                </div>
              </ScrollArea>
            </div>

            {/* Requirements Panel */}
            {showRightPane ? (
            <div className="w-96 min-w-96 xl:w-[28rem] xl:min-w-[28rem] 2xl:w-[32rem] 2xl:min-w-[32rem] shrink-0 min-h-0 bg-card border-l border-border">
              <div className="px-6 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">요구사항 관리</h3>
                  {isDetailCompact && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCompactFocus('left')}
                      className="text-muted-foreground"
                    >
                      목록 보기
                    </Button>
                  )}
                </div>
              </div>
              <ScrollArea className="h-full">
                <div className="p-5">
                  <RequirementsPanel
                    useCase={selectedUseCase}
                    onGenerateRequirements={handleGenerateRequirements}
                    onToggleRequirement={handleToggleRequirement}
                    onDeleteRequirement={handleDeleteRequirement}
                    isGenerating={isGeneratingReqs}
                  />
                </div>
              </ScrollArea>
            </div>
            ) : (
              <div className="w-12 shrink-0 border-l border-border bg-card flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCompactFocus('right')}
                  title="요구사항 펼치기"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">유즈케이스를 선택해 주세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
