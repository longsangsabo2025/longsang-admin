// Script để update role cho user
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function updateUserRole() {
  const email = process.argv[2];
  const role = process.argv[3] || 'manager';

  if (!email) {
    console.log('Usage: node scripts/update-user-role.js <email> [role]');
    console.log('Example: node scripts/update-user-role.js ngocdiem1112@gmail.com manager');
    console.log('\nRoles: admin, manager, user');
    return;
  }

  console.log(`🔄 Đang cập nhật role cho ${email}...`);

  // Tìm user theo email
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('❌ Lỗi:', listError.message);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.error(`❌ Không tìm thấy user với email: ${email}`);
    return;
  }

  // Update role
  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      role: role
    }
  });

  if (error) {
    console.error('❌ Lỗi update:', error.message);
    return;
  }

  console.log('\n✅ CẬP NHẬT THÀNH CÔNG!\n');
  console.log('================================');
  console.log('📧 Email:', data.user.email);
  console.log('👤 Role:', data.user.user_metadata.role);
  console.log('🆔 ID:', data.user.id);
  console.log('================================\n');
}

updateUserRole();
