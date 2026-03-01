/**
 * Credentials Vault Service
 * Secure storage for all API keys, passwords, and secrets
 */

import { getSupabaseClient } from '@/lib/supabase';

// Types
export interface Credential {
  id: string;
  category: CredentialCategory;
  project_id: string | null;
  name: string;
  description: string | null;
  credential_type: CredentialType;
  credential_value: string;
  credential_preview: string | null;
  environment: Environment;
  provider: string | null;
  dashboard_url: string | null;
  docs_url: string | null;
  status: CredentialStatus;
  expires_at: string | null;
  last_used_at: string | null;
  last_rotated_at: string | null;
  rotation_reminder_days: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  tags: string[];
  notes: string | null;
  // Joined data
  project?: { name: string; slug: string } | null;
}

export type CredentialCategory =
  | 'supabase'
  | 'database'
  | 'ai'
  | 'google'
  | 'email'
  | 'payment'
  | 'hosting'
  | 'social'
  | 'analytics'
  | 'n8n'
  | 'other';

export type CredentialType =
  | 'api_key'
  | 'password'
  | 'token'
  | 'secret'
  | 'connection_string'
  | 'oauth'
  | 'service_account'
  | 'certificate'
  | 'other';

export type CredentialStatus = 'active' | 'inactive' | 'expired' | 'revoked' | 'rotating';

export type Environment = 'development' | 'staging' | 'production' | 'all';

export interface CreateCredentialInput {
  category: CredentialCategory;
  project_id?: string | null;
  name: string;
  description?: string;
  credential_type: CredentialType;
  credential_value: string;
  environment?: Environment;
  provider?: string;
  dashboard_url?: string;
  docs_url?: string;
  status?: CredentialStatus;
  expires_at?: string;
  rotation_reminder_days?: number;
  tags?: string[];
  notes?: string;
}

export interface UpdateCredentialInput extends Partial<CreateCredentialInput> {
  id: string;
}

// Helper to create preview
function createPreview(value: string, type: CredentialType): string {
  if (!value) return '';

  // For very short values, don't preview
  if (value.length <= 10) return '***';

  // Different preview styles based on type
  switch (type) {
    case 'api_key':
    case 'token':
    case 'secret':
      // Show first 8 and last 4 chars
      return `${value.substring(0, 8)}...${value.substring(value.length - 4)}`;
    case 'password':
      return '••••••••';
    case 'connection_string':
      // Show protocol and first part
      const match = value.match(/^(\w+:\/\/[^:]+)/);
      return match ? `${match[1]}:***` : '***';
    case 'service_account':
      return 'JSON Service Account';
    default:
      return `${value.substring(0, 6)}...`;
  }
}

// Category icons
export const categoryIcons: Record<CredentialCategory, string> = {
  supabase: '🟢',
  database: '🗄️',
  ai: '🤖',
  google: '🔵',
  email: '📧',
  payment: '💳',
  hosting: '☁️',
  social: '👥',
  analytics: '📊',
  n8n: '⚡',
  other: '🔑',
};

// Provider colors
export const providerColors: Record<string, string> = {
  Supabase: 'bg-green-500',
  OpenAI: 'bg-emerald-500',
  Anthropic: 'bg-orange-500',
  Google: 'bg-blue-500',
  'Google Cloud': 'bg-blue-600',
  OpenRouter: 'bg-purple-500',
  n8n: 'bg-red-500',
  Vercel: 'bg-black',
  Cloudflare: 'bg-orange-600',
  SendGrid: 'bg-blue-400',
  Resend: 'bg-black',
  Stripe: 'bg-purple-600',
};

// Service functions
export const vaultService = {
  /**
   * Get all credentials
   */
  async getAll(filters?: {
    category?: CredentialCategory;
    project_id?: string | null;
    status?: CredentialStatus;
    environment?: Environment;
  }): Promise<Credential[]> {
    const supabase = getSupabaseClient();
    let query = supabase
      .from('credentials_vault')
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .order('category')
      .order('name');

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.project_id !== undefined) {
      query = filters.project_id
        ? query.eq('project_id', filters.project_id)
        : query.is('project_id', null);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.environment) {
      query = query.eq('environment', filters.environment);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Get single credential by ID
   */
  async getById(id: string): Promise<Credential | null> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('credentials_vault')
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get credentials by category
   */
  async getByCategory(category: CredentialCategory): Promise<Credential[]> {
    return this.getAll({ category });
  },

  /**
   * Get credentials for a project
   */
  async getByProject(projectId: string): Promise<Credential[]> {
    return this.getAll({ project_id: projectId });
  },

  /**
   * Get global/shared credentials (not tied to any project)
   */
  async getGlobal(): Promise<Credential[]> {
    return this.getAll({ project_id: null });
  },

  /**
   * Create new credential
   */
  async create(input: CreateCredentialInput): Promise<Credential> {
    const supabase = getSupabaseClient();

    const credential = {
      ...input,
      credential_preview: createPreview(input.credential_value, input.credential_type),
      last_rotated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('credentials_vault')
      .insert(credential)
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update credential
   */
  async update(input: UpdateCredentialInput): Promise<Credential> {
    const supabase = getSupabaseClient();
    const { id, ...updates } = input;

    // If credential_value is updated, update preview and rotation date
    if (updates.credential_value && updates.credential_type) {
      (updates as Record<string, unknown>).credential_preview = createPreview(
        updates.credential_value,
        updates.credential_type
      );
      (updates as Record<string, unknown>).last_rotated_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('credentials_vault')
      .update(updates)
      .eq('id', id)
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete credential
   */
  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('credentials_vault').delete().eq('id', id);

    if (error) throw error;
  },

  /**
   * Mark credential as used
   */
  async markUsed(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase
      .from('credentials_vault')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);
  },

  /**
   * Rotate credential (update value)
   */
  async rotate(id: string, newValue: string): Promise<Credential> {
    const credential = await this.getById(id);
    if (!credential) throw new Error('Credential not found');

    return this.update({
      id,
      credential_value: newValue,
      credential_type: credential.credential_type,
    });
  },

  /**
   * Get credentials expiring soon
   */
  async getExpiringSoon(days: number = 30): Promise<Credential[]> {
    const supabase = getSupabaseClient();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabase
      .from('credentials_vault')
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .not('expires_at', 'is', null)
      .lte('expires_at', futureDate.toISOString())
      .eq('status', 'active')
      .order('expires_at');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get credentials needing rotation
   */
  async getNeedingRotation(): Promise<Credential[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('credentials_vault')
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .eq('status', 'active');

    if (error) throw error;

    // Filter credentials that need rotation based on rotation_reminder_days
    const now = new Date();
    return (data || []).filter((cred) => {
      if (!cred.last_rotated_at) return true;
      const lastRotated = new Date(cred.last_rotated_at);
      const daysSinceRotation = Math.floor(
        (now.getTime() - lastRotated.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceRotation >= cred.rotation_reminder_days;
    });
  },

  /**
   * Search credentials
   */
  async search(query: string): Promise<Credential[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('credentials_vault')
      .select(
        `
        *,
        project:projects(name, slug)
      `
      )
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,provider.ilike.%${query}%`)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  /**
   * Get stats
   */
  async getStats(): Promise<{
    total: number;
    byCategory: Record<CredentialCategory, number>;
    byStatus: Record<CredentialStatus, number>;
    expiringSoon: number;
    needingRotation: number;
  }> {
    const all = await this.getAll();
    const expiring = await this.getExpiringSoon();
    const needsRotation = await this.getNeedingRotation();

    const byCategory = {} as Record<CredentialCategory, number>;
    const byStatus = {} as Record<CredentialStatus, number>;

    for (const cred of all) {
      byCategory[cred.category] = (byCategory[cred.category] || 0) + 1;
      byStatus[cred.status] = (byStatus[cred.status] || 0) + 1;
    }

    return {
      total: all.length,
      byCategory,
      byStatus,
      expiringSoon: expiring.length,
      needingRotation: needsRotation.length,
    };
  },

  /**
   * Copy credential value to clipboard (client-side)
   */
  copyToClipboard(value: string): Promise<void> {
    return navigator.clipboard.writeText(value);
  },
};

export default vaultService;
