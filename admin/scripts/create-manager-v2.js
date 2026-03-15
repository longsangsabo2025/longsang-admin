// Script để tạo manager bằng signUp (không qua trigger)
import { createClient } from '@supabase/supabase-js';

// Dùng anon key để signup như user bình thường
const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I'
);

// Admin client để confirm email
const supabaseAdmin = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function createManager() {
  console.log('🔄 Đang tạo tài khoản manager...\n');

  // Bước 1: Sign up
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: 'ngocdiem1112@gmail.com',
    password: '123456',
    options: {
      data: {
        full_name: 'Ngoc Diem',
        role: 'manager'
      }
    }
  });

  if (signUpError) {
    console.error('❌ Sign up error:', signUpError.message);
    return;
  }

  if (!signUpData.user) {
    console.error('❌ Không tạo được user');
    return;
  }

  console.log('✅ Đã tạo user, đang confirm email...');

  // Bước 2: Auto confirm email
  const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
    signUpData.user.id,
    { email_confirm: true }
  );

  if (confirmError) {
    console.error('⚠️ Không thể auto confirm:', confirmError.message);
    console.log('User vẫn được tạo, cần verify email thủ công.');
  }

  console.log('\n✅ TẠO TÀI KHOẢN THÀNH CÔNG!\n');
  console.log('================================');
  console.log('📧 Email: ngocdiem1112@gmail.com');
  console.log('🔑 Password: 123456');
  console.log('👤 Role: manager');
  console.log('🆔 ID:', signUpData.user.id);
  console.log('================================\n');
}

createManager();
