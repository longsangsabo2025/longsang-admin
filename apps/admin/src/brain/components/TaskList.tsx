import { useCreateTask, useDeleteTask, useTasks, useUpdateTask } from '@/brain/hooks/useTasks';
import type { Task } from '@/brain/types/task.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Plus, Edit, Trash2, CheckCircle, Flag, CalendarDays } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO } from 'date-fns';

export function TaskList() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Task['status']>('open');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [dueDate, setDueDate] = useState<string>('');

  const { data: tasks, isLoading: isLoadingTasks } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  useEffect(() => {
    if (isEditDialogOpen && currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description || '');
      setStatus(currentTask.status);
      setPriority(currentTask.priority);
      setDueDate(currentTask.due_date ? format(parseISO(currentTask.due_date), 'yyyy-MM-dd') : '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('open');
      setPriority('medium');
      setDueDate('');
    }
  }, [isEditDialogOpen, currentTask]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStatus('open');
    setPriority('medium');
    setDueDate('');
    setCurrentTask(null);
  };

  const handleCreateTask = async () => {
    if (!title.trim()) return;
    try {
      await createTaskMutation.mutateAsync({
        title,
        description,
        status,
        priority,
        dueDate: dueDate || undefined,
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch {
      // handled by hook
    }
  };

  const handleUpdateTask = async () => {
    if (!currentTask || !title.trim()) return;
    try {
      await updateTaskMutation.mutateAsync({
        id: currentTask.id,
        updates: {
          title,
          description,
          status,
          priority,
          dueDate: dueDate || undefined,
        },
      });
      setIsEditDialogOpen(false);
      resetForm();
    } catch {
      // handled by hook
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTaskMutation.mutateAsync(id);
    }
  };

  const getStatusBadgeVariant = (taskStatus: Task['status']) => {
    switch (taskStatus) {
      case 'open':
        return 'secondary';
      case 'in_progress':
        return 'outline';
      case 'done':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (taskPriority: Task['priority']) => {
    switch (taskPriority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const renderTaskForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="task-title">Title</Label>
        <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="task-description">Description</Label>
        <Textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>
      <div>
        <Label htmlFor="task-status">Status</Label>
        <Select value={status} onValueChange={(value) => setStatus(value as Task['status'])}>
          <SelectTrigger id="task-status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="task-priority">Priority</Label>
        <Select value={priority} onValueChange={(value) => setPriority(value as Task['priority'])}>
          <SelectTrigger id="task-priority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="task-due-date">Due Date</Label>
        <Input
          id="task-due-date"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5" /> Your Tasks
          </CardTitle>
          <CardDescription>
            Manage your personal tasks, created manually or by AI workflows.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Create New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>Add a new task to your list.</DialogDescription>
              </DialogHeader>
              {renderTaskForm()}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTask}
                  disabled={createTaskMutation.isPending || !title.trim()}
                >
                  {createTaskMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-lg font-semibold mt-6 mb-3">All Tasks</h3>
          {isLoadingTasks ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading tasks...</p>
            </div>
          ) : tasks && tasks.length > 0 ? (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {tasks.map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
                        <Badge
                          variant={getPriorityBadgeVariant(task.priority)}
                          className="flex items-center gap-1"
                        >
                          <Flag className="h-3 w-3" /> {task.priority}
                        </Badge>
                        <Dialog
                          open={isEditDialogOpen && currentTask?.id === task.id}
                          onOpenChange={(open) => {
                            setIsEditDialogOpen(open);
                            if (open) setCurrentTask(task);
                            else resetForm();
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon" title="Edit Task">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Edit Task</DialogTitle>
                              <DialogDescription>
                                Modify the details of your task.
                              </DialogDescription>
                            </DialogHeader>
                            {renderTaskForm()}
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button
                                onClick={handleUpdateTask}
                                disabled={updateTaskMutation.isPending || !title.trim()}
                              >
                                {updateTaskMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={deleteTaskMutation.isPending}
                          title="Delete Task"
                        >
                          {deleteTaskMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> Due:{' '}
                        {format(parseISO(task.due_date), 'MMM dd, yyyy')}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground">No tasks found. Create one above!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
