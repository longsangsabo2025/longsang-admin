/**
 * AI Workspace Prompt Templates
 * Quick prompts for each assistant type
 */

import { AssistantType } from '@/hooks/useAssistant';

export interface PromptTemplate {
  id: string;
  title: string;
  prompt: string;
  category: 'common' | 'advanced' | 'examples';
  assistantType: AssistantType;
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  // Course Assistant
  {
    id: 'course-1',
    title: 'Tạo outline khóa học',
    prompt:
      'Tạo outline khóa học chi tiết về [chủ đề]. Bao gồm: mục tiêu học tập, nội dung từng module, bài tập thực hành, và đánh giá.',
    category: 'common',
    assistantType: 'course',
  },
  {
    id: 'course-2',
    title: 'Viết bài giảng',
    prompt:
      'Viết bài giảng về [chủ đề] với độ dài khoảng [số] phút. Bao gồm: giới thiệu, nội dung chính, ví dụ thực tế, và tóm tắt.',
    category: 'common',
    assistantType: 'course',
  },
  {
    id: 'course-3',
    title: 'Tạo curriculum',
    prompt:
      'Tạo curriculum hoàn chỉnh cho khóa học [tên khóa học] kéo dài [số] tuần. Bao gồm: lộ trình học, tài liệu, và milestones.',
    category: 'advanced',
    assistantType: 'course',
  },
  {
    id: 'course-4',
    title: 'Thiết kế bài tập',
    prompt:
      'Thiết kế bài tập thực hành cho module [tên module]. Bài tập cần: mục tiêu rõ ràng, hướng dẫn chi tiết, và rubric đánh giá.',
    category: 'common',
    assistantType: 'course',
  },

  // Financial Assistant
  {
    id: 'financial-1',
    title: 'Phân tích chi tiêu tháng này',
    prompt:
      'Phân tích chi tiêu của tôi trong tháng này. So sánh với tháng trước và đề xuất cách tiết kiệm.',
    category: 'common',
    assistantType: 'financial',
  },
  {
    id: 'financial-2',
    title: 'Tạo ngân sách',
    prompt:
      'Tạo ngân sách chi tiết cho [tháng/năm]. Bao gồm: thu nhập, chi phí cố định, chi phí linh hoạt, và mục tiêu tiết kiệm.',
    category: 'common',
    assistantType: 'financial',
  },
  {
    id: 'financial-3',
    title: 'Kế hoạch đầu tư',
    prompt:
      'Tạo kế hoạch đầu tư dài hạn với mục tiêu [mục tiêu] trong [số] năm. Đề xuất danh mục đầu tư phù hợp với risk profile của tôi.',
    category: 'advanced',
    assistantType: 'financial',
  },
  {
    id: 'financial-4',
    title: 'Phân tích tài chính cá nhân',
    prompt:
      'Phân tích tình hình tài chính hiện tại của tôi và đề xuất cải thiện. Bao gồm: cash flow, debt management, và savings strategy.',
    category: 'advanced',
    assistantType: 'financial',
  },

  // Research Assistant
  {
    id: 'research-1',
    title: 'Nghiên cứu về chủ đề',
    prompt:
      'Nghiên cứu và tổng hợp thông tin về [chủ đề]. Bao gồm: background, current state, trends, và future outlook.',
    category: 'common',
    assistantType: 'research',
  },
  {
    id: 'research-2',
    title: 'Tìm kiếm thông tin mới nhất',
    prompt:
      'Tìm kiếm thông tin mới nhất về [chủ đề] từ các nguồn đáng tin cậy. Tổng hợp và phân tích các findings.',
    category: 'common',
    assistantType: 'research',
  },
  {
    id: 'research-3',
    title: 'So sánh và đối chiếu',
    prompt:
      'So sánh và đối chiếu [A] với [B]. Phân tích điểm mạnh, điểm yếu, và use cases phù hợp cho mỗi option.',
    category: 'advanced',
    assistantType: 'research',
  },
  {
    id: 'research-4',
    title: 'Tổng hợp nghiên cứu',
    prompt:
      'Tổng hợp các nghiên cứu về [chủ đề]. Tạo executive summary với key findings, insights, và recommendations.',
    category: 'advanced',
    assistantType: 'research',
  },

  // News Assistant
  {
    id: 'news-1',
    title: 'Tin tức mới nhất về chủ đề',
    prompt:
      'Tổng hợp tin tức mới nhất về [chủ đề] trong [thời gian]. Bao gồm: headlines, key developments, và implications.',
    category: 'common',
    assistantType: 'news',
  },
  {
    id: 'news-2',
    title: 'Xu hướng trong ngành',
    prompt:
      'Phân tích xu hướng trong ngành [tên ngành] hiện tại. Bao gồm: emerging trends, market movements, và predictions.',
    category: 'common',
    assistantType: 'news',
  },
  {
    id: 'news-3',
    title: 'Daily news digest',
    prompt:
      'Tạo bản tin tóm tắt hôm nay về: AI, công nghệ, startup Việt Nam, và fintech. Highlight những điểm quan trọng nhất.',
    category: 'common',
    assistantType: 'news',
  },
  {
    id: 'news-4',
    title: 'Phân tích tin tức',
    prompt: 'Phân tích tin tức về [sự kiện]. Bao gồm: context, implications, và potential impact.',
    category: 'advanced',
    assistantType: 'news',
  },

  // Career Assistant
  {
    id: 'career-1',
    title: 'Lộ trình phát triển sự nghiệp',
    prompt:
      'Tạo lộ trình phát triển sự nghiệp cho vị trí [vị trí] trong [ngành]. Bao gồm: skills cần thiết, milestones, và timeline.',
    category: 'common',
    assistantType: 'career',
  },
  {
    id: 'career-2',
    title: 'Kỹ năng cần thiết',
    prompt:
      'Liệt kê và phân tích các kỹ năng cần thiết cho [vị trí/ngành]. Đề xuất cách phát triển từng kỹ năng.',
    category: 'common',
    assistantType: 'career',
  },
  {
    id: 'career-3',
    title: 'Networking strategy',
    prompt:
      'Tạo chiến lược networking cho [mục tiêu]. Bao gồm: platforms, events, và best practices để build meaningful connections.',
    category: 'advanced',
    assistantType: 'career',
  },
  {
    id: 'career-4',
    title: 'Career transition plan',
    prompt:
      'Tạo kế hoạch chuyển đổi sự nghiệp từ [ngành hiện tại] sang [ngành mới]. Bao gồm: skills gap, learning path, và timeline.',
    category: 'advanced',
    assistantType: 'career',
  },

  // Daily Planner Assistant
  {
    id: 'daily-1',
    title: 'Lập kế hoạch ngày hôm nay',
    prompt:
      'Lập kế hoạch chi tiết cho ngày hôm nay. Bao gồm: priorities, tasks, time blocks, và breaks. Tối ưu hóa productivity.',
    category: 'common',
    assistantType: 'daily',
  },
  {
    id: 'daily-2',
    title: 'Sắp xếp công việc tuần này',
    prompt:
      'Sắp xếp và ưu tiên công việc cho tuần này. Tạo weekly plan với daily breakdown và buffer time.',
    category: 'common',
    assistantType: 'daily',
  },
  {
    id: 'daily-3',
    title: 'Time blocking',
    prompt:
      'Tạo time blocking schedule cho [ngày/tuần]. Phân bổ thời gian cho: deep work, meetings, breaks, và personal time.',
    category: 'advanced',
    assistantType: 'daily',
  },
  {
    id: 'daily-4',
    title: 'Review và cải thiện',
    prompt:
      'Review productivity của tôi trong [thời gian]. Phân tích patterns, identify bottlenecks, và đề xuất improvements.',
    category: 'advanced',
    assistantType: 'daily',
  },
];

/**
 * Get prompts for a specific assistant type
 */
export function getPromptsForAssistant(assistantType: AssistantType): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter((p) => p.assistantType === assistantType);
}

/**
 * Get prompts by category
 */
export function getPromptsByCategory(
  assistantType: AssistantType,
  category: 'common' | 'advanced' | 'examples'
): PromptTemplate[] {
  return PROMPT_TEMPLATES.filter(
    (p) => p.assistantType === assistantType && p.category === category
  );
}

/**
 * Search prompts
 */
export function searchPrompts(assistantType: AssistantType, query: string): PromptTemplate[] {
  const lowerQuery = query.toLowerCase();
  return PROMPT_TEMPLATES.filter(
    (p) =>
      p.assistantType === assistantType &&
      (p.title.toLowerCase().includes(lowerQuery) || p.prompt.toLowerCase().includes(lowerQuery))
  );
}
