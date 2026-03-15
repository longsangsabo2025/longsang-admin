// Script setup quyền truy cập project cho manager
import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function setup() {
  await client.connect();
  console.log('✅ Connected\n');
  
  // 1. Tạo bảng project_access
  console.log('🔧 Tạo bảng project_access...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS project_access (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL,
      user_id UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(project_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_project_access_user ON project_access(user_id);
    CREATE INDEX IF NOT EXISTS idx_project_access_project ON project_access(project_id);
  `);
  console.log('✅ Đã tạo bảng\n');
  
  // 2. Lấy danh sách projects
  const { rows: projects } = await client.query('SELECT id, name, slug FROM projects ORDER BY name');
  console.log('📋 Projects hiện có:');
  projects.forEach((p, i) => console.log(`   ${i+1}. ${p.name} (${p.slug})`));
  
  // 3. Lấy users
  const { rows: users } = await client.query(`
    SELECT id, email, raw_user_meta_data->>'role' as role 
    FROM auth.users
    ORDER BY email
  `);
  console.log('\n👥 Users:');
  users.forEach(u => console.log(`   - ${u.email} | Role: ${u.role || 'user'} | ID: ${u.id}`));
  
  // 4. Tìm manager user
  const manager = users.find(u => u.role === 'manager');
  if (manager) {
    console.log(`\n🎯 Manager found: ${manager.email}`);
    console.log('\n📝 Để cấp quyền project cho manager, chạy:');
    console.log(`   node scripts/grant-project-access.js ${manager.email} <project-slug>`);
  }
  
  await client.end();
}

setup().catch(e => console.error('Error:', e.message));
