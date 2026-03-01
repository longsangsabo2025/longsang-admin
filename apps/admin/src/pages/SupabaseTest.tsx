import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
  Wifi,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface ConnectionTest {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: string;
}

export function SupabaseTest() {
  const [testing, setTesting] = useState(false);
  const [tests, setTests] = useState<ConnectionTest[]>([]);

  const updateTest = (
    name: string,
    status: ConnectionTest['status'],
    message: string,
    details?: string
  ) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name);
      if (existing) {
        return prev.map((t) => (t.name === name ? { name, status, message, details } : t));
      }
      return [...prev, { name, status, message, details }];
    });
  };

  const runTests = async () => {
    setTesting(true);
    setTests([]);

    // Test 1: Check environment variables
    updateTest('Environment', 'pending', 'Checking configuration...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      updateTest(
        'Environment',
        'error',
        'Missing Supabase credentials',
        `URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}`
      );
    } else {
      updateTest(
        'Environment',
        'success',
        'Configuration loaded',
        `URL: ${supabaseUrl.substring(0, 30)}...`
      );
    }

    // Test 2: Network connectivity
    updateTest('Network', 'pending', 'Testing network connection...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(supabaseUrl, {
        signal: controller.signal,
        method: 'HEAD',
      });

      clearTimeout(timeoutId);

      if (response.ok || response.status === 404) {
        updateTest('Network', 'success', 'Network connection OK', `Status: ${response.status}`);
      } else {
        updateTest('Network', 'error', 'Unexpected response', `Status: ${response.status}`);
      }
    } catch (error: any) {
      updateTest(
        'Network',
        'error',
        'Network error',
        error.message || 'Cannot reach Supabase server'
      );
    }

    // Test 3: Supabase client initialization
    updateTest('Client', 'pending', 'Checking Supabase client...');
    try {
      if (supabase) {
        updateTest('Client', 'success', 'Client initialized', 'Supabase client is ready');
      } else {
        updateTest(
          'Client',
          'error',
          'Client not initialized',
          'Supabase client is null or undefined'
        );
      }
    } catch (error: any) {
      updateTest('Client', 'error', 'Client error', error.message);
    }

    // Test 4: Database query
    updateTest('Database', 'pending', 'Testing database query...');
    try {
      const { data, error } = await supabase.from('contacts').select('id, name').limit(1);

      if (error) {
        updateTest('Database', 'error', 'Query failed', error.message);
      } else {
        updateTest('Database', 'success', 'Query successful', `Found ${data?.length || 0} records`);
      }
    } catch (error: any) {
      updateTest('Database', 'error', 'Query error', error.message);
    }

    // Test 5: Auth status
    updateTest('Auth', 'pending', 'Checking authentication...');
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        updateTest('Auth', 'error', 'Auth error', error.message);
      } else if (session) {
        updateTest('Auth', 'success', 'Authenticated', `User: ${session.user.email}`);
      } else {
        updateTest(
          'Auth',
          'success',
          'Not authenticated',
          'No active session (expected in dev mode)'
        );
      }
    } catch (error: any) {
      updateTest('Auth', 'error', 'Auth check failed', error.message);
    }

    setTesting(false);
  };

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const allSuccess = tests.length > 0 && tests.every((t) => t.status === 'success');
  const hasErrors = tests.some((t) => t.status === 'error');

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Supabase Connection Test
        </h1>
        <p className="text-muted-foreground">Diagnose connection issues with Supabase backend</p>
      </div>

      {/* Summary Alert */}
      {tests.length > 0 && (
        <Alert variant={allSuccess ? 'default' : hasErrors ? 'destructive' : 'default'}>
          {allSuccess ? (
            <Wifi className="h-4 w-4" />
          ) : hasErrors ? (
            <WifiOff className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {allSuccess
              ? '✅ All tests passed!'
              : hasErrors
                ? '❌ Connection issues detected'
                : 'Testing...'}
          </AlertTitle>
          <AlertDescription>
            {allSuccess
              ? 'Your Supabase connection is working correctly.'
              : hasErrors
                ? 'Some tests failed. Check the details below.'
                : 'Running diagnostic tests...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Test Button */}
      <Card>
        <CardHeader>
          <CardTitle>Run Diagnostics</CardTitle>
          <CardDescription>Click the button below to test your Supabase connection</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={testing} size="lg" className="w-full">
            {testing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running tests...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Connection Tests
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              {tests.filter((t) => t.status === 'success').length} / {tests.length} tests passed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {tests.map((test, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-semibold">{test.name}</h3>
                      <p className="text-sm text-muted-foreground">{test.message}</p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      test.status === 'success'
                        ? 'default'
                        : test.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {test.status}
                  </Badge>
                </div>
                {test.details && (
                  <div className="bg-muted p-3 rounded text-sm font-mono">{test.details}</div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Current Supabase settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Supabase URL:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {import.meta.env.VITE_SUPABASE_URL || 'Not set'}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">API Key:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded">
              {import.meta.env.VITE_SUPABASE_ANON_KEY
                ? '***' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-8)
                : 'Not set'}
            </code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Environment:</span>
            <Badge variant="outline">{import.meta.env.DEV ? 'Development' : 'Production'}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting */}
      {hasErrors && (
        <Card>
          <CardHeader>
            <CardTitle>🔧 Troubleshooting</CardTitle>
            <CardDescription>Common solutions for connection issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">❌ ERR_NAME_NOT_RESOLVED</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Check your internet connection</li>
                <li>Verify Supabase project URL is correct in .env file</li>
                <li>
                  Try accessing the URL in browser:{' '}
                  <code className="text-xs bg-muted px-1">{import.meta.env.VITE_SUPABASE_URL}</code>
                </li>
                <li>Check if your firewall is blocking the connection</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">❌ Query Failed</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Check if tables exist in Supabase dashboard</li>
                <li>Verify Row Level Security (RLS) policies</li>
                <li>
                  Run database migrations:{' '}
                  <code className="text-xs bg-muted px-1">supabase db reset</code>
                </li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">💡 Development Mode</h4>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>
                  Consider using local Supabase:{' '}
                  <code className="text-xs bg-muted px-1">supabase start</code>
                </li>
                <li>Or continue with dev bypass authentication for offline work</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
