/**
 * 🧠 Smart Prompt Analyzer Component
 * 
 * Analyzes natural language prompts and builds generation context
 * from Brain Image Library. This is THE MAGIC feature!
 * 
 * Example: "Tạo ảnh tôi đang chơi bida trong quán SABO với bạn nữ"
 * → Finds: owner portrait, SABO interior, billiard table refs
 * → Builds enhanced prompt with consistent characters
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback, useEffect } from 'react';
import {
  useBuildContext,
  useAnalyzePrompt,
  useCharacters,
  useLocations,
} from '@/brain/hooks/useImageMemory';
import type {
  GenerationContext,
  PromptAnalysis,
  ImageMemoryItem,
  CharacterProfile,
  LocationProfile,
} from '@/brain/types/image-memory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import {
  Brain,
  Sparkles,
  Search,
  User,
  MapPin,
  Palette,
  Image as ImageIcon,
  Loader2,
  Wand2,
  ArrowRight,
  Check,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  RefreshCw,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// =============================================================================
// CONTEXT VISUALIZATION
// =============================================================================

interface ReferenceImageProps {
  image: ImageMemoryItem;
  weight: number;
  type: 'character' | 'location' | 'style' | 'object';
}

function ReferenceImage({ image, weight, type }: ReferenceImageProps) {
  const typeConfig = {
    character: { icon: User, color: 'border-blue-500', label: 'Nhân vật' },
    location: { icon: MapPin, color: 'border-green-500', label: 'Địa điểm' },
    style: { icon: Palette, color: 'border-purple-500', label: 'Style' },
    object: { icon: ImageIcon, color: 'border-yellow-500', label: 'Đối tượng' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          'relative w-20 h-20 rounded-lg overflow-hidden border-2 cursor-pointer',
          config.color
        )}>
          <img
            src={image.thumbnailUrl || image.imageUrl}
            alt={image.analysis.title}
            className="w-full h-full object-cover"
          />
          {/* Weight indicator */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
            {Math.round(weight * 100)}%
          </div>
          {/* Type icon */}
          <div className={cn(
            'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
            type === 'character' && 'bg-blue-500',
            type === 'location' && 'bg-green-500',
            type === 'style' && 'bg-purple-500',
            type === 'object' && 'bg-yellow-500',
          )}>
            <Icon className="w-3 h-3 text-white" />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{image.analysis.title}</p>
        <p className="text-xs text-muted-foreground">{config.label} • Weight: {Math.round(weight * 100)}%</p>
      </TooltipContent>
    </Tooltip>
  );
}

// =============================================================================
// PROMPT ENTITY TAG
// =============================================================================

interface EntityTagProps {
  entity: string;
  type: 'character' | 'location' | 'action' | 'object' | 'style' | 'mood';
  matched?: boolean;
}

function EntityTag({ entity, type, matched }: EntityTagProps) {
  const typeConfig = {
    character: { icon: User, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    location: { icon: MapPin, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    action: { icon: Zap, color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    object: { icon: ImageIcon, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    style: { icon: Palette, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    mood: { icon: Sparkles, color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200' },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <Badge className={cn('text-xs', config.color)}>
      <Icon className="w-3 h-3 mr-1" />
      {entity}
      {matched && <Check className="w-3 h-3 ml-1 text-green-600" />}
    </Badge>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface SmartPromptAnalyzerProps {
  onContextReady?: (context: GenerationContext) => void;
  onEnhancedPromptReady?: (prompt: string, referenceImages: { url: string; weight: number }[]) => void;
  className?: string;
}

export function SmartPromptAnalyzer({
  onContextReady,
  onEnhancedPromptReady,
  className,
}: SmartPromptAnalyzerProps) {
  // Hooks
  const buildContext = useBuildContext();
  const analyzePrompt = useAnalyzePrompt();
  const { data: charactersData } = useCharacters();
  const { data: locationsData } = useLocations();

  const characters = charactersData?.data || [];
  const locations = locationsData?.data || [];

  // State
  const [prompt, setPrompt] = useState('');
  const [includeOwner, setIncludeOwner] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [context, setContext] = useState<GenerationContext | null>(null);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);

  // Build context when prompt is analyzed
  const handleAnalyze = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt');
      return;
    }

    // First analyze the prompt
    analyzePrompt.mutate(prompt, {
      onSuccess: (result) => {
        if (result.success && result.analysis) {
          setAnalysis(result.analysis);
        }
      },
    });

    // Then build the context
    buildContext.mutate(
      { prompt, includeOwnerPortrait: includeOwner },
      {
        onSuccess: (result) => {
          if (result.success && result.context) {
            setContext(result.context);
            onContextReady?.(result.context);
          }
        },
      }
    );
  }, [prompt, includeOwner, analyzePrompt, buildContext, onContextReady]);

  // Use enhanced prompt
  const handleUseContext = useCallback(() => {
    if (context) {
      const refs = context.referenceImages.map((ref) => ({
        url: ref.url,
        weight: ref.weight,
      }));
      onEnhancedPromptReady?.(context.enhancedPrompt, refs);
      toast.success('Đã áp dụng context từ Brain! 🧠');
    }
  }, [context, onEnhancedPromptReady]);

  // Copy enhanced prompt
  const handleCopyPrompt = useCallback(() => {
    if (context) {
      navigator.clipboard.writeText(context.enhancedPrompt);
      toast.success('Đã copy prompt!');
    }
  }, [context]);

  // Render
  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          Smart Prompt Analyzer
        </CardTitle>
        <CardDescription className="text-xs">
          Nhập prompt tự nhiên, Brain sẽ tìm ảnh tham chiếu phù hợp và tạo prompt nâng cao
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Input */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ví dụ: Tạo ảnh tôi đang chơi bida trong quán SABO với một bạn nữ xinh đẹp..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="resize-none"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="include-owner"
                checked={includeOwner}
                onCheckedChange={setIncludeOwner}
              />
              <Label htmlFor="include-owner" className="text-xs">
                Tự động thêm ảnh chân dung Owner
              </Label>
            </div>

            <Button onClick={handleAnalyze} disabled={buildContext.isPending || analyzePrompt.isPending}>
              {buildContext.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Phân tích
            </Button>
          </div>
        </div>

        {/* Quick Profile Selection */}
        {(characters.length > 0 || locations.length > 0) && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Target className="w-3 h-3" />
              Quick Select (click để thêm vào prompt)
            </Label>
            <div className="flex flex-wrap gap-1">
              {characters.slice(0, 3).map((char) => (
                <Badge
                  key={char.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                  onClick={() => setPrompt((p) => p + ` ${char.name}`)}
                >
                  <User className="w-3 h-3 mr-1" />
                  {char.name}
                </Badge>
              ))}
              {locations.slice(0, 3).map((loc) => (
                <Badge
                  key={loc.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-green-100 dark:hover:bg-green-900"
                  onClick={() => setPrompt((p) => p + ` tại ${loc.name}`)}
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {loc.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Result */}
        {analysis && (
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Search className="w-3 h-3" />
              Entities được phát hiện
            </Label>
            <div className="flex flex-wrap gap-1">
              {analysis.entities.characters.map((char, idx) => (
                <EntityTag
                  key={idx}
                  entity={char}
                  type="character"
                  matched={analysis.matchedCharacters.some((m) => m.confidence > 0.5)}
                />
              ))}
              {analysis.entities.locations.map((loc, idx) => (
                <EntityTag
                  key={idx}
                  entity={loc}
                  type="location"
                  matched={analysis.matchedLocations.some((m) => m.confidence > 0.5)}
                />
              ))}
              {analysis.entities.actions.map((action, idx) => (
                <EntityTag key={idx} entity={action} type="action" />
              ))}
              {analysis.entities.objects.map((obj, idx) => (
                <EntityTag key={idx} entity={obj} type="object" />
              ))}
            </div>
          </div>
        )}

        {/* Context Result */}
        {context && (
          <div className="space-y-4">
            {/* Reference Images */}
            {context.referenceImages.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Ảnh tham chiếu từ Brain ({context.referenceImages.length})
                </Label>
                <div className="flex gap-2 flex-wrap">
                  {context.characterReferences.map((img, idx) => (
                    <ReferenceImage
                      key={`char-${idx}`}
                      image={img}
                      weight={0.8}
                      type="character"
                    />
                  ))}
                  {context.locationReferences.map((img, idx) => (
                    <ReferenceImage
                      key={`loc-${idx}`}
                      image={img}
                      weight={0.6}
                      type="location"
                    />
                  ))}
                  {context.styleReferences.map((img, idx) => (
                    <ReferenceImage
                      key={`style-${idx}`}
                      image={img}
                      weight={0.4}
                      type="style"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Enhanced Prompt */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Prompt nâng cao
              </Label>
              <div className="relative">
                <Textarea
                  value={context.enhancedPrompt}
                  readOnly
                  rows={4}
                  className="resize-none pr-10 bg-muted/30"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCopyPrompt}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Confidence */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  context.contextConfidence > 0.7 ? 'bg-green-500' :
                  context.contextConfidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                )} />
                <span className="text-muted-foreground">
                  Confidence: {Math.round(context.contextConfidence * 100)}%
                </span>
              </div>
              {context.suggestions && context.suggestions.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      <Info className="w-3 h-3 mr-1" />
                      {context.suggestions.length} gợi ý
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <ul className="text-xs space-y-1">
                      {context.suggestions.map((s, idx) => (
                        <li key={idx}>• {s}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleUseContext} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Sử dụng Context này
              </Button>
              <Button variant="outline" onClick={() => {
                setContext(null);
                setAnalysis(null);
              }}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* No Context Message */}
        {!context && !buildContext.isPending && prompt.length > 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nhấn "Phân tích" để Brain tìm ảnh tham chiếu phù hợp</p>
          </div>
        )}

        {/* Advanced Options */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-xs"
        >
          {showAdvanced ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              Ẩn tùy chọn nâng cao
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              Tùy chọn nâng cao
            </>
          )}
        </Button>

        {showAdvanced && (
          <div className="space-y-3 p-3 border rounded-lg">
            <div className="space-y-2">
              <Label className="text-xs">Số ảnh tham chiếu tối đa</Label>
              <Input type="number" defaultValue={5} min={1} max={10} className="h-8" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Style ưu tiên</Label>
              <Input placeholder="photorealistic, anime, cartoon..." className="h-8" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="auto-negative" defaultChecked />
              <Label htmlFor="auto-negative" className="text-xs">
                Tự động tạo negative prompt
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// COMPACT VERSION FOR EMBEDDING
// =============================================================================

interface CompactPromptAnalyzerProps {
  onContextReady?: (context: GenerationContext) => void;
  className?: string;
}

export function CompactPromptAnalyzer({ onContextReady, className }: CompactPromptAnalyzerProps) {
  const buildContext = useBuildContext();
  const [prompt, setPrompt] = useState('');

  const handleAnalyze = useCallback(() => {
    if (!prompt.trim()) return;
    
    buildContext.mutate(
      { prompt, includeOwnerPortrait: true },
      {
        onSuccess: (result) => {
          if (result.success && result.context) {
            onContextReady?.(result.context);
          }
        },
      }
    );
  }, [prompt, buildContext, onContextReady]);

  return (
    <div className={cn('flex gap-2', className)}>
      <div className="relative flex-1">
        <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
        <Input
          placeholder="Mô tả ảnh cần tạo... (Brain sẽ tìm references)"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          className="pl-9"
        />
      </div>
      <Button onClick={handleAnalyze} disabled={buildContext.isPending}>
        {buildContext.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wand2 className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
