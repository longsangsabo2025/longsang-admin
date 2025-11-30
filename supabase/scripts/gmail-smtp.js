// ============================================
// GMAIL SMTP EMAIL SENDER
// ============================================

import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Load Gmail config
const gmailEnvPath = path.join(process.cwd(), '.env.gmail');
if (fs.existsSync(gmailEnvPath)) {
  const gmailConfig = fs.readFileSync(gmailEnvPath, 'utf8');
  gmailConfig.split('\n').forEach(line => {
    const match = line.match(/^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify connection
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified!');
    return true;
  } catch (error) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    return false;
  }
}

// Send email
async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.GMAIL_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html: html || text,
      text: text || html?.replace(/<[^>]*>/g, '')
    });

    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test email
async function sendTestEmail(recipientEmail) {
  console.log('\n🧪 Testing Gmail SMTP...\n');
  
  // Verify connection first
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.error('\n❌ Please check your .env.gmail configuration\n');
    return;
  }
  
  console.log('📧 Sending test email...\n');
  
  const result = await sendEmail({
    to: recipientEmail,
    subject: '✅ Gmail SMTP Setup Successful!',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4285f4; color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4285f4; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Gmail SMTP Setup Complete!</h1>
          </div>
          
          <div class="content">
            <div class="success">
              <h2>✅ Email System Working Perfectly!</h2>
              <p>This email was sent via Gmail SMTP</p>
            </div>
            
            <h3>📊 Configuration:</h3>
            <div class="info-box">
              <p><strong>📧 From:</strong> ${process.env.GMAIL_USER}</p>
              <p><strong>🏷️  Name:</strong> ${process.env.EMAIL_FROM_NAME}</p>
              <p><strong>🔒 Method:</strong> Gmail SMTP (TLS)</p>
              <p><strong>📬 Deliverability:</strong> 95%+ inbox rate</p>
              <p><strong>📊 Daily Limit:</strong> 500 emails (Gmail free tier)</p>
            </div>
            
            <h3>✅ Advantages:</h3>
            <ul>
              <li>✅ <strong>No spam folder</strong> - Gmail's reputation is excellent</li>
              <li>✅ <strong>Instant delivery</strong> - No warm-up needed</li>
              <li>✅ <strong>High deliverability</strong> - 95%+ inbox placement</li>
              <li>✅ <strong>Free</strong> - Up to 500 emails/day</li>
              <li>✅ <strong>Reliable</strong> - Google's infrastructure</li>
            </ul>
            
            <h3>📈 Next Steps:</h3>
            <ol>
              <li>✅ Gmail SMTP configured</li>
              <li>🎯 Integrate with Supabase Edge Functions</li>
              <li>🔄 Replace Resend with Gmail for production</li>
              <li>📊 Monitor email delivery rates</li>
            </ol>
            
            <div class="info-box" style="border-left-color: #10b981;">
              <p><strong>💡 Pro Tip:</strong></p>
              <p>Continue warming up longsang.org domain in parallel. After 4 weeks, you can switch to longsang.org for 3,000 emails/day capacity while maintaining Gmail as backup.</p>
            </div>
          </div>
          
          <div class="footer">
            <p>Sent from LongSang.org Admin System</p>
            <p>Powered by Gmail SMTP</p>
            <p>Sent at: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          </div>
        </div>
      </body>
      </html>
    `
  });
  
  if (result.success) {
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📬 To:', recipientEmail);
    console.log('✉️  Accepted:', result.accepted);
    console.log('\n🎉 Gmail SMTP is ready to use!\n');
  } else {
    console.error('❌ Failed to send:', result.error);
  }
}

export { sendEmail, verifyConnection, sendTestEmail };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const recipientEmail = process.argv[2] || 'longsangsabo1@gmail.com';
  sendTestEmail(recipientEmail)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err.message);
      process.exit(1);
    });
}
