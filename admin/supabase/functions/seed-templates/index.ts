import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// SEED EMAIL TEMPLATES
// =====================================================
// Purpose: Load HTML email templates into database
// Usage: Call once to initialize templates
// =====================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// =====================================================
// EMAIL TEMPLATES (from existing HTML files)
// =====================================================
const templates = [
  {
    name: 'welcome-email',
    subject: 'Welcome to {{company_name}}! 🎉',
    template_type: 'welcome',
    variables: ['user_name', 'user_email', 'activation_link', 'company_name', 'support_email'],
    html_content: `<!-- WELCOME EMAIL TEMPLATE -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                🎉 Welcome!
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                We're excited to have you on board
            </p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: 600;">
                Hi {{user_name}},
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Thank you for joining <strong style="color: #667eea;">{{company_name}}</strong>! 
                We're thrilled to have you as part of our community.
            </p>
            
            <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                To get started, please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{activation_link}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                    ✨ Activate Account
                </a>
            </div>
            
            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
                    📧 Your Account Details:
                </p>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                    <strong>Email:</strong> {{user_email}}<br>
                    <strong>Registered:</strong> Just now
                </p>
            </div>
            
            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                If you didn't create this account, you can safely ignore this email.
            </p>
            
            <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                Need help? Contact us at 
                <a href="mailto:{{support_email}}" style="color: #667eea; text-decoration: none; font-weight: 600;">
                    {{support_email}}
                </a>
            </p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 12px;">
                © 2025 {{company_name}}. All rights reserved.
            </p>
            <p style="margin: 0; color: #718096; font-size: 12px;">
                Sent with ❤️ from {{company_name}}
            </p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: 'order-confirmation',
    subject: 'Order Confirmation #{{order_id}}',
    template_type: 'order-confirmation',
    variables: ['customer_name', 'order_id', 'order_date', 'items', 'total_amount', 'shipping_address', 'tracking_link', 'company_name', 'support_email'],
    html_content: `<!-- ORDER CONFIRMATION TEMPLATE -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                ✅ Order Confirmed!
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Thank you for your purchase
            </p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: 600;">
                Hi {{customer_name}},
            </h2>
            
            <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We've received your order and it's being processed. You'll receive a shipping confirmation email once your items are on the way.
            </p>
            
            <div style="background: #f7fafc; border-radius: 8px; padding: 20px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 15px 0; color: #2d3748; font-size: 14px;">
                    <strong>Order Number:</strong> <span style="color: #48bb78; font-weight: 600;">#{{order_id}}</span>
                </p>
                <p style="margin: 0; color: #2d3748; font-size: 14px;">
                    <strong>Order Date:</strong> {{order_date}}
                </p>
            </div>
            
            <h3 style="margin: 0 0 20px 0; color: #2d3748; font-size: 18px; font-weight: 600;">
                📦 Order Items:
            </h3>
            
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin: 0 0 30px 0;">
                {{items}}
            </div>
            
            <div style="background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; text-align: center;">
                    Total: {{total_amount}}
                </p>
            </div>
            
            <h3 style="margin: 0 0 15px 0; color: #2d3748; font-size: 18px; font-weight: 600;">
                📍 Shipping Address:
            </h3>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; white-space: pre-line;">{{shipping_address}}</p>
            </div>
            
            <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{tracking_link}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    🚚 Track Order
                </a>
            </div>
            
            <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; text-align: center;">
                Questions? Contact us at 
                <a href="mailto:{{support_email}}" style="color: #48bb78; text-decoration: none; font-weight: 600;">
                    {{support_email}}
                </a>
            </p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 12px;">
                © 2025 {{company_name}}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: 'password-reset',
    subject: 'Reset Your Password - {{company_name}}',
    template_type: 'password-reset',
    variables: ['user_name', 'reset_link', 'expiry_time', 'company_name', 'support_email'],
    html_content: `<!-- PASSWORD RESET TEMPLATE -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f56565 0%, #c53030 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                🔐 Password Reset
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Secure your account
            </p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: 600;">
                Hi {{user_name}},
            </h2>
            
            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your <strong>{{company_name}}</strong> account.
            </p>
            
            <div style="background: #fff5f5; border-left: 4px solid #f56565; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0; color: #742a2a; font-size: 14px; line-height: 1.6;">
                    ⚠️ <strong>Security Notice:</strong> If you didn't request this, please ignore this email or contact support immediately.
                </p>
            </div>
            
            <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">
                Click the button below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{reset_link}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #f56565 0%, #c53030 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    🔑 Reset Password
                </a>
            </div>
            
            <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px; font-weight: 600;">
                    ⏰ Important Information:
                </p>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                    • This link expires in <strong>{{expiry_time}}</strong><br>
                    • Use it only once to reset your password<br>
                    • Choose a strong, unique password
                </p>
            </div>
            
            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin: 0 0 30px 0; color: #667eea; font-size: 12px; word-break: break-all;">
                {{reset_link}}
            </p>
            
            <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6; text-align: center;">
                Need help? Contact us at 
                <a href="mailto:{{support_email}}" style="color: #f56565; text-decoration: none; font-weight: 600;">
                    {{support_email}}
                </a>
            </p>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 12px;">
                © 2025 {{company_name}}. All rights reserved.
            </p>
            <p style="margin: 0; color: #718096; font-size: 12px;">
                This email was sent because a password reset was requested for your account.
            </p>
        </div>
    </div>
</body>
</html>`
  },
  {
    name: 'newsletter',
    subject: '{{newsletter_title}} - {{company_name}}',
    template_type: 'newsletter',
    variables: ['subscriber_name', 'newsletter_title', 'main_content', 'cta_text', 'cta_link', 'company_name', 'unsubscribe_link', 'social_links'],
    html_content: `<!-- NEWSLETTER TEMPLATE -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">
                📰 {{newsletter_title}}
            </h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                Your monthly digest from {{company_name}}
            </p>
        </div>
        
        <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: 600;">
                Hi {{subscriber_name}},
            </h2>
            
            <div style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.8;">
                {{main_content}}
            </div>
            
            <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{cta_link}}" 
                   style="display: inline-block; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                    {{cta_text}}
                </a>
            </div>
            
            <div style="background: #f7fafc; padding: 30px; border-radius: 8px; text-align: center; margin: 0 0 30px 0;">
                <p style="margin: 0 0 20px 0; color: #2d3748; font-size: 16px; font-weight: 600;">
                    📱 Follow Us
                </p>
                <div style="margin: 0;">
                    {{social_links}}
                </div>
            </div>
        </div>
        
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 12px;">
                © 2025 {{company_name}}. All rights reserved.
            </p>
            <p style="margin: 0 0 15px 0; color: #718096; font-size: 12px;">
                You're receiving this because you subscribed to our newsletter.
            </p>
            <p style="margin: 0;">
                <a href="{{unsubscribe_link}}" style="color: #4299e1; text-decoration: none; font-size: 12px;">
                    Unsubscribe from this list
                </a>
            </p>
        </div>
    </div>
</body>
</html>`
  }
]

// =====================================================
// SEED TEMPLATES INTO DATABASE
// =====================================================
serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Insert or update templates
    const results = []
    for (const template of templates) {
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(template, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        results.push({ template: template.name, success: false, error: error.message })
      } else {
        results.push({ template: template.name, success: true, id: data[0]?.id })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email templates seeded successfully',
        results,
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    )
  }
})
