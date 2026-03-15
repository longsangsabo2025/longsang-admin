/**
 * 🧠 Intelligent Memory Service - Copilot-Level Architecture
 *
 * Features like GitHub Copilot:
 * - Token counting & budget management
 * - Auto-summarization when context gets too long
 * - Context ranking by relevance
 * - Sliding window with smart truncation
 * - Prompt caching support
 * - Cross-session persistence
 */

import { AssistantType } from '../hooks/useAssistant';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface MemoryMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokenCount?: number;
  importance?: number; // 0-1, for ranking
  metadata?: {
    model?: string;
    cached?: boolean;
    summarized?: boolean;
  };
}

export interface ConversationContext {
  // Static context (cacheable)
  systemPrompt: string;
  userProfile?: string;

  // Dynamic context
  recentMessages: MemoryMessage[];
  historySummary?: string;

  // Metadata
  totalTokens: number;
  cachedTokens: number;
  lastSummarized?: number;
}

export interface MemorySession {
  id: string; // Unique conversation ID
  conversationId: string; // For display/reference
  assistantType: AssistantType; // Current assistant (can change)
  userId: string;
  title: string;
  messages: MemoryMessage[];
  summary?: string;
  tokenBudget: TokenBudget;
  createdAt: number;
  updatedAt: number;
}

// Active conversation state
export interface ConversationState {
  activeConversationId: string | null;
  conversations: Record<string, MemorySession>;
}

export interface TokenBudget {
  total: number; // Total tokens used
  system: number; // System prompt tokens
  history: number; // Conversation history tokens
  context: number; // RAG context tokens
  available: number; // Remaining tokens
  maxTokens: number; // Model's max context
}

export interface MemoryConfig {
  maxContextTokens: number; // Default: 128000 (Claude Sonnet)
  maxHistoryMessages: number; // Default: 50
  slidingWindowSize: number; // Default: 20 messages
  summarizeThreshold: number; // Summarize when > this many messages
  tokenBuffer: number; // Reserve for response
  autoSummarize: boolean;
  persistToCloud: boolean;
}

// =============================================================================
// TOKEN COUNTER
// =============================================================================

/**
 * Approximate token counter (accurate enough for planning)
 * Based on cl100k_base tokenizer patterns
 */
export class TokenCounter {
  private static AVG_CHARS_PER_TOKEN = 4;
  private static SPECIAL_TOKENS = {
    messageOverhead: 4, // Per message overhead
    rolePrefix: 2, // "user:", "assistant:"
    systemOverhead: 10, // System message overhead
  };

  /**
   * Estimate tokens for a string
   */
  static estimate(text: string): number {
    if (!text) return 0;

    // Basic estimation: characters / 4
    let tokens = Math.ceil(text.length / TokenCounter.AVG_CHARS_PER_TOKEN);

    // Adjust for Vietnamese (uses more tokens per character)
    const vietnameseChars = (text.match(/[\u0080-\uFFFF]/g) || []).length;
    tokens += Math.ceil(vietnameseChars * 0.5);

    // Adjust for code blocks (more precise tokenization)
    const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
    tokens += codeBlocks * 5;

    return tokens;
  }

  /**
   * Estimate tokens for a message
   */
  static estimateMessage(message: MemoryMessage): number {
    let tokens = TokenCounter.estimate(message.content);
    tokens += TokenCounter.SPECIAL_TOKENS.messageOverhead;
    tokens += TokenCounter.SPECIAL_TOKENS.rolePrefix;
    return tokens;
  }

  /**
   * Estimate tokens for message array
   */
  static estimateMessages(messages: MemoryMessage[]): number {
    return messages.reduce((sum, msg) => sum + TokenCounter.estimateMessage(msg), 0);
  }

  /**
   * Estimate tokens for full context
   */
  static estimateContext(context: ConversationContext): TokenBudget {
    const system =
      TokenCounter.estimate(context.systemPrompt) + TokenCounter.SPECIAL_TOKENS.systemOverhead;
    const history = TokenCounter.estimateMessages(context.recentMessages);
    const contextTokens = context.historySummary
      ? TokenCounter.estimate(context.historySummary)
      : 0;

    const total = system + history + contextTokens;

    return {
      total,
      system,
      history,
      context: contextTokens,
      available: 128000 - total - 4096, // Reserve 4096 for response
      maxTokens: 128000,
    };
  }
}

// =============================================================================
// CONTEXT RANKER
// =============================================================================

/**
 * Ranks messages by importance for context window optimization
 */
export class ContextRanker {
  /**
   * Calculate importance score for a message
   */
  static calculateImportance(message: MemoryMessage, index: number, total: number): number {
    let score = 0;

    // Recency: More recent = higher score
    const recencyScore = (index + 1) / total;
    score += recencyScore * 0.4;

    // Length: Longer messages often contain more information
    const lengthScore = Math.min(message.content.length / 1000, 1);
    score += lengthScore * 0.2;

    // Role: User questions are important for context
    if (message.role === 'user') {
      score += 0.1;
    }

    // Contains code: Usually important
    if (message.content.includes('```') || message.content.includes('function')) {
      score += 0.1;
    }

    // Contains questions: Context clues
    if (message.content.includes('?') || message.content.match(/như thế nào|là gì|tại sao/i)) {
      score += 0.1;
    }

    // Contains decisions or conclusions
    if (message.content.match(/kết luận|tóm lại|quyết định|conclusion/i)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  /**
   * Rank and filter messages to fit within token budget
   */
  static rankAndFilter(
    messages: MemoryMessage[],
    maxTokens: number,
    preserveRecent: number = 5
  ): MemoryMessage[] {
    if (messages.length === 0) return [];

    // Always keep the most recent messages
    const recentMessages = messages.slice(-preserveRecent);
    const olderMessages = messages.slice(0, -preserveRecent);

    // Calculate importance for older messages
    const rankedOlder = olderMessages.map((msg, idx) => ({
      message: msg,
      importance: ContextRanker.calculateImportance(msg, idx, olderMessages.length),
    }));

    // Sort by importance (descending)
    rankedOlder.sort((a, b) => b.importance - a.importance);

    // Build result within token budget
    const result: MemoryMessage[] = [];
    let currentTokens = TokenCounter.estimateMessages(recentMessages);

    for (const { message } of rankedOlder) {
      const msgTokens = TokenCounter.estimateMessage(message);
      if (currentTokens + msgTokens <= maxTokens) {
        result.unshift(message); // Add to front (preserve chronological order)
        currentTokens += msgTokens;
      }
    }

    // Add recent messages at the end
    result.push(...recentMessages);

    return result;
  }
}

// =============================================================================
// AUTO SUMMARIZER
// =============================================================================

/**
 * Summarizes conversation history to compress context
 */
export class ConversationSummarizer {
  private static SUMMARIZE_PROMPT =
    `Bạn là trợ lý tóm tắt cuộc trò chuyện. Hãy tóm tắt cuộc trò chuyện sau thành 2-3 đoạn ngắn gọn, giữ lại:
1. Các chủ đề chính đã thảo luận
2. Các quyết định hoặc kết luận quan trọng
3. Thông tin cá nhân hóa về user (nếu có)
4. Context quan trọng cho cuộc trò chuyện tiếp theo

Chỉ trả về phần tóm tắt, không cần giải thích.`;

  /**
   * Build summary request for API
   */
  static buildSummaryRequest(messages: MemoryMessage[]): {
    systemPrompt: string;
    userMessage: string;
  } {
    const conversationText = messages
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');

    return {
      systemPrompt: ConversationSummarizer.SUMMARIZE_PROMPT,
      userMessage: `Cuộc trò chuyện cần tóm tắt:\n\n${conversationText}`,
    };
  }

  /**
   * Summarize messages locally (simple extraction)
   * Used when API call is not desired
   */
  static localSummary(messages: MemoryMessage[]): string {
    if (messages.length === 0) return '';

    // Extract key points
    const userQuestions = messages
      .filter((m) => m.role === 'user')
      .slice(0, 5)
      .map((m) => m.content.slice(0, 100));

    const keyTopics = ConversationSummarizer.extractTopics(messages);

    return `Tóm tắt cuộc trò chuyện trước:
- Số lượt trao đổi: ${Math.floor(messages.length / 2)}
- Các câu hỏi chính: ${userQuestions.join('; ')}
- Chủ đề: ${keyTopics.join(', ')}`;
  }

  /**
   * Extract main topics from messages
   */
  private static extractTopics(messages: MemoryMessage[]): string[] {
    const topics = new Set<string>();
    const allContent = messages.map((m) => m.content).join(' ');

    // Topic keywords
    const topicPatterns = [
      /(?:về|about)\s+(\w+)/gi,
      /(?:tìm hiểu|learn about)\s+(\w+)/gi,
      /(?:phân tích|analyze)\s+(\w+)/gi,
    ];

    for (const pattern of topicPatterns) {
      const matches = allContent.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 2) {
          topics.add(match[1].toLowerCase());
        }
      }
    }

    return Array.from(topics).slice(0, 5);
  }
}

// =============================================================================
// INTELLIGENT MEMORY MANAGER
// =============================================================================

export class IntelligentMemoryManager {
  private config: MemoryConfig;
  private sessions: Map<string, MemorySession> = new Map();
  private activeConversationId: string | null = null;
  private storageKey = 'intelligent_memory_v3';

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = {
      maxContextTokens: 128000,
      maxHistoryMessages: 50,
      slidingWindowSize: 20,
      summarizeThreshold: 30,
      tokenBuffer: 4096,
      autoSummarize: true,
      persistToCloud: false,
      ...config,
    };

    this.loadFromStorage();
  }

  // ---------------------------------------------------------------------------
  // CONVERSATION MANAGEMENT (NEW!)
  // ---------------------------------------------------------------------------

  /**
   * Generate unique conversation ID
   */
  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Create a new conversation
   */
  createConversation(userId: string, assistantType: AssistantType): MemorySession {
    const conversationId = this.generateConversationId();
    const session: MemorySession = {
      id: conversationId,
      conversationId,
      assistantType,
      userId,
      title: `Chat mới - ${new Date().toLocaleDateString('vi-VN')}`,
      messages: [],
      tokenBudget: {
        total: 0,
        system: 0,
        history: 0,
        context: 0,
        available: this.config.maxContextTokens - this.config.tokenBuffer,
        maxTokens: this.config.maxContextTokens,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.sessions.set(conversationId, session);
    this.activeConversationId = conversationId;
    this.saveToStorage();

    return session;
  }

  /**
   * Get active conversation or create new one
   */
  getActiveConversation(userId: string, assistantType: AssistantType): MemorySession {
    // If we have an active conversation, return it
    if (this.activeConversationId && this.sessions.has(this.activeConversationId)) {
      const session = this.sessions.get(this.activeConversationId)!;
      // Update assistant type if changed (conversation continues with new assistant)
      if (session.assistantType !== assistantType) {
        session.assistantType = assistantType;
        session.updatedAt = Date.now();
        this.saveToStorage();
      }
      return session;
    }

    // Find most recent conversation for this user
    const userConversations = this.getUserConversations(userId);
    if (userConversations.length > 0) {
      const recent = userConversations[0];
      this.activeConversationId = recent.id;
      return recent;
    }

    // Create new conversation
    return this.createConversation(userId, assistantType);
  }

  /**
   * Switch to a specific conversation
   */
  switchConversation(conversationId: string): MemorySession | null {
    if (this.sessions.has(conversationId)) {
      this.activeConversationId = conversationId;
      this.saveToStorage();
      return this.sessions.get(conversationId)!;
    }
    return null;
  }

  /**
   * Get all conversations for a user
   */
  getUserConversations(userId: string): MemorySession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Delete a conversation
   */
  deleteConversation(conversationId: string): void {
    this.sessions.delete(conversationId);
    if (this.activeConversationId === conversationId) {
      this.activeConversationId = null;
    }
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // SESSION MANAGEMENT (UPDATED)
  // ---------------------------------------------------------------------------

  /**
   * Get or create a session (BACKWARD COMPATIBLE)
   * Now routes to conversation-based system
   */
  getSession(userId: string, assistantType: AssistantType): MemorySession {
    return this.getActiveConversation(userId, assistantType);
  }

  /**
   * Add message to session
   */
  addMessage(
    userId: string,
    assistantType: AssistantType,
    role: 'user' | 'assistant',
    content: string
  ): MemoryMessage {
    const session = this.getSession(userId, assistantType);

    const message: MemoryMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      timestamp: Date.now(),
      tokenCount: TokenCounter.estimate(content),
    };

    // Calculate importance
    message.importance = ContextRanker.calculateImportance(
      message,
      session.messages.length,
      session.messages.length + 1
    );

    session.messages.push(message);
    session.updatedAt = Date.now();

    // Auto-update title from first user message
    if (role === 'user' && session.messages.length === 1) {
      session.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    }

    // Check if summarization needed
    if (this.config.autoSummarize && session.messages.length > this.config.summarizeThreshold) {
      this.triggerSummarization(session);
    }

    // Update token budget
    this.updateTokenBudget(session);

    // Persist
    this.saveToStorage();

    return message;
  }

  /**
   * Get optimized context for API call
   */
  getOptimizedContext(
    userId: string,
    assistantType: AssistantType,
    systemPrompt: string
  ): ConversationContext {
    const session = this.getSession(userId, assistantType);

    // Calculate available tokens for history
    const systemTokens = TokenCounter.estimate(systemPrompt);
    const summaryTokens = session.summary ? TokenCounter.estimate(session.summary) : 0;
    const availableForHistory =
      this.config.maxContextTokens - systemTokens - summaryTokens - this.config.tokenBuffer;

    // Get ranked messages within budget
    const optimizedMessages = ContextRanker.rankAndFilter(
      session.messages,
      availableForHistory,
      Math.min(this.config.slidingWindowSize, session.messages.length)
    );

    return {
      systemPrompt,
      recentMessages: optimizedMessages,
      historySummary: session.summary,
      totalTokens: TokenCounter.estimateMessages(optimizedMessages) + systemTokens + summaryTokens,
      cachedTokens: systemTokens, // System prompt can be cached
    };
  }

  /**
   * Build messages array for API
   */
  buildAPIMessages(context: ConversationContext): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add summary as system context if exists
    if (context.historySummary) {
      messages.push({
        role: 'user',
        content: `[Context từ cuộc trò chuyện trước]\n${context.historySummary}\n\n[Tiếp tục cuộc trò chuyện]`,
      });
    }

    // Add conversation messages
    for (const msg of context.recentMessages) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      });
    }

    return messages;
  }

  // ---------------------------------------------------------------------------
  // SUMMARIZATION
  // ---------------------------------------------------------------------------

  /**
   * Trigger summarization for a session
   */
  private triggerSummarization(session: MemorySession): void {
    // Don't summarize if recently done
    if (session.summary && session.messages.length - (session.tokenBudget.history || 0) < 10) {
      return;
    }

    // Get messages to summarize (keep recent ones)
    const toSummarize = session.messages.slice(0, -this.config.slidingWindowSize);

    if (toSummarize.length < 10) return;

    // Use local summary (fast, no API call)
    const summary = ConversationSummarizer.localSummary(toSummarize);

    // Update session
    session.summary = session.summary ? `${session.summary}\n\n${summary}` : summary;

    // Trim old messages
    session.messages = session.messages.slice(-this.config.slidingWindowSize);

    // Debug log removed for production
  }

  /**
   * Get AI-powered summary (call externally)
   */
  getSummaryRequest(
    userId: string,
    assistantType: AssistantType
  ): {
    systemPrompt: string;
    userMessage: string;
  } | null {
    const session = this.getSession(userId, assistantType);

    if (session.messages.length < this.config.summarizeThreshold) {
      return null;
    }

    const toSummarize = session.messages.slice(0, -this.config.slidingWindowSize);
    return ConversationSummarizer.buildSummaryRequest(toSummarize);
  }

  /**
   * Apply AI-generated summary
   */
  applySummary(userId: string, assistantType: AssistantType, summary: string): void {
    const session = this.getSession(userId, assistantType);

    session.summary = session.summary ? `${session.summary}\n\n${summary}` : summary;

    // Trim old messages
    session.messages = session.messages.slice(-this.config.slidingWindowSize);
    session.updatedAt = Date.now();

    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // TOKEN BUDGET
  // ---------------------------------------------------------------------------

  private updateTokenBudget(session: MemorySession): void {
    const historyTokens = TokenCounter.estimateMessages(session.messages);
    const summaryTokens = session.summary ? TokenCounter.estimate(session.summary) : 0;

    session.tokenBudget = {
      ...session.tokenBudget,
      history: historyTokens,
      context: summaryTokens,
      total: historyTokens + summaryTokens,
      available:
        this.config.maxContextTokens - historyTokens - summaryTokens - this.config.tokenBuffer,
    };
  }

  /**
   * Get token usage stats
   */
  getTokenStats(userId: string, assistantType: AssistantType): TokenBudget {
    const session = this.getSession(userId, assistantType);
    this.updateTokenBudget(session);
    return session.tokenBudget;
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);

        // Load sessions
        if (data.sessions) {
          for (const [key, session] of Object.entries(data.sessions)) {
            this.sessions.set(key, session as MemorySession);
          }
        }

        // Load active conversation ID
        if (data.activeConversationId) {
          this.activeConversationId = data.activeConversationId;
        }
      }
    } catch (error) {
      console.error('[IntelligentMemory] Load error:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        sessions: {} as Record<string, MemorySession>,
        activeConversationId: this.activeConversationId,
      };

      for (const [key, session] of this.sessions) {
        data.sessions[key] = session;
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('[IntelligentMemory] Save error:', error);
    }
  }

  /**
   * Clear current active session
   */
  clearSession(_userId: string, _assistantType: AssistantType): void {
    if (this.activeConversationId) {
      this.deleteConversation(this.activeConversationId);
    }
  }

  /**
   * Clear current conversation and start new
   */
  startNewConversation(userId: string, assistantType: AssistantType): MemorySession {
    this.activeConversationId = null;
    return this.createConversation(userId, assistantType);
  }

  /**
   * Get active conversation ID
   */
  getActiveConversationId(): string | null {
    return this.activeConversationId;
  }

  /**
   * Get all sessions for user (alias for getUserConversations)
   */
  getUserSessions(userId: string): MemorySession[] {
    return this.getUserConversations(userId);
  }

  /**
   * Export session for debugging
   */
  exportSession(userId: string, assistantType: AssistantType): string {
    const session = this.getSession(userId, assistantType);
    return JSON.stringify(session, null, 2);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let memoryInstance: IntelligentMemoryManager | null = null;

export function getMemoryManager(config?: Partial<MemoryConfig>): IntelligentMemoryManager {
  if (!memoryInstance) {
    memoryInstance = new IntelligentMemoryManager(config);
  }
  return memoryInstance;
}

export default IntelligentMemoryManager;
