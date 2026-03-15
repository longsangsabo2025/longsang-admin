/**
 * Mock data for Channel Builder
 */

import type { Channel, ContentIdea } from './types';

export const MOCK_CHANNELS: Channel[] = [
  {
    id: '1',
    platform: 'youtube',
    name: 'Long Sang AI',
    handle: '@longsangai',
    followers: 1250,
    isConnected: true,
    lastSync: new Date(),
  },
  {
    id: '2',
    platform: 'tiktok',
    name: 'Long Sang',
    handle: '@longsang.ai',
    followers: 5800,
    isConnected: true,
    lastSync: new Date(),
  },
  {
    id: '3',
    platform: 'instagram',
    name: 'Long Sang',
    handle: '@longsang.official',
    followers: 3200,
    isConnected: false,
  },
  {
    id: '4',
    platform: 'facebook',
    name: 'Long Sang Page',
    handle: 'longsangofficial',
    followers: 8500,
    isConnected: true,
    lastSync: new Date(),
  },
];

export const MOCK_IDEAS: ContentIdea[] = [
  {
    id: '1',
    title: 'AI đang thay đổi cách chúng ta làm việc như thế nào?',
    description: 'Video giải thích về AI và automation trong công việc hàng ngày',
    platform: ['youtube', 'tiktok'],
    type: 'video',
    status: 'idea',
    aiGenerated: true,
    tags: ['AI', 'productivity', 'future'],
  },
  {
    id: '2',
    title: '5 công cụ AI miễn phí mà bạn cần biết',
    description: 'Giới thiệu các công cụ AI hữu ích cho công việc',
    platform: ['tiktok', 'instagram'],
    type: 'reel',
    status: 'scripted',
    aiGenerated: true,
    tags: ['AI tools', 'free', 'tips'],
  },
  {
    id: '3',
    title: 'Behind the scenes: Xây dựng SABO Arena',
    description: 'Chia sẻ quá trình phát triển dự án',
    platform: ['youtube'],
    type: 'video',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 86400000),
    aiGenerated: false,
    tags: ['SABO', 'development', 'startup'],
  },
];
