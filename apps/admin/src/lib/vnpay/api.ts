/**
 * VNPay Payment API Client
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface VNPayPaymentRequest {
  planId: string;
  userId: string;
  amount?: number;
  orderInfo?: string;
}

export interface VNPayPaymentResponse {
  success: boolean;
  paymentUrl: string;
  orderId: string;
  amount: number;
}

/**
 * Create VNPay payment URL
 */
export async function createVNPayPayment(
  request: VNPayPaymentRequest
): Promise<VNPayPaymentResponse> {
  const response = await fetch(`${API_URL}/api/vnpay/create-payment-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create VNPay payment');
  }

  return response.json();
}

/**
 * Redirect to VNPay payment gateway
 */
export async function redirectToVNPay(
  planId: string,
  userId: string,
  amount?: number,
  orderInfo?: string
): Promise<void> {
  try {
    const { paymentUrl } = await createVNPayPayment({
      planId,
      userId,
      amount,
      orderInfo,
    });

    // Redirect to VNPay payment page
    window.location.href = paymentUrl;
  } catch (error) {
    console.error('VNPay payment error:', error);
    throw error;
  }
}

/**
 * Query transaction status
 */
export async function queryVNPayTransaction(orderId: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/vnpay/query-transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to query transaction');
  }

  return response.json();
}
