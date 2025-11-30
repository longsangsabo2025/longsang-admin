/**
 * AI Assistant API Endpoint
 * Handles chat requests for Academy lessons using OpenAI GPT-4
 */

import { Request, Response } from 'express';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIAssistantRequest {
  lessonId: string;
  lessonTitle: string;
  lessonContext?: string;
  messages: ChatMessage[];
  userMessage: string;
}

export async function handleAIAssistant(req: Request, res: Response) {
  try {
    const {
      lessonId,
      lessonTitle,
      lessonContext = '',
      messages = [],
      userMessage
    }: AIAssistantRequest = req.body;

    // Validate input
    if (!userMessage || userMessage.trim().length === 0) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    if (!lessonId || !lessonTitle) {
      return res.status(400).json({
        error: 'Lesson information is required'
      });
    }

    // Build system prompt with lesson context
    const systemPrompt = `You are an expert AI learning assistant for the Academy course: "${lessonTitle}".

Your role:
- Help students understand concepts from the lesson
- Debug code issues
- Provide practical examples and real-world applications
- Guide students step-by-step without giving away all answers
- Be encouraging and supportive
- Keep responses concise and actionable (max 3-4 paragraphs)

Current Lesson Context:
${lessonContext}

Philosophy: "AI làm việc cho bạn" - Focus on teaching students how to USE AI to solve problems, not just theory.

Guidelines:
1. Use Vietnamese mixed with English technical terms naturally
2. Provide code examples when relevant
3. Link concepts to real business applications
4. Encourage students to try things themselves
5. Celebrate small wins`;

    // Prepare messages for OpenAI
    const openAIMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    // Call OpenAI API
    console.log(`[AI Assistant] Processing request for lesson: ${lessonId}`);
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: openAIMessages,
      max_tokens: 500,
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.3
    });

    const assistantResponse = completion.choices[0]?.message?.content || 
      'Sorry, I couldn\'t generate a response. Please try again.';

    console.log(`[AI Assistant] Response generated (${assistantResponse.length} chars)`);

    // Return response
    return res.status(200).json({
      success: true,
      response: assistantResponse,
      usage: {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }
    });

  } catch (error: any) {
    console.error('[AI Assistant] Error:', error);

    // Handle OpenAI specific errors
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait a moment and try again.'
      });
    }

    if (error.status === 401) {
      return res.status(500).json({
        error: 'OpenAI API key is invalid or missing.'
      });
    }

    // Generic error
    return res.status(500).json({
      error: 'Failed to process your message. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
