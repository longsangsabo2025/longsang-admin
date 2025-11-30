// Send test email to longsangsabo1@gmail.com
import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('\n📧 Sending test email to longsangsabo1@gmail.com...\n');

try {
  const { data, error } = await resend.emails.send({
    from: 'LongSang.org <noreply@longsang.org>',
    to: ['longsangsabo1@gmail.com'],
    subject: '🎉 Test Email - Domain Verified',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin: 10px 0; }
          .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .stat-item { margin: 10px 0; padding: 10px; border-left: 3px solid #667eea; }
          .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Email System Verified!</h1>
            <p>Domain longsang.org đã được xác thực thành công</p>
          </div>
          
          <div class="content">
            <div class="badge">✅ Verified Domain</div>
            
            <h2>Thông tin hệ thống:</h2>
            
            <div class="stats">
              <div class="stat-item">
                <strong>📧 Email From:</strong> noreply@longsang.org
              </div>
              <div class="stat-item">
                <strong>🚀 Daily Limit:</strong> 3,000 emails/day
              </div>
              <div class="stat-item">
                <strong>📊 Provider:</strong> Resend
              </div>
              <div class="stat-item">
                <strong>✅ DNS Status:</strong> All records verified (SPF, DKIM, MX)
              </div>
              <div class="stat-item">
                <strong>🔒 Security:</strong> DMARC monitoring enabled
              </div>
            </div>
            
            <h3>Kiểm tra spam score:</h3>
            <p>Email này nên xuất hiện trong <strong>Inbox</strong>, không phải Spam folder.</p>
            <p>Nếu vẫn vào Spam:</p>
            <ul>
              <li>Click "Not Spam" để huấn luyện Gmail</li>
              <li>Add noreply@longsang.org vào Contacts</li>
              <li>DMARC record cần thêm thời gian để propagate (24-48h)</li>
            </ul>
            
            <h3>Next Steps:</h3>
            <ol>
              <li>✅ Domain verified</li>
              <li>✅ Edge Functions deployed</li>
              <li>✅ Email queue system working</li>
              <li>⏳ Add DMARC record (improve deliverability)</li>
              <li>🎯 Integrate với frontend</li>
            </ol>
          </div>
          
          <div class="footer">
            <p>Sent from LongSang.org Email Automation System</p>
            <p>Powered by Supabase + Resend</p>
            <p style="color: #9ca3af;">Sent at: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
          </div>
        </div>
      </body>
      </html>
    `
  });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Email sent successfully!');
  console.log('📧 Email ID:', data.id);
  console.log('📬 To: longsangsabo1@gmail.com');
  console.log('\n🔍 Check your inbox (or spam folder) at longsangsabo1@gmail.com\n');
  
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}
