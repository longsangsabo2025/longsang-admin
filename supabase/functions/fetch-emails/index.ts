import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ImapFlow } from "https://esm.sh/imapflow@1.0.124";
import { simpleParser } from "https://esm.sh/mailparser@3.6.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const GMAIL_USER = Deno.env.get("GMAIL_USER") || "longsangsabo@gmail.com";
    const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

    if (!GMAIL_APP_PASSWORD) {
      throw new Error("GMAIL_APP_PASSWORD is not set");
    }

    const client = new ImapFlow({
      host: "imap.gmail.com",
      port: 993,
      secure: true,
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
      logger: false,
    });

    console.log("Connecting to Gmail IMAP...");
    await client.connect();

    const lock = await client.getMailboxLock("INBOX");
    let processedCount = 0;

    try {
      // Search for unread emails sent to support@longsang.org
      // Note: Gmail stores "To" in headers. We can search for UNSEEN.
      // We can also filter by TO 'support@longsang.org' but Cloudflare forwarding 
      // might keep the original To header or add X-Forwarded-To.
      // For now, let's just fetch UNSEEN and filter in code or assume all UNSEEN in this account 
      // (if dedicated) are relevant. But this is a personal account, so we MUST filter.
      
      // Search for: UNSEEN AND (TO "support@longsang.org" OR HEADER "X-Forwarded-To" "support@longsang.org")
      // IMAP search is limited. Let's fetch UNSEEN and check headers.
      
      const messages = client.fetch({ seen: false }, {
        source: true,
        envelope: true,
      });

      for await (const message of messages) {
        const source = message.source;
        // simpleParser accepts Uint8Array directly in Deno
        const parsed = await simpleParser(source);
        
        const toAddress = parsed.to?.text || "";
        const subject = parsed.subject || "";
        const fromAddress = parsed.from?.value[0]?.address || "";
        
        console.log(`Checking email: ${subject} from ${fromAddress} to ${toAddress}`);

        // Filter: Only process if sent to support@longsang.org OR subject contains Ticket ID
        const isSupportEmail = toAddress.includes("support@longsang.org") || 
                               subject.includes("TKT-") ||
                               parsed.headers.get("x-forwarded-to")?.includes("support@longsang.org");

        if (isSupportEmail) {
          console.log("  -> Processing support email...");
          
          // Call our internal logic (or just duplicate it here for simplicity)
          // Let's duplicate the logic to avoid HTTP roundtrip overhead and auth issues
          
          // 1. Log inbound email
          const { data: inboundEmail, error: logError } = await supabase
            .from("inbound_emails")
            .insert({
              from_email: fromAddress,
              to_email: "support@longsang.org",
              subject: subject,
              body_text: parsed.text,
              body_html: parsed.html || parsed.textAsHtml,
              raw_email: null, // Don't store full raw to save space, or store if needed
            })
            .select()
            .single();

          if (logError) throw logError;

          // 2. Check for existing ticket
          const ticketMatch = subject?.match(/TKT-\d{4}-\d{4}/);
          let ticketId = null;

          if (ticketMatch) {
            const ticketNumber = ticketMatch[0];
            const { data: ticket } = await supabase
              .from("support_tickets")
              .select("id")
              .eq("ticket_number", ticketNumber)
              .single();
            if (ticket) ticketId = ticket.id;
          }

          // 3. Create new ticket
          if (!ticketId) {
            const { data: newTicket, error: createError } = await supabase
              .from("support_tickets")
              .insert({
                subject: subject,
                customer_email: fromAddress,
                customer_name: parsed.from?.value[0]?.name,
                status: "open",
                ticket_number: await generateTicketNumber(supabase),
              })
              .select()
              .single();
            
            if (createError) throw createError;
            ticketId = newTicket.id;
          }

          // 4. Add message
          await supabase.from("ticket_messages").insert({
            ticket_id: ticketId,
            from_email: fromAddress,
            to_email: "support@longsang.org",
            subject: subject,
            body_text: parsed.text,
            body_html: parsed.html || parsed.textAsHtml,
            message_type: "email",
            is_from_customer: true,
          });

          // 5. Update inbound log
          await supabase.from("inbound_emails").update({
            ticket_id: ticketId,
            processed: true
          }).eq("id", inboundEmail.id);

          // 6. Mark as SEEN in Gmail
          await client.messageFlagsAdd(message.uid, ["\\Seen"]);
          processedCount++;
        } else {
          console.log("  -> Skipping (not a support email)");
          // Optionally mark as seen if you want to ignore them forever
          // await client.messageFlagsAdd(message.uid, ["\\Seen"]);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();

    return new Response(JSON.stringify({ success: true, processed: processedCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error fetching emails:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateTicketNumber(supabase: any) {
  const { data, error } = await supabase.rpc("generate_ticket_number");
  if (error) throw error;
  return data;
}
