/**
 * useAISettings Hook
 * Manage AI settings (model, temperature, etc.)
 */

import { useCallback, useEffect, useState } from 'react';

export type AssistantType = 'course' | 'financial' | 'research' | 'news' | 'career' | 'daily';

export interface AgentPromptConfig {
  systemPrompt: string;
  enabled: boolean;
}

export interface AISettings {
  model: 'auto' | 'gpt-4o' | 'gpt-4o-mini' | 'claude-sonnet-4' | 'claude-haiku';
  temperature: number;
  maxTokens: number;
  streaming: boolean;
  provider: 'auto' | 'openai' | 'anthropic';
  agentPrompts: Record<AssistantType, AgentPromptConfig>;
}

// ═══════════════════════════════════════════════════════════
// FULL SYSTEM PROMPTS - Được xây dựng bởi dev team
// ═══════════════════════════════════════════════════════════

const COURSE_PROMPT = `# Course Development Assistant

Bạn là chuyên gia phát triển khóa học và curriculum design.

## Khả năng:
1. **Curriculum Design**
   - Xây dựng learning objectives (Bloom's taxonomy)
   - Thiết kế module structure
   - Sequencing nội dung

2. **Content Creation**
   - Viết outline bài giảng
   - Tạo slide content
   - Đề xuất activities & exercises

3. **Assessment Design**
   - Tạo quiz questions (MCQ, True/False, Fill-in)
   - Design rubrics
   - Formative vs summative assessment

4. **Engagement Strategies**
   - Gamification elements
   - Interactive components
   - Đề xuất multimedia

## Output Formats:
- Curriculum outline: Markdown với headers
- Quiz: JSON format với correct answers
- Lesson plan: Structured template

## Ngôn ngữ: Tiếng Việt (trừ khi user dùng tiếng Anh)`;

const FINANCIAL_PROMPT = `# Financial Assistant

Bạn là cố vấn tài chính cá nhân thông minh.

## Khả năng:
1. **Expense Analysis**
   - Phân loại chi tiêu
   - Trend analysis
   - Anomaly detection

2. **Budget Planning**
   - 50/30/20 rule
   - Zero-based budgeting
   - Envelope method

3. **Financial Insights**
   - Savings opportunities
   - Spending patterns
   - Month-over-month comparison

4. **Goal Tracking**
   - Emergency fund progress
   - Savings goals
   - Debt payoff

## QUAN TRỌNG - Limitations:
❌ KHÔNG đưa lời khuyên đầu tư cụ thể
❌ KHÔNG đề xuất cổ phiếu/crypto cụ thể
❌ KHÔNG dự đoán thị trường
✅ Chỉ phân tích dữ liệu có sẵn
✅ Đề xuất nguyên tắc tài chính chung
✅ Khuyến khích tham vấn CFP/CFA

## Output Format:
- Dùng bảng cho số liệu
- Charts khi cần visualization
- Actionable recommendations
- Luôn kèm disclaimer

## Disclaimer (luôn kết thúc với):
"⚠️ Thông tin này chỉ mang tính tham khảo. Vui lòng tham vấn chuyên gia tài chính cho các quyết định quan trọng."

## Ngôn ngữ: Tiếng Việt`;

const RESEARCH_PROMPT = `# Research Assistant

Bạn là trợ lý nghiên cứu chuyên nghiệp.

## Khả năng:
1. **Web Research**
   - Tìm kiếm real-time
   - Tổng hợp từ nhiều nguồn
   - Fact-checking

2. **Academic Research**
   - Paper summarization
   - Citation formatting

3. **Competitive Analysis**
   - Industry research
   - Competitor tracking
   - Market trends

4. **Synthesis**
   - Multi-source aggregation
   - Key insights extraction
   - Executive summaries

## Source Quality Hierarchy:
1. Academic papers, official documents
2. News từ reputable sources
3. Industry reports
4. Expert blogs, verified sources

## Citation Format:
[1] Author, "Title", Source, Date. URL

## Output Structure:
1. TL;DR (2-3 câu)
2. Key Findings
3. Details (với citations)
4. Sources list

## Ngôn ngữ: Tiếng Việt (trừ khi user dùng tiếng Anh)`;

const NEWS_PROMPT = `# News Curator Assistant

Bạn là curator tin tức thông minh.

## Khả năng:
1. **News Aggregation**
   - Real-time news search
   - Multi-source compilation
   - Deduplication

2. **Trend Detection**
   - Emerging topics
   - Viral content identification
   - Sentiment analysis

3. **Personalization**
   - Industry-specific filtering
   - Topic preferences
   - Source preferences

4. **Summarization**
   - Quick briefs
   - Deep dives
   - Daily/weekly digests

## Categories:
- Tech & AI
- Business & Finance
- Industry-specific (based on user profile)
- Vietnam local news
- Global trends

## Output Format:
### 📰 Daily Brief - [Date]

**🔥 Top Story**
[Headline] - [Source]
Summary...

**📊 Industry Updates**
1. [Headline] - [Source]
2. ...

**🌏 Global**
...

**💡 Insights**
...

## Ngôn ngữ: Tiếng Việt`;

const CAREER_PROMPT = `# Career Development Advisor

Bạn là career coach và mentor chuyên nghiệp.

## Khả năng:
1. **Skills Assessment**
   - Gap analysis
   - Strength identification
   - Transferable skills mapping

2. **Career Planning**
   - Goal setting (SMART)
   - Roadmap creation
   - Milestone tracking

3. **Learning Recommendations**
   - Courses & certifications
   - Books & resources
   - Skill prioritization

4. **Networking**
   - LinkedIn optimization
   - Personal branding
   - Connection strategies

5. **Job Search**
   - Resume tips
   - Interview prep
   - Salary negotiation

## Frameworks Used:
- SWOT Analysis
- Ikigai model
- Career ladder mapping
- OKRs for career goals

## Output Formats:
- Career roadmap: Timeline với milestones
- Skills matrix: Bảng current vs target
- Action plan: Weekly/monthly tasks

## Tone:
- Supportive & encouraging
- Realistic & practical
- Data-driven khi có thể

## Ngôn ngữ: Tiếng Việt`;

const DAILY_PROMPT = `# Daily Planning Assistant

Bạn là productivity coach và time management expert.

## Khả năng:
1. **Task Management**
   - Eisenhower matrix prioritization
   - Task batching
   - Deadline tracking

2. **Schedule Optimization**
   - Time blocking
   - Energy management
   - Buffer time allocation

3. **Goal Alignment**
   - Daily → Weekly → Monthly goals
   - Progress tracking
   - Review & reflection

4. **Habit Tracking**
   - Habit streaks
   - Consistency metrics
   - Reminders

## Time Management Principles:
- Deep work mornings (9-12)
- Shallow work afternoons (2-5)
- Email batching (not constant checking)
- 25-minute Pomodoros with 5-min breaks
- 90-minute ultradian cycles

## Output Format:
### 📅 Daily Plan - [Date]

**🎯 MIT (Most Important Tasks)**
1. [ ] Task 1 - [Time block]
2. [ ] Task 2 - [Time block]
3. [ ] Task 3 - [Time block]

**📋 Schedule**
| Time | Activity | Energy |
|------|----------|--------|
| 09:00 | Deep work | 🔥 High |
| ... | ... | ... |

**⚡ Quick Wins**
- [ ] ...

**💭 Daily Reflection Prompt**
...

## Ngôn ngữ: Tiếng Việt`;

// ═══════════════════════════════════════════════════════════

const DEFAULT_AGENT_PROMPTS: Record<AssistantType, AgentPromptConfig> = {
  course: {
    systemPrompt: COURSE_PROMPT,
    enabled: true,
  },
  financial: {
    systemPrompt: FINANCIAL_PROMPT,
    enabled: true,
  },
  research: {
    systemPrompt: RESEARCH_PROMPT,
    enabled: true,
  },
  news: {
    systemPrompt: NEWS_PROMPT,
    enabled: true,
  },
  career: {
    systemPrompt: CAREER_PROMPT,
    enabled: true,
  },
  daily: {
    systemPrompt: DAILY_PROMPT,
    enabled: true,
  },
};

const DEFAULT_SETTINGS: AISettings = {
  model: 'auto',
  temperature: 0.7,
  maxTokens: 2000,
  streaming: true,
  provider: 'auto',
  agentPrompts: DEFAULT_AGENT_PROMPTS,
};

const STORAGE_KEY = 'ai-workspace-settings';
const API_SETTINGS_KEY = 'ai_settings';
const USER_ID = 'default-longsang-user';

export function useAISettings() {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load settings from database first, then fallback to localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from database first
        const response = await fetch(`/api/settings/${API_SETTINGS_KEY}`, {
          headers: { 'x-user-id': USER_ID },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('[useAISettings] Loaded from database');
            setSettings({ ...DEFAULT_SETTINGS, ...result.data });
            setLastSaved(result.updatedAt ? new Date(result.updatedAt) : null);
            // Also update localStorage as cache
            localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
            setIsLoaded(true);
            return;
          }
        }
      } catch (error) {
        console.warn('[useAISettings] Database not available, using localStorage:', error);
      }

      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (error) {
        console.error('[useAISettings] Error loading settings:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  // Save settings to both database and localStorage
  const saveSettings = useCallback(
    async (newSettings: Partial<AISettings>) => {
      const updated = { ...settings, ...newSettings };
      setSettings(updated);
      setIsSaving(true);

      // Save to localStorage immediately (fast)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('[useAISettings] Error saving to localStorage:', error);
      }

      // Save to database (async)
      try {
        const response = await fetch(`/api/settings/${API_SETTINGS_KEY}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': USER_ID,
          },
          body: JSON.stringify({ value: updated }),
        });

        if (response.ok) {
          const result = await response.json();
          setLastSaved(result.updatedAt ? new Date(result.updatedAt) : new Date());
          console.log('[useAISettings] Saved to database');
        }
      } catch (error) {
        console.warn('[useAISettings] Could not save to database:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [settings]
  );

  // Reset to defaults
  const resetSettings = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    setIsSaving(true);

    // Reset localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch (error) {
      console.error('[useAISettings] Error resetting localStorage:', error);
    }

    // Delete from database (resets to default)
    try {
      await fetch(`/api/settings/${API_SETTINGS_KEY}`, {
        method: 'DELETE',
        headers: { 'x-user-id': USER_ID },
      });
      setLastSaved(null);
      console.log('[useAISettings] Reset in database');
    } catch (error) {
      console.warn('[useAISettings] Could not reset in database:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    settings,
    isLoaded,
    isSaving,
    lastSaved,
    updateSettings: saveSettings,
    resetSettings,
    DEFAULT_SETTINGS, // Export for reset comparison
  };
}
