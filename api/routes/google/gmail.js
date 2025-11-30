/**
 * Gmail API Routes
 * Server-side endpoints for Gmail operations
 */

const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Initialize Gmail client
const getGmailClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "{}");

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ["https://www.googleapis.com/auth/gmail.send"],
  });

  return google.gmail({ version: "v1", auth });
};

// Helper: Encode email message
const encodeEmail = (to, subject, body, from) => {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
  ].join("\n");

  return Buffer.from(email)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/**
 * POST /api/google/gmail/send-email
 * Send a single email
 */
router.post("/send-email", async (req, res) => {
  try {
    const { fromEmail, to, subject, body } = req.body;

    if (!fromEmail || !to || !subject || !body) {
      return res.status(400).json({ error: "fromEmail, to, subject, and body are required" });
    }

    const gmail = getGmailClient();
    const encodedMessage = encodeEmail(to, subject, body, fromEmail);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Log to Supabase
    await supabase.from("email_logs").insert({
      from_email: fromEmail,
      to_email: to,
      subject,
      status: "sent",
      message_id: response.data.id,
      sent_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error("Error sending email:", error);

    // Log error to Supabase
    await supabase.from("email_logs").insert({
      from_email: req.body.fromEmail,
      to_email: req.body.to,
      subject: req.body.subject,
      status: "failed",
      error_message: error.message,
      sent_at: new Date().toISOString(),
    });

    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send-bulk
 * Send bulk emails
 */
router.post("/send-bulk", async (req, res) => {
  try {
    const { fromEmail, recipients, subject, body } = req.body;

    if (!fromEmail || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: "fromEmail and recipients array are required" });
    }

    const gmail = getGmailClient();
    const results = [];

    for (const recipient of recipients) {
      try {
        const personalizedBody = body.replace(/{{name}}/g, recipient.name || "Valued Customer");
        const encodedMessage = encodeEmail(recipient.email, subject, personalizedBody, fromEmail);

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        await supabase.from("email_logs").insert({
          from_email: fromEmail,
          to_email: recipient.email,
          subject,
          status: "sent",
          message_id: response.data.id,
          sent_at: new Date().toISOString(),
        });

        results.push({
          email: recipient.email,
          success: true,
          messageId: response.data.id,
        });
      } catch (err) {
        await supabase.from("email_logs").insert({
          from_email: fromEmail,
          to_email: recipient.email,
          subject,
          status: "failed",
          error_message: err.message,
          sent_at: new Date().toISOString(),
        });

        results.push({
          email: recipient.email,
          success: false,
          error: err.message,
        });
      }

      // Rate limiting: wait 100ms between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    res.json({
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error sending bulk emails:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send-confirmation
 * Send consultation confirmation email
 */
router.post("/send-confirmation", async (req, res) => {
  try {
    const { fromEmail, consultationId } = req.body;

    if (!fromEmail || !consultationId) {
      return res.status(400).json({ error: "fromEmail and consultationId are required" });
    }

    // Get consultation details from Supabase
    const { data: consultation, error } = await supabase
      .from("consultations")
      .select("*")
      .eq("id", consultationId)
      .single();

    if (error || !consultation) {
      return res.status(404).json({ error: "Consultation not found" });
    }

    const subject = `Xác nhận đặt lịch tư vấn - ${consultation.service}`;
    const body = `
      <h2>Xin chào ${consultation.name},</h2>
      <p>Cảm ơn bạn đã đăng ký tư vấn với chúng tôi!</p>
      <h3>Thông tin đặt lịch:</h3>
      <ul>
        <li><strong>Dịch vụ:</strong> ${consultation.service}</li>
        <li><strong>Thời gian:</strong> ${new Date(consultation.preferred_date).toLocaleString(
          "vi-VN"
        )}</li>
        <li><strong>Số điện thoại:</strong> ${consultation.phone}</li>
      </ul>
      <p>Chúng tôi sẽ liên hệ với bạn sớm để xác nhận lịch hẹn.</p>
      <p>Trân trọng,<br/>Long Sang Team</p>
    `;

    const gmail = getGmailClient();
    const encodedMessage = encodeEmail(consultation.email, subject, body, fromEmail);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Update consultation
    await supabase
      .from("consultations")
      .update({ confirmation_email_sent: true })
      .eq("id", consultationId);

    // Log to Supabase
    await supabase.from("email_logs").insert({
      from_email: fromEmail,
      to_email: consultation.email,
      subject,
      status: "sent",
      message_id: response.data.id,
      sent_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send-newsletter
 * Send weekly newsletter
 */
router.post("/send-newsletter", async (req, res) => {
  try {
    const { fromEmail, subject, content } = req.body;

    if (!fromEmail || !subject || !content) {
      return res.status(400).json({ error: "fromEmail, subject, and content are required" });
    }

    // Get all newsletter subscribers
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, name")
      .eq("subscribed", true);

    if (error) {
      throw error;
    }

    if (!subscribers || subscribers.length === 0) {
      return res.json({ message: "No subscribers found", totalSent: 0 });
    }

    const gmail = getGmailClient();
    const results = [];

    for (const subscriber of subscribers) {
      try {
        const personalizedContent = content.replace(/{{name}}/g, subscriber.name || "Bạn");
        const encodedMessage = encodeEmail(
          subscriber.email,
          subject,
          personalizedContent,
          fromEmail
        );

        const response = await gmail.users.messages.send({
          userId: "me",
          requestBody: {
            raw: encodedMessage,
          },
        });

        await supabase.from("email_logs").insert({
          from_email: fromEmail,
          to_email: subscriber.email,
          subject,
          status: "sent",
          message_id: response.data.id,
          sent_at: new Date().toISOString(),
        });

        results.push({
          email: subscriber.email,
          success: true,
        });
      } catch (err) {
        results.push({
          email: subscriber.email,
          success: false,
          error: err.message,
        });
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    res.json({
      totalSubscribers: subscribers.length,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error("Error sending newsletter:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google/gmail/send-welcome
 * Send welcome email to new user
 */
router.post("/send-welcome", async (req, res) => {
  try {
    const { fromEmail, userEmail, userName } = req.body;

    if (!fromEmail || !userEmail) {
      return res.status(400).json({ error: "fromEmail and userEmail are required" });
    }

    const subject = "Chào mừng bạn đến với Long Sang!";
    const body = `
      <h2>Xin chào ${userName || "bạn"},</h2>
      <p>Chào mừng bạn đã tham gia cộng đồng Long Sang!</p>
      <p>Chúng tôi rất vui khi có bạn ở đây. Đây là những điều bạn có thể làm:</p>
      <ul>
        <li>📊 Theo dõi dự án của bạn</li>
        <li>🤖 Sử dụng AI Agents để tự động hóa công việc</li>
        <li>📈 Xem báo cáo và phân tích</li>
        <li>📅 Đặt lịch tư vấn với chuyên gia</li>
      </ul>
      <p>Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.</p>
      <p>Trân trọng,<br/>Long Sang Team</p>
    `;

    const gmail = getGmailClient();
    const encodedMessage = encodeEmail(userEmail, subject, body, fromEmail);

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Log to Supabase
    await supabase.from("email_logs").insert({
      from_email: fromEmail,
      to_email: userEmail,
      subject,
      status: "sent",
      message_id: response.data.id,
      sent_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      messageId: response.data.id,
    });
  } catch (error) {
    console.error("Error sending welcome email:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
