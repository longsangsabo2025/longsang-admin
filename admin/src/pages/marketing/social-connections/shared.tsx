import { Badge } from '@/components/ui/badge';
import { type Project, type ProjectSocialAccount } from '@/lib/projects';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface StoredCredential {
  id: string;
  platform: string;
  credentials: Record<string, any>;
  settings: Record<string, any>;
  account_info: {
    name?: string;
    username?: string;
    id?: string;
    followers?: number;
    subscribers?: number;
    videos?: number;
    views?: number;
    pages?: number;
    accounts?: number;
    profileUrl?: string;
    channelId?: string;
    mainPageId?: string;
    fans?: number;
    primaryId?: string;
  };
  is_active: boolean;
  last_tested_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  name: string;
  username?: string;
  type: 'page' | 'profile' | 'channel' | 'account';
  followers?: number;
  tokenStatus: 'permanent' | 'active' | 'expiring' | 'expired';
  tokenExpiry?: string;
  lastPost?: string;
}

export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  connected: boolean;
  accounts: SocialAccount[];
  capabilities: string[];
  notes?: string;
}

export interface ProjectWithSocial extends Project {
  social_accounts?: ProjectSocialAccount[];
}

// ═══════════════════════════════════════════════════════════════
// CONNECTED PLATFORMS DATA
// ═══════════════════════════════════════════════════════════════

export const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👥',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950 dark:bg-blue-950 border-blue-800',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post videos', 'Schedule posts', 'Page insights'],
    accounts: [
      {
        id: '118356497898536',
        name: 'SABO Billiards - TP. Vũng Tàu',
        type: 'page',
        followers: 18850,
        tokenStatus: 'permanent',
      },
      { id: '719273174600166', name: 'SABO ARENA', type: 'page', tokenStatus: 'permanent' },
      { id: '569671719553461', name: 'AI Newbie VN', type: 'page', tokenStatus: 'permanent' },
      { id: '332950393234346', name: 'SABO Media', type: 'page', tokenStatus: 'permanent' },
      { id: '618738001318577', name: 'AI Art Newbie', type: 'page', tokenStatus: 'permanent' },
      { id: '569652129566651', name: 'SABO Billiard Shop', type: 'page', tokenStatus: 'permanent' },
      { id: '519070237965883', name: 'Thợ Săn Hoàng Hôn', type: 'page', tokenStatus: 'permanent' },
    ],
    notes: 'Tất cả Page tokens đều PERMANENT - không bao giờ hết hạn!',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: 'text-pink-400',
    bgColor: 'bg-gradient-to-br from-purple-950 to-pink-950 border-pink-800',
    connected: true,
    capabilities: ['Post images', 'Post videos', 'Post carousels', 'Reels', 'Stories (coming)'],
    accounts: [
      {
        id: '17841474279844606',
        name: 'SABO Billiards | TP. Vũng Tàu',
        username: 'sabobilliard',
        type: 'account',
        followers: 17,
        tokenStatus: 'permanent',
      },
      {
        id: '17841472718907470',
        name: 'SABO Bida',
        username: 'sabomediavt',
        type: 'account',
        followers: 4,
        tokenStatus: 'permanent',
      },
      {
        id: '17841474205608601',
        name: 'Long Sang AI Automation',
        username: 'newbiehocmake',
        type: 'account',
        tokenStatus: 'permanent',
      },
      {
        id: '17841472893889754',
        name: 'SABO Bida Shop',
        username: 'sabobidashop',
        type: 'account',
        followers: 3,
        tokenStatus: 'permanent',
      },
      {
        id: '17841472996653110',
        name: 'LS Fusion Lab',
        username: 'lsfusionlab',
        type: 'account',
        followers: 5,
        tokenStatus: 'permanent',
      },
    ],
    notes: 'Dùng Page Token tương ứng để post. Token PERMANENT!',
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post videos', 'Carousels', 'Reply to threads'],
    accounts: [
      {
        id: '25295715200066837',
        name: 'Vũng Tàu',
        username: 'baddie.4296',
        type: 'profile',
        tokenStatus: 'active',
        tokenExpiry: '~60 days',
      },
    ],
    notes: 'Token cần refresh sau 60 ngày',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'text-blue-400',
    bgColor: 'bg-blue-950 border-blue-800',
    connected: true,
    capabilities: ['Post text', 'Post images', 'Post articles', 'Post documents'],
    accounts: [
      {
        id: 'HhV8LImTty',
        name: 'Long Sang',
        username: 'longsangautomation@gmail.com',
        type: 'profile',
        tokenStatus: 'active',
        tokenExpiry: '~60 days (Jan 25, 2026)',
      },
    ],
    notes: 'Token cần refresh sau 60 ngày. Có thể post lên Company Page nếu có quyền.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    color: 'text-red-400',
    bgColor: 'bg-red-950 border-red-800',
    connected: true,
    capabilities: ['Upload videos', 'Create playlists', 'Update metadata', 'Read analytics'],
    accounts: [
      {
        id: 'UCh08dvkDfJVJ8f1C-TbXbew',
        name: 'Long Sang',
        type: 'channel',
        followers: 12,
        tokenStatus: 'active',
        tokenExpiry: 'Auto-refresh với Refresh Token',
      },
    ],
    notes: '🔄 Có Refresh Token - tự động renew khi hết hạn!',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: '𝕏',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: false,
    capabilities: ['Post tweets', 'Post images', 'Post videos', 'Threads'],
    accounts: [],
    notes: '⚠️ Yêu cầu Basic tier ($100/tháng) để có write access',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'text-white',
    bgColor: 'bg-gray-900 border-gray-700',
    connected: false,
    capabilities: ['Upload videos (3-60s)', 'Read analytics'],
    accounts: [],
    notes: '⚠️ Cần TikTok Developer approval (miễn phí nhưng mất 1-2 tuần duyệt)',
  },
];

// ═══════════════════════════════════════════════════════════════
// CREDENTIAL INFO (để hiển thị, không phải real tokens)
// ═══════════════════════════════════════════════════════════════

export const CREDENTIAL_SUMMARY = {
  facebook: {
    appId: '1340824257525630',
    appName: 'Long Sang Automation',
    tokenType: 'Page Access Tokens (Permanent)',
    lastUpdated: 'Nov 26, 2025',
  },
  instagram: {
    note: 'Sử dụng Facebook Page Tokens',
    tokenType: 'Page Access Tokens (Permanent)',
    lastUpdated: 'Nov 26, 2025',
  },
  threads: {
    appId: '858444256689767',
    tokenType: 'User Access Token (60 days)',
    lastUpdated: 'Nov 26, 2025',
  },
  linkedin: {
    clientId: '78488c9vfxxdc6',
    tokenType: 'OAuth 2.0 Access Token (60 days)',
    lastUpdated: 'Nov 26, 2025',
  },
  youtube: {
    clientId: '108558893612-fn9pl4tik8ebjeujlbnudma8re5a99gk.apps.googleusercontent.com',
    tokenType: 'OAuth 2.0 + Refresh Token',
    lastUpdated: 'Nov 26, 2025',
  },
};

// Platform icons mapping
export const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <span className="text-blue-500 font-bold text-sm">f</span>,
  instagram: <span className="text-pink-500 font-bold text-sm">📸</span>,
  youtube: <span className="text-red-500 font-bold text-sm">▶</span>,
  linkedin: <span className="text-blue-600 font-bold text-sm">in</span>,
  threads: <span className="text-sm">🧵</span>,
  twitter: <span className="text-sm">𝕏</span>,
  tiktok: <span className="text-sm">🎵</span>,
  telegram: <span className="text-sm">✈️</span>,
  discord: <span className="text-sm">🎮</span>,
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export const getTokenStatusBadge = (status: SocialAccount['tokenStatus']) => {
  switch (status) {
    case 'permanent':
      return <Badge className="bg-green-500">♾️ Permanent</Badge>;
    case 'active':
      return <Badge className="bg-blue-500">✅ Active</Badge>;
    case 'expiring':
      return <Badge className="bg-yellow-500">⚠️ Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-red-500">❌ Expired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
