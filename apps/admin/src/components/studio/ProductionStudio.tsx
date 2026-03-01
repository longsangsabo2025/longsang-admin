import React, { useState, useCallback } from 'react';
import { Play, Sparkles, ChevronRight, Check, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface AgentStatus {
  agent: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: any;
  error?: string;
  timestamp?: string;
}

interface ProductionStudioProps {
  episodeId: string;
  scriptData: {
    hook: string;
    story: string;
    punchline: string;
    cta: string;
    visualNotes: string;
  };
  context: {
    seriesTitle: string;
    episode: string;
    tone: string;
    targetDuration: number;
  };
}

const AGENT_FLOW = [
  { id: 'script_supervisor', name: 'Script Supervisor', description: 'Analyzing script structure', icon: '📝' },
  { id: 'dp', name: 'Director of Photography', description: 'Creating shot list', icon: '🎬' },
  { id: 'designer', name: 'Production Designer', description: 'Generating image prompts', icon: '🎨' },
  { id: 'editor', name: 'Video Editor', description: 'Creating motion prompts', icon: '✂️' },
  { id: 'continuity', name: 'Continuity Supervisor', description: 'Validating consistency', icon: '✓' },
];

export default function ProductionStudio({ episodeId, scriptData, context }: ProductionStudioProps) {
  const [agentStatuses, setAgentStatuses] = useState<AgentStatus[]>(
    AGENT_FLOW.map(agent => ({ agent: agent.id, status: 'pending' }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [sceneBreakdown, setSceneBreakdown] = useState<any>(null);
  const [shotList, setShotList] = useState<any>(null);

  const updateAgentStatus = useCallback((agentId: string, updates: Partial<AgentStatus>) => {
    setAgentStatuses(prev =>
      prev.map(agent =>
        agent.agent === agentId
          ? { ...agent, ...updates, timestamp: new Date().toISOString() }
          : agent
      )
    );
  }, []);

  const runScriptSupervisor = async () => {
    setCurrentPhase('script_supervisor');
    updateAgentStatus('script_supervisor', { status: 'processing' });

    try {
      const response = await fetch('/api/agents/script-supervisor/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptData, context }),
      });

      const result = await response.json();

      if (result.success) {
        updateAgentStatus('script_supervisor', {
          status: 'completed',
          output: result.data,
        });
        setSceneBreakdown(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      updateAgentStatus('script_supervisor', {
        status: 'failed',
        error: error.message,
      });
      toast.error(`Script Supervisor failed: ${error.message}`);
      throw error;
    }
  };

  const runDirectorOfPhotography = async (breakdown: any) => {
    setCurrentPhase('dp');
    updateAgentStatus('dp', { status: 'processing' });

    try {
      const response = await fetch('/api/agents/dp/create-shot-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneBreakdown: breakdown, context }),
      });

      const result = await response.json();

      if (result.success) {
        updateAgentStatus('dp', {
          status: 'completed',
          output: result.data,
        });
        setShotList(result.data);
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      updateAgentStatus('dp', {
        status: 'failed',
        error: error.message,
      });
      toast.error(`Director of Photography failed: ${error.message}`);
      throw error;
    }
  };

  const runFullPipeline = async () => {
    setIsRunning(true);
    setAgentStatuses(AGENT_FLOW.map(agent => ({ agent: agent.id, status: 'pending' })));

    try {
      // Phase 1: Script Supervisor
      toast.info('🎬 Starting production workflow...');
      const breakdown = await runScriptSupervisor();

      // Phase 2: Director of Photography
      const shots = await runDirectorOfPhotography(breakdown);

      // TODO: Phase 3-5 (Designer, Editor, Continuity)
      // For now, mark remaining as pending
      toast.success('✅ Phase 1 & 2 complete! Scene breakdown and shot list ready.');

      setCurrentPhase(null);
    } catch (error) {
      console.error('Pipeline error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: AgentStatus['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'processing':
        return <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel: Agent Pipeline */}
      <div className="w-80 border-r pr-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">AI Production Crew</h2>
          <Button
            onClick={runFullPipeline}
            disabled={isRunning}
            className="w-full"
            size="lg"
          >
            {isRunning ? (
              <>
                <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Start Production
              </>
            )}
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {AGENT_FLOW.map((agent, index) => {
              const status = agentStatuses.find(s => s.agent === agent.id);
              const isActive = currentPhase === agent.id;

              return (
                <Card
                  key={agent.id}
                  className={`
                    transition-all
                    ${isActive ? 'border-blue-500 shadow-lg' : ''}
                    ${status?.status === 'completed' ? 'border-green-200 bg-green-50/50' : ''}
                    ${status?.status === 'failed' ? 'border-red-200 bg-red-50/50' : ''}
                  `}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{agent.icon}</div>
                        <div>
                          <CardTitle className="text-sm">{agent.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {agent.description}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusIcon(status?.status || 'pending')}
                    </div>
                  </CardHeader>

                  {status?.status === 'completed' && status.output && (
                    <CardContent className="pt-0">
                      <Badge variant="outline" className="text-xs">
                        ✓ Output ready
                      </Badge>
                    </CardContent>
                  )}

                  {status?.status === 'failed' && status.error && (
                    <CardContent className="pt-0">
                      <p className="text-xs text-red-600">{status.error}</p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel: Output Viewer */}
      <div className="flex-1">
        <ScrollArea className="h-full">
          {/* Scene Breakdown */}
          {sceneBreakdown && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📝 Scene Breakdown
                  <Badge variant="outline">{sceneBreakdown.scenes?.length || 0} scenes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sceneBreakdown.scenes?.map((scene: any) => (
                    <div key={scene.sceneNumber} className="border-l-2 border-blue-500 pl-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">Scene {scene.sceneNumber}</Badge>
                        <span className="text-sm font-medium">{scene.beat}</span>
                        <Badge variant="outline" className="ml-auto">{scene.duration}s</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{scene.description}</p>
                      {scene.visualElements && scene.visualElements.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {scene.visualElements.map((element: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {element}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Shot List */}
          {shotList && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎬 Shot List
                  <Badge variant="outline">{shotList.shots?.length || 0} shots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shotList.shots?.map((shot: any) => (
                    <div key={shot.shotNumber} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge className="bg-purple-600">Shot {shot.shotNumber}</Badge>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{shot.shotType}</span>
                        <Badge variant="outline" className="ml-auto">{shot.duration}s</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Angle:</span>{' '}
                          <span className="text-gray-600">{shot.cameraAngle}</span>
                        </div>
                        <div>
                          <span className="font-medium">Movement:</span>{' '}
                          <span className="text-gray-600">{shot.cameraMovement}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Lighting:</span>{' '}
                          <span className="text-gray-600">{shot.lighting}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">Composition:</span>{' '}
                          <span className="text-gray-600">{shot.composition}</span>
                        </div>
                      </div>

                      {shot.rationale && (
                        <div className="mt-3 pt-3 border-t text-xs text-gray-500 italic">
                          💡 {shot.rationale}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {!sceneBreakdown && !shotList && (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Click "Start Production" to begin</p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
