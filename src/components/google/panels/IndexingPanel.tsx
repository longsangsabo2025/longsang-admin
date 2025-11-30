/**
 * Indexing Panel - SEO & URL Indexing Component
 * Submit URLs to Google for indexing
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Globe,
  TrendingUp,
  Link2
} from 'lucide-react';
import { submitUrlToGoogle, batchSubmitUrls, getIndexingStats } from '@/lib/google/indexing-api';
import { toast } from 'sonner';

export const IndexingPanel = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  
  const [singleUrl, setSingleUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [mode, setMode] = useState<'single' | 'batch'>('single');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getIndexingStats(30);
      setStats(data);
    } catch (error) {
      console.error('Error loading indexing stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitUrl = async () => {
    if (mode === 'single') {
      if (!singleUrl) {
        toast.error('Please enter a URL');
        return;
      }
      
      try {
        setSubmitting(true);
        await submitUrlToGoogle(singleUrl);
        toast.success('URL submitted to Google for indexing!');
        setSingleUrl('');
        await loadStats();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit URL');
      } finally {
        setSubmitting(false);
      }
    } else {
      if (!batchUrls) {
        toast.error('Please enter URLs');
        return;
      }
      
      const urls = batchUrls.split('\n').filter(url => url.trim());
      if (urls.length === 0) {
        toast.error('No valid URLs found');
        return;
      }

      try {
        setSubmitting(true);
        await batchSubmitUrls(urls);
        toast.success(`${urls.length} URLs submitted to Google!`);
        setBatchUrls('');
        await loadStats();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to submit URLs');
      } finally {
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Submitted</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.successful || 0}</div>
            <p className="text-xs text-muted-foreground">Indexed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.successRate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Indexing rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Submit URL Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Submit URLs for Indexing
          </CardTitle>
          <CardDescription>
            Submit URLs to Google for faster indexing (SEO)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={mode === 'single' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('single')}
            >
              <Link2 className="h-4 w-4 mr-2" />
              Single URL
            </Button>
            <Button 
              variant={mode === 'batch' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('batch')}
            >
              <Globe className="h-4 w-4 mr-2" />
              Batch URLs
            </Button>
          </div>

          {mode === 'single' ? (
            <div className="space-y-2">
              <Label htmlFor="singleUrl">URL to Index</Label>
              <Input
                id="singleUrl"
                type="url"
                placeholder="https://example.com/page"
                value={singleUrl}
                onChange={(e) => setSingleUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="batchUrls">URLs (one per line)</Label>
              <Textarea
                id="batchUrls"
                placeholder="https://example.com/page1&#10;https://example.com/page2&#10;https://example.com/page3"
                rows={6}
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {batchUrls.split('\n').filter(u => u.trim()).length} URLs entered
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmitUrl} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit to Google
                </>
              )}
            </Button>
            <Button variant="outline" onClick={loadStats} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      {stats?.recentLogs && stats.recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Submissions</CardTitle>
            <CardDescription>Last 10 URL submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{log.url}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()} • {log.action}
                    </div>
                  </div>
                  <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
