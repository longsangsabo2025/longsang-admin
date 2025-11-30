/**
 * =================================================================
 * BACKUP MANAGER COMPONENT
 * =================================================================
 * UI for managing backups - view history, trigger manual backup
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { API_URL } from '@/config/api';
import {
  Database,
  HardDrive,
  Cloud,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Download,
  ExternalLink,
  FolderArchive,
} from 'lucide-react';

interface BackupRecord {
  id: string;
  type: 'database' | 'files';
  timestamp: string;
  status: 'success' | 'failed';
  tables?: string[];
  files?: Array<{ table: string; filename: string; link: string }>;
  error?: string;
  description?: string;
  link?: string;
}

interface BackupStatus {
  backupFolder: { id: string; name: string };
  recentBackups: Array<{ id: string; name: string; modifiedTime: string }>;
  storage: { limit: string; usage: string; usageInDrive: string };
  lastBackup: BackupRecord | null;
}

const DEFAULT_TABLES = [
  'projects',
  'project_social_accounts',
  'social_posts',
  'profiles',
  'credentials',
];

export function BackupManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [history, setHistory] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>(DEFAULT_TABLES.slice(0, 3));

  // Load backup status
  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/backup/status`);
      const data = await res.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  }, []);

  // Load backup history
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/backup/history?limit=10`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Failed to load backup history:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([loadStatus(), loadHistory()]).finally(() => setLoading(false));
  }, [loadStatus, loadHistory]);

  // Trigger backup
  const triggerBackup = async (type: 'database' | 'files') => {
    setBacking(true);
    try {
      const res = await fetch(`${API_URL}/backup/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: type === 'database' ? selectedTables : undefined,
          description: type === 'files' ? 'Manual file backup from admin' : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: '✅ Backup thành công!',
          description: `${type === 'database' ? 'Database' : 'Files'} đã được backup lên Drive`,
        });
        // Reload data
        await Promise.all([loadStatus(), loadHistory()]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: '❌ Backup thất bại',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setBacking(false);
    }
  };

  // Toggle table selection
  const toggleTable = (table: string) => {
    setSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  // Format bytes
  const formatBytes = (bytes: string | number): string => {
    const b = typeof bytes === 'string' ? Number.parseInt(bytes) : bytes;
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
    return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Format date
  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FolderArchive className="h-6 w-6" />
            Backup Manager
          </h2>
          <p className="text-muted-foreground">Backup dữ liệu lên Google Drive</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadStatus();
            loadHistory();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Cloud className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Drive Storage</p>
              <p className="text-lg font-bold">
                {status?.storage ? formatBytes(status.storage.usage) : 'N/A'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Database className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Recent Backups</p>
              <p className="text-lg font-bold">{status?.recentBackups?.length || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Last Backup</p>
              <p className="text-sm font-medium">
                {status?.lastBackup ? formatDate(status.lastBackup.timestamp) : 'Never'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Backup Actions */}
      <div className="grid grid-cols-2 gap-4">
        {/* Database Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Backup
            </CardTitle>
            <CardDescription>Backup các tables từ Supabase lên Drive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Chọn tables:</Label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_TABLES.map((table) => (
                  <div key={table} className="flex items-center gap-2">
                    <Checkbox
                      id={table}
                      checked={selectedTables.includes(table)}
                      onCheckedChange={() => toggleTable(table)}
                    />
                    <Label htmlFor={table} className="text-sm cursor-pointer">
                      {table}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <Button
              className="w-full"
              onClick={() => triggerBackup('database')}
              disabled={backing || selectedTables.length === 0}
            >
              {backing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Backup Now
            </Button>
          </CardContent>
        </Card>

        {/* Files Backup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Files Backup
            </CardTitle>
            <CardDescription>Backup manifest và metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tạo file manifest chứa thông tin backup. Actual file backup cần được cấu hình riêng.
            </p>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => triggerBackup('files')}
              disabled={backing}
            >
              {backing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Create Manifest
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>Lịch sử các lần backup gần đây</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có backup nào</p>
          ) : (
            <div className="space-y-2">
              {history.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    {record.status === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{record.type}</span>
                        <Badge variant={record.status === 'success' ? 'default' : 'destructive'}>
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(record.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {record.tables && (
                      <span className="text-sm text-muted-foreground">
                        {record.tables.length} tables
                      </span>
                    )}
                    {record.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(record.link, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drive Folder Link */}
      {status?.backupFolder && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{status.backupFolder.name}</p>
                  <p className="text-sm text-muted-foreground">Google Drive Backup Folder</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(
                    `https://drive.google.com/drive/folders/${status.backupFolder.id}`,
                    '_blank'
                  )
                }
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BackupManager;
