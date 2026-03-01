import { useAuth } from '@/components/auth/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  Rocket,
  Trash2,
  XCircle,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

interface PlanningItem {
  id: string;
  idea_id: string | null;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done' | 'cancelled';
  position: number;
  created_at: string;
}

interface PlanningBoardProps {
  readonly ideas: any[];
}

export function PlanningBoard({ ideas }: PlanningBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlanningItem | null>(null);

  const [formData, setFormData] = useState({
    idea_id: '',
    title: '',
    description: '',
    due_date: '',
    priority: 'medium' as const,
    status: 'todo' as const,
  });

  // Fetch planning items using React Query
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['admin-planning-items', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_planning_items')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as PlanningItem[];
    },
    enabled: !!user,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: { id?: string; data: Partial<PlanningItem> }) => {
      if (data.id) {
        // Update
        const { error } = await supabase
          .from('admin_planning_items')
          .update({
            ...data.data,
            idea_id: data.data.idea_id || null,
            due_date: data.data.due_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        // Create
        const maxPosition = items.length > 0 ? Math.max(...items.map((i) => i.position)) : 0;
        const { error } = await supabase.from('admin_planning_items').insert({
          ...data.data,
          user_id: user?.id,
          idea_id: data.data.idea_id || null,
          due_date: data.data.due_date || null,
          position: maxPosition + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planning-items'] });
      toast({
        title: editingItem ? 'Item updated!' : 'Item added! 🚀',
        description: editingItem ? 'Planning item has been updated' : 'New planning item created',
      });
      setFormData({
        idea_id: '',
        title: '',
        description: '',
        due_date: '',
        priority: 'medium',
        status: 'todo',
      });
      setEditingItem(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error saving item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('admin_planning_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planning-items'] });
      toast({
        title: 'Item deleted',
        description: 'Planning item has been removed',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting item',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (status === 'done') {
        updateData.completed_at = new Date().toISOString();
      }
      const { error } = await supabase.from('admin_planning_items').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-planning-items'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title',
        variant: 'destructive',
      });
      return;
    }

    saveMutation.mutate({
      id: editingItem?.id,
      data: formData,
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this planning item?')) return;
    deleteMutation.mutate(id);
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleEdit = (item: PlanningItem) => {
    setEditingItem(item);
    setFormData({
      idea_id: item.idea_id || '',
      title: item.title,
      description: item.description || '',
      due_date: item.due_date ? item.due_date.split('T')[0] : '',
      priority: item.priority,
      status: item.status,
    });
    setIsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
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

  const columns = [
    { id: 'todo', title: 'To Do', icon: Clock },
    { id: 'in-progress', title: 'In Progress', icon: Rocket },
    { id: 'done', title: 'Done', icon: CheckCircle2 },
    { id: 'cancelled', title: 'Cancelled', icon: XCircle },
  ];

  const getItemsByStatus = (status: string) => {
    return items.filter((item) => item.status === status);
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading planning board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick Add Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  idea_id: '',
                  title: '',
                  description: '',
                  due_date: '',
                  priority: 'medium',
                  status: 'todo',
                });
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Quick Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Planning Item' : 'Quick Add Task 🚀'}</DialogTitle>
              <DialogDescription>
                Add a task to your planning board. Fast execution starts here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Link to Idea (Optional)</label>
                <Select
                  value={formData.idea_id}
                  onValueChange={(value) => setFormData({ ...formData, idea_id: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select an idea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {ideas.map((idea) => (
                      <SelectItem key={idea.id} value={idea.id}>
                        {idea.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="What needs to be done?"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Add details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="mt-1"
                  />
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
                    <SelectItem value="todo">📋 To Do</SelectItem>
                    <SelectItem value="in-progress">🚀 In Progress</SelectItem>
                    <SelectItem value="done">✅ Done</SelectItem>
                    <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  <Zap className="h-4 w-4 mr-2" />
                  {editingItem ? 'Update' : 'Add Task'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const Icon = column.icon;
          const columnItems = getItemsByStatus(column.id);

          return (
            <Card key={column.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {column.title} ({columnItems.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-2 overflow-y-auto max-h-[600px]">
                {columnItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">No items</div>
                ) : (
                  columnItems.map((item) => (
                    <Card
                      key={item.id}
                      className="hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{item.title}</h4>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div
                            className={`h-2 w-2 rounded-full ${getPriorityColor(item.priority)}`}
                          />
                        </div>

                        {item.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.due_date).toLocaleDateString()}
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.priority}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(item)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
                              className="h-6 w-6 p-0 text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Quick Status Change */}
                        <div className="flex gap-1 mt-2">
                          {columns
                            .filter((col) => col.id !== item.status)
                            .map((col) => {
                              const ColIcon = col.icon;
                              return (
                                <Button
                                  key={col.id}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleStatusChange(item.id, col.id)}
                                  className="h-6 px-2 text-xs"
                                >
                                  <ColIcon className="h-3 w-3" />
                                </Button>
                              );
                            })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
