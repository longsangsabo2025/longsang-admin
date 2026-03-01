/**
 * 🧠 AI Master Strategist Hook
 * 
 * AI CMO với 20 năm kinh nghiệm - Tạo Marketing Masterplan toàn diện
 * Model: Claude 3.5 Sonnet (best reasoning + large context)
 */

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  MarketingMasterplan,
  AICMOConfig,
  DEFAULT_CMO_CONFIG,
  MarketingPhase,
  MasterplanCampaign,
  CustomerPersona,
  BrandAnalysis,
  ContentPillar,
} from '@/types/ai-marketing';

// ==================== SYSTEM PROMPT ====================
const CMO_SYSTEM_PROMPT = `# ROLE: Chief Marketing Officer (CMO) AI

Bạn là CMO AI với 20+ năm kinh nghiệm marketing cho startups và tech companies.
Background:
- Ex-Apple Marketing Director (5 năm)
- Ex-Grab Growth Lead Vietnam (3 năm)  
- Advisor cho 50+ startups Việt Nam
- Chuyên gia về app launch, gaming, và social platforms

## MISSION
Phân tích TẤT CẢ tài liệu dự án được cung cấp và xây dựng MARKETING MASTERPLAN toàn diện, chi tiết, có thể thực hiện ngay.

## ANALYSIS APPROACH

### 1. Deep Document Analysis
- Đọc kỹ TỪNG tài liệu
- Extract: Product features, USP, target users, business model
- Identify: Pain points sản phẩm giải quyết
- Understand: Market positioning, competitive landscape

### 2. Brand DNA Extraction
- Brand voice & personality từ cách viết
- Core values từ mission/vision
- Unique differentiators vs competitors

### 3. Audience Intelligence
- Xây dựng Customer Personas chi tiết
- Map customer journey
- Identify key touchpoints

### 4. Strategic Planning
- Phân chia phases theo lifecycle: Pre-launch → Launch → Growth → Scale
- Mỗi phase có campaigns cụ thể với timeline
- Content calendar cho từng campaign

## OUTPUT REQUIREMENTS

### QUAN TRỌNG - Format Output:
- Output PHẢI là JSON hợp lệ
- KHÔNG có markdown, comments, hay text ngoài JSON
- Tất cả strings phải escape properly

### Executive Summary
- 3-5 câu tóm tắt chiến lược
- Highlight key opportunities
- Overall approach

### Brand Analysis (Chi tiết)
- USP rõ ràng, compelling
- Brand voice description
- SWOT analysis for marketing
- Competitive positioning

### Customer Personas (2-3 personas)
- Tên + demographic
- Psychographic details
- Pain points & goals
- Platform behavior
- Content preferences

### Content Pillars (3-5 pillars)
- Tên pillar
- Description
- % allocation
- Example topics

### Marketing Phases (2-4 phases)
Mỗi phase gồm:
- Objective cụ thể
- Timeline (start/end dates)
- KPIs với targets số
- 1-3 campaigns chi tiết

### Campaigns (Chi tiết)
Mỗi campaign:
- Tên catchy, memorable
- Objective SMART
- Target personas
- Key message + supporting messages
- Platform strategy (posts/week, content types)
- Content calendar (week-by-week)
- KPIs

### Recommendations
- Quick wins (thực hiện ngay)
- Strategic moves (1-3 tháng)
- Long-term plays (3-6 tháng)

## RULES
1. DỰA TRÊN DATA - Mọi insight phải từ tài liệu, không bịa
2. REALISTIC - Phù hợp startup/SME resources (team nhỏ, budget hạn chế)
3. ACTIONABLE - Có thể thực hiện ngay với hướng dẫn cụ thể
4. MEASURABLE - Mọi KPI phải có số cụ thể
5. VIETNAMESE CONTEXT - Hiểu văn hóa, trends, platforms VN
6. CREATIVE - Ý tưởng campaign phải độc đáo, viral potential

## PLATFORMS PRIORITY (Vietnam)
1. Facebook - Vẫn #1 cho reach
2. TikTok - Gen Z, viral potential
3. Instagram - Visual brands, lifestyle
4. YouTube - Long-form, tutorials
5. Zalo - Local reach, older demo
6. LinkedIn - B2B only
7. Threads - Emerging, test`;

// ==================== INTERFACES ====================
interface UseAIMasterStrategistReturn {
  loading: boolean;
  progress: string;
  masterplan: MarketingMasterplan | null;
  error: string | null;
  generateMasterplan: (projectSlug: string, projectId: string, projectName: string) => Promise<MarketingMasterplan | null>;
  saveMasterplan: (masterplan: MarketingMasterplan) => Promise<void>;
  reset: () => void;
}

// ==================== HOOK ====================
export function useAIMasterStrategist(): UseAIMasterStrategistReturn {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [masterplan, setMasterplan] = useState<MarketingMasterplan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load config from localStorage or use default
  const loadConfig = useCallback((): AICMOConfig => {
    try {
      const stored = localStorage.getItem('ai-cmo-config');
      if (stored) {
        return { ...DEFAULT_CMO_CONFIG, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Error loading CMO config:', e);
    }
    return DEFAULT_CMO_CONFIG;
  }, []);

  // Read all documents from project's database
  const readProjectDocuments = useCallback(async (projectSlug: string, projectId: string): Promise<string> => {
    setProgress('📚 Đang đọc tài liệu dự án...');
    
    try {
      // Read from project_documents table (same as useAIStrategist)
      const { data: docs, error } = await supabase
        .from('project_documents')
        .select('title, content, doc_type')
        .eq('project_id', projectId)
        .in('doc_type', ['marketing', 'brand', 'product', 'strategy', 'general', 'readme']);

      if (error) {
        console.error('Error reading documents:', error);
        throw new Error('Không thể đọc tài liệu từ database');
      }

      if (!docs || docs.length === 0) {
        throw new Error('Không tìm thấy tài liệu marketing nào. Vui lòng vào tab Tài liệu và sync MARKETING_PACK trước.');
      }

      setProgress(`✅ Đã đọc ${docs.length} tài liệu`);
      
      return docs.map(d => `\n=== TÀI LIỆU: ${d.title} (${d.doc_type}) ===\n${d.content}\n`).join('\n---\n');

    } catch (err) {
      console.error('Error reading documents:', err);
      throw err;
    }
  }, []);

  // Call AI to generate masterplan
  const callAI = useCallback(async (
    documents: string,
    projectName: string,
    config: AICMOConfig
  ): Promise<MarketingMasterplan> => {
    setProgress('🧠 AI CMO đang phân tích và xây dựng chiến lược...');

    const userPrompt = `# DỰ ÁN: ${projectName}

## TÀI LIỆU DỰ ÁN
${documents}

## YÊU CẦU
Dựa trên tất cả tài liệu trên, hãy xây dựng MARKETING MASTERPLAN toàn diện.

Cấu hình:
- Số phases: ${config.phasesCount}
- Số campaigns/phase: ${config.campaignsPerPhase}  
- Độ sâu phân tích: ${config.analysisDepth}
- Ngôn ngữ: ${config.outputLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
- Bao gồm content calendar: ${config.includeContentCalendar ? 'Có' : 'Không'}
- Bao gồm risk assessment: ${config.includeRiskAssessment ? 'Có' : 'Không'}

Timeline bắt đầu từ: ${new Date().toISOString().split('T')[0]}

## OUTPUT FORMAT
Trả về JSON object với cấu trúc MarketingMasterplan. Đây là schema:

{
  "executiveSummary": "string - 3-5 câu tóm tắt chiến lược",
  "brandAnalysis": {
    "brandName": "string",
    "tagline": "string",
    "brandVoice": "string",
    "brandPersonality": ["string"],
    "usp": "string",
    "keyBenefits": ["string"],
    "differentiators": ["string"],
    "swot": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    },
    "competitors": [{"name": "string", "strengths": ["string"], "weaknesses": ["string"]}]
  },
  "personas": [{
    "name": "string",
    "age": "string",
    "occupation": "string",
    "interests": ["string"],
    "painPoints": ["string"],
    "goals": ["string"],
    "platforms": ["facebook", "instagram", "tiktok", "youtube", "zalo"],
    "contentPreferences": ["string"]
  }],
  "contentPillars": [{
    "name": "string",
    "description": "string",
    "percentage": number,
    "contentTypes": ["string"],
    "exampleTopics": ["string"]
  }],
  "phases": [{
    "id": "string",
    "name": "string",
    "objective": "string",
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "duration": "string",
    "budgetPercentage": number,
    "kpis": [{"metric": "string", "target": "string"}],
    "campaigns": [{
      "id": "string",
      "name": "string",
      "objective": "string",
      "targetPersonas": ["string"],
      "targetAudience": "string",
      "keyMessage": "string",
      "supportingMessages": ["string"],
      "tone": "string",
      "platforms": ["facebook", "instagram", "tiktok"],
      "platformStrategy": {
        "facebook": {"postsPerWeek": number, "contentTypes": ["string"], "bestTimes": ["string"]},
        "instagram": {"postsPerWeek": number, "contentTypes": ["string"], "bestTimes": ["string"]}
      },
      "contentThemes": ["string"],
      "contentCalendar": [{
        "week": number,
        "focus": "string",
        "posts": [{"platform": "string", "type": "string", "topic": "string"}]
      }],
      "kpis": [{"metric": "string", "target": "string"}],
      "primaryCTA": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "priority": "high|medium|low",
      "status": "planned"
    }],
    "milestones": [{"date": "YYYY-MM-DD", "description": "string"}]
  }],
  "timeline": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "totalDuration": "string"
  },
  "budget": {
    "breakdown": [{"category": "string", "percentage": number, "description": "string"}]
  },
  "overallKPIs": [{
    "metric": "string",
    "baseline": "string",
    "target": "string",
    "timeframe": "string"
  }],
  "recommendations": [{
    "category": "quick-win|strategic|long-term",
    "title": "string",
    "description": "string",
    "impact": "high|medium|low",
    "effort": "high|medium|low"
  }],
  "risks": [{
    "risk": "string",
    "likelihood": "high|medium|low",
    "impact": "high|medium|low",
    "mitigation": "string"
  }]
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT KHÁC.`;

    // Call API - use solo-hub backend proxy for OpenAI/Anthropic
    const apiUrl = '/api/solo-hub/chat';

    // Combine system prompt with user prompt for the message
    const fullMessage = `${CMO_SYSTEM_PROMPT}\n\n---\n\n${userPrompt}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentRole: 'marketing',  // Use marketing agent
        message: fullMessage,
        context: {},
        options: {
          model: config.model.provider === 'anthropic' ? config.model.model : 'gpt-4o',
          maxTokens: config.model.maxTokens,
          temperature: config.model.temperature,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    // solo-hub returns { success: true, message: "..." }
    const content = data.message || data.content || data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content returned from AI');
    }

    // Parse JSON from response
    setProgress('🔄 Đang xử lý kết quả...');
    
    // Try to extract JSON from the response
    let jsonStr = content;
    
    // Remove markdown code blocks if present
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }
    
    // Trim whitespace
    jsonStr = jsonStr.trim();

    try {
      const parsed = JSON.parse(jsonStr);
      return parsed as MarketingMasterplan;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw content:', content.substring(0, 500));
      throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }
  }, []);

  // Main function: Generate Masterplan
  const generateMasterplan = useCallback(async (
    projectSlug: string,
    projectId: string,
    projectName: string
  ): Promise<MarketingMasterplan | null> => {
    setLoading(true);
    setError(null);
    setMasterplan(null);

    try {
      const config = loadConfig();
      
      // Step 1: Read documents
      const documents = await readProjectDocuments(projectSlug, projectId);
      
      if (!documents || documents.length < 100) {
        throw new Error('Tài liệu quá ít để phân tích. Vui lòng thêm tài liệu chi tiết hơn.');
      }

      // Step 2: Call AI
      const plan = await callAI(documents, projectName, config);

      // Step 3: Enrich with metadata
      const enrichedPlan: MarketingMasterplan = {
        ...plan,
        id: `masterplan-${Date.now()}`,
        projectId,
        projectName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0',
      };

      setMasterplan(enrichedPlan);
      setProgress('');
      
      toast.success('🎉 Marketing Masterplan đã sẵn sàng!', {
        description: `${plan.phases?.length || 0} phases, ${plan.phases?.reduce((sum, p) => sum + (p.campaigns?.length || 0), 0) || 0} campaigns`,
      });

      return enrichedPlan;

    } catch (err: any) {
      console.error('Generate masterplan error:', err);
      setError(err.message);
      toast.error('Lỗi tạo Masterplan', { description: err.message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [loadConfig, readProjectDocuments, callAI]);

  // Save masterplan to database
  const saveMasterplan = useCallback(async (plan: MarketingMasterplan) => {
    setProgress('💾 Đang lưu masterplan...');

    try {
      // Save masterplan as JSON document
      const { error: saveError } = await supabase
        .from('marketing_masterplans')
        .upsert({
          id: plan.id,
          project_id: plan.projectId,
          name: `Masterplan - ${plan.projectName}`,
          data: plan,
          status: 'active',
          created_at: plan.createdAt,
          updated_at: new Date().toISOString(),
        });

      if (saveError) {
        // Table might not exist, save to a generic table
        console.warn('Masterplans table not found, saving to project_configs');
        
        const { error: configError } = await supabase
          .from('project_configs')
          .upsert({
            project_id: plan.projectId,
            config_type: 'marketing_masterplan',
            config_data: plan,
            updated_at: new Date().toISOString(),
          });

        if (configError) {
          throw configError;
        }
      }

      // Also create campaigns in marketing_campaigns table
      for (const phase of plan.phases || []) {
        for (const campaign of phase.campaigns || []) {
          await supabase
            .from('marketing_campaigns')
            .insert({
              name: campaign.name,
              type: 'masterplan',
              status: campaign.status || 'planned',
              platforms: campaign.platforms,
              project_id: plan.projectId,
              content: campaign.keyMessage,
              target_audience: {
                masterplanId: plan.id,
                phaseId: phase.id,
                campaignId: campaign.id,
                objective: campaign.objective,
                targetPersonas: campaign.targetPersonas,
                keyMessage: campaign.keyMessage,
                supportingMessages: campaign.supportingMessages,
                contentThemes: campaign.contentThemes,
                kpis: campaign.kpis,
                primaryCTA: campaign.primaryCTA,
                platformStrategy: campaign.platformStrategy,
              },
              start_date: campaign.startDate,
              end_date: campaign.endDate,
            })
            .select()
            .single();
        }
      }

      toast.success('✅ Đã lưu Masterplan và tạo campaigns!');
      setProgress('');

    } catch (err: any) {
      console.error('Save masterplan error:', err);
      toast.error('Lỗi lưu masterplan', { description: err.message });
      throw err;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setLoading(false);
    setProgress('');
    setMasterplan(null);
    setError(null);
  }, []);

  return {
    loading,
    progress,
    masterplan,
    error,
    generateMasterplan,
    saveMasterplan,
    reset,
  };
}

export default useAIMasterStrategist;
