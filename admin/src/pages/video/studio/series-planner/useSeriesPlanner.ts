/**
 * Custom hook for SeriesPlannerContent state and business logic
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
  DEFAULT_AI_SETTINGS,
  type Episode,
  loadSettings,
  type Series,
  type SeriesArc,
  saveSettingsLocal,
  saveSettingsToSupabase,
  transformSupabaseToSeries,
} from './shared';

export function useSeriesPlanner() {
  const [activeTab, setActiveTab] = useState('create');
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);

  // Create Series Form
  const [theme, setTheme] = useState('');
  const [location, setLocation] = useState('SABO Billiards');
  const [character, setCharacter] = useState('Anh Long Magic');
  const [tone, setTone] = useState('Hài hước, storytelling');
  const [episodeCount, setEpisodeCount] = useState(5);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');

  // AI Settings
  const savedSettings = loadSettings();
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(savedSettings.aiModel || DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(
    savedSettings.temperature ?? DEFAULT_AI_SETTINGS.temperature
  );
  const [maxTokens, setMaxTokens] = useState(
    savedSettings.maxTokens || DEFAULT_AI_SETTINGS.maxTokens
  );
  const [systemPrompt, setSystemPrompt] = useState(
    savedSettings.systemPrompt || DEFAULT_AI_SETTINGS.systemPrompt
  );

  // Dialogs
  const [showScriptDialog, setShowScriptDialog] = useState(false);
  const [showProductionStudio, setShowProductionStudio] = useState(false);
  const [productionEpisode, setProductionEpisode] = useState<Episode | null>(null);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [editedScript, setEditedScript] = useState<Partial<Episode>>({});
  const [regeneratingField, setRegeneratingField] = useState<string | null>(null);
  const [showPromptDialog, setShowPromptDialog] = useState(false);

  // Supabase save states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // ===========================================================================
  // SUPABASE DATA FUNCTIONS
  // ===========================================================================

  // Save series to Supabase
  const saveSeriesToSupabase = async (series: Series, isNew = false) => {
    setIsSaving(true);
    try {
      const endpoint = isNew ? '/api/series' : `/api/series/${series.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        name: series.title,
        description: series.description,
        theme: series.theme,
        location: series.location,
        character: series.mainCharacter,
        tone: series.tone,
        total_episodes: series.totalEpisodes,
        status: series.status,
        metadata: {
          arcs: series.arcs,
          targetAudience: series.targetAudience,
        },
        episodes: series.episodes.map((ep) => ({
          id: isNew ? undefined : ep.id,
          episode_number: ep.number,
          title: ep.title,
          hook: ep.hook,
          script: ep.story,
          cta: ep.cta,
          visual_prompt: ep.visualNotes,
          duration_seconds: ep.duration,
          status: ep.status,
          metadata: {
            synopsis: ep.synopsis,
            punchline: ep.punchline,
            videoUrl: ep.videoUrl,
          },
        })),
      };

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        setLastSaved(new Date());
        console.log('[Series] Saved to Supabase:', result.data?.id || series.id);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Failed to save series to Supabase:', error);
      toast.error('Lưu series thất bại');
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Load series from Supabase
  const loadSeriesFromSupabase = async () => {
    try {
      const response = await fetch('/api/series');
      const result = await response.json();

      if (result.success && result.data) {
        // Transform Supabase data to our Series format
        const transformedData: Series[] = result.data.map(
          (item: {
            id: string;
            title?: string;
            name?: string;
            description?: string;
            theme?: string;
            location?: string;
            character?: string;
            tone?: string;
            total_episodes?: number;
            metadata?: { arcs?: SeriesArc[]; targetAudience?: string };
            status?: string;
            created_at?: string;
            updated_at?: string;
            episodes?: Array<{
              id: string;
              episode_number: number;
              title?: string;
              description?: string;
              hook?: string;
              script_content?: string;
              status?: string;
              created_at?: string;
              updated_at?: string;
            }>;
          }) => ({
            id: item.id,
            title: item.title || item.name || 'Untitled',
            description: item.description || '',
            theme: item.theme || '',
            targetAudience: item.metadata?.targetAudience || '',
            tone: item.tone || '',
            location: item.location || '',
            mainCharacter: item.character || '',
            totalEpisodes: item.total_episodes || 0,
            arcs: item.metadata?.arcs || [],
            episodes: (item.episodes || []).map((ep) => ({
              id: ep.id,
              number: ep.episode_number,
              title: ep.title || '',
              synopsis: ep.description || '',
              hook: ep.hook || '',
              story: ep.script_content || '',
              punchline: '',
              cta: '',
              visualNotes: '',
              duration: 60,
              status: (ep.status === 'scripted'
                ? 'scripted'
                : ep.status === 'produced'
                  ? 'produced'
                  : 'outline') as Episode['status'],
              videoUrl: '',
              createdAt: ep.created_at || new Date().toISOString(),
              updatedAt: ep.updated_at || new Date().toISOString(),
            })),
            status: (item.status as Series['status']) || 'planning',
            createdAt: item.created_at || new Date().toISOString(),
            updatedAt: item.updated_at || new Date().toISOString(),
          })
        );

        setSeriesList(transformedData);
      }
    } catch (error) {
      console.error('Failed to load series from Supabase:', error);
      toast.error('Không thể tải dữ liệu series');
    } finally {
      setIsLoading(false);
    }
  };

  // ===========================================================================
  // EFFECTS
  // ===========================================================================

  // Load data on mount
  useEffect(() => {
    loadSeriesFromSupabase();
  }, []);

  // Save AI settings (debounced to Supabase, immediate to localStorage)
  useEffect(() => {
    saveSettingsLocal({ aiModel, temperature, maxTokens, systemPrompt });

    // Debounce Supabase save
    const timeoutId = setTimeout(() => {
      saveSettingsToSupabase({ aiModel, temperature, maxTokens, systemPrompt });
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [aiModel, temperature, maxTokens, systemPrompt]);

  // Auto-save hook for continuous persistence
  const { isSaving: isAutoSaving, lastSaved: autoSaveLastSaved } = useAutoSave({
    data: selectedSeries,
    saveFunction: async (series) => {
      if (!series) return;
      await saveSeriesToSupabase(series, false);
    },
    interval: 10000, // 10 seconds
    enabled: !isLoading && selectedSeries !== null,
    showToast: false,
  });

  // ===========================================================================
  // HANDLERS
  // ===========================================================================

  const handleGenerateSeries = async () => {
    if (!theme.trim()) {
      toast.error('Vui lòng nhập theme cho series');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Đang tạo concept series...');

    try {
      // Call AI to generate series concept
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Tạo series concept cho:
Theme: ${theme}
Địa điểm: ${location}
Nhân vật chính: ${character}
Tone: ${tone}
Số tập: ${episodeCount}

Trả về JSON với format:
{
  "title": "Tên series hấp dẫn",
  "description": "Mô tả series 2-3 câu",
  "targetAudience": "Đối tượng mục tiêu",
  "arcs": [
    { "phase": "Setup", "description": "Giới thiệu...", "episodes": [1, 2] },
    { "phase": "Conflict", "description": "Cao trào...", "episodes": [3, 4] },
    { "phase": "Resolution", "description": "Kết thúc...", "episodes": [5] }
  ],
  "episodes": [
    { "number": 1, "title": "Tên tập", "synopsis": "Tóm tắt 1-2 câu", "duration": 45 }
  ]
}`,
          model: aiModel,
          temperature,
          maxTokens,
          systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();

      // Parse response
      let seriesData;
      try {
        const content = data.enhancedPrompt || data.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          seriesData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.log('Could not parse, using fallback');
      }

      // Create series object
      const newSeries: Series = {
        id: `series-${Date.now()}`,
        title: seriesData?.title || `Series: ${theme}`,
        description: seriesData?.description || `Short video series về ${theme}`,
        theme,
        targetAudience: seriesData?.targetAudience || 'Gen Z, young adults',
        tone,
        location,
        mainCharacter: character,
        totalEpisodes: episodeCount,
        arcs: seriesData?.arcs || [
          { phase: 'Setup', description: 'Giới thiệu nhân vật và bối cảnh', episodes: [1, 2] },
          { phase: 'Conflict', description: 'Thử thách và cao trào', episodes: [3, 4] },
          { phase: 'Resolution', description: 'Giải quyết và kết thúc', episodes: [episodeCount] },
        ],
        episodes: (
          seriesData?.episodes ||
          Array.from({ length: episodeCount }, (_, i) => ({
            number: i + 1,
            title: `Tập ${i + 1}`,
            synopsis: 'Chưa có tóm tắt',
            duration: 45,
          }))
        ).map((ep: Partial<Episode>, index: number) => ({
          id: `ep-${Date.now()}-${index}`,
          number: ep.number || index + 1,
          title: ep.title || `Tập ${index + 1}`,
          synopsis: ep.synopsis || '',
          duration: ep.duration || 45,
          status: 'outline' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        status: 'planning',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save to Supabase
      const updated = [newSeries, ...seriesList];
      setSeriesList(updated);

      try {
        const savedSeries = await saveSeriesToSupabase(newSeries, true);
        if (savedSeries) {
          // Update ID from Supabase
          newSeries.id = savedSeries.id;
          setSeriesList([newSeries, ...seriesList]);
        }
      } catch {
        console.log('Series created but not saved to Supabase');
      }

      setSelectedSeries(newSeries);
      setActiveTab('series');

      toast.success(`✨ Đã tạo series "${newSeries.title}" với ${episodeCount} tập!`);

      // Reset form
      setTheme('');
    } catch (error) {
      console.error('Error generating series:', error);
      toast.error('Không thể tạo series. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleGenerateScript = async (episode: Episode) => {
    if (!selectedSeries) return;

    setSelectedEpisode(episode);
    setIsGenerating(true);
    setGenerationStep(`Đang viết script tập ${episode.number}...`);

    try {
      // Get context from previous episodes
      const prevEpisodes = selectedSeries.episodes
        .filter((ep) => ep.number < episode.number && ep.status !== 'outline')
        .map((ep) => `Tập ${ep.number}: ${ep.title} - ${ep.synopsis}`)
        .join('\n');

      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Viết script chi tiết cho:

Series: ${selectedSeries.title}
Mô tả: ${selectedSeries.description}
Nhân vật: ${selectedSeries.mainCharacter}
Địa điểm: ${selectedSeries.location}
Tone: ${selectedSeries.tone}

Tập ${episode.number}: ${episode.title}
Synopsis: ${episode.synopsis}
Duration: ${episode.duration}s

${prevEpisodes ? `Các tập trước:\n${prevEpisodes}\n` : ''}

Trả về JSON:
{
  "hook": "3-5 giây mở đầu gây chú ý (viết chi tiết dialogue/action)",
  "story": "20-40 giây nội dung chính (viết chi tiết từng câu thoại, hành động)",
  "punchline": "Điểm nhấn/twist/câu đùa cuối",
  "cta": "Call to action tự nhiên",
  "visualNotes": "Ghi chú cho video production (góc quay, biểu cảm, props...)"
}`,
          model: aiModel,
          temperature,
          maxTokens,
          systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate script');

      const data = await response.json();

      let scriptData;
      try {
        const content = data.enhancedPrompt || data.content || '';
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scriptData = JSON.parse(jsonMatch[0]);
        }
      } catch {
        console.log('Could not parse script');
      }

      // Update episode with script
      const updatedEpisodes = selectedSeries.episodes.map((ep) =>
        ep.id === episode.id
          ? {
              ...ep,
              hook: scriptData?.hook || 'Hook chưa được tạo',
              story: scriptData?.story || 'Story chưa được tạo',
              punchline: scriptData?.punchline || '',
              cta: scriptData?.cta || 'Follow để xem tiếp!',
              visualNotes: scriptData?.visualNotes || '',
              status: 'scripted' as const,
              updatedAt: new Date().toISOString(),
            }
          : ep
      );

      const updatedSeries = {
        ...selectedSeries,
        episodes: updatedEpisodes,
        updatedAt: new Date().toISOString(),
      };

      // Update state and save to Supabase
      const updatedList = seriesList.map((s) => (s.id === selectedSeries.id ? updatedSeries : s));
      setSeriesList(updatedList);
      setSelectedSeries(updatedSeries);
      setSelectedEpisode(updatedEpisodes.find((ep) => ep.id === episode.id) || null);

      // Save to Supabase
      saveSeriesToSupabase(updatedSeries).catch(console.error);

      setShowScriptDialog(true);
      toast.success(`✨ Đã viết script tập ${episode.number}!`);
    } catch (error) {
      console.error('Error generating script:', error);
      toast.error('Không thể tạo script. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Regenerate Story Arcs with AI (Elon Mode: clear examples, no ambiguity)
  const handleRegenerateArcs = async (series: Series) => {
    if (!series) return;

    setIsGenerating(true);
    setGenerationStep('Đang tạo Story Arcs...');

    try {
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Tạo Story Arcs cho series "${series.title}":
Theme: ${series.theme}
Số tập: ${series.totalEpisodes}
Tone: ${series.tone}
Target: ${series.targetAudience}

REQUIREMENTS (Elon Mode - be specific):
- Chia thành 3 phases: Setup → Conflict → Resolution
- Mỗi phase có description CỤ THỂ (không chung chung)
- Phân bổ episodes hợp lý

TRẢ VỀ JSON CHÍNH XÁC:
{
  "arcs": [
    { 
      "phase": "Setup", 
      "description": "Giới thiệu ${series.mainCharacter} tại ${series.location}, thiết lập vấn đề chính là gì đó CỤ THỂ",
      "episodes": [1, 2]
    },
    { 
      "phase": "Conflict", 
      "description": "Thử thách chính: [nêu rõ conflict là gì], cao trào khi [event cụ thể]",
      "episodes": [3, 4]
    },
    { 
      "phase": "Resolution", 
      "description": "Giải quyết bằng cách [action cụ thể], kết thúc với [outcome rõ ràng]",
      "episodes": [${series.totalEpisodes}]
    }
  ]
}

QUAN TRỌNG: Description PHẢI cụ thể, không được chung chung kiểu "phát triển cốt truyện"!`,
          model: aiModel,
          temperature: 0.7,
          maxTokens,
          systemPrompt:
            'You are a storytelling expert. Write SPECIFIC details, not generic placeholders.',
        }),
      });

      if (!response.ok) throw new Error('AI generation failed');

      const data = await response.json();
      let arcsData;

      try {
        const content = data.enhancedPrompt || data.content || '';
        console.log('[Arcs] AI Response:', content.substring(0, 500));

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          arcsData = JSON.parse(jsonMatch[0]);
          console.log('[Arcs] Parsed data:', arcsData);
        }
      } catch (error) {
        console.error('Failed to parse arcs:', error);
        console.log('[Arcs] Raw content:', data);
      }

      // Fallback if AI fails - generate smart defaults
      if (!arcsData?.arcs || arcsData.arcs.length === 0) {
        console.log('[Arcs] Using fallback generation');
        const totalEps = series.totalEpisodes;
        const setupEnd = Math.ceil(totalEps * 0.3);
        const conflictEnd = Math.ceil(totalEps * 0.7);

        arcsData = {
          arcs: [
            {
              phase: 'Setup',
              description: `Giới thiệu ${series.mainCharacter} tại ${series.location}, thiết lập bối cảnh và mục tiêu ban đầu`,
              episodes: Array.from({ length: setupEnd }, (_, i) => i + 1),
            },
            {
              phase: 'Conflict',
              description: `Thử thách chính xuất hiện, ${series.mainCharacter} đối mặt với trở ngại và cao trào căng thẳng`,
              episodes: Array.from({ length: conflictEnd - setupEnd }, (_, i) => setupEnd + i + 1),
            },
            {
              phase: 'Resolution',
              description: `Giải quyết conflict, kết thúc câu chuyện với ${series.tone.toLowerCase()} ending`,
              episodes: Array.from(
                { length: totalEps - conflictEnd },
                (_, i) => conflictEnd + i + 1
              ),
            },
          ],
        };
      }

      // Update series with new arcs
      const updatedSeries = {
        ...series,
        arcs: arcsData.arcs,
        updatedAt: new Date().toISOString(),
      };

      setSeriesList((prev) => prev.map((s) => (s.id === series.id ? updatedSeries : s)));

      if (selectedSeries?.id === series.id) {
        setSelectedSeries(updatedSeries);
      }

      // Save to Supabase
      await saveSeriesToSupabase(updatedSeries, false);

      toast.success('✨ Story Arcs đã được tạo!');
    } catch (error) {
      console.error('Failed to regenerate arcs:', error);
      toast.error(
        'Tạo Story Arcs thất bại: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Regenerate single script field with AI
  const handleRegenerateField = async (
    fieldName: 'hook' | 'story' | 'punchline' | 'cta' | 'visualNotes'
  ) => {
    if (!selectedEpisode || !selectedSeries) return;

    setRegeneratingField(fieldName);

    try {
      const fieldPrompts = {
        hook: `Viết HOOK (3-5 giây) cho tập ${selectedEpisode.number}: ${selectedEpisode.title}
Series: ${selectedSeries.title}
Synopsis: ${selectedEpisode.synopsis}
YÊU CẦU: Câu mở đầu gây chú ý cực mạnh, có yếu tố bất ngờ/hài hước.`,
        story: `Viết STORY (20-40 giây) cho tập ${selectedEpisode.number}: ${selectedEpisode.title}
Series: ${selectedSeries.title}
Synopsis: ${selectedEpisode.synopsis}
Hook hiện tại: ${selectedEpisode.hook || 'Chưa có'}
YÊU CẦU: Kể chi tiết từng câu thoại, hành động. Phải cụ thể, không chung chung.`,
        punchline: `Viết PUNCHLINE (twist cuối) cho tập ${selectedEpisode.number}: ${selectedEpisode.title}
Series: ${selectedSeries.title}
Hook: ${selectedEpisode.hook || 'Chưa có'}
Story: ${selectedEpisode.story || 'Chưa có'}
YÊU CẦU: Điểm nhấn bất ngờ, hài hước hoặc cảm động để kết thúc.`,
        cta: `Viết CALL TO ACTION tự nhiên cho video về ${selectedSeries.theme}
Tone: ${selectedSeries.tone}
Target: ${selectedSeries.targetAudience}
YÊU CẦU: Ngắn gọn, không spam, khuyến khích follow/like tự nhiên.`,
        visualNotes: `Viết VISUAL NOTES cho production team:
Tập ${selectedEpisode.number}: ${selectedEpisode.title}
Địa điểm: ${selectedSeries.location}
Nhân vật: ${selectedSeries.mainCharacter}
Script: ${selectedEpisode.hook} ${selectedEpisode.story}
YÊU CẦU: Góc quay, biểu cảm, props, lighting, transitions cụ thể.`,
      };

      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fieldPrompts[fieldName],
          model: aiModel,
          temperature: 0.8,
          maxTokens,
          systemPrompt:
            'You are a professional scriptwriter. Write SPECIFIC, DETAILED content. No generic placeholders.',
        }),
      });

      if (!response.ok) throw new Error('AI generation failed');

      const data = await response.json();
      const generatedText = data.enhancedPrompt || data.content || '';

      // Update edited script state
      setEditedScript((prev) => ({
        ...prev,
        [fieldName]: generatedText.trim(),
      }));

      toast.success(`✨ ${fieldName.toUpperCase()} đã được tạo!`);
    } catch (error) {
      console.error(`[Regen ${fieldName}] Error:`, error);
      toast.error(`Tạo ${fieldName} thất bại`);
    } finally {
      setRegeneratingField(null);
    }
  };

  const handleDeleteSeries = async (seriesId: string) => {
    const updated = seriesList.filter((s) => s.id !== seriesId);
    setSeriesList(updated);

    // Delete from Supabase
    try {
      await fetch(`/api/series/${seriesId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete from Supabase:', error);
    }

    if (selectedSeries?.id === seriesId) {
      setSelectedSeries(null);
      setSelectedEpisode(null);
    }
  };

  const handleProduceVideo = (episode: Episode) => {
    setProductionEpisode(episode);
    setShowProductionStudio(true);
  };

  // Batch generate all outline scripts
  const handleBatchGenerate = async () => {
    if (!selectedSeries) return;

    const outlineEps = selectedSeries.episodes.filter((ep) => ep.status === 'outline');
    if (outlineEps.length === 0) return;

    setIsGenerating(true);
    setGenerationStep(`Đang tạo ${outlineEps.length} scripts song song...`);

    try {
      const response = await fetch(`/api/series/${selectedSeries.id}/episodes/batch-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeIds: outlineEps.map((ep) => ep.id),
        }),
      });

      if (!response.ok) throw new Error('Batch generation failed');

      const result = await response.json();
      toast.success(
        `✨ Đã tạo ${result.results.successful}/${outlineEps.length} scripts trong ${result.elapsed}!`
      );

      // Refresh series data
      const seriesResponse = await fetch(`/api/series/${selectedSeries.id}`);
      const seriesData = await seriesResponse.json();
      if (seriesData.success) {
        const updatedSeriesList = seriesList.map((s) =>
          s.id === selectedSeries.id ? transformSupabaseToSeries(seriesData.data) : s
        );
        setSeriesList(updatedSeriesList);
        setSelectedSeries(transformSupabaseToSeries(seriesData.data));
      }
    } catch (error) {
      console.error('[Batch Gen] Error:', error);
      toast.error('Không thể tạo batch scripts');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Save edited script from dialog
  const handleSaveScript = async () => {
    if (!selectedEpisode || !selectedSeries) return;

    setIsSaving(true);
    try {
      const updatedEpisode = {
        ...selectedEpisode,
        hook: editedScript.hook ?? selectedEpisode.hook,
        story: editedScript.story ?? selectedEpisode.story,
        punchline: editedScript.punchline ?? selectedEpisode.punchline,
        cta: editedScript.cta ?? selectedEpisode.cta,
        visualNotes: editedScript.visualNotes ?? selectedEpisode.visualNotes,
        updatedAt: new Date().toISOString(),
      };

      const updatedSeries = {
        ...selectedSeries,
        episodes: selectedSeries.episodes.map((ep) =>
          ep.id === selectedEpisode.id ? updatedEpisode : ep
        ),
        updatedAt: new Date().toISOString(),
      };

      setSeriesList((prev) => prev.map((s) => (s.id === selectedSeries.id ? updatedSeries : s)));
      setSelectedSeries(updatedSeries);
      setSelectedEpisode(updatedEpisode);

      // Save to Supabase
      await saveSeriesToSupabase(updatedSeries, false);

      toast.success('💾 Script đã lưu!');
      setIsEditingScript(false);
      setEditedScript({});
    } catch (error) {
      console.error('[Script] Save error:', error);
      toast.error('Lưu script thất bại');
    } finally {
      setIsSaving(false);
    }
  };

  // Dialog open change handler
  const handleScriptDialogOpenChange = (open: boolean) => {
    setShowScriptDialog(open);
    if (!open) setIsEditingScript(false);
  };

  // Reset AI settings to defaults
  const handleResetAISettings = () => {
    setAiModel(DEFAULT_AI_SETTINGS.model);
    setTemperature(DEFAULT_AI_SETTINGS.temperature);
    setMaxTokens(DEFAULT_AI_SETTINGS.maxTokens);
    setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
    toast.success('Đã reset về mặc định');
  };

  return {
    // Navigation
    activeTab,
    setActiveTab,

    // Data
    seriesList,
    selectedSeries,
    setSelectedSeries,
    selectedEpisode,
    setSelectedEpisode,

    // Loading states
    isLoading,
    isSaving,
    lastSaved,
    isAutoSaving,
    autoSaveLastSaved,
    isGenerating,
    generationStep,

    // Create form
    theme,
    setTheme,
    location,
    setLocation,
    character,
    setCharacter,
    tone,
    setTone,
    episodeCount,
    setEpisodeCount,

    // AI Settings
    showAISettings,
    setShowAISettings,
    aiModel,
    setAiModel,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
    systemPrompt,
    setSystemPrompt,

    // Dialogs
    showScriptDialog,
    showProductionStudio,
    setShowProductionStudio,
    productionEpisode,
    showPromptDialog,
    setShowPromptDialog,
    isEditingScript,
    setIsEditingScript,
    editedScript,
    setEditedScript,
    regeneratingField,

    // Handlers
    handleGenerateSeries,
    handleGenerateScript,
    handleRegenerateArcs,
    handleRegenerateField,
    handleDeleteSeries,
    handleProduceVideo,
    handleBatchGenerate,
    handleSaveScript,
    handleScriptDialogOpenChange,
    handleResetAISettings,
  };
}
