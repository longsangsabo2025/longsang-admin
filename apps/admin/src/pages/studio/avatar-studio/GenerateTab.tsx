/**
 * Generate Tab - Content generation controls and template picker
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Video,
  Image as ImageIcon,
  Wand2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import type { ContentTemplate } from './types';
import { CONTENT_TEMPLATES, PLATFORM_CONFIGS, GENERATION_STYLES } from './constants';

interface GenerateTabProps {
  selectedTemplate: ContentTemplate | null;
  customScript: string;
  selectedStyle: string;
  selectedPlatform: 'tiktok' | 'instagram' | 'facebook' | 'youtube';
  generationProgress: number;
  isGenerating: boolean;
  ownerPortraitCount: number;
  onSelectTemplate: (template: ContentTemplate) => void;
  onSetCustomScript: (script: string) => void;
  onSetSelectedStyle: (style: string) => void;
  onSetSelectedPlatform: (platform: 'tiktok' | 'instagram' | 'facebook' | 'youtube') => void;
  onGenerate: (type: 'image' | 'video') => void;
}

export function GenerateTab({
  selectedTemplate,
  customScript,
  selectedStyle,
  selectedPlatform,
  generationProgress,
  isGenerating,
  ownerPortraitCount,
  onSelectTemplate,
  onSetCustomScript,
  onSetSelectedStyle,
  onSetSelectedPlatform,
  onGenerate,
}: GenerateTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Content Templates */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {CONTENT_TEMPLATES.map(template => (
                <button
                  type="button"
                  key={template.id}
                  className={`w-full text-left p-3 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 hover:bg-muted'
                  }`}
                  onClick={() => {
                    onSelectTemplate(template);
                    onSetCustomScript(template.script);
                  }}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {template.duration}s • {PLATFORM_CONFIGS[template.platform as keyof typeof PLATFORM_CONFIGS]?.icon || '🌐'} {template.platform}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Generation Settings */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Generate Avatar Content
          </CardTitle>
          <CardDescription>
            Create AI-generated content with your avatar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Script */}
          <div className="space-y-2">
            <Label>Script / Content</Label>
            <Textarea
              value={customScript}
              onChange={(e) => onSetCustomScript(e.target.value)}
              placeholder="Enter what the avatar should say/present..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Style */}
            <div className="space-y-2">
              <Label>Visual Style</Label>
              <Select value={selectedStyle} onValueChange={onSetSelectedStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENERATION_STYLES.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label>Target Platform</Label>
              <Select
                value={selectedPlatform}
                onValueChange={(v) => onSetSelectedPlatform(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">📱 TikTok (9:16)</SelectItem>
                  <SelectItem value="instagram">📸 Instagram (9:16)</SelectItem>
                  <SelectItem value="facebook">📘 Facebook (16:9)</SelectItem>
                  <SelectItem value="youtube">🎬 YouTube (16:9)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Generating...</span>
                <span>{generationProgress}%</span>
              </div>
              <Progress value={generationProgress} />
            </div>
          )}

          {/* Generate Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              className="flex-1"
              onClick={() => onGenerate('image')}
              disabled={isGenerating || ownerPortraitCount === 0}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ImageIcon className="h-4 w-4 mr-2" />
              )}
              Generate Image
            </Button>
            <Button
              className="flex-1"
              variant="secondary"
              onClick={() => onGenerate('video')}
              disabled={isGenerating || ownerPortraitCount === 0}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Generate Video
            </Button>
          </div>

          {ownerPortraitCount === 0 && (
            <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Please upload owner portraits first
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
