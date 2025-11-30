#!/usr/bin/env node

/**
 * Script to trigger n8n Customer Support workflow
 * Runs every 5 minutes via Windows Task Scheduler or n8n Schedule node
 */

const https = require('https');
const http = require('http');

const N8N_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3YmZjOTUxMC02ZjI3LTRiYzEtYThhYS0xOTc0ZTk5MmI1OWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzYzODg3OTQ3fQ.nFKxh_czXZ2HNKWr5kGrc63KXQ5PAOIZB9OL4iM5QLk';
const N8N_URL = 'http://localhost:5678';

// List all workflows and find active Customer Support workflow
async function findCustomerSupportWorkflow() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: '/api/v1/workflows',
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const workflows = response.data || [];
          
          // Find active Customer Support workflow
          const supportWorkflow = workflows.find(w => 
            w.name.includes('Customer Support') && w.active === true
          );
          
          if (supportWorkflow) {
            console.log(`✅ Found active workflow: ${supportWorkflow.name} (ID: ${supportWorkflow.id})`);
            resolve(supportWorkflow.id);
          } else {
            // If no active, use first one found
            const anySupport = workflows.find(w => w.name.includes('Customer Support'));
            if (anySupport) {
              console.log(`⚠️  Found workflow but not active: ${anySupport.name} (ID: ${anySupport.id})`);
              resolve(anySupport.id);
            } else {
              reject(new Error('❌ No Customer Support workflow found'));
            }
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

// Trigger workflow execution
async function triggerWorkflow(workflowId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5678,
      path: `/api/v1/workflows/${workflowId}/execute`,
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Workflow triggered successfully`);
          try {
            const response = JSON.parse(data);
            console.log(`   Execution ID: ${response.data?.id || 'N/A'}`);
          } catch (e) {}
          resolve(data);
        } else {
          console.error(`❌ Failed to trigger workflow: ${res.statusCode}`);
          console.error(data);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.end(JSON.stringify({}));
  });
}

// Main execution
(async () => {
  try {
    console.log('🚀 Starting n8n workflow trigger...\n');
    
    const workflowId = await findCustomerSupportWorkflow();
    console.log(`\n🎯 Triggering workflow ${workflowId}...`);
    
    await triggerWorkflow(workflowId);
    
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
})();
