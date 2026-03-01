import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import GoogleKeepAPI from '@/lib/api/google-keep';
import NotionAPI from '@/lib/api/notion';
import { BookOpen, CheckCircle2, Copy, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IdeaIntegrationsProps {
  readonly ideaId: string;
  readonly idea?: {
    readonly title: string;
    readonly content?: string | null;
    readonly category?: string;
    readonly priority?: string;
    readonly tags?: readonly string[];
  };
  readonly onSync?: () => void;
}

export function IdeaIntegrations({ ideaId, idea, onSync }: IdeaIntegrationsProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [notionApiKey, setNotionApiKey] = useState<string | null>(null);
  const [notionDatabaseId, setNotionDatabaseId] = useState<string | null>(null);
  const [showNotionDialog, setShowNotionDialog] = useState(false);
  // Get API key from environment variable (secure) or localStorage
  const DEFAULT_NOTION_API_KEY = import.meta.env.VITE_NOTION_API_KEY || '';

  const [tempNotionKey, setTempNotionKey] = useState('');
  const [tempNotionDbId, setTempNotionDbId] = useState('');

  // Load Notion config from localStorage
  useEffect(() => {
    const apiKey = localStorage.getItem('notion_api_key') || DEFAULT_NOTION_API_KEY;
    const dbId = localStorage.getItem('notion_database_id');

    // Auto-set default API key if not configured
    if (!localStorage.getItem('notion_api_key')) {
      localStorage.setItem('notion_api_key', DEFAULT_NOTION_API_KEY);
    }

    if (apiKey) {
      setNotionApiKey(apiKey);
    }
    if (dbId) {
      setNotionDatabaseId(dbId);
    }
  }, []);

  // Load existing integrations
  useEffect(() => {
    loadIntegrations();
  }, [ideaId]);

  const loadIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_idea_integrations')
        .select('*')
        .eq('idea_id', ideaId);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error: any) {
      console.error('Error loading integrations:', error);
    }
  };

  // Sync to Notion
  const handleNotionSync = async () => {
    if (!idea) {
      toast({
        title: 'Error',
        description: 'Idea data is required for syncing',
        variant: 'destructive',
      });
      return;
    }

    // Check if API key is set
    if (!notionApiKey) {
      setShowNotionDialog(true);
      return;
    }

    setSyncing('notion');
    setLoading(true);

    try {
      const notionAPI = new NotionAPI(notionApiKey, notionDatabaseId || undefined);
      const result = await notionAPI.syncIdea(idea);

      // Save integration record
      const { error } = await supabase.from('admin_idea_integrations').upsert(
        {
          idea_id: ideaId,
          integration_type: 'notion',
          external_id: result.id,
          external_url: result.url,
          metadata: {
            synced_at: new Date().toISOString(),
            title: idea.title,
            database_id: notionDatabaseId,
          },
        },
        {
          onConflict: 'idea_id,integration_type',
        }
      );

      if (error) throw error;

      toast({
        title: 'Synced to Notion! 📝',
        description: 'Your idea has been saved to Notion',
      });

      loadIntegrations();
      onSync?.();
    } catch (error: any) {
      toast({
        title: 'Error syncing to Notion',
        description: error.message || 'Failed to sync. Check your API key and database ID.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSyncing(null);
    }
  };

  // Save Notion config
  const handleSaveNotionConfig = () => {
    const apiKeyToSave = tempNotionKey.trim() || DEFAULT_NOTION_API_KEY;

    localStorage.setItem('notion_api_key', apiKeyToSave);
    localStorage.setItem('notion_database_id', tempNotionDbId || '');
    setNotionApiKey(apiKeyToSave);
    setNotionDatabaseId(tempNotionDbId || null);
    setShowNotionDialog(false);
    setTempNotionKey('');
    setTempNotionDbId('');

    toast({
      title: 'Notion config saved! ✅',
      description: 'API key đã được lưu. Bạn có thể sync ideas ngay!',
    });
  };

  // Auto-fill default API key when dialog opens
  useEffect(() => {
    if (showNotionDialog && !tempNotionKey && !notionApiKey) {
      setTempNotionKey(DEFAULT_NOTION_API_KEY);
    }
  }, [showNotionDialog, tempNotionKey, notionApiKey]);

  // Sync to Google Keep (simplified - copy to clipboard)
  const handleGoogleKeepSync = async () => {
    if (!idea) {
      toast({
        title: 'Error',
        description: 'Idea data is required',
        variant: 'destructive',
      });
      return;
    }

    setSyncing('google-keep');
    setLoading(true);

    try {
      const keepAPI = new GoogleKeepAPI();
      const result = await keepAPI.syncIdea(idea);

      // Save integration record
      const { error } = await supabase.from('admin_idea_integrations').upsert(
        {
          idea_id: ideaId,
          integration_type: 'google-keep',
          external_id: result.id,
          external_url: result.url,
          metadata: {
            synced_at: new Date().toISOString(),
            title: idea.title,
            method: 'copy-to-clipboard',
          },
        },
        {
          onConflict: 'idea_id,integration_type',
        }
      );

      if (error) throw error;

      // Open Keep in new tab
      globalThis.open(result.url, '_blank');

      toast({
        title: 'Copied to clipboard! 📌',
        description: 'Text copied! Paste into Google Keep. Keep tab opened.',
      });

      loadIntegrations();
      onSync?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setSyncing(null);
    }
  };

  // Check sync status
  const hasGoogleKeepSync = integrations.some((i) => i.integration_type === 'google-keep');
  const hasNotionSync = integrations.some((i) => i.integration_type === 'notion');

  return (
    <div className="space-y-2">
      {/* Notion Config Dialog */}
      <Dialog open={showNotionDialog} onOpenChange={setShowNotionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Notion Integration</DialogTitle>
            <DialogDescription>
              Enter your Notion API key and optional database ID to sync ideas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Step-by-step Guide */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-sm">📝 Hướng dẫn lấy Notion API Key:</h4>
              <ol className="text-xs space-y-2 list-decimal list-inside text-muted-foreground">
                <li>
                  Truy cập{' '}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    notion.so/my-integrations
                  </a>
                </li>
                <li>
                  Click <strong>"+ New integration"</strong>
                </li>
                <li>
                  Đặt tên: <strong>"LongSang Ideas Sync"</strong>
                </li>
                <li>Chọn workspace của bạn</li>
                <li>
                  Click <strong>"Submit"</strong>
                </li>
                <li>
                  Copy <strong>"Internal Integration Token"</strong> (bắt đầu với{' '}
                  <code className="bg-white dark:bg-gray-800 px-1 rounded">secret_</code>)
                </li>
              </ol>
            </div>

            <div>
              <Label htmlFor="notion-key">Notion API Key (Internal Integration Secret) *</Label>
              <Input
                id="notion-key"
                type="password"
                placeholder="ntn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={tempNotionKey}
                onChange={(e) => setTempNotionKey(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format: <code className="bg-muted px-1 rounded">ntn_...</code> hoặc{' '}
                <code className="bg-muted px-1 rounded">secret_...</code>
              </p>
              {tempNotionKey === DEFAULT_NOTION_API_KEY && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✅ Đã tự động điền API key mặc định
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="notion-db">Database ID (Optional - Recommended)</Label>
              <Input
                id="notion-db"
                placeholder="abc123def456..."
                value={tempNotionDbId}
                onChange={(e) => setTempNotionDbId(e.target.value)}
                className="mt-1 font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground mt-1 space-y-1">
                <p>
                  <strong>Cách lấy Database ID:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>
                    Tạo database trong Notion (type{' '}
                    <code className="bg-muted px-1 rounded">/database</code>)
                  </li>
                  <li>Share database với integration bạn vừa tạo</li>
                  <li>
                    Copy ID từ URL (phần giữa{' '}
                    <code className="bg-muted px-1 rounded">notion.so/</code> và{' '}
                    <code className="bg-muted px-1 rounded">?</code>)
                  </li>
                </ol>
                <p className="mt-2">
                  <strong>Ví dụ URL:</strong>{' '}
                  <code className="bg-muted px-1 rounded text-xs">
                    https://notion.so/abc123def456?v=...
                  </code>{' '}
                  → ID: <code className="bg-muted px-1 rounded">abc123def456</code>
                </p>
                <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  💡 <strong>Tip:</strong> Database ID thường là UUID format (32 ký tự) hoặc bắt đầu
                  với <code>ntn_</code>
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => globalThis.open('https://www.notion.so/my-integrations', '_blank')}
                className="text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Open Notion Integrations
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Open guide in new tab
                  const guidePath =
                    globalThis.location.origin + '/_DOCS/02-FEATURES/NOTION_INTEGRATION_GUIDE.md';
                  globalThis.open(guidePath, '_blank');
                }}
                className="text-xs"
              >
                <BookOpen className="h-3 w-3 mr-1" />
                Full Guide
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNotionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNotionConfig} disabled={!tempNotionKey.trim()}>
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sync Status */}
      <div className="space-y-1">
        {hasNotionSync && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">Synced to Notion</span>
            {integrations.find((i) => i.integration_type === 'notion')?.external_url && (
              <a
                href={integrations.find((i) => i.integration_type === 'notion')?.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
        {hasGoogleKeepSync && (
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="text-muted-foreground">Copied to Keep</span>
            {integrations.find((i) => i.integration_type === 'google-keep')?.external_url && (
              <a
                href={integrations.find((i) => i.integration_type === 'google-keep')?.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Sync Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleNotionSync}
          disabled={loading || syncing === 'notion'}
          className="text-xs h-7"
        >
          {syncing === 'notion' ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <FileText className="h-3 w-3 mr-1" />
          )}
          {syncing === 'notion' ? 'Syncing...' : 'Notion'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={handleGoogleKeepSync}
          disabled={loading || syncing === 'google-keep'}
          className="text-xs h-7"
        >
          {syncing === 'google-keep' ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Copy className="h-3 w-3 mr-1" />
          )}
          {syncing === 'google-keep' ? 'Copying...' : 'Keep'}
        </Button>
      </div>

      {/* Config Status */}
      {notionApiKey && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>Notion configured</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('notion_api_key');
              localStorage.removeItem('notion_database_id');
              setNotionApiKey(null);
              setNotionDatabaseId(null);
              toast({
                title: 'Notion config removed',
                description: 'You can reconfigure anytime',
              });
            }}
            className="h-5 text-xs px-1"
          >
            Reset
          </Button>
        </div>
      )}
    </div>
  );
}
