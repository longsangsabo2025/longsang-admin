// Test agent execution API
const agentId = 'fbda741f-9734-40bc-aabf-f03636b15ca7';
const apiUrl = `http://localhost:3001/api/agents/${agentId}/execute`;

console.log('🧪 Testing Agent Execution API...\n');
console.log(`POST ${apiUrl}`);
console.log(`Input: { topic: "AI Marketing Strategy" }\n`);

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    topic: 'AI Marketing Strategy',
    style: 'professional',
    length: 'medium',
  }),
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('❌ Error:', error.message);
  });
