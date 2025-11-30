import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { executeAgent, type AgentExecutionResult } from '@/lib/services/agentExecutionService';

interface AgentExecutorProps {
  readonly agentId: string;
  readonly agentName: string;
}

export default function AgentExecutor({ agentId, agentName }: Readonly<AgentExecutorProps>) {
  const [task, setTask] = useState('');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<AgentExecutionResult | null>(null);
  const { toast } = useToast();

  const handleExecute = async () => {
    if (!task.trim()) {
      toast({
        title: 'Empty Task',
        description: 'Please enter a task for the agent to execute',
        variant: 'destructive',
      });
      return;
    }

    setExecuting(true);
    setResult(null);

    try {
      const executionResult = await executeAgent({
        agentId,
        task: task.trim(),
      });

      setResult(executionResult);

      if (executionResult.success) {
        toast({
          title: '✅ Execution Complete!',
          description: `Cost: $${executionResult.costUsd.toFixed(4)} | Time: ${executionResult.executionTimeMs}ms`,
        });
      } else {
        toast({
          title: '❌ Execution Failed',
          description: executionResult.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute agent';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">🤖 Test Agent: {agentName}</CardTitle>
        <CardDescription>
          Using GPT-4o mini (ultra cheap & fast!) - ~$0.0004 per 1K tokens 💰⚡
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Input */}
        <div className="space-y-2">
          <label htmlFor="task-input" className="text-sm font-medium">
            Task for Agent:
          </label>
          <Textarea
            id="task-input"
            placeholder="Enter task for the agent to execute... (e.g., 'Generate a marketing email for a new product launch')"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            rows={4}
            disabled={executing}
            className="resize-none"
          />
        </div>

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          disabled={executing || !task.trim()}
          className="w-full"
          size="lg"
        >
          {executing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Execute Agent
            </>
          )}
        </Button>

        {/* Result Display */}
        {result && (
          <Card className={result.success ? 'border-green-500' : 'border-red-500'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                {result.success ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Execution Successful
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    Execution Failed
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats */}
              <div className="flex gap-4 flex-wrap">
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {result.executionTimeMs}ms
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <DollarSign className="h-3 w-3" />${result.costUsd.toFixed(6)}
                </Badge>
              </div>

              {/* Output */}
              {result.success && result.output && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">AI Response:</div>
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm font-mono">{result.output}</pre>
                  </div>
                </div>
              )}

              {/* Error */}
              {!result.success && result.error && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-500">Error:</div>
                  <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{result.error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Cost Estimate */}
        <div className="text-xs text-muted-foreground text-center">
          💰 Estimated cost per execution: $0.0005 - $0.002 (GPT-4o mini - ultra cheap & smart!)
        </div>
      </CardContent>
    </Card>
  );
}
