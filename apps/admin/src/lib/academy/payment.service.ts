/**
 * Payment & Subscription Service
 * Handles payments, coupons, and subscriptions for Academy
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/utils/logger';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_courses: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan?: SubscriptionPlan;
}

export interface CouponCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  min_purchase_amount: number;
  applicable_courses: string[];
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
}

export interface PaymentOrder {
  id: string;
  user_id: string;
  order_type: 'course' | 'subscription';
  course_id?: string;
  subscription_id?: string;
  amount: number;
  discount_amount: number;
  final_amount: number;
  currency: string;
  payment_method: string;
  payment_provider: string;
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_reference?: string;
  coupon_code?: string;
}

export interface CouponValidation {
  valid: boolean;
  message: string;
  discount_amount?: number;
  final_price?: number;
}

// ═══════════════════════════════════════════════════════════════
// PAYMENT SERVICE
// ═══════════════════════════════════════════════════════════════

export class PaymentService {
  /**
   * Get all subscription plans
   */
  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((plan) => ({
        ...plan,
        features: plan.features || [],
      }));
    } catch (error) {
      logger.error('Failed to get subscription plans', error);
      return [];
    }
  }

  /**
   * Get user's active subscription
   */
  static async getUserSubscription(): Promise<UserSubscription | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(
          `
          *,
          plan:subscription_plans(*)
        `
        )
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get user subscription', error);
      return null;
    }
  }

  /**
   * Validate coupon code
   */
  static async validateCoupon(
    code: string,
    courseId?: string,
    originalPrice?: number
  ): Promise<CouponValidation> {
    try {
      const { data: coupon, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        return { valid: false, message: 'Mã giảm giá không hợp lệ' };
      }

      // Check dates
      const now = new Date();
      if (new Date(coupon.valid_from) > now) {
        return { valid: false, message: 'Mã giảm giá chưa có hiệu lực' };
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { valid: false, message: 'Mã giảm giá đã hết hạn' };
      }

      // Check usage limit
      if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
        return { valid: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
      }

      // Check minimum purchase
      if (originalPrice && coupon.min_purchase_amount > originalPrice) {
        return {
          valid: false,
          message: `Đơn hàng tối thiểu ${(coupon.min_purchase_amount / 1000).toFixed(0)}K để sử dụng mã này`,
        };
      }

      // Check applicable courses
      if (courseId && coupon.applicable_courses.length > 0) {
        if (!coupon.applicable_courses.includes(courseId)) {
          return { valid: false, message: 'Mã giảm giá không áp dụng cho khóa học này' };
        }
      }

      // Calculate discount
      let discountAmount = 0;
      if (originalPrice) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (originalPrice * coupon.discount_value) / 100;
        } else {
          discountAmount = coupon.discount_value;
        }
        discountAmount = Math.min(discountAmount, originalPrice); // Can't discount more than price
      }

      return {
        valid: true,
        message:
          coupon.discount_type === 'percentage'
            ? `Giảm ${coupon.discount_value}%`
            : `Giảm ${(coupon.discount_value / 1000).toFixed(0)}K`,
        discount_amount: discountAmount,
        final_price: originalPrice ? originalPrice - discountAmount : undefined,
      };
    } catch (error) {
      logger.error('Failed to validate coupon', error);
      return { valid: false, message: 'Có lỗi xảy ra khi kiểm tra mã' };
    }
  }

  /**
   * Create payment order
   */
  static async createOrder(params: {
    orderType: 'course' | 'subscription';
    courseId?: string;
    planId?: string;
    billingCycle?: 'monthly' | 'yearly';
    couponCode?: string;
  }): Promise<PaymentOrder | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let amount = 0;
      let discountAmount = 0;

      // Get price based on order type
      if (params.orderType === 'course' && params.courseId) {
        const { data: course } = await supabase
          .from('courses')
          .select('price')
          .eq('id', params.courseId)
          .single();
        amount = course?.price || 0;
      } else if (params.orderType === 'subscription' && params.planId) {
        const { data: plan } = await supabase
          .from('subscription_plans')
          .select('price_monthly, price_yearly')
          .eq('id', params.planId)
          .single();
        amount = params.billingCycle === 'yearly' ? plan?.price_yearly : plan?.price_monthly;
      }

      // Apply coupon
      if (params.couponCode && amount > 0) {
        const validation = await this.validateCoupon(params.couponCode, params.courseId, amount);
        if (validation.valid && validation.discount_amount) {
          discountAmount = validation.discount_amount;
        }
      }

      const finalAmount = amount - discountAmount;

      const { data: order, error } = await supabase
        .from('payment_orders')
        .insert({
          user_id: user.id,
          order_type: params.orderType,
          course_id: params.courseId,
          amount,
          discount_amount: discountAmount,
          final_amount: finalAmount,
          currency: 'VND',
          payment_status: 'pending',
          coupon_code: params.couponCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Update coupon usage
      if (params.couponCode) {
        await supabase
          .from('coupon_codes')
          .update({ current_uses: supabase.rpc('increment_column', { x: 1 }) })
          .eq('code', params.couponCode.toUpperCase());
      }

      logger.info('Payment order created', { orderId: order.id, amount: finalAmount });
      return order;
    } catch (error) {
      logger.error('Failed to create payment order', error);
      return null;
    }
  }

  /**
   * Complete payment (called after successful payment from provider)
   */
  static async completePayment(
    orderId: string,
    paymentMethod: string,
    paymentProvider: string,
    paymentReference: string
  ): Promise<boolean> {
    try {
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .update({
          payment_status: 'completed',
          payment_method: paymentMethod,
          payment_provider: paymentProvider,
          payment_reference: paymentReference,
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) throw orderError;

      // Handle post-payment actions
      if (order.order_type === 'course' && order.course_id) {
        // Enroll user in course
        await supabase.from('course_enrollments').insert({
          user_id: order.user_id,
          course_id: order.course_id,
        });

        // Create instructor earning record
        const { data: course } = await supabase
          .from('courses')
          .select('instructor_id')
          .eq('id', order.course_id)
          .single();

        if (course?.instructor_id) {
          const platformFee = order.final_amount * 0.3; // 30% platform fee
          await supabase.from('instructor_earnings').insert({
            instructor_id: course.instructor_id,
            course_id: order.course_id,
            order_id: order.id,
            gross_amount: order.final_amount,
            platform_fee: platformFee,
            net_amount: order.final_amount - platformFee,
            status: 'pending',
          });
        }
      } else if (order.order_type === 'subscription') {
        // Activate subscription
        // This would be handled by the subscription creation flow
      }

      logger.info('Payment completed', { orderId, paymentReference });
      return true;
    } catch (error) {
      logger.error('Failed to complete payment', error);
      return false;
    }
  }

  /**
   * Get user's payment history
   */
  static async getPaymentHistory(): Promise<PaymentOrder[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('payment_orders')
        .select(
          `
          *,
          course:courses(id, title, thumbnail_url)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Failed to get payment history', error);
      return [];
    }
  }

  /**
   * Format price for display (VND)
   */
  static formatPrice(price: number): string {
    if (price === 0) return 'Miễn phí';
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M đ`;
    }
    return `${(price / 1000).toFixed(0)}K đ`;
  }
}
