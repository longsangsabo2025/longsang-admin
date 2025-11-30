import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, RefreshCw, CheckCircle2, XCircle, Play, 
  Zap, Clock, ExternalLink, Copy, Search, Filter,
  Workflow, Bot, Settings2, Terminal, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

interface WorkflowTestResult {
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
  executionTime?: number;
}

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const WorkflowTester = () => {
  const [results, setResults] = useState<{ [key: string]: WorkflowTestResult }>({});
  const [n8nWorkflows, setN8nWorkflows] = useState<N8nWorkflow[]>([]);
  const [n8nStatus, setN8nStatus] = useState<'online' | 'offline' | 'loading'>('loading');
  const [fetchingWorkflows, setFetchingWorkflows] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [customPayloads, setCustomPayloads] = useState<{ [key: string]: string }>({});

  // Predefined workflow templates
  const workflowTemplates = [
    {
      id: 'simple-test',
      name: 'Simple Test',
      icon: '🧪',
      webhookPath: 'simple-test',
      description: 'Echo test - xác nhận kết nối n8n',
      category: 'Test',
      defaultPayload: { test: 'hello', source: 'admin' }
    },
    {
      id: 'content-writer',
      name: 'Content Writer',
      icon: '✍️',
      webhookPath: 'content-writer',
      description: 'Tạo nội dung với AI',
      category: 'AI',
      defaultPayload: { topic: 'AI trends', type: 'blog', tone: 'professional' }
    },
    {
      id: 'lead-nurture',
      name: 'Lead Nurture',
      icon: '🎯',
      webhookPath: 'lead-nurture',
      description: 'Chăm sóc lead tự động',
      category: 'Marketing',
      defaultPayload: { lead_email: 'test@example.com', stage: 'awareness' }
    },
    {
      id: 'email-campaign',
      name: 'Email Campaign',
      icon: '📧',
      webhookPath: 'email-campaign',
      description: 'Gửi email marketing',
      category: 'Marketing',
      defaultPayload: { campaign: 'weekly-newsletter', audience: 'subscribers' }
    },
    {
      id: 'data-sync',
      name: 'Data Sync',
      icon: '🔄',
      webhookPath: 'data-sync',
      description: 'Đồng bộ dữ liệu giữa các hệ thống',
      category: 'Integration',
      defaultPayload: { source: 'crm', target: 'analytics', full_sync: false }
    },
    {
      id: 'report-generator',
      name: 'Report Generator',
      icon: '📊',
      webhookPath: 'report-generator',
      description: 'Tạo báo cáo tự động',
      category: 'Analytics',
      defaultPayload: { report_type: 'weekly', format: 'pdf' }
    }
  ];

  useEffect(() => {
    checkN8nStatus();
    fetchN8nWorkflows();
  }, []);

  const checkN8nStatus = async () => {
    setN8nStatus('loading');
    try {
      const response = await fetch(`${API_BASE}/api/n8n/status`);
      const data = await response.json();
      // API returns { status: { running: true } }
      const isRunning = data.status?.running || data.running;
      setN8nStatus(isRunning ? 'online' : 'offline');
    } catch {
      setN8nStatus('offline');
    }
  };

  const fetchN8nWorkflows = async () => {
    setFetchingWorkflows(true);
    try {
      const response = await fetch(`${API_BASE}/api/n8n/workflows/list`);
      if (response.ok) {
        const data = await response.json();
        setN8nWorkflows(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch n8n workflows:', error);
    } finally {
      setFetchingWorkflows(false);
    }
  };

  const executeWorkflow = async (workflowId: string, webhookPath: string, payload: any) => {
    setResults(prev => ({ ...prev, [workflowId]: { status: 'loading' } }));

    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE}/api/n8n/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_path: webhookPath, data: payload })
      });

      const data = await response.json();
      const executionTime = Date.now() - startTime;
      
      setResults(prev => ({
        ...prev,
        [workflowId]: {
          status: data.success ? 'success' : 'error',
          data: data.success ? data.result : undefined,
          error: data.success ? undefined : data.error || 'Request failed',
          executionTime
        }
      }));

      if (data.success) {
        toast.success(`✅ Workflow executed in ${executionTime}ms`);
      } else {
        toast.error(`❌ ${data.error || 'Execution failed'}`);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      setResults(prev => ({
        ...prev,
        [workflowId]: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Network error',
          executionTime
        }
      }));
      toast.error('❌ Network error - Is API server running?');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const toggleCard = (id: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getPayload = (workflow: any) => {
    if (customPayloads[workflow.id]) {
      try {
        return JSON.parse(customPayloads[workflow.id]);
      } catch {
        return workflow.defaultPayload;
      }
    }
    return workflow.defaultPayload;
  };

  // Filter workflows
  const filteredTemplates = workflowTemplates.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredN8nWorkflows = n8nWorkflows.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && w.active) || 
      (filterStatus === 'inactive' && !w.active);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: workflowTemplates.length + n8nWorkflows.length,
    active: n8nWorkflows.filter(w => w.active).length,
    tested: Object.keys(results).length,
    passed: Object.values(results).filter(r => r.status === 'success').length,
    failed: Object.values(results).filter(r => r.status === 'error').length
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Workflow Tester
                </h1>
                <p className="text-sm text-muted-foreground">Test và debug n8n workflows</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* n8n Status */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                n8nStatus === 'online' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : n8nStatus === 'offline'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}>
                {n8nStatus === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : n8nStatus === 'online' ? (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                ) : (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
                n8n {n8nStatus === 'loading' ? 'Checking...' : n8nStatus === 'online' ? 'Online' : 'Offline'}
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { checkN8nStatus(); fetchN8nWorkflows(); }}
                disabled={fetchingWorkflows}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${fetchingWorkflows ? 'animate-spin' : ''}`} />
                Refresh
              </Button>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('http://localhost:5678', '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open n8n
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-900/30">
                  <Workflow className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total Workflows</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-900/30">
                  <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.active}</div>
                  <div className="text-xs text-muted-foreground">Active in n8n</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-900/30">
                  <Terminal className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.tested}</div>
                  <div className="text-xs text-muted-foreground">Tests Run</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-900/30">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.passed}</div>
                  <div className="text-xs text-muted-foreground">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-900/30">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Test Section */}
        <Card className="mb-6 bg-gradient-to-r from-violet-950/30 to-purple-950/30 border-violet-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-violet-600" />
              Quick Test
            </CardTitle>
            <CardDescription>Test nhanh các workflow template</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {filteredTemplates.map((workflow) => (
                <Button
                  key={workflow.id}
                  variant="outline"
                  className={`h-auto py-3 flex-col gap-1 bg-slate-800 hover:bg-violet-900/30 border-slate-600 transition-all ${
                    results[workflow.id]?.status === 'success' ? 'border-green-500 bg-green-900/30' :
                    results[workflow.id]?.status === 'error' ? 'border-red-500 bg-red-900/30' :
                    results[workflow.id]?.status === 'loading' ? 'border-yellow-500 bg-yellow-900/30' : ''
                  }`}
                  disabled={n8nStatus !== 'online' || results[workflow.id]?.status === 'loading'}
                  onClick={() => executeWorkflow(workflow.id, workflow.webhookPath, workflow.defaultPayload)}
                >
                  {results[workflow.id]?.status === 'loading' ? (
                    <Loader2 className="w-6 h-6 animate-spin text-yellow-600" />
                  ) : results[workflow.id]?.status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : results[workflow.id]?.status === 'error' ? (
                    <XCircle className="w-6 h-6 text-red-600" />
                  ) : (
                    <span className="text-2xl">{workflow.icon}</span>
                  )}
                  <span className="text-xs font-medium">{workflow.name}</span>
                  {results[workflow.id]?.executionTime && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {results[workflow.id].executionTime}ms
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workflow Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Workflow Templates
            <Badge variant="secondary">{filteredTemplates.length}</Badge>
          </h2>

          <div className="grid gap-4">
            {filteredTemplates.map((workflow) => (
              <Collapsible 
                key={workflow.id} 
                open={expandedCards.has(workflow.id)}
                onOpenChange={() => toggleCard(workflow.id)}
              >
                <Card className="bg-slate-800 border-slate-700 overflow-hidden">
                  <CollapsibleTrigger className="w-full">
                    <div className="p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{workflow.icon}</div>
                        <div className="text-left">
                          <div className="font-semibold flex items-center gap-2">
                            {workflow.name}
                            <Badge variant="outline" className="text-xs">{workflow.category}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{workflow.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {results[workflow.id] && (
                          <div className="flex items-center gap-2">
                            {results[workflow.id].status === 'success' && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Success • {results[workflow.id].executionTime}ms
                              </Badge>
                            )}
                            {results[workflow.id].status === 'error' && (
                              <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <XCircle className="w-3 h-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                            {results[workflow.id].status === 'loading' && (
                              <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Running...
                              </Badge>
                            )}
                          </div>
                        )}
                        <Button
                          size="sm"
                          className="bg-violet-600 hover:bg-violet-700"
                          disabled={n8nStatus !== 'online' || results[workflow.id]?.status === 'loading'}
                          onClick={(e) => {
                            e.stopPropagation();
                            executeWorkflow(workflow.id, workflow.webhookPath, getPayload(workflow));
                          }}
                        >
                          {results[workflow.id]?.status === 'loading' ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                        {expandedCards.has(workflow.id) ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <Separator />
                    <div className="p-4 grid md:grid-cols-2 gap-4">
                      {/* Payload Editor */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Request Payload</label>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(getPayload(workflow), null, 2))}
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Copy
                          </Button>
                        </div>
                        <Textarea
                          value={customPayloads[workflow.id] || JSON.stringify(workflow.defaultPayload, null, 2)}
                          onChange={(e) => setCustomPayloads(prev => ({ ...prev, [workflow.id]: e.target.value }))}
                          className="font-mono text-xs h-32 bg-slate-900 border-slate-700"
                          placeholder="JSON payload..."
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          <code className="bg-slate-900 px-1.5 py-0.5 rounded">
                            POST /webhook/{workflow.webhookPath}
                          </code>
                        </div>
                      </div>

                      {/* Response */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium">Response</label>
                          {results[workflow.id]?.data && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(JSON.stringify(results[workflow.id].data, null, 2))}
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          )}
                        </div>
                        <ScrollArea className="h-32 rounded-lg border border-slate-700 bg-slate-900">
                          <pre className="p-3 text-xs font-mono whitespace-pre-wrap">
                            {results[workflow.id]?.status === 'loading' ? (
                              <span className="text-yellow-600">⏳ Executing...</span>
                            ) : results[workflow.id]?.status === 'success' ? (
                              <span className="text-green-600">
                                {JSON.stringify(results[workflow.id].data, null, 2)}
                              </span>
                            ) : results[workflow.id]?.status === 'error' ? (
                              <span className="text-red-600">❌ {results[workflow.id].error}</span>
                            ) : (
                              <span className="text-muted-foreground">Click ▶️ Run to execute workflow</span>
                            )}
                          </pre>
                        </ScrollArea>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </div>

        {/* n8n Workflows Section */}
        {filteredN8nWorkflows.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              n8n Workflows
              <Badge variant="secondary">{filteredN8nWorkflows.length}</Badge>
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredN8nWorkflows.map((workflow) => (
                <Card key={workflow.id} className="bg-slate-800 border-slate-700 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base truncate">{workflow.name}</CardTitle>
                      <Badge variant={workflow.active ? "default" : "secondary"} className={workflow.active ? 'bg-green-600' : ''}>
                        {workflow.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {workflow.nodes?.length || 0} nodes • Updated {new Date(workflow.updatedAt).toLocaleDateString('vi-VN')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => window.open(`http://localhost:5678/workflow/${workflow.id}`, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      {workflow.active && (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-violet-600 hover:bg-violet-700"
                          disabled={n8nStatus !== 'online'}
                          onClick={() => {
                            const webhookNode = workflow.nodes?.find((n: any) => n.type === 'n8n-nodes-base.webhook');
                            if (webhookNode?.parameters?.path) {
                              executeWorkflow(workflow.id, webhookNode.parameters.path, { source: 'tester' });
                            } else {
                              toast.error('No webhook found in this workflow');
                            }
                          }}
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <Alert className="mt-8 bg-blue-950/30 border-blue-800">
          <AlertDescription className="text-sm">
            <strong>💡 Tips:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside text-muted-foreground">
              <li>Đảm bảo n8n đang chạy tại <code className="bg-blue-900 px-1 rounded">localhost:5678</code></li>
              <li>Workflow cần có Webhook node để nhận requests</li>
              <li>Bấm vào workflow card để expand và customize payload</li>
              <li>Quick Test buttons dùng payload mặc định</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default WorkflowTester;
