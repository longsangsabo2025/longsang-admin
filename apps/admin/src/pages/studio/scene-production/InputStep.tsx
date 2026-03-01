/**
 * 📝 InputStep Component
 * Step 1: Input script for scene production
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Loader2, 
  Wand2, 
  Clapperboard, 
  Settings2, 
  RefreshCw,
  Maximize2,
  Film,
  ListVideo,
} from 'lucide-react';
import type { EpisodeData, Scene } from './types';
import { AI_MODELS, DEFAULT_SCENE_PROMPT } from './types';
import { renderContent } from './helpers';
import { useSeries } from './useSeries';

interface InputStepProps {
  episode: EpisodeData | null;
  aiModel: string;
  scenePrompt: string;
  onAiModelChange: (model: string) => void;
  onScenePromptChange: (prompt: string) => void;
  onScenesGenerated: (scenes: Scene[]) => void;
  onShowPromptDialog: () => void;
  onEpisodeChange?: (episode: EpisodeData | null) => void;
}

export function InputStep({
  episode,
  aiModel,
  scenePrompt,
  onAiModelChange,
  onScenePromptChange,
  onScenesGenerated,
  onShowPromptDialog,
  onEpisodeChange,
}: Readonly<InputStepProps>) {
  const [manualScript, setManualScript] = useState('');
  const [manualDuration, setManualDuration] = useState(30);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Series & Episode selection
  const { seriesList, isLoading: isLoadingSeries, refetch: refetchSeries } = useSeries();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>('');
  
  // DEBUG LOG
  console.log('🎬 InputStep - seriesList:', seriesList.length, 'isLoadingSeries:', isLoadingSeries);
  
  // Get selected series episodes
  const selectedSeries = seriesList.find(s => s.id === selectedSeriesId);
  const seriesEpisodes = selectedSeries?.episodes || [];
  
  // Handle series change
  const handleSeriesChange = (seriesId: string) => {
    setSelectedSeriesId(seriesId);
    setSelectedEpisodeId(''); // Reset episode when series changes
    if (onEpisodeChange) {
      onEpisodeChange(null);
    }
  };
  
  // Handle episode selection
  const handleEpisodeChange = (episodeId: string) => {
    setSelectedEpisodeId(episodeId);
    
    if (!selectedSeries) return;
    
    const selectedEp = seriesEpisodes.find(e => e.id === episodeId);
    if (selectedEp && onEpisodeChange) {
      // Convert to EpisodeData format
      const episodeData: EpisodeData = {
        id: selectedEp.id,
        title: selectedEp.title,
        duration: selectedEp.duration,
        script: {
          hook: selectedEp.hook || '',
          story: selectedEp.story || '',
          punchline: selectedEp.punchline || '',
          cta: selectedEp.cta || '',
          visualNotes: selectedEp.visualNotes || '',
        },
        seriesId: selectedSeries.id,
        seriesTitle: selectedSeries.title,
        number: selectedEp.number,
      };
      onEpisodeChange(episodeData);
    }
  };
  
  // Helper function for episode placeholder
  const getEpisodePlaceholder = () => {
    if (!selectedSeriesId) {
      return "Chọn series trước";
    }
    if (seriesEpisodes.length === 0) {
      return "Không có episode";
    }
    return "Chọn episode...";
  };
  
  // Sync selected series/episode when episode prop changes
  useEffect(() => {
    if (episode?.seriesId && episode.seriesId !== selectedSeriesId) {
      setSelectedSeriesId(episode.seriesId);
    }
    if (episode?.id && episode.id !== selectedEpisodeId) {
      setSelectedEpisodeId(episode.id);
    }
  }, [episode?.seriesId, episode?.id]);

  const analyzeScript = async () => {
    const scriptText = episode?.script 
      ? `Hook: ${renderContent(episode.script.hook)}\n\nStory: ${renderContent(episode.script.story)}\n\nPunchline: ${renderContent(episode.script.punchline)}\n\nCTA: ${renderContent(episode.script.cta)}\n\nVisual Notes: ${renderContent(episode.script.visualNotes)}`
      : manualScript;
    
    if (!scriptText.trim()) {
      toast.error('Vui lòng nhập kịch bản');
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const targetDuration = episode?.duration || manualDuration;
      
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Script cần phân tích:\n\n${scriptText}\n\nTổng thời lượng mong muốn: ${targetDuration} giây\nChia thành khoảng ${Math.ceil(targetDuration / 7)} scenes (mỗi scene ~6-8s cho VEO 3.1)`,
          systemPrompt: scenePrompt,
          model: aiModel,
          temperature: 0.7,
          maxTokens: 3000,
        }),
      });
      
      const data = await response.json();
      
      if (data.enhancedPrompt) {
        const jsonMatch = data.enhancedPrompt.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          const newScenes: Scene[] = (parsed.scenes || []).map((s: {
            number?: number;
            duration?: number;
            description?: string;
            dialogue?: string;
            visualPrompt?: string;
            videoPrompt?: string;
            cameraMovement?: string;
            mood?: string;
          }, idx: number) => {
            // 🎬 Tạo Video Prompt thông minh với DIALOGUE cho VEO 3.1 (hỗ trợ audio!)
            let videoPrompt = s.videoPrompt;
            
            if (!videoPrompt || videoPrompt === s.visualPrompt) {
              // Fallback: Tạo video prompt dựa trên description, dialogue và camera
              const cameraAction = s.cameraMovement || 'Static';
              const mood = s.mood || 'Cinematic';
              
              // 🎙️ VEO 3.1 hỗ trợ tạo giọng nói thật từ dialogue!
              const voicePart = s.dialogue 
                ? `[VOICE] Vietnamese person speaks naturally: "${s.dialogue}" with confident, engaging tone` 
                : '';
              
              const soundPart = '[SOUND] Ambient background sounds matching the scene';
              
              videoPrompt = `[CAMERA] ${cameraAction} camera movement, smooth and cinematic | [ACTION] ${s.description || 'Subject moves dynamically'} | ${voicePart} | ${soundPart} | [MOOD] ${mood} atmosphere | [DURATION] ${s.duration || 6} seconds continuous action`;
            }
            
            return {
              id: `scene-${Date.now()}-${idx}`,
              number: s.number || idx + 1,
              duration: Math.min(s.duration || 6, 8),
              description: s.description || '',
              dialogue: s.dialogue || '',
              visualPrompt: s.visualPrompt || '',
              videoPrompt: videoPrompt,
              cameraMovement: s.cameraMovement || 'Static - Cố định',
              mood: s.mood || 'Energetic - Năng động',
              referenceImageIds: [],
              status: 'pending' as const,
            };
          });
          
          if (newScenes.length === 0) {
            throw new Error('Không có scenes nào được tạo');
          }
          
          onScenesGenerated(newScenes);
          toast.success(`✨ Đã phân tích thành ${newScenes.length} scenes`);
        } else {
          throw new Error('Không thể parse JSON từ AI response');
        }
      }
    } catch (e) {
      console.error('Analyze error:', e);
      toast.error('Lỗi phân tích kịch bản. Vui lòng thử lại.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-bold flex items-center justify-center gap-2">
          <Clapperboard className="h-6 w-6 text-purple-500" />
          Bước 1: Nhập Kịch bản
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          AI sẽ phân tích và chia thành các scenes (mỗi scene max 8s cho VEO 3.1)
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Film className="h-4 w-4 text-purple-500" />
            Chọn Series & Episode
          </CardTitle>
          <CardDescription>
            Chọn từ Series đã tạo hoặc nhập kịch bản thủ công
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Series & Episode Selector */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <ListVideo className="h-3 w-3" />
                Series
              </Label>
              <Select 
                value={selectedSeriesId} 
                onValueChange={handleSeriesChange}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={isLoadingSeries ? "Đang tải..." : "Chọn series..."} />
                </SelectTrigger>
                <SelectContent>
                  {seriesList.map(series => (
                    <SelectItem key={series.id} value={series.id}>
                      <div className="flex items-center gap-2">
                        <span>{series.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {series.episodes?.length || 0} eps
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  {seriesList.length === 0 && !isLoadingSeries && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Chưa có series nào
                    </div>
                  )}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-7 text-xs"
                onClick={refetchSeries}
                disabled={isLoadingSeries}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingSeries ? 'animate-spin' : ''}`} />
                Refresh danh sách
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm">
                <Clapperboard className="h-3 w-3" />
                Episode
              </Label>
              <Select 
                value={selectedEpisodeId} 
                onValueChange={handleEpisodeChange}
                disabled={!selectedSeriesId || seriesEpisodes.length === 0}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={getEpisodePlaceholder()} />
                </SelectTrigger>
                <SelectContent>
                  {seriesEpisodes.map(ep => (
                    <SelectItem key={ep.id} value={ep.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs w-6 h-5 flex items-center justify-center">
                          {ep.number}
                        </Badge>
                        <span className="truncate">{ep.title}</span>
                        <Badge 
                          variant={ep.status === 'scripted' ? 'default' : 'outline'} 
                          className="text-xs ml-auto"
                        >
                          {ep.status === 'scripted' ? '✓' : '○'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSeries && (
                <p className="text-xs text-muted-foreground">
                  {selectedSeries.theme ? `Theme: ${selectedSeries.theme}` : `${seriesEpisodes.length} episodes`}
                </p>
              )}
            </div>
          </div>
          
          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {episode ? 'Kịch bản đã chọn' : 'Hoặc nhập thủ công'}
              </span>
            </div>
          </div>
          
          {/* Script Content */}
          {episode?.script ? (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Hook</Label>
                <p>{renderContent(episode.script.hook)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Story</Label>
                <p>{renderContent(episode.script.story)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Punchline</Label>
                <p>{renderContent(episode.script.punchline)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">CTA</Label>
                <p>{renderContent(episode.script.cta)}</p>
              </div>
              {episode.script.visualNotes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Visual Notes</Label>
                  <p>{renderContent(episode.script.visualNotes)}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Textarea
                placeholder="Nhập kịch bản video của bạn...\n\nVí dụ:\nHook: Bạn có biết bí mật để đánh bida pro?\nStory: Tại SABO Billiards, tôi đã học được 3 kỹ thuật...\nPunchline: Và kết quả? Từ newbie thành master!\nCTA: Follow để xem thêm tips!"
                value={manualScript}
                onChange={(e) => setManualScript(e.target.value)}
                rows={10}
              />
              <div className="flex items-center gap-4">
                <Label>Thời lượng mong muốn:</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={manualDuration}
                    onChange={(e) => setManualDuration(Number(e.target.value))}
                    className="w-20"
                    min={10}
                    max={120}
                  />
                  <span className="text-sm text-muted-foreground">giây</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  (~{Math.ceil(manualDuration / 7)} scenes)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Settings */}
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Cài đặt AI phân tích
            </span>
            <Badge variant="secondary">
              {AI_MODELS.find(m => m.id === aiModel)?.name || aiModel}
            </Badge>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4 space-y-4 p-4 border rounded-lg">
          <div>
            <Label>Model AI</Label>
            <Select value={aiModel} onValueChange={onAiModelChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.description} {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>System Prompt</Label>
              <Button variant="ghost" size="sm" onClick={onShowPromptDialog}>
                <Maximize2 className="h-3 w-3 mr-1" />
                Mở rộng
              </Button>
            </div>
            <Textarea
              value={scenePrompt}
              onChange={(e) => onScenePromptChange(e.target.value)}
              rows={4}
              className="text-xs font-mono"
            />
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onScenePromptChange(DEFAULT_SCENE_PROMPT)}
            className="w-full"
          >
            <RefreshCw className="h-3 w-3 mr-2" />
            Reset về mặc định
          </Button>
        </CollapsibleContent>
      </Collapsible>
      
      {/* Action */}
      <Button 
        onClick={analyzeScript} 
        disabled={isAnalyzing || (!episode?.script && !manualScript.trim())}
        className="w-full"
        size="lg"
      >
        {isAnalyzing ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Đang phân tích...</>
        ) : (
          <><Wand2 className="h-4 w-4 mr-2" /> Phân tích & Chia Scenes</>
        )}
      </Button>
    </div>
  );
}

export default InputStep;
