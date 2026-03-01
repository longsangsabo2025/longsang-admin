/**
 * YouTube Knowledge Ingestion Component (shadcn/ui version)
 * 
 * Flow: Paste URL → Show Transcript → AI Analysis → Review → Ingest to Brain
 * Human-in-the-loop approach for quality control
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, 
  Youtube, 
  Search, 
  Sparkles, 
  Brain, 
  FileText, 
  Plus,
  ExternalLink,
  Clock,
  Eye,
  ThumbsUp,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Copy,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  likeCount: string;
  tags: string[];
  thumbnails: {
    high?: { url: string };
    medium?: { url: string };
  };
  defaultLanguage?: string;
  defaultAudioLanguage?: string;
}

interface TranscriptData {
  text: string;
  language: string;
  source: string;
}

interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  mainTopics: string[];
  actionItems: string[];
  suggestedTags: string[];
  knowledgeDocument: string;
}

interface FinalDocument {
  title: string;
  content: string;
  tags: string[];
  contentType: string;
}

const STEPS = ['Nhập URL', 'Xem Transcript', 'AI Phân Tích', 'Review', 'Hoàn tất'];

// Step indicator component
function StepIndicator({ currentStep, steps }: { currentStep: number; steps: string[] }) {
  return (
    <div className="flex items-center justify-between mb-6 px-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                index < currentStep
                  ? 'bg-green-500 text-white'
                  : index === currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index < currentStep ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
            </div>
            <span className={`mt-1 text-xs ${index === currentStep ? 'font-medium' : 'text-muted-foreground'}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// Format duration from ISO 8601 (PT18M4S) to human readable
function formatDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? `${match[1]}:` : '';
  const minutes = match[2] || '0';
  const seconds = match[3]?.padStart(2, '0') || '00';
  
  return `${hours}${minutes}:${seconds}`;
}

// Format large numbers
function formatNumber(num: string): string {
  const n = parseInt(num, 10);
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return num;
}

interface YouTubeIngestionProps {
  readonly selectedDomainId?: string | null;
}

export function YouTubeIngestion({ selectedDomainId }: YouTubeIngestionProps) {
  const { data: domains } = useDomains();
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
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // UI state
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [tagInput, setTagInput] = useState('');

  // Extract video ID from URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Step 1: Fetch video metadata and transcript
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
      // Fetch metadata
      const metaResponse = await fetch(`${API_BASE}/api/brain/youtube/video/${videoId}`);
      const metaData = await metaResponse.json();
      
      if (!metaData.success) {
        throw new Error(metaData.error || 'Không thể lấy thông tin video');
      }
      
      setVideoMetadata(metaData.data);
      setLoadingMetadata(false);

      // Fetch transcript
      const transcriptResponse = await fetch(`${API_BASE}/api/brain/youtube/transcript/${videoId}?lang=vi`);
      const transcriptData = await transcriptResponse.json();
      
      if (transcriptData.success && transcriptData.data?.text) {
        setTranscript(transcriptData.data);
      } else {
        // No transcript available - use description as fallback
        setTranscript({
          text: metaData.data.description || 'Không có transcript cho video này.',
          language: 'vi',
          source: 'description-fallback'
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

  // Step 2: AI Analysis
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
          tags: videoMetadata.tags
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'AI phân tích thất bại');
      }

      setAIAnalysis(data.data);
      
      // Prepare final document from AI analysis
      setFinalDocument({
        title: videoMetadata.title,
        content: data.data.knowledgeDocument,
        tags: [...new Set([...videoMetadata.tags.slice(0, 5), ...(data.data.suggestedTags || [])])],
        contentType: 'video'
      });
      
      setCurrentStep(2);
    } catch (err) {
      // Fallback: Create document without AI analysis
      console.error('AI Analysis failed, using fallback:', err);
      
      setFinalDocument({
        title: videoMetadata.title,
        content: `## Video: ${videoMetadata.title}\n\n` +
          `**Channel:** ${videoMetadata.channelTitle}\n` +
          `**Published:** ${new Date(videoMetadata.publishedAt).toLocaleDateString('vi-VN')}\n\n` +
          `### Description\n${videoMetadata.description}\n\n` +
          `### Transcript\n${transcript.text.slice(0, 5000)}${transcript.text.length > 5000 ? '...' : ''}`,
        tags: videoMetadata.tags.slice(0, 10),
        contentType: 'video'
      });
      
      setCurrentStep(2);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Step 3: Move to review
  const proceedToReview = () => {
    setCurrentStep(3);
  };

  // Step 4: Ingest to Brain
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
        contentType: finalDocument.contentType as 'document' | 'note' | 'conversation' | 'external' | 'code',
        tags: finalDocument.tags,
        sourceUrl: `https://youtube.com/watch?v=${videoMetadata?.id}`,
        metadata: {
          videoId: videoMetadata?.id,
          channelTitle: videoMetadata?.channelTitle,
          duration: videoMetadata?.duration,
          viewCount: videoMetadata?.viewCount,
          importedAt: new Date().toISOString(),
          aiAnalyzed: !!aiAnalysis
        }
      });
      
      setCurrentStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể nạp kiến thức');
    }
  };

  // Reset flow
  const resetFlow = () => {
    setCurrentStep(0);
    setYoutubeUrl('');
    setVideoMetadata(null);
    setTranscript(null);
    setAIAnalysis(null);
    setFinalDocument(null);
    setError(null);
    setShowFullTranscript(false);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && finalDocument && !finalDocument.tags.includes(tagInput.trim())) {
      setFinalDocument({
        ...finalDocument,
        tags: [...finalDocument.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    if (finalDocument) {
      setFinalDocument({
        ...finalDocument,
        tags: finalDocument.tags.filter(t => t !== tag)
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Youtube className="h-8 w-8 text-red-500" />
        <div>
          <h2 className="text-xl font-bold">YouTube → Brain Knowledge</h2>
          <p className="text-sm text-muted-foreground">Chuyển đổi video YouTube thành kiến thức có cấu trúc</p>
        </div>
      </div>

      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step 0: Input YouTube URL */}
      {currentStep === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Bước 1: Nhập URL YouTube
            </CardTitle>
            <CardDescription>
              Dán link video YouTube để bắt đầu quá trình nạp kiến thức
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                <Button 
                  onClick={fetchVideoData}
                  disabled={!youtubeUrl || loadingMetadata}
                >
                  {loadingMetadata ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="ml-2">Tìm</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Hỗ trợ: youtube.com/watch?v=..., youtu.be/..., hoặc video ID
              </p>
            </div>

            <div>
              <Label htmlFor="domain">Domain đích *</Label>
              <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                <SelectTrigger id="domain">
                  <SelectValue placeholder="Chọn domain để lưu kiến thức" />
                </SelectTrigger>
                <SelectContent>
                  {domains?.map((domain) => (
                    <SelectItem key={domain.id} value={domain.id}>
                      {domain.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: View Transcript */}
      {currentStep === 1 && videoMetadata && (
        <div className="space-y-4">
          {/* Video Preview Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <img
                  src={videoMetadata.thumbnails.high?.url || videoMetadata.thumbnails.medium?.url}
                  alt={videoMetadata.title}
                  className="w-48 h-28 object-cover rounded-lg"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold line-clamp-2">{videoMetadata.title}</h3>
                  <p className="text-sm text-muted-foreground">{videoMetadata.channelTitle}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDuration(videoMetadata.duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {formatNumber(videoMetadata.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {formatNumber(videoMetadata.likeCount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {videoMetadata.tags.slice(0, 5).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {videoMetadata.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{videoMetadata.tags.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transcript Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcript
                  {transcript?.source === 'description-fallback' && (
                    <Badge variant="outline" className="ml-2">Từ mô tả video</Badge>
                  )}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => transcript && copyToClipboard(transcript.text)}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>
              <CardDescription>
                {loadingTranscript 
                  ? 'Đang tải transcript...' 
                  : `${transcript?.text.length.toLocaleString() || 0} ký tự • Ngôn ngữ: ${transcript?.language?.toUpperCase() || 'N/A'}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTranscript ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Collapsible open={showFullTranscript} onOpenChange={setShowFullTranscript}>
                  <div className="rounded-lg bg-muted p-4 text-sm max-h-48 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans">
                      {showFullTranscript 
                        ? transcript?.text 
                        : `${transcript?.text.slice(0, 500)}${(transcript?.text.length || 0) > 500 ? '...' : ''}`
                      }
                    </pre>
                  </div>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full mt-2">
                      {showFullTranscript ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Xem toàn bộ transcript
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={resetFlow}>
              ← Quay lại
            </Button>
            <Button onClick={runAIAnalysis} disabled={loadingAnalysis || !transcript}>
              {loadingAnalysis ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  AI đang phân tích...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  🤖 AI Phân Tích Key Insights
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: AI Analysis Results */}
      {currentStep === 2 && finalDocument && (
        <div className="space-y-4">
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  🤖 AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div>
                  <h4 className="font-medium text-sm mb-2">📋 Tóm tắt</h4>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                    {aiAnalysis.summary}
                  </div>
                </div>

                {/* Key Insights */}
                {aiAnalysis.keyInsights.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">💡 Key Insights</h4>
                    <ul className="space-y-1 text-sm">
                      {aiAnalysis.keyInsights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Main Topics */}
                {aiAnalysis.mainTopics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">📚 Chủ đề chính</h4>
                    <div className="flex flex-wrap gap-1">
                      {aiAnalysis.mainTopics.map((topic, i) => (
                        <Badge key={i} variant="outline">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Tags */}
                {aiAnalysis.suggestedTags?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">🏷️ Tags gợi ý</h4>
                    <div className="flex flex-wrap gap-1">
                      {aiAnalysis.suggestedTags.map((tag) => (
                        <Badge 
                          key={tag}
                          variant={finalDocument.tags.includes(tag) ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (finalDocument.tags.includes(tag)) {
                              removeTag(tag);
                            } else {
                              setFinalDocument({
                                ...finalDocument,
                                tags: [...finalDocument.tags, tag]
                              });
                            }
                          }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Generated Document Preview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📄 Tài liệu được tạo
                </CardTitle>
                <Badge variant="outline">{finalDocument.content.length.toLocaleString()} ký tự</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4 text-sm max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap font-sans">
                  {finalDocument.content.slice(0, 2000)}
                  {finalDocument.content.length > 2000 && '...'}
                </pre>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Xem lại Transcript
            </Button>
            <Button onClick={proceedToReview}>
              Tiếp tục Review →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Final Review & Edit */}
      {currentStep === 3 && finalDocument && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                ✅ Review & Chỉnh sửa cuối cùng
              </CardTitle>
              <CardDescription>
                Kiểm tra và chỉnh sửa tài liệu trước khi nạp vào Brain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="final-title">Tiêu đề</Label>
                <Input
                  id="final-title"
                  value={finalDocument.title}
                  onChange={(e) => setFinalDocument({ ...finalDocument, title: e.target.value })}
                />
              </div>

              {/* Domain Selection */}
              <div>
                <Label htmlFor="final-domain">Domain *</Label>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger id="final-domain">
                    <SelectValue placeholder="Chọn domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains?.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="final-content">Nội dung</Label>
                <Textarea
                  id="final-content"
                  value={finalDocument.content}
                  onChange={(e) => setFinalDocument({ ...finalDocument, content: e.target.value })}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {finalDocument.content.length.toLocaleString()} ký tự
                </p>
              </div>

              {/* Tags */}
              <div>
                <Label>Tags</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    placeholder="Thêm tag..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {finalDocument.tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground" 
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Source */}
              <div className="text-xs text-muted-foreground">
                Nguồn: {youtubeUrl}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Quay lại
            </Button>
            <Button 
              onClick={ingestToBrain} 
              disabled={!selectedDomain || ingestKnowledge.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {ingestKnowledge.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang nạp...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  🧠 Nạp Kiến Thức vào Brain
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {currentStep === 4 && (
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold">🎉 Nạp Kiến Thức Thành Công!</h3>
              <p className="text-muted-foreground">
                Video "{videoMetadata?.title}" đã được nạp vào Brain thành công.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={resetFlow}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Nạp Video Khác
                </Button>
                <Button asChild variant="outline">
                  <a 
                    href={`https://youtube.com/watch?v=${videoMetadata?.id}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Xem Video Gốc
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
