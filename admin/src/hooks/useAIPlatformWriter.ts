/**
 * ✍️ AI Platform Content Writer Hook
 * Viết content cho từng platform dựa trên chiến lược từ AI Strategist
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import supabaseAdmin from '@/lib/supabase-admin';
import {
  AIPlatformWriterConfig,
  CampaignStrategy,
  PLATFORM_WRITER_DEFAULTS,
  PlatformContent,
  PlatformType,
} from '@/types/ai-marketing';

interface UseAIPlatformWriterReturn {
  loading: boolean;
  progress: string;
  contents: PlatformContent[];
  generateContent: (
    campaign: CampaignStrategy,
    platform: PlatformType,
    projectSlug: string,
    projectId: string
  ) => Promise<PlatformContent>;
  generateAllPlatformContent: (
    campaign: CampaignStrategy,
    projectSlug: string,
    projectId: string
  ) => Promise<PlatformContent[]>;
  saveContent: (content: PlatformContent, projectId: string) => Promise<void>;
  reset: () => void;
}

// Platform-specific prompt builders
const PLATFORM_PROMPTS: Record<
  PlatformType,
  (config: AIPlatformWriterConfig, campaign: CampaignStrategy) => string
> = {
  facebook: (config, campaign) => `
Bạn là CHUYÊN GIA VIẾT CONTENT FACEBOOK với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Mục tiêu: ${campaign.objective}
- Thông điệp: ${campaign.keyMessage}
- Đối tượng: ${campaign.targetAudience}
- Chủ đề: ${campaign.contentThemes.join(', ')}
- CTA: ${campaign.callToAction}

✍️ YÊU CẦU CONTENT FACEBOOK:
- Độ dài: ${config.content.length === 'short' ? '50-100' : config.content.length === 'medium' ? '150-250' : '300+'} từ
- ${config.content.useEmojis ? `Emoji: ${config.content.emojiDensity}` : 'KHÔNG dùng emoji'}
- Hashtags: ${config.content.hashtagCount} tags
- CTA style: ${config.content.ctaStyle}
- ${config.content.useStoryTelling ? 'Dùng storytelling' : 'Direct approach'}
- ${config.platformSpecific?.includeQuestion ? 'Kết thúc bằng câu hỏi tương tác' : ''}
- ${config.platformSpecific?.useLineBreaks ? 'Dùng nhiều xuống dòng cho dễ đọc' : ''}

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}

Ngôn ngữ: ${config.language === 'vi' ? 'Tiếng Việt' : config.language === 'en' ? 'English' : 'Song ngữ'}
`,

  instagram: (config, campaign) => `
Bạn là CHUYÊN GIA VIẾT CAPTION INSTAGRAM với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Mục tiêu: ${campaign.objective}
- Thông điệp: ${campaign.keyMessage}
- Chủ đề: ${campaign.contentThemes.join(', ')}
- CTA: ${campaign.callToAction}

✍️ YÊU CẦU CAPTION INSTAGRAM:
- Caption ngắn gọn: ${config.content.length === 'short' ? '50-80' : '100-150'} từ
- ${config.content.useEmojis ? `Emoji NHIỀU: ${config.content.emojiDensity}` : 'Emoji tối thiểu'}
- Hashtags: ${config.content.hashtagCount} hashtags (ĐỂ CUỐI caption)
- ${config.platformSpecific?.includeCarouselHints ? 'Gợi ý cho carousel/slides' : ''}
- Visual-first approach
- Hook mạnh dòng đầu

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  tiktok: (config, campaign) => `
Bạn là CHUYÊN GIA CONTENT TIKTOK với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Thông điệp: ${campaign.keyMessage}
- CTA: ${campaign.callToAction}

✍️ YÊU CẦU TIKTOK:
- Caption ngắn: 50-100 từ max
- ${config.platformSpecific?.hookInFirst3Seconds ? '🎯 HOOK MẠNH 3 GIÂY ĐẦU' : ''}
- ${config.platformSpecific?.trendingHashtags ? 'Hashtags trending' : 'Hashtags niche'}
- ${config.platformSpecific?.includeScriptHints ? 'Gợi ý script video' : ''}
- Gen Z vibe, trendy
- ${config.content.emojiDensity} emoji

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  linkedin: (config, campaign) => `
Bạn là THOUGHT LEADER LINKEDIN với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Mục tiêu: ${campaign.objective}
- Thông điệp: ${campaign.keyMessage}
- Đối tượng: ${campaign.targetAudience}

✍️ YÊU CẦU LINKEDIN:
- Bài dài: 200-400 từ
- Professional tone
- ${config.platformSpecific?.includeInsight ? 'Chia sẻ insight chuyên môn' : ''}
- Data-driven nếu có
- Storytelling chuyên nghiệp
- Hashtags: ${config.content.hashtagCount} (professional tags)

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  twitter: (config, campaign) => `
Bạn là CHUYÊN GIA TWITTER/X với phong cách ${config.tone.style}.

📋 CHIẾN DỊCH: ${campaign.name}
- Thông điệp: ${campaign.keyMessage}
- CTA: ${campaign.callToAction}

✍️ YÊU CẦU:
- MAX 280 ký tự!
- Punch line mạnh
- ${config.platformSpecific?.threadSupport ? 'Có thể là thread (nhiều tweets)' : 'Single tweet'}
- Hashtags: ${config.content.hashtagCount} max

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  youtube: (config, campaign) => `
Bạn là CHUYÊN GIA YOUTUBE với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Thông điệp: ${campaign.keyMessage}
- Chủ đề: ${campaign.contentThemes.join(', ')}

✍️ YÊU CẦU:
- Title SEO-optimized (60 chars max)
- Description đầy đủ (200-500 từ)
- ${config.platformSpecific?.includeThumbnailIdeas ? 'Gợi ý thumbnail' : ''}
- ${config.platformSpecific?.includeTimestamps ? 'Timestamps' : ''}
- ${config.platformSpecific?.seoKeywords ? 'Keywords SEO' : ''}
- CTA subscribe + like

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  threads: (config, campaign) => `
Bạn là CHUYÊN GIA THREADS với phong cách ${config.tone.style}.

📋 CHIẾN DỊCH: ${campaign.name}
- Thông điệp: ${campaign.keyMessage}

✍️ YÊU CẦU:
- Conversational, authentic
- ${config.platformSpecific?.replyBait ? 'Reply-bait - kích thích comment' : ''}
- KHÔNG hashtags
- 100-200 từ max
- Vibe tự nhiên như đang chat

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,

  zalo: (config, campaign) => `
Bạn là CHUYÊN GIA ZALO OA với phong cách ${config.tone.style}.

📋 THÔNG TIN CHIẾN DỊCH:
- Tên: ${campaign.name}
- Thông điệp: ${campaign.keyMessage}
- CTA: ${campaign.callToAction}

✍️ YÊU CẦU ZALO:
- Tiếng Việt thân thiện
- ${config.platformSpecific?.oaStyle ? 'Official Account format' : 'Personal style'}
- ${config.platformSpecific?.includeButton ? 'Gợi ý button CTA' : ''}
- 100-200 từ
- Emoji vừa phải

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}
`,
};

export function useAIPlatformWriter(): UseAIPlatformWriterReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [contents, setContents] = useState<PlatformContent[]>([]);

  // Extended config type with custom prompts
  interface ExtendedWriterSettings {
    writers: Record<PlatformType, AIPlatformWriterConfig>;
    writerPrompts?: Record<PlatformType, string>;
    useCustomWriterPrompts?: Record<PlatformType, boolean>;
  }

  // Load platform config
  const loadConfig = useCallback(
    async (
      projectSlug: string,
      platform: PlatformType
    ): Promise<{
      config: AIPlatformWriterConfig;
      customPrompt?: string;
      useCustomPrompt?: boolean;
    }> => {
      try {
        const { data } = await supabase
          .from('projects')
          .select('settings')
          .eq('slug', projectSlug)
          .single();

        const settings = data?.settings?.ai_config as ExtendedWriterSettings | undefined;

        return {
          config: settings?.writers?.[platform] || PLATFORM_WRITER_DEFAULTS[platform],
          customPrompt: settings?.writerPrompts?.[platform],
          useCustomPrompt: settings?.useCustomWriterPrompts?.[platform],
        };
      } catch {
        return { config: PLATFORM_WRITER_DEFAULTS[platform] };
      }
    },
    []
  );

  // Generate content for single platform
  const generateContent = useCallback(
    async (
      campaign: CampaignStrategy,
      platform: PlatformType,
      projectSlug: string,
      projectId: string
    ): Promise<PlatformContent> => {
      setProgress(`Đang viết content ${platform}...`);

      const { config, customPrompt, useCustomPrompt } = await loadConfig(projectSlug, platform);

      if (!config.enabled) {
        throw new Error(`Platform ${platform} chưa được bật`);
      }

      // Use custom prompt if available, otherwise use auto-generated
      let platformPrompt: string;
      if (useCustomPrompt && customPrompt) {
        console.log(`📝 Using custom prompt for ${platform}`);
        platformPrompt = customPrompt;
      } else {
        platformPrompt = PLATFORM_PROMPTS[platform](config, campaign);
      }

      const userPrompt = `${platformPrompt}

📋 CAMPAIGN INFO:
- Tên: ${campaign.name}
- Mục tiêu: ${campaign.objective}
- Thông điệp: ${campaign.keyMessage}
- Đối tượng: ${campaign.targetAudience}
- Chủ đề: ${campaign.contentThemes?.join(', ') || 'N/A'}
- CTA: ${campaign.callToAction}

📤 OUTPUT FORMAT (JSON):
{
  "title": "Tiêu đề bài viết (nếu có)",
  "content": "Nội dung đầy đủ theo yêu cầu trên",
  "hashtags": ["#hashtag1", "#hashtag2"],
  "callToAction": "CTA cuối bài",
  "visualDirection": "Gợi ý hình ảnh/video (optional)"
}

⚠️ Trả về JSON hợp lệ, viết content ĐẦY ĐỦ theo yêu cầu độ dài!`;

      const response = await fetch('/api/ai/workspace-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userPrompt,
          systemPrompt: `Bạn là AI Content Writer chuyên viết cho ${platform}. Chỉ trả về JSON.`,
          model: config.model.model,
          maxTokens: config.model.maxTokens,
          temperature: config.tone.creativity / 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiContent = data.response || data.content || '';

      // Parse JSON
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Fallback: use raw content
        return {
          campaignId: campaign.id,
          platform,
          title: campaign.name,
          content: aiContent,
          hashtags: [],
          callToAction: campaign.callToAction,
          metadata: {
            wordCount: aiContent.split(/\s+/).length,
            emojiCount: (aiContent.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
            estimatedReadTime: `${Math.ceil(aiContent.split(/\s+/).length / 200)} phút`,
          },
        };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(jsonMatch[0].replaceAll(/,\s*}/g, '}').replaceAll(/,\s*]/g, ']'));
      } catch {
        parsed = { content: aiContent };
      }

      const result: PlatformContent = {
        campaignId: campaign.id,
        platform,
        title: parsed.title || campaign.name,
        content: parsed.content || aiContent,
        hashtags: parsed.hashtags || [],
        callToAction: parsed.callToAction || campaign.callToAction,
        visualDirection: parsed.visualDirection,
        metadata: {
          wordCount: (parsed.content || aiContent).split(/\s+/).length,
          emojiCount: ((parsed.content || aiContent).match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
          estimatedReadTime: `${Math.ceil((parsed.content || aiContent).split(/\s+/).length / 200)} phút`,
        },
      };

      setContents((prev) => [
        ...prev.filter((c) => !(c.campaignId === campaign.id && c.platform === platform)),
        result,
      ]);

      return result;
    },
    [loadConfig]
  );

  // Generate content for all enabled platforms - PARALLEL for 10x speed!
  const generateAllPlatformContent = useCallback(
    async (
      campaign: CampaignStrategy,
      projectSlug: string,
      projectId: string
    ): Promise<PlatformContent[]> => {
      setLoading(true);
      setProgress(`Đang viết ${campaign.platforms.length} bài song song...`);

      try {
        // 🚀 PARALLEL: Generate ALL platforms at once
        const promises = campaign.platforms.map(async (platform) => {
          try {
            const content = await generateContent(campaign, platform, projectSlug, projectId);
            toast.success(`✅ ${platform}`);
            return content;
          } catch (err: any) {
            console.error(`Error generating ${platform} content:`, err);
            toast.error(`❌ ${platform}`, { description: err.message });
            return null;
          }
        });

        const settled = await Promise.all(promises);
        const results = settled.filter((r): r is PlatformContent => r !== null);

        if (results.length === 0) {
          throw new Error('Không tạo được content cho platform nào');
        }

        toast.success(`🎉 Hoàn thành ${results.length}/${campaign.platforms.length} bài viết!`);
        return results;
      } finally {
        setLoading(false);
        setProgress('');
      }
    },
    [generateContent]
  );

  // Save content to database
  const saveContent = useCallback(async (content: PlatformContent, projectId: string) => {
    const scheduledAt = new Date();
    scheduledAt.setHours(scheduledAt.getHours() + 2); // Default: 2 giờ sau

    const { error } = await supabaseAdmin.from('content_queue').insert({
      title: `[AI][${content.platform.toUpperCase()}] ${content.title}`,
      content_type: 'social_media',
      content: `${content.content}\n\n${content.hashtags.join(' ')}`,
      status: 'scheduled',
      priority: 7,
      scheduled_for: scheduledAt.toISOString(),
      project_id: projectId,
      platform: content.platform,
    });

    if (error) {
      console.error('Error saving content:', error);
      throw error;
    }

    toast.success(`Đã lưu bài ${content.platform}`);
  }, []);

  return {
    loading,
    progress,
    contents,
    generateContent,
    generateAllPlatformContent,
    saveContent,
    reset: () => setContents([]),
  };
}

export default useAIPlatformWriter;
