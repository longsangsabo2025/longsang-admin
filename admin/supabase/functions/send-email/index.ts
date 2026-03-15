import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// SIMPLE EMAIL SENDER - Works with existing schema
// =====================================================
// Endpoint: /functions/v1/send-email
// Method: POST
// Body: { template_name, to_email, to_name, variables }
// =====================================================

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SendEmailRequest {
  template_name: string
  to_email: string
  to_name?: string
  variables: Record<string, string>
}

// Replace variables in template body
function replaceVariables(body: string, variables: Record<string, string>): string {
  let result = body
  
  for (const [key, value] of Object.entries(variables)) {
    // Replace {{key}} with value
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value)
  }
  
  return result
}

// Send email via Resend
async function sendViaResend(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'LongSang.org <noreply@longsang.org>',
        to: [to],
        subject: subject,
        html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</pre>`,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true, messageId: data.id }
    } else {
      return { success: false, error: data.message || 'Unknown error' }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Main handler
serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    // Parse request
    const body: SendEmailRequest = await req.json()
    const { template_name, to_email, to_name, variables } = body

    console.log(`📧 Sending email: ${template_name} to ${to_email}`)

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', template_name)
      .eq('is_active', true)
      .single()

    if (templateError || !template) {
      throw new Error(`Template "${template_name}" not found`)
    }

    // Replace variables in subject and body
    const finalSubject = replaceVariables(template.subject, variables)
    const finalBody = replaceVariables(template.body, variables)

    // Add to email queue
    const { data: queueItem, error: queueError } = await supabase
      .from('email_queue')
      .insert({
        template_id: template.id,
        to_email,
        to_name: to_name || to_email,
        subject: finalSubject,
        variables,
        status: 'sending'
      })
      .select()
      .single()

    if (queueError) {
      throw new Error(`Queue error: ${queueError.message}`)
    }

    // Send email
    const result = await sendViaResend(to_email, finalSubject, finalBody)

    if (result.success) {
      // Update queue
      await supabase
        .from('email_queue')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', queueItem.id)

      // Log success
      await supabase.from('email_logs').insert({
        email_queue_id: queueItem.id,
        template_type: template.template_type,
        to_email,
        subject: finalSubject,
        status: 'sent',
        provider: 'resend',
        provider_message_id: result.messageId
      })

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email sent successfully',
          queue_id: queueItem.id,
          message_id: result.messageId
        }),
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          } 
        }
      )
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('❌ Error:', error.message)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )
  }
})
