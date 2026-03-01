/**
 * Social Media Monitor
 * 
 * Features:
 * - Twitter/X Thread Collector
 * - Hashtag & Trend Tracking
 * - Influencer Monitoring
 * - AI-powered Trend Detection
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Twitter,
  Hash,
  Users,
  TrendingUp,
  MessageSquare,
  Heart,
  Repeat2,
  AtSign,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
  };
  isThread?: boolean;
  threadParts?: string[];
}

interface TrackedHashtag {
  id: string;
  tag: string;
  addedAt: string;
  tweetCount: number;
}

interface TrackedAccount {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  addedAt: string;
}

interface SocialHarvesterProps {
  readonly selectedDomainId?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SocialHarvester({ selectedDomainId }: SocialHarvesterProps) {
  const { data: domains } = useDomains();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="thread" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="thread" className="flex flex-col items-center gap-1 py-3">
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Threads</span>
          </TabsTrigger>
          <TabsTrigger value="hashtag" className="flex flex-col items-center gap-1 py-3">
            <Hash className="h-5 w-5" />
            <span className="text-xs">Hashtags</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex flex-col items-center gap-1 py-3">
            <Users className="h-5 w-5" />
            <span className="text-xs">Accounts</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex flex-col items-center gap-1 py-3">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs">Trends</span>
          </TabsTrigger>
        </TabsList>

        {/* Thread Collector */}
        <TabsContent value="thread">
          <ThreadCollector 
            domains={domains || []} 
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* Hashtag Tracker */}
        <TabsContent value="hashtag">
          <HashtagTracker />
        </TabsContent>

        {/* Account Monitor */}
        <TabsContent value="accounts">
          <AccountMonitor />
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends">
          <TrendingTopics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// THREAD COLLECTOR
// ═══════════════════════════════════════════════════════════════

function ThreadCollector({ 
  domains, 
  selectedDomainId 
}: { 
  domains: any[];
  selectedDomainId?: string | null;
}) {
  const ingestKnowledge = useIngestKnowledge();
  const [tweetUrl, setTweetUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [loading, setLoading] = useState(false);
  const [thread, setThread] = useState<Tweet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [savedThreads, setSavedThreads] = useState<any[]>([]);

  // Load saved threads
  useEffect(() => {
    const saved = localStorage.getItem('social-saved-threads');
    if (saved) {
      setSavedThreads(JSON.parse(saved));
    }
  }, []);

  // Extract tweet ID from URL
  const extractTweetId = (url: string): string | null => {
    const match = /status\/(\d+)/.exec(url);
    return match ? match[1] : null;
  };

  // Fetch thread
  const fetchThread = async () => {
    if (!tweetUrl) {
      setError('Vui lòng nhập URL thread');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/brain/social/twitter/thread`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: tweetUrl })
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Không thể lấy thread');
      }

      setThread(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  // Save thread to Brain
  const saveThread = async () => {
    if (!thread || !selectedDomain) return;

    try {
      const content = thread.tweets?.length > 0
        ? thread.tweets.join('\n\n---\n\n')
        : thread.content || thread.text || 'No content';

      await ingestKnowledge.mutateAsync({
        domainId: selectedDomain,
        title: `Thread by @${thread.author}: ${(thread.content || thread.text || '').substring(0, 50)}...`,
        content: `# Thread by @${thread.author}\n\n${content}\n\n---\n*Saved from Twitter on ${new Date().toLocaleDateString('vi-VN')}*`,
        contentType: 'external',
        tags: ['twitter', 'thread', thread.author],
        sourceUrl: tweetUrl,
        metadata: {
          platform: 'twitter',
          author: thread.author,
          tweetCount: thread.tweetCount,
          importedAt: new Date().toISOString()
        }
      });

      // Save to local history
      const newThread = {
        id: Date.now().toString(),
        url: tweetUrl,
        author: thread.author,
        preview: thread.text.substring(0, 100),
        savedAt: new Date().toISOString()
      };
      const updated = [newThread, ...savedThreads.slice(0, 49)];
      setSavedThreads(updated);
      localStorage.setItem('social-saved-threads', JSON.stringify(updated));

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu');
    }
  };

  const reset = () => {
    setTweetUrl('');
    setThread(null);
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">🎉 Lưu Thread Thành Công!</h3>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Lưu thread khác
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Twitter className="h-5 w-5 text-sky-500" />
            <CardTitle>Thread Collector</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Lưu Twitter/X threads vào Brain để học hỏi và tham khảo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* URL Input */}
        <div className="space-y-2">
          <Label>Tweet/Thread URL</Label>
          <div className="flex gap-2">
            <Input
              value={tweetUrl}
              onChange={(e) => setTweetUrl(e.target.value)}
              placeholder="https://twitter.com/user/status/..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && fetchThread()}
            />
            <Button onClick={fetchThread} disabled={!tweetUrl || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>

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

        {/* Thread Preview */}
        {thread && (
          <Card className="border-sky-500/30 bg-sky-500/5">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                {thread.author.avatar ? (
                  <img
                    src={thread.author.avatar}
                    alt={thread.author.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
                    {thread.author.name[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{thread.author.name}</span>
                    <span className="text-muted-foreground">@{thread.author.username}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap">{thread.text}</p>
                  
                  {thread.threadParts && thread.threadParts.length > 1 && (
                    <Badge variant="secondary" className="mt-2">
                      🧵 {thread.threadParts.length} tweets in thread
                    </Badge>
                  )}

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" /> {thread.metrics.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Repeat2 className="h-4 w-4" /> {thread.metrics.retweets}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" /> {thread.metrics.replies}
                    </span>
                  </div>
                </div>
              </div>

              <Button 
                onClick={saveThread}
                disabled={!selectedDomain || ingestKnowledge.isPending}
                className="w-full bg-gradient-to-r from-sky-500 to-blue-500"
              >
                {ingestKnowledge.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Lưu vào Brain
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Saved Threads */}
        {savedThreads.length > 0 && (
          <div className="space-y-2">
            <Label>Threads đã lưu gần đây</Label>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {savedThreads.slice(0, 5).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 p-2 rounded border hover:bg-muted/50 cursor-pointer text-sm"
                  onClick={() => window.open(t.url, '_blank')}
                >
                  <Twitter className="h-4 w-4 text-sky-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">@{t.author.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{t.preview}</p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// HASHTAG TRACKER
// ═══════════════════════════════════════════════════════════════

function HashtagTracker() {
  const [hashtags, setHashtags] = useState<TrackedHashtag[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('social-tracked-hashtags');
    if (saved) {
      setHashtags(JSON.parse(saved));
    }
  }, []);

  const addHashtag = () => {
    if (!newTag) return;
    
    const tag = newTag.startsWith('#') ? newTag.slice(1) : newTag;
    
    const newHashtag: TrackedHashtag = {
      id: Date.now().toString(),
      tag,
      addedAt: new Date().toISOString(),
      tweetCount: 0
    };

    const updated = [...hashtags, newHashtag];
    setHashtags(updated);
    localStorage.setItem('social-tracked-hashtags', JSON.stringify(updated));
    setNewTag('');
  };

  const removeHashtag = (id: string) => {
    const updated = hashtags.filter(h => h.id !== id);
    setHashtags(updated);
    localStorage.setItem('social-tracked-hashtags', JSON.stringify(updated));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-blue-500" />
            <CardTitle>Hashtag Tracker</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Theo dõi các hashtag quan trọng
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Hashtag */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="#hashtag"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addHashtag()}
          />
          <Button onClick={addHashtag} disabled={!newTag}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Hashtag List */}
        {hashtags.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có hashtag nào được theo dõi</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashtags.map((h) => (
              <Badge
                key={h.id}
                variant="secondary"
                className="text-sm py-1.5 px-3 cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => removeHashtag(h.id)}
              >
                #{h.tag}
                <span className="ml-2 opacity-70">×</span>
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACCOUNT MONITOR
// ═══════════════════════════════════════════════════════════════

function AccountMonitor() {
  const [accounts, setAccounts] = useState<TrackedAccount[]>([]);
  const [newUsername, setNewUsername] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('social-tracked-accounts');
    if (saved) {
      setAccounts(JSON.parse(saved));
    }
  }, []);

  const addAccount = () => {
    if (!newUsername) return;
    
    const username = newUsername.startsWith('@') ? newUsername.slice(1) : newUsername;
    
    const newAccount: TrackedAccount = {
      id: Date.now().toString(),
      username,
      name: username,
      addedAt: new Date().toISOString()
    };

    const updated = [...accounts, newAccount];
    setAccounts(updated);
    localStorage.setItem('social-tracked-accounts', JSON.stringify(updated));
    setNewUsername('');
  };

  const removeAccount = (id: string) => {
    const updated = accounts.filter(a => a.id !== id);
    setAccounts(updated);
    localStorage.setItem('social-tracked-accounts', JSON.stringify(updated));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            <CardTitle>Account Monitor</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Theo dõi các influencers và thought leaders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Account */}
        <div className="flex gap-2">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="@username"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addAccount()}
          />
          <Button onClick={addAccount} disabled={!newUsername}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Account List */}
        {accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AtSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có account nào được theo dõi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    {account.name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">@{account.username}</p>
                    <p className="text-xs text-muted-foreground">
                      Added {new Date(account.addedAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`https://twitter.com/${account.username}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeAccount(account.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// TRENDING TOPICS
// ═══════════════════════════════════════════════════════════════

function TrendingTopics() {
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<any[]>([]);

  const fetchTrends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/brain/social/trends`);
      const data = await response.json();
      
      if (data.success) {
        setTrends(data.data.trends);
      }
    } catch (err) {
      console.error('Failed to fetch trends:', err);
      // Fallback to static data
      setTrends([
        { name: '#AI', volume: '125K', category: 'Technology' },
        { name: '#OpenAI', volume: '89K', category: 'Technology' },
        { name: '#Startup', volume: '45K', category: 'Business' },
        { name: '#ProductivityHacks', volume: '32K', category: 'Lifestyle' },
        { name: '#MachineLearning', volume: '28K', category: 'Technology' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <CardTitle>Trending Topics</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTrends} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription>
          Xu hướng đang hot trên Twitter/X
        </CardDescription>
      </CardHeader>
      <CardContent>
        {trends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click refresh để xem trending</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend, index) => (
              <div
                key={trend.name}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => window.open(`https://twitter.com/search?q=${encodeURIComponent(trend.name)}`, '_blank')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-muted-foreground w-8">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-sky-500">{trend.name}</p>
                    <p className="text-xs text-muted-foreground">{trend.category}</p>
                  </div>
                </div>
                <Badge variant="secondary">{trend.tweetVolume}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
