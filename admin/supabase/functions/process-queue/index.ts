import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// =====================================================
// PROCESS EMAIL QUEUE
// =====================================================
// Endpoint: /functions/v1/process-queue
// Triggered by cron job every minute
// =====================================================

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function replaceVariables(body: string, variables: Record<string, any>): string {
  let result = body
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(value))
  }
  return result
}

async function sendViaResend(to: string, subject: string, body: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'LongSang.org <noreply@longsang.org>',
      to: [to],
      subject,
      html: `<pre style="font-family: Arial, sans-serif; white-space: pre-wrap;">${body}</pre>`,
    }),
  })

  const data = await response.json()
  
  if (response.ok) {
    return { success: true, messageId: data.id }
  } else {
    return { success: false, error: data.message }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get pending emails
    const { data: queue, error: queueError } = await supabase
      .from('email_queue')
      .select('*, email_templates(*)')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(10)

    if (queueError) throw queueError

    let processed = 0
    let errors = 0

    for (const item of queue) {
      try {
        // Update to sending
        await supabase
          .from('email_queue')
          .update({ status: 'sending' })
          .eq('id', item.id)

        // Get template and replace variables
        const finalSubject = replaceVariables(item.subject, item.variables)
        const finalBody = replaceVariables(item.email_templates.body, item.variables)

        // Send
        const result = await sendViaResend(item.to_email, finalSubject, finalBody)

        if (result.success) {
          await supabase
            .from('email_queue')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', item.id)

          await supabase.from('email_logs').insert({
            email_queue_id: item.id,
            template_type: item.email_templates.template_type,
            to_email: item.to_email,
            subject: finalSubject,
            status: 'sent',
            provider: 'resend',
            provider_message_id: result.messageId
          })

          processed++
        } else {
          throw new Error(result.error)
        }
      } catch (error) {
        const newRetryCount = (item.retry_count || 0) + 1
        const isFailed = newRetryCount >= (item.max_retries || 3)

        await supabase
          .from('email_queue')
          .update({
            status: isFailed ? 'failed' : 'pending',
            retry_count: newRetryCount,
            error_message: error.message
          })
          .eq('id', item.id)

        await supabase.from('email_logs').insert({
          email_queue_id: item.id,
          template_type: item.email_templates?.template_type,
          to_email: item.to_email,
          subject: item.subject,
          status: 'failed',
          provider: 'resend',
          error_message: error.message
        })

        errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed,
        errors,
        total: queue.length
      }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error) {
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
