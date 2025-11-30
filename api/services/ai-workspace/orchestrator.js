/**
 * LangGraph.js Multi-Agent Orchestrator
 * Supervisor Agent + 6 Specialized Agents + Aggregator
 */

const { StateGraph, END } = require('@langchain/langgraph');
const { ChatOpenAI } = require('@langchain/openai');
const { ChatAnthropic } = require('@langchain/anthropic');
const { HumanMessage, SystemMessage } = require('@langchain/core/messages');
const assistants = require('./assistants');
const { getAPIKeys } = require('./env-loader');

const keys = getAPIKeys();

// State interface
class WorkspaceState {
  constructor() {
    this.messages = [];
    this.userQuery = '';
    this.userId = '';
    this.intent = null;
    this.selectedAgents = [];
    this.context = null;
    this.agentResponses = {};
    this.finalResponse = null;
    this.error = null;
  }
}

/**
 * Supervisor Node - Classify intent and route to agents
 */
async function supervisorNode(state) {
  try {
    const llm = keys.openai
      ? new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0,
          openAIApiKey: keys.openai,
        })
      : new ChatAnthropic({
          modelName: 'claude-3-5-haiku-20241022',
          temperature: 0,
          anthropicApiKey: keys.anthropic,
        });

    const classificationPrompt = `
Bạn là AI Supervisor. Phân loại intent của user và chọn agent(s) phù hợp.

User query: "${state.userQuery}"

Available agents:
- course: Phát triển khóa học, curriculum, bài giảng
- financial: Tài chính cá nhân, ngân sách, phân tích chi tiêu
- research: Nghiên cứu, tìm kiếm thông tin, tổng hợp
- news: Tin tức, xu hướng, cập nhật ngành
- career: Phát triển sự nghiệp, skills, networking
- daily: Lập kế hoạch ngày, task management, calendar
- multi: Cần nhiều agent phối hợp (complex task)

Respond in JSON format:
{
  "intent": "brief description of user intent",
  "selectedAgents": ["agent1", "agent2"],
  "reason": "why these agents"
}
`;

    const response = await llm.invoke([
      new SystemMessage(classificationPrompt),
      new HumanMessage(state.userQuery),
    ]);

    try {
      const content = typeof response.content === 'string' ? response.content : response.content[0]?.text || '';
      const result = JSON.parse(content);

      return {
        intent: result.intent,
        selectedAgents: Array.isArray(result.selectedAgents) ? result.selectedAgents : [result.selectedAgents || 'research'],
      };
    } catch {
      // Fallback: simple keyword matching
      const query = state.userQuery.toLowerCase();
      let selectedAgents = [];

      if (query.includes('khóa học') || query.includes('course') || query.includes('curriculum')) {
        selectedAgents.push('course');
      }
      if (query.includes('tài chính') || query.includes('financial') || query.includes('ngân sách')) {
        selectedAgents.push('financial');
      }
      if (query.includes('nghiên cứu') || query.includes('research') || query.includes('tìm hiểu')) {
        selectedAgents.push('research');
      }
      if (query.includes('tin tức') || query.includes('news') || query.includes('xu hướng')) {
        selectedAgents.push('news');
      }
      if (query.includes('sự nghiệp') || query.includes('career') || query.includes('skills')) {
        selectedAgents.push('career');
      }
      if (query.includes('kế hoạch') || query.includes('daily') || query.includes('task') || query.includes('lịch')) {
        selectedAgents.push('daily');
      }

      return {
        intent: 'general',
        selectedAgents: selectedAgents.length > 0 ? selectedAgents : ['research'],
      };
    }
  } catch (error) {
    console.error('[Supervisor] Error:', error);
    return {
      intent: 'general',
      selectedAgents: ['research'],
      error: error.message,
    };
  }
}

/**
 * Router function - Route to appropriate agent(s)
 */
function routeToAgent(state) {
  if (state.error) return 'errorHandler';
  if (!state.selectedAgents || state.selectedAgents.length === 0) return 'errorHandler';

  // If multiple agents, go to multi-agent handler
  if (state.selectedAgents.length > 1) {
    return 'multi';
  }

  const agent = state.selectedAgents[0];
  const validAgents = ['course', 'financial', 'research', 'news', 'career', 'daily'];
  if (validAgents.includes(agent)) {
    return agent;
  }
  return 'research'; // Default
}

/**
 * Agent Nodes - Call individual assistants
 */
async function courseAgentNode(state) {
  try {
    const response = await assistants.courseAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        course: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function financialAgentNode(state) {
  try {
    const response = await assistants.financialAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        financial: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function researchAgentNode(state) {
  try {
    const response = await assistants.researchAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        research: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function newsAgentNode(state) {
  try {
    const response = await assistants.newsAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        news: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function careerAgentNode(state) {
  try {
    const response = await assistants.careerAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        career: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function dailyAgentNode(state) {
  try {
    const response = await assistants.dailyAssistant({
      query: state.userQuery,
      userId: state.userId,
      conversationHistory: state.messages,
      stream: false,
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        daily: { content: response },
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Multi-Agent Node - Call multiple agents in parallel
 */
async function multiAgentNode(state) {
  try {
    const promises = state.selectedAgents.map(async (agentType) => {
      const agentMap = {
        course: assistants.courseAssistant,
        financial: assistants.financialAssistant,
        research: assistants.researchAssistant,
        news: assistants.newsAssistant,
        career: assistants.careerAssistant,
        daily: assistants.dailyAssistant,
      };

      const handler = agentMap[agentType];
      if (!handler) return null;

      try {
        const response = await handler({
          query: state.userQuery,
          userId: state.userId,
          conversationHistory: state.messages,
          stream: false,
        });

        return { agentType, content: response };
      } catch (error) {
        return { agentType, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const agentResponses = {};

    results.forEach((result) => {
      if (result) {
        agentResponses[result.agentType] = {
          content: result.content || `Error: ${result.error}`,
        };
      }
    });

    return {
      agentResponses: {
        ...state.agentResponses,
        ...agentResponses,
      },
    };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * Aggregator Node - Synthesize responses from multiple agents
 */
async function aggregatorNode(state) {
  const responses = state.agentResponses;
  const agentCount = Object.keys(responses).length;

  // Single agent - return directly
  if (agentCount === 1) {
    const [agentName, response] = Object.entries(responses)[0];
    return {
      finalResponse: response.content,
    };
  }

  // Multiple agents - synthesize
  try {
    const llm = keys.anthropic
      ? new ChatAnthropic({
          modelName: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          anthropicApiKey: keys.anthropic,
        })
      : new ChatOpenAI({
          modelName: 'gpt-4o-mini',
          temperature: 0.7,
          openAIApiKey: keys.openai,
        });

    const synthesisPrompt = `
Bạn là AI Aggregator. Tổng hợp responses từ nhiều agents thành một câu trả lời thống nhất.

User query: "${state.userQuery}"

Agent responses:
${Object.entries(responses).map(([agent, resp]) => `
### ${agent.toUpperCase()} Agent:
${resp.content}
`).join('\n')}

## Yêu cầu:
1. Tổng hợp thông tin không trùng lặp
2. Highlight điểm chính từ mỗi agent
3. Tạo action items nếu phù hợp
4. Giữ tone nhất quán
5. Ngôn ngữ: Tiếng Việt
`;

    const response = await llm.invoke([
      new SystemMessage(synthesisPrompt),
    ]);

    const content = typeof response.content === 'string'
      ? response.content
      : response.content[0]?.text || '';

    return {
      finalResponse: content,
    };
  } catch (error) {
    console.error('[Aggregator] Error:', error);
    // Fallback: concatenate responses
    const combined = Object.entries(responses)
      .map(([agent, resp]) => `### ${agent.toUpperCase()}:\n${resp.content}`)
      .join('\n\n');

    return {
      finalResponse: combined,
    };
  }
}

/**
 * Error Node
 */
function errorNode(state) {
  return {
    finalResponse: `❌ Lỗi: ${state.error || 'Unknown error'}`,
  };
}

/**
 * Create Orchestrator Graph
 */
function createOrchestratorGraph() {
  const graph = new StateGraph({
    channels: {
      messages: { reducer: (a, b) => [...a, ...b], default: () => [] },
      userQuery: { reducer: (a, b) => b || a, default: () => '' },
      userId: { reducer: (a, b) => b || a, default: () => '' },
      intent: { reducer: (a, b) => b || a, default: () => null },
      selectedAgents: { reducer: (a, b) => b || a, default: () => [] },
      context: { reducer: (a, b) => b || a, default: () => null },
      agentResponses: { reducer: (a, b) => ({ ...a, ...b }), default: () => ({}) },
      finalResponse: { reducer: (a, b) => b || a, default: () => null },
      error: { reducer: (a, b) => b || a, default: () => null },
    },
  });

  // Add nodes
  graph.addNode('supervisor', supervisorNode);
  graph.addNode('course', courseAgentNode);
  graph.addNode('financial', financialAgentNode);
  graph.addNode('research', researchAgentNode);
  graph.addNode('news', newsAgentNode);
  graph.addNode('career', careerAgentNode);
  graph.addNode('daily', dailyAgentNode);
  graph.addNode('multi', multiAgentNode);
  graph.addNode('aggregator', aggregatorNode);
  graph.addNode('errorHandler', errorNode);

  // Add edges
  graph.setEntryPoint('supervisor');
  graph.addConditionalEdges('supervisor', routeToAgent);

  // All agents go to aggregator
  ['course', 'financial', 'research', 'news', 'career', 'daily', 'multi'].forEach(agent => {
    graph.addEdge(agent, 'aggregator');
  });

  graph.addEdge('aggregator', END);
  graph.addEdge('errorHandler', END);

  return graph.compile();
}

/**
 * Execute orchestrator
 */
async function executeOrchestrator({ userQuery, userId, conversationHistory = [] }) {
  try {
    const graph = createOrchestratorGraph();

    const initialState = {
      messages: conversationHistory,
      userQuery,
      userId,
      agentResponses: {},
    };

    const result = await graph.invoke(initialState);

    return {
      success: true,
      response: result.finalResponse,
      intent: result.intent,
      selectedAgents: result.selectedAgents,
      agentResponses: result.agentResponses,
    };
  } catch (error) {
    console.error('[Orchestrator] Error:', error);
    return {
      success: false,
      error: error.message,
      response: `❌ Lỗi: ${error.message}`,
    };
  }
}

module.exports = {
  createOrchestratorGraph,
  executeOrchestrator,
};

