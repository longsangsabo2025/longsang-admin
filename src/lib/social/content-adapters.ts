/**
 * =================================================================
 * AI CONTENT ADAPTERS - Platform-specific content generation
 * =================================================================
 * Each platform has its own AI agent that adapts content to match
 * the platform's style, tone, and character limits.
 */

export type SocialPlatform = 
  | 'facebook' 
  | 'instagram' 
  | 'linkedin' 
  | 'twitter' 
  | 'threads' 
  | 'tiktok'
  | 'youtube'
  | 'telegram';

export type HashtagStyle = 'many' | 'few' | 'none' | 'inline';
export type EmojiLevel = 'high' | 'medium' | 'low' | 'none';
export type ContentLanguage = 'vi' | 'en' | 'both';

export interface PlatformConfig {
  name: string;
  icon: string;
  charLimit: number;
  hashtagStyle: HashtagStyle;
  emojiLevel: EmojiLevel;
  tone: string;
  features: string[];
}

export interface AdaptedContent {
  platform: SocialPlatform;
  originalContent: string;
  adaptedContent: string;
  hashtags: string[];
  characterCount: number;
  isWithinLimit: boolean;
  suggestions?: string[];
}

// Available AI models
export type AIModel = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-opus'
  | 'claude-3-sonnet'
  | 'claude-3-haiku'
  | 'gemini-pro'
  | 'gemini-flash';

export const AI_MODELS: { id: AIModel; name: string; description: string }[] = [
  { id: 'gpt-4o', name: 'GPT-4o', description: 'Most capable, best quality' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast and affordable' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Powerful with vision' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most intelligent' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced performance' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Fast and compact' },
  { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s best' },
  { id: 'gemini-flash', name: 'Gemini Flash', description: 'Fast Gemini model' },
];

export interface ContentAdaptRequest {
  originalContent: string;
  platforms: SocialPlatform[];
  context?: string;
  targetAudience?: string;
  callToAction?: string;
  includeEmoji?: boolean;
  language?: ContentLanguage;
  customPrompts?: Record<SocialPlatform, string>; // Custom prompts per platform
  model?: AIModel; // AI model to use
}

// Platform configurations
export const PLATFORM_CONFIGS: Record<SocialPlatform, PlatformConfig> = {
  facebook: {
    name: 'Facebook',
    icon: 'f',
    charLimit: 63206,
    hashtagStyle: 'few',
    emojiLevel: 'medium',
    tone: 'friendly, storytelling, engaging',
    features: [
      'Longer posts perform well',
      'Stories and personal experiences',
      'Questions to drive engagement',
      'Tag relevant pages/people',
      'Use line breaks for readability'
    ]
  },
  instagram: {
    name: 'Instagram',
    icon: 'IG',
    charLimit: 2200,
    hashtagStyle: 'many',
    emojiLevel: 'high',
    tone: 'visual, inspirational, lifestyle-focused',
    features: [
      'First line is crucial (hook)',
      'Use 20-30 relevant hashtags',
      'Emoji-rich content',
      'Call-to-action in bio link',
      'Aesthetic and visual language'
    ]
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'in',
    charLimit: 3000,
    hashtagStyle: 'few',
    emojiLevel: 'low',
    tone: 'professional, insightful, thought-leadership',
    features: [
      'Start with a hook',
      'Share industry insights',
      'Professional achievements',
      'Use 3-5 relevant hashtags',
      'End with a question or CTA'
    ]
  },
  twitter: {
    name: 'X (Twitter)',
    icon: 'X',
    charLimit: 280,
    hashtagStyle: 'inline',
    emojiLevel: 'medium',
    tone: 'concise, witty, trending',
    features: [
      'Short and punchy',
      'Use trending hashtags',
      'Thread for longer content',
      'Engage with replies',
      'Timing is crucial'
    ]
  },
  threads: {
    name: 'Threads',
    icon: '@',
    charLimit: 500,
    hashtagStyle: 'none',
    emojiLevel: 'medium',
    tone: 'casual, conversational, authentic',
    features: [
      'Conversational tone',
      'Personal opinions welcome',
      'No hashtags needed',
      'Reply to build threads',
      'Authentic voice'
    ]
  },
  tiktok: {
    name: 'TikTok',
    icon: 'TT',
    charLimit: 2200,
    hashtagStyle: 'many',
    emojiLevel: 'high',
    tone: 'trendy, Gen-Z, entertaining, hook-driven',
    features: [
      'Strong hook in first 3 seconds',
      'Trending sounds/hashtags',
      'Gen-Z language and slang',
      'Challenge-based content',
      'Educational entertainment'
    ]
  },
  youtube: {
    name: 'YouTube',
    icon: 'YT',
    charLimit: 5000,
    hashtagStyle: 'few',
    emojiLevel: 'medium',
    tone: 'informative, engaging, SEO-optimized',
    features: [
      'SEO-friendly descriptions',
      'Timestamps for longer videos',
      'Call to subscribe',
      'Link to related content',
      'Keywords in first 2 lines'
    ]
  },
  telegram: {
    name: 'Telegram',
    icon: 'TG',
    charLimit: 4096,
    hashtagStyle: 'inline',
    emojiLevel: 'medium',
    tone: 'informative, community-focused, direct',
    features: [
      'Direct communication',
      'Formatting with Markdown',
      'Pin important messages',
      'Use polls for engagement',
      'Share exclusive content'
    ]
  }
};

// AI Prompts for each platform
export const PLATFORM_PROMPTS: Record<SocialPlatform, string> = {
  facebook: `You are a Facebook content specialist. Adapt the given content for Facebook:
- Use a friendly, storytelling tone
- Add relevant emojis (moderate use)
- Include 2-3 relevant hashtags at the end
- Use line breaks for readability
- Add a question or call-to-action to drive engagement
- Keep it conversational and relatable
- Maximum ${PLATFORM_CONFIGS.facebook.charLimit} characters`,

  instagram: `You are an Instagram content specialist. Adapt the given content for Instagram:
- Start with an attention-grabbing hook
- Use plenty of emojis throughout
- Write in an inspirational, lifestyle tone
- Create a caption that complements visuals
- Add 20-30 relevant hashtags (mix of popular and niche)
- Include a call-to-action (link in bio, save, share)
- Maximum ${PLATFORM_CONFIGS.instagram.charLimit} characters`,

  linkedin: `You are a LinkedIn content specialist. Adapt the given content for LinkedIn:
- Use a professional, thought-leadership tone
- Start with a compelling hook (first 2 lines visible)
- Share insights and value
- Use minimal emojis (professional ones only)
- Add 3-5 industry-relevant hashtags
- End with a question to encourage discussion
- Use line breaks for scanability
- Maximum ${PLATFORM_CONFIGS.linkedin.charLimit} characters`,

  twitter: `You are a Twitter/X content specialist. Adapt the given content for Twitter:
- Be extremely concise and punchy
- Use wit and personality
- Include 1-2 trending or relevant hashtags inline
- Add emojis strategically
- Create urgency or curiosity
- Make it retweetable
- STRICT: Maximum ${PLATFORM_CONFIGS.twitter.charLimit} characters`,

  threads: `You are a Threads content specialist. Adapt the given content for Threads:
- Use a casual, conversational tone
- Be authentic and personal
- No hashtags needed
- Write like you're talking to a friend
- Share opinions and thoughts naturally
- Keep it under ${PLATFORM_CONFIGS.threads.charLimit} characters`,

  tiktok: `You are a TikTok content specialist. Adapt the given content for TikTok captions:
- Use Gen-Z language and slang
- Start with a strong hook
- Make it entertaining and trendy
- Use plenty of emojis
- Include trending hashtags (#fyp, #viral, etc.)
- Keep the energy high
- Maximum ${PLATFORM_CONFIGS.tiktok.charLimit} characters`,

  youtube: `You are a YouTube content specialist. Adapt the given content for YouTube descriptions:
- Start with SEO keywords in first 2 lines
- Include relevant links
- Add timestamps if applicable
- Use call-to-action (subscribe, like, comment)
- Add relevant hashtags (3-5)
- Make it informative and scannable
- Maximum ${PLATFORM_CONFIGS.youtube.charLimit} characters`,

  telegram: `You are a Telegram content specialist. Adapt the given content for Telegram:
- Use direct, informative tone
- Format with Markdown (bold, italic, links)
- Be community-focused
- Add relevant emojis
- Keep it clear and actionable
- Maximum ${PLATFORM_CONFIGS.telegram.charLimit} characters`
};

/**
 * Adapt content for multiple platforms using AI
 */
export async function adaptContentForPlatforms(
  request: ContentAdaptRequest
): Promise<AdaptedContent[]> {
  // Process all platforms in parallel
  const promises = request.platforms.map(async (platform) => {
    try {
      const adapted = await adaptContentForPlatform(
        request.originalContent,
        platform,
        {
          context: request.context,
          targetAudience: request.targetAudience,
          callToAction: request.callToAction,
          includeEmoji: request.includeEmoji,
          language: request.language,
          customPrompt: request.customPrompts?.[platform],
          model: request.model,
        }
      );
      return adapted;
    } catch (error) {
      console.error(`Failed to adapt for ${platform}:`, error);
      // Return original content as fallback
      return {
        platform,
        originalContent: request.originalContent,
        adaptedContent: request.originalContent,
        hashtags: [],
        characterCount: request.originalContent.length,
        isWithinLimit: request.originalContent.length <= PLATFORM_CONFIGS[platform].charLimit,
        suggestions: ['AI adaptation failed, using original content']
      };
    }
  });

  const adaptedContents = await Promise.all(promises);
  return adaptedContents;
}

/**
 * Adapt content for a single platform
 */
export async function adaptContentForPlatform(
  content: string,
  platform: SocialPlatform,
  options?: {
    context?: string;
    targetAudience?: string;
    callToAction?: string;
    includeEmoji?: boolean;
    language?: 'vi' | 'en' | 'both';
    customPrompt?: string;
    model?: AIModel;
  }
): Promise<AdaptedContent> {
  const config = PLATFORM_CONFIGS[platform];
  // Use custom prompt if provided, otherwise use default
  const basePrompt = options?.customPrompt || PLATFORM_PROMPTS[platform];

  // Build the full prompt
  const fullPrompt = buildAdaptPrompt(content, platform, basePrompt, options);

  // Call AI API with model selection
  const adaptedText = await callAIForAdaptation(fullPrompt, platform, options?.model);

  // Extract hashtags
  const hashtags = extractHashtags(adaptedText);
  
  // Clean content (remove duplicate hashtags from body if they're at the end)
  const cleanedContent = cleanHashtagsFromBody(adaptedText, hashtags);

  return {
    platform,
    originalContent: content,
    adaptedContent: cleanedContent,
    hashtags,
    characterCount: cleanedContent.length,
    isWithinLimit: cleanedContent.length <= config.charLimit,
    suggestions: cleanedContent.length > config.charLimit 
      ? [`Content exceeds ${config.charLimit} character limit by ${cleanedContent.length - config.charLimit} characters`]
      : undefined
  };
}

function buildAdaptPrompt(
  content: string,
  platform: SocialPlatform,
  basePrompt: string,
  options?: {
    context?: string;
    targetAudience?: string;
    callToAction?: string;
    includeEmoji?: boolean;
    language?: 'vi' | 'en' | 'both';
  }
): string {
  let prompt = basePrompt + '\n\n';
  
  if (options?.context) {
    prompt += `Context: ${options.context}\n`;
  }
  if (options?.targetAudience) {
    prompt += `Target Audience: ${options.targetAudience}\n`;
  }
  if (options?.callToAction) {
    prompt += `Call to Action: ${options.callToAction}\n`;
  }
  if (options?.language) {
    const langMap = { vi: 'Vietnamese', en: 'English', both: 'both Vietnamese and English' };
    prompt += `Language: Write in ${langMap[options.language]}\n`;
  }
  if (options?.includeEmoji === false) {
    prompt += `Note: Do not use emojis\n`;
  }

  prompt += `\nOriginal Content:\n${content}\n\n`;
  prompt += `Adapted ${PLATFORM_CONFIGS[platform].name} Content:`;

  return prompt;
}

async function callAIForAdaptation(prompt: string, platform: SocialPlatform, model?: AIModel): Promise<string> {
  try {
    // Try to call our AI API
    const response = await fetch('/api/ai-assistant/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        model: model || 'gpt-4o-mini', // Default model
        maxTokens: 1000,
        temperature: 0.7,
        systemPrompt: `You are a social media content specialist for ${PLATFORM_CONFIGS[platform].name}. 
          Your job is to adapt content to match the platform's style and best practices.
          Always respond with ONLY the adapted content, no explanations.`
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.content || data.text || data.result;
    }

    // Fallback: Return a simple adaptation
    return simpleAdapt(prompt, platform);
  } catch (error) {
    console.error('AI API error:', error);
    return simpleAdapt(prompt, platform);
  }
}

/**
 * Simple rule-based adaptation as fallback
 */
function simpleAdapt(content: string, platform: SocialPlatform): string {
  const config = PLATFORM_CONFIGS[platform];
  let adapted = content;

  // Truncate if needed
  if (adapted.length > config.charLimit) {
    adapted = adapted.substring(0, config.charLimit - 3) + '...';
  }

  // Add platform-specific touches
  switch (platform) {
    case 'twitter':
      // Keep it short
      if (adapted.length > 250) {
        adapted = adapted.substring(0, 250) + '...';
      }
      break;
    case 'instagram':
      // Add some hashtags
      adapted += '\n\n#content #social #viral';
      break;
    case 'linkedin':
      // Add professional touch - remove excessive exclamation marks
      adapted = adapted.split(/!+/).join('.');
      break;
  }

  return adapted;
}

function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
  const matches = text.match(hashtagRegex) || [];
  return [...new Set(matches.map(tag => tag.substring(1)))]; // Remove # and dedupe
}

function cleanHashtagsFromBody(text: string, _hashtags: string[]): string {
  // If hashtags are at the end, keep them there
  // This function can be customized based on platform preferences
  return text;
}

export default {
  adaptContentForPlatforms,
  adaptContentForPlatform,
  PLATFORM_CONFIGS,
  PLATFORM_PROMPTS
};
