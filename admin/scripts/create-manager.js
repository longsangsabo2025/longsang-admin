// Script để tạo tài khoản manager
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function createManager() {
  console.log('🔄 Đang tạo tài khoản manager...\n');

  // Tạo user
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'ngocdiem1112@gmail.com',
    password: '123456',
    email_confirm: true,
    user_metadata: {
      full_name: 'Ngoc Diem',
      role: 'manager'
    }
  });

  if (error) {
    console.error('❌ Lỗi:', error.message);
    
    if (error.message.includes('Database error')) {
      console.log('\n⚠️  Có thể do trigger trên auth.users gây lỗi.');
      console.log('📋 Hãy tạo user thủ công qua Supabase Dashboard:\n');
      console.log('   1. Vào: https://supabase.com/dashboard/project/diexsbzqwsbpilsymnfb/auth/users');
      console.log('   2. Click "Add user" > "Create new user"');
      console.log('   3. Email: ngocdiem1112@gmail.com');
      console.log('   4. Password: 123456');
      console.log('   5. Auto Confirm User: ✅ ON');
      console.log('\n   Sau đó chạy: node scripts/update-user-role.js ngocdiem1112@gmail.com manager');
    }
    return;
  }

  console.log('✅ TẠO TÀI KHOẢN THÀNH CÔNG!\n');
  console.log('================================');
  console.log('📧 Email:', data.user.email);
  console.log('🔑 Password: 123456');
  console.log('👤 Role:', data.user.user_metadata.role);
  console.log('🆔 ID:', data.user.id);
  console.log('================================\n');
}

createManager();
