/**
 * YouTube Knowledge Harvester
 *
 * A comprehensive YouTube ingestion system:
 * - Single Video Import (Active)
 * - Channel Subscription Monitor (Active)
 * - Playlist Bulk Import (Active)
 * - Import History (Active)
 *
 * Architecture: thin orchestrator that delegates to sub-components.
 */

import { History, ListVideo, Users, Youtube } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type {
  AIAnalysis,
  FinalDocument,
  ImportHistoryItem,
  TranscriptData,
  VideoMetadata,
  YouTubeHarvesterProps,
} from './youtube-harvester';
import {
  API_BASE,
  ChannelPanel,
  extractVideoId,
  ImportHistoryPanel,
  PlaylistPanel,
  SingleVideoTab,
  STORAGE_KEY,
} from './youtube-harvester';

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function YouTubeHarvester({ selectedDomainId }: YouTubeHarvesterProps) {
  const ingestKnowledge = useIngestKnowledge();

  // Flow state
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');

  // Data state
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [transcript, setTranscript] = useState<TranscriptData | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [finalDocument, setFinalDocument] = useState<FinalDocument | null>(null);

  // Loading states
  const [loadingMetadata, setLoadingMetadata] = useState(false);
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const [loadingWhisper, setLoadingWhisper] = useState(false);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [loadingExternalApi, setLoadingExternalApi] = useState(false);
  const [savingToLibrary, setSavingToLibrary] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // AUTO-SAVE & RESTORE STATE
  // ═══════════════════════════════════════════════════════════════

  useEffect(() => {
    if (currentStep === 0 && !videoMetadata) return;
    if (currentStep === 4) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    const stateToSave = {
      currentStep,
      youtubeUrl,
      selectedDomain,
      videoMetadata,
      transcript,
      aiAnalysis,
      finalDocument,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    console.log('[YouTubeHarvester] 💾 State auto-saved at step', currentStep);
  }, [
    currentStep,
    youtubeUrl,
    selectedDomain,
    videoMetadata,
    transcript,
    aiAnalysis,
    finalDocument,
  ]);

  useEffect(() => {
    if (hasRestoredState) return;

    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.currentStep > 0 && parsed.videoMetadata) {
          setShowRestorePrompt(true);
          console.log('[YouTubeHarvester] 📂 Found saved state from', parsed.savedAt);
        }
      }
    } catch (err) {
      console.error('[YouTubeHarvester] Failed to parse saved state:', err);
      localStorage.removeItem(STORAGE_KEY);
    }
    setHasRestoredState(true);
  }, [hasRestoredState]);

  const restoreSavedState = useCallback(() => {
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setCurrentStep(parsed.currentStep || 0);
        setYoutubeUrl(parsed.youtubeUrl || '');
        setSelectedDomain(parsed.selectedDomain || selectedDomainId || '');
        setVideoMetadata(parsed.videoMetadata || null);
        setTranscript(parsed.transcript || null);
        setAIAnalysis(parsed.aiAnalysis || null);
        setFinalDocument(parsed.finalDocument || null);
        console.log('[YouTubeHarvester] ✅ State restored to step', parsed.currentStep);
      }
    } catch (err) {
      console.error('[YouTubeHarvester] Failed to restore state:', err);
    }
    setShowRestorePrompt(false);
  }, [selectedDomainId]);

  const dismissRestore = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setShowRestorePrompt(false);
    console.log('[YouTubeHarvester] 🗑️ Saved state cleared');
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════

  const fetchVideoData = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      setError('URL YouTube không hợp lệ. Vui lòng nhập đúng format.');
      return;
    }

    setError(null);
    setLoadingMetadata(true);
    setLoadingTranscript(true);

    try {
      const metaResponse = await fetch(`${API_BASE}/api/brain/youtube/video/${videoId}`);
      const metaData = await metaResponse.json();

      if (!metaData.success) {
        throw new Error(metaData.error || 'Không thể lấy thông tin video');
      }

      setVideoMetadata(metaData.data);
      setLoadingMetadata(false);

      const transcriptResponse = await fetch(
        `${API_BASE}/api/brain/youtube/transcript/${videoId}?lang=vi`
      );
      const transcriptData = await transcriptResponse.json();

      if (transcriptData.success && transcriptData.data?.text) {
        setTranscript(transcriptData.data);
      } else {
        setTranscript({
          text: metaData.data.description || 'Không có transcript cho video này.',
          language: 'vi',
          source: 'description-fallback',
        });
      }

      setLoadingTranscript(false);
      setCurrentStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      setLoadingMetadata(false);
      setLoadingTranscript(false);
    }
  };

  const fetchWhisperTranscript = async () => {
    if (!videoMetadata) return;

    setLoadingWhisper(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/brain/youtube/transcript/${videoMetadata.id}?lang=vi&forceWhisper=1`
      );
      const data = await response.json();

      if (data.success && data.data?.text) {
        setTranscript(data.data);
        toast.success('🎤 Đã lấy transcript từ Whisper AI!');
      } else {
        throw new Error(data.error || 'Whisper AI không thể xử lý video này');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi khi dùng Whisper AI';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingWhisper(false);
    }
  };

  const fetchExternalTranscript = async () => {
    if (!videoMetadata) return;

    setLoadingExternalApi(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/brain/youtube/transcript/${videoMetadata.id}?useExternalApi=1`
      );
      const data = await response.json();

      if (data.success && data.data?.text) {
        setTranscript(data.data);
        toast.success('🌐 Đã lấy transcript từ External API!');
      } else {
        throw new Error(data.error || 'External API không thể xử lý video này');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi khi dùng External API';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoadingExternalApi(false);
    }
  };

  const runAIAnalysis = async () => {
    if (!transcript || !videoMetadata) return;

    setLoadingAnalysis(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/brain/youtube/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoMetadata.id,
          title: videoMetadata.title,
          description: videoMetadata.description,
          transcript: transcript.text,
          tags: videoMetadata.tags,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'AI phân tích thất bại');
      }

      setAIAnalysis(data.data);
      setFinalDocument({
        title: videoMetadata.title,
        content: data.data.knowledgeDocument,
        tags: [...new Set([...videoMetadata.tags.slice(0, 5), ...(data.data.suggestedTags || [])])],
        contentType: 'video',
      });
      setCurrentStep(2);
    } catch (err) {
      console.error('AI Analysis failed, using fallback:', err);
      setFinalDocument({
        title: videoMetadata.title,
        content:
          `## Video: ${videoMetadata.title}\n\n` +
          `**Channel:** ${videoMetadata.channelTitle}\n` +
          `**Published:** ${new Date(videoMetadata.publishedAt).toLocaleDateString('vi-VN')}\n\n` +
          `### Description\n${videoMetadata.description}\n\n` +
          `### Transcript\n${transcript.text.slice(0, 5000)}${transcript.text.length > 5000 ? '...' : ''}`,
        tags: videoMetadata.tags.slice(0, 10),
        contentType: 'video',
      });
      setCurrentStep(2);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const proceedToReview = () => setCurrentStep(3);

  const ingestToBrain = async () => {
    if (!finalDocument || !selectedDomain) {
      setError('Vui lòng chọn domain để lưu kiến thức');
      return;
    }

    try {
      await ingestKnowledge.mutateAsync({
        domainId: selectedDomain,
        title: finalDocument.title,
        content: finalDocument.content,
        contentType: finalDocument.contentType as
          | 'document'
          | 'note'
          | 'conversation'
          | 'external'
          | 'code',
        tags: finalDocument.tags,
        sourceUrl: `https://youtube.com/watch?v=${videoMetadata?.id}`,
        metadata: {
          videoId: videoMetadata?.id,
          channelTitle: videoMetadata?.channelTitle,
          duration: videoMetadata?.duration,
          viewCount: videoMetadata?.viewCount,
          importedAt: new Date().toISOString(),
          aiAnalyzed: !!aiAnalysis,
        },
      });

      // Save to import history
      if (videoMetadata) {
        try {
          const historyItem: ImportHistoryItem = {
            id: Date.now().toString(),
            videoId: videoMetadata.id,
            title: videoMetadata.title,
            channelTitle: videoMetadata.channelTitle,
            thumbnail: videoMetadata.thumbnails.medium?.url,
            importedAt: new Date().toISOString(),
            domain: selectedDomain,
            tags: finalDocument.tags.slice(0, 5),
          };

          const existing = localStorage.getItem('youtube-import-history');
          const history: ImportHistoryItem[] = existing ? JSON.parse(existing) : [];

          const filtered = history.filter((h) => h.videoId !== videoMetadata.id);
          filtered.unshift(historyItem);

          localStorage.setItem('youtube-import-history', JSON.stringify(filtered.slice(0, 100)));
          console.log('[YouTubeHarvester] 📜 Added to import history');
        } catch (historyErr) {
          console.warn('[YouTubeHarvester] Failed to save history:', historyErr);
        }
      }

      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nạp kiến thức');
    }
  };

  const saveToLibrary = async () => {
    if (!finalDocument || !videoMetadata) return;

    setSavingToLibrary(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/drive/library`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalDocument.title,
          content: finalDocument.content,
          source: 'youtube',
          sourceUrl: `https://youtube.com/watch?v=${videoMetadata.id}`,
          tags: finalDocument.tags,
          metadata: {
            videoId: videoMetadata.id,
            channelTitle: videoMetadata.channelTitle,
            channelId: videoMetadata.channelId,
            duration: videoMetadata.duration,
            viewCount: videoMetadata.viewCount,
            likeCount: videoMetadata.likeCount,
            publishedAt: videoMetadata.publishedAt,
            thumbnail: videoMetadata.thumbnails.high?.url || videoMetadata.thumbnails.medium?.url,
            aiAnalyzed: !!aiAnalysis,
            summary: aiAnalysis?.summary,
            keyInsights: aiAnalysis?.keyInsights,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Không thể lưu vào thư viện');
      }

      toast.success('📚 Đã lưu vào Google Drive!', {
        description: data.document?.webViewLink
          ? `"${finalDocument.title}" đã lưu vào thư viện`
          : data.message,
        action: data.document?.webViewLink
          ? {
              label: 'Mở Drive',
              onClick: () => window.open(data.document.webViewLink, '_blank'),
            }
          : undefined,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Không thể lưu vào thư viện';
      setError(errorMsg);
      toast.error('Lưu thất bại', { description: errorMsg });
    } finally {
      setSavingToLibrary(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep(0);
    setYoutubeUrl('');
    setVideoMetadata(null);
    setTranscript(null);
    setAIAnalysis(null);
    setFinalDocument(null);
    setError(null);
    setShowFullTranscript(false);
    localStorage.removeItem(STORAGE_KEY);
    console.log('[YouTubeHarvester] 🔄 Flow reset, state cleared');
  };

  const addTag = () => {
    if (tagInput.trim() && finalDocument && !finalDocument.tags.includes(tagInput.trim())) {
      setFinalDocument({ ...finalDocument, tags: [...finalDocument.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    if (finalDocument) {
      setFinalDocument({ ...finalDocument, tags: finalDocument.tags.filter((t) => t !== tag) });
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <Tabs defaultValue="single" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="single" className="flex flex-col items-center gap-1 py-3">
            <Youtube className="h-5 w-5" />
            <span className="text-xs">Single Video</span>
          </TabsTrigger>
          <TabsTrigger value="channel" className="flex flex-col items-center gap-1 py-3">
            <Users className="h-5 w-5" />
            <span className="text-xs">Channels</span>
          </TabsTrigger>
          <TabsTrigger value="playlist" className="flex flex-col items-center gap-1 py-3">
            <ListVideo className="h-5 w-5" />
            <span className="text-xs">Playlists</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-3">
            <History className="h-5 w-5" />
            <span className="text-xs">History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <SingleVideoTab
            showRestorePrompt={showRestorePrompt}
            restoreSavedState={restoreSavedState}
            dismissRestore={dismissRestore}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            error={error}
            youtubeUrl={youtubeUrl}
            setYoutubeUrl={setYoutubeUrl}
            selectedDomain={selectedDomain}
            setSelectedDomain={setSelectedDomain}
            videoMetadata={videoMetadata}
            transcript={transcript}
            aiAnalysis={aiAnalysis}
            finalDocument={finalDocument}
            setFinalDocument={setFinalDocument}
            loadingMetadata={loadingMetadata}
            loadingTranscript={loadingTranscript}
            loadingWhisper={loadingWhisper}
            loadingExternalApi={loadingExternalApi}
            loadingAnalysis={loadingAnalysis}
            savingToLibrary={savingToLibrary}
            ingestPending={ingestKnowledge.isPending}
            showFullTranscript={showFullTranscript}
            setShowFullTranscript={setShowFullTranscript}
            tagInput={tagInput}
            setTagInput={setTagInput}
            fetchVideoData={fetchVideoData}
            fetchExternalTranscript={fetchExternalTranscript}
            fetchWhisperTranscript={fetchWhisperTranscript}
            runAIAnalysis={runAIAnalysis}
            resetFlow={resetFlow}
            proceedToReview={proceedToReview}
            addTag={addTag}
            removeTag={removeTag}
            copyToClipboard={copyToClipboard}
            saveToLibrary={saveToLibrary}
            ingestToBrain={ingestToBrain}
          />
        </TabsContent>

        <TabsContent value="channel">
          <ChannelPanel />
        </TabsContent>

        <TabsContent value="playlist">
          <PlaylistPanel />
        </TabsContent>

        <TabsContent value="history">
          <ImportHistoryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
