/**
 * 🎯 MVP AGENTS - 5 Pre-built Quality Agents
 * Ready for marketplace with clear pricing and value proposition
 */

export interface MVPAgent {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  category: 'sales' | 'content' | 'marketing' | 'data' | 'automation';
  
  // Pricing
  pricing: {
    model: 'pay-per-use' | 'subscription' | 'free-trial';
    price: number; // in USD
    unit: string; // per run, per post, per email, etc.
    free_trial_runs: number;
  };
  
  // Performance metrics
  metrics: {
    avg_execution_time: string;
    success_rate: number;
    total_runs: number;
    user_count: number;
  };
  
  // Rating
  rating: {
    score: number;
    count: number;
  };
  
  // Use cases
  use_cases: string[];
  
  // Input/Output examples
  input_example: {
    label: string;
    value: string;
  };
  output_example: {
    label: string;
    value: string;
  };
  
  // Technical config
  config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
  
  // AI prompt
  system_prompt: string;
  
  // Features
  features: string[];
  
  // Requirements
  requirements: string[];
}

export const MVP_AGENTS: MVPAgent[] = [
  {
    id: 'lead-qualifier',
    name: 'Lead Qualifier Agent',
    tagline: 'Tự động phân loại và đánh giá leads trong 30 giây',
    description: 'AI Agent thông minh phân tích thông tin contact, đánh giá chất lượng lead và đề xuất hành động tiếp theo. Giúp team sales tập trung vào leads tiềm năng cao nhất.',
    icon: '🎯',
    category: 'sales',
    
    pricing: {
      model: 'pay-per-use',
      price: 0.01,
      unit: 'per lead',
      free_trial_runs: 50,
    },
    
    metrics: {
      avg_execution_time: '15-30s',
      success_rate: 98.5,
      total_runs: 12450,
      user_count: 234,
    },
    
    rating: {
      score: 4.9,
      count: 156,
    },
    
    use_cases: [
      'Tự động score leads từ contact forms',
      'Phân loại leads theo industry & company size',
      'Đề xuất next action cho sales team',
      'Enrichment data từ email/phone',
      'Priority ranking cho lead lists'
    ],
    
    input_example: {
      label: 'Contact Form Data',
      value: `{
  "name": "Nguyen Van A",
  "email": "vana@company.com",
  "phone": "+84 901 234 567",
  "company": "ABC Technology",
  "position": "CEO",
  "message": "Tôi muốn tìm hiểu về automation solution cho 100+ nhân viên"
}`
    },
    
    output_example: {
      label: 'Lead Score & Action',
      value: `{
  "lead_score": 95,
  "quality": "HOT",
  "reason": "CEO level, 100+ employees, clear intent",
  "next_action": "Immediate call within 1 hour",
  "recommended_rep": "Senior Sales",
  "estimated_deal_size": "$50,000 - $100,000",
  "follow_up_email": "Generated personalized email ready to send"
}`
    },
    
    config: {
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1000,
    },
    
    system_prompt: `You are an expert B2B lead qualification specialist with 10+ years of experience.

Your task is to analyze contact information and provide:
1. Lead Score (0-100): Based on job title, company size, intent signals
2. Quality Rating: COLD/WARM/HOT
3. Qualification Reason: Why this score?
4. Next Action: What should sales team do?
5. Deal Size Estimate: Based on company size & requirements
6. Personalized Follow-up: Draft email ready to send

Criteria for scoring:
- Job Title: C-Level/VP/Director (+30), Manager (+15), Individual (+5)
- Company Size: 100+ employees (+20), 50-100 (+10), <50 (+5)
- Intent Signals: Clear need (+25), Exploring (+10), General inquiry (+5)
- Budget Indicators: Mentioned budget (+15), No mention (0)
- Timeline: Urgent (+10), This month (+5), Exploring (0)

Respond in JSON format with clear, actionable insights.`,
    
    features: [
      '✅ AI-powered lead scoring',
      '✅ Automatic data enrichment',
      '✅ Next action recommendations',
      '✅ Personalized email generation',
      '✅ CRM integration ready',
      '✅ Real-time processing'
    ],
    
    requirements: [
      'Contact name (optional)',
      'Email address (required)',
      'Company name (optional)',
      'Message or inquiry (required)'
    ]
  },
  
  {
    id: 'blog-post-writer',
    name: 'Blog Post Writer Agent',
    tagline: 'Viết blog posts SEO-optimized 1500 từ trong 2 phút',
    description: 'AI Content Writer chuyên nghiệp tạo blog posts chất lượng cao với SEO optimization, internal linking, và CTA hấp dẫn. Giảm 90% thời gian viết content.',
    icon: '✍️',
    category: 'content',
    
    pricing: {
      model: 'pay-per-use',
      price: 0.5,
      unit: 'per post',
      free_trial_runs: 3,
    },
    
    metrics: {
      avg_execution_time: '90-120s',
      success_rate: 96.8,
      total_runs: 8920,
      user_count: 456,
    },
    
    rating: {
      score: 4.8,
      count: 328,
    },
    
    use_cases: [
      'Tạo blog posts SEO-friendly',
      'Content cho marketing campaigns',
      'Guest posts cho backlinks',
      'Product reviews & comparisons',
      'How-to guides & tutorials'
    ],
    
    input_example: {
      label: 'Topic & Keywords',
      value: `{
  "topic": "How to automate customer support with AI",
  "primary_keyword": "AI customer support",
  "secondary_keywords": ["chatbot automation", "support ticket system", "AI assistant"],
  "target_audience": "Small business owners",
  "tone": "professional but friendly",
  "word_count": 1500
}`
    },
    
    output_example: {
      label: 'SEO-Optimized Blog Post',
      value: `{
  "title": "How to Automate Customer Support with AI: Complete Guide 2025",
  "meta_description": "Discover how AI customer support automation can save 70% of time...",
  "content": "Full 1500-word article with proper H2, H3 structure...",
  "seo_score": 92,
  "readability": "8th grade level",
  "keywords_used": 12,
  "internal_links": ["Suggest 3 related articles"],
  "images_needed": ["AI chatbot dashboard", "Customer support metrics"],
  "cta": "Try our AI support solution free for 30 days"
}`
    },
    
    config: {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 3000,
    },
    
    system_prompt: `You are a professional content writer and SEO expert specializing in B2B SaaS content.

Your task is to write high-quality blog posts that:
1. Are SEO-optimized with primary & secondary keywords
2. Have clear structure (H1, H2, H3) for readability
3. Include actionable insights and examples
4. Are written for the target audience's level
5. Have compelling introduction and conclusion
6. Include internal linking suggestions
7. End with strong CTA

SEO Best Practices:
- Use primary keyword in title, first paragraph, and 2-3 times in content
- Include secondary keywords naturally
- Keep paragraphs short (3-4 sentences)
- Use bullet points for lists
- Add meta description (150-160 characters)
- Suggest relevant images

Content Structure:
- Introduction (Hook + Problem + Promise)
- Main Content (3-5 sections with H2)
- Each section with subsections (H3) if needed
- Conclusion (Summary + CTA)

Tone & Style:
- Professional but conversational
- Use "you" to address reader
- Avoid jargon unless necessary
- Include statistics or data when relevant
- Add real-world examples

Output Format: JSON with title, meta_description, content, seo_metrics, suggestions`,
    
    features: [
      '✅ SEO-optimized content',
      '✅ Keyword integration',
      '✅ Proper heading structure',
      '✅ Readability optimization',
      '✅ Internal linking suggestions',
      '✅ Meta description generation',
      '✅ Image recommendations',
      '✅ CTA creation'
    ],
    
    requirements: [
      'Topic or title (required)',
      'Primary keyword (required)',
      'Secondary keywords (optional)',
      'Target audience (optional)',
      'Desired word count (optional)',
      'Tone preference (optional)'
    ]
  },
  
  {
    id: 'email-followup',
    name: 'Email Follow-up Agent',
    tagline: 'Gửi email follow-up được personalized tự động',
    description: 'AI Agent viết và lên lịch email follow-up theo context, giúp tăng response rate lên 3x. Tự động personalize dựa trên previous conversation và recipient profile.',
    icon: '📧',
    category: 'sales',
    
    pricing: {
      model: 'pay-per-use',
      price: 0.02,
      unit: 'per email',
      free_trial_runs: 25,
    },
    
    metrics: {
      avg_execution_time: '10-20s',
      success_rate: 97.2,
      total_runs: 15680,
      user_count: 567,
    },
    
    rating: {
      score: 4.9,
      count: 412,
    },
    
    use_cases: [
      'Follow-up sau meeting',
      'Chase unpaid invoices',
      'Re-engage cold leads',
      'Thank you emails post-purchase',
      'Nurture email sequences'
    ],
    
    input_example: {
      label: 'Context & Recipient',
      value: `{
  "recipient_name": "John Smith",
  "recipient_email": "john@company.com",
  "context": "Had demo call yesterday, he was interested in Pro plan but wants to discuss with team",
  "previous_conversation": "Showed automation features, he liked workflow builder",
  "goal": "Schedule follow-up meeting to close deal",
  "tone": "professional but warm"
}`
    },
    
    output_example: {
      label: 'Personalized Email',
      value: `{
  "subject": "Quick follow-up on automation demo - Next steps?",
  "body": "Hi John,\\n\\nThanks again for yesterday's demo call! I'm glad the workflow builder resonated with your team's needs...\\n\\nI've prepared a custom proposal based on our discussion. Would Thursday at 2 PM work for a quick 15-minute call to go through it?\\n\\nLooking forward to helping your team automate those repetitive tasks!\\n\\nBest regards",
  "send_time": "tomorrow 10:00 AM",
  "follow_up_sequence": "If no response in 3 days: gentle reminder",
  "personalization_score": 94
}`
    },
    
    config: {
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 800,
    },
    
    system_prompt: `You are an expert email copywriter specializing in B2B follow-up emails that get responses.

Your task is to write personalized follow-up emails that:
1. Reference previous conversation naturally
2. Provide clear value or next step
3. Have specific, easy-to-say-yes CTA
4. Match the recipient's communication style
5. Are concise (150-250 words)
6. Feel personal, not templated

Email Structure:
- Subject: Clear, specific, not salesy (40-50 characters)
- Opening: Personalized reference to last interaction
- Value: What's in it for them? New info or clear benefit
- CTA: Specific ask with easy action (meeting link, question, etc.)
- Closing: Professional but warm

Best Practices:
- Use recipient's name naturally (not just "Hi {name}")
- Reference specific details from context
- Avoid generic phrases like "just checking in"
- One clear CTA per email
- Suggest specific time/date for meetings
- Keep paragraphs short (2-3 sentences)
- End with their name, not "Best regards" alone

Tone Guidelines:
- Professional: More formal, focus on ROI
- Friendly: Casual but respectful
- Warm: Personal touch, relationship-building
- Urgent: Time-sensitive but not pushy

Output Format: JSON with subject, body, send_time_suggestion, follow_up_plan`,
    
    features: [
      '✅ Context-aware personalization',
      '✅ High response rate optimization',
      '✅ Multiple tone options',
      '✅ Auto-scheduling suggestions',
      '✅ Follow-up sequence planning',
      '✅ A/B testing variants',
      '✅ CRM integration ready'
    ],
    
    requirements: [
      'Recipient name (required)',
      'Recipient email (required)',
      'Context of previous interaction (required)',
      'Goal of email (required)',
      'Tone preference (optional)'
    ]
  },
  
  {
    id: 'social-media-manager',
    name: 'Social Media Manager Agent',
    tagline: 'Tạo posts cho 5 platforms trong 1 phút',
    description: 'AI Agent tạo content cho Facebook, LinkedIn, Twitter, Instagram và TikTok từ 1 brief duy nhất. Tự động optimize cho từng platform với hashtags và best posting time.',
    icon: '📱',
    category: 'marketing',
    
    pricing: {
      model: 'pay-per-use',
      price: 0.1,
      unit: 'per batch (5 posts)',
      free_trial_runs: 10,
    },
    
    metrics: {
      avg_execution_time: '45-60s',
      success_rate: 95.4,
      total_runs: 6780,
      user_count: 389,
    },
    
    rating: {
      score: 4.7,
      count: 267,
    },
    
    use_cases: [
      'Cross-platform content creation',
      'Product launch announcements',
      'Event promotion',
      'Blog post distribution',
      'Engagement content creation'
    ],
    
    input_example: {
      label: 'Content Brief',
      value: `{
  "topic": "Launch of new AI automation feature",
  "key_message": "Save 10 hours/week with workflow automation",
  "target_audience": "Small business owners",
  "cta": "Try free for 30 days",
  "link": "https://yourapp.com/automation",
  "brand_voice": "professional but approachable"
}`
    },
    
    output_example: {
      label: 'Multi-Platform Posts',
      value: `{
  "linkedin": {
    "text": "🚀 Excited to announce our new Workflow Automation feature!\\n\\nSmall business owners are saving 10+ hours/week...\\n\\n📊 Key benefits:\\n• Visual workflow builder\\n• 100+ integrations\\n• No coding required\\n\\nTry it free → [link]",
    "hashtags": ["#automation", "#productivity", "#smallbusiness"],
    "best_time": "Tuesday 10 AM"
  },
  "facebook": "...",
  "twitter": "...",
  "instagram": "...",
  "tiktok": "..."
}`
    },
    
    config: {
      model: 'gpt-4o-mini',
      temperature: 0.8,
      max_tokens: 2000,
    },
    
    system_prompt: `You are a social media marketing expert who knows how to create engaging content for each platform.

Your task is to create optimized posts for 5 platforms from one brief:

LinkedIn (Professional):
- Longer form (150-200 words)
- Professional tone
- Industry insights
- Hashtags: 3-5 relevant ones
- Best for: B2B, thought leadership

Facebook (Community):
- Conversational (100-150 words)
- Questions to drive engagement
- Visual/emotive
- Best for: Community building, events

Twitter/X (Brief):
- Concise (200-250 characters)
- Thread-worthy format
- Trending hashtags
- Best for: Quick updates, news

Instagram (Visual):
- Caption-focused (100-125 words)
- Emoji-rich
- Story-friendly
- Hashtags: 10-15
- Best for: Visual storytelling, lifestyle

TikTok (Short Video Script):
- Hook in first 3 seconds
- Script for 15-60s video
- Trending audio suggestions
- Best for: Quick tips, behind-scenes

Each post should:
1. Match platform's best practices
2. Have clear CTA
3. Use platform-specific features
4. Suggest best posting time
5. Include engagement tactics

Output Format: JSON with posts for each platform, hashtags, posting times, engagement tips`,
    
    features: [
      '✅ 5 platform-optimized posts',
      '✅ Smart hashtag suggestions',
      '✅ Best posting time recommendations',
      '✅ Engagement optimization',
      '✅ Brand voice consistency',
      '✅ CTA integration',
      '✅ Character count optimization'
    ],
    
    requirements: [
      'Topic or message (required)',
      'Target audience (optional)',
      'Call-to-action (optional)',
      'Link to share (optional)',
      'Brand voice description (optional)'
    ]
  },
  
  {
    id: 'data-analyzer',
    name: 'Data Analyzer Agent',
    tagline: 'Phân tích data và tạo insights report trong 3 phút',
    description: 'AI Agent phân tích spreadsheets, tìm patterns, detect anomalies và tạo executive summary với visualizations. Transform raw data thành actionable insights.',
    icon: '📊',
    category: 'data',
    
    pricing: {
      model: 'pay-per-use',
      price: 0.2,
      unit: 'per report',
      free_trial_runs: 5,
    },
    
    metrics: {
      avg_execution_time: '120-180s',
      success_rate: 94.6,
      total_runs: 4320,
      user_count: 178,
    },
    
    rating: {
      score: 4.8,
      count: 134,
    },
    
    use_cases: [
      'Sales performance analysis',
      'Marketing campaign ROI',
      'Customer behavior insights',
      'Financial trend analysis',
      'Operational efficiency reports'
    ],
    
    input_example: {
      label: 'Dataset & Questions',
      value: `{
  "data_source": "sales_data.csv",
  "columns": ["date", "product", "revenue", "customer_segment", "region"],
  "questions": [
    "Which products are performing best?",
    "Are there seasonal trends?",
    "Which customer segments are most profitable?"
  ],
  "report_type": "executive_summary"
}`
    },
    
    output_example: {
      label: 'Insights Report',
      value: `{
  "executive_summary": "Key findings from 6 months of sales data...",
  "key_insights": [
    "Product A drove 45% of revenue with only 23% of transactions",
    "Q4 shows 67% increase vs Q1 - clear seasonal pattern",
    "Enterprise segment has 3x higher LTV than SMB"
  ],
  "trends": "Revenue growing 12% MoM, customer acquisition slowing",
  "anomalies": "Unexpected spike in May - investigation needed",
  "recommendations": [
    "Focus marketing on Product A",
    "Prepare inventory for Q4 surge",
    "Develop Enterprise-specific offers"
  ],
  "visualizations": ["revenue_trend.png", "product_mix.png", "segment_comparison.png"]
}`
    },
    
    config: {
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2500,
    },
    
    system_prompt: `You are a senior data analyst with expertise in business intelligence and statistical analysis.

Your task is to analyze datasets and create actionable insights reports:

Analysis Process:
1. Data Overview: Size, columns, data types, completeness
2. Descriptive Statistics: Mean, median, distribution, outliers
3. Trend Analysis: Growth rates, patterns, seasonality
4. Correlation Analysis: Relationships between variables
5. Anomaly Detection: Unusual patterns or outliers
6. Segmentation: Group analysis, cohorts
7. Predictive Insights: Forecast trends

Report Structure:
1. Executive Summary (2-3 paragraphs)
   - Most important findings
   - Bottom-line impact
   - Urgent actions needed

2. Key Insights (5-7 bullet points)
   - Data-backed observations
   - % changes, comparisons
   - "So what?" for each insight

3. Trends & Patterns
   - Time-based analysis
   - Growth rates
   - Seasonal patterns

4. Anomalies & Concerns
   - Unexpected data points
   - Potential issues
   - Areas needing attention

5. Actionable Recommendations
   - Specific next steps
   - Priority ranking
   - Expected impact

6. Visualizations Needed
   - Suggest chart types
   - Key metrics to visualize

Best Practices:
- Focus on "So what?" not just "What?"
- Use percentages and comparisons
- Highlight actionable insights
- Flag data quality issues
- Suggest additional analysis if needed

Output Format: JSON with structured report, insights array, recommendations, viz suggestions`,
    
    features: [
      '✅ Automated insights extraction',
      '✅ Trend detection',
      '✅ Anomaly identification',
      '✅ Executive summary generation',
      '✅ Visualization recommendations',
      '✅ Actionable recommendations',
      '✅ Multi-format export'
    ],
    
    requirements: [
      'Dataset (CSV/Excel) (required)',
      'Analysis questions (optional)',
      'Report type preference (optional)',
      'Focus areas (optional)'
    ]
  }
];

/**
 * Get agent by ID
 */
export const getMVPAgentById = (id: string): MVPAgent | undefined => {
  return MVP_AGENTS.find(agent => agent.id === id);
};

/**
 * Get agents by category
 */
export const getMVPAgentsByCategory = (category: string): MVPAgent[] => {
  if (category === 'all') return MVP_AGENTS;
  return MVP_AGENTS.filter(agent => agent.category === category);
};

/**
 * Calculate total cost for number of runs
 */
export const calculateAgentCost = (agentId: string, runs: number): number => {
  const agent = getMVPAgentById(agentId);
  if (!agent) return 0;
  
  const freeRuns = agent.pricing.free_trial_runs;
  const paidRuns = Math.max(0, runs - freeRuns);
  
  return paidRuns * agent.pricing.price;
};

/**
 * Get featured agents (highest rated)
 */
export const getFeaturedAgents = (limit: number = 3): MVPAgent[] => {
  return [...MVP_AGENTS]
    .sort((a, b) => b.rating.score - a.rating.score)
    .slice(0, limit);
};
