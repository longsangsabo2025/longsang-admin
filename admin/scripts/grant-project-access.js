// Script cấp/thu hồi quyền truy cập project
// Usage: 
//   node scripts/grant-project-access.js <email> <project-slug> [--remove]
//   node scripts/grant-project-access.js ngocdiem1112@gmail.com sabo-billiards
//   node scripts/grant-project-access.js ngocdiem1112@gmail.com all  (cấp tất cả)

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres'
});

async function main() {
  const email = process.argv[2];
  const projectSlug = process.argv[3];
  const isRemove = process.argv.includes('--remove');
  
  if (!email || !projectSlug) {
    console.log('📖 Cách sử dụng:');
    console.log('   node scripts/grant-project-access.js <email> <project-slug>');
    console.log('   node scripts/grant-project-access.js <email> all');
    console.log('   node scripts/grant-project-access.js <email> <project-slug> --remove');
    console.log('\n📋 Ví dụ:');
    console.log('   node scripts/grant-project-access.js ngocdiem1112@gmail.com sabo-billiards');
    console.log('   node scripts/grant-project-access.js ngocdiem1112@gmail.com all');
    return;
  }
  
  await client.connect();
  
  // Tìm user
  const { rows: users } = await client.query(
    `SELECT id, email FROM auth.users WHERE email = $1`, [email]
  );
  
  if (users.length === 0) {
    console.error(`❌ Không tìm thấy user: ${email}`);
    await client.end();
    return;
  }
  
  const user = users[0];
  console.log(`👤 User: ${user.email} (${user.id})\n`);
  
  // Xử lý "all" - cấp tất cả projects
  if (projectSlug === 'all') {
    const { rows: projects } = await client.query('SELECT id, name, slug FROM projects');
    
    if (isRemove) {
      await client.query('DELETE FROM project_access WHERE user_id = $1', [user.id]);
      console.log(`🗑️  Đã xóa quyền tất cả ${projects.length} projects`);
    } else {
      for (const p of projects) {
        await client.query(
          `INSERT INTO project_access (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [p.id, user.id]
        );
      }
      console.log(`✅ Đã cấp quyền ${projects.length} projects:`);
      projects.forEach(p => console.log(`   - ${p.name}`));
    }
    
    await client.end();
    return;
  }
  
  // Tìm project theo slug
  const { rows: projects } = await client.query(
    `SELECT id, name, slug FROM projects WHERE slug = $1`, [projectSlug]
  );
  
  if (projects.length === 0) {
    console.error(`❌ Không tìm thấy project: ${projectSlug}`);
    console.log('\n📋 Projects có sẵn:');
    const { rows: all } = await client.query('SELECT slug, name FROM projects ORDER BY name');
    all.forEach(p => console.log(`   - ${p.slug}: ${p.name}`));
    await client.end();
    return;
  }
  
  const project = projects[0];
  
  if (isRemove) {
    await client.query(
      'DELETE FROM project_access WHERE project_id = $1 AND user_id = $2',
      [project.id, user.id]
    );
    console.log(`🗑️  Đã xóa quyền: ${project.name}`);
  } else {
    await client.query(
      `INSERT INTO project_access (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [project.id, user.id]
    );
    console.log(`✅ Đã cấp quyền: ${project.name}`);
  }
  
  // Hiện danh sách projects user có quyền
  const { rows: access } = await client.query(`
    SELECT p.name, p.slug 
    FROM project_access pa 
    JOIN projects p ON pa.project_id = p.id 
    WHERE pa.user_id = $1
    ORDER BY p.name
  `, [user.id]);
  
  console.log(`\n📋 Projects ${user.email} có quyền (${access.length}):`);
  access.forEach(p => console.log(`   ✓ ${p.name}`));
  
  await client.end();
}

main().catch(e => console.error('Error:', e.message));
