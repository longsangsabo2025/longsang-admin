/**
 * Shared types, constants, and helpers for the Survival Dashboard.
 */

import type { useDailyPlan, useSurvivalMetrics } from '@/hooks/use-survival';

// =====================================================
// TYPE ALIASES
// =====================================================

export type DailyPlanData = ReturnType<typeof useDailyPlan>['data'];
export type MetricsData = ReturnType<typeof useSurvivalMetrics>['data'];

// =====================================================
// PARSED TASK (Quick Import)
// =====================================================

export interface ParsedTask {
  title: string;
  category: string;
  size: 'major' | 'medium' | 'small';
  impact: number;
  confidence: number;
  ease: number;
  potential_revenue?: number;
  urgent: boolean;
  important: boolean;
}

// =====================================================
// PARSE TASKS FROM TEXT
// =====================================================

export function parseTasksFromText(text: string): ParsedTask[] {
  const lines = text.trim().split('\n').filter(line => line.trim());
  const tasks: ParsedTask[] = [];
  
  for (const line of lines) {
    // Skip empty lines, headers, separators
    if (!line.trim() || line.startsWith('#') || line.startsWith('|--') || line.startsWith('---')) continue;
    if (line.toLowerCase().includes('task') && line.toLowerCase().includes('category')) continue;
    
    // Try to parse as markdown table row: | Task | Category | Size | ICE | Potential $ |
    if (line.includes('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 3) {
        const [titlePart, categoryPart, sizePart, icePart, revenuePart] = parts;
        
        // Parse category
        const categoryMap: Record<string, string> = {
          'freelance': 'freelance',
          'billiard': 'billiard',
          'bida': 'billiard',
          'admin': 'admin',
          'learn': 'learn',
          'học': 'learn',
          'health': 'health',
          'sức khỏe': 'health',
          'other': 'other',
          'khác': 'other',
        };
        const category = Object.entries(categoryMap).find(
          ([key]) => categoryPart?.toLowerCase().includes(key)
        )?.[1] || 'other';
        
        // Parse size
        const sizeMap: Record<string, 'major' | 'medium' | 'small'> = {
          'major': 'major',
          'lớn': 'major',
          'big': 'major',
          'medium': 'medium',
          'vừa': 'medium',
          'small': 'small',
          'nhỏ': 'small',
        };
        const size = Object.entries(sizeMap).find(
          ([key]) => sizePart?.toLowerCase().includes(key)
        )?.[1] || 'medium';
        
        // Parse ICE (format: "I/C/E" or single score)
        let impact = 5, confidence = 5, ease = 5;
        if (icePart) {
          if (icePart.includes('/')) {
            const [i, c, e] = icePart.split('/').map(Number);
            impact = Math.min(10, Math.max(1, i || 5));
            confidence = Math.min(10, Math.max(1, c || 5));
            ease = Math.min(10, Math.max(1, e || 5));
          } else {
            const score = parseInt(icePart);
            if (!isNaN(score)) {
              // Reverse engineer from total score
              const perMetric = Math.round(Math.cbrt(score));
              impact = confidence = ease = Math.min(10, Math.max(1, perMetric));
            }
          }
        }
        
        // Parse revenue
        let potential_revenue: number | undefined;
        if (revenuePart) {
          const numMatch = revenuePart.replace(/[^0-9]/g, '');
          if (numMatch) potential_revenue = parseInt(numMatch);
        }
        
        // Determine urgency/importance based on size and category
        const urgent = size === 'major' || category === 'freelance';
        const important = size !== 'small';
        
        if (titlePart && titlePart.length > 2) {
          tasks.push({
            title: titlePart,
            category,
            size,
            impact,
            confidence,
            ease,
            potential_revenue,
            urgent,
            important,
          });
        }
      }
    } else {
      // Try to parse as simple line format: "Task Title - Category - Size"
      // Or just task title
      const parts = line.split(/[-–|,]/).map(p => p.trim());
      
      if (parts.length >= 1 && parts[0].length > 2) {
        const categoryMap: Record<string, string> = {
          'freelance': 'freelance', 'billiard': 'billiard', 'bida': 'billiard',
          'admin': 'admin', 'learn': 'learn', 'health': 'health', 'other': 'other',
        };
        const sizeMap: Record<string, 'major' | 'medium' | 'small'> = {
          'major': 'major', 'lớn': 'major', 'medium': 'medium', 'vừa': 'medium',
          'small': 'small', 'nhỏ': 'small',
        };
        
        let category = 'other';
        let size: 'major' | 'medium' | 'small' = 'medium';
        
        // Check if any part contains category or size hints
        for (const part of parts.slice(1)) {
          const lowerPart = part.toLowerCase();
          for (const [key, value] of Object.entries(categoryMap)) {
            if (lowerPart.includes(key)) category = value;
          }
          for (const [key, value] of Object.entries(sizeMap)) {
            if (lowerPart.includes(key)) size = value;
          }
        }
        
        tasks.push({
          title: parts[0],
          category,
          size,
          impact: 5,
          confidence: 5,
          ease: 5,
          urgent: size === 'major',
          important: true,
        });
      }
    }
  }
  
  return tasks;
}
