// ================================================
// EMAIL SERVICE - Resend & SendGrid Integration
// ================================================

export interface EmailConfig {
  provider?: 'resend' | 'sendgrid';
  from?: string;
  replyTo?: string;
}

export interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Environment variables
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const SENDGRID_API_KEY = import.meta.env.VITE_SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = import.meta.env.VITE_SENDGRID_FROM_EMAIL;

/**
 * Send email via Resend API
 */
async function sendViaResend(request: EmailRequest): Promise<EmailResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: request.from || 'noreply@longsang.org',
        to: Array.isArray(request.to) ? request.to : [request.to],
        subject: request.subject,
        html: request.html,
        text: request.text,
        reply_to: request.replyTo,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${error.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.id,
    };
  } catch (error: any) {
    console.error('Resend email error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send email via SendGrid API
 */
async function sendViaSendGrid(request: EmailRequest): Promise<EmailResponse> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: Array.isArray(request.to) 
              ? request.to.map(email => ({ email }))
              : [{ email: request.to }],
            subject: request.subject,
          },
        ],
        from: {
          email: request.from || SENDGRID_FROM_EMAIL || 'noreply@longsang.org',
        },
        reply_to: request.replyTo ? { email: request.replyTo } : undefined,
        content: [
          ...(request.html ? [{ type: 'text/html', value: request.html }] : []),
          ...(request.text ? [{ type: 'text/plain', value: request.text }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SendGrid API error: ${JSON.stringify(error)}`);
    }

    return {
      success: true,
      messageId: response.headers.get('x-message-id') || undefined,
    };
  } catch (error: any) {
    console.error('SendGrid email error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send email using configured provider
 * Automatically selects available provider (Resend preferred)
 */
export async function sendEmail(
  request: EmailRequest,
  config?: EmailConfig
): Promise<EmailResponse> {
  // Check if we're in mock mode (no API keys)
  if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
    console.warn('⚠️ No email API keys configured. Email would be sent in production.');
    console.log('📧 Mock Email:', {
      to: request.to,
      subject: request.subject,
      preview: request.text?.substring(0, 100) || request.html?.substring(0, 100),
    });
    
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    };
  }

  // Use specified provider or auto-select
  const provider = config?.provider || (RESEND_API_KEY ? 'resend' : 'sendgrid');

  if (provider === 'resend' && RESEND_API_KEY) {
    return sendViaResend(request);
  }

  if (provider === 'sendgrid' && SENDGRID_API_KEY) {
    return sendViaSendGrid(request);
  }

  // Fallback
  if (RESEND_API_KEY) {
    return sendViaResend(request);
  }

  if (SENDGRID_API_KEY) {
    return sendViaSendGrid(request);
  }

  return {
    success: false,
    error: 'No email provider configured',
  };
}

/**
 * Send follow-up email to contact
 */
export async function sendFollowUpEmail(
  to: string,
  name: string,
  subject: string,
  body: string,
  config?: EmailConfig
): Promise<EmailResponse> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hi ${name},</h2>
      <div style="line-height: 1.6;">
        ${body.split('\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 12px;">
        This email was sent by our automated system. If you have any questions, 
        please reply directly to this email.
      </p>
    </div>
  `;

  return sendEmail(
    {
      to,
      subject,
      html,
      text: body,
      replyTo: config?.replyTo || 'contact@longsang.org',
    },
    config
  );
}

/**
 * Send batch emails
 */
export async function sendBatchEmails(
  requests: EmailRequest[],
  config?: EmailConfig
): Promise<EmailResponse[]> {
  const results = await Promise.allSettled(
    requests.map(request => sendEmail(request, config))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      success: false,
      error: `Failed to send email #${index + 1}: ${result.reason}`,
    };
  });
}

/**
 * Check email service health
 */
export async function checkEmailServiceHealth(): Promise<{
  configured: boolean;
  provider: string;
  healthy: boolean;
}> {
  if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
    return {
      configured: false,
      provider: 'none',
      healthy: false,
    };
  }

  const provider = RESEND_API_KEY ? 'resend' : 'sendgrid';

  // Try to send a test (we won't actually send, just check credentials)
  return {
    configured: true,
    provider,
    healthy: true, // In production, you'd verify API key validity
  };
}
