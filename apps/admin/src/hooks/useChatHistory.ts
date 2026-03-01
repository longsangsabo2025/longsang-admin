/**
 * Hook for managing Visual Workspace chat history
 * Persist chat messages to Supabase with localStorage fallback
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  created_at: Date;
  updated_at: Date;
}

const STORAGE_KEY = 'longsang_chat_history';
const SESSIONS_KEY = 'longsang_chat_sessions';
const CURRENT_SESSION_KEY = 'longsang_current_session';

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(true);

  // Generate unique ID
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const generateSessionId = () =>
    `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const storedSessions = localStorage.getItem(SESSIONS_KEY);
      const storedCurrentId = localStorage.getItem(CURRENT_SESSION_KEY);

      if (storedSessions) {
        const parsed: ChatSession[] = JSON.parse(storedSessions).map((s: ChatSession) => ({
          ...s,
          created_at: new Date(s.created_at),
          updated_at: new Date(s.updated_at),
          messages: s.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setSessions(parsed);

        // Restore current session
        if (storedCurrentId) {
          const current = parsed.find((s) => s.id === storedCurrentId);
          if (current) {
            setCurrentSession(current);
          } else if (parsed.length > 0) {
            setCurrentSession(parsed[0]);
          }
        } else if (parsed.length > 0) {
          setCurrentSession(parsed[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load chat history from localStorage:', error);
    }
  }, []);

  // Save to localStorage
  const saveToLocalStorage = useCallback((sessionsToSave: ChatSession[], currentId?: string) => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessionsToSave));
      if (currentId) {
        localStorage.setItem(CURRENT_SESSION_KEY, currentId);
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, []);

  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);

      try {
        // Try Supabase first
        const { data, error } = await supabase
          .from('chat_sessions')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(50);

        if (error) {
          console.warn('Supabase chat history not available, using localStorage:', error.message);
          setUseSupabase(false);
          loadFromLocalStorage();
        } else if (data && data.length > 0) {
          const loadedSessions: ChatSession[] = data.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            name: (item.name as string) || 'Untitled',
            messages: (item.messages as ChatMessage[]) || [],
            created_at: new Date(item.created_at as string),
            updated_at: new Date(item.updated_at as string),
          }));
          setSessions(loadedSessions);
          setCurrentSession(loadedSessions[0]);
          setUseSupabase(true);
        } else {
          // No data in Supabase, try localStorage
          loadFromLocalStorage();
        }
      } catch (err) {
        console.warn('Supabase connection failed, using localStorage');
        setUseSupabase(false);
        loadFromLocalStorage();
      }

      setIsLoading(false);
    };

    loadHistory();
  }, [loadFromLocalStorage]);

  // Create new session
  const createSession = useCallback(
    async (name?: string): Promise<ChatSession> => {
      const newSession: ChatSession = {
        id: generateSessionId(),
        name:
          name ||
          `Session ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
        messages: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSession(newSession);

      if (useSupabase) {
        try {
          await supabase.from('chat_sessions').insert({
            id: newSession.id,
            name: newSession.name,
            messages: [],
            user_id: 'anonymous',
          });
        } catch (err) {
          console.warn('Failed to save session to Supabase');
        }
      }

      saveToLocalStorage(updatedSessions, newSession.id);
      return newSession;
    },
    [sessions, useSupabase, saveToLocalStorage]
  );

  // Add message to current session
  const addMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      metadata?: Record<string, unknown>
    ): Promise<ChatMessage> => {
      const message: ChatMessage = {
        id: generateId(),
        role,
        content,
        timestamp: new Date(),
        metadata,
      };

      // Create session if none exists
      let session = currentSession;
      if (!session) {
        session = await createSession();
      }

      const updatedMessages = [...session.messages, message];
      const updatedSession: ChatSession = {
        ...session,
        messages: updatedMessages,
        updated_at: new Date(),
      };

      const updatedSessions = sessions.map((s) =>
        s.id === updatedSession.id ? updatedSession : s
      );

      // If session wasn't in list, add it
      if (!sessions.find((s) => s.id === updatedSession.id)) {
        updatedSessions.unshift(updatedSession);
      }

      setSessions(updatedSessions);
      setCurrentSession(updatedSession);

      // Save to Supabase
      if (useSupabase) {
        try {
          await supabase.from('chat_sessions').upsert({
            id: updatedSession.id,
            name: updatedSession.name,
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
            user_id: 'anonymous',
          });
        } catch (err) {
          console.warn('Failed to save message to Supabase');
        }
      }

      saveToLocalStorage(updatedSessions, updatedSession.id);
      return message;
    },
    [currentSession, sessions, useSupabase, createSession, saveToLocalStorage]
  );

  // Update last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback(
    (content: string) => {
      if (!currentSession) return;

      const messages = [...currentSession.messages];
      const lastIndex = messages.length - 1;

      if (lastIndex >= 0 && messages[lastIndex].role === 'assistant') {
        messages[lastIndex] = {
          ...messages[lastIndex],
          content,
        };

        const updatedSession = {
          ...currentSession,
          messages,
          updated_at: new Date(),
        };

        setCurrentSession(updatedSession);
        setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));
      }
    },
    [currentSession]
  );

  // Switch session
  const switchSession = useCallback(
    (sessionId: string) => {
      const session = sessions.find((s) => s.id === sessionId);
      if (session) {
        setCurrentSession(session);
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
      }
    },
    [sessions]
  );

  // Delete session
  const deleteSession = useCallback(
    async (sessionId: string) => {
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);

      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSessions[0] || null);
      }

      if (useSupabase) {
        try {
          await supabase.from('chat_sessions').delete().eq('id', sessionId);
        } catch (err) {
          console.warn('Failed to delete session from Supabase');
        }
      }

      saveToLocalStorage(updatedSessions, updatedSessions[0]?.id);
    },
    [sessions, currentSession, useSupabase, saveToLocalStorage]
  );

  // Clear current session messages
  const clearCurrentSession = useCallback(async () => {
    if (!currentSession) return;

    const updatedSession = {
      ...currentSession,
      messages: [],
      updated_at: new Date(),
    };

    setCurrentSession(updatedSession);
    setSessions((prev) => prev.map((s) => (s.id === updatedSession.id ? updatedSession : s)));

    if (useSupabase) {
      try {
        await supabase
          .from('chat_sessions')
          .update({ messages: [], updated_at: new Date().toISOString() })
          .eq('id', currentSession.id);
      } catch (err) {
        console.warn('Failed to clear session in Supabase');
      }
    }

    saveToLocalStorage(
      sessions.map((s) => (s.id === updatedSession.id ? updatedSession : s)),
      updatedSession.id
    );
  }, [currentSession, sessions, useSupabase, saveToLocalStorage]);

  // Rename session
  const renameSession = useCallback(
    async (sessionId: string, newName: string) => {
      const updatedSessions = sessions.map((s) =>
        s.id === sessionId ? { ...s, name: newName, updated_at: new Date() } : s
      );
      setSessions(updatedSessions);

      if (currentSession?.id === sessionId) {
        setCurrentSession((prev) => (prev ? { ...prev, name: newName } : null));
      }

      if (useSupabase) {
        try {
          await supabase
            .from('chat_sessions')
            .update({ name: newName, updated_at: new Date().toISOString() })
            .eq('id', sessionId);
        } catch (err) {
          console.warn('Failed to rename session in Supabase');
        }
      }

      saveToLocalStorage(updatedSessions, currentSession?.id);
    },
    [sessions, currentSession, useSupabase, saveToLocalStorage]
  );

  return {
    // State
    sessions,
    currentSession,
    messages: currentSession?.messages || [],
    isLoading,
    useSupabase,

    // Actions
    createSession,
    addMessage,
    updateLastAssistantMessage,
    switchSession,
    deleteSession,
    clearCurrentSession,
    renameSession,
  };
}
