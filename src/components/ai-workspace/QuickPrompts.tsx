/**
 * QuickPrompts Component
 * Display prompt templates for quick access
 */

import { useState, useMemo } from 'react';
import { AssistantType } from '@/hooks/useAssistant';
import { getPromptsForAssistant, getPromptsByCategory, searchPrompts, PromptTemplate } from '@/data/ai-workspace-prompts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Search,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickPromptsProps {
  assistantType: AssistantType;
  onPromptSelect: (prompt: string) => void;
  className?: string;
}

export function QuickPrompts({ assistantType, onPromptSelect, className }: QuickPromptsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'common' | 'advanced' | 'examples'>('common');

  const prompts = useMemo(() => {
    if (searchQuery.trim()) {
      return searchPrompts(assistantType, searchQuery);
    }
    return getPromptsByCategory(assistantType, activeCategory);
  }, [assistantType, activeCategory, searchQuery]);

  const handlePromptClick = (prompt: string) => {
    onPromptSelect(prompt);
    // Optionally collapse after selection
    // setIsExpanded(false);
  };

  const allPrompts = getPromptsForAssistant(assistantType);
  const hasPrompts = allPrompts.length > 0;

  if (!hasPrompts) {
    return null;
  }

  return (
    <div className={cn('border-b bg-muted/30', className)}>
      <Button
        variant="ghost"
        className="w-full justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">Quick Prompts</span>
          <Badge variant="secondary" className="text-xs">
            {allPrompts.length}
          </Badge>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {isExpanded && (
        <div className="p-4 space-y-4 border-t">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Categories */}
          {!searchQuery && (
            <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="common">Common</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Prompts List */}
          <ScrollArea className="h-[200px]">
            {prompts.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Không tìm thấy prompts
              </div>
            ) : (
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <Button
                    key={prompt.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto p-3"
                    onClick={() => handlePromptClick(prompt.prompt)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap className="h-3 w-3 text-primary" />
                        <span className="font-medium text-sm">{prompt.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {prompt.prompt}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

