"""
Test Email Template - Gửi email xác nhận với template mới
Chạy: python test_email_template.py
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Supabase credentials
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')

print("🚀 Test Email Template - Long Sang Forge\n")
print(f"📧 Supabase URL: {SUPABASE_URL}")

# Test email address
test_email = "longsangsabo@gmail.com"
print(f"📬 Địa chỉ test: {test_email}\n")

print("="*60)
print("HƯỚNG DẪN TEST EMAIL TEMPLATE")
print("="*60)

print("""
📝 CÁCH 1: Upload Template lên Supabase (Khuyến nghị)

1. Truy cập Supabase Dashboard:
   https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb

2. Vào Settings > Auth > Email Templates

3. Chọn "Confirm signup" template

4. Click "Edit template"

5. Copy nội dung từ file: email-templates/email-confirmation.html

6. Paste vào Supabase editor và Save

7. Test bằng cách đăng ký tài khoản mới với email: longsangsabo@gmail.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 CÁCH 2: Test qua Supabase CLI (Nâng cao)

1. Cài đặt Supabase CLI:
   npm install -g supabase

2. Login:
   supabase login

3. Link project:
   supabase link --project-ref diexsbzqwsbpilsymnfb

4. Upload template:
   supabase db push

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 CÁCH 3: Test Registration Flow

1. Mở app: http://localhost:5173

2. Click "Đăng ký"

3. Nhập email: longsangsabo@gmail.com

4. Nhập password và xác nhận

5. Submit form

6. Kiểm tra inbox email longsangsabo@gmail.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ LƯU Ý QUAN TRỌNG:

- Supabase built-in email có thể bị spam filter
- Nên dùng Custom SMTP (Gmail, SendGrid, AWS SES) cho production
- Template đã được thiết kế responsive và cross-email-client compatible
- Màu sắc: Cyan-Blue (#0EA5E9 → #3B82F6) theo brand colors
- Font: Be Vietnam Pro

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 File template: email-templates/email-confirmation.html
✅ Template đã sẵn sàng để upload lên Supabase!

""")

print("="*60)
print("✨ Sẵn sàng test email template!")
print("="*60)
