/**
 * YouTube Harvester — Transcript Step (Step 1)
 *
 * Displays video metadata and transcript with options to re-fetch via
 * External API or Whisper AI. Provides navigation to AI analysis.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Eye,
  FileText,
  Globe,
  Loader2,
  Mic,
  Sparkles,
  ThumbsUp,
} from 'lucide-react';

import type { TranscriptData, VideoMetadata } from './types';
import { formatDuration, formatNumber } from './utils';

export interface TranscriptStepProps {
  videoMetadata: VideoMetadata;
  transcript: TranscriptData | null;
  loadingTranscript: boolean;
  loadingWhisper: boolean;
  loadingExternalApi: boolean;
  loadingAnalysis: boolean;
  showFullTranscript: boolean;
  setShowFullTranscript: (show: boolean) => void;
  fetchExternalTranscript: () => void;
  fetchWhisperTranscript: () => void;
  runAIAnalysis: () => void;
  resetFlow: () => void;
  copyToClipboard: (text: string) => void;
}

export function TranscriptStep({
  videoMetadata,
  transcript,
  loadingTranscript,
  loadingWhisper,
  loadingExternalApi,
  loadingAnalysis,
  showFullTranscript,
  setShowFullTranscript,
  fetchExternalTranscript,
  fetchWhisperTranscript,
  runAIAnalysis,
  resetFlow,
  copyToClipboard,
}: TranscriptStepProps) {
  return (
    <div className="space-y-4">
      {/* Video Info Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <img
              src={videoMetadata.thumbnails.high?.url || videoMetadata.thumbnails.medium?.url}
              alt={videoMetadata.title}
              className="w-40 h-24 object-cover rounded-lg"
            />
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold line-clamp-2 text-sm">{videoMetadata.title}</h3>
              <p className="text-xs text-muted-foreground">{videoMetadata.channelTitle}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(videoMetadata.duration)}</span>
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{formatNumber(videoMetadata.viewCount)}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{formatNumber(videoMetadata.likeCount)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Transcript
              {transcript?.source && (
                <Badge variant="outline" className="text-xs">
                  {transcript.source === 'whisper-ai' ? '🎤 Whisper AI' :
                   transcript.source === 'youtube-captions' ? '📝 Captions' :
                   transcript.source === 'youtube-api' ? '📝 YouTube API' :
                   transcript.source === 'public-extraction' ? '📝 Public' :
                   '📄 Description'}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-1">
              {transcript && transcript.source !== 'youtube-transcript-io' && transcript.source !== 'whisper-ai' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchExternalTranscript}
                  disabled={loadingExternalApi || loadingWhisper}
                  className="text-xs"
                  title="Dùng External API (free 25 lần/tháng)"
                >
                  {loadingExternalApi ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang lấy...</>
                  ) : (
                    <><Globe className="h-3 w-3 mr-1" />External API</>
                  )}
                </Button>
              )}
              {transcript && (transcript.source === 'description-fallback' || transcript.text.length < 500) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchWhisperTranscript}
                  disabled={loadingWhisper || loadingExternalApi}
                  className="text-xs"
                  title="Dùng AI để lấy transcript từ audio video"
                >
                  {loadingWhisper ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang xử lý...</>
                  ) : (
                    <><Mic className="h-3 w-3 mr-1" />Whisper AI</>
                  )}
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => transcript && copyToClipboard(transcript.text)}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          {transcript && transcript.source !== 'whisper-ai' && transcript.source !== 'youtube-transcript-io' && transcript.text.length < 1000 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Transcript ngắn ({transcript.text.length} chars). Thử External API (free) hoặc Whisper AI.
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loadingTranscript || loadingWhisper || loadingExternalApi ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              {loadingWhisper && (
                <p className="text-xs text-muted-foreground">Whisper AI đang xử lý audio... (có thể mất 1-3 phút)</p>
              )}
              {loadingExternalApi && (
                <p className="text-xs text-muted-foreground">Đang lấy từ External API...</p>
              )}
            </div>
          ) : (
            <Collapsible open={showFullTranscript} onOpenChange={setShowFullTranscript}>
              <div className="rounded-lg bg-muted p-3 text-xs max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans">
                  {showFullTranscript ? transcript?.text : `${transcript?.text.slice(0, 400)}...`}
                </pre>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full mt-2">
                  {showFullTranscript ? <><ChevronUp className="h-3 w-3 mr-1" />Thu gọn</> : <><ChevronDown className="h-3 w-3 mr-1" />Xem đầy đủ ({transcript?.text.length.toLocaleString()} chars)</>}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={resetFlow}>← Quay lại</Button>
        <div className="flex gap-2">
          {transcript && transcript.source !== 'youtube-transcript-io' && transcript.source !== 'whisper-ai' && (
            <Button
              variant="outline"
              onClick={fetchExternalTranscript}
              disabled={loadingExternalApi || loadingWhisper}
              title="Free API (25 lần/tháng)"
            >
              {loadingExternalApi ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />External...</>
              ) : (
                <><Globe className="h-4 w-4 mr-2" />🌐 External API</>
              )}
            </Button>
          )}
          {transcript && transcript.source !== 'whisper-ai' && (
            <Button
              variant="outline"
              onClick={fetchWhisperTranscript}
              disabled={loadingWhisper || loadingExternalApi}
              title="Lấy transcript đầy đủ bằng Whisper AI"
            >
              {loadingWhisper ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Whisper...</>
              ) : (
                <><Mic className="h-4 w-4 mr-2" />🎤 Whisper AI</>
              )}
            </Button>
          )}
          <Button onClick={runAIAnalysis} disabled={loadingAnalysis || loadingWhisper || loadingExternalApi}>
            {loadingAnalysis ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang phân tích...</> : <><Sparkles className="h-4 w-4 mr-2" />AI Phân Tích</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
