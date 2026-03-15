/**
 * 🎯 AI Marketing Strategist Hook
 * Chuyên tạo chiến lược marketing tổng thể từ tài liệu dự án
 * KHÔNG viết content chi tiết - chỉ focus chiến lược
 */

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import supabaseAdmin from '@/lib/supabase-admin';
import {
  AIStrategistConfig,
  DEFAULT_STRATEGIST_CONFIG,
  MarketingStrategy,
  PlatformType,
} from '@/types/ai-marketing';

interface UseAIStrategistReturn {
  loading: boolean;
  progress: string;
  strategy: MarketingStrategy | null;
  generateStrategy: (
    projectSlug: string,
    projectId: string,
    projectName: string
  ) => Promise<MarketingStrategy>;
  saveStrategy: (strategy: MarketingStrategy, projectId: string) => Promise<void>;
  reset: () => void;
}

export function useAIStrategist(): UseAIStrategistReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [strategy, setStrategy] = useState<MarketingStrategy | null>(null);

  // Extended config type with custom prompt
  interface ExtendedStrategistConfig extends AIStrategistConfig {
    useCustomPrompt?: boolean;
    customFullPrompt?: string;
  }

  // Load strategist config from project
  const loadConfig = useCallback(async (projectSlug: string): Promise<ExtendedStrategistConfig> => {
    try {
      const { data } = await supabase
        .from('projects')
        .select('settings')
        .eq('slug', projectSlug)
        .single();

      return data?.settings?.ai_config?.strategist || DEFAULT_STRATEGIST_CONFIG;
    } catch {
      return DEFAULT_STRATEGIST_CONFIG;
    }
  }, []);

  // Read project documents from Supabase
  const readDocuments = useCallback(
    async (projectSlug: string, projectId: string): Promise<string> => {
      setProgress('Đang đọc tài liệu dự án...');

      // Use supabaseAdmin (service key) to read documents
      const { data: docs, error } = await supabaseAdmin
        .from('project_documents')
        .select('title, content, doc_type')
        .eq('project_id', projectId)
        .in('doc_type', ['marketing', 'brand', 'product', 'strategy', 'general', 'readme']);

      if (error) {
        console.error('Error reading documents:', error);
        throw new Error('Lỗi đọc tài liệu từ database');
      }

      if (!docs?.length) {
        throw new Error(
          'Không tìm thấy tài liệu marketing. Vui lòng sync MARKETING_PACK vào database.'
        );
      }

      return docs.map((d) => `=== ${d.title} (${d.doc_type}) ===\n${d.content}`).join('\n\n');
    },
    []
  );

  // Build strategist prompt
  const buildPrompt = (
    config: AIStrategistConfig,
    documentContent: string,
    projectName: string
  ): { system: string; user: string } => {
    const { expertise, strategy, output } = config;

    const system = `Bạn là ${expertise.role} với ${expertise.yearsExperience} năm kinh nghiệm.
Chuyên môn: ${expertise.specializations.join(', ')}

QUAN TRỌNG: Bạn CHỈ tạo CHIẾN LƯỢC MARKETING TỔNG THỂ, KHÔNG viết content chi tiết.

Output của bạn sẽ được sử dụng bởi các AI Content Writer chuyên biệt cho từng platform.`;

    const user = `📚 TÀI LIỆU DỰ ÁN: ${projectName}
${documentContent.substring(0, 8000)}

---

🎯 NHIỆM VỤ: Tạo CHIẾN LƯỢC MARKETING cho dự án này.

📋 YÊU CẦU:
- Mục tiêu chính: ${strategy.objective.toUpperCase()}
- Số chiến dịch: ${strategy.campaignsCount}
- Đối tượng mục tiêu: ${strategy.targetAudience}
- Thị trường: ${strategy.marketFocus}

${config.customInstructions ? `📝 Hướng dẫn thêm: ${config.customInstructions}` : ''}

📤 OUTPUT FORMAT (JSON):
{
  "summary": "Tóm tắt chiến lược 2-3 câu",
  "brandAnalysis": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "opportunities": ["Cơ hội 1", "Cơ hội 2"],
    "uniqueValue": "Unique value proposition"
  },
  "targetAudience": {
    "primary": "Đối tượng chính",
    "secondary": "Đối tượng phụ",
    "painPoints": ["Pain point 1", "Pain point 2"]
  },
  "campaigns": [
    {
      "id": "campaign-1",
      "name": "Tên chiến dịch",
      "objective": "${strategy.objective}",
      "keyMessage": "Thông điệp chính",
      "targetAudience": "Đối tượng cụ thể",
      "platforms": ["facebook", "instagram"],
      "duration": "2 tuần",
      "priority": "high",
      "contentThemes": ["Theme 1", "Theme 2", "Theme 3"],
      "callToAction": "CTA chính"
    }
  ],
  ${
    output.includeTimeline
      ? `"timeline": [
    {"phase": "Phase 1", "duration": "1 tuần", "focus": "Launch"}
  ],`
      : ''
  }
  ${
    output.includeKPIs
      ? `"kpis": [
    {"metric": "Reach", "target": "10,000"},
    {"metric": "Engagement Rate", "target": "5%"}
  ],`
      : ''
  }
  "recommendations": ["Khuyến nghị 1", "Khuyến nghị 2"]
}

⚠️ CHỈ trả về JSON hợp lệ, KHÔNG có markdown hay text khác.`;

    return { system, user };
  };

  // Parse custom prompt into system and user parts
  const parseCustomPrompt = (
    customPrompt: string,
    documentContent: string,
    projectName: string
  ): { system: string; user: string } => {
    // Replace placeholders with actual content
    let processedPrompt = customPrompt
      .replace(/\[Tên dự án\]/g, projectName)
      .replace(
        /\[Nội dung tài liệu sẽ được đọc tự động từ database\]/g,
        documentContent.substring(0, 8000)
      );

    // Try to split into system and user parts
    const systemMatch = processedPrompt.match(
      /=== SYSTEM PROMPT ===\s*([\s\S]*?)(?:=== USER PROMPT ===|$)/
    );
    const userMatch = processedPrompt.match(/=== USER PROMPT ===\s*([\s\S]*)/);

    if (systemMatch && userMatch) {
      return {
        system: systemMatch[1].trim(),
        user: userMatch[1].trim(),
      };
    }

    // If no markers, use entire prompt as user prompt
    return {
      system: 'Bạn là AI Marketing Strategist chuyên tạo chiến lược marketing.',
      user: processedPrompt,
    };
  };

  // Generate strategy with AI
  const generateStrategy = useCallback(
    async (
      projectSlug: string,
      projectId: string,
      projectName: string
    ): Promise<MarketingStrategy> => {
      setLoading(true);
      setStrategy(null);

      try {
        // Load config
        const config = await loadConfig(projectSlug);

        // Read documents from Supabase (requires projectId)
        const documentContent = await readDocuments(projectSlug, projectId);

        if (documentContent.length < 200) {
          throw new Error('Tài liệu marketing quá ít để phân tích');
        }

        // Build prompt - use custom if available
        setProgress('AI đang phân tích và tạo chiến lược...');

        let system: string;
        let user: string;

        if (config.useCustomPrompt && config.customFullPrompt) {
          // Use custom prompt
          const parsed = parseCustomPrompt(config.customFullPrompt, documentContent, projectName);
          system = parsed.system;
          user = parsed.user;
          console.log('📝 Using custom prompt');
        } else {
          // Auto-generate from config
          const prompts = buildPrompt(config, documentContent, projectName);
          system = prompts.system;
          user = prompts.user;
          console.log('🤖 Using auto-generated prompt');
        }

        // Call AI
        const response = await fetch('/api/ai/workspace-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: user,
            systemPrompt: system,
            model: config.model.model,
            maxTokens: config.model.maxTokens,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI request failed: ${response.status}`);
        }

        const data = await response.json();
        const aiContent = data.response || data.content || '';

        // Parse JSON response
        setProgress('Đang xử lý kết quả...');
        const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('AI không trả về JSON hợp lệ');
        }

        let parsed: MarketingStrategy;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Try to fix common JSON issues
          let fixed = jsonMatch[0]
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/[\x00-\x1F]+/g, ' ');
          parsed = JSON.parse(fixed);
        }

        // Validate and normalize
        const result: MarketingStrategy = {
          summary: parsed.summary || `Chiến lược marketing cho ${projectName}`,
          brandAnalysis: parsed.brandAnalysis || {
            strengths: ['Sản phẩm chất lượng'],
            opportunities: ['Thị trường đang phát triển'],
            uniqueValue: projectName,
          },
          targetAudience: parsed.targetAudience || {
            primary: config.strategy.targetAudience,
            secondary: '',
            painPoints: [],
          },
          campaigns: (parsed.campaigns || []).map((c: any, i: number) => ({
            id: c.id || `campaign-${i + 1}`,
            name: c.name || `Chiến dịch ${i + 1}`,
            objective: c.objective || config.strategy.objective,
            keyMessage: c.keyMessage || '',
            targetAudience: c.targetAudience || '',
            platforms: c.platforms || ['facebook', 'instagram'],
            duration: c.duration || '1 tuần',
            priority: c.priority || 'medium',
            contentThemes: c.contentThemes || [],
            callToAction: c.callToAction || 'Tìm hiểu ngay',
          })),
          timeline: parsed.timeline || [],
          kpis: parsed.kpis || [],
          recommendations: parsed.recommendations || [],
        };

        // Ensure at least 1 campaign
        if (result.campaigns.length === 0) {
          result.campaigns.push({
            id: 'campaign-1',
            name: `${projectName} Launch`,
            objective: config.strategy.objective,
            keyMessage: `Giới thiệu ${projectName}`,
            targetAudience: config.strategy.targetAudience,
            platforms: ['facebook', 'instagram'] as PlatformType[],
            duration: '2 tuần',
            priority: 'high',
            contentThemes: ['Introduction', 'Features', 'Benefits'],
            callToAction: 'Tìm hiểu ngay',
          });
        }

        setStrategy(result);
        toast.success(`✨ Đã tạo chiến lược với ${result.campaigns.length} chiến dịch!`);

        return result;
      } catch (err: any) {
        console.error('Strategy generation error:', err);
        toast.error('Lỗi tạo chiến lược', { description: err.message });
        throw err;
      } finally {
        setLoading(false);
        setProgress('');
      }
    },
    [loadConfig, readDocuments]
  );

  // Save strategy to database
  const saveStrategy = useCallback(async (strategy: MarketingStrategy, projectId: string) => {
    setProgress('Đang lưu chiến lược...');

    try {
      // Save each campaign to marketing_campaigns
      for (const campaign of strategy.campaigns) {
        const { error } = await supabaseAdmin.from('marketing_campaigns').insert({
          name: campaign.name,
          type: 'strategy',
          status: 'draft',
          platforms: campaign.platforms,
          content: '', // Content sẽ được AI Writer tạo sau
          project_id: projectId,
          target_audience: {
            strategy: true,
            objective: campaign.objective,
            keyMessage: campaign.keyMessage,
            targetAudience: campaign.targetAudience,
            duration: campaign.duration,
            priority: campaign.priority,
            contentThemes: campaign.contentThemes,
            callToAction: campaign.callToAction,
            brandAnalysis: strategy.brandAnalysis,
            kpis: strategy.kpis,
          },
        });

        if (error) {
          console.error('Error saving campaign:', error);
        }
      }

      toast.success('Đã lưu chiến lược marketing');
    } catch (err: any) {
      console.error('Save strategy error:', err);
      toast.error('Lỗi lưu chiến lược');
      throw err;
    } finally {
      setProgress('');
    }
  }, []);

  return {
    loading,
    progress,
    strategy,
    generateStrategy,
    saveStrategy,
    reset: () => setStrategy(null),
  };
}

export default useAIStrategist;
