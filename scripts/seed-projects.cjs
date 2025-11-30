/**
 * Seed initial projects with their social accounts
 */

require('dotenv').config();
const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';
const USER_ID = '89917901-cf15-45c4-a7ad-8c4c9513347e'; // longsangsabo@gmail.com

// Projects data
const PROJECTS = [
  {
    name: 'SABO Billiards',
    slug: 'sabo-billiards',
    description: 'Billiard club & shop tại TP. Vũng Tàu - Cung cấp bida chuyên nghiệp và phụ kiện',
    color: '#10B981', // Green
    website_url: 'https://sabobilliards.com',
    social_accounts: [
      { platform: 'facebook', account_id: '118356497898536', account_name: 'SABO Billiards - TP. Vũng Tàu', account_type: 'page', is_primary: true },
      { platform: 'instagram', account_id: '17841474279844606', account_name: 'SABO Billiards | TP. Vũng Tàu', account_username: 'sabobilliard', account_type: 'business', is_primary: true },
    ]
  },
  {
    name: 'SABO Arena',
    slug: 'sabo-arena',
    description: 'Trung tâm thể thao đa năng - Billiard, eSports, Gym',
    color: '#8B5CF6', // Purple
    website_url: 'https://saboarena.com',
    social_accounts: [
      { platform: 'facebook', account_id: '719273174600166', account_name: 'SABO ARENA', account_type: 'page', is_primary: true },
      { platform: 'instagram', account_id: '17841472718907470', account_name: 'SABO Bida', account_username: 'sabomediavt', account_type: 'business', is_primary: true },
    ]
  },
  {
    name: 'AI Newbie VN',
    slug: 'ai-newbie',
    description: 'Cộng đồng học AI từ cơ bản - Hướng dẫn sử dụng AI cho người mới',
    color: '#3B82F6', // Blue
    website_url: 'https://ainewbie.vn',
    social_accounts: [
      { platform: 'facebook', account_id: '569671719553461', account_name: 'AI Newbie VN', account_type: 'page', is_primary: true },
      { platform: 'instagram', account_id: '17841474205608601', account_name: 'Long Sang AI Automation', account_username: 'newbiehocmake', account_type: 'business', is_primary: true },
      { platform: 'youtube', account_id: 'UCh08dvkDfJVJ8f1C-TbXbew', account_name: 'Long Sang', account_type: 'channel', is_primary: true },
    ]
  },
  {
    name: 'SABO Media',
    slug: 'sabo-media',
    description: 'Agency marketing & content creation',
    color: '#F59E0B', // Amber
    website_url: null,
    social_accounts: [
      { platform: 'facebook', account_id: '332950393234346', account_name: 'SABO Media', account_type: 'page', is_primary: true },
    ]
  },
  {
    name: 'AI Art Newbie',
    slug: 'ai-art',
    description: 'Học tạo ảnh AI - Midjourney, Stable Diffusion, DALL-E',
    color: '#EC4899', // Pink
    website_url: null,
    social_accounts: [
      { platform: 'facebook', account_id: '618738001318577', account_name: 'AI Art Newbie', account_type: 'page', is_primary: true },
    ]
  },
  {
    name: 'SABO Billiard Shop',
    slug: 'sabo-shop',
    description: 'Shop bán phụ kiện billiard online',
    color: '#06B6D4', // Cyan
    website_url: null,
    social_accounts: [
      { platform: 'facebook', account_id: '569652129566651', account_name: 'SABO Billiard Shop', account_type: 'page', is_primary: true },
    ]
  },
  {
    name: 'Thợ Săn Hoàng Hôn',
    slug: 'tho-san-hoang-hon',
    description: 'Blog cá nhân - Travel & Photography',
    color: '#F97316', // Orange
    website_url: null,
    social_accounts: [
      { platform: 'facebook', account_id: '519070237965883', account_name: 'Thợ Săn Hoàng Hôn', account_type: 'page', is_primary: true },
    ]
  },
  {
    name: 'Long Sang Personal',
    slug: 'long-sang',
    description: 'Personal branding - Developer, AI Enthusiast',
    color: '#6366F1', // Indigo
    website_url: 'https://longsang.dev',
    social_accounts: [
      { platform: 'linkedin', account_id: 'HhV8LImTty', account_name: 'Long Sang', account_type: 'personal', is_primary: true },
      { platform: 'threads', account_id: '25295715200066837', account_name: 'Baddie', account_username: 'baddie.4296', account_type: 'personal', is_primary: true },
      { platform: 'youtube', account_id: 'UCh08dvkDfJVJ8f1C-TbXbew', account_name: 'Long Sang', account_type: 'channel', is_primary: true },
    ]
  },
];

async function seedProjects() {
  const client = new Client({ connectionString: DATABASE_URL });

  try {
    console.log('🔗 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🌱 Seeding projects...\n');

    for (const project of PROJECTS) {
      // Insert project
      const projectResult = await client.query(`
        INSERT INTO projects (user_id, name, slug, description, color, website_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          color = EXCLUDED.color,
          website_url = EXCLUDED.website_url,
          updated_at = NOW()
        RETURNING id
      `, [USER_ID, project.name, project.slug, project.description, project.color, project.website_url]);

      const projectId = projectResult.rows[0].id;
      console.log(`✅ ${project.name} (${project.slug})`);

      // Insert social accounts
      for (const account of project.social_accounts) {
        await client.query(`
          INSERT INTO project_social_accounts 
          (project_id, platform, account_id, account_name, account_username, account_type, is_primary)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (project_id, platform, account_id) DO UPDATE SET
            account_name = EXCLUDED.account_name,
            account_username = EXCLUDED.account_username,
            is_primary = EXCLUDED.is_primary,
            updated_at = NOW()
        `, [projectId, account.platform, account.account_id, account.account_name, account.account_username || null, account.account_type, account.is_primary]);
        
        console.log(`   📱 ${account.platform}: ${account.account_name}`);
      }
      console.log('');
    }

    // Summary
    const projectCount = await client.query('SELECT COUNT(*) FROM projects');
    const accountCount = await client.query('SELECT COUNT(*) FROM project_social_accounts');
    
    console.log('═══════════════════════════════════════');
    console.log(`✅ Seeded ${projectCount.rows[0].count} projects`);
    console.log(`✅ Seeded ${accountCount.rows[0].count} social accounts`);
    console.log('═══════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

seedProjects();
