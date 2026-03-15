import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function migrate() {
  console.log('🚀 Starting project groups migration...\n');

  // 1. Get all current projects
  const { data: projects, error: fetchError } = await supabase.from('projects').select('id, slug, name');
  if (fetchError) {
    console.error('Failed to fetch projects:', fetchError);
    return;
  }
  console.log('📦 Found', projects.length, 'projects');
  console.log('   Slugs:', projects.map(p => p.slug).join(', '));

  // 2. Create or get SABO Ecosystem parent
  let saboParent = projects.find(p => p.slug === 'sabo-ecosystem');
  if (!saboParent) {
    console.log('\n🎱 Creating SABO Ecosystem parent...');
    const { data, error } = await supabase.from('projects').insert({
      name: 'SABO Ecosystem',
      slug: 'sabo-ecosystem',
      description: 'Hệ sinh thái kinh doanh SABO - Billiards, Arena, Media, Shop',
      icon: '🎱',
      color: '#22c55e',
      status: 'active',
      is_active: true
    }).select().single();
    
    if (error) {
      console.error('   ❌ Error:', error.message);
    } else {
      saboParent = data;
      console.log('   ✅ Created:', saboParent.id);
    }
  } else {
    console.log('\n🎱 SABO Ecosystem already exists:', saboParent.id);
  }

  // 3. Create or get AI Ecosystem parent
  let aiParent = projects.find(p => p.slug === 'ai-ecosystem');
  if (!aiParent) {
    console.log('\n🤖 Creating AI Ecosystem parent...');
    const { data, error } = await supabase.from('projects').insert({
      name: 'AI Newbie Ecosystem',
      slug: 'ai-ecosystem',
      description: 'Hệ sinh thái học AI - Courses, Tools, Community',
      icon: '🤖',
      color: '#3b82f6',
      status: 'active',
      is_active: true
    }).select().single();
    
    if (error) {
      console.error('   ❌ Error:', error.message);
    } else {
      aiParent = data;
      console.log('   ✅ Created:', aiParent.id);
    }
  } else {
    console.log('\n🤖 AI Ecosystem already exists:', aiParent.id);
  }

  // 4. Update SABO child projects
  console.log('\n📝 Updating SABO child projects...');
  const saboSlugs = ['sabo-arena', 'sabo-hub', 'sabo-billiards', 'sabo-media', 'sabo-shop'];
  for (const slug of saboSlugs) {
    const project = projects.find(p => p.slug === slug);
    if (project && saboParent) {
      const { error } = await supabase.from('projects')
        .update({ metadata: { parent_id: saboParent.id, group: 'SABO' } })
        .eq('id', project.id);
      
      if (error) {
        console.log('   ❌', slug, '-', error.message);
      } else {
        console.log('   ✅', slug, '→ SABO Ecosystem');
      }
    } else if (!project) {
      console.log('   ⚠️', slug, 'not found');
    }
  }

  // 5. Update AI child projects
  console.log('\n📝 Updating AI child projects...');
  const aiSlugs = ['ainewbie-web', 'ai-newbie', 'ai-art', 'ai-secretary'];
  for (const slug of aiSlugs) {
    const project = projects.find(p => p.slug === slug);
    if (project && aiParent) {
      const { error } = await supabase.from('projects')
        .update({ metadata: { parent_id: aiParent.id, group: 'AI' } })
        .eq('id', project.id);
      
      if (error) {
        console.log('   ❌', slug, '-', error.message);
      } else {
        console.log('   ✅', slug, '→ AI Ecosystem');
      }
    } else if (!project) {
      console.log('   ⚠️', slug, 'not found');
    }
  }

  // 6. Mark parent projects
  console.log('\n🏷️ Marking parent projects...');
  if (saboParent) {
    await supabase.from('projects')
      .update({ metadata: { is_group: true, group: 'SABO' } })
      .eq('id', saboParent.id);
    console.log('   ✅ SABO Ecosystem marked as group');
  }
  if (aiParent) {
    await supabase.from('projects')
      .update({ metadata: { is_group: true, group: 'AI' } })
      .eq('id', aiParent.id);
    console.log('   ✅ AI Ecosystem marked as group');
  }

  console.log('\n✨ Migration complete!');
  
  // 7. Show final structure
  const { data: final } = await supabase.from('projects')
    .select('slug, name, metadata')
    .order('name');
  
  console.log('\n📊 Final project structure:');
  const groups = {};
  const standalone = [];
  
  for (const p of final || []) {
    const group = p.metadata?.group;
    const isGroup = p.metadata?.is_group;
    
    if (isGroup) {
      if (!groups[group]) groups[group] = { parent: null, children: [] };
      groups[group].parent = p;
    } else if (group) {
      if (!groups[group]) groups[group] = { parent: null, children: [] };
      groups[group].children.push(p);
    } else {
      standalone.push(p);
    }
  }
  
  for (const [name, { parent, children }] of Object.entries(groups)) {
    console.log(`\n📁 ${parent?.name || name}`);
    for (const child of children) {
      console.log(`   └── ${child.name}`);
    }
  }
  
  if (standalone.length) {
    console.log('\n📄 Standalone Projects:');
    for (const p of standalone) {
      console.log(`   • ${p.name}`);
    }
  }
}

migrate().catch(console.error);
