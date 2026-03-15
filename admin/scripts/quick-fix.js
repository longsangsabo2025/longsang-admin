import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  // 1. List projects
  const { data: projects, error: pErr } = await supabase
    .from('projects')
    .select('id, name');
  
  console.log('=== PROJECTS ===');
  if (pErr) {
    console.log('Error:', pErr.message);
  } else {
    projects.forEach(p => console.log(`${p.id} - ${p.name}`));
  }
  
  // 2. Count posts without project_id
  const { count, error: cErr } = await supabase
    .from('content_queue')
    .select('*', { count: 'exact', head: true })
    .is('project_id', null);
  
  console.log('\n=== POSTS WITHOUT PROJECT ===');
  console.log('Count:', count);
  
  // 3. If we have projects and orphan posts, link them
  if (projects && projects.length > 0 && count > 0) {
    const defaultProject = projects.find(p => 
      p.name.toLowerCase().includes('sabo') || 
      p.name.toLowerCase().includes('arena')
    ) || projects[0];
    
    console.log('\n=== LINKING POSTS ===');
    console.log('Will link to:', defaultProject.name, `(${defaultProject.id})`);
    
    const { data, error } = await supabase
      .from('content_queue')
      .update({ project_id: defaultProject.id })
      .is('project_id', null)
      .select('id');
    
    if (error) {
      console.log('Error:', error.message);
    } else {
      console.log('Updated:', data?.length, 'posts');
    }
  }
}

run().catch(console.error);
