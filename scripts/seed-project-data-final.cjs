/**
 * Seed data for projects - FINAL VERSION matching actual schema
 * Run: node scripts/seed-project-data-final.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedData() {
  console.log('🌱 Seeding project data (FINAL - correct schema)...\n');

  // Get projects
  const { data: projects, error } = await supabase.from('projects').select('id, slug, name');
  if (error) {
    console.error('Error:', error);
    return;
  }

  const projectMap = {};
  projects.forEach(p => { projectMap[p.slug] = p.id; });
  console.log(`Found ${projects.length} projects\n`);

  // ========== DOMAINS (matching schema: domain, domain_type, is_primary, hosting_provider, dns_provider) ==========
  console.log('📌 Seeding domains...');
  const domains = [
    { project_id: projectMap['longsang-admin'], domain: 'http://localhost:8081', domain_type: 'development', is_primary: false, hosting_provider: 'Local' },
    { project_id: projectMap['longsang-admin'], domain: 'https://longsang-admin.vercel.app', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel' },
    { project_id: projectMap['longsang-portfolio'], domain: 'https://longsang.dev', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel', dns_provider: 'Cloudflare' },
    { project_id: projectMap['ainewbie-web'], domain: 'https://ainewbie.vn', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel', dns_provider: 'Cloudflare' },
    { project_id: projectMap['sabo-hub'], domain: 'https://sabohub.vn', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel' },
    { project_id: projectMap['vungtau-dream-homes'], domain: 'https://vungtaudreamhomes.vn', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel' },
    { project_id: projectMap['sabo-arena'], domain: 'https://saboarena.vn', domain_type: 'production', is_primary: true, hosting_provider: 'Vercel' },
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
      } else {
        console.log(`  ⏭️ ${item.domain} (exists)`);
      }
    }
  }
  console.log(`  Domains: ${successCount} added\n`);

  // ========== INTEGRATIONS (matching schema: service_name, service_type, is_active, config) ==========
  console.log('🔌 Seeding integrations...');
  const integrations = [
    { project_id: projectMap['longsang-admin'], service_name: 'Supabase', service_type: 'database', is_active: true, notes: 'Main database' },
    { project_id: projectMap['longsang-admin'], service_name: 'Vercel', service_type: 'hosting', is_active: true, notes: 'Deployment' },
    { project_id: projectMap['longsang-admin'], service_name: 'n8n', service_type: 'automation', is_active: true, notes: 'Workflow automation' },
    { project_id: projectMap['longsang-admin'], service_name: 'GitHub', service_type: 'source_control', is_active: true, notes: 'Source code' },
    { project_id: projectMap['ainewbie-web'], service_name: 'Supabase', service_type: 'database', is_active: true },
    { project_id: projectMap['ainewbie-web'], service_name: 'Vercel', service_type: 'hosting', is_active: true },
    { project_id: projectMap['ainewbie-web'], service_name: 'Stripe', service_type: 'payment', is_active: false, notes: 'Coming soon' },
    { project_id: projectMap['sabo-hub'], service_name: 'Supabase', service_type: 'database', is_active: true },
    { project_id: projectMap['sabo-hub'], service_name: 'Vercel', service_type: 'hosting', is_active: true },
    { project_id: projectMap['vungtau-dream-homes'], service_name: 'Supabase', service_type: 'database', is_active: true },
    { project_id: projectMap['vungtau-dream-homes'], service_name: 'Cloudflare', service_type: 'cdn', is_active: true },
  ];

  successCount = 0;
  for (const item of integrations) {
    if (item.project_id) {
      const { error } = await supabase.from('project_integrations').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.service_name} (${item.service_type})`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.service_name}: ${error.message}`);
      } else {
        console.log(`  ⏭️ ${item.service_name} (exists)`);
      }
    }
  }
  console.log(`  Integrations: ${successCount} added\n`);

  // ========== ENVIRONMENTS (env_name, url, branch, auto_deploy, status) ==========
  console.log('🌍 Seeding environments...');
  const environments = [
    { project_id: projectMap['longsang-admin'], env_name: 'development', url: 'http://localhost:8081', branch: 'develop', auto_deploy: false },
    { project_id: projectMap['longsang-admin'], env_name: 'production', url: 'https://longsang-admin.vercel.app', branch: 'main', auto_deploy: true },
    { project_id: projectMap['ainewbie-web'], env_name: 'production', url: 'https://ainewbie.vn', branch: 'main', auto_deploy: true },
    { project_id: projectMap['sabo-hub'], env_name: 'production', url: 'https://sabohub.vn', branch: 'main', auto_deploy: true },
  ];

  successCount = 0;
  for (const item of environments) {
    if (item.project_id) {
      const { error } = await supabase.from('project_environments').insert(item);
      if (!error) {
        console.log(`  ✅ ${item.env_name}: ${item.url}`);
        successCount++;
      } else if (!error.message.includes('duplicate')) {
        console.log(`  ⚠️ ${item.env_name}: ${error.message}`);
      } else {
        console.log(`  ⏭️ ${item.env_name} (exists)`);
      }
    }
  }
  console.log(`  Environments: ${successCount} added\n`);

  console.log('✅ Seeding completed!');
  
  // Count totals
  const countResults = await Promise.all([
    supabase.from('project_domains').select('id', { count: 'exact', head: true }),
    supabase.from('project_social_links').select('id', { count: 'exact', head: true }),
    supabase.from('project_analytics').select('id', { count: 'exact', head: true }),
    supabase.from('project_integrations').select('id', { count: 'exact', head: true }),
    supabase.from('project_contacts').select('id', { count: 'exact', head: true }),
    supabase.from('project_documents').select('id', { count: 'exact', head: true }),
    supabase.from('project_environments').select('id', { count: 'exact', head: true }),
  ]);

  console.log('\n📊 Database Totals:');
  console.log(`   Domains: ${countResults[0].count}`);
  console.log(`   Social Links: ${countResults[1].count}`);
  console.log(`   Analytics: ${countResults[2].count}`);
  console.log(`   Integrations: ${countResults[3].count}`);
  console.log(`   Contacts: ${countResults[4].count}`);
  console.log(`   Documents: ${countResults[5].count}`);
  console.log(`   Environments: ${countResults[6].count}`);
}

seedData().catch(console.error);
