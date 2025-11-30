/**
 * Gmail API - Browser-Safe Version
 * Calls API server endpoints for Gmail operations
 */

import { supabase } from '@/integrations/supabase/client';

const API_BASE = 'http://localhost:3001/api/google/gmail';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    mimeType: string;
  }>;
}

export interface EmailResult {
  status: 'success' | 'error';
  messageId?: string;
  message: string;
  timestamp: string;
}

// ============================================================
// API FUNCTIONS - Call through API server
// ============================================================

export async function sendEmail(
  fromEmail: string,
  options: EmailOptions
): Promise<EmailResult> {
  const response = await fetch(`${API_BASE}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromEmail, ...options }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send email');
  }
  
  const data = await response.json();
  return {
    status: 'success',
    messageId: data.messageId,
    message: 'Email sent successfully',
    timestamp: new Date().toISOString(),
  };
}

export async function sendBulkEmails(
  fromEmail: string,
  recipients: string[],
  template: Omit<EmailOptions, 'to'>
): Promise<EmailResult[]> {
  const response = await fetch(`${API_BASE}/bulk-send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromEmail, recipients, template }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send bulk emails');
  }
  
  return response.json();
}

export async function sendConsultationConfirmation(consultationId: string): Promise<EmailResult> {
  const response = await fetch(`${API_BASE}/consultation-confirmation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ consultationId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send confirmation');
  }
  
  const data = await response.json();
  return {
    status: 'success',
    messageId: data.messageId,
    message: 'Confirmation email sent',
    timestamp: new Date().toISOString(),
  };
}

export async function sendWeeklyNewsletter(): Promise<EmailResult> {
  const response = await fetch(`${API_BASE}/weekly-newsletter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send newsletter');
  }
  
  return response.json();
}

export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<EmailResult> {
  const response = await fetch(`${API_BASE}/welcome-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userEmail, userName }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send welcome email');
  }
  
  return response.json();
}

// ============================================================
// WORKING FUNCTIONS - SUPABASE ONLY (SAFE IN BROWSER)
// ============================================================

/**
 * Get email statistics from database
 */
export async function getEmailStats(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('gmail_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    const total = data?.length || 0;
    const successful = data?.filter(log => log.status === 'success').length || 0;
    const failed = total - successful;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      recentLogs: data?.slice(0, 10) || [],
    };
  } catch (error) {
    console.error('Error getting email stats:', error);
    throw error;
  }
}

/**
 * Get recent email logs
 */
export async function getRecentEmailLogs(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from('gmail_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting recent email logs:', error);
    throw error;
  }
}

/**
 * Get email templates
 */
export async function getEmailTemplates() {
  try {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting email templates:', error);
    throw error;
  }
}
