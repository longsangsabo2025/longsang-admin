/**
 * Stripe Payment API Client
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface CheckoutSessionRequest {
  planId: string;
  userId: string;
  billingCycle?: 'monthly' | 'yearly';
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe checkout session
 */
export async function createCheckoutSession(
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  const response = await fetch(`${API_URL}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return response.json();
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(userId: string): Promise<string> {
  const response = await fetch(`${API_URL}/api/stripe/customer-portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to get customer portal URL');
  }

  const data = await response.json();
  return data.url;
}

/**
 * Redirect to Stripe checkout
 */
export async function redirectToCheckout(
  planId: string,
  userId: string,
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<void> {
  try {
    const { url } = await createCheckoutSession({
      planId,
      userId,
      billingCycle,
    });

    // Redirect to Stripe checkout
    window.location.href = url;
  } catch (error) {
    console.error('Checkout error:', error);
    throw error;
  }
}

/**
 * Open customer portal in new window
 */
export async function openCustomerPortal(userId: string): Promise<void> {
  try {
    const url = await getCustomerPortalUrl(userId);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Customer portal error:', error);
    throw error;
  }
}
