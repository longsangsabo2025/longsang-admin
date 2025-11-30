const https = require('https');

const USER_TOKEN = 'EAATDePmTd34BQA8crAJ9xRYoYxYvOGs3wJaHopve6TagiIoKttEulU3q76kmkbtrvg8rgkXzwb3JnvHE2YIEEN9qkP7SwtrryZCRCuxZADYZAu4iHB4pmU6rUgmQW2mYpim1bT7zzqKPKPiDr1t8yjZClnBFkN8m45TNTKev86ELF91dOlUZCWe23JEHEUH88';

// Threads App ID từ cấu hình trước
const THREADS_APP_ID = '858444256689767';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
    };
    
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('🧵 THREADS API CONNECTION TEST\n');
  console.log('=' .repeat(50));
  
  // Test 1: Kiểm tra quyền threads trong token
  console.log('\n📋 Checking token permissions...');
  const permissions = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${USER_TOKEN}`);
  
  if (permissions.data) {
    const threadsPerms = permissions.data.filter(p => p.permission.includes('threads'));
    console.log('Threads permissions:', threadsPerms);
  }
  
  // Test 2: Thử Threads API với Facebook token
  console.log('\n🧵 Testing Threads API...');
  const threadsMe = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${USER_TOKEN}`);
  console.log('Threads /me response:', JSON.stringify(threadsMe, null, 2));
  
  // Test 3: Thử với user ID
  console.log('\n👤 Getting Facebook User ID...');
  const fbMe = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${USER_TOKEN}`);
  console.log('Facebook User:', fbMe);
  
  if (fbMe.id) {
    // Try to get Threads account linked to this user
    console.log('\n🔗 Checking Threads account for user', fbMe.id);
    const threadsAccount = await fetch(`https://graph.threads.net/v1.0/${fbMe.id}?fields=id,username&access_token=${USER_TOKEN}`);
    console.log('Threads Account:', JSON.stringify(threadsAccount, null, 2));
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('\n📝 NOTES:');
  console.log('- Threads API cần token riêng từ Threads App');
  console.log('- Threads App ID:', THREADS_APP_ID);
  console.log('- Cần OAuth flow riêng cho Threads');
}

main().catch(console.error);
