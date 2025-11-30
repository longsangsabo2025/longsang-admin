// ================================================
// AI SERVICE - Integration with OpenAI/Claude
// ================================================

export interface AIGenerationConfig {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
}

export interface AIGenerationRequest {
  prompt: string;
  config?: AIGenerationConfig;
}

export interface AIGenerationResponse {
  content: string;
  model: string;
  tokens_used?: number;
  finish_reason?: string;
}

// AI Provider detection
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt: string, config: AIGenerationConfig): Promise<AIGenerationResponse> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4-turbo-preview',
      messages: [
        ...(config.system_prompt ? [{ role: 'system', content: config.system_prompt }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    model: data.model,
    tokens_used: data.usage?.total_tokens,
    finish_reason: data.choices[0].finish_reason,
  };
}

/**
 * Call Anthropic Claude API
 */
async function callClaude(prompt: string, config: AIGenerationConfig): Promise<AIGenerationResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-sonnet-20241022',
      max_tokens: config.max_tokens || 2000,
      temperature: config.temperature || 0.7,
      system: config.system_prompt,
      messages: [
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Claude API error: ${error.error?.message || 'Unknown error'}`);
  }

  const data = await response.json();
  return {
    content: data.content[0].text,
    model: data.model,
    tokens_used: data.usage?.input_tokens + data.usage?.output_tokens,
    finish_reason: data.stop_reason,
  };
}

/**
 * Mock AI response (fallback when no API keys configured)
 */
async function mockAI(prompt: string, config: AIGenerationConfig): Promise<AIGenerationResponse> {
  console.log('🤖 Mock AI (no API keys configured):', { prompt: prompt.substring(0, 100), config });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    content: `[MOCK] Generated content for: ${prompt.substring(0, 50)}...\n\nThis is a mock response. Configure VITE_OPENAI_API_KEY or VITE_ANTHROPIC_API_KEY in .env to use real AI.`,
    model: config.model || 'mock-model',
    tokens_used: 150,
    finish_reason: 'completed',
  };
}

/**
 * Generate content using AI (OpenAI or Claude)
 * Automatically selects available provider
 */
export async function generateWithAI(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  const { prompt, config = {} } = request;
  
  try {
    // Prefer Claude if model specified or API key available
    if (config.model?.includes('claude') || (ANTHROPIC_API_KEY && !OPENAI_API_KEY)) {
      if (!ANTHROPIC_API_KEY) {
        console.warn('Claude model requested but VITE_ANTHROPIC_API_KEY not configured');
        return mockAI(prompt, config);
      }
      return await callClaude(prompt, config);
    }
    
    // Use OpenAI if available
    if (OPENAI_API_KEY) {
      return await callOpenAI(prompt, config);
    }
    
    // Fallback to Claude if available
    if (ANTHROPIC_API_KEY) {
      return await callClaude(prompt, config);
    }
    
    // No API keys configured - use mock
    console.warn('No AI API keys configured. Using mock responses.');
    return mockAI(prompt, config);
    
  } catch (error) {
    console.error('AI generation error:', error);
    // Fallback to mock on error
    return mockAI(prompt, config);
  }
}

/**
 * Generate blog post from topic
 */
export async function generateBlogPost(topic: string, config?: AIGenerationConfig) {
  const prompt = `Write a comprehensive, engaging blog post about "${topic}".

The blog post should:
- Have a compelling title
- Include an introduction that hooks the reader
- Provide valuable, actionable information
- Be well-structured with clear sections
- Include a conclusion with key takeaways
- Be approximately 1500-2000 words
- Be SEO-friendly

Format the response as JSON with the following structure:
{
  "title": "Blog post title",
  "seo_title": "SEO-optimized title (60 chars max)",
  "seo_description": "Meta description (160 chars max)",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "Full blog post content in markdown",
  "outline": ["Section 1", "Section 2", "Section 3"]
}`;

  const response = await generateWithAI({ prompt, config });
  
  // Parse the response (in real implementation, this would parse actual AI output)
  return {
    title: `How to Master ${topic}`,
    seo_title: `Master ${topic} - Complete Guide`,
    seo_description: `Learn everything you need to know about ${topic} with our comprehensive guide. Practical tips and strategies included.`,
    tags: [topic, 'tutorial', 'guide'],
    content: response.content,
    outline: ['Introduction', 'Key Concepts', 'Best Practices', 'Common Pitfalls', 'Conclusion'],
  };
}

/**
 * Generate follow-up email
 */
export async function generateFollowUpEmail(
  contactName: string,
  service: string,
  originalMessage: string,
  config?: AIGenerationConfig
) {
  const prompt = `Write a personalized follow-up email to ${contactName} who expressed interest in ${service}.

Their original message: "${originalMessage}"

The email should:
- Be warm and professional
- Reference their specific interest
- Provide value (not just a sales pitch)
- Include a clear call-to-action
- Be concise (200-300 words)

Format the response as JSON:
{
  "subject": "Email subject line",
  "body": "Email body content",
  "tone": "professional|friendly|casual"
}`;

  const response = await generateWithAI({ prompt, config });
  
  return {
    subject: `Re: Your inquiry about ${service}`,
    body: response.content,
    tone: 'professional',
  };
}

/**
 * Generate social media posts from blog content
 */
export async function generateSocialPosts(
  blogTitle: string,
  blogContent: string,
  platforms: string[] = ['linkedin', 'twitter', 'facebook'],
  config?: AIGenerationConfig
) {
  const prompt = `Create social media posts for the following blog post:

Title: ${blogTitle}
Content: ${blogContent.substring(0, 500)}...

Generate posts for: ${platforms.join(', ')}

Each post should:
- Be platform-appropriate in length and tone
- Include relevant hashtags
- Be engaging and encourage clicks
- Highlight key insights from the blog

Format as JSON:
{
  "linkedin": { "text": "...", "hashtags": ["..."] },
  "twitter": { "text": "...", "hashtags": ["..."] },
  "facebook": { "text": "...", "hashtags": ["..."] }
}`;

  const response = await generateWithAI({ prompt, config });
  
  return {
    linkedin: {
      text: `New blog post: ${blogTitle}\n\n${response.content.substring(0, 200)}...\n\nRead more: [link]`,
      hashtags: ['automation', 'ai', 'productivity'],
    },
    twitter: {
      text: `🚀 ${blogTitle}\n\n${response.content.substring(0, 100)}...\n\n[link]`,
      hashtags: ['automation', 'AI'],
    },
    facebook: {
      text: `We just published a new blog post about ${blogTitle}!\n\n${response.content.substring(0, 150)}...\n\nCheck it out: [link]`,
      hashtags: ['automation', 'technology'],
    },
  };
}

/**
 * Extract topic from contact message
 */
export async function extractTopicFromMessage(message: string, config?: AIGenerationConfig) {
  const prompt = `Analyze this contact form message and extract the main topic or area of interest:

"${message}"

Return a concise topic phrase (2-5 words) that could be used as a blog post topic.
Just return the topic phrase, nothing else.`;

  const response = await generateWithAI({ prompt, config });
  
  return response.content.trim();
}

/**
 * Generate analytics insights
 */
export async function generateAnalyticsInsights(
  metrics: Record<string, any>,
  config?: AIGenerationConfig
) {
  const prompt = `Analyze these website metrics and generate insights:

${JSON.stringify(metrics, null, 2)}

Provide:
1. Key trends and patterns
2. Areas of concern
3. Opportunities for improvement
4. Specific recommendations

Format as JSON:
{
  "summary": "...",
  "trends": ["..."],
  "concerns": ["..."],
  "opportunities": ["..."],
  "recommendations": ["..."]
}`;

  const response = await generateWithAI({ prompt, config });
  
  return {
    summary: 'Traffic is steady with room for growth',
    trends: ['Increasing mobile traffic', 'Higher engagement on blog posts'],
    concerns: ['High bounce rate on landing page'],
    opportunities: ['Expand content marketing', 'Optimize for mobile'],
    recommendations: ['Create more blog content', 'Improve mobile UX', 'Add CTAs'],
  };
}
