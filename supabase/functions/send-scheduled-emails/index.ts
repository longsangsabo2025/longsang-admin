// Edge Function: send-scheduled-emails
// Runs every 10 minutes to send scheduled emails from content queue

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("📧 Checking for scheduled emails...");

    // Get scheduled emails that are ready to send
    const now = new Date().toISOString();
    const { data: emails, error: fetchError } = await supabase
      .from("content_queue")
      .select("*")
      .eq("content_type", "email")
      .eq("status", "scheduled")
      .lte("scheduled_for", now)
      .limit(10);

    if (fetchError) throw fetchError;

    if (!emails || emails.length === 0) {
      console.log("✅ No emails to send");
      return new Response(JSON.stringify({ message: "No emails to send", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`📬 Found ${emails.length} emails to send`);

    const results = [];
    for (const email of emails) {
      try {
        // Send email using Resend or SendGrid
        await sendEmail(email);

        // Update status
        await supabase
          .from("content_queue")
          .update({
            status: "completed",
            published_at: new Date().toISOString(),
          })
          .eq("id", email.id);

        // Log success
        await supabase.from("activity_logs").insert({
          agent_id: email.agent_id,
          action: "email_sent",
          status: "success",
          details: {
            email_id: email.id,
            recipient: email.metadata?.recipient,
          },
        });

        results.push({ id: email.id, status: "sent" });
        console.log(`✅ Sent email: ${email.id}`);
      } catch (error) {
        console.error(`❌ Failed to send email ${email.id}:`, error);

        // Update retry count
        const retryCount = (email.metadata?.retry_count || 0) + 1;
        const maxRetries = 3;

        if (retryCount >= maxRetries) {
          await supabase.from("content_queue").update({ status: "failed" }).eq("id", email.id);
        } else {
          await supabase
            .from("content_queue")
            .update({
              metadata: {
                ...email.metadata,
                retry_count: retryCount,
                last_error: error.message,
              },
            })
            .eq("id", email.id);
        }

        // Log error
        await supabase.from("activity_logs").insert({
          agent_id: email.agent_id,
          action: "email_sent",
          status: "failed",
          error_message: error.message,
          details: { email_id: email.id },
        });

        results.push({ id: email.id, status: "failed", error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: emails.length,
        results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in send-scheduled-emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Send email using available provider
async function sendEmail(email: any): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const sendgridKey = Deno.env.get("SENDGRID_API_KEY");

  const emailData = {
    to: email.metadata?.recipient || email.metadata?.email,
    subject: email.title,
    html: email.generated_content || email.metadata?.content,
  };

  // Try Resend first (recommended)
  if (resendKey) {
    return await sendWithResend(emailData, resendKey);
  }

  // Fall back to SendGrid
  if (sendgridKey) {
    return await sendWithSendGrid(emailData, sendgridKey);
  }

  throw new Error("No email provider configured (RESEND_API_KEY or SENDGRID_API_KEY)");
}

// Send with Resend
async function sendWithResend(emailData: any, apiKey: string): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "LongSang <noreply@longsang.org>",
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error: ${error}`);
  }
}

// Send with SendGrid
async function sendWithSendGrid(emailData: any, apiKey: string): Promise<void> {
  const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@longsang.org";

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: emailData.to }],
        },
      ],
      from: { email: fromEmail },
      subject: emailData.subject,
      content: [
        {
          type: "text/html",
          value: emailData.html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid error: ${error}`);
  }
}
