/**
 * 🤖 Agents Dashboard
 * 
 * Theo tài liệu: docs/ai-command-center/02-TAB-AGENTS.md
 * 
 * @author LongSang Admin
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Bot, Activity, TrendingUp, DollarSign, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import CreateAgentDialog from "./CreateAgentDialog";
import AgentCard from "./AgentCard";
import { agentCenterApi } from "@/services/agent-center.service";
import { AIAgent, AgentType } from "@/types/agent-center.types";

// Danh sách lĩnh vực/categories theo docs
const AGENT_CATEGORIES: Record<AgentType | 'all', { label: string; icon: string; color: string }> = {
  'all': { label: 'Tất Cả', icon: '🎯', color: 'bg-slate-100 text-slate-800' },
  'work_agent': { label: 'Công Việc', icon: '💼', color: 'bg-blue-100 text-blue-800' },
  'research_agent': { label: 'Nghiên Cứu', icon: '🔍', color: 'bg-indigo-100 text-indigo-800' },
  'content_creator': { label: 'Nội Dung', icon: '✍️', color: 'bg-purple-100 text-purple-800' },
  'data_analyst': { label: 'Phân Tích', icon: '📊', color: 'bg-green-100 text-green-800' },
  'custom': { label: 'Tùy Chỉnh', icon: '⚙️', color: 'bg-orange-100 text-orange-800' },
};

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalExecutions: number;
  totalCost: number;
  successRate: number;
}

const AgentsDashboard = () => {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AgentType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState<AgentStats>({
    totalAgents: 0,
    activeAgents: 0,
    totalExecutions: 0,
    totalCost: 0,
    successRate: 0,
  });
  const { toast } = useToast();

  const fetchAgents = useCallback(async () => {
    try {
      setLoading(true);
      const [agentsList, agentStats] = await Promise.all([
        agentCenterApi.agents.list(),
        agentCenterApi.agents.getStats(),
      ]);

      setAgents(agentsList);
      setStats(agentStats);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback to empty state instead of showing error
      setAgents([]);
      setStats({
        totalAgents: 0,
        activeAgents: 0,
        totalExecutions: 0,
        totalCost: 0,
        successRate: 0,
      });
      // Only show toast for non-table-missing errors
      const errorMessage = error instanceof Error ? error.message : '';
      if (!errorMessage.includes('does not exist') && !errorMessage.includes('400')) {
        toast({
          title: "Lỗi",
          description: "Không thể tải danh sách agents",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Filter agents based on search and category
  const filteredAgents = agents.filter((agent) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (agent.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesCategory = 
      selectedCategory === 'all' || agent.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Count agents by category
  const categoryCounts = agents.reduce((acc, agent) => {
    acc[agent.type] = (acc[agent.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalAgents}</div>
            <p className="text-xs text-slate-400">
              {stats.activeAgents} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalExecutions.toLocaleString()}</div>
            <p className="text-xs text-slate-400">
              Across all agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-slate-400">
              Average across agents
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-950 to-orange-900 border-orange-700 shadow-lg shadow-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-200">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime usage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header with Search and Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">AI Agents</h2>
          <p className="text-sm text-slate-400">
            Quản lý và giám sát các AI agents của bạn
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-900 border-slate-700 text-white w-full sm:w-64"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo Agent</span>
          </Button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
        {Object.entries(AGENT_CATEGORIES).map(([key, cat]) => {
          const count = key === 'all' ? agents.length : (categoryCounts[key] || 0);
          const isSelected = selectedCategory === key;
          
          return (
            <Button
              key={key}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key as AgentType | 'all')}
              className={`gap-1.5 flex-shrink-0 ${
                isSelected 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <Badge 
                variant="secondary" 
                className={`ml-1 text-xs ${isSelected ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                {count}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Agents Grid */}
      {filteredAgents.length === 0 ? (
        <Card className="bg-slate-900 border-slate-700 shadow-lg">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="w-16 h-16 text-slate-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-slate-200">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Không tìm thấy agent' 
                : 'Chưa có agent nào'
              }
            </h3>
            <p className="text-sm text-slate-400 mb-4 text-center max-w-md">
              {searchQuery || selectedCategory !== 'all'
                ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc'
                : 'Tạo agent đầu tiên của bạn để bắt đầu tự động hóa công việc'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Tạo Agent Mới
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onUpdate={fetchAgents} />
          ))}
        </div>
      )}

      {/* Create Agent Dialog */}
      <CreateAgentDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchAgents}
      />
    </div>
  );
};

export default AgentsDashboard;
