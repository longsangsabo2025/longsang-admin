import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Workflow,
  MoreVertical,
  Play,
  Edit,
  Copy,
  Trash2,
  GitBranch,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowCardProps {
  workflow: {
    id: string;
    name: string;
    type: string;
    description: string;
    status: string;
    is_template: boolean;
    tags: string[];
    total_executions: number;
    avg_execution_time_ms: number;
    success_rate: number;
    last_executed_at: string | null;
  };
  onUpdate: () => void;
}

const WorkflowCard = ({ workflow, onUpdate }: WorkflowCardProps) => {
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sequential':
        return <GitBranch className="w-4 h-4" />;
      case 'parallel':
        return <Zap className="w-4 h-4" />;
      case 'conditional':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <Workflow className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sequential':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'parallel':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'conditional':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleExecute = async () => {
    toast({
      title: 'Executing Workflow',
      description: `Starting ${workflow.name}...`,
    });
    // TODO: Implement workflow execution
  };

  const handleDuplicate = async () => {
    toast({
      title: 'Workflow Duplicated',
      description: `Created a copy of ${workflow.name}`,
    });
    onUpdate();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${workflow.name}?`)) {
      toast({
        title: 'Workflow Deleted',
        description: `${workflow.name} has been removed`,
      });
      onUpdate();
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700 hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-700 shadow-lg shadow-purple-500/20">
              {getTypeIcon(workflow.type)}
              <Workflow className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                {workflow.name}
                <div className={`w-2 h-2 rounded-full ${getStatusColor(workflow.status)}`} />
              </CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1 text-slate-400">
                <Badge className="border-slate-600 text-slate-300" variant="outline">
                  {workflow.type}
                </Badge>
                {workflow.is_template && (
                  <Badge variant="outline" className="border-orange-600 text-orange-300">
                    Template
                  </Badge>
                )}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
              <DropdownMenuItem
                onClick={handleExecute}
                className="text-slate-300 hover:bg-slate-800"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute
              </DropdownMenuItem>
              <DropdownMenuItem className="text-slate-300 hover:bg-slate-800">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDuplicate}
                className="text-slate-300 hover:bg-slate-800"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-slate-800">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-2">{workflow.description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {workflow.tags.slice(0, 4).map((tag, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="text-xs border-slate-600 text-slate-300"
            >
              {tag}
            </Badge>
          ))}
          {workflow.tags.length > 4 && (
            <Badge variant="secondary" className="text-xs">
              +{workflow.tags.length - 4}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-700">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Play className="w-3 h-3" />
              Runs
            </div>
            <div className="text-lg font-semibold text-purple-400">{workflow.total_executions}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <TrendingUp className="w-3 h-3" />
              Success
            </div>
            <div className="text-lg font-semibold text-green-400">
              {workflow.success_rate.toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              Avg Time
            </div>
            <div className="text-lg font-semibold text-blue-400">
              {(workflow.avg_execution_time_ms / 1000).toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Last Executed */}
        {workflow.last_executed_at && (
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
            Last run: {new Date(workflow.last_executed_at).toLocaleDateString()}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          variant="default"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Workflow
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkflowCard;
