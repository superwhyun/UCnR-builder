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
import { Plus, Layers, FileText, Check, AlertCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Settings, loadSettings } from '@/lib/settings';
import { generateUseCaseFromPrompt, generateRequirements } from '@/lib/openai';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

export default function Home() {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [selectedUseCaseId, setSelectedUseCaseId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReqs, setIsGeneratingReqs] = useState(false);
  const [view, setView] = useState<'chat' | 'detail'>('chat');
  const [settings, setSettings] = useState<Settings>({ openaiApiKey: '', model: 'gpt-5.2' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

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

  const handleNewUseCase = () => {
    setSelectedUseCaseId(null);
    setView('chat');
    setError(null);
  };

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
    setError(null);
  };

  const totalRequirements = useCases.reduce((sum, uc) => sum + uc.requirements.filter(r => r.selected).length, 0);
  const hasApiKey = !!settings.openaiApiKey;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
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
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
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
                  onClick={() => {
                    setSelectedUseCaseId(useCase.id);
                    setView('detail');
                    setError(null);
                  }}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

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
          <div className="flex h-full">
            {/* UseCase Detail */}
            <div className="flex-1 min-w-0 border-r border-border">
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
              </div>
              <ScrollArea className="h-[calc(100vh-65px)]">
                <div className="p-6 max-w-3xl">
                  <UseCaseDetail useCase={selectedUseCase} />
                </div>
              </ScrollArea>
            </div>

            {/* Requirements Panel */}
            <div className="w-96 bg-card">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="font-medium">요구사항 관리</h3>
              </div>
              <ScrollArea className="h-[calc(100vh-65px)]">
                <div className="p-5">
                  <RequirementsPanel
                    useCase={selectedUseCase}
                    onGenerateRequirements={handleGenerateRequirements}
                    onToggleRequirement={handleToggleRequirement}
                    isGenerating={isGeneratingReqs}
                  />
                </div>
              </ScrollArea>
            </div>
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
