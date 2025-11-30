/**
 * AI Chat Hooks
 * React hooks for AI Agent communication
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  chatWithAgent, 
  chatWithOpenAI, 
  chatWithClaude,
  streamChatWithAgent,
  agentActions,
  type AgentChatRequest,
  type AgentChatResponse,
  type ChatMessage,
} from '@/services/ai-chat.service';
import { useMemories } from './use-solo-hub';

interface UseAgentChatOptions {
  agentRole: string;
  includeMemories?: boolean;
  autoSave?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  usage: {
    totalTokens: number;
    totalCost: number; // Estimated in USD
  };
}

// Token pricing (approximate)
const TOKEN_COSTS = {
  'gpt-4o': { input: 0.005 / 1000, output: 0.015 / 1000 },
  'gpt-4o-mini': { input: 0.00015 / 1000, output: 0.0006 / 1000 },
  'claude-3-5-sonnet-20241022': { input: 0.003 / 1000, output: 0.015 / 1000 },
};

/**
 * Hook for chatting with an AI Agent
 */
export function useAgentChat(options: UseAgentChatOptions) {
  const { agentRole, includeMemories = true, autoSave = false } = options;
  const queryClient = useQueryClient();
  
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    usage: { totalTokens: 0, totalCost: 0 },
  });
  
  // Reset chat when agent changes
  useEffect(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      usage: { totalTokens: 0, totalCost: 0 },
    });
  }, [agentRole]);
  
  // Get memories for context if needed
  const { data: memories } = useMemories(
    includeMemories ? { importance: 'high' } : undefined
  );
  
  const sendMessage = useCallback(async (message: string): Promise<AgentChatResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));
    
    try {
      const request: AgentChatRequest = {
        agentRole,
        message,
        context: {
          memories: includeMemories ? memories : undefined,
          previousMessages: state.messages,
        },
      };
      
      const response = await chatWithAgent(request);
      
      if (response.success) {
        const assistantMessage: ChatMessage = { 
          role: 'assistant', 
          content: response.message 
        };
        
        // Calculate cost
        const model = response.model as keyof typeof TOKEN_COSTS;
        const costs = TOKEN_COSTS[model] || TOKEN_COSTS['gpt-4o-mini'];
        const cost = response.usage 
          ? (response.usage.promptTokens * costs.input) + (response.usage.completionTokens * costs.output)
          : 0;
        
        setState(prev => ({
          ...prev,
          messages: [...prev.messages, assistantMessage],
          isLoading: false,
          usage: {
            totalTokens: prev.usage.totalTokens + (response.usage?.totalTokens || 0),
            totalCost: prev.usage.totalCost + cost,
          },
        }));
        
        return response;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.error || 'Unknown error',
        }));
        toast.error(`Agent error: ${response.error}`);
        return response;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error(`Chat failed: ${errorMessage}`);
      return {
        success: false,
        message: '',
        error: errorMessage,
        model: 'unknown',
      };
    }
  }, [agentRole, includeMemories, memories, state.messages]);
  
  const clearChat = useCallback(() => {
    setState({
      messages: [],
      isLoading: false,
      error: null,
      usage: { totalTokens: 0, totalCost: 0 },
    });
  }, []);
  
  const regenerateLastResponse = useCallback(async () => {
    if (state.messages.length < 2) return;
    
    // Remove last assistant message
    const lastUserMessage = [...state.messages]
      .reverse()
      .find(m => m.role === 'user');
    
    if (lastUserMessage) {
      setState(prev => ({
        ...prev,
        messages: prev.messages.slice(0, -1),
      }));
      await sendMessage(lastUserMessage.content);
    }
  }, [state.messages, sendMessage]);
  
  return {
    messages: state.messages,
    isLoading: state.isLoading,
    error: state.error,
    usage: state.usage,
    sendMessage,
    clearChat,
    regenerateLastResponse,
  };
}

/**
 * Hook for streaming chat responses
 */
export function useStreamingChat(options: UseAgentChatOptions) {
  const { agentRole, includeMemories = true } = options;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { data: memories } = useMemories(
    includeMemories ? { importance: 'high' } : undefined
  );
  
  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true);
    setCurrentResponse('');
    
    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const request: AgentChatRequest = {
        agentRole,
        message,
        context: {
          memories: includeMemories ? memories : undefined,
          previousMessages: messages,
        },
        options: { stream: true },
      };
      
      let fullResponse = '';
      
      for await (const chunk of streamChatWithAgent(request)) {
        fullResponse += chunk;
        setCurrentResponse(fullResponse);
      }
      
      // Add complete assistant message
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: fullResponse 
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentResponse('');
      
    } catch (error) {
      toast.error(`Streaming error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      setIsStreaming(false);
    }
  }, [agentRole, includeMemories, memories, messages]);
  
  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);
  
  const clearChat = useCallback(() => {
    setMessages([]);
    setCurrentResponse('');
  }, []);
  
  return {
    messages,
    isStreaming,
    currentResponse,
    sendMessage,
    stopStreaming,
    clearChat,
  };
}

/**
 * Hook for quick agent actions
 */
export function useAgentActions() {
  const reviewCode = useMutation({
    mutationFn: ({ code, language }: { code: string; language: string }) =>
      agentActions.reviewCode(code, language),
    onSuccess: () => toast.success('Code reviewed'),
    onError: (error) => toast.error(`Review failed: ${error.message}`),
  });
  
  const debugError = useMutation({
    mutationFn: ({ error, context }: { error: string; context: string }) =>
      agentActions.debugError(error, context),
    onSuccess: () => toast.success('Debug analysis complete'),
    onError: (error) => toast.error(`Debug failed: ${error.message}`),
  });
  
  const writeBlogOutline = useMutation({
    mutationFn: ({ topic, keywords }: { topic: string; keywords: string[] }) =>
      agentActions.writeBlogOutline(topic, keywords),
    onSuccess: () => toast.success('Outline generated'),
    onError: (error) => toast.error(`Outline failed: ${error.message}`),
  });
  
  const writeEmailCopy = useMutation({
    mutationFn: ({ purpose, tone }: { purpose: string; tone: string }) =>
      agentActions.writeEmailCopy(purpose, tone),
    onSuccess: () => toast.success('Email copy generated'),
    onError: (error) => toast.error(`Email failed: ${error.message}`),
  });
  
  const analyzeMetrics = useMutation({
    mutationFn: (metrics: Record<string, number>) =>
      agentActions.analyzeMetrics(metrics),
    onSuccess: () => toast.success('Analysis complete'),
    onError: (error) => toast.error(`Analysis failed: ${error.message}`),
  });
  
  const suggestCampaign = useMutation({
    mutationFn: ({ product, budget, goal }: { product: string; budget: number; goal: string }) =>
      agentActions.suggestCampaign(product, budget, goal),
    onSuccess: () => toast.success('Campaign suggestion ready'),
    onError: (error) => toast.error(`Suggestion failed: ${error.message}`),
  });
  
  const writeOutreach = useMutation({
    mutationFn: ({ prospect, valueProposition }: { 
      prospect: { name: string; company: string; role: string }; 
      valueProposition: string 
    }) => agentActions.writeOutreach(prospect, valueProposition),
    onSuccess: () => toast.success('Outreach email ready'),
    onError: (error) => toast.error(`Outreach failed: ${error.message}`),
  });
  
  const analyzeDecision = useMutation({
    mutationFn: ({ decision, options, factors }: { 
      decision: string; 
      options: string[]; 
      factors: string[] 
    }) => agentActions.analyzeDecision(decision, options, factors),
    onSuccess: () => toast.success('Decision analysis complete'),
    onError: (error) => toast.error(`Analysis failed: ${error.message}`),
  });
  
  return {
    reviewCode,
    debugError,
    writeBlogOutline,
    writeEmailCopy,
    analyzeMetrics,
    suggestCampaign,
    writeOutreach,
    analyzeDecision,
  };
}

/**
 * Hook for multi-agent conversation
 */
export function useMultiAgentChat() {
  const [conversations, setConversations] = useState<Record<string, ChatMessage[]>>({});
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const sendToAgent = useCallback(async (agentRole: string, message: string) => {
    setIsLoading(true);
    setActiveAgent(agentRole);
    
    // Add user message to agent's conversation
    const userMessage: ChatMessage = { role: 'user', content: message };
    setConversations(prev => ({
      ...prev,
      [agentRole]: [...(prev[agentRole] || []), userMessage],
    }));
    
    try {
      const response = await chatWithAgent({
        agentRole,
        message,
        context: {
          previousMessages: conversations[agentRole] || [],
        },
      });
      
      if (response.success) {
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: response.message,
        };
        setConversations(prev => ({
          ...prev,
          [agentRole]: [...(prev[agentRole] || []), assistantMessage],
        }));
      }
      
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [conversations]);
  
  const handoffToAgent = useCallback(async (
    fromAgent: string, 
    toAgent: string, 
    context: string
  ) => {
    // Get summary of conversation with fromAgent
    const fromConversation = conversations[fromAgent] || [];
    const lastMessages = fromConversation.slice(-4).map(m => 
      `${m.role}: ${m.content.slice(0, 200)}...`
    ).join('\n');
    
    const handoffMessage = `[Handoff from ${fromAgent}]\nContext: ${context}\nPrevious conversation:\n${lastMessages}`;
    
    return sendToAgent(toAgent, handoffMessage);
  }, [conversations, sendToAgent]);
  
  const clearAgentChat = useCallback((agentRole: string) => {
    setConversations(prev => ({
      ...prev,
      [agentRole]: [],
    }));
  }, []);
  
  const clearAllChats = useCallback(() => {
    setConversations({});
    setActiveAgent(null);
  }, []);
  
  return {
    conversations,
    activeAgent,
    isLoading,
    sendToAgent,
    handoffToAgent,
    clearAgentChat,
    clearAllChats,
    setActiveAgent,
  };
}

export default {
  useAgentChat,
  useStreamingChat,
  useAgentActions,
  useMultiAgentChat,
};
