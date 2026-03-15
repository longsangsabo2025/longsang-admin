/**
 * 🔍 Diagnose why Scheduled Posts is empty
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function diagnose() {
  console.log('🔍 DIAGNOSING SCHEDULED POSTS...\n');
  
  // 1. Check content_queue
  const { data: posts, error: postsErr } = await supabase
    .from('content_queue')
    .select('id, title, status, project_id, scheduled_for')
    .limit(10);
  
  console.log('📦 content_queue:');
  console.log('   Total sample:', posts?.length || 0);
  console.log('   With project_id:', posts?.filter(p => p.project_id).length || 0);
  console.log('   Without project_id:', posts?.filter(p => !p.project_id).length || 0);
  
  // 2. Get projects
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .limit(10);
  
  console.log('\n📂 Projects:');
  projects?.forEach(p => {
    console.log(`   ${p.slug}: ${p.id}`);
  });
  
  // 3. Recommendation
  console.log('\n💡 RECOMMENDATION:');
  if (posts?.length > 0 && posts.filter(p => !p.project_id).length > 0) {
    console.log('   Posts exist but have no project_id assigned.');
    console.log('   Need to link posts to projects!');
    
    if (projects?.length > 0) {
      console.log('\n🚀 Quick fix: Assign all posts to first project?');
      console.log(`   Project: ${projects[0].name} (${projects[0].slug})`);
      console.log(`   ID: ${projects[0].id}`);
    }
  }
  
  process.exit(0);
}

diagnose();
