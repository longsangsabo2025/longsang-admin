import { HighlightText } from '@/components/admin/HighlightText';
import { IdeaContextMenu } from '@/components/admin/IdeaContextMenu';
import { IdeaIntegrations } from '@/components/admin/IdeaIntegrations';
import { PlanningBoard } from '@/components/admin/PlanningBoard';
import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Edit,
  Lightbulb,
  Plus,
  Rocket,
  Search,
  Trash2,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface Idea {
  id: string;
  title: string;
  content: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'idea' | 'planning' | 'in-progress' | 'completed' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
}

const AdminIdeas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Restore scroll & persist search/filter states
  useScrollRestore('admin-ideas');
  const [searchQuery, setSearchQuery] = usePersistedState('admin-ideas-search', '');
  const [filterCategory, setFilterCategory] = usePersistedState('admin-ideas-category', 'all');
  const [filterStatus, setFilterStatus] = usePersistedState('admin-ideas-status', 'all');
  const [filterPriority, setFilterPriority] = usePersistedState('admin-ideas-priority', 'all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);

  // Smart defaults - Remember last used values
  const [lastCategory, setLastCategory] = usePersistedState('admin-ideas-last-category', 'general');
  const [lastPriority, setLastPriority] = usePersistedState('admin-ideas-last-priority', 'medium');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: lastCategory,
    priority: lastPriority as 'low' | 'medium' | 'high' | 'urgent',
    status: 'idea' as const,
    tags: [] as string[],
  });

  // Fetch ideas using React Query
  const { data: ideas = [], isLoading } = useQuery({
    queryKey: ['admin-ideas', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_ideas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Idea[];
    },
    enabled: !!user,
  });

  // Create/Update mutation
  const createUpdateMutation = useMutation({
    mutationFn: async (data: { id?: string; data: Partial<Idea> }) => {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from('admin_ideas')
          .update({
            ...data.data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase.from('admin_ideas').insert({
          ...data.data,
          user_id: user?.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });

      // Save smart defaults
      if (!editingIdea) {
        setLastCategory(formData.category);
        setLastPriority(formData.priority);
      }

      toast({
        title: editingIdea ? 'Idea updated!' : 'Idea captured! 🚀',
        description: editingIdea
          ? 'Your idea has been updated successfully'
          : 'Your idea has been saved. Time to execute!',
      });
      // Reset form (keep smart defaults)
      setFormData({
        title: '',
        content: '',
        category: lastCategory,
        priority: lastPriority as 'low' | 'medium' | 'high' | 'urgent',
        status: 'idea',
        tags: [],
      });
      setEditingIdea(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_ideas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      toast({
        title: 'Idea deleted',
        description: 'The idea has been removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Quick capture - Elon Musk style: FAST!
  const handleQuickCapture = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter at least a title for your idea',
        variant: 'destructive',
      });
      return;
    }

    createUpdateMutation.mutate({
      id: editingIdea?.id,
      data: formData,
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this idea?')) return;
    deleteMutation.mutate(id);
  };

  const handleEdit = (idea: Idea) => {
    setEditingIdea(idea);
    setFormData({
      title: idea.title,
      content: idea.content || '',
      category: idea.category,
      priority: idea.priority,
      status: idea.status,
      tags: idea.tags || [],
    });
    setIsDialogOpen(true);
  };

  // Filter ideas
  const filteredIdeas = ideas.filter((idea) => {
    const matchesSearch =
      searchQuery === '' ||
      idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      idea.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || idea.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || idea.priority === filterPriority;
    return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
  });

  // Export ideas
  const handleExport = () => {
    const dataStr = JSON.stringify(ideas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ideas-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({
      title: 'Export successful',
      description: 'Your ideas have been exported',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'planning':
        return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      default:
        return <Lightbulb className="h-4 w-4 text-yellow-600" />;
    }
  };

  const categories = [
    'general',
    'product',
    'marketing',
    'technical',
    'business',
    'ai',
    'automation',
    'other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-yellow-500" />
            Ideas & Planning
          </h1>
          <p className="text-muted-foreground mt-1">
            Capture ideas fast. Plan faster. Execute fastest. 🚀
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingIdea(null);
                  setFormData({
                    title: '',
                    content: '',
                    category: 'general',
                    priority: 'medium',
                    status: 'idea',
                    tags: [],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Quick Capture
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIdea ? 'Edit Idea' : 'Quick Capture Idea 🚀'}</DialogTitle>
                <DialogDescription>
                  Capture your idea in seconds. Details can come later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    placeholder="What's your idea? (Press Ctrl+Enter to save)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleQuickCapture();
                      }
                    }}
                    className="mt-1"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Details</label>
                  <Textarea
                    placeholder="Add more context, details, or thoughts... (Optional)"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleQuickCapture();
                      }
                    }}
                    className="mt-1 min-h-[120px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="idea">💡 Idea</SelectItem>
                      <SelectItem value="planning">📋 Planning</SelectItem>
                      <SelectItem value="in-progress">🚀 In Progress</SelectItem>
                      <SelectItem value="completed">✅ Completed</SelectItem>
                      <SelectItem value="archived">📦 Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleQuickCapture}>
                    <Zap className="h-4 w-4 mr-2" />
                    {editingIdea ? 'Update' : 'Capture'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="idea">💡 Idea</SelectItem>
                <SelectItem value="planning">📋 Planning</SelectItem>
                <SelectItem value="in-progress">🚀 In Progress</SelectItem>
                <SelectItem value="completed">✅ Completed</SelectItem>
                <SelectItem value="archived">📦 Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
                <SelectItem value="high">🟠 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🔵 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Ideas & Planning Board */}
      <Tabs defaultValue="ideas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ideas">
            <Lightbulb className="h-4 w-4 mr-2" />
            Ideas ({filteredIdeas.length})
          </TabsTrigger>
          <TabsTrigger value="planning">
            <Rocket className="h-4 w-4 mr-2" />
            Planning Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ideas" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading ideas...</p>
            </div>
          ) : filteredIdeas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No ideas found. Start capturing!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredIdeas.map((idea) => (
                <IdeaContextMenu key={idea.id} idea={idea}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {getStatusIcon(idea.status)}
                          <CardTitle className="text-lg line-clamp-2">
                            <HighlightText text={idea.title} searchQuery={searchQuery} />
                          </CardTitle>
                        </div>
                        <div
                          className={`h-3 w-3 rounded-full ${getPriorityColor(idea.priority)}`}
                        />
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">
                        {idea.content ? (
                          <HighlightText text={idea.content} searchQuery={searchQuery} />
                        ) : (
                          'No description'
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline">{idea.category}</Badge>
                        <Badge variant="outline">{idea.priority}</Badge>
                        {idea.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(idea)}
                          className="flex-1"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(idea.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </p>
                      {/* Integrations */}
                      <div className="mt-3 pt-3 border-t">
                        <IdeaIntegrations ideaId={idea.id} idea={idea} />
                      </div>
                    </CardContent>
                  </Card>
                </IdeaContextMenu>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="planning">
          <PlanningBoard ideas={ideas} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminIdeas;
