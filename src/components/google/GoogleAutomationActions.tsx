/**
 * Google Automation Actions Page
 * Trigger automation workflows: SEO, Email, Calendar, Drive
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Search,
  Mail,
  Calendar,
  FolderOpen,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  runAllAutomations,
  runDailyAutomation,
  handleNewBlogPost,
  getAutomationStats,
  testAllConnections,
  type AutomationConfig,
  type AutomationResult,
} from '@/lib/google/automation-master';

export const GoogleAutomationActions = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AutomationResult[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Default config (should be loaded from database)
  const defaultConfig: AutomationConfig = {
    siteUrl: 'https://longsang.com',
    fromEmail: 'noreply@longsang.com',
    calendarEmail: 'calendar@longsang.com',
    driveEmail: 'drive@longsang.com',
    enableAutoIndexing: true,
    enableAutoEmails: true,
    enableAutoCalendar: true,
    enableAutoDrive: true,
  };

  const handleRunAll = async () => {
    try {
      setRunning(true);
      setResults([]);
      toast.info('Running all automations...');

      const automationResults = await runAllAutomations(defaultConfig);
      setResults(automationResults);

      const successCount = automationResults.filter(r => r.status === 'success').length;
      toast.success(`Completed: ${successCount}/${automationResults.length} successful`);

      // Reload stats
      await loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Automation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRunDaily = async () => {
    try {
      setRunning(true);
      setResults([]);
      toast.info('Running daily automation...');

      const result = await runDailyAutomation(defaultConfig);
      setResults(result.results || []);

      toast.success(result.message);
      await loadStats();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Daily automation failed');
    } finally {
      setRunning(false);
    }
  };

  const handleTestConnections = async () => {
    try {
      setRunning(true);
      toast.info('Testing all connections...');

      const testResults = await testAllConnections(defaultConfig);
      setResults(testResults);

      const allSuccess = testResults.every(r => r.status === 'success');
      if (allSuccess) {
        toast.success('All connections OK!');
      } else {
        toast.error('Some connections failed. Check results below.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setRunning(false);
    }
  };

  const loadStats = async () => {
    try {
      const automationStats = await getAutomationStats(7);
      setStats(automationStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // Load stats on mount
  useState(() => {
    loadStats();
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Zap className="h-8 w-8 text-yellow-500" />
          Google Automation Actions
        </h1>
        <p className="text-muted-foreground mt-2">
          Trigger automation workflows to take action on the internet
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button
          size="lg"
          onClick={handleRunAll}
          disabled={running}
          className="h-auto py-6 flex-col gap-2"
        >
          {running ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <Play className="h-6 w-6" />
          )}
          <div>
            <div className="font-bold">Run All Automations</div>
            <div className="text-xs opacity-80">SEO + Email + Calendar + Drive</div>
          </div>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleRunDaily}
          disabled={running}
          className="h-auto py-6 flex-col gap-2"
        >
          <Clock className="h-6 w-6" />
          <div>
            <div className="font-bold">Daily Automation</div>
            <div className="text-xs opacity-80">Scheduled daily tasks</div>
          </div>
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={handleTestConnections}
          disabled={running}
          className="h-auto py-6 flex-col gap-2"
        >
          <CheckCircle2 className="h-6 w-6" />
          <div>
            <div className="font-bold">Test Connections</div>
            <div className="text-xs opacity-80">Verify all APIs</div>
          </div>
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-500" />
                SEO Indexing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.indexing.urls}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.indexing.successful}/{stats.indexing.total} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-green-500" />
                Email Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.email.successful}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.email.total} total attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-500" />
                Calendar Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.calendar.events}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.calendar.successful} created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-orange-500" />
                Drive Files
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.drive.files}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.drive.successful} uploaded
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Individual Services */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SEO Indexing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              SEO Indexing
            </CardTitle>
            <CardDescription>
              Submit URLs to Google, request re-crawl, manage sitemaps
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Auto-index new posts
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Re-crawl updated pages
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <TrendingUp className="h-4 w-4 mr-2" />
              Submit sitemap
            </Button>
          </CardContent>
        </Card>

        {/* Email Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-500" />
              Email Automation
            </CardTitle>
            <CardDescription>
              Send emails via Gmail API to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Mail className="h-4 w-4 mr-2" />
              Send consultation confirmations
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Mail className="h-4 w-4 mr-2" />
              Send welcome emails
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Mail className="h-4 w-4 mr-2" />
              Send newsletters
            </Button>
          </CardContent>
        </Card>

        {/* Calendar Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Calendar Automation
            </CardTitle>
            <CardDescription>
              Create events, send invites to customers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Calendar className="h-4 w-4 mr-2" />
              Auto-create consultation events
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Calendar className="h-4 w-4 mr-2" />
              Sync reschedules
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <Calendar className="h-4 w-4 mr-2" />
              Check availability
            </Button>
          </CardContent>
        </Card>

        {/* Drive Automation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-orange-500" />
              Drive Automation
            </CardTitle>
            <CardDescription>
              Upload files, create shareable links
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Auto-upload contracts
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Organize files by date
            </Button>
            <Button variant="outline" className="w-full justify-start" disabled={running}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Share files
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Automation Results</CardTitle>
            <CardDescription>Latest execution results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => (
                <Alert
                  key={index}
                  variant={result.status === 'success' ? 'default' : 'destructive'}
                >
                  <div className="flex items-center gap-2">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : result.status === 'error' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.service}</div>
                      <AlertDescription className="mt-1">
                        {result.message}
                      </AlertDescription>
                    </div>
                    <Badge variant={result.status === 'success' ? 'default' : 'destructive'}>
                      {result.status}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
