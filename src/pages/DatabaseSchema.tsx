import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Database, Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface TableInfo {
  name: string;
  exists: boolean;
  rowCount?: number;
  error?: string;
}

export function DatabaseSchema() {
  const [loading, setLoading] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);

  const expectedTables = [
    'contacts',
    'ai_agents',
    'automation_triggers',
    'workflows',
    'activity_logs',
    'content_queue',
  ];

  const checkDatabase = async () => {
    setLoading(true);
    const results: TableInfo[] = [];

    for (const tableName of expectedTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });

        if (error) {
          results.push({
            name: tableName,
            exists: false,
            error: error.message,
          });
        } else {
          results.push({
            name: tableName,
            exists: true,
            rowCount: count || 0,
          });
        }
      } catch (error: any) {
        results.push({
          name: tableName,
          exists: false,
          error: error.message,
        });
      }
    }

    setTables(results);
    setLoading(false);
  };

  const existingTables = tables.filter(t => t.exists);
  const missingTables = tables.filter(t => !t.exists);

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Database Schema Check
        </h1>
        <p className="text-muted-foreground">
          Verify database tables and structure
        </p>
      </div>

      {/* Check Button */}
      <Card>
        <CardHeader>
          <CardTitle>Check Database</CardTitle>
          <CardDescription>
            Verify which tables exist in your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkDatabase} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking database...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Database Structure
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {tables.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Existing Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{existingTables.length}</div>
              <p className="text-sm text-muted-foreground">
                out of {expectedTables.length} expected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Missing Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{missingTables.length}</div>
              <p className="text-sm text-muted-foreground">
                need to be created
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      {tables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Table Details</CardTitle>
            <CardDescription>
              Detailed information about each table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Table Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Row Count</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tables.map((table) => (
                  <TableRow key={table.name}>
                    <TableCell className="font-mono">{table.name}</TableCell>
                    <TableCell>
                      {table.exists ? (
                        <Badge variant="default" className="bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Exists
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" />
                          Missing
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.exists ? (
                        <span className="font-semibold">{table.rowCount}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {table.error ? (
                        <span className="text-xs text-red-600">{table.error}</span>
                      ) : (
                        <span className="text-xs text-green-600">OK</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Migration Instructions */}
      {missingTables.length > 0 && tables.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="text-orange-600">⚠️ Action Required</CardTitle>
            <CardDescription>
              Some tables are missing. You need to run migrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Missing Tables:</h3>
              <div className="flex flex-wrap gap-2">
                {missingTables.map(table => (
                  <Badge key={table.name} variant="outline" className="font-mono">
                    {table.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">How to fix:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Go to Supabase Dashboard: 
                  <code className="ml-2 text-xs bg-background px-2 py-1 rounded">
                    https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb
                  </code>
                </li>
                <li>Navigate to: <strong>SQL Editor</strong></li>
                <li>Copy migrations from: 
                  <code className="ml-2 text-xs bg-background px-2 py-1 rounded">
                    supabase/migrations/
                  </code>
                </li>
                <li>Run each migration file in order</li>
                <li>Or use Supabase CLI: 
                  <code className="ml-2 text-xs bg-background px-2 py-1 rounded">
                    supabase db push
                  </code>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {existingTables.length === expectedTables.length && tables.length > 0 && (
        <Card className="border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              ✅ Database is ready!
            </CardTitle>
            <CardDescription>
              All required tables exist. You can start using the application.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Total records:</strong> {tables.reduce((sum, t) => sum + (t.rowCount || 0), 0)}
              </p>
              <Button 
                onClick={() => window.location.href = '/automation'}
                className="w-full"
              >
                Go to Automation Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
