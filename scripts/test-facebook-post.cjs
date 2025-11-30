/**
 * Test Post to Facebook Page
 * This will post a test message to your Facebook Page
 */

require('dotenv').config();
const https = require('https');

const PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const PAGE_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

console.log('\n📝 Facebook Page Post Test');
console.log('==========================\n');

if (!PAGE_ID || !PAGE_TOKEN) {
  console.log('❌ Missing FACEBOOK_PAGE_ID or FACEBOOK_PAGE_ACCESS_TOKEN in .env');
  process.exit(1);
}

console.log('📄 Page ID:', PAGE_ID);
console.log('🔑 Token:', PAGE_TOKEN.substring(0, 30) + '...');
console.log('');

// Test message
const testMessage = `🧪 Test từ Longsang Admin System

✅ Facebook Integration hoạt động!
📅 ${new Date().toLocaleString('vi-VN')}

#SaboBilliards #Test #AutoPost`;

function postToPage(message) {
  return new Promise((resolve, reject) => {
    // privacy: SELF = chỉ mình tôi xem được (riêng tư)
    const postData = `message=${encodeURIComponent(message)}&access_token=${PAGE_TOKEN}&published=false`;
    
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v18.0/${PAGE_ID}/feed`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Parse error: ' + data));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function test() {
  console.log('📤 Posting test message...\n');
  console.log('Message:');
  console.log('─'.repeat(40));
  console.log(testMessage);
  console.log('─'.repeat(40));
  console.log('');
  
  try {
    const result = await postToPage(testMessage);
    
    if (result.error) {
      console.log('❌ Error:', result.error.message);
      console.log('   Code:', result.error.code);
      
      if (result.error.code === 190) {
        console.log('\n💡 Token có thể đã hết hạn hoặc không có quyền.');
        console.log('   Chạy: node scripts/convert-facebook-token.cjs');
      }
      if (result.error.code === 200) {
        console.log('\n💡 Cần permission: pages_manage_posts');
        console.log('   Lấy token mới tại: https://developers.facebook.com/tools/explorer/');
      }
    } else if (result.id) {
      const postId = result.id;
      const postUrl = `https://www.facebook.com/${postId.replace('_', '/posts/')}`;
      
      console.log('✅ POST THÀNH CÔNG!');
      console.log('');
      console.log('📎 Post ID:', postId);
      console.log('🔗 View at:', postUrl);
      console.log('');
      console.log('==========================');
      console.log('🎉 Facebook Integration Ready!');
      console.log('==========================');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Ask for confirmation
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📌 Chế độ: UNPUBLISHED (Bài viết nháp - không hiển thị công khai)');

// Auto run for testing
test().then(() => process.exit(0));
