/**
 * 🎯 Survival Dashboard Hooks
 * Data fetching và state management cho Survival Mode
 * 
 * @author LongSang
 * @version 1.0.0
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { 
  SurvivalTask, 
  DailyPlan, 
  SurvivalMetrics,
} from '@/types/survival.types';
import { calculateICE, MAX_DAILY_TASKS } from '@/types/survival.types';

// =====================================================
// QUERY KEYS
// =====================================================

export const survivalKeys = {
  all: ['survival'] as const,
  tasks: () => [...survivalKeys.all, 'tasks'] as const,
  tasksByQuadrant: (quadrant: string) => [...survivalKeys.tasks(), 'quadrant', quadrant] as const,
  dailyPlan: (date: string) => [...survivalKeys.all, 'daily-plan', date] as const,
  metrics: () => [...survivalKeys.all, 'metrics'] as const,
};

// =====================================================
// TASK HOOKS
// =====================================================

/**
 * Get all survival tasks
 */
export function useSurvivalTasks(status?: string) {
  return useQuery({
    queryKey: [...survivalKeys.tasks(), status],
    queryFn: async () => {
      let query = supabase
        .from('survival_tasks')
        .select('*')
        .order('ice_score', { ascending: false })
        .order('order_index', { ascending: true });
      
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        // Table might not exist yet, return empty array
        console.warn('Survival tasks table not found, using localStorage');
        return getLocalTasks();
      }
      
      return data as SurvivalTask[];
    },
  });
}

/**
 * Get tasks by Eisenhower quadrant
 */
export function useTasksByQuadrant(quadrant: string) {
  return useQuery({
    queryKey: survivalKeys.tasksByQuadrant(quadrant),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('survival_tasks')
        .select('*')
        .eq('quadrant', quadrant)
        .eq('status', 'pending')
        .order('ice_score', { ascending: false });
      
      if (error) {
        const localTasks = getLocalTasks();
        return localTasks.filter(t => t.quadrant === quadrant && t.status === 'pending');
      }
      
      return data as SurvivalTask[];
    },
  });
}

/**
 * Get today's daily plan (1-3-5 rule)
 */
export function useDailyPlan() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: survivalKeys.dailyPlan(today),
    queryFn: async () => {
      const tasks = getLocalTasks();
      const pendingTasks = tasks
        .filter(t => t.status === 'pending')
        .sort((a, b) => b.ice_score - a.ice_score);
      
      // Auto-assign based on 1-3-5 rule
      const majorTasks = pendingTasks.filter(t => t.size === 'major');
      const mediumTasks = pendingTasks.filter(t => t.size === 'medium');
      const smallTasks = pendingTasks.filter(t => t.size === 'small');
      
      const completedTasks = tasks.filter(t => 
        t.status === 'completed' && 
        t.completed_at?.startsWith(today)
      );
      
      const plan: DailyPlan = {
        date: today,
        major: majorTasks[0] || null,
        medium: mediumTasks.slice(0, MAX_DAILY_TASKS.medium),
        small: smallTasks.slice(0, MAX_DAILY_TASKS.small),
        completed: {
          major: completedTasks.some(t => t.size === 'major'),
          medium: completedTasks.filter(t => t.size === 'medium').length,
          small: completedTasks.filter(t => t.size === 'small').length,
        },
      };
      
      return plan;
    },
  });
}

/**
 * Get survival metrics
 */
export function useSurvivalMetrics() {
  return useQuery({
    queryKey: survivalKeys.metrics(),
    queryFn: async (): Promise<SurvivalMetrics> => {
      const tasks = getLocalTasks();
      const today = new Date().toISOString().split('T')[0];
      
      const completedToday = tasks.filter(t => 
        t.status === 'completed' && 
        t.completed_at?.startsWith(today)
      ).length;
      
      const pendingToday = tasks.filter(t => t.status === 'pending').length;
      
      // Get from localStorage or default
      const settings = getLocalSettings();
      
      return {
        daysRemaining: settings.daysRemaining || 30,
        targetAmount: settings.targetAmount || 2000,
        currentAmount: settings.currentAmount || 0,
        dailyTarget: Math.ceil((settings.targetAmount - settings.currentAmount) / settings.daysRemaining),
        currency: 'USD',
        tasksCompletedToday: completedToday,
        tasksRemainingToday: pendingToday,
        streakDays: settings.streakDays || 0,
        focusScore: calculateFocusScore(tasks),
      };
    },
  });
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: Partial<SurvivalTask>) => {
      const now = new Date().toISOString();
      const tasks = getLocalTasks();
      
      // Calculate quadrant
      const quadrant = getQuadrant(input.urgent ?? false, input.important ?? true);
      
      // Calculate ICE score
      const ice_score = calculateICE(
        input.impact ?? 5,
        input.confidence ?? 5,
        input.ease ?? 5
      );
      
      const newTask: SurvivalTask = {
        id: crypto.randomUUID(),
        title: input.title || 'Untitled Task',
        description: input.description,
        urgent: input.urgent ?? false,
        important: input.important ?? true,
        quadrant,
        impact: input.impact ?? 5,
        confidence: input.confidence ?? 5,
        ease: input.ease ?? 5,
        ice_score,
        size: input.size ?? 'medium',
        category: input.category ?? 'other',
        potential_revenue: input.potential_revenue,
        currency: input.currency ?? 'USD',
        estimated_minutes: input.estimated_minutes,
        deadline: input.deadline,
        status: 'pending',
        created_at: now,
        updated_at: now,
        order_index: tasks.length,
      };
      
      // Try Supabase first
      try {
        const { data, error } = await supabase
          .from('survival_tasks')
          .insert(newTask)
          .select()
          .single();
        
        if (!error && data) {
          return data as SurvivalTask;
        }
      } catch (e) {
        // Fall through to localStorage
      }
      
      // Fallback to localStorage
      tasks.push(newTask);
      saveLocalTasks(tasks);
      
      return newTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: survivalKeys.all });
      toast.success('Task đã được tạo! 🎯');
    },
    onError: (error) => {
      toast.error('Không thể tạo task: ' + (error as Error).message);
    },
  });
}

/**
 * Update task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<SurvivalTask> }) => {
      const now = new Date().toISOString();
      
      // Recalculate quadrant if urgent/important changed
      let quadrant = updates.quadrant;
      if (updates.urgent !== undefined || updates.important !== undefined) {
        const tasks = getLocalTasks();
        const existing = tasks.find(t => t.id === id);
        if (existing) {
          quadrant = getQuadrant(
            updates.urgent ?? existing.urgent,
            updates.important ?? existing.important
          );
        }
      }
      
      // Recalculate ICE if scores changed
      let ice_score = updates.ice_score;
      if (updates.impact !== undefined || updates.confidence !== undefined || updates.ease !== undefined) {
        const tasks = getLocalTasks();
        const existing = tasks.find(t => t.id === id);
        if (existing) {
          ice_score = calculateICE(
            updates.impact ?? existing.impact,
            updates.confidence ?? existing.confidence,
            updates.ease ?? existing.ease
          );
        }
      }
      
      const finalUpdates = {
        ...updates,
        ...(quadrant && { quadrant }),
        ...(ice_score && { ice_score }),
        updated_at: now,
      };
      
      // Try Supabase
      try {
        const { data, error } = await supabase
          .from('survival_tasks')
          .update(finalUpdates)
          .eq('id', id)
          .select()
          .single();
        
        if (!error && data) {
          return data as SurvivalTask;
        }
      } catch (e) {
        // Fall through to localStorage
      }
      
      // Fallback to localStorage
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...finalUpdates };
        saveLocalTasks(tasks);
        return tasks[index];
      }
      
      throw new Error('Task not found');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: survivalKeys.all });
    },
  });
}

/**
 * Complete task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const now = new Date().toISOString();
      
      // Try Supabase
      try {
        const { data, error } = await supabase
          .from('survival_tasks')
          .update({ status: 'completed', completed_at: now, updated_at: now })
          .eq('id', id)
          .select()
          .single();
        
        if (!error && data) {
          return data as SurvivalTask;
        }
      } catch (e) {
        // Fall through
      }
      
      // Fallback to localStorage
      const tasks = getLocalTasks();
      const index = tasks.findIndex(t => t.id === id);
      if (index !== -1) {
        tasks[index] = { 
          ...tasks[index], 
          status: 'completed', 
          completed_at: now,
          updated_at: now 
        };
        saveLocalTasks(tasks);
        
        // Update streak
        updateStreak();
        
        return tasks[index];
      }
      
      throw new Error('Task not found');
    },
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: survivalKeys.all });
      toast.success(`Hoàn thành: ${task.title} ✅`);
      
      if (task.potential_revenue) {
        toast.success(`+$${task.potential_revenue} potential! 💰`);
      }
    },
  });
}

/**
 * Delete task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Try Supabase
      try {
        const { error } = await supabase
          .from('survival_tasks')
          .delete()
          .eq('id', id);
        
        if (!error) return id;
      } catch (e) {
        // Fall through
      }
      
      // Fallback to localStorage
      const tasks = getLocalTasks();
      const filtered = tasks.filter(t => t.id !== id);
      saveLocalTasks(filtered);
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: survivalKeys.all });
      toast.success('Đã xóa task');
    },
  });
}

/**
 * Update survival settings (days remaining, target amount, etc.)
 */
export function useUpdateSurvivalSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (settings: Partial<SurvivalSettings>) => {
      const current = getLocalSettings();
      const updated = { ...current, ...settings };
      localStorage.setItem('survival_settings', JSON.stringify(updated));
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: survivalKeys.metrics() });
      toast.success('Đã cập nhật settings');
    },
  });
}

// =====================================================
// LOCAL STORAGE HELPERS
// =====================================================

interface SurvivalSettings {
  daysRemaining: number;
  targetAmount: number;
  currentAmount: number;
  streakDays: number;
  lastActiveDate: string;
}

function getLocalTasks(): SurvivalTask[] {
  try {
    const stored = localStorage.getItem('survival_tasks');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks: SurvivalTask[]) {
  localStorage.setItem('survival_tasks', JSON.stringify(tasks));
}

function getLocalSettings(): SurvivalSettings {
  try {
    const stored = localStorage.getItem('survival_settings');
    return stored ? JSON.parse(stored) : {
      daysRemaining: 30,
      targetAmount: 2000,
      currentAmount: 0,
      streakDays: 0,
      lastActiveDate: '',
    };
  } catch {
    return {
      daysRemaining: 30,
      targetAmount: 2000,
      currentAmount: 0,
      streakDays: 0,
      lastActiveDate: '',
    };
  }
}

function updateStreak() {
  const settings = getLocalSettings();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  if (settings.lastActiveDate === yesterday) {
    settings.streakDays += 1;
  } else if (settings.lastActiveDate !== today) {
    settings.streakDays = 1;
  }
  
  settings.lastActiveDate = today;
  localStorage.setItem('survival_settings', JSON.stringify(settings));
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

function getQuadrant(urgent: boolean, important: boolean): SurvivalTask['quadrant'] {
  if (urgent && important) return 'do_now';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'eliminate';
}

function calculateFocusScore(tasks: SurvivalTask[]): number {
  const today = new Date().toISOString().split('T')[0];
  const completedToday = tasks.filter(t => 
    t.status === 'completed' && 
    t.completed_at?.startsWith(today)
  );
  
  const totalToday = tasks.filter(t => 
    t.created_at.startsWith(today) || 
    (t.status === 'pending' && t.quadrant === 'do_now')
  );
  
  if (totalToday.length === 0) return 100;
  
  // Weight: do_now tasks are worth more
  let score = 0;
  let maxScore = 0;
  
  completedToday.forEach(t => {
    const weight = t.quadrant === 'do_now' ? 3 : t.quadrant === 'schedule' ? 2 : 1;
    score += weight * (t.size === 'major' ? 3 : t.size === 'medium' ? 2 : 1);
  });
  
  totalToday.forEach(t => {
    const weight = t.quadrant === 'do_now' ? 3 : t.quadrant === 'schedule' ? 2 : 1;
    maxScore += weight * (t.size === 'major' ? 3 : t.size === 'medium' ? 2 : 1);
  });
  
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 100;
}
