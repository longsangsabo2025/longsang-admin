/**
 * 🎯 Quick Actions Context Menu for Ideas
 *
 * Right-click menu với các quick actions:
 * - Convert to Task
 * - Set Priority
 * - Change Status
 * - Archive
 * - Delete
 */

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Rocket,
  Trash2,
  Zap,
} from 'lucide-react';

interface IdeaContextMenuProps {
  idea: {
    id: string;
    title: string;
    status: string;
    priority: string;
  };
  onConvertToTask?: () => void;
  children: React.ReactNode;
}

export function IdeaContextMenu({ idea, onConvertToTask, children }: IdeaContextMenuProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Status change mutation
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase
        .from('admin_ideas')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idea.id);
      if (error) throw error;
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      toast({
        title: 'Status updated!',
        description: `Idea moved to ${status}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Priority change mutation
  const priorityMutation = useMutation({
    mutationFn: async (priority: string) => {
      const { error } = await supabase
        .from('admin_ideas')
        .update({
          priority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', idea.id);
      if (error) throw error;
    },
    onSuccess: (_, priority) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      toast({
        title: 'Priority updated!',
        description: `Priority set to ${priority}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating priority',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('admin_ideas')
        .update({
          status: 'archived',
          updated_at: new Date().toISOString(),
        })
        .eq('id', idea.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ideas'] });
      toast({
        title: 'Idea archived',
        description: 'The idea has been moved to archive',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error archiving idea',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('admin_ideas').delete().eq('id', idea.id);
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

  const handleStatusChange = (status: string) => {
    statusMutation.mutate(status);
  };

  const handlePriorityChange = (priority: string) => {
    priorityMutation.mutate(priority);
  };

  const handleArchive = () => {
    if (confirm(`Archive "${idea.title}"?`)) {
      archiveMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${idea.title}"? This cannot be undone.`)) {
      deleteMutation.mutate();
    }
  };

  const handleConvertToTask = () => {
    if (onConvertToTask) {
      onConvertToTask();
    } else {
      toast({
        title: 'Convert to Task',
        description: 'Opening planning board...',
      });
      // Navigate to planning board with idea pre-filled
      window.location.href = `/admin/ideas?tab=planning&idea=${idea.id}`;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={handleConvertToTask}>
          <ArrowRight className="mr-2 h-4 w-4" />
          Convert to Task
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Clock className="mr-2 h-4 w-4" />
            Change Status
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handleStatusChange('idea')}>
              <Zap className="mr-2 h-4 w-4" />
              💡 Idea
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('planning')}>
              <Calendar className="mr-2 h-4 w-4" />
              📋 Planning
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('in-progress')}>
              <Rocket className="mr-2 h-4 w-4" />
              🚀 In Progress
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handleStatusChange('completed')}>
              <CheckCircle2 className="mr-2 h-4 w-4" />✅ Completed
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Zap className="mr-2 h-4 w-4" />
            Set Priority
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => handlePriorityChange('urgent')}>
              <span className="mr-2">🔴</span>
              Urgent
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handlePriorityChange('high')}>
              <span className="mr-2">🟠</span>
              High
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handlePriorityChange('medium')}>
              <span className="mr-2">🟡</span>
              Medium
            </ContextMenuItem>
            <ContextMenuItem onClick={() => handlePriorityChange('low')}>
              <span className="mr-2">🔵</span>
              Low
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={handleArchive}>
          <Archive className="mr-2 h-4 w-4" />
          Archive
        </ContextMenuItem>

        <ContextMenuItem onClick={handleDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
