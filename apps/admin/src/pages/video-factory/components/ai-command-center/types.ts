// ─── AI Command Center Types & Config ──────────────────────────────────────

export type AISkill =
  | 'viral-scripts'
  | 'content-calendar'
  | 'repurpose'
  | 'trend-scout'
  | 'video-script'
  | 'seo-metadata';

export interface AISkillConfig {
  id: AISkill;
  name: string;
  icon: string;
  desc: string;
  color: string;
}

export const AI_SKILLS: AISkillConfig[] = [
  { id: 'viral-scripts', name: 'Viral Scriptwriter', icon: '🎬', desc: 'Full viral scripts with hooks, scenes, CTAs', color: 'border-red-500/30 bg-red-500/5' },
  { id: 'content-calendar', name: 'Content Calendar', icon: '📅', desc: 'Auto-plan 7-30 days of content', color: 'border-blue-500/30 bg-blue-500/5' },
  { id: 'repurpose', name: 'Content Repurpose', icon: '🔄', desc: '1 idea → 6 platform variations', color: 'border-green-500/30 bg-green-500/5' },
  { id: 'trend-scout', name: 'Trend Scout', icon: '🎯', desc: 'Find trending topics & content ideas', color: 'border-orange-500/30 bg-orange-500/5' },
  { id: 'video-script', name: 'Script Writer', icon: '✍️', desc: 'Narration scripts with scene prompts', color: 'border-purple-500/30 bg-purple-500/5' },
  { id: 'seo-metadata', name: 'SEO & Captions', icon: '🏷️', desc: 'Titles, descriptions, hashtags', color: 'border-cyan-500/30 bg-cyan-500/5' },
];
