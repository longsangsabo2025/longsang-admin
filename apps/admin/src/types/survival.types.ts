/**
 * 🎯 Survival Dashboard Types
 * Eisenhower Matrix + ICE Scoring + 1-3-5 Rule
 * 
 * @author LongSang
 * @version 1.0.0
 */

// =====================================================
// TASK TYPES
// =====================================================

export interface SurvivalTask {
  id: string;
  title: string;
  description?: string;
  
  // Eisenhower Matrix
  urgent: boolean;
  important: boolean;
  quadrant: 'do_now' | 'schedule' | 'delegate' | 'eliminate';
  
  // ICE Scoring (1-10)
  impact: number;
  confidence: number;
  ease: number;
  ice_score: number; // impact * confidence * ease
  
  // 1-3-5 Rule
  size: 'major' | 'medium' | 'small';
  
  // Category
  category: 'freelance' | 'billiard' | 'marketing' | 'project' | 'personal' | 'other';
  
  // Money related
  potential_revenue?: number;
  currency?: 'USD' | 'VND';
  
  // Time
  estimated_minutes?: number;
  deadline?: string;
  
  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'deferred';
  completed_at?: string;
  
  // Meta
  created_at: string;
  updated_at: string;
  order_index: number;
}

// =====================================================
// EISENHOWER MATRIX
// =====================================================

export interface EisenhowerQuadrant {
  id: 'do_now' | 'schedule' | 'delegate' | 'eliminate';
  name: string;
  nameVi: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  tasks: SurvivalTask[];
}

export const EISENHOWER_QUADRANTS: Record<string, Omit<EisenhowerQuadrant, 'tasks'>> = {
  do_now: {
    id: 'do_now',
    name: 'Do Now',
    nameVi: 'Làm Ngay',
    description: 'Urgent + Important',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: '🔥',
  },
  schedule: {
    id: 'schedule',
    name: 'Schedule',
    nameVi: 'Lên Lịch',
    description: 'Important + Not Urgent',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    icon: '📅',
  },
  delegate: {
    id: 'delegate',
    name: 'Delegate',
    nameVi: 'Ủy Quyền',
    description: 'Urgent + Not Important',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: '👥',
  },
  eliminate: {
    id: 'eliminate',
    name: 'Eliminate',
    nameVi: 'Loại Bỏ',
    description: 'Not Urgent + Not Important',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10',
    borderColor: 'border-gray-500/30',
    icon: '🗑️',
  },
};

// =====================================================
// ICE SCORING
// =====================================================

export interface ICEScore {
  impact: number;      // 1-10: How much value?
  confidence: number;  // 1-10: How sure are you?
  ease: number;        // 1-10: How easy? (10 = easiest)
  total: number;       // impact * confidence * ease
}

export const calculateICE = (impact: number, confidence: number, ease: number): number => {
  return impact * confidence * ease;
};

// =====================================================
// 1-3-5 RULE
// =====================================================

export interface DailyPlan {
  date: string;
  major: SurvivalTask | null;      // 1 big task
  medium: SurvivalTask[];          // 3 medium tasks
  small: SurvivalTask[];           // 5 small tasks
  completed: {
    major: boolean;
    medium: number;
    small: number;
  };
}

export const MAX_DAILY_TASKS = {
  major: 1,
  medium: 3,
  small: 5,
};

// =====================================================
// CATEGORY CONFIG
// =====================================================

export interface CategoryConfig {
  id: string;
  name: string;
  nameVi: string;
  icon: string;
  color: string;
  priority: number; // Lower = higher priority in survival mode
}

export const TASK_CATEGORIES: CategoryConfig[] = [
  { id: 'freelance', name: 'Freelance', nameVi: 'Freelance', icon: '💼', color: 'text-green-500', priority: 1 },
  { id: 'billiard', name: 'Billiard Shop', nameVi: 'Quán Bida', icon: '🎱', color: 'text-purple-500', priority: 2 },
  { id: 'marketing', name: 'Marketing', nameVi: 'Marketing', icon: '📢', color: 'text-orange-500', priority: 3 },
  { id: 'project', name: 'Projects', nameVi: 'Dự Án', icon: '🚀', color: 'text-blue-500', priority: 4 },
  { id: 'personal', name: 'Personal', nameVi: 'Cá Nhân', icon: '👤', color: 'text-pink-500', priority: 5 },
  { id: 'other', name: 'Other', nameVi: 'Khác', icon: '📌', color: 'text-gray-500', priority: 6 },
];

// =====================================================
// SURVIVAL METRICS
// =====================================================

export interface SurvivalMetrics {
  daysRemaining: number;
  targetAmount: number;
  currentAmount: number;
  dailyTarget: number;
  currency: 'USD' | 'VND';
  
  // Progress
  tasksCompletedToday: number;
  tasksRemainingToday: number;
  streakDays: number;
  
  // Focus score (0-100)
  focusScore: number;
}

// =====================================================
// FOCUS MODE
// =====================================================

export interface FocusMode {
  enabled: boolean;
  currentTask: SurvivalTask | null;
  startedAt?: string;
  pomodoroMinutes: number;
  breakMinutes: number;
}
