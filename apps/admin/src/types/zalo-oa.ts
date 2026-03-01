/**
 * =================================================================
 * ZALO OA TYPES - Type definitions for Zalo Official Account
 * =================================================================
 * For SABO Billiards Zalo OA Management
 */

// ============= OA Info =============
export interface ZaloOAInfo {
  oa_id: string;
  name: string;
  description?: string;
  avatar?: string;
  cover?: string;
  num_follower: number;
  is_verified?: boolean;
  package_name?: string;
  category?: string;
}

// ============= User/Follower =============
export interface ZaloUser {
  user_id: string;
  display_name: string;
  avatar?: string;
  user_id_by_app?: string;
  shared_info?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  tags_and_notes_info?: {
    notes?: string[];
    tag_names?: string[];
  };
}

export interface ZaloFollowersResponse {
  total: number;
  offset: number;
  count: number;
  followers: Array<{
    user_id: string;
  }>;
}

// ============= Customer =============
export interface ZaloCustomer {
  id: string;
  name: string;
  phone: string;
  zaloUserId?: string;
  isFollower?: boolean;
  lastContactedAt?: string;
  reviewSentAt?: string;
  tags?: string[];
  notes?: string;
  status: 'pending' | 'sent' | 'contacted' | 'reviewed' | 'not_following';
}

// ============= Message =============
export interface ZaloMessage {
  recipient: {
    user_id: string;
  };
  message: {
    text?: string;
    attachment?: {
      type: 'template' | 'file' | 'image';
      payload: ZaloMessagePayload;
    };
  };
}

export interface ZaloMessagePayload {
  template_type?: 'button' | 'list' | 'media';
  text?: string;
  buttons?: ZaloButton[];
  elements?: ZaloListElement[];
}

export interface ZaloButton {
  type: 'oa.open.url' | 'oa.query.show' | 'oa.query.hide' | 'oa.open.phone' | 'oa.open.sms';
  title: string;
  payload: {
    url?: string;
    content?: string;
    phone_code?: string;
  };
}

export interface ZaloListElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: {
    type: string;
    url: string;
  };
}

// ============= API Response =============
export interface ZaloAPIResponse<T = unknown> {
  error: number;
  message: string;
  data?: T;
}

export interface ZaloSendMessageResponse {
  message_id: string;
  user_id: string;
}

// ============= Review Request =============
export interface ReviewRequestStatus {
  customerId: string;
  customerName: string;
  phone: string;
  status: 'success' | 'failed' | 'pending' | 'not_following';
  sentAt?: string;
  messageId?: string;
  errorMessage?: string;
}

export interface ReviewRequestBatch {
  id: string;
  createdAt: string;
  totalCustomers: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  results: ReviewRequestStatus[];
}

// ============= Dashboard Stats =============
export interface ZaloOAStats {
  totalFollowers: number;
  totalCustomers: number;
  customersContacted: number;
  reviewsSent: number;
  successRate: number;
  lastSyncAt?: string;
}

// ============= Template =============
export interface MessageTemplate {
  id: string;
  name: string;
  type: 'review_request' | 'welcome' | 'promotion' | 'custom';
  content: string;
  buttons?: ZaloButton[];
  isActive: boolean;
}

// ============= Config =============
export interface ZaloOAConfig {
  oaId: string;
  appId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt?: string;
  businessInfo: {
    name: string;
    phone: string;
    address: string;
    reviewLink: string;
    mapsLink: string;
    placeId: string;
  };
}
