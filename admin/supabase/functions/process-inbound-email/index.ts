import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { from, to, subject, text, html, raw } = await req.json();

    console.log(`Received email from ${from} to ${to}: ${subject}`);

    // 1. Log inbound email
    const { data: inboundEmail, error: logError } = await supabase
      .from("inbound_emails")
      .insert({
        from_email: from,
        to_email: to,
        subject: subject,
        body_text: text,
        body_html: html,
        raw_email: raw ? JSON.parse(JSON.stringify(raw)) : null,
      })
      .select()
      .single();

    if (logError) {
      console.error("Error logging inbound email:", logError);
      throw logError;
    }

    // 2. Check if it's a reply to an existing ticket
    // Simple logic: Check if subject contains "TKT-YYYY-XXXX"
    const ticketMatch = subject?.match(/TKT-\d{4}-\d{4}/);
    let ticketId = null;

    if (ticketMatch) {
      const ticketNumber = ticketMatch[0];
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("ticket_number", ticketNumber)
        .single();

      if (ticket) {
        ticketId = ticket.id;
        console.log(`Matched existing ticket: ${ticketNumber} (${ticketId})`);
      }
    }

    // 3. Create new ticket if not found
    if (!ticketId) {
      // Generate ticket number logic is in DB trigger/function, but we need to call it or let DB handle it
      // We'll insert and let the DB generate the number if we didn't provide it, 
      // but our schema says ticket_number is NOT NULL.
      // We created a function `generate_ticket_number()`. We can use it in the insert.
      
      const { data: newTicket, error: createError } = await supabase
        .from("support_tickets")
        .insert({
          subject: subject,
          customer_email: from,
          // customer_name: extract name from 'from' field if possible
          status: "open",
          ticket_number: await generateTicketNumber(supabase), // Helper function
        })
        .select()
        .single();

      if (createError) {
        console.error("Error creating ticket:", createError);
        throw createError;
      }
      ticketId = newTicket.id;
      console.log(`Created new ticket: ${newTicket.ticket_number}`);
    }

    // 4. Add message to ticket
    const { error: messageError } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        from_email: from,
        to_email: to,
        subject: subject,
        body_text: text,
        body_html: html,
        message_type: "email",
        is_from_customer: true,
      });

    if (messageError) {
      console.error("Error adding message:", messageError);
      throw messageError;
    }

    // 5. Update inbound email with ticket_id and processed status
    await supabase
      .from("inbound_emails")
      .update({
        ticket_id: ticketId,
        processed: true,
      })
      .eq("id", inboundEmail.id);

    return new Response(JSON.stringify({ success: true, ticketId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing inbound email:", error);
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
