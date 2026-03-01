/**
 * YouTube Harvester — Single Video Tab
 *
 * Renders the full single-video import workflow (Steps 0–4).
 * Steps 1 and 2 are delegated to TranscriptStep and AnalysisStep.
 * All state & handlers are received via props from the parent YouTubeHarvester.
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertCircle,
  BookOpen,
  Brain,
  CheckCircle2,
  ExternalLink,
  History,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Youtube,
} from 'lucide-react';

import { AnalysisStep } from './AnalysisStep';
import { STEPS } from './constants';
import { StepIndicator } from './StepIndicator';
import { TranscriptStep } from './TranscriptStep';
import type { AIAnalysis, FinalDocument, TranscriptData, VideoMetadata } from './types';

export interface SingleVideoTabProps {
  // Restore state
  showRestorePrompt: boolean;
  restoreSavedState: () => void;
  dismissRestore: () => void;
  // Step
  currentStep: number;
  setCurrentStep: (step: number) => void;
  // Error
  error: string | null;
  // Form
  youtubeUrl: string;
  setYoutubeUrl: (url: string) => void;
  selectedDomain: string;
  setSelectedDomain: (domain: string) => void;
  // Data
  videoMetadata: VideoMetadata | null;
  transcript: TranscriptData | null;
  aiAnalysis: AIAnalysis | null;
  finalDocument: FinalDocument | null;
  setFinalDocument: (doc: FinalDocument) => void;
  // Loading
  loadingMetadata: boolean;
  loadingTranscript: boolean;
  loadingWhisper: boolean;
  loadingExternalApi: boolean;
  loadingAnalysis: boolean;
  savingToLibrary: boolean;
  ingestPending: boolean;
  // UI
  showFullTranscript: boolean;
  setShowFullTranscript: (show: boolean) => void;
  tagInput: string;
  setTagInput: (input: string) => void;
  // Handlers
  fetchVideoData: () => void;
  fetchExternalTranscript: () => void;
  fetchWhisperTranscript: () => void;
  runAIAnalysis: () => void;
  resetFlow: () => void;
  proceedToReview: () => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  copyToClipboard: (text: string) => void;
  saveToLibrary: () => void;
  ingestToBrain: () => void;
}

export function SingleVideoTab({
  showRestorePrompt,
  restoreSavedState,
  dismissRestore,
  currentStep,
  setCurrentStep,
  error,
  youtubeUrl,
  setYoutubeUrl,
  selectedDomain,
  setSelectedDomain,
  videoMetadata,
  transcript,
  aiAnalysis,
  finalDocument,
  setFinalDocument,
  loadingMetadata,
  loadingTranscript,
  loadingWhisper,
  loadingExternalApi,
  loadingAnalysis,
  savingToLibrary,
  ingestPending,
  showFullTranscript,
  setShowFullTranscript,
  tagInput,
  setTagInput,
  fetchVideoData,
  fetchExternalTranscript,
  fetchWhisperTranscript,
  runAIAnalysis,
  resetFlow,
  proceedToReview,
  addTag,
  removeTag,
  copyToClipboard,
  saveToLibrary,
  ingestToBrain,
}: SingleVideoTabProps) {
  const { data: domains } = useDomains();

  return (
    <Card className="border-red-500/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            <CardTitle>Import Single Video</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Paste URL → Transcript → AI Analysis → Review → Ingest to Brain
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* RESTORE PROMPT */}
        {showRestorePrompt && (
          <Alert className="mb-4 border-blue-500/50 bg-blue-500/10">
            <History className="h-4 w-4" />
            <AlertTitle className="flex items-center gap-2">
              💾 Phát hiện tiến trình đã lưu
            </AlertTitle>
            <AlertDescription className="mt-2">
              <p className="text-sm mb-3">
                Bạn có tiến trình đang làm dở trước đó. Muốn tiếp tục từ chỗ cũ không?
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={restoreSavedState} className="bg-blue-500 hover:bg-blue-600">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Khôi phục
                </Button>
                <Button size="sm" variant="outline" onClick={dismissRestore}>
                  Bắt đầu mới
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <StepIndicator currentStep={currentStep} steps={STEPS} />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP 0: URL Input */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="youtube-url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... hoặc youtu.be/..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && fetchVideoData()}
                />
                <Button onClick={fetchVideoData} disabled={!youtubeUrl || loadingMetadata}>
                  {loadingMetadata ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="ml-2">Tìm</span>
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="domain">Domain đích *</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger id="domain">
                  <SelectValue placeholder="Chọn domain để lưu" />
                </SelectTrigger>
                <SelectContent>
                  {domains?.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* STEP 1: Transcript Preview */}
        {currentStep === 1 && videoMetadata && (
          <TranscriptStep
            videoMetadata={videoMetadata}
            transcript={transcript}
            loadingTranscript={loadingTranscript}
            loadingWhisper={loadingWhisper}
            loadingExternalApi={loadingExternalApi}
            loadingAnalysis={loadingAnalysis}
            showFullTranscript={showFullTranscript}
            setShowFullTranscript={setShowFullTranscript}
            fetchExternalTranscript={fetchExternalTranscript}
            fetchWhisperTranscript={fetchWhisperTranscript}
            runAIAnalysis={runAIAnalysis}
            resetFlow={resetFlow}
            copyToClipboard={copyToClipboard}
          />
        )}

        {/* STEP 2: AI Analysis Results */}
        {currentStep === 2 && finalDocument && (
          <AnalysisStep
            aiAnalysis={aiAnalysis}
            finalDocument={finalDocument}
            setCurrentStep={setCurrentStep}
            proceedToReview={proceedToReview}
          />
        )}

        {/* STEP 3: Final Review */}
        {currentStep === 3 && finalDocument && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="final-title">Tiêu đề</Label>
              <Input id="final-title" value={finalDocument.title} onChange={(e) => setFinalDocument({ ...finalDocument, title: e.target.value })} />
            </div>
            <div>
              <Label>Domain *</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger><SelectValue placeholder="Chọn domain" /></SelectTrigger>
                <SelectContent>
                  {domains?.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nội dung</Label>
              <Textarea value={finalDocument.content} onChange={(e) => setFinalDocument({ ...finalDocument, content: e.target.value })} rows={10} className="font-mono text-xs" />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag..." />
                <Button variant="outline" onClick={addTag}><Plus className="h-4 w-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {finalDocument.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>{tag} ×</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button variant="outline" onClick={() => setCurrentStep(2)}>← AI Analysis</Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={saveToLibrary}
                  disabled={savingToLibrary}
                  title="Lưu để dùng cho blog, content, reference..."
                >
                  {savingToLibrary ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
                  Lưu Thư viện
                </Button>
                <Button
                  onClick={ingestToBrain}
                  disabled={!selectedDomain || ingestPending}
                  className="bg-gradient-to-r from-purple-500 to-pink-500"
                  title="Nạp vào Brain để học và review"
                >
                  {ingestPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                  Nạp vào Brain
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {currentStep === 4 && (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <h3 className="text-lg font-semibold">🎉 Nạp Thành Công!</h3>
            <p className="text-sm text-muted-foreground">"{videoMetadata?.title}" đã được thêm vào Brain</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={resetFlow}><RefreshCw className="h-4 w-4 mr-1" />Nạp tiếp</Button>
              <Button variant="outline" asChild>
                <a href={`https://youtube.com/watch?v=${videoMetadata?.id}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />Xem video
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
