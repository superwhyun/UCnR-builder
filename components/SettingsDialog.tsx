'use client';

import { useState } from 'react';
import { Settings, getDefaultSettings, loadSettings, restoreDefaultSettings, saveSettings } from '@/lib/settings';
import {
  DEFAULT_REQUIREMENTS_SYSTEM_PROMPT,
  DEFAULT_SEQUENCE_SYSTEM_PROMPT,
  DEFAULT_USECASE_SYSTEM_PROMPT,
} from '@/lib/default-system-prompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings2, Eye, EyeOff, Check, RotateCcw } from 'lucide-react';

const AVAILABLE_MODELS = [
  { value: 'gpt-5.2', label: 'GPT-5.2' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'o1', label: 'o1' },
  { value: 'o3-mini', label: 'o3-mini' },
];

interface SettingsDialogProps {
  onSettingsChange?: (settings: Settings) => void;
}

export function SettingsDialog({ onSettingsChange }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(getDefaultSettings());
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSettings(loadSettings());
      setSaved(false);
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    onSettingsChange?.(settings);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 500);
  };

  const handleRestoreDefaults = () => {
    const defaults = restoreDefaultSettings();
    setSettings(defaults);
    setSaved(false);
    onSettingsChange?.(defaults);
  };

  const resetPromptToDefault = (key: 'useCaseSystemPrompt' | 'sequenceSystemPrompt' | 'requirementsSystemPrompt') => {
    const defaults: Record<typeof key, string> = {
      useCaseSystemPrompt: DEFAULT_USECASE_SYSTEM_PROMPT,
      sequenceSystemPrompt: DEFAULT_SEQUENCE_SYSTEM_PROMPT,
      requirementsSystemPrompt: DEFAULT_REQUIREMENTS_SYSTEM_PROMPT,
    };
    setSettings((prev) => ({ ...prev, [key]: defaults[key] }));
    setSaved(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-5xl max-h-[calc(100vh-1.5rem)] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            설정
          </DialogTitle>
          <DialogDescription>
            OpenAI API 설정을 구성합니다. 모든 설정은 브라우저에 로컬로 저장됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-6 overflow-y-auto">
          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">OpenAI API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={settings.openaiApiKey}
                onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                className="pr-10 font-mono text-sm"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API 키는 브라우저의 localStorage에만 저장되며 서버로 전송되지 않습니다.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>모델</Label>
            <Select
              value={settings.model}
              onValueChange={(value) => setSettings({ ...settings, model: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="모델을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="usecase-system-prompt">유즈케이스 시스템 프롬프트</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetPromptToDefault('useCaseSystemPrompt')}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                이 항목 기본값
              </Button>
            </div>
            <Textarea
              id="usecase-system-prompt"
              value={settings.useCaseSystemPrompt}
              onChange={(e) => setSettings({ ...settings, useCaseSystemPrompt: e.target.value })}
              placeholder="유즈케이스 생성 시 먼저 적용할 시스템 지시사항을 입력하세요."
              className="min-h-24 max-h-64 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              실제 호출에는 이 값만 적용됩니다. 비워두면 코드의 기본(default) 프롬프트가 자동 적용됩니다.
            </p>
            <details className="rounded-md border bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                기본(default) 유즈케이스 프롬프트 보기
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs font-mono">{DEFAULT_USECASE_SYSTEM_PROMPT}</pre>
            </details>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="sequence-system-prompt">시퀀스 다이어그램 시스템 프롬프트</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetPromptToDefault('sequenceSystemPrompt')}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                이 항목 기본값
              </Button>
            </div>
            <Textarea
              id="sequence-system-prompt"
              value={settings.sequenceSystemPrompt}
              onChange={(e) => setSettings({ ...settings, sequenceSystemPrompt: e.target.value })}
              placeholder="시퀀스 다이어그램 생성 시 먼저 적용할 시스템 지시사항을 입력하세요."
              className="min-h-24 max-h-64 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              실제 호출에는 이 값만 적용됩니다. 비워두면 코드의 기본(default) 프롬프트가 자동 적용됩니다.
            </p>
            <details className="rounded-md border bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                기본(default) 시퀀스 프롬프트 보기
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs font-mono">{DEFAULT_SEQUENCE_SYSTEM_PROMPT}</pre>
            </details>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="requirements-system-prompt">요구사항 시스템 프롬프트</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => resetPromptToDefault('requirementsSystemPrompt')}
              >
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                이 항목 기본값
              </Button>
            </div>
            <Textarea
              id="requirements-system-prompt"
              value={settings.requirementsSystemPrompt}
              onChange={(e) => setSettings({ ...settings, requirementsSystemPrompt: e.target.value })}
              placeholder="요구사항 생성 시 먼저 적용할 시스템 지시사항을 입력하세요."
              className="min-h-24 max-h-64 resize-y"
            />
            <p className="text-xs text-muted-foreground">
              실제 호출에는 이 값만 적용됩니다. 비워두면 코드의 기본(default) 프롬프트가 자동 적용됩니다.
            </p>
            <details className="rounded-md border bg-muted/30 px-3 py-2">
              <summary className="cursor-pointer text-xs text-muted-foreground">
                기본(default) 요구사항 프롬프트 보기
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs font-mono">{DEFAULT_REQUIREMENTS_SYSTEM_PROMPT}</pre>
            </details>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-background">
          <Button variant="outline" onClick={handleRestoreDefaults}>
            기본값 복원
          </Button>
          <Button onClick={handleSave} disabled={!settings.openaiApiKey.trim()}>
            {saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                저장됨
              </>
            ) : (
              '저장'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
