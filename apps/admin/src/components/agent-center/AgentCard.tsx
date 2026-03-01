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
  Bot,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/config/api';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    role: string;
    type: string;
    status: string;
    description: string;
    category?: string; // Thêm category
    capabilities: string[];
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    avg_execution_time_ms: number;
    total_cost_usd: number;
    last_used_at: string | null;
  };
  onUpdate: () => void;
}

// Danh sách lĩnh vực/categories
const AGENT_CATEGORIES = {
  marketing: { label: 'Marketing & Sales', icon: '📢', color: 'bg-pink-100 text-pink-800' },
  'customer-service': {
    label: 'Dịch Vụ Khách Hàng',
    icon: '🎧',
    color: 'bg-blue-100 text-blue-800',
  },
  content: { label: 'Nội Dung & Sáng Tạo', icon: '✍️', color: 'bg-purple-100 text-purple-800' },
  'data-analysis': { label: 'Phân Tích Dữ Liệu', icon: '📊', color: 'bg-green-100 text-green-800' },
  automation: { label: 'Tự Động Hóa', icon: '⚙️', color: 'bg-orange-100 text-orange-800' },
  research: { label: 'Nghiên Cứu & Tìm Kiếm', icon: '🔍', color: 'bg-indigo-100 text-indigo-800' },
  development: { label: 'Phát Triển & Lập Trình', icon: '💻', color: 'bg-cyan-100 text-cyan-800' },
  finance: { label: 'Tài Chính & Kế Toán', icon: '💰', color: 'bg-emerald-100 text-emerald-800' },
  other: { label: 'Khác', icon: '📦', color: 'bg-gray-100 text-gray-800' },
};

const AgentCard = ({ agent, onUpdate }: AgentCardProps) => {
  const { toast } = useToast();

  const successRate =
    (agent.total_executions || 0) > 0
      ? (((agent.successful_executions || 0) / (agent.total_executions || 1)) * 100).toFixed(1)
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const handleExecute = async () => {
    try {
      toast({
        title: 'Executing Agent',
        description: `Starting ${agent.name}...`,
      });

      const apiUrl = API_ENDPOINTS.AGENTS.EXECUTE(agent.id);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: 'AI-powered automation',
          style: 'professional',
          length: 'medium',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: '✅ Agent Executed Successfully',
          description: `${result.agentName} completed in ${result.executionTime}ms`,
        });
      } else {
        throw new Error(result.error || 'Execution failed');
      }
    } catch (error) {
      toast({
        title: '❌ Execution Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = agent.status === 'active' ? 'inactive' : 'active';
    toast({
      title: 'Status Updated',
      description: `Agent ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
    });
    onUpdate();
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${agent.name}?`)) {
      toast({
        title: 'Agent Deleted',
        description: `${agent.name} has been removed`,
      });
      onUpdate();
    }
  };

  return (
    <Card className="bg-slate-900 border-slate-700 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20`}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-slate-100">
                {agent.name}
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
              </CardTitle>
              <CardDescription className="flex items-center gap-2 text-slate-400">
                {agent.role}
                {agent.category &&
                  AGENT_CATEGORIES[agent.category as keyof typeof AGENT_CATEGORIES] && (
                    <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                      {AGENT_CATEGORIES[agent.category as keyof typeof AGENT_CATEGORIES].icon}
                      {AGENT_CATEGORIES[agent.category as keyof typeof AGENT_CATEGORIES].label}
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
              <DropdownMenuItem
                onClick={handleToggleStatus}
                className="text-slate-300 hover:bg-slate-800"
              >
                {agent.status === 'active' ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Configure
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
        {/* Type Badge */}
        <Badge className="bg-slate-800 text-slate-200 border-slate-600">{agent.type}</Badge>

        {/* Description */}
        <p className="text-sm text-slate-400 line-clamp-2">{agent.description}</p>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1">
          {Array.isArray(agent.capabilities) &&
            agent.capabilities.slice(0, 3).map((cap) => (
              <Badge
                key={cap}
                variant="outline"
                className="text-xs border-slate-600 text-slate-300"
              >
                {cap}
              </Badge>
            ))}
          {Array.isArray(agent.capabilities) && agent.capabilities.length > 3 && (
            <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
              +{agent.capabilities.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <TrendingUp className="w-3 h-3" />
              Success Rate
            </div>
            <div className="text-lg font-semibold text-green-400">{successRate}%</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              Avg Time
            </div>
            <div className="text-lg font-semibold text-blue-400">
              {((agent.avg_execution_time_ms || 0) / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Play className="w-3 h-3" />
              Executions
            </div>
            <div className="text-lg font-semibold text-purple-400">
              {agent.total_executions || 0}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <DollarSign className="w-3 h-3" />
              Cost
            </div>
            <div className="text-lg font-semibold text-orange-400">
              ${(agent.total_cost_usd || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Last Used */}
        {agent.last_used_at && (
          <div className="text-xs text-slate-500 pt-2 border-t border-slate-700">
            Last used: {new Date(agent.last_used_at).toLocaleDateString()}
          </div>
        )}

        {/* Execute Button */}
        <Button
          onClick={handleExecute}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0"
          variant="outline"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute Agent
        </Button>
      </CardContent>
    </Card>
  );
};

export default AgentCard;
