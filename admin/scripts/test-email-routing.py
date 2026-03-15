import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime

# Test email configuration
FROM_EMAIL = "test@example.com"  # Fake sender
TO_EMAIL = "admin@longsang.org"   # Your Cloudflare email
SUBJECT = f"🧪 TEST Email Routing - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"

# Create message
msg = MIMEMultipart()
msg['From'] = FROM_EMAIL
msg['To'] = TO_EMAIL
msg['Subject'] = SUBJECT

# Email body
body = f"""
🎉 Cloudflare Email Routing Test

This is a test email sent to: {TO_EMAIL}

If you receive this in longsangsabo@gmail.com, then:
✅ Email routing is working perfectly!

Details:
- Sent to: {TO_EMAIL}
- Should arrive at: longsangsabo@gmail.com
- Time: {datetime.datetime.now()}

---
Powered by Cloudflare Email Routing
"""

msg.attach(MIMEText(body, 'plain'))

print("=" * 50)
print("📧 CLOUDFLARE EMAIL ROUTING TEST")
print("=" * 50)
print(f"\nSending test email to: {TO_EMAIL}")
print(f"Subject: {SUBJECT}")
print("\n⚠️  NOTE: Using a test SMTP server")
print("For real test, use Gmail SMTP or another provider\n")

# For demonstration - show what would be sent
print("=" * 50)
print("EMAIL PREVIEW:")
print("=" * 50)
print(f"From: {FROM_EMAIL}")
print(f"To: {TO_EMAIL}")
print(f"Subject: {SUBJECT}")
print("\nBody:")
print(body)
print("=" * 50)

print("\n💡 TO SEND REAL TEST EMAIL:")
print("\nOption 1: Send from Gmail")
print("  1. Login to your Gmail")
print("  2. Compose new email")
print(f"  3. Send to: {TO_EMAIL}")
print("  4. Check longsangsabo@gmail.com inbox")

print("\nOption 2: Use online tool")
print("  → https://www.mail-tester.com")
print("  → https://mxtoolbox.com/emailhealth.aspx")

print("\n✅ If email arrives at longsangsabo@gmail.com:")
print("   Email routing is WORKING! 🎉")

print("\n❌ If email doesn't arrive:")
print("   1. Check DNS propagation (wait 5-10 mins)")
print("   2. Verify destination email is verified in Cloudflare")
print("   3. Check spam folder")
