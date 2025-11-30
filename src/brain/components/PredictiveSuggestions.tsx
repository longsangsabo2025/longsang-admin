import { useTaskSuggestions, useReminders, usePredictions } from '@/brain/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Lightbulb, Bell, TrendingUp, Plus } from 'lucide-react';
import { useCreateTask } from '@/brain/hooks/useTasks';

export function PredictiveSuggestions() {
  const { data: taskSuggestions, isLoading: isLoadingTasks } = useTaskSuggestions();
  const { data: reminders, isLoading: isLoadingReminders } = useReminders();
  const { data: predictions, isLoading: isLoadingPredictions } = usePredictions();
  const createTaskMutation = useCreateTask();

  const handleCreateTaskFromSuggestion = async (suggestion: any) => {
    await createTaskMutation.mutateAsync({
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      source: 'master_brain_suggestion',
    });
  };

  if (isLoadingTasks || isLoadingReminders || isLoadingPredictions) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading suggestions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" /> Task Suggestions
          </CardTitle>
          <CardDescription>AI-suggested tasks based on your activity</CardDescription>
        </CardHeader>
        <CardContent>
          {taskSuggestions && taskSuggestions.length > 0 ? (
            <div className="space-y-3">
              {taskSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{suggestion.title}</p>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    <Badge variant="outline" className="mt-1">
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleCreateTaskFromSuggestion(suggestion)}
                    disabled={createTaskMutation.isPending}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No task suggestions at this time
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" /> Smart Reminders
          </CardTitle>
          <CardDescription>Important reminders and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {reminders && reminders.length > 0 ? (
            <div className="space-y-2">
              {reminders.map((reminder, index) => (
                <div key={index} className="p-3 border rounded">
                  <p className="text-sm">{reminder.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No reminders at this time</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Predictions
          </CardTitle>
          <CardDescription>AI predictions about what you might need</CardDescription>
        </CardHeader>
        <CardContent>
          {predictions && predictions.length > 0 ? (
            <div className="space-y-2">
              {predictions.map((prediction, index) => (
                <div key={index} className="p-3 border rounded">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">{prediction.message}</p>
                    <Badge variant="secondary">{(prediction.confidence * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No predictions available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
