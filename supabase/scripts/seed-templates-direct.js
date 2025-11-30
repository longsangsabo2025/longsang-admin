// =====================================================
// SEED EMAIL TEMPLATES VIA API
// =====================================================
// Usage: node scripts/seed-templates-direct.js
// =====================================================

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Email templates with full HTML
const templates = [
  {
    name: 'welcome-email',
    subject: 'Welcome to {{company_name}}! 🎉',
    template_type: 'welcome',
    variables: ['user_name', 'user_email', 'activation_link', 'company_name', 'support_email'],
    html_content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">🎉 Welcome!</h1>
            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">We're excited to have you on board</p>
        </div>
        <div style="padding: 40px 30px;">
            <h2 style="margin: 0 0 20px 0; color: #2d3748; font-size: 24px; font-weight: 600;">Hi {{user_name}},</h2>
            <p style="margin: 0 0 20px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">Thank you for joining <strong style="color: #667eea;">{{company_name}}</strong>! We're thrilled to have you as part of our community.</p>
            <p style="margin: 0 0 30px 0; color: #4a5568; font-size: 16px; line-height: 1.6;">To get started, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 0 0 30px 0;">
                <a href="{{activation_link}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">✨ Activate Account</a>
            </div>
            <div style="background: #f7fafc; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; color: #2d3748; font-size: 14px; font-weight: 600;">📧 Your Account Details:</p>
                <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;"><strong>Email:</strong> {{user_email}}<br><strong>Registered:</strong> Just now</p>
            </div>
            <p style="margin: 0 0 10px 0; color: #4a5568; font-size: 14px; line-height: 1.6;">If you didn't create this account, you can safely ignore this email.</p>
            <p style="margin: 0; color: #4a5568; font-size: 14px; line-height: 1.6;">Need help? Contact us at <a href="mailto:{{support_email}}" style="color: #667eea; text-decoration: none; font-weight: 600;">{{support_email}}</a></p>
        </div>
        <div style="background: #f7fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #718096; font-size: 12px;">© 2025 {{company_name}}. All rights reserved.</p>
            <p style="margin: 0; color: #718096; font-size: 12px;">Sent with ❤️ from {{company_name}}</p>
        </div>
    </div>
</body>
</html>`
  }
]

async function seedTemplates() {
  console.log('\n========================================')
  console.log('  📧 SEEDING EMAIL TEMPLATES')
  console.log('========================================\n')

  try {
    for (const template of templates) {
      console.log(`📝 Inserting: ${template.name}...`)
      
      const { data, error } = await supabase
        .from('email_templates')
        .upsert(template, { 
          onConflict: 'name',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        console.error(`❌ Error: ${error.message}`)
      } else {
        console.log(`✅ Inserted: ${template.name} (ID: ${data[0].id})`)
      }
    }

    console.log('\n========================================')
    console.log('  ✅ TEMPLATES SEEDED!')
    console.log('========================================\n')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

seedTemplates()
