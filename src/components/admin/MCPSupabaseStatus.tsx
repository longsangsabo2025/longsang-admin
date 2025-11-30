import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Database,
  Activity,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabaseStable } from '@/lib/supabase-stable';

interface MCPStatus {
  connected: boolean;
  loading: boolean;
  error?: string;
  tables?: number;
  projects?: number;
  lastChecked?: Date;
}

export function MCPSupabaseStatus() {
  const { toast } = useToast();
  const [status, setStatus] = useState<MCPStatus>({
    connected: false,
    loading: true,
  });

  const checkConnection = async () => {
    setStatus(prev => ({ ...prev, loading: true, error: undefined }));

    try {
      // Use stable client with retry logic
      // Test 1: Basic connection with retry
      const { data: projects, error: projectsError } = await supabaseStable
        .from('projects')
        .select('id, name')
        .limit(5);

      if (projectsError) {
        throw new Error(`Lỗi kết nối: ${projectsError.message}`);
      }

      // Test 2: Count tables (try to query different tables)
      let tableCount = 0;
      const tablesToCheck = ['projects', 'admin_settings', 'automation_agents', 'workflows', 'users'];

      for (const table of tablesToCheck) {
        try {
          const { error } = await supabaseStable.from(table).select('id').limit(1);
          if (!error) tableCount++;
        } catch {
          // Ignore individual table errors
        }
      }

      setStatus({
        connected: true,
        loading: false,
        tables: tableCount,
        projects: projects?.length || 0,
        lastChecked: new Date(),
      });

      toast({
        title: '✅ Kết nối thành công',
        description: 'MCP Supabase đã sẵn sàng sử dụng',
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';

      setStatus({
        connected: false,
        loading: false,
        error: errorMessage,
        lastChecked: new Date(),
      });

      toast({
        title: '❌ Lỗi kết nối',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    checkConnection();
    // Auto-refresh every 60 seconds
    const interval = setInterval(checkConnection, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>MCP Supabase Status</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={checkConnection}
            disabled={status.loading}
          >
            {status.loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
        <CardDescription>
          Trạng thái kết nối với Supabase qua MCP (Model Context Protocol)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Trạng thái kết nối:</span>
              {status.loading ? (
                <Badge variant="secondary">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Đang kiểm tra...
                </Badge>
              ) : status.connected ? (
                <Badge className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Đã kết nối
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Không kết nối
                </Badge>
              )}
            </div>
          </div>

          {/* Error Message */}
          {status.error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-700 dark:text-red-400">{status.error}</p>
              </div>
            </div>
          )}

          {/* Statistics */}
          {status.connected && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs text-muted-foreground">Bảng có thể truy cập</span>
                </div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {status.tables || 0}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs text-muted-foreground">Projects mẫu</span>
                </div>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {status.projects || 0}
                </p>
              </div>
            </div>
          )}

          {/* Last Checked */}
          {status.lastChecked && (
            <div className="text-xs text-muted-foreground">
              Kiểm tra lần cuối: {status.lastChecked.toLocaleTimeString('vi-VN')}
            </div>
          )}

          {/* MCP Info */}
          <div className="pt-4 border-t">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Project Reference:</span>
                <code className="text-xs bg-muted px-2 py-1 rounded">diexsbzqwsbpilsymnfb</code>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Supabase URL:</span>
                <a
                  href="https://diexsbzqwsbpilsymnfb.supabase.co"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Xem Dashboard
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {!status.connected && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Để sử dụng MCP Supabase với AI:
              </p>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Cấu hình MCP trong Cursor settings</li>
                <li>Restart Cursor để áp dụng cấu hình</li>
                <li>Hỏi AI: &quot;Liệt kê các bảng trong Supabase&quot;</li>
              </ol>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  window.open('/_DOCS/MCP_SUPABASE_QUICKSTART.md', '_blank');
                }}
              >
                Xem hướng dẫn cài đặt
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
