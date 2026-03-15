/**
 * SEO API - Supabase Integration
 * Kết nối với database để quản lý SEO automation
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

// ========================================
// DOMAIN MANAGEMENT
// ========================================

export interface SEODomain {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  auto_index: boolean;
  google_service_account_json?: Json;
  bing_api_key?: string;
  total_urls: number;
  indexed_urls: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDomainInput {
  name: string;
  url: string;
  google_service_account_json?: Json;
  bing_api_key?: string;
  auto_index?: boolean;
}

export interface UpdateDomainInput {
  name?: string;
  url?: string;
  enabled?: boolean;
  auto_index?: boolean;
  google_service_account_json?: Json;
  bing_api_key?: string;
}

/**
 * Lấy danh sách tất cả domains
 */
export async function getDomains() {
  const { data, error } = await supabase
    .from('seo_domains')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SEODomain[];
}

/**
 * Lấy thông tin một domain
 */
export async function getDomain(id: string) {
  const { data, error } = await supabase.from('seo_domains').select('*').eq('id', id).single();

  if (error) throw error;
  return data as SEODomain;
}

/**
 * Tạo domain mới
 */
export async function createDomain(input: CreateDomainInput) {
  const { data, error } = await supabase
    .from('seo_domains')
    .insert({
      ...input,
      auto_index: input.auto_index ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as SEODomain;
}

/**
 * Cập nhật domain
 */
export async function updateDomain(id: string, input: UpdateDomainInput) {
  const { data, error } = await supabase
    .from('seo_domains')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as SEODomain;
}

/**
 * Xóa domain
 */
export async function deleteDomain(id: string) {
  const { error } = await supabase.from('seo_domains').delete().eq('id', id);

  if (error) throw error;
}

// ========================================
// INDEXING QUEUE
// ========================================

export interface IndexingQueueItem {
  id: string;
  domain_id: string;
  url: string;
  status: 'pending' | 'crawling' | 'indexed' | 'failed';
  search_engine: 'google' | 'bing';
  submitted_at: string;
  indexed_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateQueueItemInput {
  domain_id: string;
  url: string;
  search_engine?: 'google' | 'bing';
}

/**
 * Lấy indexing queue
 */
export async function getIndexingQueue(domain_id?: string) {
  let query = supabase
    .from('seo_indexing_queue')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (domain_id) {
    query = query.eq('domain_id', domain_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as IndexingQueueItem[];
}

/**
 * Thêm URL vào indexing queue
 */
export async function addToIndexingQueue(input: CreateQueueItemInput) {
  const { data, error } = await supabase
    .from('seo_indexing_queue')
    .insert({
      ...input,
      search_engine: input.search_engine ?? 'google',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return data as IndexingQueueItem;
}

/**
 * Cập nhật trạng thái indexing
 */
export async function updateIndexingStatus(
  id: string,
  status: 'pending' | 'crawling' | 'indexed' | 'failed',
  error_message?: string
) {
  const updates: {
    status: string;
    updated_at: string;
    indexed_at?: string;
    error_message?: string | null;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'indexed') {
    updates.indexed_at = new Date().toISOString();
  }

  if (error_message) {
    updates.error_message = error_message;
  }

  const { data, error } = await supabase
    .from('seo_indexing_queue')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as IndexingQueueItem;
}

/**
 * Retry failed URLs
 */
export async function retryFailedUrls(domain_id?: string) {
  // Get failed items with all required fields
  let query = supabase.from('seo_indexing_queue').select('*').eq('status', 'failed');

  if (domain_id) {
    query = query.eq('domain_id', domain_id);
  }

  const { data: failedItems, error: fetchError } = await query;

  if (fetchError) throw fetchError;
  if (!failedItems || failedItems.length === 0) return { count: 0 };

  // Update each item with incremented retry_count
  const updates = failedItems.map((item) => ({
    ...item,
    status: 'pending',
    retry_count: (item.retry_count || 0) + 1,
    error_message: null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('seo_indexing_queue').upsert(updates);

  if (error) throw error;

  return { count: failedItems.length };
}

/**
 * Lấy thống kê indexing
 */
export async function getIndexingStats(domain_id?: string) {
  let query = supabase.from('seo_indexing_queue').select('status');

  if (domain_id) {
    query = query.eq('domain_id', domain_id);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Count by status
  const stats = {
    total: data.length,
    pending: data.filter((item) => item.status === 'pending').length,
    crawling: data.filter((item) => item.status === 'crawling').length,
    indexed: data.filter((item) => item.status === 'indexed').length,
    failed: data.filter((item) => item.status === 'failed').length,
  };

  return stats;
}

// ========================================
// KEYWORDS
// ========================================

export interface Keyword {
  id: string;
  domain_id: string;
  keyword: string;
  current_position?: number;
  previous_position?: number;
  volume?: string;
  difficulty?: string;
  target_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKeywordInput {
  domain_id: string;
  keyword: string;
  current_position?: number;
  volume?: string;
  difficulty?: string;
  target_url?: string;
}

/**
 * Lấy keywords của domain
 */
export async function getKeywords(domain_id: string) {
  const { data, error } = await supabase
    .from('seo_keywords')
    .select('*')
    .eq('domain_id', domain_id)
    .order('current_position', { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data as Keyword[];
}

/**
 * Thêm keyword
 */
export async function addKeyword(input: CreateKeywordInput) {
  const { data, error } = await supabase.from('seo_keywords').insert(input).select().single();

  if (error) throw error;
  return data as Keyword;
}

/**
 * Cập nhật keyword position
 */
export async function updateKeywordPosition(id: string, current_position: number) {
  // First, get the current position to save as previous
  const { data: keyword } = await supabase
    .from('seo_keywords')
    .select('current_position')
    .eq('id', id)
    .single();

  const { data, error } = await supabase
    .from('seo_keywords')
    .update({
      previous_position: keyword?.current_position,
      current_position,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Keyword;
}

/**
 * Xóa keyword
 */
export async function deleteKeyword(id: string) {
  const { error } = await supabase.from('seo_keywords').delete().eq('id', id);

  if (error) throw error;
}

// ========================================
// SEO SETTINGS
// ========================================

export interface SEOSettings {
  id: string;
  google_api_enabled: boolean | null;
  bing_api_enabled: boolean | null;
  google_daily_quota_limit: number | null;
  retry_failed_after_hours: number | null;
  search_console_webhook: string | null;
  auto_submit_new_content: boolean | null;
  sitemap_auto_update: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Lấy SEO settings
 */
export async function getSEOSettings() {
  const { data, error } = await supabase
    .from('seo_settings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
  return data as SEOSettings | null;
}

/**
 * Cập nhật SEO settings
 */
export async function updateSEOSettings(settings: Partial<SEOSettings>) {
  // First, check if settings exist
  const existing = await getSEOSettings();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('seo_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data as SEOSettings;
  } else {
    // Create new
    const { data, error } = await supabase.from('seo_settings').insert(settings).select().single();

    if (error) throw error;
    return data as SEOSettings;
  }
}

// ========================================
// SITEMAP MANAGEMENT
// ========================================

export interface Sitemap {
  id: string;
  domain_id: string;
  url: string;
  total_urls: number;
  last_generated: string;
  file_size?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Lấy sitemaps của domain
 */
export async function getSitemaps(domain_id?: string) {
  let query = supabase
    .from('seo_sitemaps')
    .select('*')
    .order('last_generated', { ascending: false });

  if (domain_id) {
    query = query.eq('domain_id', domain_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as Sitemap[];
}

/**
 * Tạo/cập nhật sitemap
 */
export async function upsertSitemap(
  domain_id: string,
  url: string,
  total_urls: number,
  file_size?: string
) {
  const { data, error } = await supabase
    .from('seo_sitemaps')
    .upsert({
      domain_id,
      url,
      total_urls,
      file_size,
      last_generated: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Sitemap;
}
