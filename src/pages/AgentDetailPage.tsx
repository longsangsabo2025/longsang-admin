import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  Zap,
  DollarSign,
  PlayCircle,
  CheckCircle,
  Sparkles,
  Code,
  FileText,
  TrendingUp,
} from 'lucide-react';
import { getMVPAgentById } from '@/data/mvp-agents';
import { useToast } from '@/hooks/use-toast';
import {
  activateAgent,
  executeAgent,
  updateExecution,
  checkFreeRuns,
} from '@/lib/marketplace/service';
import { executeAgentSmart } from '@/lib/marketplace/ai-service';

export const AgentDetailPage = () => {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [freeRunsInfo, setFreeRunsInfo] = useState({ has_free_runs: true, runs_remaining: 0 });

  const agent = getMVPAgentById(agentId || '');

  // Check free runs on mount
  useState(() => {
    if (agent) {
      checkFreeRuns(agent.id, agent.pricing.free_trial_runs).then(setFreeRunsInfo);
    }
  });

  if (!agent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Agent Not Found</h1>
          <Button onClick={() => navigate('/marketplace')}>Back to Marketplace</Button>
        </div>
      </div>
    );
  }

  const handleActivate = async () => {
    if (!agent) return;

    try {
      await activateAgent(agent);

      toast({
        title: '🎉 Agent Activated!',
        description: `${agent.name} is now active. You have ${agent.pricing.free_trial_runs} free runs.`,
      });

      // Refresh free runs info
      const info = await checkFreeRuns(agent.id, agent.pricing.free_trial_runs);
      setFreeRunsInfo(info);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to activate agent',
        variant: 'destructive',
      });
    }
  };

  const handleTestRun = async () => {
    if (!agent) return;

    if (!testInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide input to test the agent',
        variant: 'destructive',
      });
      return;
    }

    setIsRunning(true);

    try {
      // Parse input
      let inputData;
      try {
        inputData = JSON.parse(testInput);
      } catch {
        inputData = { text: testInput };
      }

      // Determine cost (free if has free runs)
      const costUsd = freeRunsInfo.has_free_runs ? 0 : agent.pricing.price;

      // Create execution record
      const execution = await executeAgent(agent.id, inputData, costUsd);

      // Execute with REAL AI (GPT-4o-mini)
      const result = await executeAgentSmart(agent, inputData);

      if (!result.success) {
        throw new Error(result.error || 'AI execution failed');
      }

      // Update execution with actual results
      await updateExecution(execution.id, {
        status: 'completed',
        output_data: result.output,
        execution_time_ms: result.execution_time_ms,
      });

      setTestOutput(JSON.stringify(result.output, null, 2));

      const costMessage = freeRunsInfo.has_free_runs
        ? `Free run used. ${freeRunsInfo.runs_remaining - 1} remaining.`
        : `Cost: $${result.cost_usd.toFixed(4)} (${result.tokens_used} tokens)`;

      toast({
        title: '✅ Test Complete!',
        description: `Agent executed in ${(result.execution_time_ms / 1000).toFixed(1)}s. ${costMessage}`,
      });

      // Refresh free runs
      const info = await checkFreeRuns(agent.id, agent.pricing.free_trial_runs);
      setFreeRunsInfo(info);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Execution failed',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="text-slate-400 hover:text-white"
          onClick={() => navigate('/marketplace')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Marketplace
        </Button>

        {/* Hero Section */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
          <div className="flex items-start gap-6">
            <div className="text-7xl">{agent.icon}</div>

            <div className="flex-1 space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/50">
                    {agent.category.toUpperCase()}
                  </Badge>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                    🎁 {agent.pricing.free_trial_runs} FREE RUNS
                  </Badge>
                </div>

                <h1 className="text-4xl font-bold text-white mb-2">{agent.name}</h1>

                <p className="text-xl text-slate-300">{agent.tagline}</p>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                  <span className="text-white font-medium">{agent.rating.score}</span>
                  <span className="text-slate-400">({agent.rating.count} reviews)</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="w-5 h-5" />
                  <span>{agent.metrics.user_count.toLocaleString()} users</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <TrendingUp className="w-5 h-5" />
                  <span>{agent.metrics.total_runs.toLocaleString()} runs</span>
                </div>

                <div className="flex items-center gap-2 text-slate-400">
                  <Clock className="w-5 h-5" />
                  <span>{agent.metrics.avg_execution_time}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-baseline gap-2 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-indigo-400" />
                  <span className="text-3xl font-bold text-white">${agent.pricing.price}</span>
                  <span className="text-slate-400">{agent.pricing.unit}</span>
                </div>

                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  onClick={handleActivate}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Activate Agent
                </Button>

                <Button size="lg" variant="outline" className="border-slate-700 hover:bg-slate-800">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Sandbox
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sandbox">🧪 Try It Now</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-lg leading-relaxed">{agent.description}</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">✨ Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {agent.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">🎯 Use Cases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agent.use_cases.map((useCase, index) => (
                    <div key={useCase} className="flex items-start gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-slate-300">{useCase}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">📋 Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {agent.requirements.map((req) => (
                    <div key={req} className="flex items-center gap-2 text-slate-300">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sandbox Tab */}
          <TabsContent value="sandbox" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <PlayCircle className="w-5 h-5 text-indigo-400" />
                  Test Agent Sandbox
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Try the agent with your own input. This counts as a real execution.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">
                    Input (JSON format):
                  </label>
                  <Textarea
                    placeholder={agent.input_example.value}
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    className="min-h-[200px] bg-slate-950 border-slate-700 text-white font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={handleTestRun}
                  disabled={isRunning}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {isRunning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run Test
                    </>
                  )}
                </Button>

                {testOutput && (
                  <div>
                    <label className="text-sm font-medium text-slate-300 mb-2 block">Output:</label>
                    <ScrollArea className="h-[300px] bg-slate-950 border border-slate-700 rounded-lg p-4">
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                        {testOutput}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    {agent.input_example.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                      {agent.input_example.value}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Code className="w-5 h-5 text-green-400" />
                    {agent.output_example.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                      {agent.output_example.value}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Technical Tab */}
          <TabsContent value="technical" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">⚙️ Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Model</p>
                    <p className="text-lg font-semibold text-white">{agent.config.model}</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Temperature</p>
                    <p className="text-lg font-semibold text-white">{agent.config.temperature}</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <p className="text-sm text-slate-400 mb-1">Max Tokens</p>
                    <p className="text-lg font-semibold text-white">{agent.config.max_tokens}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">🤖 System Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] bg-slate-950 border border-slate-700 rounded-lg p-4">
                  <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">
                    {agent.system_prompt}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">User Reviews</CardTitle>
                <CardDescription className="text-slate-400">
                  {agent.rating.count} reviews • {agent.rating.score} average rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-slate-400">
                  <Star className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p>Reviews coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Automate?</h2>
            <p className="text-slate-300 mb-6">
              Activate this agent and start saving time today. First {agent.pricing.free_trial_runs}{' '}
              runs are free!
            </p>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleActivate}
            >
              <Zap className="w-5 h-5 mr-2" />
              Activate {agent.name}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
