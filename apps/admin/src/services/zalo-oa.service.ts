/**
 * =================================================================
 * ZALO OA SERVICE - API Service for Zalo Official Account
 * =================================================================
 * Handles all Zalo OA API communications for SABO Billiards
 * Uses Supabase for data persistence
 */

import { supabase } from '@/lib/supabase';
import type {
  ZaloAPIResponse,
  ZaloCustomer,
  ZaloFollowersResponse,
  ZaloOAConfig,
  ZaloOAInfo,
  ZaloOAStats,
  ZaloSendMessageResponse,
  ZaloUser,
  MessageTemplate,
  ReviewRequestStatus,
  ReviewRequestBatch,
} from '@/types/zalo-oa';

// SABO Billiards config
const SABO_CONFIG = {
  name: 'SABO Billiards',
  phone: '0329640232',
  address: '601A Nguyen An Ninh, Vung Tau',
  reviewLink: 'https://g.page/r/CcmLuIW4i-kYEAE/review',
  mapsLink: 'https://www.google.com/maps/place/?q=place_id:ChIJGTffkKhvdTERiIvpBbiMu8k',
  placeId: 'ChIJGTffkKhvdTERiIvpBbiMu8k',
};

// Default OA ID
const DEFAULT_OA_ID = '3494355851305108700';

// API base URL - connects to backend
const API_BASE = '/api/zalo-oa';

class ZaloOAService {
  private config: ZaloOAConfig;
  private readonly oaId: string = DEFAULT_OA_ID;

  constructor() {
    this.config = {
      oaId: DEFAULT_OA_ID,
      appId: '576734226650074749',
      accessToken: '',
      refreshToken: '',
      businessInfo: SABO_CONFIG,
    };
  }

  // ===================== OA Info =====================
  
  /**
   * Get Zalo OA information from database
   */
  async getOAInfo(): Promise<ZaloAPIResponse<ZaloOAInfo>> {
    try {
      const { data, error } = await supabase
        .from('zalo_oa_config')
        .select('*')
        .eq('oa_id', this.oaId)
        .single();

      if (error || !data) {
        return this.getFallbackOAInfo();
      }

      return {
        error: 0,
        message: 'Success',
        data: {
          oa_id: data.oa_id,
          name: data.oa_name,
          description: `Câu lạc bộ Billiards tại ${data.business_address}`,
          num_follower: data.num_followers || 0,
          is_verified: false,
          package_name: 'Gói Dùng Thử',
        },
      };
    } catch (error) {
      console.error('Failed to get OA info:', error);
      return this.getFallbackOAInfo();
    }
  }

  private getFallbackOAInfo(): ZaloAPIResponse<ZaloOAInfo> {
    return {
      error: 0,
      message: 'Success',
      data: {
        oa_id: this.oaId,
        name: 'SABO Billiards',
        description: 'Câu lạc bộ Billiards chuyên nghiệp tại Vũng Tàu',
        num_follower: 10,
        is_verified: false,
        package_name: 'Gói Dùng Thử',
      },
    };
  }

  /**
   * Get dashboard stats from database
   */
  async getStats(): Promise<ZaloOAStats> {
    try {
      // Get customer counts
      const { count: totalCustomers } = await supabase
        .from('zalo_customers')
        .select('*', { count: 'exact', head: true })
        .eq('oa_id', this.oaId);

      const { count: contacted } = await supabase
        .from('zalo_customers')
        .select('*', { count: 'exact', head: true })
        .eq('oa_id', this.oaId)
        .neq('status', 'pending');

      const { count: reviewed } = await supabase
        .from('zalo_customers')
        .select('*', { count: 'exact', head: true })
        .eq('oa_id', this.oaId)
        .eq('status', 'reviewed');

      // Get OA config for followers
      const { data: oaConfig } = await supabase
        .from('zalo_oa_config')
        .select('num_followers')
        .eq('oa_id', this.oaId)
        .single();

      const total = totalCustomers || 0;
      const sent = contacted || 0;

      return {
        totalFollowers: oaConfig?.num_followers || 10,
        totalCustomers: total,
        customersContacted: sent,
        reviewsSent: reviewed || 0,
        successRate: total > 0 ? Math.round((sent / total) * 100) : 0,
        lastSyncAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {
        totalFollowers: 10,
        totalCustomers: 0,
        customersContacted: 0,
        reviewsSent: 0,
        successRate: 0,
        lastSyncAt: new Date().toISOString(),
      };
    }
  }

  // ===================== Followers =====================
  
  async getFollowers(offset = 0, count = 50): Promise<ZaloAPIResponse<ZaloFollowersResponse>> {
    try {
      const response = await fetch(`${API_BASE}/followers?offset=${offset}&count=${count}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to get followers:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<ZaloAPIResponse<ZaloUser>> {
    try {
      const response = await fetch(`${API_BASE}/user/${userId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  // ===================== Customers (Supabase) =====================
  
  /**
   * Get all customers from Supabase
   */
  async getCustomers(): Promise<ZaloCustomer[]> {
    try {
      const { data, error } = await supabase
        .from('zalo_customers')
        .select('*')
        .eq('oa_id', this.oaId)
        .order('name');

      if (error) {
        console.error('Failed to get customers:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        zaloUserId: row.zalo_user_id || undefined,
        isFollower: row.is_follower || false,
        status: row.status as ZaloCustomer['status'],
        notes: row.notes || undefined,
        reviewSentAt: row.last_sent_at || undefined,
      }));
    } catch (error) {
      console.error('Failed to get customers:', error);
      return [];
    }
  }

  /**
   * Add new customer to Supabase
   */
  async addCustomer(customer: Omit<ZaloCustomer, 'id' | 'status'>): Promise<ZaloCustomer | null> {
    try {
      const { data, error } = await supabase
        .from('zalo_customers')
        .insert({
          oa_id: this.oaId,
          name: customer.name,
          phone: customer.phone,
          zalo_user_id: customer.zaloUserId || null,
          is_follower: customer.isFollower || false,
          status: 'pending',
          notes: customer.notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to add customer:', error);
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        phone: data.phone,
        zaloUserId: data.zalo_user_id || undefined,
        isFollower: data.is_follower || false,
        status: data.status as ZaloCustomer['status'],
      };
    } catch (error) {
      console.error('Failed to add customer:', error);
      return null;
    }
  }

  /**
   * Update customer status in Supabase
   */
  async updateCustomerStatus(
    customerId: string,
    status: ZaloCustomer['status'],
    additionalData?: Partial<ZaloCustomer>
  ): Promise<boolean> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (additionalData?.zaloUserId) {
        updateData.zalo_user_id = additionalData.zaloUserId;
      }
      if (additionalData?.isFollower !== undefined) {
        updateData.is_follower = additionalData.isFollower;
      }
      if (additionalData?.reviewSentAt) {
        updateData.last_sent_at = additionalData.reviewSentAt;
      }
      if (status === 'sent' || status === 'reviewed') {
        updateData.last_sent_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('zalo_customers')
        .update(updateData)
        .eq('id', customerId);

      if (error) {
        console.error('Failed to update customer:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update customer:', error);
      return false;
    }
  }

  /**
   * Delete customer from Supabase
   */
  async deleteCustomer(customerId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('zalo_customers')
        .delete()
        .eq('id', customerId);

      return !error;
    } catch {
      return false;
    }
  }

  // ===================== Messages =====================
  
  async sendMessage(userId: string, message: string): Promise<ZaloAPIResponse<ZaloSendMessageResponse>> {
    try {
      const response = await fetch(`${API_BASE}/message/send`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, message }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Send review request message
   */
  async sendReviewRequest(userId: string, customerName: string): Promise<ZaloAPIResponse<ZaloSendMessageResponse>> {
    const message = `🎱 Xin chào ${customerName}!

Cảm ơn bạn đã đến chơi tại SABO Billiards!

⭐ Nếu hài lòng với dịch vụ, xin bạn dành 30 giây đánh giá 5 sao cho SABO nhé!

Mỗi đánh giá của bạn giúp SABO phục vụ tốt hơn! ❤️`;

    const buttons = [
      {
        type: 'oa.open.url' as const,
        title: '⭐ Đánh giá 5 sao',
        payload: { url: this.config.businessInfo.reviewLink },
      },
      {
        type: 'oa.open.url' as const,
        title: '📍 Xem trên Maps',
        payload: { url: this.config.businessInfo.mapsLink },
      },
    ];

    try {
      const response = await fetch(`${API_BASE}/message/button`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ userId, text: message, buttons }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to send review request:', error);
      throw error;
    }
  }

  /**
   * Batch send review requests
   */
  async batchSendReviewRequests(
    customers: ZaloCustomer[],
    onProgress?: (status: ReviewRequestStatus) => void
  ): Promise<ReviewRequestBatch> {
    const batch: ReviewRequestBatch = {
      id: `batch_${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalCustomers: customers.length,
      successCount: 0,
      failedCount: 0,
      pendingCount: customers.length,
      results: [],
    };

    // Create batch job in database
    await supabase.from('zalo_batch_jobs').insert({
      oa_id: this.oaId,
      batch_name: `Review Request ${new Date().toLocaleDateString('vi-VN')}`,
      message_type: 'review_request',
      total_count: customers.length,
      status: 'running',
      started_at: new Date().toISOString(),
    });

    for (const customer of customers) {
      const status: ReviewRequestStatus = {
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        status: 'pending',
      };

      try {
        if (customer.zaloUserId) {
          const result = await this.sendReviewRequest(customer.zaloUserId, customer.name);
          
          if (result.error === 0 && result.data) {
            status.status = 'success';
            status.messageId = result.data.message_id;
            status.sentAt = new Date().toISOString();
            batch.successCount++;
            
            await this.updateCustomerStatus(customer.id, 'sent');
            
            // Log message to database
            await supabase.from('zalo_messages').insert({
              oa_id: this.oaId,
              customer_id: customer.id,
              customer_name: customer.name,
              customer_phone: customer.phone,
              message_type: 'review_request',
              content: `Review request sent`,
              status: 'sent',
              zalo_message_id: result.data.message_id,
            });
          } else {
            status.status = 'failed';
            status.errorMessage = result.message;
            batch.failedCount++;
          }
        } else {
          status.status = 'not_following';
          status.errorMessage = 'Khách hàng chưa follow OA';
          batch.failedCount++;
        }
      } catch (error) {
        status.status = 'failed';
        status.errorMessage = error instanceof Error ? error.message : 'Unknown error';
        batch.failedCount++;
      }

      batch.pendingCount--;
      batch.results.push(status);
      onProgress?.(status);

      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update batch job
    await supabase
      .from('zalo_batch_jobs')
      .update({
        success_count: batch.successCount,
        failed_count: batch.failedCount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', batch.id);
    
    return batch;
  }

  // ===================== Message History =====================
  
  /**
   * Get message history from database
   */
  async getMessageHistory(limit = 50): Promise<Array<{
    id: string;
    customerName: string;
    customerPhone: string;
    messageType: string;
    status: string;
    sentAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('zalo_messages')
        .select('*')
        .eq('oa_id', this.oaId)
        .order('sent_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to get message history:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        customerName: row.customer_name || 'Unknown',
        customerPhone: row.customer_phone || '',
        messageType: row.message_type,
        status: row.status,
        sentAt: row.sent_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get batch history from database
   */
  async getBatchHistory(): Promise<Array<{
    id: string;
    batchName: string;
    totalCount: number;
    successCount: number;
    failedCount: number;
    status: string;
    createdAt: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from('zalo_batch_jobs')
        .select('*')
        .eq('oa_id', this.oaId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Failed to get batch history:', error);
        return [];
      }

      return (data || []).map(row => ({
        id: row.id,
        batchName: row.batch_name || 'Batch',
        totalCount: row.total_count || 0,
        successCount: row.success_count || 0,
        failedCount: row.failed_count || 0,
        status: row.status,
        createdAt: row.created_at,
      }));
    } catch {
      return [];
    }
  }

  // ===================== Templates =====================
  
  getTemplates(): MessageTemplate[] {
    return [
      {
        id: 'review_request',
        name: 'Xin đánh giá 5 sao',
        type: 'review_request',
        content: `🎱 Xin chào {name}!

Cảm ơn bạn đã đến chơi tại SABO Billiards!

⭐ Nếu hài lòng với dịch vụ, xin bạn dành 30 giây đánh giá 5 sao cho SABO nhé!

Mỗi đánh giá của bạn giúp SABO phục vụ tốt hơn! ❤️`,
        buttons: [
          {
            type: 'oa.open.url',
            title: '⭐ Đánh giá 5 sao',
            payload: { url: SABO_CONFIG.reviewLink },
          },
        ],
        isActive: true,
      },
      {
        id: 'welcome',
        name: 'Chào mừng khách mới',
        type: 'welcome',
        content: `👋 Chào mừng {name} đến với SABO Billiards!

🎱 Địa chỉ: 601A Nguyễn An Ninh, Vũng Tàu
📞 Hotline: 0329 640 232

Hẹn gặp bạn tại SABO! 🎯`,
        isActive: true,
      },
    ];
  }

  // ===================== Token Management =====================
  
  async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/refresh-token`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      const result = await response.json();
      
      if (result.error === 0 && result.data?.access_token) {
        this.config.accessToken = result.data.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  }

  // ===================== Helpers =====================
  
  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.accessToken}`,
    };
  }

  getConfig(): ZaloOAConfig {
    return this.config;
  }

  updateConfig(config: Partial<ZaloOAConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Singleton instance
let serviceInstance: ZaloOAService | null = null;

export function getZaloOAService(): ZaloOAService {
  serviceInstance ??= new ZaloOAService();
  return serviceInstance;
}

export function resetZaloOAService(): void {
  serviceInstance = null;
}

export { ZaloOAService };
