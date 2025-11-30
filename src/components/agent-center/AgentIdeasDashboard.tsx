/**
 * 💡 AI Agent Ideas Dashboard
 *
 * Nơi lập kế hoạch và định hình ý tưởng cho các AI Agents
 * - Brainstorm ý tưởng mới
 * - Định nghĩa mục tiêu và use cases
 * - Phác thảo workflow
 * - Đánh giá khả thi
 * - Import từ n8n workflows
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lightbulb,
  Plus,
  Search,
  Star,
  StarOff,
  Rocket,
  Trash2,
  Edit3,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  Sparkles,
  ArrowRight,
  Filter,
  Workflow,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import N8nWorkflowLibrary from './N8nWorkflowLibrary';
import type { N8nWorkflow } from '@/services/n8n';
import { agentsApi } from '@/services/agent-center.service';
import type { CreateAgentDTO } from '@/types/agent-center.types';

// ============================================================
// TYPES
// ============================================================

type IdeaStatus = 'brainstorm' | 'planning' | 'ready' | 'in_development' | 'completed' | 'archived';
type IdeaPriority = 'low' | 'medium' | 'high' | 'critical';
type IdeaCategory = 'automation' | 'content' | 'data' | 'sales' | 'support' | 'research' | 'other';
type IdeaComplexity = 'simple' | 'medium' | 'complex';

interface AgentIdea {
  id: string;
  title: string;
  description: string;
  category: IdeaCategory;
  status: IdeaStatus;
  priority: IdeaPriority;
  use_cases: string[];
  target_audience: string;
  expected_benefits: string;
  technical_requirements: string;
  estimated_complexity: IdeaComplexity;
  is_starred: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CONSTANTS
// ============================================================

const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string; icon: React.ReactNode }> = {
  brainstorm: {
    label: 'Brainstorm',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    icon: <Brain className="w-3 h-3" />,
  },
  planning: {
    label: 'Planning',
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Target className="w-3 h-3" />,
  },
  ready: {
    label: 'Ready',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  in_development: {
    label: 'In Development',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: <Zap className="w-3 h-3" />,
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: <Rocket className="w-3 h-3" />,
  },
  archived: {
    label: 'Archived',
    color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    icon: <Clock className="w-3 h-3" />,
  },
};

const PRIORITY_CONFIG: Record<IdeaPriority, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/20 text-slate-400' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400' },
  high: { label: 'High', color: 'bg-orange-500/20 text-orange-400' },
  critical: { label: 'Critical', color: 'bg-red-500/20 text-red-400' },
};

const CATEGORY_CONFIG: Record<IdeaCategory, { label: string; icon: string }> = {
  automation: { label: 'Automation', icon: '⚙️' },
  content: { label: 'Content', icon: '✍️' },
  data: { label: 'Data', icon: '📊' },
  sales: { label: 'Sales', icon: '💼' },
  support: { label: 'Support', icon: '🎧' },
  research: { label: 'Research', icon: '🔬' },
  other: { label: 'Other', icon: '🎯' },
};

const COMPLEXITY_CONFIG = {
  simple: { label: 'Simple', color: 'text-green-400' },
  medium: { label: 'Medium', color: 'text-yellow-400' },
  complex: { label: 'Complex', color: 'text-red-400' },
};

// ============================================================
// PROPS
// ============================================================

interface AgentIdeasDashboardProps {
  onNavigateToTab?: (tab: string, subTab?: string) => void;
  onIdeaCompleted?: (idea: AgentIdea) => void;
}

// ============================================================
// COMPONENT
// ============================================================

const AgentIdeasDashboard = ({ onNavigateToTab, onIdeaCompleted }: AgentIdeasDashboardProps) => {
  const [ideas, setIdeas] = useState<AgentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  // Reserved for future edit functionality
  // const [editingIdea, setEditingIdea] = useState<AgentIdea | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'automation' as IdeaCategory,
    priority: 'medium' as IdeaPriority,
    use_cases: '',
    target_audience: '',
    expected_benefits: '',
    technical_requirements: '',
    estimated_complexity: 'medium' as IdeaComplexity,
    notes: '',
  });

  // Fetch ideas
  const fetchIdeas = useCallback(async () => {
    try {
      setLoading(true);

      // Try to fetch from Supabase
      const { data, error } = await supabase
        .from('agent_ideas')
        .select('*')
        .order('is_starred', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // If table doesn't exist, use local storage
        console.warn('Using local storage for ideas');
        const stored = localStorage.getItem('agent_ideas');
        if (stored) {
          setIdeas(JSON.parse(stored));
        }
      } else {
        setIdeas(data || []);
      }
    } catch (err) {
      console.error('Error fetching ideas:', err);
      // Fallback to local storage
      const stored = localStorage.getItem('agent_ideas');
      if (stored) {
        setIdeas(JSON.parse(stored));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  // Save to local storage as backup
  const saveToLocalStorage = (updatedIdeas: AgentIdea[]) => {
    localStorage.setItem('agent_ideas', JSON.stringify(updatedIdeas));
  };

  // Create idea
  const handleCreateIdea = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const newIdea: AgentIdea = {
      id: crypto.randomUUID(),
      title: formData.title,
      description: formData.description,
      category: formData.category,
      status: 'brainstorm',
      priority: formData.priority,
      use_cases: formData.use_cases.split('\n').filter(Boolean),
      target_audience: formData.target_audience,
      expected_benefits: formData.expected_benefits,
      technical_requirements: formData.technical_requirements,
      estimated_complexity: formData.estimated_complexity,
      is_starred: false,
      notes: formData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // @ts-expect-error - Table may not exist in Supabase types
      const { error } = await supabase.from('agent_ideas').insert(newIdea);

      if (error) {
        // Save to local storage if Supabase fails
        const updatedIdeas = [newIdea, ...ideas];
        setIdeas(updatedIdeas);
        saveToLocalStorage(updatedIdeas);
      } else {
        await fetchIdeas();
      }

      toast({ title: '✨ Idea Created!', description: `"${newIdea.title}" has been added` });
      setShowCreateDialog(false);
      resetForm();
    } catch {
      const updatedIdeas = [newIdea, ...ideas];
      setIdeas(updatedIdeas);
      saveToLocalStorage(updatedIdeas);
      toast({ title: 'Saved locally', description: 'Idea saved to local storage' });
      setShowCreateDialog(false);
      resetForm();
    }
  };

  // Update idea
  const handleUpdateIdea = async (id: string, updates: Partial<AgentIdea>) => {
    const updatedIdeas = ideas.map((idea) =>
      idea.id === id ? { ...idea, ...updates, updated_at: new Date().toISOString() } : idea
    );
    setIdeas(updatedIdeas);
    saveToLocalStorage(updatedIdeas);

    try {
      // @ts-expect-error - Table may not exist in Supabase types
      await supabase.from('agent_ideas').update(updates).eq('id', id);
    } catch {
      // Fallback to local storage
    }
  };

  // Handle status change with special actions
  const handleStatusChange = async (idea: AgentIdea, newStatus: IdeaStatus) => {
    // Update the status first
    await handleUpdateIdea(idea.id, { status: newStatus });

    // Special actions based on new status
    switch (newStatus) {
      case 'planning':
        toast({
          title: '📋 Planning Started',
          description: `"${idea.title}" is now in planning phase. Define use cases and requirements.`,
        });
        break;

      case 'ready':
        toast({
          title: '✅ Ready to Build!',
          description: `"${idea.title}" is ready. Click 'Build Agent' to create the AI agent.`,
        });
        break;

      case 'in_development':
        toast({
          title: '🚧 Development Started',
          description: `"${idea.title}" agent is now being developed.`,
        });
        break;

      case 'completed':
        toast({
          title: '🎉 Idea Completed!',
          description: `"${idea.title}" is complete! Navigating to Workflows tab...`,
        });
        // Call the callback to notify parent
        onIdeaCompleted?.(idea);
        // Navigate to workflows tab after a short delay
        setTimeout(() => {
          onNavigateToTab?.('workflows', 'templates');
        }, 1500);
        break;

      case 'archived':
        toast({
          title: '📦 Idea Archived',
          description: `"${idea.title}" has been archived.`,
        });
        break;

      default:
        break;
    }
  };

  // Delete idea
  const handleDeleteIdea = async (id: string) => {
    const updatedIdeas = ideas.filter((idea) => idea.id !== id);
    setIdeas(updatedIdeas);
    saveToLocalStorage(updatedIdeas);

    try {
      await supabase.from('agent_ideas').delete().eq('id', id);
    } catch {
      // Fallback to local storage
    }

    toast({ title: 'Deleted', description: 'Idea has been removed' });
  };

  // Toggle star
  const toggleStar = (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (idea) {
      handleUpdateIdea(id, { is_starred: !idea.is_starred });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'automation',
      priority: 'medium',
      use_cases: '',
      target_audience: '',
      expected_benefits: '',
      technical_requirements: '',
      estimated_complexity: 'medium',
      notes: '',
    });
    // Reserved for edit mode reset
  };

  // Convert idea to agent - ACTUALLY creates an agent in the database
  const convertToAgent = async (idea: AgentIdea) => {
    try {
      // Map idea category to valid AgentType
      // Valid types: 'work_agent' | 'research_agent' | 'content_creator' | 'data_analyst' | 'custom'
      const typeMapping: Record<
        IdeaCategory,
        'work_agent' | 'research_agent' | 'content_creator' | 'data_analyst' | 'custom'
      > = {
        automation: 'work_agent',
        content: 'content_creator',
        data: 'data_analyst',
        sales: 'work_agent',
        support: 'work_agent',
        research: 'research_agent',
        other: 'custom',
      };

      // Create the agent DTO
      const agentDTO: CreateAgentDTO = {
        name: idea.title,
        description: idea.description,
        type: typeMapping[idea.category],
        category: idea.category,
        config: {
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 2000,
          systemPrompt: `You are an AI agent for: ${idea.title}\n\nPurpose: ${idea.description}\n\nUse Cases:\n${idea.use_cases.join('\n')}\n\nTarget Audience: ${idea.target_audience}`,
        },
      };

      // Actually create the agent in database
      const newAgent = await agentsApi.create(agentDTO);

      // Update the idea status
      handleUpdateIdea(idea.id, { status: 'in_development' });

      toast({
        title: '🚀 Agent Created Successfully!',
        description: `"${idea.title}" is now a real agent with ID: ${newAgent.id.slice(0, 8)}...`,
      });

      console.log('✅ Agent created:', newAgent);
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: '❌ Failed to Create Agent',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: ideas.length,
    brainstorm: ideas.filter((i) => i.status === 'brainstorm').length,
    planning: ideas.filter((i) => i.status === 'planning').length,
    ready: ideas.filter((i) => i.status === 'ready').length,
    starred: ideas.filter((i) => i.is_starred).length,
  };

  // Handler for promoting n8n workflow to agent
  const handlePromoteN8nWorkflow = async (workflow: N8nWorkflow) => {
    // Create a new idea from n8n workflow
    const newIdea: AgentIdea = {
      id: crypto.randomUUID(),
      title: workflow.name,
      description: workflow.description || `Imported from n8n workflow: ${workflow.name}`,
      category: 'automation',
      status: 'ready',
      priority: 'high',
      use_cases: [`Automated workflow: ${workflow.name}`],
      target_audience: 'Internal team',
      expected_benefits: `Automate ${workflow.nodeCount || 0} steps`,
      technical_requirements: `n8n Workflow ID: ${workflow.id}`,
      estimated_complexity: (workflow.nodeCount || 0) > 10 ? 'complex' : 'medium',
      is_starred: false,
      notes: `Imported from n8n on ${new Date().toLocaleDateString()}. Trigger type: ${workflow.triggerType || 'manual'}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from('agent_ideas').insert([newIdea] as any);

      if (error) {
        // Fallback to local storage
        const updatedIdeas = [newIdea, ...ideas];
        setIdeas(updatedIdeas);
        saveToLocalStorage(updatedIdeas);
      } else {
        fetchIdeas();
      }

      toast({
        title: '🚀 Workflow Promoted!',
        description: `"${workflow.name}" has been added to Ideas as Ready to Build`,
      });
    } catch (err) {
      console.error('Error promoting workflow:', err);
      toast({
        title: 'Error',
        description: 'Failed to promote workflow',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="ideas" className="space-y-6">
      <TabsList className="bg-slate-800 border-slate-700">
        <TabsTrigger
          value="ideas"
          className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Ideas ({stats.total})
        </TabsTrigger>
        <TabsTrigger
          value="n8n"
          className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white"
        >
          <Workflow className="w-4 h-4 mr-2" />
          n8n Workflows
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ideas" className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-700 shadow-lg shadow-purple-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Total Ideas</CardTitle>
              <Lightbulb className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-700 shadow-lg shadow-blue-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Brainstorming</CardTitle>
              <Brain className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.brainstorm}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-950 to-indigo-900 border-indigo-700 shadow-lg shadow-indigo-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Planning</CardTitle>
              <Target className="h-4 w-4 text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.planning}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-700 shadow-lg shadow-green-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Ready to Build</CardTitle>
              <Rocket className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.ready}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-950 to-yellow-900 border-yellow-700 shadow-lg shadow-yellow-500/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">Starred</CardTitle>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.starred}</div>
            </CardContent>
          </Card>
        </div>

        {/* Header with Search & Create */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Agent Ideas
            </h2>
            <p className="text-sm text-slate-400">
              Brainstorm, plan, and shape your next AI agents
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-slate-200"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as IdeaStatus | 'all')}
            >
              <SelectTrigger className="w-40 bg-slate-900 border-slate-700">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <Plus className="w-4 h-4" />
                  New Idea
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-slate-100 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-purple-400" />
                    New AI Agent Idea
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Capture your idea for a new AI agent. Fill in as much as you can.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Title *</label>
                    <Input
                      placeholder="e.g., Customer Support Bot"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Description</label>
                    <Textarea
                      placeholder="Describe what this agent will do..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="bg-slate-800 border-slate-600 min-h-[80px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">Category</label>
                      <Select
                        value={formData.category}
                        onValueChange={(v) =>
                          setFormData({ ...formData, category: v as IdeaCategory })
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.icon} {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-200">Priority</label>
                      <Select
                        value={formData.priority}
                        onValueChange={(v) =>
                          setFormData({ ...formData, priority: v as IdeaPriority })
                        }
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-600">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Use Cases (one per line)
                    </label>
                    <Textarea
                      placeholder="- Automatically respond to customer inquiries&#10;- Route complex issues to humans&#10;- Track satisfaction metrics"
                      value={formData.use_cases}
                      onChange={(e) => setFormData({ ...formData, use_cases: e.target.value })}
                      className="bg-slate-800 border-slate-600 min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Target Audience</label>
                    <Input
                      placeholder="e.g., Small business owners, e-commerce stores"
                      value={formData.target_audience}
                      onChange={(e) =>
                        setFormData({ ...formData, target_audience: e.target.value })
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Expected Benefits</label>
                    <Textarea
                      placeholder="What value will this agent provide?"
                      value={formData.expected_benefits}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_benefits: e.target.value })
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Technical Requirements
                    </label>
                    <Textarea
                      placeholder="APIs needed, models to use, integrations required..."
                      value={formData.technical_requirements}
                      onChange={(e) =>
                        setFormData({ ...formData, technical_requirements: e.target.value })
                      }
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Estimated Complexity
                    </label>
                    <Select
                      value={formData.estimated_complexity}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          estimated_complexity: v as 'simple' | 'medium' | 'complex',
                        })
                      }
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simple">🟢 Simple (1-2 days)</SelectItem>
                        <SelectItem value="medium">🟡 Medium (3-5 days)</SelectItem>
                        <SelectItem value="complex">🔴 Complex (1+ week)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">Notes</label>
                    <Textarea
                      placeholder="Any additional thoughts or considerations..."
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateIdea} className="bg-purple-600 hover:bg-purple-700">
                    <Lightbulb className="w-4 h-4 mr-2" />
                    Create Idea
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Ideas Grid */}
        {filteredIdeas.length === 0 ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Lightbulb className="w-16 h-16 text-slate-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-slate-200">No ideas yet</h3>
              <p className="text-sm text-slate-400 mb-4">Start brainstorming your next AI agent!</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Idea
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea) => (
              <Card
                key={idea.id}
                className="bg-slate-900 border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{CATEGORY_CONFIG[idea.category].icon}</span>
                      <div>
                        <CardTitle className="text-lg text-slate-100 line-clamp-1">
                          {idea.title}
                        </CardTitle>
                        <CardDescription className="text-slate-400 text-xs">
                          {CATEGORY_CONFIG[idea.category].label}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleStar(idea.id)}
                      className="h-8 w-8"
                    >
                      {idea.is_starred ? (
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ) : (
                        <StarOff className="w-4 h-4 text-slate-500" />
                      )}
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {idea.description || 'No description yet'}
                  </p>

                  {/* Status & Priority */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`${STATUS_CONFIG[idea.status].color} flex items-center gap-1`}
                    >
                      {STATUS_CONFIG[idea.status].icon}
                      {STATUS_CONFIG[idea.status].label}
                    </Badge>
                    <Badge className={PRIORITY_CONFIG[idea.priority].color}>
                      {PRIORITY_CONFIG[idea.priority].label}
                    </Badge>
                    <span
                      className={`text-xs ${COMPLEXITY_CONFIG[idea.estimated_complexity].color}`}
                    >
                      {COMPLEXITY_CONFIG[idea.estimated_complexity].label}
                    </span>
                  </div>

                  {/* Use Cases Preview */}
                  {idea.use_cases.length > 0 && (
                    <div className="text-xs text-slate-500">
                      {idea.use_cases.length} use case{idea.use_cases.length > 1 ? 's' : ''} defined
                    </div>
                  )}

                  {/* Status Selector */}
                  <Select
                    value={idea.status}
                    onValueChange={(v) => handleStatusChange(idea, v as IdeaStatus)}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-800 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs">
                          <span className="flex items-center gap-2">
                            {config.icon} {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                    {/* Open in n8n button - show if idea has workflow ID */}
                    {idea.technical_requirements?.includes('n8n Workflow ID:') && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                        onClick={() => {
                          const match =
                            idea.technical_requirements.match(/n8n Workflow ID: ([\w-]+)/);
                          if (match) {
                            window.open(`http://localhost:5678/workflow/${match[1]}`, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        n8n
                      </Button>
                    )}
                    {idea.status === 'ready' && (
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => convertToAgent(idea)}
                      >
                        <Rocket className="w-3 h-3 mr-1" />
                        Build Agent
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => handleDeleteIdea(idea.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="n8n">
        <N8nWorkflowLibrary onPromoteToAgent={handlePromoteN8nWorkflow} />
      </TabsContent>
    </Tabs>
  );
};

export default AgentIdeasDashboard;
