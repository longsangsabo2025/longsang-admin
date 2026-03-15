/**
 * 🤖 AI Marketing Types - Kiến trúc mới với phân tách AI
 *
 * Architecture:
 * 1. AI Strategist - Tạo chiến lược marketing tổng thể
 * 2. AI Platform Writers - Viết content cho từng nền tảng
 */

// ==================== AI STRATEGIST ====================
export interface AIStrategistConfig {
  // AI Model
  model: {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    maxTokens: number;
  };

  // Expertise
  expertise: {
    role: string;
    yearsExperience: number;
    specializations: string[];
  };

  // Strategy Settings
  strategy: {
    objective: 'awareness' | 'engagement' | 'conversion' | 'retention';
    campaignsCount: number;
    targetAudience: string;
    marketFocus: string;
  };

  // Output Settings
  output: {
    includeTimeline: boolean;
    includeKPIs: boolean;
    includeBudgetEstimate: boolean;
  };

  // Custom Instructions
  customInstructions: string;
}

export const DEFAULT_STRATEGIST_CONFIG: AIStrategistConfig = {
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 3000,
  },
  expertise: {
    role: 'Chief Marketing Strategist',
    yearsExperience: 15,
    specializations: [
      'Digital Marketing Strategy',
      'Brand Positioning',
      'Market Analysis',
      'Growth Planning',
    ],
  },
  strategy: {
    objective: 'awareness',
    campaignsCount: 3,
    targetAudience: 'Người dùng Việt Nam 18-45 tuổi',
    marketFocus: 'Vietnam',
  },
  output: {
    includeTimeline: true,
    includeKPIs: true,
    includeBudgetEstimate: false,
  },
  customInstructions: '',
};

// ==================== AI PLATFORM WRITER ====================
export type PlatformType =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'threads'
  | 'zalo';

export interface AIPlatformWriterConfig {
  // Platform Identity
  platform: PlatformType;
  enabled: boolean;

  // AI Model
  model: {
    provider: 'openai' | 'anthropic' | 'google';
    model: string;
    maxTokens: number;
  };

  // Tone & Voice
  tone: {
    style: 'professional' | 'friendly' | 'casual' | 'playful' | 'luxury' | 'bold';
    formality: number; // 0-100
    creativity: number; // 0-100
    emotionLevel: number; // 0-100
  };

  // Content Settings
  content: {
    length: 'short' | 'medium' | 'long';
    useEmojis: boolean;
    emojiDensity: 'minimal' | 'moderate' | 'heavy';
    hashtagCount: number;
    includeCallToAction: boolean;
    ctaStyle: 'soft' | 'direct' | 'urgent';
    useStoryTelling: boolean;
  };

  // Language
  language: 'vi' | 'en' | 'both';

  // Platform-specific settings
  platformSpecific: Record<string, any>;

  // Custom Instructions
  customInstructions: string;
}

// Platform default configs with optimal settings for each
export const PLATFORM_WRITER_DEFAULTS: Record<PlatformType, AIPlatformWriterConfig> = {
  facebook: {
    platform: 'facebook',
    enabled: true,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 2000 },
    tone: { style: 'friendly', formality: 50, creativity: 70, emotionLevel: 60 },
    content: {
      length: 'medium',
      useEmojis: true,
      emojiDensity: 'moderate',
      hashtagCount: 3,
      includeCallToAction: true,
      ctaStyle: 'soft',
      useStoryTelling: true,
    },
    language: 'vi',
    platformSpecific: {
      includeQuestion: true, // Đặt câu hỏi cuối bài
      useLineBreaks: true, // Dùng nhiều xuống dòng
    },
    customInstructions: 'Viết như đang nói chuyện với bạn bè. Tạo cảm xúc, kể chuyện.',
  },

  instagram: {
    platform: 'instagram',
    enabled: true,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 1500 },
    tone: { style: 'playful', formality: 30, creativity: 80, emotionLevel: 70 },
    content: {
      length: 'short',
      useEmojis: true,
      emojiDensity: 'heavy',
      hashtagCount: 15,
      includeCallToAction: true,
      ctaStyle: 'soft',
      useStoryTelling: false,
    },
    language: 'vi',
    platformSpecific: {
      hashtagAtEnd: true, // Hashtags cuối caption
      includeCarouselHints: true,
      mentionStyle: '@mention',
    },
    customInstructions: 'Caption ngắn gọn, visual-first. Hashtags chiến lược.',
  },

  tiktok: {
    platform: 'tiktok',
    enabled: true,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 1000 },
    tone: { style: 'playful', formality: 20, creativity: 90, emotionLevel: 80 },
    content: {
      length: 'short',
      useEmojis: true,
      emojiDensity: 'heavy',
      hashtagCount: 5,
      includeCallToAction: true,
      ctaStyle: 'urgent',
      useStoryTelling: false,
    },
    language: 'vi',
    platformSpecific: {
      hookInFirst3Seconds: true,
      trendingHashtags: true,
      includeScriptHints: true,
    },
    customInstructions: 'Hook mạnh đầu tiên! Trend-aware. Gen Z vibe.',
  },

  linkedin: {
    platform: 'linkedin',
    enabled: false,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 2500 },
    tone: { style: 'professional', formality: 80, creativity: 50, emotionLevel: 40 },
    content: {
      length: 'long',
      useEmojis: true,
      emojiDensity: 'minimal',
      hashtagCount: 5,
      includeCallToAction: true,
      ctaStyle: 'direct',
      useStoryTelling: true,
    },
    language: 'en',
    platformSpecific: {
      includeInsight: true,
      professionalTone: true,
      industryFocus: true,
    },
    customInstructions: 'Thought leadership. Data-driven insights. Professional story.',
  },

  twitter: {
    platform: 'twitter',
    enabled: false,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 500 },
    tone: { style: 'bold', formality: 40, creativity: 70, emotionLevel: 60 },
    content: {
      length: 'short',
      useEmojis: true,
      emojiDensity: 'minimal',
      hashtagCount: 2,
      includeCallToAction: true,
      ctaStyle: 'direct',
      useStoryTelling: false,
    },
    language: 'both',
    platformSpecific: {
      maxCharacters: 280,
      threadSupport: true,
    },
    customInstructions: 'Ngắn gọn, punch line. Có thể thread.',
  },

  youtube: {
    platform: 'youtube',
    enabled: false,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 2000 },
    tone: { style: 'friendly', formality: 50, creativity: 70, emotionLevel: 60 },
    content: {
      length: 'long',
      useEmojis: true,
      emojiDensity: 'moderate',
      hashtagCount: 5,
      includeCallToAction: true,
      ctaStyle: 'direct',
      useStoryTelling: true,
    },
    language: 'vi',
    platformSpecific: {
      includeTitle: true,
      includeThumbnailIdeas: true,
      includeTimestamps: true,
      seoKeywords: true,
    },
    customInstructions: 'SEO-optimized title & description. Timestamps. CTA subscribe.',
  },

  threads: {
    platform: 'threads',
    enabled: false,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 1000 },
    tone: { style: 'casual', formality: 30, creativity: 75, emotionLevel: 65 },
    content: {
      length: 'short',
      useEmojis: true,
      emojiDensity: 'moderate',
      hashtagCount: 0,
      includeCallToAction: true,
      ctaStyle: 'soft',
      useStoryTelling: false,
    },
    language: 'vi',
    platformSpecific: {
      conversational: true,
      replyBait: true,
    },
    customInstructions: 'Conversational, reply-bait. No hashtags.',
  },

  zalo: {
    platform: 'zalo',
    enabled: false,
    model: { provider: 'openai', model: 'gpt-4o-mini', maxTokens: 1500 },
    tone: { style: 'friendly', formality: 50, creativity: 60, emotionLevel: 55 },
    content: {
      length: 'medium',
      useEmojis: true,
      emojiDensity: 'moderate',
      hashtagCount: 0,
      includeCallToAction: true,
      ctaStyle: 'soft',
      useStoryTelling: true,
    },
    language: 'vi',
    platformSpecific: {
      oaStyle: true, // Official Account style
      includeButton: true,
    },
    customInstructions: 'Thân thiện kiểu Việt Nam. OA format.',
  },
};

// ==================== CAMPAIGN STRATEGY OUTPUT ====================
export interface MarketingStrategy {
  summary: string;
  brandAnalysis: {
    strengths: string[];
    opportunities: string[];
    uniqueValue: string;
  };
  targetAudience: {
    primary: string;
    secondary: string;
    painPoints: string[];
  };
  campaigns: CampaignStrategy[];
  timeline: {
    phase: string;
    duration: string;
    focus: string;
  }[];
  kpis: {
    metric: string;
    target: string;
  }[];
  recommendations: string[];
}

export interface CampaignStrategy {
  id: string;
  name: string;
  objective: string;
  keyMessage: string;
  targetAudience: string;
  platforms: PlatformType[];
  duration: string;
  priority: 'high' | 'medium' | 'low';
  contentThemes: string[];
  callToAction: string;
}

// ==================== CONTENT OUTPUT ====================
export interface PlatformContent {
  campaignId: string;
  platform: PlatformType;
  title: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  visualDirection?: string;
  scheduledAt?: string;
  metadata: {
    wordCount: number;
    emojiCount: number;
    estimatedReadTime: string;
  };
}

// ==================== PROJECT AI CONFIG ====================
export interface ProjectAIConfig {
  strategist: AIStrategistConfig;
  writers: Record<PlatformType, AIPlatformWriterConfig>;
  lastUpdated: string;
}

export const DEFAULT_PROJECT_AI_CONFIG: ProjectAIConfig = {
  strategist: DEFAULT_STRATEGIST_CONFIG,
  writers: PLATFORM_WRITER_DEFAULTS,
  lastUpdated: new Date().toISOString(),
};

// ==================== MARKETING MASTERPLAN (NEW) ====================

/**
 * Marketing Masterplan - Chiến lược marketing toàn diện
 * Được tạo bởi AI CMO với phân tích sâu từ tài liệu dự án
 */

// Persona - Chân dung khách hàng
export interface CustomerPersona {
  name: string; // VD: "Minh - Game thủ trẻ"
  age: string; // VD: "18-25"
  occupation: string; // VD: "Sinh viên, nhân viên văn phòng"
  interests: string[]; // VD: ["Gaming", "Billiards", "Social"]
  painPoints: string[]; // VD: ["Muốn thể hiện skill", "Thiếu đối thủ"]
  goals: string[]; // VD: ["Trở thành top player", "Kết bạn cùng đam mê"]
  platforms: PlatformType[]; // Họ hay dùng platform nào
  contentPreferences: string[]; // Họ thích loại content nào
}

// Brand Analysis - Phân tích thương hiệu
export interface BrandAnalysis {
  // Core Identity
  brandName: string;
  tagline: string;
  brandVoice: string; // VD: "Trẻ trung, năng động, đam mê"
  brandPersonality: string[]; // VD: ["Competitive", "Fun", "Community-driven"]

  // Value Proposition
  usp: string; // Unique Selling Proposition
  keyBenefits: string[];
  differentiators: string[];

  // SWOT for Marketing
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };

  // Competitive Landscape
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
  }[];
}

// Content Pillar - Trụ cột nội dung
export interface ContentPillar {
  name: string; // VD: "Education"
  description: string; // VD: "Hướng dẫn, tips & tricks"
  percentage: number; // % content dành cho pillar này (tổng = 100)
  contentTypes: string[]; // VD: ["Tutorial", "Tips", "How-to"]
  exampleTopics: string[];
}

// Phase - Giai đoạn marketing
export interface MarketingPhase {
  id: string;
  name: string; // VD: "Pre-launch", "Launch", "Growth"
  objective: string; // Mục tiêu chính của phase
  startDate: string; // ISO date
  endDate: string; // ISO date
  duration: string; // VD: "2 tuần"

  // Budget
  budgetPercentage: number; // % tổng budget

  // KPIs cho phase này
  kpis: {
    metric: string;
    target: string;
    current?: string;
  }[];

  // Chiến dịch trong phase
  campaigns: MasterplanCampaign[];

  // Milestones
  milestones: {
    date: string;
    description: string;
  }[];
}

// Campaign trong Masterplan - Chi tiết hơn CampaignStrategy cũ
export interface MasterplanCampaign {
  id: string;
  name: string;
  objective: string;

  // Targeting
  targetPersonas: string[]; // Reference to CustomerPersona.name
  targetAudience: string;

  // Messaging
  keyMessage: string;
  supportingMessages: string[];
  tone: string;

  // Channels
  platforms: PlatformType[];
  platformStrategy: Record<
    PlatformType,
    {
      postsPerWeek: number;
      contentTypes: string[];
      bestTimes: string[];
      budget?: string;
    }
  >;

  // Content
  contentThemes: string[];
  contentCalendar: {
    week: number;
    focus: string;
    posts: {
      platform: PlatformType;
      type: string;
      topic: string;
      scheduledDate?: string;
    }[];
  }[];

  // Performance
  kpis: {
    metric: string;
    target: string;
  }[];

  // CTA
  primaryCTA: string;
  secondaryCTA?: string;

  // Timeline
  startDate: string;
  endDate: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'planned' | 'active' | 'completed' | 'paused';
}

// Marketing Masterplan - Output chính
export interface MarketingMasterplan {
  // Metadata
  id: string;
  projectId: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  version: string;

  // Executive Summary
  executiveSummary: string;

  // Brand Analysis
  brandAnalysis: BrandAnalysis;

  // Target Audience
  personas: CustomerPersona[];

  // Content Strategy
  contentPillars: ContentPillar[];

  // Marketing Phases
  phases: MarketingPhase[];

  // Overall Timeline
  timeline: {
    startDate: string;
    endDate: string;
    totalDuration: string;
  };

  // Budget Overview
  budget: {
    total?: string;
    breakdown: {
      category: string;
      percentage: number;
      description: string;
    }[];
  };

  // Overall KPIs
  overallKPIs: {
    metric: string;
    baseline: string;
    target: string;
    timeframe: string;
  }[];

  // Recommendations
  recommendations: {
    category: 'quick-win' | 'strategic' | 'long-term';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }[];

  // Risk Assessment
  risks: {
    risk: string;
    likelihood: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    mitigation: string;
  }[];
}

// AI CMO Config - Config cho Master Strategist
export interface AICMOConfig {
  model: {
    provider: 'anthropic' | 'openai';
    model: string;
    maxTokens: number;
    temperature: number;
  };

  expertise: {
    role: string;
    background: string[];
    specializations: string[];
  };

  analysisDepth: 'quick' | 'standard' | 'deep';
  phasesCount: number;
  campaignsPerPhase: number;

  outputLanguage: 'vi' | 'en';
  includeContentCalendar: boolean;
  includeBudgetEstimate: boolean;
  includeRiskAssessment: boolean;
}

export const DEFAULT_CMO_CONFIG: AICMOConfig = {
  model: {
    provider: 'anthropic',
    model: 'claude-sonnet-4-5-20250929',
    maxTokens: 16000,
    temperature: 0.7,
  },

  expertise: {
    role: 'Chief Marketing Officer (CMO)',
    background: [
      'Ex-Apple Marketing Director',
      'Ex-Grab Growth Lead Vietnam',
      'Startup Advisor for 50+ companies',
    ],
    specializations: [
      'Digital Marketing Strategy',
      'Brand Building & Positioning',
      'Growth Marketing',
      'Vietnamese Market Expert',
      'App Launch Campaigns',
    ],
  },

  analysisDepth: 'standard',
  phasesCount: 3,
  campaignsPerPhase: 2,

  outputLanguage: 'vi',
  includeContentCalendar: true,
  includeBudgetEstimate: false,
  includeRiskAssessment: true,
};
