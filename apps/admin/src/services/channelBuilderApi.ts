/**
 * 📺 Channel Builder API Service
 * Client-side API calls for Channel Builder
 * 
 * @author LongSang (Elon Mode 🚀)
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Channel {
  id: string;
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram';
  name: string;
  handle: string;
  avatarUrl?: string;
  followers: number;
  isConnected: boolean;
  lastSync?: Date;
}

export interface ContentIdea {
  id: string;
  channel_id?: string;
  title: string;
  description?: string;
  platforms?: string[];
  content_type?: string;
  status: 'idea' | 'scripted' | 'in_production' | 'scheduled' | 'published' | 'archived';
  scheduled_at?: Date;
  ai_generated?: boolean;
  ai_model?: string;
  generation_prompt?: string;
  tags?: string[];
  category?: string;
  target_audience?: string;
  metadata?: Record<string, unknown>;
}

export interface ContentIdeaStats {
  total: number;
  by_status: {
    idea: number;
    scripted: number;
    in_production: number;
    scheduled: number;
    published: number;
    archived: number;
  };
  ai_generated: number;
  manual: number;
}

// =============================================================================
// CHANNELS API
// =============================================================================

export const channelsApi = {
  /**
   * Get all channels
   */
  async list(): Promise<Channel[]> {
    const response = await fetch('/api/channels');
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch channels');
    }
    
    return data.data || [];
  },

  /**
   * Get single channel
   */
  async get(id: string): Promise<Channel> {
    const response = await fetch(`/api/channels/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch channel');
    }
    
    return data.data;
  },

  /**
   * Create new channel
   */
  async create(channel: Partial<Channel>): Promise<Channel> {
    const response = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create channel');
    }
    
    return data.data;
  },

  /**
   * Update channel
   */
  async update(id: string, updates: Partial<Channel>): Promise<Channel> {
    const response = await fetch(`/api/channels/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update channel');
    }
    
    return data.data;
  },

  /**
   * Delete channel
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/channels/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete channel');
    }
  },
};

// =============================================================================
// CONTENT IDEAS API
// =============================================================================

export const contentIdeasApi = {
  /**
   * Get all content ideas with filters
   */
  async list(filters?: {
    channel_id?: string;
    status?: string;
    platform?: string;
    ai_generated?: boolean;
    limit?: number;
  }): Promise<ContentIdea[]> {
    const params = new URLSearchParams();
    
    if (filters?.channel_id) params.append('channel_id', filters.channel_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.platform) params.append('platform', filters.platform);
    if (filters?.ai_generated !== undefined) params.append('ai_generated', String(filters.ai_generated));
    if (filters?.limit) params.append('limit', String(filters.limit));
    
    const response = await fetch(`/api/content-ideas?${params.toString()}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch content ideas');
    }
    
    return data.data || [];
  },

  /**
   * Get single content idea
   */
  async get(id: string): Promise<ContentIdea> {
    const response = await fetch(`/api/content-ideas/${id}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch content idea');
    }
    
    return data.data;
  },

  /**
   * Create new content idea
   */
  async create(idea: Partial<ContentIdea>): Promise<ContentIdea> {
    const response = await fetch('/api/content-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(idea),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create content idea');
    }
    
    return data.data;
  },

  /**
   * Update content idea
   */
  async update(id: string, updates: Partial<ContentIdea>): Promise<ContentIdea> {
    const response = await fetch(`/api/content-ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update content idea');
    }
    
    return data.data;
  },

  /**
   * Delete content idea
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`/api/content-ideas/${id}`, {
      method: 'DELETE',
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete content idea');
    }
  },

  /**
   * Update content idea status
   */
  async updateStatus(id: string, status: ContentIdea['status']): Promise<ContentIdea> {
    const response = await fetch(`/api/content-ideas/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to update status');
    }
    
    return data.data;
  },

  /**
   * Bulk create content ideas (for AI generation)
   */
  async bulkCreate(ideas: Partial<ContentIdea>[]): Promise<ContentIdea[]> {
    const response = await fetch('/api/content-ideas/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideas }),
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to bulk create ideas');
    }
    
    return data.data || [];
  },

  /**
   * Get content ideas statistics
   */
  async getStats(channelId?: string): Promise<ContentIdeaStats> {
    const params = new URLSearchParams();
    if (channelId) params.append('channel_id', channelId);
    
    const response = await fetch(`/api/content-ideas/stats/overview?${params.toString()}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch stats');
    }
    
    return data.data;
  },
};
