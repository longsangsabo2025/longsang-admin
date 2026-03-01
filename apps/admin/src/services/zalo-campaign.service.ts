/**
 * =================================================================
 * ZALO CAMPAIGN SERVICE - Campaign Management System
 * =================================================================
 * Hệ thống quản lý chiến dịch warm-up khách hàng SABO Billiards
 */

import { supabase } from '@/lib/supabase';
import type {
  Campaign,
  CampaignStats,
  CampaignTarget,
  CampaignType,
  CreateCampaignDTO,
  CreateVoucherDTO,
  CustomerVoucher,
  MessageTemplate,
  TargetSegment,
  Voucher,
  WarmUpConfig,
} from '@/types/zalo-campaign';

const DEFAULT_OA_ID = '3494355851305108700';

class ZaloCampaignService {
  private readonly oaId: string = DEFAULT_OA_ID;

  // ===================== CAMPAIGNS =====================

  /**
   * Get all campaigns
   */
  async getCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('zalo_campaigns')
      .select('*')
      .eq('oa_id', this.oaId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get campaigns:', error);
      return [];
    }

    return (data || []).map(this.mapCampaign);
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(id: string): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('zalo_campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapCampaign(data);
  }

  /**
   * Create new campaign
   */
  async createCampaign(dto: CreateCampaignDTO): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('zalo_campaigns')
      .insert({
        oa_id: this.oaId,
        name: dto.name,
        description: dto.description,
        campaign_type: dto.campaignType,
        target_segment: dto.targetSegment,
        message_template_id: dto.messageTemplateId,
        scheduled_at: dto.scheduledAt,
        delay_between_messages: dto.delayBetweenMessages || 3000,
        auto_followup: dto.autoFollowup || false,
        followup_days: dto.followupDays || 7,
        status: 'draft',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create campaign:', error);
      return null;
    }

    return this.mapCampaign(data);
  }

  /**
   * Update campaign status
   */
  async updateCampaignStatus(id: string, status: Campaign['status']): Promise<boolean> {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    
    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'cancelled') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('zalo_campaigns')
      .update(updates)
      .eq('id', id);

    return !error;
  }

  /**
   * Get campaign stats
   */
  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const { data } = await supabase
      .from('zalo_campaign_targets')
      .select('status')
      .eq('campaign_id', campaignId);

    const targets = data || [];
    const total = targets.length;
    const sent = targets.filter(t => t.status !== 'pending' && t.status !== 'skipped').length;
    const delivered = targets.filter(t => ['delivered', 'opened', 'clicked', 'converted'].includes(t.status)).length;
    const opened = targets.filter(t => ['opened', 'clicked', 'converted'].includes(t.status)).length;
    const clicked = targets.filter(t => ['clicked', 'converted'].includes(t.status)).length;
    const converted = targets.filter(t => t.status === 'converted').length;
    const failed = targets.filter(t => t.status === 'failed').length;
    const pending = targets.filter(t => t.status === 'pending').length;

    return {
      totalTargets: total,
      sent,
      delivered,
      opened,
      clicked,
      converted,
      failed,
      pending,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
      clickRate: opened > 0 ? (clicked / opened) * 100 : 0,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
    };
  }

  // ===================== VOUCHERS =====================

  /**
   * Create voucher for campaign
   */
  async createVoucher(dto: CreateVoucherDTO): Promise<Voucher | null> {
    const code = this.generateVoucherCode();
    
    const { data, error } = await supabase
      .from('zalo_vouchers')
      .insert({
        oa_id: this.oaId,
        campaign_id: dto.campaignId,
        code,
        title: dto.title,
        description: dto.description,
        voucher_type: dto.voucherType,
        value: dto.value,
        value_unit: dto.valueUnit || 'minutes',
        valid_until: dto.validUntil,
        max_uses: dto.maxUses || 999,
        terms_conditions: dto.termsConditions,
        status: 'active',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to create voucher:', error);
      return null;
    }

    return this.mapVoucher(data);
  }

  /**
   * Get vouchers for campaign
   */
  async getVouchers(campaignId?: string): Promise<Voucher[]> {
    let query = supabase
      .from('zalo_vouchers')
      .select('*')
      .eq('oa_id', this.oaId);

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map(this.mapVoucher);
  }

  /**
   * Assign voucher to customer
   */
  async assignVoucherToCustomer(
    voucherId: string,
    customerId: string,
    campaignId?: string
  ): Promise<CustomerVoucher | null> {
    const personalCode = this.generatePersonalCode();

    const { data, error } = await supabase
      .from('zalo_customer_vouchers')
      .insert({
        voucher_id: voucherId,
        customer_id: customerId,
        campaign_id: campaignId,
        personal_code: personalCode,
        status: 'assigned',
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to assign voucher:', error);
      return null;
    }

    return this.mapCustomerVoucher(data);
  }

  /**
   * Update customer voucher status
   */
  async updateCustomerVoucherStatus(
    id: string,
    status: CustomerVoucher['status']
  ): Promise<boolean> {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'viewed') updates.viewed_at = new Date().toISOString();
    if (status === 'used') updates.used_at = new Date().toISOString();
    if (status === 'expired') updates.expired_at = new Date().toISOString();

    const { error } = await supabase
      .from('zalo_customer_vouchers')
      .update(updates)
      .eq('id', id);

    return !error;
  }

  // ===================== MESSAGE TEMPLATES =====================

  /**
   * Get all message templates
   */
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    const { data, error } = await supabase
      .from('zalo_message_templates')
      .select('*')
      .eq('oa_id', this.oaId)
      .eq('is_active', true)
      .order('created_at');

    if (error) return [];
    return (data || []).map(this.mapTemplate);
  }

  /**
   * Get template by type
   */
  async getTemplateByType(type: string): Promise<MessageTemplate | null> {
    const { data, error } = await supabase
      .from('zalo_message_templates')
      .select('*')
      .eq('oa_id', this.oaId)
      .eq('template_type', type)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return this.mapTemplate(data);
  }

  // ===================== CAMPAIGN TARGETS =====================

  /**
   * Add targets to campaign based on segment
   */
  async addTargetsToCampaign(campaignId: string, segment: TargetSegment): Promise<number> {
    // Get customers based on segment
    let query = supabase
      .from('zalo_customers')
      .select('id')
      .eq('oa_id', this.oaId)
      .eq('opted_out', false);

    if (segment === 'cold') {
      query = query.eq('customer_segment', 'cold');
    } else if (segment === 'warm') {
      query = query.eq('customer_segment', 'warm');
    } else if (segment === 'hot') {
      query = query.eq('customer_segment', 'hot');
    } else if (segment === 'vip') {
      query = query.eq('customer_segment', 'vip');
    }
    // 'all' = no additional filter

    const { data: customers } = await query;

    if (!customers || customers.length === 0) return 0;

    // Insert targets
    const targets = customers.map(c => ({
      campaign_id: campaignId,
      customer_id: c.id,
      status: 'pending',
    }));

    const { error } = await supabase
      .from('zalo_campaign_targets')
      .insert(targets);

    if (error) {
      console.error('Failed to add targets:', error);
      return 0;
    }

    // Update campaign total
    await supabase
      .from('zalo_campaigns')
      .update({ total_targets: customers.length })
      .eq('id', campaignId);

    return customers.length;
  }

  /**
   * Get campaign targets with customer info
   */
  async getCampaignTargets(campaignId: string): Promise<CampaignTarget[]> {
    const { data, error } = await supabase
      .from('zalo_campaign_targets')
      .select(`
        *,
        customer:zalo_customers(id, name, phone, zalo_user_id, is_follower, customer_segment)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at');

    if (error) return [];
    return (data || []).map(this.mapTarget);
  }

  /**
   * Update target status
   */
  async updateTargetStatus(
    targetId: string,
    status: CampaignTarget['status'],
    messageId?: string,
    errorMessage?: string
  ): Promise<boolean> {
    const updates: Record<string, unknown> = { 
      status,
      updated_at: new Date().toISOString(),
    };
    
    if (messageId) updates.message_id = messageId;
    if (errorMessage) updates.error_message = errorMessage;
    if (status === 'sent') updates.sent_at = new Date().toISOString();
    if (status === 'delivered') updates.delivered_at = new Date().toISOString();
    if (status === 'opened') updates.opened_at = new Date().toISOString();
    if (status === 'clicked') updates.clicked_at = new Date().toISOString();
    if (status === 'converted') updates.converted_at = new Date().toISOString();

    const { error } = await supabase
      .from('zalo_campaign_targets')
      .update(updates)
      .eq('id', targetId);

    return !error;
  }

  // ===================== WARM UP CAMPAIGN =====================

  /**
   * Create complete warm-up campaign with voucher
   */
  async createWarmUpCampaign(config: WarmUpConfig): Promise<{
    campaign: Campaign;
    voucher: Voucher;
    targetCount: number;
  } | null> {
    try {
      // 1. Create campaign
      const campaign = await this.createCampaign({
        name: config.campaignName,
        description: `Chiến dịch warm-up với voucher ${config.voucherValue} phút free`,
        campaignType: 'warmup',
        targetSegment: 'cold',
        delayBetweenMessages: config.messageDelay,
        autoFollowup: config.autoReminder,
        followupDays: config.reminderDays,
      });

      if (!campaign) throw new Error('Failed to create campaign');

      // 2. Create voucher
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + config.voucherValidDays);

      const voucher = await this.createVoucher({
        campaignId: campaign.id,
        title: `${config.voucherValue} phút FREE`,
        description: `Voucher miễn phí ${config.voucherValue} phút chơi bi-a tại SABO Billiards`,
        voucherType: 'free_time',
        value: config.voucherValue,
        validUntil: validUntil.toISOString(),
        termsConditions: 'Áp dụng từ 9h-22h. Mỗi khách chỉ sử dụng 1 lần.',
      });

      if (!voucher) throw new Error('Failed to create voucher');

      // 3. Add targets
      const targetCount = await this.addTargetsToCampaign(campaign.id, 'cold');

      return { campaign, voucher, targetCount };
    } catch (error) {
      console.error('Failed to create warm-up campaign:', error);
      return null;
    }
  }

  // ===================== TRACKING =====================

  /**
   * Log tracking event
   */
  async logEvent(
    eventType: string,
    data: {
      campaignId?: string;
      customerId?: string;
      voucherId?: string;
      messageId?: string;
      eventData?: Record<string, unknown>;
    }
  ): Promise<void> {
    await supabase.from('zalo_tracking_events').insert({
      campaign_id: data.campaignId,
      customer_id: data.customerId,
      voucher_id: data.voucherId,
      message_id: data.messageId,
      event_type: eventType,
      event_data: data.eventData || {},
      source: 'zalo_oa',
    });
  }

  // ===================== HELPERS =====================

  private generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SABO';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generatePersonalCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SB${timestamp}${random}`;
  }

  private mapCampaign(row: Record<string, unknown>): Campaign {
    return {
      id: row.id as string,
      oaId: row.oa_id as string,
      name: row.name as string,
      description: row.description as string,
      campaignType: row.campaign_type as CampaignType,
      status: row.status as Campaign['status'],
      scheduledAt: row.scheduled_at as string,
      startedAt: row.started_at as string,
      completedAt: row.completed_at as string,
      targetSegment: row.target_segment as TargetSegment,
      targetFilter: row.target_filter as Record<string, unknown>,
      messageTemplateId: row.message_template_id as string,
      totalTargets: (row.total_targets as number) || 0,
      sentCount: (row.sent_count as number) || 0,
      deliveredCount: (row.delivered_count as number) || 0,
      openedCount: (row.opened_count as number) || 0,
      clickedCount: (row.clicked_count as number) || 0,
      convertedCount: (row.converted_count as number) || 0,
      delayBetweenMessages: (row.delay_between_messages as number) || 3000,
      autoFollowup: (row.auto_followup as boolean) || false,
      followupDays: (row.followup_days as number) || 7,
      createdBy: row.created_by as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapVoucher(row: Record<string, unknown>): Voucher {
    return {
      id: row.id as string,
      oaId: row.oa_id as string,
      campaignId: row.campaign_id as string,
      code: row.code as string,
      title: row.title as string,
      description: row.description as string,
      voucherType: row.voucher_type as Voucher['voucherType'],
      value: row.value as number,
      valueUnit: row.value_unit as string,
      minSpend: (row.min_spend as number) || 0,
      maxDiscount: row.max_discount as number,
      validFrom: row.valid_from as string,
      validUntil: row.valid_until as string,
      maxUses: (row.max_uses as number) || 1,
      maxUsesPerCustomer: (row.max_uses_per_customer as number) || 1,
      currentUses: (row.current_uses as number) || 0,
      status: row.status as Voucher['status'],
      termsConditions: row.terms_conditions as string,
      applicableDays: (row.applicable_days as string[]) || [],
      applicableHours: row.applicable_hours as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapCustomerVoucher(row: Record<string, unknown>): CustomerVoucher {
    return {
      id: row.id as string,
      voucherId: row.voucher_id as string,
      customerId: row.customer_id as string,
      campaignId: row.campaign_id as string,
      personalCode: row.personal_code as string,
      status: row.status as CustomerVoucher['status'],
      assignedAt: row.assigned_at as string,
      sentAt: row.sent_at as string,
      viewedAt: row.viewed_at as string,
      usedAt: row.used_at as string,
      expiredAt: row.expired_at as string,
      usedAmount: row.used_amount as number,
      orderAmount: row.order_amount as number,
    };
  }

  private mapTemplate(row: Record<string, unknown>): MessageTemplate {
    return {
      id: row.id as string,
      oaId: row.oa_id as string,
      name: row.name as string,
      templateType: row.template_type as MessageTemplate['templateType'],
      content: row.content as string,
      contentVariables: (row.content_variables as string[]) || [],
      buttons: (row.buttons as MessageTemplate['buttons']) || [],
      previewImageUrl: row.preview_image_url as string,
      isActive: row.is_active as boolean,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  private mapTarget(row: Record<string, unknown>): CampaignTarget {
    const customer = row.customer as Record<string, unknown> | null;
    return {
      id: row.id as string,
      campaignId: row.campaign_id as string,
      customerId: row.customer_id as string,
      status: row.status as CampaignTarget['status'],
      sentAt: row.sent_at as string,
      deliveredAt: row.delivered_at as string,
      openedAt: row.opened_at as string,
      clickedAt: row.clicked_at as string,
      convertedAt: row.converted_at as string,
      errorMessage: row.error_message as string,
      retryCount: (row.retry_count as number) || 0,
      messageId: row.message_id as string,
      voucherCode: row.voucher_code as string,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      customer: customer ? {
        id: customer.id as string,
        name: customer.name as string,
        phone: customer.phone as string,
        zaloUserId: customer.zalo_user_id as string,
        isFollower: customer.is_follower as boolean,
        customerSegment: customer.customer_segment as 'cold' | 'warm' | 'hot',
      } : undefined,
    };
  }
}

// Singleton
let instance: ZaloCampaignService | null = null;

export function getZaloCampaignService(): ZaloCampaignService {
  instance ??= new ZaloCampaignService();
  return instance;
}

export { ZaloCampaignService };
