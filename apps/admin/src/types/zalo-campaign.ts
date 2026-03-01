/**
 * =================================================================
 * ZALO CAMPAIGN TYPES - Type definitions for Campaign System
 * =================================================================
 */

// ============= Campaign =============
export type CampaignType = 'warmup' | 'voucher' | 'review_request' | 'promotion' | 'reminder';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
export type TargetSegment = 'all' | 'cold' | 'warm' | 'hot' | 'vip' | 'never_visited' | 'custom';
export type CustomerSegment = 'cold' | 'warm' | 'hot' | 'vip';

export interface Campaign {
  id: string;
  oaId: string;
  name: string;
  description?: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  targetSegment: TargetSegment;
  targetFilter?: Record<string, unknown>;
  messageTemplateId?: string;
  
  // Stats
  totalTargets: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  convertedCount: number;
  
  // Settings
  delayBetweenMessages: number;
  autoFollowup: boolean;
  followupDays: number;
  
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= Voucher =============
export type VoucherType = 'free_time' | 'discount_percent' | 'discount_amount' | 'free_drink' | 'custom';
export type VoucherStatus = 'active' | 'expired' | 'depleted' | 'cancelled';

export interface Voucher {
  id: string;
  oaId: string;
  campaignId?: string;
  code: string;
  title: string;
  description?: string;
  voucherType: VoucherType;
  value: number;
  valueUnit: string;
  minSpend: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  maxUsesPerCustomer: number;
  currentUses: number;
  status: VoucherStatus;
  termsConditions?: string;
  applicableDays: string[];
  applicableHours?: string;
  createdAt: string;
  updatedAt: string;
}

// ============= Customer Voucher =============
export type CustomerVoucherStatus = 'assigned' | 'sent' | 'viewed' | 'used' | 'expired';

export interface CustomerVoucher {
  id: string;
  voucherId: string;
  customerId: string;
  campaignId?: string;
  personalCode: string;
  status: CustomerVoucherStatus;
  assignedAt: string;
  sentAt?: string;
  viewedAt?: string;
  usedAt?: string;
  expiredAt?: string;
  usedAmount?: number;
  orderAmount?: number;
  
  // Joined data
  customer?: {
    name: string;
    phone: string;
  };
  voucher?: Voucher;
}

// ============= Message Template =============
export type TemplateType = 'warmup_voucher' | 'voucher_reminder' | 'review_request' | 'thank_you' | 'promotion' | 'custom';

export interface MessageTemplate {
  id: string;
  oaId: string;
  name: string;
  templateType: TemplateType;
  content: string;
  contentVariables: string[];
  buttons: Array<{
    type: string;
    title: string;
    payload: { url?: string };
  }>;
  previewImageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============= Campaign Target =============
export type TargetStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'converted' | 'failed' | 'skipped';

export interface CampaignTarget {
  id: string;
  campaignId: string;
  customerId: string;
  status: TargetStatus;
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  clickedAt?: string;
  convertedAt?: string;
  errorMessage?: string;
  retryCount: number;
  messageId?: string;
  voucherCode?: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined
  customer?: {
    id: string;
    name: string;
    phone: string;
    zaloUserId?: string;
    isFollower: boolean;
    customerSegment: CustomerSegment;
  };
}

// ============= Tracking Event =============
export type EventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'voucher_viewed' | 'voucher_used' | 'followed' | 'unfollowed' | 'replied';

export interface TrackingEvent {
  id: string;
  campaignId?: string;
  customerId?: string;
  voucherId?: string;
  messageId?: string;
  eventType: EventType;
  eventData: Record<string, unknown>;
  source: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ============= Campaign Stats =============
export interface CampaignStats {
  totalTargets: number;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  converted: number;
  failed: number;
  pending: number;
  
  // Rates
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

// ============= Create/Update DTOs =============
export interface CreateCampaignDTO {
  name: string;
  description?: string;
  campaignType: CampaignType;
  targetSegment: TargetSegment;
  messageTemplateId?: string;
  scheduledAt?: string;
  delayBetweenMessages?: number;
  autoFollowup?: boolean;
  followupDays?: number;
}

export interface CreateVoucherDTO {
  campaignId?: string;
  title: string;
  description?: string;
  voucherType: VoucherType;
  value: number;
  valueUnit?: string;
  validUntil: string;
  maxUses?: number;
  termsConditions?: string;
}

// ============= Warm Up Campaign Config =============
export interface WarmUpConfig {
  campaignName: string;
  voucherValue: number; // minutes
  voucherValidDays: number;
  messageDelay: number; // ms between messages
  autoReminder: boolean;
  reminderDays: number; // days before expiry
}
