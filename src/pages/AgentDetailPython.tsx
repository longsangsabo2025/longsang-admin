/**
 * Agent Detail Page - Python Backend Integration
 * Enhanced version that uses Python AI backend
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Play, Pause, Trash2, Activity, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { triggerAgent } from '@/lib/automation/workflows-python';
import { checkBackendHealth } from '@/lib/automation/ai-service-python';
import { toast } from 'sonner';

export default function AgentDetailPython() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [agent, setAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backendHealth, setBackendHealth] = useState(false);
  const [triggerContext, setTriggerContext] = useState('{}');
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    loadAgent();
    checkBackend();
  }, [id]);

  async function checkBackend() {
    const healthy = await checkBackendHealth();
    setBackendHealth(healthy);
    if (!healthy) {
      toast.error('Python AI Backend is not available. Please start it first.');
    }
  }

  async function loadAgent() {
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setAgent(data);
    } catch (error: any) {
      toast.error('Failed to load agent');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    try {
      const newStatus = agent.status === 'active' ? 'paused' : 'active';
      
      const { error } = await supabase
        .from('ai_agents')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      setAgent({ ...agent, status: newStatus });
      toast.success(`Agent ${newStatus === 'active' ? 'activated' : 'paused'}`);
    } catch (error) {
      toast.error('Failed to update agent status');
    }
  }

  async function handleManualTrigger() {
    if (!backendHealth) {
      toast.error('Python backend is not running!');
      return;
    }

    setTriggering(true);
    try {
      // Parse context
      const context = JSON.parse(triggerContext);
      
      toast.loading('Executing agent with Python AI...');
      
      // Trigger via Python backend
      const result = await triggerAgent(agent.type, context);
      
      toast.dismiss();
      toast.success(`Agent executed successfully!`, {
        description: `Duration: ${result.success ? 'completed' : 'failed'}`,
      });

      // Reload agent stats
      await loadAgent();
    } catch (error: any) {
      toast.dismiss();
      toast.error('Agent execution failed', {
        description: error.message,
      });
    } finally {
      setTriggering(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Agent not found</h2>
          <Button onClick={() => navigate('/automation')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const successRate = agent.total_runs > 0
    ? Math.round((agent.successful_runs / agent.total_runs) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/automation')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Backend Status */}
          <Badge variant={backendHealth ? "default" : "destructive"}>
            <Zap className="h-3 w-3 mr-1" />
            Python AI {backendHealth ? 'Online' : 'Offline'}
          </Badge>
          
          <Badge variant={
            agent.status === 'active' ? 'default' :
            agent.status === 'paused' ? 'secondary' : 'destructive'
          }>
            {agent.status}
          </Badge>
          
          <Button
            variant="outline"
            onClick={handleToggleStatus}
          >
            {agent.status === 'active' ? (
              <><Pause className="h-4 w-4 mr-2" /> Pause</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Activate</>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Runs</div>
          <div className="text-2xl font-bold">{agent.total_runs}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Successful</div>
          <div className="text-2xl font-bold text-green-600">{agent.successful_runs}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Success Rate</div>
          <div className="text-2xl font-bold">{successRate}%</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Last Run</div>
          <div className="text-sm font-medium">
            {agent.last_run ? new Date(agent.last_run).toLocaleString() : 'Never'}
          </div>
        </Card>
      </div>

      {/* Manual Trigger */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Manual Trigger (Python AI)</h3>
              <p className="text-sm text-muted-foreground">
                Execute agent with LangGraph workflow & memory
              </p>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Real AI Powered
            </Badge>
          </div>
          
          <div>
            <label className="text-sm font-medium">Context (JSON)</label>
            <Textarea
              value={triggerContext}
              onChange={(e) => setTriggerContext(e.target.value)}
              placeholder='{"contact_id": "uuid-here"}'
              className="font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {agent.type === 'content_writer' && 'Requires: contact_id'}
              {agent.type === 'lead_nurture' && 'Requires: contact_id, follow_up_number (optional)'}
              {agent.type === 'social_media' && 'Requires: blog_queue_id'}
              {agent.type === 'analytics' && 'No context required'}
            </p>
          </div>
          
          <Button
            onClick={handleManualTrigger}
            disabled={triggering || !backendHealth}
            className="w-full"
          >
            {triggering ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Executing with Python AI...
              </>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Trigger Agent</>
            )}
          </Button>
        </div>
      </Card>

      {/* Configuration */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuration</h3>
        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
          {JSON.stringify(agent.config, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
