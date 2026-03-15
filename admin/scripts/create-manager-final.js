// Kiểm tra và xóa tất cả triggers, sau đó tạo user
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

const { Client } = pg;

const dbClient = new Client({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function main() {
  // 1. Kết nối DB và xóa tất cả triggers
  await dbClient.connect();
  console.log('✅ Connected to database\n');
  
  // Kiểm tra triggers
  const triggers = await dbClient.query(`
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_schema = 'auth' AND event_object_table = 'users'
  `);
  
  console.log('📋 Triggers trên auth.users:');
  if (triggers.rows.length === 0) {
    console.log('   (Không có trigger)\n');
  } else {
    for (const row of triggers.rows) {
      console.log('   - Xóa:', row.trigger_name);
      await dbClient.query(`DROP TRIGGER IF EXISTS "${row.trigger_name}" ON auth.users`);
    }
    console.log('   ✅ Đã xóa tất cả triggers\n');
  }
  
  await dbClient.end();
  
  // 2. Tạo user qua Supabase Admin API
  console.log('🔄 Đang tạo tài khoản manager...\n');
  
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
    console.log('\nChi tiết:', JSON.stringify(error, null, 2));
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

main().catch(e => console.error('Fatal error:', e.message));
