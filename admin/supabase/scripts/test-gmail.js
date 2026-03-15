import nodemailer from 'nodemailer';
import fs from 'fs';

console.log('\n🔍 Testing Gmail SMTP...\n');

// Read .env.gmail
const envContent = fs.readFileSync('.env.gmail', 'utf8');
const config = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#][^=]+?)\s*=\s*(.+?)\s*$/);
  if (match) {
    config[match[1]] = match[2];
  }
});

console.log('📋 Configuration:');
console.log('  User:', config.GMAIL_USER);
console.log('  Pass:', config.GMAIL_APP_PASSWORD ? `${config.GMAIL_APP_PASSWORD.substring(0,4)}... (${config.GMAIL_APP_PASSWORD.length} chars)` : 'MISSING');

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: config.GMAIL_USER,
    pass: config.GMAIL_APP_PASSWORD
  }
});

console.log('\n📡 Verifying connection...');

transporter.verify()
  .then(() => {
    console.log('✅ Connection verified!\n');
    console.log('📧 Sending test email...');
    
    return transporter.sendMail({
      from: `${config.EMAIL_FROM_NAME} <${config.GMAIL_USER}>`,
      to: 'longsangsabo1@gmail.com',
      subject: '✅ Gmail SMTP Test Successful!',
      html: `
        <h1>🎉 Success!</h1>
        <p>Gmail SMTP is working perfectly!</p>
        <p>Sent at: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}</p>
      `
    });
  })
  .then(info => {
    console.log('✅ Email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Accepted:', info.accepted);
    console.log('\n✨ Check your inbox: longsangsabo1@gmail.com\n');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Error:', err.message);
    console.error('📋 Full error:', err);
    process.exit(1);
  });
