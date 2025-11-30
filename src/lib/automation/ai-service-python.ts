// ================================================
// AI SERVICE - Python Backend Integration
// Replaces mock AI with real LangGraph-powered agents
// ================================================

const AI_BACKEND_URL = import.meta.env.VITE_AI_BACKEND_URL || 'http://localhost:8000';

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

/**
 * Call Python AI Backend
 */
async function callPythonBackend(endpoint: string, data: any): Promise<any> {
  const response = await fetch(`${AI_BACKEND_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(`Python AI Backend error: ${error.detail || 'Unknown error'}`);
  }

  return response.json();
}

/**
 * Execute automation agent via Python backend
 */
export async function executeAutomationAgent(
  agentType: 'content_writer' | 'lead_nurture' | 'social_media' | 'analytics',
  task: string,
  context: Record<string, any> = {}
): Promise<any> {
  try {
    const result = await callPythonBackend('/v1/automation/execute', {
      agent_type: agentType,
      task,
      context,
    });

    return result;
  } catch (error) {
    console.error('Automation agent execution error:', error);
    throw error;
  }
}

/**
 * Generate content using AI (general purpose)
 */
export async function generateWithAI(
  request: AIGenerationRequest
): Promise<AIGenerationResponse> {
  try {
    const result = await callPythonBackend('/task', {
      task: request.prompt,
      metadata: request.config,
    });

    return {
      content: result.response || '',
      model: 'python-backend',
      tokens_used: 0,
      finish_reason: 'completed',
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}

/**
 * Generate blog post from topic
 */
export async function generateBlogPost(
  topic: string,
  config?: {
    contact_id?: string;
    keywords?: string[];
    tone?: string;
  }
) {
  try {
    const result = await callPythonBackend('/v1/automation/generate/blog', {
      topic,
      contact_id: config?.contact_id,
      keywords: config?.keywords || [],
      tone: config?.tone || 'professional',
    });

    if (!result.success) {
      throw new Error('Blog generation failed');
    }

    return result.blog_post;
  } catch (error) {
    console.error('Blog generation error:', error);
    throw error;
  }
}

/**
 * Generate follow-up email
 */
export async function generateFollowUpEmail(
  contactName: string,
  contactEmail: string,
  serviceInterest: string,
  originalMessage: string,
  followUpNumber: number = 1
) {
  try {
    const result = await callPythonBackend('/v1/automation/generate/email', {
      contact_name: contactName,
      contact_email: contactEmail,
      service_interest: serviceInterest,
      original_message: originalMessage,
      follow_up_number: followUpNumber,
    });

    if (!result.success) {
      throw new Error('Email generation failed');
    }

    return result.email;
  } catch (error) {
    console.error('Email generation error:', error);
    throw error;
  }
}

/**
 * Generate social media posts from blog content
 */
export async function generateSocialPosts(
  blogTitle: string,
  blogContent: string,
  blogUrl: string,
  platforms: string[] = ['linkedin', 'twitter', 'facebook']
) {
  try {
    const result = await callPythonBackend('/v1/automation/generate/social', {
      blog_title: blogTitle,
      blog_content: blogContent,
      blog_url: blogUrl,
      platforms,
    });

    if (!result.success) {
      throw new Error('Social posts generation failed');
    }

    return result.posts;
  } catch (error) {
    console.error('Social posts generation error:', error);
    throw error;
  }
}

/**
 * Generate analytics insights
 */
export async function generateAnalyticsInsights(
  metrics: Record<string, any>,
  timePeriod: string = 'weekly'
) {
  try {
    const result = await callPythonBackend('/v1/automation/generate/insights', {
      metrics,
      time_period: timePeriod,
    });

    if (!result.success) {
      throw new Error('Insights generation failed');
    }

    return result.insights;
  } catch (error) {
    console.error('Insights generation error:', error);
    throw error;
  }
}

/**
 * Extract topic from contact message
 */
export async function extractTopicFromMessage(message: string) {
  try {
    const result = await callPythonBackend('/task', {
      task: `Extract the main topic from this message: "${message}". Return only the topic phrase (2-5 words).`,
    });

    return result.response?.trim() || 'General Inquiry';
  } catch (error) {
    console.error('Topic extraction error:', error);
    return 'General Inquiry';
  }
}

/**
 * Health check for Python backend
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/v1/automation/health`);
    const data = await response.json();
    return data.status === 'healthy';
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Get backend info
 */
export async function getBackendInfo() {
  try {
    const response = await fetch(`${AI_BACKEND_URL}/health`);
    return response.json();
  } catch (error) {
    console.error('Backend info error:', error);
    return null;
  }
}
