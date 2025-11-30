/**
 * 🤖 Multi-Agent Orchestrator Component
 *
 * Visualizes and manages multi-agent coordination
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AgentTask {
  id: string;
  agent: string;
  role: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface OrchestrationResult {
  success: boolean;
  totalAgents: number;
  successfulAgents: number;
  failedAgents: number;
  results: Array<{
    agent: string;
    status: string;
    result: any;
  }>;
  summary: string;
}

export function MultiAgentOrchestrator({ command }: { command?: string }) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [result, setResult] = useState<OrchestrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeOrchestration = async (cmd: string) => {
    if (!cmd) return;

    setLoading(true);
    setTasks([]);
    setResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/ai/orchestrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd })
      });

      const data = await response.json();

      if (data.success) {
        // Simulate task progression
        const agentTasks: AgentTask[] = data.results.map((r: any, i: number) => ({
          id: `task-${i + 1}`,
          agent: r.agent,
          role: `Agent ${i + 1}`,
          status: r.status === 'completed' ? 'completed' : 'failed',
          result: r.result
        }));

        setTasks(agentTasks);
        setResult(data);
      } else {
        throw new Error(data.error || 'Orchestration failed');
      }
    } catch (error) {
      console.error('Error orchestrating agents:', error);
      toast({
        title: "❌ Lỗi",
        description: error instanceof Error ? error.message : "Không thể orchestrate agents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (command) {
      executeOrchestration(command);
    }
  }, [command]);

  if (!command && tasks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Multi-Agent Orchestration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {tasks.length > 0 && (
          <div className="space-y-4">
            {/* Agent Tasks */}
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5" />
                    <div>
                      <div className="font-medium">{task.agent}</div>
                      <div className="text-sm text-muted-foreground">{task.role}</div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'failed' ? 'destructive' :
                      task.status === 'running' ? 'secondary' : 'outline'
                    }
                  >
                    {task.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {task.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
                    {task.status === 'running' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Summary */}
            {result && (
              <div className="p-4 rounded-lg bg-primary/10">
                <div className="font-semibold mb-2">Summary:</div>
                <div className="text-sm">{result.summary}</div>
                <div className="mt-2 flex gap-2">
                  <Badge>Total: {result.totalAgents}</Badge>
                  <Badge variant="default">Success: {result.successfulAgents}</Badge>
                  {result.failedAgents > 0 && (
                    <Badge variant="destructive">Failed: {result.failedAgents}</Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

