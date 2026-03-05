/**
 * Travis AI Service — shared REST client for Admin Dashboard.
 *
 * Centralizes all Travis API calls so components don't use fetch() directly.
 * Pattern borrowed from sabohub-nexus/src/services/travisService.ts.
 */

const getBaseUrl = () =>
  // @ts-expect-error — Vite env
  (import.meta.env?.VITE_TRAVIS_API_URL as string) || 'http://localhost:8300';

const TRAVIS_CONFIGURED = !!(import.meta.env?.VITE_TRAVIS_API_URL);

export interface TravisMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolCalls?: { name: string; args: Record<string, unknown>; result_preview?: string }[];
  latencyMs?: number;
  timestamp: Date;
}

export interface TravisStats {
  total_conversations: number;
  total_decisions: number;
  pending_alerts: number;
  critical_alerts: number;
  success_rate: number;
}

export interface TravisHealthInfo {
  status: string;
  model: string;
  tools_count: number;
  telegram: boolean;
  proactive_monitoring: boolean;
}

export interface TravisAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  created_at: string;
}

export interface TravisSession {
  session_id: string;
  created_at: string;
}

export interface ChatResponse {
  response: string;
  tool_calls?: { name: string; args: Record<string, unknown> }[];
  latency_ms?: number;
  session_id?: string;
}

class TravisService {
  private get baseUrl() {
    return getBaseUrl();
  }

  /** Check if Travis AI is reachable. */
  async isAvailable(): Promise<boolean> {
    if (!TRAVIS_CONFIGURED) return false;
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Get health info. */
  async health(): Promise<TravisHealthInfo | null> {
    if (!TRAVIS_CONFIGURED) return null;
    try {
      const res = await fetch(`${this.baseUrl}/health`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /** Get usage statistics. */
  async stats(): Promise<TravisStats | null> {
    if (!TRAVIS_CONFIGURED) return null;
    try {
      const res = await fetch(`${this.baseUrl}/stats`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  }

  /** Get pending alerts. */
  async pendingAlerts(): Promise<TravisAlert[]> {
    if (!TRAVIS_CONFIGURED) return [];
    try {
      const res = await fetch(`${this.baseUrl}/alerts/pending`);
      if (res.ok) {
        const data = await res.json();
        return data.alerts || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  /** Get recent sessions. */
  async sessions(): Promise<TravisSession[]> {
    if (!TRAVIS_CONFIGURED) return [];
    try {
      const res = await fetch(`${this.baseUrl}/sessions`);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  }

  /** Send a chat message via REST. */
  async chat(message: string, sessionId: string | null): Promise<ChatResponse> {
    if (!TRAVIS_CONFIGURED) throw new Error('Travis AI is not configured');
    const res = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId, include_context: true }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }

  /** Get the WebSocket URL. */
  get wsUrl(): string {
    // @ts-expect-error — Vite env
    return (import.meta.env?.VITE_TRAVIS_WS_URL as string) || 'ws://localhost:8300/ws';
  }

  /** Get the base API URL (for display). */
  get apiUrl(): string {
    return this.baseUrl;
  }
}

/** Singleton instance. */
export const travisService = new TravisService();
