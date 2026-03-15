/**
 * Constants for Avatar Studio
 */

import type { AvatarProfile, ContentTemplate, GenerationStyle, PlatformConfig } from './types';

export const DEFAULT_PROFILE: AvatarProfile = {
  id: 'default',
  name: 'Long Sang',
  role: 'Founder & CEO',
  brand: 'SABO Arena',
  personality: 'Friendly, professional, passionate about billiards and technology',
  speakingStyle: 'Casual but knowledgeable, uses Vietnamese with occasional English terms',
  languages: ['Vietnamese', 'English'],
  portraits: [],
  createdAt: new Date().toISOString(),
};

// Storage keys
export const STORAGE_KEY = 'sabo-avatar-profiles'; // Now stores array of profiles
export const ACTIVE_PROFILE_KEY = 'sabo-avatar-active-profile-id';

export const CONTENT_TEMPLATES: ContentTemplate[] = [
  {
    id: 'intro-sabo',
    name: '🏀 Giới thiệu SABO Arena',
    category: 'intro',
    script:
      'Xin chào! Tôi là Long Sang, người sáng lập SABO Arena - hệ thống billiard club hiện đại nhất Việt Nam. Hôm nay tôi muốn chia sẻ với các bạn...',
    duration: 15,
    platform: 'all',
  },
  {
    id: 'promo-event',
    name: '🎉 Sự kiện đặc biệt',
    category: 'promo',
    script:
      'SABO Arena có tin hot cho các bạn! Cuối tuần này chúng tôi tổ chức giải đấu billiard với giải thưởng lên đến 50 triệu đồng...',
    duration: 30,
    platform: 'tiktok',
  },
  {
    id: 'tip-technique',
    name: '🎱 Tips chơi Billiard',
    category: 'tutorial',
    script:
      'Bạn muốn cải thiện kỹ năng billiard? Đây là tip mà các pro player tại SABO Arena thường sử dụng...',
    duration: 45,
    platform: 'youtube',
  },
  {
    id: 'new-branch',
    name: '🏢 Chi nhánh mới',
    category: 'announcement',
    script:
      'Tin vui! SABO Arena vừa khai trương chi nhánh mới tại [địa điểm]. Đặc biệt, trong tuần đầu tiên chúng tôi có chương trình...',
    duration: 20,
    platform: 'facebook',
  },
];

export const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  tiktok: { aspectRatio: '9:16', maxDuration: 60, icon: '📱' },
  instagram: { aspectRatio: '9:16', maxDuration: 90, icon: '📸' },
  facebook: { aspectRatio: '16:9', maxDuration: 120, icon: '📘' },
  youtube: { aspectRatio: '16:9', maxDuration: 600, icon: '🎬' },
};

export const GENERATION_STYLES: GenerationStyle[] = [
  {
    id: 'professional',
    name: '💼 Professional',
    prompt: 'professional business attire, corporate setting, confident pose',
  },
  {
    id: 'casual',
    name: '😊 Casual Friendly',
    prompt: 'casual attire, friendly smile, relaxed atmosphere',
  },
  { id: 'sporty', name: '🏀 Sporty', prompt: 'athletic wear, billiard club setting, energetic' },
  {
    id: 'presenter',
    name: '🎤 Presenter',
    prompt: 'presenter pose, speaking gesture, engaging expression',
  },
];
