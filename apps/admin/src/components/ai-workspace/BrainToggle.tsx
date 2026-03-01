/**
 * 🧠 Brain Toggle Component
 *
 * Toggle to enable/disable Brain RAG context injection
 * Shows sources when RAG is applied
 */

import { Brain, Sparkles, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BrainSource {
  title: string;
  domain: string;
  relevance: number;
}

interface BrainToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  sources?: BrainSource[];
  ragApplied?: boolean;
  ragReason?: string;
  compact?: boolean;
}

export function BrainToggle({
  enabled,
  onToggle,
  sources = [],
  ragApplied = false,
  ragReason,
  compact = false,
}: BrainToggleProps) {
  const getReasonText = (reason?: string) => {
    switch (reason) {
      case 'disabled':
        return 'Brain tắt';
      case 'no_keywords':
        return 'Không match keywords';
      case 'low_relevance':
        return 'Không tìm thấy context phù hợp';
      case 'below_threshold':
        return 'Relevance quá thấp';
      case 'success':
        return 'Context đã được inject';
      default:
        return '';
    }
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <Switch checked={enabled} onCheckedChange={onToggle} className="scale-75" />
              <Brain
                className={`h-4 w-4 ${enabled ? 'text-emerald-500' : 'text-muted-foreground'}`}
              />
              {ragApplied && <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Brain Context: {enabled ? 'ON' : 'OFF'}</p>
            {ragReason && (
              <p className="text-xs text-muted-foreground">{getReasonText(ragReason)}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={onToggle} id="brain-toggle" />
        <Label htmlFor="brain-toggle" className="flex items-center gap-2 cursor-pointer">
          <Brain className={`h-4 w-4 ${enabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
          <span>Brain Context</span>
        </Label>

        {enabled && (
          <Badge variant="secondary" className="text-xs">
            Smart Mode
          </Badge>
        )}

        {ragApplied && (
          <Badge variant="default" className="text-xs bg-emerald-500">
            <Sparkles className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium">Smart Brain RAG</p>
              <p className="text-xs text-muted-foreground mt-1">
                Khi bật, AI sẽ tự động inject kiến thức từ Brain khi câu hỏi liên quan đến projects
                của bạn.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Show reason */}
      {ragReason && ragReason !== 'success' && enabled && (
        <p className="text-xs text-muted-foreground ml-10">{getReasonText(ragReason)}</p>
      )}

      {/* Show sources when RAG applied */}
      {ragApplied && sources.length > 0 && (
        <div className="ml-10 mt-1 p-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
          <p className="text-xs font-medium text-emerald-600 mb-1">📎 Sources được sử dụng:</p>
          <div className="flex flex-wrap gap-1">
            {sources.map((source, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-background">
                {source.title} ({source.relevance}%)
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default BrainToggle;
