/**
 * Test n8n API routes
 */

const http = require('http');

const API_URL = 'http://localhost:3001';

async function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing n8n API routes...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing /api/health...');
  try {
    const health = await makeRequest('/api/health');
    console.log('   ✅ Health:', health.data.status);
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
    console.log('\n⚠️  API Server is not running! Start it with: npm run dev:api\n');
    return;
  }

  // Test 2: n8n status
  console.log('\n2️⃣ Testing /api/n8n/status...');
  try {
    const status = await makeRequest('/api/n8n/status');
    console.log('   Status:', status.status);
    console.log('   Data:', JSON.stringify(status.data, null, 2));
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
  }

  // Test 3: Get workflow templates (from DB)
  console.log('\n3️⃣ Testing workflow templates from Supabase...');
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    'https://diexsbzqwsbpilsymnfb.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDM5MjE5MSwiZXhwIjoyMDc1OTY4MTkxfQ.30ZRAfvIyQUBzyf3xqvrwXbeR15FXDnTGVvTfwmeEXY'
  );
  
  const { data: templates } = await supabase
    .from('workflow_templates')
    .select('id, name, slug, category')
    .limit(3);
  
  console.log('   Templates:', templates?.length || 0);
  templates?.forEach(t => console.log(`   - ${t.name} (${t.slug})`));

  // Test 4: Get workflow instances
  console.log('\n4️⃣ Testing workflow instances from Supabase...');
  const { data: instances } = await supabase
    .from('project_workflow_instances')
    .select('id, name, n8n_workflow_id, status')
    .limit(3);
  
  console.log('   Instances:', instances?.length || 0);
  instances?.forEach(i => console.log(`   - ${i.name} | n8n_id: ${i.n8n_workflow_id || 'NOT SYNCED'}`));

  // Test 5: Clone workflow API
  console.log('\n5️⃣ Testing POST /api/n8n/workflows/clone...');
  try {
    const cloneResult = await makeRequest('/api/n8n/workflows/clone', 'POST', {
      project_id: 'test-project',
      template_slug: 'content-writer'
    });
    console.log('   Status:', cloneResult.status);
    console.log('   Result:', JSON.stringify(cloneResult.data, null, 2));
  } catch (error) {
    console.log('   ❌ Failed:', error.message);
  }

  console.log('\n✅ Tests complete!\n');
}

runTests().catch(console.error);
