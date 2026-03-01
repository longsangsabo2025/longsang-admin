/**
 * 🎯 SURVIVAL DASHBOARD
 * 
 * Mỗi sáng mở lên, thấy ngay phải làm gì:
 * - Eisenhower Matrix: Urgent vs Important
 * - ICE Scoring: Tự động rank tasks
 * - 1-3-5 Rule: 1 major + 3 medium + 5 small
 * - Focus Mode: Một việc tại một thời điểm
 * 
 * @author LongSang
 * @version 1.0.0
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ClipboardPaste,
  ListTodo,
  Plus,
  RefreshCw,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react';
import {
  useSurvivalTasks,
  useDailyPlan,
  useSurvivalMetrics,
  useCompleteTask,
} from '@/hooks/use-survival';
import type { SurvivalTask } from '@/types/survival.types';

import { SurvivalMetricsBar } from './survival-dashboard/SurvivalMetricsBar';
import { DailyPlanView } from './survival-dashboard/DailyPlanView';
import { EisenhowerMatrixView } from './survival-dashboard/EisenhowerMatrixView';
import { ICERankingView } from './survival-dashboard/ICERankingView';
import { FocusModeView } from './survival-dashboard/FocusModeView';
import { QuickImportDialog } from './survival-dashboard/QuickImportDialog';
import { AddTaskForm } from './survival-dashboard/AddTaskForm';
import { SurvivalSettings } from './survival-dashboard/SurvivalSettings';

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function SurvivalDashboard() {
  const [activeView, setActiveView] = useState<'daily' | 'matrix' | 'all'>('daily');
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQuickImportOpen, setIsQuickImportOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [focusTask, setFocusTask] = useState<SurvivalTask | null>(null);
  
  // Data hooks
  const { data: tasks = [], refetch: refetchTasks } = useSurvivalTasks('pending');
  const { data: dailyPlan, isLoading: planLoading } = useDailyPlan();
  const { data: metrics, isLoading: metricsLoading } = useSurvivalMetrics();
  
  // Mutations
  const completeTask = useCompleteTask();
  
  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Chào buổi sáng', emoji: '🌅' };
    if (hour < 18) return { text: 'Chào buổi chiều', emoji: '☀️' };
    return { text: 'Chào buổi tối', emoji: '🌙' };
  };
  
  const greeting = getGreeting();
  
  // Group tasks by quadrant
  const tasksByQuadrant = {
    do_now: tasks.filter(t => t.quadrant === 'do_now'),
    schedule: tasks.filter(t => t.quadrant === 'schedule'),
    delegate: tasks.filter(t => t.quadrant === 'delegate'),
    eliminate: tasks.filter(t => t.quadrant === 'eliminate'),
  };
  
  // Enter focus mode
  const handleStartFocus = (task: SurvivalTask) => {
    setFocusTask(task);
    setFocusMode(true);
  };
  
  // Exit focus mode
  const handleExitFocus = () => {
    setFocusMode(false);
    setFocusTask(null);
  };
  
  // Complete task from focus mode
  const handleCompleteFocusTask = () => {
    if (focusTask) {
      completeTask.mutate(focusTask.id);
      handleExitFocus();
    }
  };

  // =====================================================
  // FOCUS MODE VIEW
  // =====================================================
  
  if (focusMode && focusTask) {
    return (
      <FocusModeView
        task={focusTask}
        onComplete={handleCompleteFocusTask}
        onExit={handleExitFocus}
        onSkip={() => {
          handleExitFocus();
          // Find next task
          const nextTask = tasks.find(t => t.id !== focusTask.id && t.quadrant === 'do_now');
          if (nextTask) handleStartFocus(nextTask);
        }}
      />
    );
  }

  // =====================================================
  // MAIN VIEW
  // =====================================================
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6 text-red-500" />
              Survival Mode
            </h1>
            <p className="text-muted-foreground">
              {greeting.emoji} {greeting.text}! Tập trung vào những gì quan trọng nhất.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchTasks()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
              <Settings className="h-4 w-4" />
            </Button>
            <Dialog open={isQuickImportOpen} onOpenChange={setIsQuickImportOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary">
                  <ClipboardPaste className="h-4 w-4 mr-1" />
                  Quick Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <QuickImportDialog onSuccess={() => setIsQuickImportOpen(false)} />
              </DialogContent>
            </Dialog>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm Task
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <AddTaskForm onSuccess={() => setIsAddTaskOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Survival Metrics Bar */}
      <SurvivalMetricsBar metrics={metrics} isLoading={metricsLoading} />

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="mt-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="daily" className="gap-2">
            <ListTodo className="h-4 w-4" />
            1-3-5 Hôm Nay
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Target className="h-4 w-4" />
            Eisenhower
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            ICE Ranking
          </TabsTrigger>
        </TabsList>

        {/* Daily Plan (1-3-5) */}
        <TabsContent value="daily" className="mt-4">
          <DailyPlanView 
            plan={dailyPlan} 
            isLoading={planLoading}
            onStartFocus={handleStartFocus}
            onComplete={(id) => completeTask.mutate(id)}
          />
        </TabsContent>

        {/* Eisenhower Matrix */}
        <TabsContent value="matrix" className="mt-4">
          <EisenhowerMatrixView 
            tasksByQuadrant={tasksByQuadrant}
            onStartFocus={handleStartFocus}
            onComplete={(id) => completeTask.mutate(id)}
          />
        </TabsContent>

        {/* All Tasks (ICE Ranked) */}
        <TabsContent value="all" className="mt-4">
          <ICERankingView 
            tasks={tasks}
            onStartFocus={handleStartFocus}
            onComplete={(id) => completeTask.mutate(id)}
          />
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <SurvivalSettings onClose={() => setIsSettingsOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
