import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Pause, 
  Play, 
  FileText, 
  Mail, 
  Share2, 
  BarChart, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pauseAgent, resumeAgent } from '@/lib/automation/api';
import { toast } from 'sonner';
import type { AIAgent } from '@/types/automation';

interface AgentStatusCardsProps {
  agents: AIAgent[];
  isLoading?: boolean;
  onCreateAgent?: () => void;
}

const agentIcons: Record<string, any> = {
  content_writer: FileText,
  lead_nurture: Mail,
  social_media: Share2,
  analytics: BarChart,
};

const agentColors: Record<string, string> = {
  content_writer: 'text-blue-500',
  lead_nurture: 'text-green-500',
  social_media: 'text-purple-500',
  analytics: 'text-orange-500',
};

export const AgentStatusCards = ({ agents, isLoading, onCreateAgent }: AgentStatusCardsProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const pauseMutation = useMutation({
    mutationFn: pauseAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent paused successfully');
    },
    onError: () => {
      toast.error('Failed to pause agent');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: resumeAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success('Agent resumed successfully');
    },
    onError: () => {
      toast.error('Failed to resume agent');
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-muted rounded-full">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Active Agents</h3>
              <p className="text-muted-foreground mb-4">
                Create your first automation agent to get started
              </p>
              <Button onClick={onCreateAgent || (() => navigate('/automation/agents/new'))}>
                Create Agent
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => {
        const Icon = agentIcons[agent.type] || FileText;
        const iconColor = agentColors[agent.type] || 'text-blue-500';
        const isActive = agent.status === 'active';
        const hasError = agent.status === 'error';

        return (
          <Card 
            key={agent.id} 
            className="hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => navigate(`/automation/agents/${agent.id}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-${agent.type}/10`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <p className="text-xs text-muted-foreground capitalize mt-1">
                      {agent.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={isActive ? 'default' : hasError ? 'destructive' : 'secondary'}
                  className="capitalize"
                >
                  {isActive && <CheckCircle className="w-3 h-3 mr-1" />}
                  {agent.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {agent.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last run:</span>
                  <span className="font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {agent.last_run 
                      ? formatDistanceToNow(new Date(agent.last_run), { addSuffix: true })
                      : 'Never'
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total runs:</span>
                  <span className="font-medium">{agent.total_runs}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Success rate:</span>
                  <span className="font-medium">
                    {agent.total_runs > 0
                      ? `${Math.round((agent.successful_runs / agent.total_runs) * 100)}%`
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>

              {hasError && agent.last_error && (
                <div className="mb-4 p-3 bg-destructive/10 rounded-lg">
                  <p className="text-xs text-destructive font-medium">
                    Error: {agent.last_error}
                  </p>
                </div>
              )}

              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => navigate(`/automation/agents/${agent.id}/logs`)}
                >
                  View Logs
                </Button>
                {isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pauseMutation.mutate(agent.id)}
                    disabled={pauseMutation.isPending}
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resumeMutation.mutate(agent.id)}
                    disabled={resumeMutation.isPending}
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
