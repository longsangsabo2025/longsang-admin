/**
 * Channel Identity — ĐỨNG DẬY ĐI
 * 
 * Single source of truth for all channel branding, 
 * used by Script Writer, Publisher, and Visual Director.
 */

export const CHANNEL = {
  name: 'ĐỨNG DẬY ĐI',
  nameEN: 'Stand Up Now',
  tagline: 'Nơi có những sự thật mà cuộc sống đã giấu bạn, và sức mạnh mà bạn quên mình đang có.',
  signOff: 'Không ai cứu bạn ngoài chính bạn. Đứng dậy đi.',
  
  youtubeChannelId: 'UCh08dvkDfJVJ8f1C-TbXbew',
  handle: '@dungdaydi',

  // Reference channel for voice/style
  reference: {
    name: 'THE HIDDEN SELF',
    handle: '@thehiddenself.pocast',
    channelId: 'UCrMTLFvpsmXlSKfkaMjGqgQ',
    role: 'Voice DNA source — style reference only, never copy content',
  },

  // Brand voice keywords
  voice: {
    identity: 'Triết gia bóng tối với trái tim chiến binh',
    tone: ['nghiêm túc', 'sắc bén', 'provocative', 'data-driven', 'tough love'],
    forbidden: ['hype', 'sách giáo khoa', 'motivational sáo rỗng', 'toxic masculinity'],
  },

  // Content pillars
  pillars: [
    { id: 'tai-chinh', name: 'Tài chính & Đầu tư', weight: 0.30 },
    { id: 'tam-ly', name: 'Tâm lý & Bản chất con người', weight: 0.22 },
    { id: 'dia-chinh-tri', name: 'Địa chính trị & Quyền lực', weight: 0.21 },
    { id: 'phat-trien', name: 'Phát triển bản thân', weight: 0.10 },
    { id: 'van-hoa', name: 'Văn hóa & Xã hội', weight: 0.07 },
    { id: 'xa-hoi', name: 'Xã hội & Thời sự', weight: 0.06 },
    { id: 'kinh-doanh', name: 'Kinh doanh & Khởi nghiệp', weight: 0.04 },
  ],

  // Visual brand
  visual: {
    style: 'Dark, cinematic, minimalist',
    colorPalette: ['#0D0D0D', '#1A1A2E', '#E94560', '#F5F5DC'],
    thumbnailStyle: 'Single strong image, bold Vietnamese text, dark gradient, red accent',
    fontStyle: 'Bold sans-serif for titles, clean serif for body',
  },

  // Publishing
  publishing: {
    language: 'vi',
    targetDuration: '10-15 minutes',
    uploadSchedule: 'Consistent, quality over quantity',
    defaultCategory: 'Education',
    defaultTags: [
      'đứng dậy đi', 'tài chính cá nhân', 'phát triển bản thân',
      'tâm lý học', 'địa chính trị', 'sự thật', 'podcast tiếng việt'
    ],
  },
};

export default CHANNEL;
