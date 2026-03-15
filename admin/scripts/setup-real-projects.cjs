/**
 * Setup Real Projects và Gắn Credentials
 * - Xóa dummy projects
 * - Tạo projects thực tế
 * - Gắn credentials vào đúng project
 */

const { Client } = require('pg');

const connectionString = 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres';

// Real projects
const realProjects = [
  {
    slug: 'longsang-admin',
    name: 'LongSang Admin',
    description: 'Master admin dashboard - Quản lý tất cả projects, credentials, workflows',
    icon: '🎛️',
    color: 'from-blue-600 to-indigo-700',
    status: 'active',
    local_url: 'http://localhost:8081',
    production_url: 'https://admin.longsang.org',
    github_url: 'https://github.com/longsangsabo2025/longsang-admin',
  },
  {
    slug: 'longsang-portfolio',
    name: 'Long Sang Portfolio',
    description: 'Website portfolio cá nhân với AI integration',
    icon: '🏠',
    color: 'from-purple-500 to-pink-600',
    status: 'active',
    local_url: 'http://localhost:5173',
    production_url: 'https://longsang.org',
    github_url: 'https://github.com/longsangsabo2025/longsang-portfolio',
  },
  {
    slug: 'ainewbie-web',
    name: 'AI Newbie Web',
    description: 'Platform học AI cho người mới bắt đầu',
    icon: '🤖',
    color: 'from-green-500 to-emerald-600',
    status: 'active',
    local_url: 'http://localhost:5174',
    production_url: 'https://ainewbie.vn',
    github_url: 'https://github.com/longsangsabo2025/ainewbie-web',
  },
  {
    slug: 'sabo-hub',
    name: 'SABO Hub',
    description: 'Hệ sinh thái quản lý doanh nghiệp',
    icon: '🏢',
    color: 'from-orange-500 to-red-600',
    status: 'development',
    local_url: 'http://localhost:3000',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/sabo-hub',
  },
  {
    slug: 'vungtau-dream-homes',
    name: 'Vũng Tàu Dream Homes',
    description: 'Website bất động sản Vũng Tàu',
    icon: '🏡',
    color: 'from-cyan-500 to-blue-600',
    status: 'active',
    local_url: 'http://localhost:5175',
    production_url: 'https://vungtaudreamhomes.com',
    github_url: 'https://github.com/longsangsabo2025/vungtau-dream-homes',
  },
  {
    slug: 'ai-secretary',
    name: 'AI Secretary',
    description: 'Trợ lý AI thông minh đa năng - EVA',
    icon: '💼',
    color: 'from-violet-500 to-purple-600',
    status: 'development',
    local_url: 'http://localhost:3001',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/ai-secretary',
  },
  {
    slug: 'sabo-arena',
    name: 'SABO Arena',
    description: 'Gaming và giải trí platform',
    icon: '🎮',
    color: 'from-red-500 to-rose-600',
    status: 'active',
    local_url: 'http://localhost:5176',
    production_url: 'https://saboarena.com',
    github_url: 'https://github.com/longsangsabo2025/sabo-arena',
  },
  {
    slug: 'music-video-app',
    name: 'Music Video App',
    description: 'Ứng dụng tạo video nhạc với AI',
    icon: '🎵',
    color: 'from-pink-500 to-rose-600',
    status: 'development',
    local_url: 'http://localhost:5177',
    production_url: null,
    github_url: 'https://github.com/longsangsabo2025/music-video-app',
  },
];

// Credentials mapping to projects
const credentialsMapping = {
  'longsang-admin': [
    { name: 'Supabase URL', category: 'supabase', type: 'api_key', value: 'https://diexsbzqwsbpilsymnfb.supabase.co', provider: 'Supabase', dashboard_url: 'https://app.supabase.com/project/diexsbzqwsbpilsymnfb' },
    { name: 'Supabase Anon Key', category: 'supabase', type: 'api_key', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I', provider: 'Supabase' },
    { name: 'Supabase Service Role Key', category: 'supabase', type: 'secret', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY', provider: 'Supabase' },
    { name: 'PostgreSQL Connection', category: 'database', type: 'connection_string', value: 'postgresql://postgres.diexsbzqwsbpilsymnfb:Acookingoil123@aws-1-us-east-2.pooler.supabase.com:6543/postgres', provider: 'Supabase' },
    { name: 'n8n API Key', category: 'n8n', type: 'api_key', value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ', provider: 'n8n', dashboard_url: 'http://localhost:5678' },
    { name: 'n8n Login', category: 'n8n', type: 'password', value: 'admin:longsang2025', provider: 'n8n' },
    { name: 'Google Service Account', category: 'google', type: 'service_account', value: 'automation-bot-102@long-sang-automation.iam.gserviceaccount.com', provider: 'Google Cloud', dashboard_url: 'https://console.cloud.google.com/iam-admin/serviceaccounts?project=long-sang-automation' },
  ],
  'sabo-hub': [
    { name: 'Supabase URL', category: 'supabase', type: 'api_key', value: 'https://dqddxowyikefqcdiioyh.supabase.co', provider: 'Supabase', dashboard_url: 'https://app.supabase.com/project/dqddxowyikefqcdiioyh' },
  ],
  'ai-secretary': [
    { name: 'Supabase URL', category: 'supabase', type: 'api_key', value: 'https://ckivqeakosyaryhntpis.supabase.co', provider: 'Supabase', dashboard_url: 'https://app.supabase.com/project/ckivqeakosyaryhntpis' },
  ],
  'vungtau-dream-homes': [
    { name: 'Supabase URL', category: 'supabase', type: 'api_key', value: 'https://rxjsdoylkflzsxlyccqh.supabase.co', provider: 'Supabase', dashboard_url: 'https://app.supabase.com/project/rxjsdoylkflzsxlyccqh' },
  ],
  'sabo-arena': [
    { name: 'Supabase URL', category: 'supabase', type: 'api_key', value: 'https://mogjjvscxjwvhtpkrlqr.supabase.co', provider: 'Supabase', dashboard_url: 'https://app.supabase.com/project/mogjjvscxjwvhtpkrlqr' },
  ],
};

async function setupProjects() {
  const client = new Client({ connectionString });
  
  try {
    console.log('🔌 Connecting...');
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. Clear old data
    console.log('🗑️  Clearing old data...');
    await client.query('DELETE FROM credentials_vault');
    await client.query('DELETE FROM projects');
    console.log('✅ Cleared!\n');

    // 2. Insert real projects
    console.log('📁 Creating projects...');
    const projectIds = {};
    
    for (const proj of realProjects) {
      const result = await client.query(`
        INSERT INTO projects (slug, name, description, icon, color, status, local_url, production_url, github_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [proj.slug, proj.name, proj.description, proj.icon, proj.color, proj.status, proj.local_url, proj.production_url, proj.github_url]);
      
      projectIds[proj.slug] = result.rows[0].id;
      console.log(`  ✅ ${proj.icon} ${proj.name}`);
    }

    // 3. Insert credentials mapped to projects
    console.log('\n🔑 Adding credentials...');
    let credCount = 0;
    
    for (const [projectSlug, creds] of Object.entries(credentialsMapping)) {
      const projectId = projectIds[projectSlug];
      if (!projectId) continue;

      for (const cred of creds) {
        await client.query(`
          INSERT INTO credentials_vault 
          (project_id, category, name, credential_type, credential_value, provider, dashboard_url, environment, status, last_rotated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, 'production', 'active', NOW())
        `, [projectId, cred.category, cred.name, cred.type, cred.value, cred.provider, cred.dashboard_url || null]);
        credCount++;
      }
      console.log(`  ✅ ${projectSlug}: ${creds.length} credentials`);
    }

    console.log(`\n🎉 Setup complete!`);
    console.log(`   Projects: ${realProjects.length}`);
    console.log(`   Credentials: ${credCount}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

setupProjects();
