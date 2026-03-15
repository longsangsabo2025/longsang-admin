const https = require('https');

const LINKEDIN_ACCESS_TOKEN = 'AQUFjMQ06FJ931PdlfE_PQiZUXU1XhLP-K6AkR1CyTwkTODdtG4US9EWxRL1IPsSIvxG9489rQya1IMyWGFlILfEBDmOrkvYOvNsSnLFX0efhNJYrCEZz6Hs-gFw6WDWeRWWW7BH-0ZF08ZT1OjqzGNte-pnrh8MQNMoO9aabobmrjyKxtuSzsvrwyMP6BG-Hw_obLl-ClLIhEbd1Ks9x2g3PCu9p1jREU-UfvqG4Df3ze3DjGbXjCv9JxCl91kcooFAi-MeF-TSWzrHm6O0_zLP3LQEtcX6N95GuQJ4wAaQQsEy-rCyDKtDJpp5FuCPvvCaYJP4dXdbRCK90L7PEjz6wmnKPw';
const LINKEDIN_USER_ID = 'HhV8LImTty';

function post(path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const options = {
      hostname: 'api.linkedin.com',
      path: path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINKEDIN_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'X-Restli-Protocol-Version': '2.0.0',
        ...headers,
      },
    };
    
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ data: JSON.parse(data), status: res.statusCode, headers: res.headers });
        } catch (e) {
          resolve({ data: data, status: res.statusCode, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('💼 LINKEDIN POST TEST\n');
  console.log('User ID:', LINKEDIN_USER_ID);
  console.log('\n' + '='.repeat(50));
  
  const text = `🎱 Test từ SABO Admin!

LinkedIn API đã kết nối thành công! 🚀

Đây là bài viết tự động từ hệ thống quản lý SABO.

#SABOBilliards #Automation #LinkedIn #Test`;

  console.log('\n📝 Text:', text);
  
  // Create post using UGC Post API
  console.log('\n📤 Creating LinkedIn post...');
  
  const postData = {
    author: `urn:li:person:${LINKEDIN_USER_ID}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text
        },
        shareMediaCategory: 'NONE'
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };
  
  const result = await post('/v2/ugcPosts', postData);
  
  console.log('\nResponse status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));
  
  if (result.status === 201 || result.headers['x-restli-id']) {
    console.log('\n🎉 POSTED TO LINKEDIN!');
    console.log('Post ID:', result.headers['x-restli-id'] || 'Check LinkedIn');
    console.log('\n✅ Mở LinkedIn để xem bài viết!');
  } else if (result.status === 422 || result.data.message) {
    console.log('\n⚠️ Note:', result.data.message);
  } else {
    console.log('\n❌ Error posting');
  }
}

main().catch(console.error);
