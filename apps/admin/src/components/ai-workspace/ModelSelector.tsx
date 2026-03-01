/**
 * 🤖 ModelSelector - AI Model Selection Component
 *
 * Allows users to select from available AI models:
 * - OpenAI (GPT-4, GPT-4 Turbo, GPT-3.5)
 * - Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
 * - Google (Gemini Pro, Gemini Flash)
 * - Local models (Ollama)
 */

import React from 'react';
import { ChevronDown, Zap, Brain, Sparkles, Server, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// =============================================================================
// TYPES & CONFIG
// =============================================================================

export interface AIModel {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google' | 'local';
  description: string;
  contextWindow: number;
  maxOutput: number;
  costPer1kTokens?: number; // USD
  speed: 'fast' | 'medium' | 'slow';
  capabilities: string[];
  isDefault?: boolean;
  isBeta?: boolean;
  icon: string;
}

export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Mới nhất, đa phương thức, nhanh nhất',
    contextWindow: 128000,
    maxOutput: 16384,
    costPer1kTokens: 0.005,
    speed: 'fast',
    capabilities: ['vision', 'code', 'reasoning', 'creative'],
    isDefault: true,
    icon: '🟢',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Mạnh mẽ với vision và JSON mode',
    contextWindow: 128000,
    maxOutput: 4096,
    costPer1kTokens: 0.01,
    speed: 'medium',
    capabilities: ['vision', 'code', 'reasoning', 'json-mode'],
    icon: '🔵',
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: 'openai',
    description: 'Model chuẩn, đáng tin cậy',
    contextWindow: 8192,
    maxOutput: 4096,
    costPer1kTokens: 0.03,
    speed: 'slow',
    capabilities: ['code', 'reasoning'],
    icon: '⚫',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Nhanh, tiết kiệm chi phí',
    contextWindow: 16385,
    maxOutput: 4096,
    costPer1kTokens: 0.0005,
    speed: 'fast',
    capabilities: ['code', 'chat'],
    icon: '⚪',
  },

  // Anthropic Models
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Tốt nhất cho code & reasoning',
    contextWindow: 200000,
    maxOutput: 8192,
    costPer1kTokens: 0.003,
    speed: 'fast',
    capabilities: ['vision', 'code', 'reasoning', 'creative', 'artifacts'],
    icon: '🟠',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Mạnh nhất, phức tạp nhất',
    contextWindow: 200000,
    maxOutput: 4096,
    costPer1kTokens: 0.015,
    speed: 'slow',
    capabilities: ['vision', 'code', 'reasoning', 'creative'],
    icon: '🟣',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    description: 'Nhanh nhất, chi phí thấp',
    contextWindow: 200000,
    maxOutput: 4096,
    costPer1kTokens: 0.00025,
    speed: 'fast',
    capabilities: ['code', 'chat'],
    icon: '🔴',
  },

  // Google Models
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Context window khổng lồ 1M tokens',
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kTokens: 0.00125,
    speed: 'medium',
    capabilities: ['vision', 'code', 'reasoning', 'long-context'],
    icon: '💎',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Nhanh, rẻ, đa năng',
    contextWindow: 1000000,
    maxOutput: 8192,
    costPer1kTokens: 0.000075,
    speed: 'fast',
    capabilities: ['vision', 'code', 'chat'],
    icon: '⚡',
  },

  // Local Models
  {
    id: 'ollama/llama3.2',
    name: 'Llama 3.2 (Local)',
    provider: 'local',
    description: 'Chạy offline, miễn phí',
    contextWindow: 128000,
    maxOutput: 4096,
    speed: 'medium',
    capabilities: ['code', 'chat', 'offline'],
    icon: '🦙',
  },
  {
    id: 'ollama/codellama',
    name: 'CodeLlama (Local)',
    provider: 'local',
    description: 'Chuyên về code, offline',
    contextWindow: 16000,
    maxOutput: 4096,
    speed: 'medium',
    capabilities: ['code', 'offline'],
    icon: '💻',
  },
];

// Provider icons & colors
const PROVIDER_CONFIG = {
  openai: {
    name: 'OpenAI',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  anthropic: {
    name: 'Anthropic',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  google: {
    name: 'Google',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  local: {
    name: 'Local',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
};

// Speed icons
const SPEED_CONFIG = {
  fast: { icon: Zap, label: 'Nhanh', color: 'text-green-500' },
  medium: { icon: Brain, label: 'Trung bình', color: 'text-yellow-500' },
  slow: { icon: Server, label: 'Chậm', color: 'text-red-500' },
};

// =============================================================================
// COMPONENT
// =============================================================================

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  compact?: boolean;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  compact = false,
  className,
}: Readonly<ModelSelectorProps>) {
  const model = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];
  const providerConfig = PROVIDER_CONFIG[model.provider];
  const SpeedIcon = SPEED_CONFIG[model.speed].icon;

  // Group models by provider
  const groupedModels = AI_MODELS.reduce(
    (acc, m) => {
      if (!acc[m.provider]) acc[m.provider] = [];
      acc[m.provider].push(m);
      return acc;
    },
    {} as Record<string, AIModel[]>
  );

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className={cn('gap-1.5 h-8', className)}>
                  <span>{model.icon}</span>
                  <span className="text-xs font-medium hidden sm:inline">{model.name}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                {Object.entries(groupedModels).map(([provider, models]) => (
                  <React.Fragment key={provider}>
                    <DropdownMenuLabel
                      className={cn(
                        'text-xs',
                        PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG].color
                      )}
                    >
                      {PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG].name}
                    </DropdownMenuLabel>
                    {models.map((m) => (
                      <DropdownMenuItem
                        key={m.id}
                        onClick={() => onModelChange(m.id)}
                        className="gap-3"
                      >
                        <span className="text-lg">{m.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{m.name}</span>
                            {m.isDefault && (
                              <Badge variant="secondary" className="text-[10px] px-1 py-0">
                                Default
                              </Badge>
                            )}
                            {m.isBeta && (
                              <Badge
                                variant="outline"
                                className="text-[10px] px-1 py-0 text-yellow-500"
                              >
                                Beta
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {m.description}
                          </div>
                        </div>
                        {m.id === selectedModel && (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                  </React.Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">
              <div className="font-medium">{model.name}</div>
              <div className="text-muted-foreground">{model.description}</div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-3 justify-start h-auto py-2 px-3', providerConfig.bgColor, className)}
        >
          <span className="text-2xl">{model.icon}</span>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{model.name}</span>
              <SpeedIcon className={cn('h-3.5 w-3.5', SPEED_CONFIG[model.speed].color)} />
            </div>
            <div className="text-xs text-muted-foreground">
              {(model.contextWindow / 1000).toFixed(0)}K context • {model.provider}
            </div>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        {Object.entries(groupedModels).map(([provider, models]) => (
          <React.Fragment key={provider}>
            <DropdownMenuLabel
              className={cn(
                'flex items-center gap-2',
                PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG].color
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              {PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG].name}
            </DropdownMenuLabel>

            {models.map((m) => {
              const MSpeedIcon = SPEED_CONFIG[m.speed].icon;
              return (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => onModelChange(m.id)}
                  className="gap-3 py-2"
                >
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      <MSpeedIcon className={cn('h-3 w-3', SPEED_CONFIG[m.speed].color)} />
                      {m.isDefault && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Mặc định
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span>{(m.contextWindow / 1000).toFixed(0)}K ctx</span>
                      <span>•</span>
                      <span>{m.maxOutput.toLocaleString()} max</span>
                      {m.costPer1kTokens && (
                        <>
                          <span>•</span>
                          <span>${m.costPer1kTokens}/1K</span>
                        </>
                      )}
                    </div>
                  </div>
                  {m.id === selectedModel && (
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ModelSelector;
