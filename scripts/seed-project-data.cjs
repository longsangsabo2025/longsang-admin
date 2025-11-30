/**
 * Seed comprehensive data for all 8 projects
 * Run: node scripts/seed-project-data.cjs
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedProjectData() {
  console.log('🌱 Starting to seed project data...\n');

  // First, get all projects
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, slug, name');

  if (projectsError) {
    console.error('Error fetching projects:', projectsError);
    return;
  }

  console.log(`Found ${projects.length} projects\n`);

  // Create a map for easy lookup
  const projectMap = {};
  projects.forEach(p => {
    projectMap[p.slug] = p.id;
  });

  // ========== DOMAINS ==========
  console.log('📌 Seeding domains...');
  const domains = [
    // longsang-admin
    { project_id: projectMap['longsang-admin'], domain: 'http://localhost:8081', environment: 'development', is_primary: false, ssl_enabled: false, notes: 'Local dev server' },
    { project_id: projectMap['longsang-admin'], domain: 'https://longsang-admin.vercel.app', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Vercel deployment' },
    
    // longsang-portfolio
    { project_id: projectMap['longsang-portfolio'], domain: 'https://longsang.dev', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Main portfolio domain' },
    { project_id: projectMap['longsang-portfolio'], domain: 'https://longsang-portfolio.vercel.app', environment: 'staging', is_primary: false, ssl_enabled: true, notes: 'Vercel preview' },
    
    // ainewbie-web
    { project_id: projectMap['ainewbie-web'], domain: 'https://ainewbie.vn', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Main website' },
    { project_id: projectMap['ainewbie-web'], domain: 'https://ainewbie.vercel.app', environment: 'staging', is_primary: false, ssl_enabled: true, notes: 'Vercel staging' },
    
    // sabo-hub
    { project_id: projectMap['sabo-hub'], domain: 'https://sabohub.vn', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Main domain' },
    { project_id: projectMap['sabo-hub'], domain: 'http://localhost:5173', environment: 'development', is_primary: false, ssl_enabled: false, notes: 'Local dev' },
    
    // vungtau-dream-homes
    { project_id: projectMap['vungtau-dream-homes'], domain: 'https://vungtaudreamhomes.vn', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Real estate website' },
    
    // sabo-arena
    { project_id: projectMap['sabo-arena'], domain: 'https://saboarena.vn', environment: 'production', is_primary: true, ssl_enabled: true, notes: 'Gaming platform' },
  ];

  for (const domain of domains) {
    if (domain.project_id) {
      const { error } = await supabase.from('project_domains').insert(domain);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding domain ${domain.domain}:`, error.message);
      } else {
        console.log(`  ✅ ${domain.domain}`);
      }
    }
  }

  // ========== SOCIAL LINKS ==========
  console.log('\n📱 Seeding social links...');
  const socialLinks = [
    // longsang-portfolio
    { project_id: projectMap['longsang-portfolio'], platform: 'facebook', url: 'https://facebook.com/longsang.dev', username: '@longsang.dev', followers_count: 0, is_verified: false },
    { project_id: projectMap['longsang-portfolio'], platform: 'youtube', url: 'https://youtube.com/@longsang', username: '@longsang', followers_count: 0, is_verified: false },
    { project_id: projectMap['longsang-portfolio'], platform: 'linkedin', url: 'https://linkedin.com/in/longsang', username: 'longsang', followers_count: 0, is_verified: false },
    
    // ainewbie-web
    { project_id: projectMap['ainewbie-web'], platform: 'facebook', url: 'https://facebook.com/ainewbie.vn', username: '@ainewbie.vn', followers_count: 1200, is_verified: false },
    { project_id: projectMap['ainewbie-web'], platform: 'youtube', url: 'https://youtube.com/@ainewbie', username: '@ainewbie', followers_count: 500, is_verified: false },
    { project_id: projectMap['ainewbie-web'], platform: 'telegram', url: 'https://t.me/ainewbie_vn', username: '@ainewbie_vn', followers_count: 350, is_verified: false },
    
    // sabo-hub
    { project_id: projectMap['sabo-hub'], platform: 'facebook', url: 'https://facebook.com/sabohub', username: '@sabohub', followers_count: 0, is_verified: false },
    { project_id: projectMap['sabo-hub'], platform: 'telegram', url: 'https://t.me/sabohub', username: '@sabohub', followers_count: 0, is_verified: false },
    
    // vungtau-dream-homes
    { project_id: projectMap['vungtau-dream-homes'], platform: 'facebook', url: 'https://facebook.com/vungtaudreamhomes', username: '@vungtaudreamhomes', followers_count: 0, is_verified: false },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'youtube', url: 'https://youtube.com/@vungtaudreamhomes', username: '@vungtaudreamhomes', followers_count: 0, is_verified: false },
  ];

  for (const link of socialLinks) {
    if (link.project_id) {
      const { error } = await supabase.from('project_social_links').insert(link);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding social ${link.platform}:`, error.message);
      } else {
        console.log(`  ✅ ${link.platform}: ${link.username}`);
      }
    }
  }

  // ========== ANALYTICS ==========
  console.log('\n📊 Seeding analytics...');
  const analytics = [
    { project_id: projectMap['longsang-admin'], platform: 'google_analytics', tracking_id: 'G-XXXXXXXXXX', property_name: 'LongSang Admin', is_active: true },
    { project_id: projectMap['longsang-portfolio'], platform: 'google_analytics', tracking_id: 'G-PORTFOLIO01', property_name: 'LongSang Portfolio', is_active: true },
    { project_id: projectMap['ainewbie-web'], platform: 'google_analytics', tracking_id: 'G-AINEWBIE01', property_name: 'AI Newbie Website', is_active: true },
    { project_id: projectMap['ainewbie-web'], platform: 'google_search_console', tracking_id: 'ainewbie.vn', property_name: 'AI Newbie GSC', is_active: true },
    { project_id: projectMap['sabo-hub'], platform: 'google_analytics', tracking_id: 'G-SABOHUB001', property_name: 'Sabo Hub', is_active: true },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'google_analytics', tracking_id: 'G-VUNGTAU001', property_name: 'Vung Tau Dream Homes', is_active: true },
  ];

  for (const item of analytics) {
    if (item.project_id) {
      const { error } = await supabase.from('project_analytics').insert(item);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding analytics ${item.platform}:`, error.message);
      } else {
        console.log(`  ✅ ${item.platform}: ${item.tracking_id}`);
      }
    }
  }

  // ========== INTEGRATIONS ==========
  console.log('\n🔌 Seeding integrations...');
  const integrations = [
    // longsang-admin
    { project_id: projectMap['longsang-admin'], platform: 'supabase', integration_type: 'database', is_active: true, config: {}, notes: 'Main database' },
    { project_id: projectMap['longsang-admin'], platform: 'vercel', integration_type: 'hosting', is_active: true, config: {}, notes: 'Deployment' },
    { project_id: projectMap['longsang-admin'], platform: 'n8n', integration_type: 'automation', is_active: true, config: {}, notes: 'Workflow automation' },
    { project_id: projectMap['longsang-admin'], platform: 'github', integration_type: 'ci_cd', is_active: true, config: {}, notes: 'Source control' },
    
    // ainewbie-web
    { project_id: projectMap['ainewbie-web'], platform: 'supabase', integration_type: 'database', is_active: true, config: {}, notes: 'User data' },
    { project_id: projectMap['ainewbie-web'], platform: 'vercel', integration_type: 'hosting', is_active: true, config: {}, notes: 'Deployment' },
    { project_id: projectMap['ainewbie-web'], platform: 'stripe', integration_type: 'payment', is_active: false, config: {}, notes: 'Payment processing - pending' },
    
    // sabo-hub
    { project_id: projectMap['sabo-hub'], platform: 'supabase', integration_type: 'database', is_active: true, config: {}, notes: 'Project database' },
    { project_id: projectMap['sabo-hub'], platform: 'vercel', integration_type: 'hosting', is_active: true, config: {}, notes: 'Hosting' },
    
    // vungtau-dream-homes
    { project_id: projectMap['vungtau-dream-homes'], platform: 'supabase', integration_type: 'database', is_active: true, config: {}, notes: 'Property listings' },
    { project_id: projectMap['vungtau-dream-homes'], platform: 'cloudflare', integration_type: 'cdn', is_active: true, config: {}, notes: 'CDN & DNS' },
  ];

  for (const item of integrations) {
    if (item.project_id) {
      const { error } = await supabase.from('project_integrations').insert(item);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding integration ${item.platform}:`, error.message);
      } else {
        console.log(`  ✅ ${item.platform} (${item.integration_type})`);
      }
    }
  }

  // ========== CONTACTS ==========
  console.log('\n👥 Seeding contacts...');
  const contacts = [
    { project_id: projectMap['longsang-admin'], name: 'Long Sang', role: 'owner', email: 'longsang@example.com', phone: '+84 xxx xxx xxx', is_primary: true },
    { project_id: projectMap['ainewbie-web'], name: 'Long Sang', role: 'owner', email: 'longsang@ainewbie.vn', phone: '+84 xxx xxx xxx', is_primary: true },
    { project_id: projectMap['sabo-hub'], name: 'Long Sang', role: 'owner', email: 'longsang@sabohub.vn', phone: '+84 xxx xxx xxx', is_primary: true },
    { project_id: projectMap['vungtau-dream-homes'], name: 'Long Sang', role: 'owner', email: 'contact@vungtaudreamhomes.vn', phone: '+84 xxx xxx xxx', is_primary: true },
  ];

  for (const contact of contacts) {
    if (contact.project_id) {
      const { error } = await supabase.from('project_contacts').insert(contact);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding contact ${contact.name}:`, error.message);
      } else {
        console.log(`  ✅ ${contact.name} (${contact.role})`);
      }
    }
  }

  // ========== DOCUMENTS ==========
  console.log('\n📄 Seeding documents...');
  const documents = [
    { project_id: projectMap['longsang-admin'], title: 'Project README', doc_type: 'readme', content: '# LongSang Admin\n\nAdmin dashboard for managing all projects.', url: '', notes: '' },
    { project_id: projectMap['longsang-admin'], title: 'Supabase Setup Guide', doc_type: 'guide', content: 'Instructions for setting up Supabase connection.', url: '', notes: '' },
    { project_id: projectMap['longsang-admin'], title: 'n8n Workflows Documentation', doc_type: 'link', content: '', url: 'https://docs.n8n.io', notes: 'Official n8n docs' },
    { project_id: projectMap['ainewbie-web'], title: 'Marketing Plan 2025', doc_type: 'note', content: 'Q1: Launch AI courses\nQ2: Expand social media\nQ3: Partnership programs', url: '', notes: '' },
  ];

  for (const doc of documents) {
    if (doc.project_id) {
      const { error } = await supabase.from('project_documents').insert(doc);
      if (error && !error.message.includes('duplicate')) {
        console.error(`  Error adding document ${doc.title}:`, error.message);
      } else {
        console.log(`  ✅ ${doc.title}`);
      }
    }
  }

  console.log('\n✅ Seeding completed!');
  
  // Summary
  console.log('\n📋 Summary:');
  console.log(`   Domains: ${domains.filter(d => d.project_id).length}`);
  console.log(`   Social Links: ${socialLinks.filter(s => s.project_id).length}`);
  console.log(`   Analytics: ${analytics.filter(a => a.project_id).length}`);
  console.log(`   Integrations: ${integrations.filter(i => i.project_id).length}`);
  console.log(`   Contacts: ${contacts.filter(c => c.project_id).length}`);
  console.log(`   Documents: ${documents.filter(d => d.project_id).length}`);
}

seedProjectData().catch(console.error);
