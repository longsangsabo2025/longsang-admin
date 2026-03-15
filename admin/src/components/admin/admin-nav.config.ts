import {
  Activity,
  BarChart3,
  Blocks,
  BookOpen,
  Bot,
  Brain,
  Bug,
  Calculator,
  Cpu,
  Database,
  DollarSign,
  FileText,
  GraduationCap,
  HardDrive,
  Home,
  Lightbulb,
  Settings,
  Sparkles,
  Target,
  Tv,
  Users,
  Video,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';

// Emoji map for pinned favorites
export const NAV_EMOJI: Record<string, string> = {
  '/admin/mission-control': '🎯',
  '/admin/command-center': '🏠',
  '/admin/survival': '⚡',
  '/admin/ideas': '💡',
  '/admin': '📊',
  '/admin/agent-registry': '🤖',
  '/admin/revenue': '💰',
  '/admin/marketing-engine': '📣',
  '/admin/product-settings': '⚙️',
  '/admin/youtube-channels': '📺',
  '/admin/pipeline-builder': '🔧',
  '/admin/video-factory': '🎬',
  '/admin/brain': '🧠',
  '/admin/ai-workspace': '💻',
  '/admin/brand': '👑',
  '/admin/ai-center': '🎮',
  '/admin/ai-cost': '💵',
  '/admin/n8n': '🔗',
  '/admin/social-media': '📱',
  '/admin/content-queue': '📝',
  '/admin/unified-analytics': '📈',
  '/admin/services-health': '🏥',
  '/admin/heartbeat': '💓',
  '/admin/library': '📚',
  '/admin/settings': '⚙️',
  '/admin/travis': '🤖',
  '/admin/system-map': '🗺️',
  '/admin/bug-system': '🐛',
  '/admin/database-schema': '🗄️',
  '/admin/docs': '📄',
  '/admin/backup': '💾',
  '/admin/users': '👥',
  '/admin/courses': '🎓',
  '/admin/feature-audit': '🔍',
};

export interface NavItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  color: string;
  bgColor: string;
  items: NavItem[];
  moreItems?: NavItem[];
}

export const adminNavGroups: NavGroup[] = [
  {
    label: '🎯 COMMAND',
    color: 'text-red-500',
    bgColor: 'hover:bg-red-500/10',
    items: [
      { title: 'Mission Control', icon: Target, href: '/admin/mission-control' },
      {
        title: 'Tasks',
        icon: Zap,
        href: '/admin/survival',
        description: 'Eisenhower + ICE daily planner',
      },
      { title: 'Dự Án', icon: Home, href: '/admin/command-center' },
    ],
    moreItems: [
      { title: 'Ideas', icon: Lightbulb, href: '/admin/ideas' },
      { title: 'Revenue', icon: DollarSign, href: '/admin/revenue' },
    ],
  },
  {
    label: '🎬 CONTENT',
    color: 'text-amber-500',
    bgColor: 'hover:bg-amber-500/10',
    items: [
      { title: 'YouTube Channels', icon: Tv, href: '/admin/youtube-channels' },
      { title: 'Pipeline Studio', icon: Workflow, href: '/admin/pipeline-builder' },
      { title: 'Video Factory', icon: Video, href: '/admin/video-factory' },
    ],
  },
  {
    label: '🤖 AI',
    color: 'text-purple-500',
    bgColor: 'hover:bg-purple-500/10',
    items: [
      {
        title: 'AI Chat',
        icon: Bot,
        href: '/admin/ai-workspace',
        description: 'Multi-assistant workspace',
      },
      { title: 'AI Brain', icon: Brain, href: '/admin/brain' },
      { title: 'Agents', icon: Blocks, href: '/admin/agent-registry' },
    ],
    moreItems: [
      { title: 'AI Cost', icon: Calculator, href: '/admin/ai-cost' },
      { title: 'n8n Workflows', icon: Workflow, href: '/admin/n8n' },
    ],
  },
  {
    label: '📊 MARKETING',
    color: 'text-green-500',
    bgColor: 'hover:bg-green-500/10',
    items: [
      { title: 'Social Hub', icon: Sparkles, href: '/admin/social-media' },
      { title: 'Content & SEO', icon: FileText, href: '/admin/content-queue' },
      { title: 'Analytics', icon: BarChart3, href: '/admin/unified-analytics' },
    ],
  },
  {
    label: '⚙️ HỆ THỐNG',
    color: 'text-slate-500',
    bgColor: 'hover:bg-slate-500/10',
    items: [
      { title: 'Health', icon: Activity, href: '/admin/services-health' },
      { title: 'Settings', icon: Settings, href: '/admin/settings' },
      { title: 'Files & Library', icon: BookOpen, href: '/admin/library' },
    ],
    moreItems: [
      { title: 'Travis AI', icon: Cpu, href: '/admin/travis' },
      { title: 'System Map', icon: Database, href: '/admin/system-map' },
      { title: 'Bug System', icon: Bug, href: '/admin/bug-system' },
      { title: 'Docs Manager', icon: FileText, href: '/admin/docs' },
      { title: 'Backup', icon: HardDrive, href: '/admin/backup' },
      { title: 'Users', icon: Users, href: '/admin/users' },
      { title: 'Courses', icon: GraduationCap, href: '/admin/courses' },
    ],
  },
];
