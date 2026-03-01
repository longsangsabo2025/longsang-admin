/**
 * News & Article Harvester
 * 
 * Features:
 * - RSS Feed Monitor - Auto-ingest from favorite sources
 * - Single Article Import - Paste any URL  
 * - Newsletter Parser - Forward emails to brain
 * - AI Summary & Key Points Extraction
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Newspaper,
  Search,
  Sparkles,
  Brain,
  Plus,
  ExternalLink,
  Clock,
  Rss,
  Link as LinkIcon,
  Mail,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Globe,
  BookOpen,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

interface ArticleData {
  url: string;
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
  siteName?: string;
  image?: string;
  excerpt?: string;
}

interface RssFeed {
  id: string;
  name: string;
  url: string;
  category: string;
  lastFetched?: string;
  articlesCount: number;
}

interface RssArticle {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  excerpt?: string;
  feedName: string;
}

interface NewsHarvesterProps {
  readonly selectedDomainId?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function NewsHarvester({ selectedDomainId }: NewsHarvesterProps) {
  const { data: domains } = useDomains();
  const ingestKnowledge = useIngestKnowledge();
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="article" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="article" className="flex flex-col items-center gap-1 py-3">
            <LinkIcon className="h-5 w-5" />
            <span className="text-xs">Single Article</span>
          </TabsTrigger>
          <TabsTrigger value="rss" className="flex flex-col items-center gap-1 py-3">
            <Rss className="h-5 w-5" />
            <span className="text-xs">RSS Feeds</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex flex-col items-center gap-1 py-3">
            <Clock className="h-5 w-5" />
            <span className="text-xs">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Single Article Import */}
        <TabsContent value="article">
          <SingleArticleImport 
            domains={domains || []} 
            selectedDomainId={selectedDomainId}
            ingestKnowledge={ingestKnowledge}
          />
        </TabsContent>

        {/* RSS Feeds */}
        <TabsContent value="rss">
          <RssFeedManager 
            domains={domains || []}
            selectedDomainId={selectedDomainId}
          />
        </TabsContent>

        {/* History */}
        <TabsContent value="history">
          <ArticleHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SINGLE ARTICLE IMPORT
// ═══════════════════════════════════════════════════════════════

function SingleArticleImport({ 
  domains, 
  selectedDomainId,
  ingestKnowledge 
}: { 
  domains: any[]; 
  selectedDomainId?: string | null;
  ingestKnowledge: any;
}) {
  const [articleUrl, setArticleUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(selectedDomainId || '');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch article content
  const fetchArticle = async () => {
    if (!articleUrl) return;
    
    setLoading(true);
    setError(null);
    setArticleData(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/brain/news/article/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: articleUrl })
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Không thể lấy nội dung bài viết');
      }
      
      setArticleData(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
    } finally {
      setLoading(false);
    }
  };

  // AI Analyze article
  const analyzeArticle = async () => {
    if (!articleData) return;
    
    setAnalyzing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/brain/news/article/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: articleData.title,
          content: articleData.content,
          url: articleData.url
        })
      });
      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.data);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Save to Brain
  const saveToBrain = async () => {
    if (!articleData || !selectedDomain) return;
    
    try {
      await ingestKnowledge.mutateAsync({
        domainId: selectedDomain,
        title: articleData.title,
        content: analysis?.knowledgeDocument || articleData.content,
        contentType: 'external',
        tags: analysis?.suggestedTags || ['article', 'news'],
        sourceUrl: articleData.url,
        metadata: {
          author: articleData.author,
          siteName: articleData.siteName,
          publishedAt: articleData.publishedAt,
          importedAt: new Date().toISOString(),
          aiAnalyzed: !!analysis
        }
      });
      
      setSuccess(true);
      
      // Save to history
      const history = JSON.parse(localStorage.getItem('news-import-history') || '[]');
      history.unshift({
        id: Date.now().toString(),
        url: articleData.url,
        title: articleData.title,
        siteName: articleData.siteName,
        importedAt: new Date().toISOString()
      });
      localStorage.setItem('news-import-history', JSON.stringify(history.slice(0, 100)));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu');
    }
  };

  const reset = () => {
    setArticleUrl('');
    setArticleData(null);
    setAnalysis(null);
    setSuccess(false);
    setError(null);
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-xl font-semibold">🎉 Import Thành Công!</h3>
            <p className="text-muted-foreground">"{articleData?.title}" đã được thêm vào Brain</p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={reset}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Import tiếp
              </Button>
              <Button variant="outline" asChild>
                <a href={articleData?.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Xem bài gốc
                </a>
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
            <LinkIcon className="h-5 w-5 text-blue-500" />
            <CardTitle>Import Single Article</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Paste URL bài viết → Extract nội dung → AI phân tích → Lưu vào Brain
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
          <Label>Article URL</Label>
          <div className="flex gap-2">
            <Input
              value={articleUrl}
              onChange={(e) => setArticleUrl(e.target.value)}
              placeholder="https://example.com/article..."
              className="flex-1"
              onKeyDown={(e) => e.key === 'Enter' && fetchArticle()}
            />
            <Button onClick={fetchArticle} disabled={!articleUrl || loading}>
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

        {/* Article Preview */}
        {articleData && (
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-4">
                {articleData.image && (
                  <img
                    src={articleData.image}
                    alt={articleData.title}
                    className="w-32 h-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-2">{articleData.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <Globe className="h-3 w-3" />
                    <span>{articleData.siteName || new URL(articleData.url).hostname}</span>
                    {articleData.author && (
                      <>
                        <span>•</span>
                        <span>{articleData.author}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {articleData.excerpt && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {articleData.excerpt}
                </p>
              )}

              <div className="text-xs text-muted-foreground">
                {articleData.content.length.toLocaleString()} characters
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={analyzeArticle} 
                  disabled={analyzing}
                  variant="secondary"
                  className="flex-1"
                >
                  {analyzing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang phân tích...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" />AI Phân Tích</>
                  )}
                </Button>
                <Button 
                  onClick={saveToBrain}
                  disabled={!selectedDomain || ingestKnowledge.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {ingestKnowledge.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Lưu vào Brain
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Results */}
        {analysis && (
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">📋 Tóm tắt:</span>
                <p className="text-muted-foreground mt-1">{analysis.summary}</p>
              </div>
              {analysis.keyInsights?.length > 0 && (
                <div>
                  <span className="font-medium">💡 Key Insights:</span>
                  <ul className="mt-1 space-y-1">
                    {analysis.keyInsights.slice(0, 5).map((insight: string, i: number) => (
                      <li key={i} className="text-muted-foreground flex items-start gap-2">
                        <span className="text-yellow-500">▸</span>
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {analysis.suggestedTags?.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// RSS FEED MANAGER
// ═══════════════════════════════════════════════════════════════

function RssFeedManager({ domains, selectedDomainId }: { domains: any[]; selectedDomainId?: string | null }) {
  const [feeds, setFeeds] = useState<RssFeed[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState('');
  const [newFeedName, setNewFeedName] = useState('');
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<RssArticle[]>([]);

  // Load saved feeds
  useEffect(() => {
    const saved = localStorage.getItem('rss-feeds');
    if (saved) {
      setFeeds(JSON.parse(saved));
    }
  }, []);

  // Add new feed
  const addFeed = () => {
    if (!newFeedUrl || !newFeedName) return;
    
    const newFeed: RssFeed = {
      id: Date.now().toString(),
      name: newFeedName,
      url: newFeedUrl,
      category: 'General',
      articlesCount: 0
    };
    
    const updated = [...feeds, newFeed];
    setFeeds(updated);
    localStorage.setItem('rss-feeds', JSON.stringify(updated));
    
    setNewFeedUrl('');
    setNewFeedName('');
  };

  // Remove feed
  const removeFeed = (feedId: string) => {
    const updated = feeds.filter(f => f.id !== feedId);
    setFeeds(updated);
    localStorage.setItem('rss-feeds', JSON.stringify(updated));
  };

  // Fetch feed articles
  const fetchFeedArticles = async (feed: RssFeed) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/brain/news/rss/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedUrl: feed.url, limit: 20 })
      });
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data.articles.map((article: any) => ({
          ...article,
          feedName: feed.name
        })));
      }
    } catch (err) {
      console.error('Failed to fetch RSS:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-orange-500" />
            <CardTitle>RSS Feed Manager</CardTitle>
          </div>
          <Badge variant="default" className="bg-green-500">Active</Badge>
        </div>
        <CardDescription>
          Theo dõi các nguồn tin yêu thích qua RSS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Feed */}
        <div className="space-y-2 p-4 rounded-lg border border-dashed">
          <Label>Thêm RSS Feed mới</Label>
          <div className="flex gap-2">
            <Input
              value={newFeedName}
              onChange={(e) => setNewFeedName(e.target.value)}
              placeholder="Tên feed (vd: TechCrunch)"
              className="w-40"
            />
            <Input
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="RSS URL..."
              className="flex-1"
            />
            <Button onClick={addFeed} disabled={!newFeedUrl || !newFeedName}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Ví dụ: https://techcrunch.com/feed/, https://news.ycombinator.com/rss
          </p>
        </div>

        {/* Feed List */}
        {feeds.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Rss className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có RSS feed nào</p>
            <p className="text-sm mt-1">Thêm feed để bắt đầu theo dõi tin tức</p>
          </div>
        ) : (
          <div className="space-y-2">
            {feeds.map((feed) => (
              <div
                key={feed.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Rss className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">{feed.name}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {feed.url}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fetchFeedArticles(feed)}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFeed(feed.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Articles from RSS */}
        {articles.length > 0 && (
          <div className="space-y-2 mt-4">
            <Label>Bài viết từ feed ({articles.length})</Label>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                  onClick={() => window.open(article.link, '_blank')}
                >
                  <p className="font-medium text-sm line-clamp-2">{article.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{article.feedName}</span>
                    <span>•</span>
                    <span>{new Date(article.pubDate).toLocaleDateString('vi-VN')}</span>
                  </div>
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
// ARTICLE HISTORY
// ═══════════════════════════════════════════════════════════════

function ArticleHistory() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('news-import-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <CardTitle>Import History</CardTitle>
          </div>
          <Badge variant="secondary">{history.length} articles</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có bài viết nào được import</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                onClick={() => window.open(item.url, '_blank')}
              >
                <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.siteName} • {new Date(item.importedAt).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
