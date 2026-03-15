/**
 * Update workflow instances với n8n workflow ID
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://diexsbzqwsbpilsymnfb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
);

async function main() {
  // Get first workflow instance
  const { data: instances } = await supabase
    .from('project_workflow_instances')
    .select('id, name, project_id, n8n_workflow_id')
    .limit(5);

  console.log('📋 Current instances:');
  instances?.forEach(i => {
    console.log(`   - ${i.name} | n8n: ${i.n8n_workflow_id || 'NOT SET'}`);
  });

  if (instances?.length > 0) {
    // Update first instance với simple-test workflow
    const firstId = instances[0].id;
    console.log(`\n🔄 Updating instance ${firstId}...`);
    
    const { error } = await supabase
      .from('project_workflow_instances')
      .update({
        n8n_workflow_id: 'r5lKDRpvOoqYylvn',
        webhook_url: 'http://localhost:5678/webhook/simple-test',
        status: 'active'
      })
      .eq('id', firstId);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Updated!');
    }
  }

  // Verify
  const { data: updated } = await supabase
    .from('project_workflow_instances')
    .select('id, name, n8n_workflow_id, webhook_url, status')
    .not('n8n_workflow_id', 'is', null);

  console.log('\n📋 Instances with n8n_workflow_id:');
  updated?.forEach(i => {
    console.log(`   ✅ ${i.name}`);
    console.log(`      n8n: ${i.n8n_workflow_id}`);
    console.log(`      webhook: ${i.webhook_url}`);
  });
}

main().catch(console.error);
