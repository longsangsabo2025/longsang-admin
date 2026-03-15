// Quick email test with verified domain
import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

console.log('\n🧪 Testing email with longsang.org...\n');

try {
  const { data, error } = await resend.emails.send({
    from: 'LongSang.org <noreply@longsang.org>',
    to: ['longsangsabo@gmail.com'],
    subject: '🎉 Domain Verified - Test Email',
    html: `
      <h1>✅ Domain Verification Successful!</h1>
      <p>Your domain <strong>longsang.org</strong> is now verified with Resend.</p>
      <p>You can now send up to <strong>3,000 emails/day</strong>.</p>
      <hr>
      <p style="color: #666;">Sent at: ${new Date().toLocaleString()}</p>
    `
  });

  if (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  console.log('✅ Email sent successfully!');
  console.log('📧 Email ID:', data.id);
  console.log('📬 To: longsangsabo@gmail.com');
  console.log('\n🎉 Domain is working!\n');
  
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exit(1);
}
