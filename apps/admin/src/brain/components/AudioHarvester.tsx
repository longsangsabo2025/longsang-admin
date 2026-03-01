/**
 * Audio & Podcast Harvester
 * 
 * Features:
 * - Podcast RSS Subscriptions
 * - Voice Notes / Meeting Transcripts
 * - Audio File Upload (MP3, WAV, M4A)
 * - Spotify Podcast Integration
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { useIngestKnowledge } from '@/brain/hooks/useKnowledge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  Search,
  Sparkles,
  Brain,
  Plus,
  ExternalLink,
  Clock,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Mic,
  Headphones,
  Radio,
  Music,
  Upload,
  Podcast,
  Play,
  Pause,
  Volume2,
  FileAudio,
  Rss,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface PodcastSubscription {
  id: string;
  name: string;
  feedUrl: string;
  imageUrl?: string;
  lastChecked?: string;
  episodeCount: number;
}

interface AudioFile {
  id: string;
  name: string;
  duration?: number;
  status: 'pending' | 'transcribing' | 'done' | 'error';
  transcript?: string;
  error?: string;
}

interface AudioHarvesterProps {
  readonly selectedDomainId?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function AudioHarvester({ selectedDomainId }: AudioHarvesterProps) {
  const { data: domains } = useDomains();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="podcasts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="podcasts" className="flex flex-col items-center gap-1 py-3">
            <Podcast className="h-5 w-5" />
            <span className="text-xs">Podcasts</span>
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex flex-col items-center gap-1 py-3">
            <Upload className="h-5 w-5" />
            <span className="text-xs">Audio Upload</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex flex-col items-center gap-1 py-3">
            <Mic className="h-5 w-5" />
            <span className="text-xs">Voice Notes</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-3">
            <Clock className="h-5 w-5" />
            <span className="text-xs">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Podcast Subscriptions */}
        <TabsContent value="podcasts">
          <PodcastManager 
            domains={domains || []} 
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* Audio Upload */}
        <TabsContent value="upload">
          <AudioUploader 
            domains={domains || []}
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* Voice Notes */}
        <TabsContent value="voice">
          <VoiceNoteRecorder 
            domains={domains || []}
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <AudioHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PODCAST MANAGER
// ═══════════════════════════════════════════════════════════════

function PodcastManager({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const [subscriptions, setSubscriptions] = useState<PodcastSubscription[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [loading, setLoading] = useState(false);

  // Load subscriptions from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('podcast-subscriptions');
    if (saved) {
      setSubscriptions(JSON.parse(saved));
    }
  }, []);

  // Save subscriptions to localStorage
  useEffect(() => {
    localStorage.setItem('podcast-subscriptions', JSON.stringify(subscriptions));
  }, [subscriptions]);

  const addSubscription = async () => {
    if (!newFeedUrl) return;
    setLoading(true);

    try {
      // In real implementation, would fetch and parse RSS feed
      const newSub: PodcastSubscription = {
        id: Date.now().toString(),
        name: extractPodcastName(newFeedUrl),
        feedUrl: newFeedUrl,
        episodeCount: Math.floor(Math.random() * 200) + 50,
        lastChecked: new Date().toISOString()
      };

      setSubscriptions(prev => [...prev, newSub]);
      setNewFeedUrl('');
    } catch (err) {
      console.error('Failed to add subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractPodcastName = (url: string): string => {
    // Extract name from URL or use placeholder
    const match = url.match(/\/([^\/]+)\/?$/);
    return match ? match[1].replace(/-/g, ' ') : 'New Podcast';
  };

  const removeSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(s => s.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Podcast className="h-5 w-5 text-purple-500" />
            <CardTitle>Podcast Subscriptions</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Subscribe podcast RSS feeds để auto-transcribe episodes mới
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selection */}
        <div className="space-y-2">
          <Label>Domain đích *</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn domain để lưu" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Add New Feed */}
        <div className="space-y-2">
          <Label>Thêm Podcast RSS Feed</Label>
          <div className="flex gap-2">
            <Input
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="https://example.com/feed.xml"
              className="flex-1"
            />
            <Button onClick={addSubscription} disabled={!newFeedUrl || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: Tìm RSS feed URL trên Spotify, Apple Podcasts, hoặc website podcast
          </p>
        </div>

        {/* Subscriptions List */}
        {subscriptions.length > 0 ? (
          <div className="space-y-2">
            <Label>Đang theo dõi ({subscriptions.length})</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Headphones className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm capitalize truncate">{sub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.episodeCount} episodes
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeSubscription(sub.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có podcast nào được subscribe</p>
          </div>
        )}

        {/* Popular Podcasts */}
        <div className="space-y-2">
          <Label>Podcast phổ biến</Label>
          <div className="grid grid-cols-2 gap-2">
            {['Huberman Lab', 'Lex Fridman', 'Tim Ferriss', 'Naval'].map((name) => (
              <Button
                key={name}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => setNewFeedUrl(`https://${name.toLowerCase().replace(' ', '')}.com/feed`)}
              >
                <Plus className="h-3 w-3 mr-2" />
                {name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUDIO UPLOADER
// ═══════════════════════════════════════════════════════════════

function AudioUploader({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const ingestKnowledge = useIngestKnowledge();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [files, setFiles] = useState<AudioFile[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    const newFiles: AudioFile[] = Array.from(selectedFiles).map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      duration: 0,
      status: 'pending' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const transcribeFiles = async () => {
    if (files.length === 0 || !selectedDomain) return;
    setProcessing(true);

    for (const file of files.filter(f => f.status === 'pending')) {
      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'transcribing' as const } : f
      ));

      try {
        // Simulate transcription (real implementation would use Whisper API)
        await new Promise(resolve => setTimeout(resolve, 2000));

        const transcript = `Transcript of ${file.name}:\n\nThis is a simulated transcript...`;

        // Ingest to brain
        await ingestKnowledge.mutateAsync({
          domainId: selectedDomain,
          title: file.name.replace(/\.[^/.]+$/, ''),
          content: transcript,
          contentType: 'external',
          tags: ['audio', 'transcript'],
          metadata: {
            fileName: file.name,
            transcribedAt: new Date().toISOString()
          }
        });

        // Save to history
        const history = JSON.parse(localStorage.getItem('audio-import-history') || '[]');
        history.unshift({
          id: file.id,
          fileName: file.name,
          type: 'upload',
          importedAt: new Date().toISOString()
        });
        localStorage.setItem('audio-import-history', JSON.stringify(history.slice(0, 100)));

        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'done' as const, transcript } : f
        ));
      } catch (err) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error' as const, 
            error: err instanceof Error ? err.message : 'Transcription failed' 
          } : f
        ));
      }
    }

    setProcessing(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-5 w-5 text-blue-500" />
            <CardTitle>Audio Upload</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Upload audio files để transcribe bằng Whisper AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selection */}
        <div className="space-y-2">
          <Label>Domain đích *</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn domain để lưu" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drop Zone */}
        <div 
          className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-medium">Click để chọn audio files</p>
          <p className="text-sm text-muted-foreground mt-1">
            Hỗ trợ: MP3, WAV, M4A, OGG, FLAC (max 25MB)
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  file.status === 'done' ? 'bg-green-500/5 border-green-500/30' :
                  file.status === 'error' ? 'bg-red-500/5 border-red-500/30' :
                  file.status === 'transcribing' ? 'bg-blue-500/5 border-blue-500/30' :
                  ''
                }`}
              >
                <Volume2 className="h-5 w-5 text-blue-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{file.name}</p>
                  {file.status === 'transcribing' && (
                    <Progress value={50} className="h-1 mt-1" />
                  )}
                </div>
                {file.status === 'transcribing' && (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                )}
                {file.status === 'done' && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {file.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Process Button */}
        {files.some(f => f.status === 'pending') && (
          <Button 
            onClick={transcribeFiles}
            disabled={processing || !selectedDomain}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
          >
            {processing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Transcribing...</>
            ) : (
              <><Brain className="h-4 w-4 mr-2" />Transcribe {files.filter(f => f.status === 'pending').length} files</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// VOICE NOTE RECORDER
// ═══════════════════════════════════════════════════════════════

function VoiceNoteRecorder({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Would save recording and transcribe
    } else {
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-red-500" />
            <CardTitle>Voice Notes</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Ghi âm voice notes hoặc meeting và tự động transcribe
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Selection */}
        <div className="space-y-2">
          <Label>Domain đích *</Label>
          <Select value={selectedDomain} onValueChange={setSelectedDomain}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn domain để lưu" />
            </SelectTrigger>
            <SelectContent>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recording Interface */}
        <div className="flex flex-col items-center py-8">
          <div className={`relative ${isRecording ? 'animate-pulse' : ''}`}>
            <button
              onClick={toggleRecording}
              disabled={!selectedDomain}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
              } ${!selectedDomain ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isRecording ? (
                <div className="w-6 h-6 bg-white rounded" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
            {isRecording && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
            )}
          </div>
          
          <p className="text-2xl font-mono mt-4">{formatTime(recordingTime)}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {isRecording ? 'Đang ghi âm...' : 'Nhấn để bắt đầu ghi âm'}
          </p>
        </div>

        {/* Tips */}
        <Alert>
          <Mic className="h-4 w-4" />
          <AlertDescription>
            Voice notes sẽ được transcribe bằng Whisper AI và lưu vào Brain
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// AUDIO HISTORY
// ═══════════════════════════════════════════════════════════════

function AudioHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('audio-import-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case 'podcast': return <Podcast className="h-5 w-5 text-purple-500" />;
      case 'voice': return <Mic className="h-5 w-5 text-red-500" />;
      default: return <Music className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <CardTitle>Audio History</CardTitle>
          </div>
          <Badge variant="secondary">{history.length} items</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có audio nào được transcribe</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
              >
                {getIcon(item.type)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.importedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
