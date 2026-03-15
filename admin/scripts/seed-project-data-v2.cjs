/**
 * Seed data for projects - matching actual schema
 * Run: node scripts/seed-project-data-v2.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedData() {
  console.log('🌱 Seeding project data (v2 - matching actual schema)...\n');

  // Get projects
  const { data: projects, error } = await supabase.from('projects').select('id, slug, name');
  if (error) {
    console.error('Error:', error);
    return;
  }

  const projectMap = {};
  projects.forEach(p => { projectMap[p.slug] = p.id; });
  console.log(`Found ${projects.length} projects\n`);

  // ========== DOMAINS (simplified) ==========
  console.log('📌 Seeding domains...');
  const domains = [
    { project_id: projectMap['longsang-admin'], domain: 'http://localhost:8081', is_primary: false, ssl_enabled: false },
    { project_id: projectMap['longsang-admin'], domain: 'https://longsang-admin.vercel.app', is_primary: true, ssl_enabled: true },
    { project_id: projectMap['longsang-portfolio'], domain: 'https://longsang.dev', is_primary: true, ssl_enabled: true },
    { project_id: projectMap['ainewbie-web'], domain: 'https://ainewbie.vn', is_primary: true, ssl_enabled: true },
    { project_id: projectMap['sabo-hub'], domain: 'https://sabohub.vn', is_primary: true, ssl_enabled: true },
    { project_id: projectMap['vungtau-dream-homes'], domain: 'https://vungtaudreamhomes.vn', is_primary: true, ssl_enabled: true },
    { project_id: projectMap['sabo-arena'], domain: 'https://saboarena.vn', is_primary: true, ssl_enabled: true },
  ];

  let successCount = 0;
  for (const item of domains) {
    if (item.project_id) {
      const { error } = await supabase.from('project_domains').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.domain}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.domain}: ${error.message}`);
      }
    }
  }
  console.log(`  Total: ${successCount}/${domains.length}\n`);

  // ========== SOCIAL LINKS (simplified) ==========
  console.log('📱 Seeding social links...');
  const socialLinks = [
    { project_id: projectMap['longsang-portfolio'], platform: 'facebook', url: 'https://facebook.com/longsang.dev', username: '@longsang.dev' },
    { project_id: projectMap['longsang-portfolio'], platform: 'youtube', url: 'https://youtube.com/@longsang', username: '@longsang' },
    { project_id: projectMap['longsang-portfolio'], platform: 'linkedin', url: 'https://linkedin.com/in/longsang', username: 'longsang' },
    { project_id: projectMap['ainewbie-web'], platform: 'facebook', url: 'https://facebook.com/ainewbie.vn', username: '@ainewbie.vn' },
    { project_id: projectMap['ainewbie-web'], platform: 'youtube', url: 'https://youtube.com/@ainewbie', username: '@ainewbie' },
    { project_id: projectMap['ainewbie-web'], platform: 'telegram', url: 'https://t.me/ainewbie_vn', username: '@ainewbie_vn' },
    { project_id: projectMap['sabo-hub'], platform: 'facebook', url: 'https://facebook.com/sabohub', username: '@sabohub' },
    { project_id: projectMap['sabo-hub'], platform: 'telegram', url: 'https://t.me/sabohub', username: '@sabohub' },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'facebook', url: 'https://facebook.com/vungtaudreamhomes', username: '@vungtaudreamhomes' },
  ];

  successCount = 0;
  for (const item of socialLinks) {
    if (item.project_id) {
      const { error } = await supabase.from('project_social_links').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.platform}: ${item.username}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.platform}: ${error.message}`);
      }
    }
  }
  console.log(`  Total: ${successCount}/${socialLinks.length}\n`);

  // ========== ANALYTICS (simplified) ==========
  console.log('📊 Seeding analytics...');
  const analytics = [
    { project_id: projectMap['longsang-admin'], platform: 'google_analytics', tracking_id: 'G-ADMIN0001' },
    { project_id: projectMap['longsang-portfolio'], platform: 'google_analytics', tracking_id: 'G-PORTFOLIO01' },
    { project_id: projectMap['ainewbie-web'], platform: 'google_analytics', tracking_id: 'G-AINEWBIE01' },
    { project_id: projectMap['ainewbie-web'], platform: 'google_search_console', tracking_id: 'ainewbie.vn' },
    { project_id: projectMap['sabo-hub'], platform: 'google_analytics', tracking_id: 'G-SABOHUB001' },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'google_analytics', tracking_id: 'G-VUNGTAU001' },
  ];

  successCount = 0;
  for (const item of analytics) {
    if (item.project_id) {
      const { error } = await supabase.from('project_analytics').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.platform}: ${item.tracking_id}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.platform}: ${error.message}`);
      }
    }
  }
  console.log(`  Total: ${successCount}/${analytics.length}\n`);

  // ========== INTEGRATIONS (simplified) ==========
  console.log('🔌 Seeding integrations...');
  const integrations = [
    { project_id: projectMap['longsang-admin'], platform: 'supabase' },
    { project_id: projectMap['longsang-admin'], platform: 'vercel' },
    { project_id: projectMap['longsang-admin'], platform: 'n8n' },
    { project_id: projectMap['longsang-admin'], platform: 'github' },
    { project_id: projectMap['ainewbie-web'], platform: 'supabase' },
    { project_id: projectMap['ainewbie-web'], platform: 'vercel' },
    { project_id: projectMap['sabo-hub'], platform: 'supabase' },
    { project_id: projectMap['sabo-hub'], platform: 'vercel' },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'supabase' },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'cloudflare' },
  ];

  successCount = 0;
  for (const item of integrations) {
    if (item.project_id) {
      const { error } = await supabase.from('project_integrations').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.platform}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.platform}: ${error.message}`);
      }
    }
  }
  console.log(`  Total: ${successCount}/${integrations.length}\n`);

  // ========== DOCUMENTS (simplified) ==========
  console.log('📄 Seeding documents...');
  const documents = [
    { project_id: projectMap['longsang-admin'], title: 'Project README', doc_type: 'readme', content: '# LongSang Admin\n\nAdmin dashboard for managing all projects.' },
    { project_id: projectMap['longsang-admin'], title: 'Supabase Setup Guide', doc_type: 'guide', content: 'Instructions for setting up Supabase connection.' },
    { project_id: projectMap['longsang-admin'], title: 'n8n Workflows Docs', doc_type: 'link', url: 'https://docs.n8n.io' },
    { project_id: projectMap['ainewbie-web'], title: 'Marketing Plan 2025', doc_type: 'note', content: 'Q1: Launch AI courses\nQ2: Expand social media\nQ3: Partnership programs' },
  ];

  successCount = 0;
  for (const item of documents) {
    if (item.project_id) {
      const { error } = await supabase.from('project_documents').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.title}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.title}: ${error.message}`);
      }
    }
  }
  console.log(`  Total: ${successCount}/${documents.length}\n`);

  console.log('✅ Seeding completed!');
}

seedData().catch(console.error);
