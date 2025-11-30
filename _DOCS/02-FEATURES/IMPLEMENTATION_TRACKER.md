# 🚀 OPTION C: FULL SUPPORT SYSTEM - IMPLEMENTATION TRACKER

> **3-Week Sprint to Build Complete Email Support System**  
> Start Date: 2025-11-23  
> Target Completion: 2025-12-14

---

## 📊 PROGRESS OVERVIEW

```
┌────────────────────────────────────────────────────────┐
│  WEEK 1: Email Infrastructure        ▓▓▓░░░░░░░  30%  │
│  WEEK 2: Admin Dashboard UI           ░░░░░░░░░   0%  │
│  WEEK 3: Advanced Features            ░░░░░░░░░   0%  │
│                                                        │
│  OVERALL PROGRESS:                    ▓░░░░░░░░  10%  │
└────────────────────────────────────────────────────────┘
```

**Status:** 🟡 In Progress  
**Current Phase:** Week 1 - Day 1  
**Next Milestone:** Cloudflare Email Routing Setup

---

## 📅 WEEK 1: EMAIL RECEIVING INFRASTRUCTURE (Days 1-7)

### **Objectives:**
- ✅ Setup email receiving (Cloudflare)
- ✅ Create database schema
- ✅ Build email webhook handler
- ✅ Auto-reply system
- ✅ End-to-end testing

---

### **DAY 1: Cloudflare Email Routing Setup (✅ DONE)**

**Tasks:**
- [x] Login to Cloudflare dashboard
- [x] Add longsang.org domain (if not exists)
- [x] Enable Email Routing
- [x] Add destination address: longsangsabo@gmail.com
- [x] Create email addresses:
  - [x] support@longsang.org → longsangsabo@gmail.com
  - [x] hello@longsang.org → longsangsabo@gmail.com
  - [x] contact@longsang.org → longsangsabo@gmail.com
- [x] Verify DNS records (MX, TXT)
- [x] Test: Send email to support@longsang.org

### **DAY 2: Email Ingestion (Gmail -> Supabase)**

**Tasks:**
- [ ] Create `fetch-emails` Edge Function (IMAP Polling)
- [ ] Configure Gmail App Password for IMAP
- [ ] Parse incoming emails (Subject, Body, Sender)
- [ ] Link to `process-inbound-email` logic
- [ ] Schedule Cron Job (Every 1-5 minutes)

- [ ] Verify: Receive in longsangsabo@gmail.com

**Expected Outcome:**  
✅ Emails sent to @longsang.org addresses are forwarded to Gmail

**Time Estimate:** 1-2 hours  
**Status:** ⏳ Pending

---

### **DAY 2: Database Schema Setup**

**Tasks:**
- [ ] Create migration file
- [ ] Define `support_tickets` table
- [ ] Define `ticket_messages` table  
- [ ] Define `inbound_emails` table
- [ ] Define `email_templates` table
- [ ] Define `email_queue` table
- [ ] Add indexes for performance
- [ ] Run migration
- [ ] Verify tables created

**SQL Schema:**

```sql
-- File: supabase/migrations/20251123_email_support_system.sql

-- Support Tickets Table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'normal',
  category VARCHAR(50),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  sla_deadline TIMESTAMP,
  first_response_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Ticket Messages Table
CREATE TABLE ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  message_type VARCHAR(20) DEFAULT 'reply',
  is_from_customer BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  attachments JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Inbound Emails Log
CREATE TABLE inbound_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_email VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP DEFAULT NOW(),
  processed BOOLEAN DEFAULT false,
  ticket_id UUID REFERENCES support_tickets(id),
  raw_email JSONB,
  processing_error TEXT
);

-- Email Templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  variables TEXT[] DEFAULT ARRAY[]::TEXT[],
  category VARCHAR(50) DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email Queue
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  template_id UUID REFERENCES email_templates(id),
  template_variables JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  failed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_customer_email ON support_tickets(customer_email);
CREATE INDEX idx_tickets_created_at ON support_tickets(created_at DESC);
CREATE INDEX idx_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_inbound_processed ON inbound_emails(processed, received_at);
CREATE INDEX idx_queue_status ON email_queue(status, scheduled_at);

-- Functions
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  sequence_num TEXT;
BEGIN
  year := TO_CHAR(NOW(), 'YYYY');
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') INTO sequence_num
  FROM support_tickets
  WHERE ticket_number LIKE 'TKT-' || year || '-%';
  
  RETURN 'TKT-' || year || '-' || sequence_num;
END;
$$ LANGUAGE plpgsql;
```

**Expected Outcome:**  
✅ All tables created and ready for use

**Time Estimate:** 2-3 hours  
**Status:** ⏳ Pending

---

### **DAY 3-4: Email Webhook Handler**

**File:** `supabase/functions/receive-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

interface IncomingEmail {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  receivedAt: Date;
}

serve(async (req) => {
  try {
    const email: IncomingEmail = await req.json();
    
    console.log('📧 Received email from:', email.from);
    
    // 1. Save to inbound_emails
    const { data: savedEmail, error: saveError } = await supabase
      .from('inbound_emails')
      .insert({
        from_email: email.from,
        to_email: email.to,
        subject: email.subject,
        body_text: email.bodyText,
        body_html: email.bodyHtml,
        received_at: email.receivedAt,
        raw_email: email
      })
      .select()
      .single();
    
    if (saveError) throw saveError;
    
    // 2. Check if this is a reply to existing ticket
    const ticketNumber = extractTicketNumber(email.subject);
    
    if (ticketNumber) {
      // This is a reply
      await handleTicketReply(email, ticketNumber);
    } else {
      // This is a new inquiry - create ticket
      await createNewTicket(email, savedEmail.id);
    }
    
    // 3. Mark as processed
    await supabase
      .from('inbound_emails')
      .update({ processed: true })
      .eq('id', savedEmail.id);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

function extractTicketNumber(subject: string): string | null {
  const match = subject.match(/TKT-\d{4}-\d{4}/);
  return match ? match[0] : null;
}

async function handleTicketReply(email: IncomingEmail, ticketNumber: string) {
  // Get ticket
  const { data: ticket } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('ticket_number', ticketNumber)
    .single();
  
  if (!ticket) {
    console.error('Ticket not found:', ticketNumber);
    return;
  }
  
  // Add message to ticket
  await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticket.id,
      from_email: email.from,
      to_email: email.to,
      subject: email.subject,
      body_text: email.bodyText,
      body_html: email.bodyHtml,
      is_from_customer: true,
      message_type: 'reply'
    });
  
  // Update ticket status to 'pending' (waiting for agent response)
  await supabase
    .from('support_tickets')
    .update({ status: 'pending' })
    .eq('id', ticket.id);
  
  console.log('✅ Added reply to ticket:', ticketNumber);
}

async function createNewTicket(email: IncomingEmail, inboundEmailId: string) {
  // Generate ticket number
  const { data: ticketNumberData } = await supabase
    .rpc('generate_ticket_number');
  
  const ticketNumber = ticketNumberData;
  
  // Parse customer name from email
  const customerName = extractName(email.from) || email.from;
  
  // Set SLA deadline (24 hours from now)
  const slaDeadline = new Date();
  slaDeadline.setHours(slaDeadline.getHours() + 24);
  
  // Create ticket
  const { data: ticket, error } = await supabase
    .from('support_tickets')
    .insert({
      ticket_number: ticketNumber,
      subject: email.subject,
      customer_email: email.from,
      customer_name: customerName,
      status: 'open',
      priority: 'normal',
      sla_deadline: slaDeadline.toISOString()
    })
    .select()
    .single();
  
  if (error) throw error;
  
  // Add initial message
  await supabase
    .from('ticket_messages')
    .insert({
      ticket_id: ticket.id,
      from_email: email.from,
      to_email: email.to,
      subject: email.subject,
      body_text: email.bodyText,
      body_html: email.bodyHtml,
      is_from_customer: true,
      message_type: 'initial'
    });
  
  // Link inbound email to ticket
  await supabase
    .from('inbound_emails')
    .update({ ticket_id: ticket.id })
    .eq('id', inboundEmailId);
  
  // Send auto-reply
  await sendAutoReply(ticket, email);
  
  console.log('✅ Created ticket:', ticketNumber);
}

function extractName(email: string): string | null {
  // Extract name from "John Doe <john@example.com>" format
  const match = email.match(/^(.+?)\s*<.+>$/);
  return match ? match[1].trim() : null;
}

async function sendAutoReply(ticket: any, originalEmail: IncomingEmail) {
  // Get auto-reply template
  const { data: template } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', 'support_auto_reply')
    .single();
  
  if (!template) {
    console.error('Auto-reply template not found');
    return;
  }
  
  // Replace variables
  let subject = template.subject
    .replace('{{ticket_number}}', ticket.ticket_number)
    .replace('{{original_subject}}', originalEmail.subject);
  
  let body = template.body_html
    .replace('{{customer_name}}', ticket.customer_name)
    .replace('{{ticket_number}}', ticket.ticket_number)
    .replace('{{sla_time}}', '24 hours');
  
  // Queue email for sending
  await supabase
    .from('email_queue')
    .insert({
      to_email: ticket.customer_email,
      from_email: 'support@longsang.org',
      subject: subject,
      body_html: body,
      template_id: template.id,
      priority: 10, // High priority for auto-replies
      status: 'pending'
    });
  
  console.log('✅ Queued auto-reply for:', ticket.customer_email);
}
```

**Tasks:**
- [ ] Create `receive-email` Edge Function
- [ ] Implement email parsing logic
- [ ] Implement ticket creation logic
- [ ] Implement reply handling logic
- [ ] Add error handling
- [ ] Test with sample emails

**Time Estimate:** 6-8 hours  
**Status:** ⏳ Pending

---

### **DAY 5: Auto-Reply System**

**File:** `supabase/functions/process-email-queue/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: Deno.env.get('GMAIL_USER'),
    pass: Deno.env.get('GMAIL_APP_PASSWORD')
  }
});

serve(async (req) => {
  try {
    const BATCH_SIZE = 50; // Process 50 emails at a time
    
    // Get pending emails
    const { data: emails, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(BATCH_SIZE);
    
    if (error) throw error;
    
    console.log(`📧 Processing ${emails.length} emails...`);
    
    let sent = 0;
    let failed = 0;
    
    for (const email of emails) {
      try {
        // Send email
        const info = await transporter.sendMail({
          from: `${Deno.env.get('EMAIL_FROM_NAME')} <${email.from_email}>`,
          to: email.to_email,
          subject: email.subject,
          html: email.body_html,
          text: email.body_text
        });
        
        // Mark as sent
        await supabase
          .from('email_queue')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', email.id);
        
        sent++;
        console.log(`✅ Sent to ${email.to_email}`);
        
      } catch (error) {
        // Mark as failed
        await supabase
          .from('email_queue')
          .update({
            status: email.retry_count >= email.max_retries ? 'failed' : 'pending',
            retry_count: email.retry_count + 1,
            error_message: error.message,
            failed_at: email.retry_count >= email.max_retries ? new Date().toISOString() : null,
            scheduled_at: new Date(Date.now() + (5 * 60 * 1000)).toISOString() // Retry in 5 min
          })
          .eq('id', email.id);
        
        failed++;
        console.error(`❌ Failed ${email.to_email}:`, error.message);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      processed: emails.length,
      sent,
      failed
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

**Tasks:**
- [ ] Create `process-email-queue` Edge Function
- [ ] Implement queue processing logic
- [ ] Add retry mechanism
- [ ] Test sending emails
- [ ] Setup cron job (every 1 minute)

**Time Estimate:** 4-6 hours  
**Status:** ⏳ Pending

---

**(Continues in next file: WEEK_2_3_TASKS.md)**

---

## 🎯 CURRENT FOCUS

**TODAY'S TASK:** Setup Cloudflare Email Routing

**Steps:**
1. Go to Cloudflare dashboard
2. Navigate to Email Routing
3. Add longsang.org domain
4. Configure forwarding rules
5. Verify DNS records
6. Test email delivery

**Ready to start?** Say "START DAY 1" and I'll guide you through! 🚀
