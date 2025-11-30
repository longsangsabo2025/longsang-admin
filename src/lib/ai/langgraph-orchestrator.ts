/**
 * Multi-Agent Orchestration using LangGraph
 * State-based workflow management for AI agents
 */

import { StateGraph, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { logger } from '@/lib/utils/logger';
import { VectorStore } from './vector-store';

// Agent State Interface
export interface AgentState {
  messages: Array<HumanMessage | AIMessage | SystemMessage>;
  task: string;
  current_step: string;
  completed_steps: string[];
  context: Record<string, unknown>;
  output?: string;
  error?: string;
}

// Agent Configuration
export interface AgentConfig {
  name: string;
  model?: string;
  temperature?: number;
  systemPrompt: string;
}

/**
 * Content Generation Agent
 */
async function contentGeneratorAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Content Generator Agent executing', { task: state.task });

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.8,
  });

  try {
    // Retrieve relevant context using RAG
    const context = await VectorStore.semanticSearch(state.task, { limit: 3 });
    const contextText = context.map((doc) => doc.content).join('\n\n');

    const response = await llm.invoke([
      new SystemMessage(
        'You are a professional content writer. Create engaging, SEO-optimized content based on the given topic.'
      ),
      new HumanMessage(`Context:\n${contextText}\n\nTask: ${state.task}\n\nCreate comprehensive content.`),
    ]);

    return {
      messages: [...state.messages, response],
      output: response.content.toString(),
      current_step: 'content_generated',
      completed_steps: [...state.completed_steps, 'content_generation'],
      context: {
        ...state.context,
        generated_content: response.content,
        word_count: response.content.toString().split(' ').length,
      },
    };
  } catch (error) {
    logger.error('Content generation failed', error);
    return {
      error: error instanceof Error ? error.message : 'Content generation failed',
      current_step: 'error',
    };
  }
}

/**
 * Content Review Agent
 */
async function contentReviewAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Content Review Agent executing');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.3,
  });

  try {
    const content = state.output || '';

    const response = await llm.invoke([
      new SystemMessage(
        'You are a senior content reviewer. Review content for quality, accuracy, tone, and SEO. Provide a score (1-10) and suggestions.'
      ),
      new HumanMessage(`Review this content:\n\n${content}\n\nProvide detailed feedback in JSON format: {"score": X, "feedback": "...", "suggestions": [...]}`),
    ]);

    const reviewText = response.content.toString();
    let review: { score: number; feedback: string; suggestions: string[] };

    try {
      review = JSON.parse(reviewText);
    } catch {
      review = {
        score: 7,
        feedback: reviewText,
        suggestions: ['Review completed'],
      };
    }

    return {
      messages: [...state.messages, response],
      current_step: review.score >= 8 ? 'review_passed' : 'review_failed',
      completed_steps: [...state.completed_steps, 'content_review'],
      context: {
        ...state.context,
        review,
      },
    };
  } catch (error) {
    logger.error('Content review failed', error);
    return {
      error: error instanceof Error ? error.message : 'Review failed',
      current_step: 'error',
    };
  }
}

/**
 * SEO Optimization Agent
 */
async function seoOptimizationAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('SEO Optimization Agent executing');

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.4,
  });

  try {
    const content = state.output || '';

    const response = await llm.invoke([
      new SystemMessage(
        'You are an SEO expert. Optimize content for search engines: add meta tags, improve headings, suggest keywords, create meta description.'
      ),
      new HumanMessage(
        `Optimize this content for SEO:\n\n${content}\n\nProvide: {"optimized_content": "...", "meta_title": "...", "meta_description": "...", "keywords": [...]}`
      ),
    ]);

    const seoText = response.content.toString();
    let seo: {
      optimized_content: string;
      meta_title: string;
      meta_description: string;
      keywords: string[];
    };

    try {
      seo = JSON.parse(seoText);
    } catch {
      seo = {
        optimized_content: content,
        meta_title: state.task,
        meta_description: content.substring(0, 160),
        keywords: [],
      };
    }

    return {
      messages: [...state.messages, response],
      output: seo.optimized_content,
      current_step: 'seo_optimized',
      completed_steps: [...state.completed_steps, 'seo_optimization'],
      context: {
        ...state.context,
        seo,
      },
    };
  } catch (error) {
    logger.error('SEO optimization failed', error);
    return {
      error: error instanceof Error ? error.message : 'SEO optimization failed',
      current_step: 'error',
    };
  }
}

/**
 * Publishing Agent
 */
async function publishingAgent(state: AgentState): Promise<Partial<AgentState>> {
  logger.info('Publishing Agent executing');

  try {
    // Simulate publishing (replace with actual API call)
    const publishedUrl = `https://example.com/posts/${Date.now()}`;

    return {
      current_step: 'published',
      completed_steps: [...state.completed_steps, 'publishing'],
      context: {
        ...state.context,
        published_url: publishedUrl,
        published_at: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error('Publishing failed', error);
    return {
      error: error instanceof Error ? error.message : 'Publishing failed',
      current_step: 'error',
    };
  }
}

/**
 * Router: Decide next agent based on current state
 */
function routeAgent(state: AgentState): string {
  const step = state.current_step;

  if (state.error) {
    return END;
  }

  switch (step) {
    case 'start':
      return 'content_generator';
    case 'content_generated':
      return 'content_reviewer';
    case 'review_passed':
      return 'seo_optimizer';
    case 'review_failed':
      // Loop back to content generator for improvement
      return state.completed_steps.filter((s) => s === 'content_generation').length >= 2
        ? 'seo_optimizer' // Max 2 retries
        : 'content_generator';
    case 'seo_optimized':
      return 'publisher';
    case 'published':
      return END;
    default:
      return END;
  }
}

/**
 * Build Content Production Workflow
 */
export function buildContentWorkflow() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: AgentState['messages'], y: AgentState['messages']) => x.concat(y),
        default: () => [],
      },
      task: {
        value: (x?: string, y?: string) => y ?? x ?? '',
        default: () => '',
      },
      current_step: {
        value: (x?: string, y?: string) => y ?? x ?? 'start',
        default: () => 'start',
      },
      completed_steps: {
        value: (x: string[], y: string[]) => [...x, ...y],
        default: () => [],
      },
      context: {
        value: (x: Record<string, unknown>, y: Record<string, unknown>) => ({ ...x, ...y }),
        default: () => ({}),
      },
      output: {
        value: (x?: string, y?: string) => y ?? x,
      },
      error: {
        value: (x?: string, y?: string) => y ?? x,
      },
    },
  });

  // Add agent nodes
  workflow.addNode('content_generator', contentGeneratorAgent);
  workflow.addNode('content_reviewer', contentReviewAgent);
  workflow.addNode('seo_optimizer', seoOptimizationAgent);
  workflow.addNode('publisher', publishingAgent);

  // Add conditional edges (routing logic)
  workflow.addConditionalEdges('content_generator', routeAgent);
  workflow.addConditionalEdges('content_reviewer', routeAgent);
  workflow.addConditionalEdges('seo_optimizer', routeAgent);
  workflow.addConditionalEdges('publisher', routeAgent);

  // Set entry point
  workflow.setEntryPoint('content_generator');

  return workflow.compile();
}

/**
 * Execute Content Production Workflow
 */
export async function executeContentWorkflow(task: string): Promise<{
  success: boolean;
  output?: string;
  context: Record<string, unknown>;
  steps: string[];
  error?: string;
}> {
  logger.info('Starting content workflow', { task });

  const workflow = buildContentWorkflow();

  const initialState: AgentState = {
    messages: [],
    task,
    current_step: 'start',
    completed_steps: [],
    context: {},
  };

  try {
    const result = await workflow.invoke(initialState);

    return {
      success: !result.error,
      output: result.output,
      context: result.context,
      steps: result.completed_steps,
      error: result.error,
    };
  } catch (error) {
    logger.error('Workflow execution failed', error);
    return {
      success: false,
      context: {},
      steps: [],
      error: error instanceof Error ? error.message : 'Workflow failed',
    };
  }
}

/**
 * Build Marketing Campaign Workflow
 */
export function buildMarketingWorkflow() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      messages: {
        value: (x: AgentState['messages'], y: AgentState['messages']) => x.concat(y),
        default: () => [],
      },
      task: {
        value: (x?: string, y?: string) => y ?? x ?? '',
        default: () => '',
      },
      current_step: {
        value: (x?: string, y?: string) => y ?? x ?? 'start',
        default: () => 'start',
      },
      completed_steps: {
        value: (x: string[], y: string[]) => [...x, ...y],
        default: () => [],
      },
      context: {
        value: (x: Record<string, unknown>, y: Record<string, unknown>) => ({ ...x, ...y }),
        default: () => ({}),
      },
      output: {
        value: (x?: string, y?: string) => y ?? x,
      },
      error: {
        value: (x?: string, y?: string) => y ?? x,
      },
    },
  });

  // Marketing-specific agents
  async function audienceAnalyzer(state: AgentState): Promise<Partial<AgentState>> {
    logger.info('Audience Analyzer executing');
    // Analyze target audience
    return {
      current_step: 'audience_analyzed',
      completed_steps: [...state.completed_steps, 'audience_analysis'],
      context: {
        ...state.context,
        target_audience: {
          demographics: 'Business professionals, 25-45',
          interests: ['automation', 'AI', 'productivity'],
          platforms: ['LinkedIn', 'Twitter'],
        },
      },
    };
  }

  async function campaignPlanner(state: AgentState): Promise<Partial<AgentState>> {
    logger.info('Campaign Planner executing');
    // Plan marketing campaign
    return {
      current_step: 'campaign_planned',
      completed_steps: [...state.completed_steps, 'campaign_planning'],
      context: {
        ...state.context,
        campaign: {
          name: state.task,
          duration: '7 days',
          budget: 1000,
          channels: ['social', 'email'],
        },
      },
    };
  }

  workflow.addNode('audience_analyzer', audienceAnalyzer);
  workflow.addNode('campaign_planner', campaignPlanner);
  workflow.addNode('content_generator', contentGeneratorAgent);
  workflow.addNode('publisher', publishingAgent);

  // Marketing workflow routing
  workflow.addConditionalEdges('audience_analyzer', (state: AgentState) => {
    return state.current_step === 'audience_analyzed' ? 'campaign_planner' : END;
  });
  workflow.addConditionalEdges('campaign_planner', (state: AgentState) => {
    return state.current_step === 'campaign_planned' ? 'content_generator' : END;
  });
  workflow.addConditionalEdges('content_generator', (state: AgentState) => {
    return state.current_step === 'content_generated' ? 'publisher' : END;
  });
  workflow.addConditionalEdges('publisher', () => END);

  workflow.setEntryPoint('audience_analyzer');

  return workflow.compile();
}

/**
 * Stream workflow execution with real-time updates
 */
export async function* streamWorkflowExecution(task: string): AsyncGenerator<{
  step: string;
  status: 'running' | 'completed' | 'error';
  data?: unknown;
  error?: string;
}> {
  const workflow = buildContentWorkflow();

  const initialState: AgentState = {
    messages: [],
    task,
    current_step: 'start',
    completed_steps: [],
    context: {},
  };

  try {
    for await (const step of workflow.stream(initialState)) {
      const [nodeName, nodeState] = Object.entries(step)[0];

      yield {
        step: nodeName,
        status: nodeState.error ? 'error' : 'completed',
        data: nodeState,
        error: nodeState.error,
      };
    }
  } catch (error) {
    yield {
      step: 'workflow',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
