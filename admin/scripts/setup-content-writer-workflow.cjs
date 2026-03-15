/**
 * Setup Content Writer Workflow - End-to-End Test
 * 
 * Chạy script này để:
 * 1. Import workflow vào n8n
 * 2. Update workflow_templates với n8n_workflow_id
 * 3. Test execute workflow
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Config
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODU5NDQ0LCJleHAiOjE3NjYzNzk2MDB9.soMLJs-B80r6MS6PELzM9u0gel2xofvrtLQ3UJ-xziQ';

const SUPABASE_URL = 'https://diexsbzqwsbpilsymnfb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkN8nConnection() {
  console.log('🔍 Checking n8n connection...');
  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`n8n API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ n8n connected! Found ${data.data?.length || 0} workflows`);
    return true;
  } catch (error) {
    console.error('❌ Cannot connect to n8n:', error.message);
    console.log('\n💡 Make sure n8n is running at', N8N_URL);
    return false;
  }
}

async function importWorkflow() {
  console.log('\n📦 Importing Content Writer workflow to n8n...');
  
  // Read workflow JSON
  const workflowPath = path.join(__dirname, '..', 'n8n', 'workflows', 'content-writer-agent.json');
  const workflowJson = JSON.parse(fs.readFileSync(workflowPath, 'utf-8'));
  
  try {
    // Check if workflow already exists
    const listResponse = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    const existingWorkflows = await listResponse.json();
    const existing = existingWorkflows.data?.find(w => w.name === 'Content Writer Agent');
    
    if (existing) {
      console.log(`⚠️  Workflow already exists with ID: ${existing.id}`);
      return existing;
    }
    
    // Create new workflow
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowJson)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to import: ${error}`);
    }
    
    const result = await response.json();
    console.log(`✅ Workflow imported! ID: ${result.id}`);
    return result;
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    return null;
  }
}

async function activateWorkflow(workflowId) {
  console.log(`\n⚡ Activating workflow ${workflowId}...`);
  
  try {
    const response = await fetch(`${N8N_URL}/api/v1/workflows/${workflowId}/activate`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Activation failed: ${error}`);
    }
    
    console.log('✅ Workflow activated!');
    return true;
  } catch (error) {
    console.error('❌ Activation failed:', error.message);
    return false;
  }
}

async function updateDatabase(workflowId, webhookUrl) {
  console.log('\n💾 Updating database...');
  
  try {
    // Update workflow_templates
    const { error: templateError } = await supabase
      .from('workflow_templates')
      .update({
        n8n_workflow_id: workflowId,
        webhook_path: '/webhook/content-writer',
        status: 'active'
      })
      .eq('slug', 'content-writer');
    
    if (templateError) {
      console.warn('⚠️  Template update warning:', templateError.message);
    } else {
      console.log('✅ workflow_templates updated');
    }
    
    // Update any existing instances
    const { error: instanceError } = await supabase
      .from('project_workflow_instances')
      .update({
        n8n_workflow_id: workflowId,
        webhook_url: webhookUrl,
        status: 'active'
      })
      .ilike('name', '%Content Writer%');
    
    if (!instanceError) {
      console.log('✅ project_workflow_instances updated');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database update failed:', error.message);
    return false;
  }
}

async function testWorkflow(webhookUrl) {
  console.log('\n🧪 Testing workflow execution...');
  
  const testPayload = {
    topic: 'Benefits of AI in Modern Business',
    content_type: 'blog_post',
    tone: 'professional',
    word_count: 300,
    project_id: 'test-project',
    agent_id: 'test-agent'
  };
  
  try {
    console.log('📤 Sending test request to:', webhookUrl);
    console.log('   Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('\n✅ Workflow executed successfully!');
      console.log('📝 Generated content preview:');
      console.log('---');
      console.log(result.content?.substring(0, 500) + '...');
      console.log('---');
      console.log('\n📊 Metadata:', JSON.stringify(result.metadata, null, 2));
    } else {
      console.log('❌ Workflow returned error:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Content Writer Workflow Setup\n');
  console.log('=' .repeat(50));
  
  // Step 1: Check n8n connection
  const connected = await checkN8nConnection();
  if (!connected) {
    console.log('\n⚠️  Skipping n8n import. You can import manually later.');
    console.log('   File: n8n/workflows/content-writer-agent.json');
    return;
  }
  
  // Step 2: Import workflow
  const workflow = await importWorkflow();
  if (!workflow) {
    console.log('\n❌ Setup incomplete');
    return;
  }
  
  // Step 3: Activate workflow
  await activateWorkflow(workflow.id);
  
  // Step 4: Get webhook URL
  const webhookUrl = `${N8N_URL}/webhook/content-writer`;
  console.log(`\n🔗 Webhook URL: ${webhookUrl}`);
  
  // Step 5: Update database
  await updateDatabase(workflow.id, webhookUrl);
  
  // Step 6: Ask to test
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Setup complete!\n');
  console.log('To test the workflow manually, run:');
  console.log(`curl -X POST ${webhookUrl} \\`);
  console.log('  -H "Content-Type: application/json" \\');
  console.log('  -d \'{"topic": "AI Trends", "content_type": "blog_post", "tone": "professional", "word_count": 300}\'');
  
  // Auto-test if OpenAI is configured
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n🧪 Run test execution? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      await testWorkflow(webhookUrl);
    }
    rl.close();
    console.log('\n✨ Done!');
  });
}

main().catch(console.error);
