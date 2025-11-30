const axios = require('axios');

async function testCredentialAPI() {
  const API_URL = 'http://localhost:3001/api/credentials';
  
  console.log('🧪 Testing Credential Encryption API\n');
  
  try {
    // Test 1: Verify encryption/decryption
    console.log('1️⃣ Testing encryption verification...');
    const verifyResult = await axios.post(`${API_URL}/verify`, {
      data: 'my-super-secret-password-123'
    });
    console.log('✅ Verify Result:', verifyResult.data);
    console.log('   Original:', verifyResult.data.original);
    console.log('   Encrypted:', verifyResult.data.encrypted.substring(0, 50) + '...');
    console.log('   Match:', verifyResult.data.match ? '✓' : '✗');
    console.log('');
    
    // Test 2: Encrypt data
    console.log('2️⃣ Testing data encryption...');
    const encryptResult = await axios.post(`${API_URL}/encrypt`, {
      data: 'sk-proj-openai-key-abc123'
    });
    console.log('✅ Encrypted:', encryptResult.data.encrypted.substring(0, 60) + '...');
    console.log('');
    
    // Test 3: Decrypt data
    console.log('3️⃣ Testing data decryption...');
    const decryptResult = await axios.post(`${API_URL}/decrypt`, {
      encrypted: encryptResult.data.encrypted
    });
    console.log('✅ Decrypted:', decryptResult.data.decrypted);
    console.log('');
    
    // Test 4: Store credential
    console.log('4️⃣ Testing credential storage...');
    const storeResult = await axios.post(`${API_URL}`, {
      name: 'OpenAI API Key',
      category: 'ai-services',
      username: 'admin@test.com',
      apiKey: 'sk-proj-test-key-xyz789',
      notes: 'Production API key',
      url: 'https://platform.openai.com',
      tags: ['production', 'gpt-4']
    });
    console.log('✅ Stored:', storeResult.data.message);
    console.log('   Encrypted API Key:', storeResult.data.credential.encrypted_api_key.substring(0, 50) + '...');
    console.log('');
    
    // Test 5: Batch encrypt
    console.log('5️⃣ Testing batch encryption...');
    const batchResult = await axios.post(`${API_URL}/batch-encrypt`, {
      credentials: [
        { name: 'GitHub Token', category: 'api-keys', apiKey: 'ghp_abc123' },
        { name: 'Supabase Key', category: 'databases', password: 'supabase_pass_456' }
      ]
    });
    console.log('✅ Batch encrypted:', batchResult.data.encrypted.length, 'credentials');
    console.log('');
    
    console.log('🎉 All tests passed!');
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCredentialAPI();
