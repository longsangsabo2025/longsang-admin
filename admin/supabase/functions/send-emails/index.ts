import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// EMAIL SENDER EDGE FUNCTION
// =====================================================
// Purpose: Process email queue and send emails via Resend
// Trigger: Database trigger on email_queue inserts
// =====================================================

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EmailQueueItem {
  id: string
  template_id: string
  to_email: string
  to_name: string
  subject: string
  variables: Record<string, any>
  status: string
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  template_type: string
  html_content: string
  variables: string[]
}

// =====================================================
// REPLACE VARIABLES IN HTML TEMPLATE
// =====================================================
function replaceVariables(html: string, variables: Record<string, any>): string {
  let result = html
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  }
  
  return result
}

// =====================================================
// SEND EMAIL VIA RESEND
// =====================================================
async function sendEmailViaResend(
  to: string,
  subject: string,
  html: string,
  fromName: string = 'LongSang.org'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <noreply@longsang.org>`,
        to: [to],
        subject: subject,
        html: html,
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

// =====================================================
// PROCESS EMAIL QUEUE
// =====================================================
async function processEmailQueue() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Get pending emails
  const { data: queueItems, error: queueError } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10) // Process 10 at a time

  if (queueError) {
    console.error('Error fetching queue:', queueError)
    return { processed: 0, errors: 1 }
  }

  let processed = 0
  let errors = 0

  for (const item of queueItems as EmailQueueItem[]) {
    try {
      // Update status to sending
      await supabase
        .from('email_queue')
        .update({ status: 'sending' })
        .eq('id', item.id)

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', item.template_id)
        .single()

      if (templateError || !template) {
        throw new Error('Template not found')
      }

      // Replace variables in HTML
      const html = replaceVariables(
        (template as EmailTemplate).html_content,
        item.variables
      )

      // Send email
      const result = await sendEmailViaResend(
        item.to_email,
        item.subject,
        html
      )

      if (result.success) {
        // Update queue status
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', item.id)

        // Log success
        await supabase.from('email_logs').insert({
          email_queue_id: item.id,
          template_type: (template as EmailTemplate).template_type,
          to_email: item.to_email,
          subject: item.subject,
          status: 'sent',
          provider: 'resend',
          provider_message_id: result.messageId,
        })

        processed++
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error(`Error processing email ${item.id}:`, error)
      
      // Update retry count
      const newRetryCount = item.retry_count + 1
      const isFailed = newRetryCount >= 3 // max_retries
      
      await supabase
        .from('email_queue')
        .update({
          status: isFailed ? 'failed' : 'pending',
          retry_count: newRetryCount,
          error_message: error.message,
        })
        .eq('id', item.id)

      // Log failure
      await supabase.from('email_logs').insert({
        email_queue_id: item.id,
        template_type: '',
        to_email: item.to_email,
        subject: item.subject,
        status: 'failed',
        provider: 'resend',
        error_message: error.message,
      })

      errors++
    }
  }

  return { processed, errors }
}

// =====================================================
// EDGE FUNCTION HANDLER
// =====================================================
serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', { 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        } 
      })
    }

    // Process email queue
    const result = await processEmailQueue()

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
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
