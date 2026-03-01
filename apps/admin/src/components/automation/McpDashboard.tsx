import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Server,
  Zap,
  Database,
  Globe,
  CheckCircle,
  AlertCircle,
  XCircle,
  Activity,
  BarChart3,
  Settings,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface McpServer {
  id: string;
  name: string;
  description: string;
  url: string;
  status: 'connected' | 'disconnected' | 'error' | 'connecting';
  version: string;
  capabilities: string[];
  last_ping: string;
  created_at: string;
  metadata: Record<string, any>;
}

interface McpTool {
  id: string;
  server_id: string;
  name: string;
  description: string;
  input_schema: Record<string, any>;
  enabled: boolean;
  usage_count: number;
  last_used: string;
}

interface McpResource {
  id: string;
  server_id: string;
  uri: string;
  name: string;
  description: string;
  mime_type: string;
  size_bytes: number;
  last_accessed: string;
}

interface McpAnalytics {
  total_servers: number;
  active_servers: number;
  total_tools: number;
  total_executions: number;
  avg_response_time: number;
  success_rate: number;
}

// Mock API functions (replace with actual API calls)
const fetchMcpServers = async (): Promise<McpServer[]> => {
  // Simulate API call
  return [
    {
      id: 'server-1',
      name: 'OpenAI MCP Server',
      description: 'AI model access and text generation',
      url: 'mcp://localhost:3001',
      status: 'connected',
      version: '1.0.0',
      capabilities: ['text-generation', 'image-analysis', 'embeddings'],
      last_ping: new Date().toISOString(),
      created_at: '2025-11-01T00:00:00Z',
      metadata: { model_count: 5, rate_limit: 1000 },
    },
    {
      id: 'server-2',
      name: 'Database MCP Server',
      description: 'Supabase database operations',
      url: 'mcp://localhost:3002',
      status: 'connected',
      version: '1.0.0',
      capabilities: ['query', 'insert', 'update', 'delete'],
      last_ping: new Date().toISOString(),
      created_at: '2025-11-01T00:00:00Z',
      metadata: { tables: 12, connections: 5 },
    },
  ];
};

const fetchMcpTools = async (): Promise<McpTool[]> => {
  return [
    {
      id: 'tool-1',
      server_id: 'server-1',
      name: 'generate_text',
      description: 'Generate text using AI models',
      input_schema: { type: 'object', properties: { prompt: { type: 'string' } } },
      enabled: true,
      usage_count: 156,
      last_used: new Date().toISOString(),
    },
    {
      id: 'tool-2',
      server_id: 'server-2',
      name: 'query_database',
      description: 'Execute SQL queries on database',
      input_schema: { type: 'object', properties: { query: { type: 'string' } } },
      enabled: true,
      usage_count: 89,
      last_used: new Date().toISOString(),
    },
  ];
};

const fetchMcpResources = async (): Promise<McpResource[]> => {
  return [
    {
      id: 'resource-1',
      server_id: 'server-1',
      uri: 'mcp://models/gpt-4',
      name: 'GPT-4 Model',
      description: 'OpenAI GPT-4 language model',
      mime_type: 'application/json',
      size_bytes: 0,
      last_accessed: new Date().toISOString(),
    },
  ];
};

const fetchMcpAnalytics = async (): Promise<McpAnalytics> => {
  return {
    total_servers: 2,
    active_servers: 2,
    total_tools: 8,
    total_executions: 1247,
    avg_response_time: 125,
    success_rate: 98.5,
  };
};

export function McpDashboard() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: servers, isLoading: serversLoading } = useQuery({
    queryKey: ['mcp-servers'],
    queryFn: fetchMcpServers,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: tools, isLoading: toolsLoading } = useQuery({
    queryKey: ['mcp-tools'],
    queryFn: fetchMcpTools,
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['mcp-resources'],
    queryFn: fetchMcpResources,
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['mcp-analytics'],
    queryFn: fetchMcpAnalytics,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const refreshAll = async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['mcp-'] });
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'connecting':
        return <Activity className="w-4 h-4 text-yellow-600 animate-pulse" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'connecting':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">MCP Dashboard</h2>
          <p className="text-muted-foreground">
            Model Context Protocol server management and monitoring
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refreshAll} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.total_servers}</div>
              <p className="text-sm text-muted-foreground">Total Servers</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.active_servers}</div>
              <p className="text-sm text-muted-foreground">Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.total_tools}</div>
              <p className="text-sm text-muted-foreground">Available Tools</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {analytics.total_executions.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Executions</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {analytics.avg_response_time}ms
              </div>
              <p className="text-sm text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">{analytics.success_rate}%</div>
              <p className="text-sm text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="servers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="servers" className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            Servers
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Resources
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Servers Tab */}
        <TabsContent value="servers" className="space-y-4">
          <div className="grid gap-4">
            {serversLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Loading servers...</span>
                  </div>
                </CardContent>
              </Card>
            ) : servers?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">No MCP Servers</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by adding your first MCP server
                  </p>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add MCP Server
                  </Button>
                </CardContent>
              </Card>
            ) : (
              servers?.map((server) => (
                <Card key={server.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(server.status)}
                        <div>
                          <CardTitle className="text-lg">{server.name}</CardTitle>
                          <CardDescription>{server.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(server.status)}>{server.status}</Badge>
                        <Badge variant="outline">v{server.version}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="w-4 h-4" />
                        <span>{server.url}</span>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Capabilities</h4>
                        <div className="flex flex-wrap gap-2">
                          {server.capabilities.map((capability) => (
                            <Badge key={capability} variant="secondary">
                              {capability}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Last ping:</span>
                          <div>{new Date(server.last_ping).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span>
                          <div>{new Date(server.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                        <Button variant="outline" size="sm">
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-4">
            {toolsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Loading tools...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              tools?.map((tool) => (
                <Card key={tool.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <CardDescription>{tool.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={tool.enabled ? 'default' : 'secondary'}>
                          {tool.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {tool.usage_count} uses
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Server:</span>
                        <span className="ml-2">
                          {servers?.find((s) => s.id === tool.server_id)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Last used:</span>
                        <span className="ml-2">{new Date(tool.last_used).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4">
            {resourcesLoading ? (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Loading resources...</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              resources?.map((resource) => (
                <Card key={resource.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{resource.name}</CardTitle>
                        <CardDescription>{resource.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{resource.mime_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">URI:</span>
                        <span className="ml-2 font-mono">{resource.uri}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Server:</span>
                        <span className="ml-2">
                          {servers?.find((s) => s.id === resource.server_id)?.name || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last accessed:</span>
                        <span className="ml-2">
                          {new Date(resource.last_accessed).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
                <CardDescription>Overall MCP execution success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-medium">{analytics?.success_rate}%</span>
                  </div>
                  <Progress value={analytics?.success_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
                <CardDescription>Average response time across all servers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {analytics?.avg_response_time}ms
                </div>
                <p className="text-sm text-muted-foreground">Average response time</p>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <BarChart3 className="h-4 w-4" />
            <AlertDescription>
              Detailed analytics and monitoring charts will be available in the next update. Current
              metrics are updated in real-time.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
