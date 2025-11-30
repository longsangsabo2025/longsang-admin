/**
 * ⚡ Workflow Optimizer Component
 *
 * Displays workflow metrics and optimization suggestions
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Optimization {
  type: 'performance' | 'reliability' | 'cost';
  nodeId?: string;
  issue: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  estimatedImprovement: string;
}

interface PerformanceData {
  workflowId: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  averageCost: number;
  bottlenecks: Array<{
    nodeId: string;
    averageTime: number;
    optimization?: string;
  }>;
}

export function WorkflowOptimizer({ workflowId }: { workflowId: string }) {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [optimizations, setOptimizations] = useState<Optimization[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (workflowId) {
      fetchOptimizations();
    }
  }, [workflowId]);

  const fetchOptimizations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/workflow-templates/${workflowId}/optimize`);
      const data = await response.json();

      if (data.success) {
        setPerformance(data.performance);
        setOptimizations(data.optimizations || []);
      }
    } catch (error) {
      console.error('Error fetching optimizations:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải optimization data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-muted-foreground">Đang phân tích...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!performance) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Workflow Optimization
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold">{performance.totalExecutions}</div>
            <div className="text-xs text-muted-foreground">Total Executions</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{(performance.successRate * 100).toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Success Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{performance.averageExecutionTime}ms</div>
            <div className="text-xs text-muted-foreground">Avg Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold">${performance.averageCost.toFixed(4)}</div>
            <div className="text-xs text-muted-foreground">Avg Cost</div>
          </div>
        </div>

        {/* Bottlenecks */}
        {performance.bottlenecks.length > 0 && (
          <div>
            <div className="font-semibold mb-2">Bottlenecks:</div>
            <div className="space-y-2">
              {performance.bottlenecks.map((bottleneck, i) => (
                <div key={i} className="p-2 rounded bg-muted">
                  <div className="text-sm font-medium">Node: {bottleneck.nodeId}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg time: {bottleneck.averageTime}ms
                  </div>
                  {bottleneck.optimization && (
                    <div className="text-xs text-blue-400 mt-1">
                      💡 {bottleneck.optimization}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Optimizations */}
        {optimizations.length > 0 && (
          <div>
            <div className="font-semibold mb-2">Optimization Suggestions:</div>
            <div className="space-y-2">
              {optimizations.map((opt, i) => (
                <div key={i} className="p-3 rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        opt.impact === 'high' ? 'destructive' :
                        opt.impact === 'medium' ? 'default' : 'secondary'
                      }>
                        {opt.impact}
                      </Badge>
                      <span className="font-medium">{opt.type}</span>
                    </div>
                  </div>
                  <div className="text-sm mb-1">{opt.issue}</div>
                  <div className="text-sm text-muted-foreground mb-2">
                    💡 {opt.suggestion}
                  </div>
                  <div className="text-xs text-blue-400">
                    Impact: {opt.estimatedImprovement}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {optimizations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <div>Không có optimization suggestions. Workflow đang hoạt động tốt!</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

