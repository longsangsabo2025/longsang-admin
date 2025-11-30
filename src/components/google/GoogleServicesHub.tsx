/**
 * Google Services Hub - Dashboard
 * Unified view for all Google services integration
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  BarChart3,
  TrendingUp,
  Users,
  Eye,
  MousePointerClick,
  RefreshCw,
  Settings,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  Zap,
  Activity,
  Mail,
  Calendar,
  Search,
  MapPin,
} from 'lucide-react';
import {
  getDashboardMetrics,
  getGoogleConfig,
  saveGoogleConfig,
  syncToGoogleSheets,
  generateDashboardReport,
  getSyncLogs,
  type DashboardMetrics,
  type GoogleServicesConfig,
  type SyncLog,
} from '@/lib/google/hub';
import { toast } from 'sonner';
import { GmailPanel, CalendarPanel, IndexingPanel, MapsPanel } from './panels';

export const GoogleServicesHub = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [config, setConfig] = useState<GoogleServicesConfig | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  // Setup form state
  const [setupForm, setSetupForm] = useState({
    analytics_property_id: '',
    analytics_enabled: true,
    sheets_auto_sync: false,
    reporting_spreadsheet_id: '',
    daily_sync_enabled: false,
    email_reports: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, configData, logs] = await Promise.all([
        getDashboardMetrics().catch(() => null),
        getGoogleConfig(),
        getSyncLogs(20),
      ]);

      setMetrics(metricsData);
      setConfig(configData);
      setSyncLogs(logs);
    } catch (error) {
      console.error('Error loading Google Services data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      toast.info('Starting sync to Google Sheets...');

      const result = await syncToGoogleSheets();

      toast.success(`Synced ${result.recordsSynced} records to Google Sheets`);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast.info('Generating dashboard report...');
      const result = await generateDashboardReport();
      toast.success('Dashboard report generated successfully');
      window.open(result.spreadsheetUrl, '_blank');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Report generation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Services Hub</h1>
            <p className="text-muted-foreground mt-1">Configure your Google services integration</p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Setup Google Services
            </CardTitle>
            <CardDescription>
              Configure Google Analytics, Sheets, and other services to get started
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Setup Form */}
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_id">Google Analytics Property ID (GA4)</Label>
                <Input
                  id="property_id"
                  placeholder="123456789"
                  value={setupForm.analytics_property_id}
                  onChange={(e) =>
                    setSetupForm((prev) => ({ ...prev, analytics_property_id: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Find this in Google Analytics 4: Admin → Property Settings → Property ID
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Analytics</Label>
                  <p className="text-xs text-muted-foreground">Fetch and display analytics data</p>
                </div>
                <Switch
                  checked={setupForm.analytics_enabled}
                  onCheckedChange={(checked) =>
                    setSetupForm((prev) => ({ ...prev, analytics_enabled: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-sync to Google Sheets</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically export data to Sheets
                  </p>
                </div>
                <Switch
                  checked={setupForm.sheets_auto_sync}
                  onCheckedChange={(checked) =>
                    setSetupForm((prev) => ({ ...prev, sheets_auto_sync: checked }))
                  }
                />
              </div>

              {setupForm.sheets_auto_sync && (
                <div className="space-y-2">
                  <Label htmlFor="spreadsheet_id">Reporting Spreadsheet ID</Label>
                  <Input
                    id="spreadsheet_id"
                    placeholder="1abc123..."
                    value={setupForm.reporting_spreadsheet_id}
                    onChange={(e) =>
                      setSetupForm((prev) => ({
                        ...prev,
                        reporting_spreadsheet_id: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Get this from the Google Sheets URL: /spreadsheets/d/[THIS_ID]/edit
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!setupForm.analytics_property_id) {
                    toast.error('Please enter your Google Analytics Property ID');
                    return;
                  }

                  setSaving(true);
                  try {
                    await saveGoogleConfig({
                      analytics_property_id: setupForm.analytics_property_id,
                      analytics_enabled: setupForm.analytics_enabled,
                      sheets_auto_sync: setupForm.sheets_auto_sync,
                      reporting_spreadsheet_id: setupForm.reporting_spreadsheet_id || null,
                      daily_sync_enabled: false,
                      email_reports: false,
                      search_console_enabled: false,
                      sync_time: '09:00',
                      report_recipients: [],
                    });
                    toast.success('Configuration saved! Loading dashboard...');
                    await loadData();
                  } catch (error) {
                    toast.error(
                      error instanceof Error ? error.message : 'Failed to save configuration'
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || !setupForm.analytics_property_id}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Activate Google Services
                  </>
                )}
              </Button>
            </div>

            {/* Quick Links */}
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Helpful Links:</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Analytics
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://search.google.com/search-console"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Search Console
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://docs.google.com/spreadsheets"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Google Sheets
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Service Account</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">✅ Configured</div>
              <p className="text-xs text-muted-foreground">
                automation-bot-102@long-sang-automation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">API Server</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-green-600">✅ Running</div>
              <p className="text-xs text-muted-foreground">localhost:3001</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Analytics</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-yellow-600">⏳ Setup Required</div>
              <p className="text-xs text-muted-foreground">Enter Property ID above</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Google Services Hub</h1>
          <p className="text-muted-foreground mt-1">
            Unified dashboard for Analytics, SEO, and automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSync} disabled={syncing || !config.sheets_auto_sync}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Sync to Sheets
          </Button>
          <Button
            variant="secondary"
            onClick={handleGenerateReport}
            disabled={!config.reporting_spreadsheet_id}
          >
            <Download className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.analytics.totalSessions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className={
                    metrics.analytics.comparison.sessionsChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {metrics.analytics.comparison.sessionsChange >= 0 ? '+' : ''}
                  {metrics.analytics.comparison.sessionsChange.toFixed(1)}%
                </span>{' '}
                from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.analytics.totalUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className={
                    metrics.analytics.comparison.usersChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {metrics.analytics.comparison.usersChange >= 0 ? '+' : ''}
                  {metrics.analytics.comparison.usersChange.toFixed(1)}%
                </span>{' '}
                from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.analytics.conversions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className={
                    metrics.analytics.comparison.conversionsChange >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }
                >
                  {metrics.analytics.comparison.conversionsChange >= 0 ? '+' : ''}
                  {metrics.analytics.comparison.conversionsChange.toFixed(1)}%
                </span>{' '}
                from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg SEO Position</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.seo.avgPosition.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {metrics.seo.topKeywords.length} keywords
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="seo">SEO Keywords</TabsTrigger>
          <TabsTrigger value="gmail">
            <Mail className="h-4 w-4 mr-2" />
            Gmail
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="indexing">
            <Search className="h-4 w-4 mr-2" />
            Indexing
          </TabsTrigger>
          <TabsTrigger value="maps">
            <MapPin className="h-4 w-4 mr-2" />
            Maps
          </TabsTrigger>
          <TabsTrigger value="sync">Sync Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Analytics Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Last 7 Days Analytics</CardTitle>
                <CardDescription>Sessions and users trend</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics?.analytics.last7Days.map((day, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="text-sm">{new Date(day.date).toLocaleDateString()}</span>
                    <div className="flex gap-4 text-sm">
                      <span>
                        <BarChart3 className="h-3 w-3 inline mr-1" />
                        {day.sessions}
                      </span>
                      <span>
                        <Users className="h-3 w-3 inline mr-1" />
                        {day.users}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Google Sheets Info */}
            <Card>
              <CardHeader>
                <CardTitle>Google Sheets Sync</CardTitle>
                <CardDescription>Reporting spreadsheet status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {config.reporting_spreadsheet_id ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Spreadsheet</span>
                      <a
                        href={metrics?.sheets.spreadsheetUrl || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Last Sync</span>
                      <span className="text-sm text-muted-foreground">
                        {metrics?.sheets.lastSyncTime
                          ? new Date(metrics.sheets.lastSyncTime).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Auto-Sync</span>
                      <Badge variant={config.sheets_auto_sync ? 'default' : 'secondary'}>
                        {config.sheets_auto_sync ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </>
                ) : (
                  <Alert>
                    <AlertDescription>
                      No reporting spreadsheet configured. Click "Sync to Sheets" to create one.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Traffic Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Top 5 traffic sources</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.traffic.sources.map((source, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium">{source.source}</div>
                        <div className="text-xs text-muted-foreground">
                          {source.sessions} sessions
                        </div>
                      </div>
                      <div className="text-sm font-bold">{source.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
                <CardDescription>Traffic by device type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.traffic.devices.map((device, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize">{device.device}</div>
                        <div className="text-xs text-muted-foreground">
                          {device.sessions} sessions
                        </div>
                      </div>
                      <div className="text-sm font-bold">{device.percentage.toFixed(1)}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SEO Tab */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top SEO Keywords</CardTitle>
              <CardDescription>Best performing keywords</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {metrics?.seo.topKeywords.map((keyword, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <div className="text-sm font-medium">{keyword.keyword}</div>
                      <div className="text-xs text-muted-foreground">{keyword.clicks} clicks</div>
                    </div>
                    <Badge variant={keyword.position <= 3 ? 'default' : 'secondary'}>
                      #{keyword.position.toFixed(0)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sync Logs Tab */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync History</CardTitle>
              <CardDescription>Last 20 sync operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {log.status === 'success' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {log.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                      {log.status === 'running' && (
                        <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                      )}
                      <div>
                        <div className="text-sm font-medium capitalize">{log.service}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          log.status === 'success'
                            ? 'default'
                            : log.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {log.status}
                      </Badge>
                      {log.records_synced > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.records_synced} records
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gmail Tab */}
        <TabsContent value="gmail" className="space-y-4">
          <GmailPanel />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          <CalendarPanel />
        </TabsContent>

        {/* Indexing Tab */}
        <TabsContent value="indexing" className="space-y-4">
          <IndexingPanel />
        </TabsContent>

        {/* Maps Tab */}
        <TabsContent value="maps" className="space-y-4">
          <MapsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
