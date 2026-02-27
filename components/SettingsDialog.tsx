'use client';

import { useState, useEffect } from 'react';
import { Settings, loadSettings, saveSettings } from '@/lib/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Settings2, Eye, EyeOff, Check } from 'lucide-react';

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
  const [settings, setSettings] = useState<Settings>({ openaiApiKey: '', model: 'gpt-5.2' });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(loadSettings());
      setSaved(false);
    }
  }, [open]);

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    onSettingsChange?.(settings);
    setTimeout(() => {
      setOpen(false);
      setSaved(false);
    }, 500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            설정
          </DialogTitle>
          <DialogDescription>
            OpenAI API 설정을 구성합니다. 모든 설정은 브라우저에 로컬로 저장됩니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
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
        </div>

        <div className="flex justify-end">
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
