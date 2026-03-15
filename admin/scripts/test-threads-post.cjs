const https = require('https');

const THREADS_USER_ID = '25295715200066837';
const THREADS_ACCESS_TOKEN = 'THAAMMwCD6vmdBUVFWWDNsNTNXY3laZAHFOeGszYzAzTlNVOHdBeDcxT3g0azhmRzltNUdZAQmQ0bkVNQ0FyakxpYmc0d2FfcXpiXzY4S2psWmEyQUtJTUw0bkdvQk9Rd3lod3VZAUGVXQlZALbTJGcVZACNmRudVFjU0xubFQxNE1zUFpWT3JGN0l1UC00MEI1TVEZD';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname: 'graph.threads.net',
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, statusCode: res.statusCode });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🧵 THREADS POST TEST\n');
  console.log('User ID:', THREADS_USER_ID);
  console.log('Username: @baddie.4296');
  console.log('\n' + '='.repeat(50));
  
  const text = '🎱 Test từ SABO Admin!\n\nThreads API đã kết nối thành công! 🚀\n\n#SABOBilliards #Automation #Test';
  
  console.log('\n📝 Text:', text);
  
  // Step 1: Create media container
  console.log('\n📤 Step 1: Creating thread container...');
  const container = await post(`/v1.0/${THREADS_USER_ID}/threads`, {
    media_type: 'TEXT',
    text: text,
    access_token: THREADS_ACCESS_TOKEN
  });
  
  console.log('Container response:', JSON.stringify(container, null, 2));
  
  if (container.error) {
    console.error('❌ Error creating container:', container.error.message);
    return;
  }
  
  if (!container.id) {
    console.error('❌ No container ID returned');
    return;
  }
  
  console.log('✅ Container created! ID:', container.id);
  
  // Step 2: Wait a moment
  console.log('\n⏳ Step 2: Waiting for processing...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Step 3: Publish
  console.log('\n📤 Step 3: Publishing thread...');
  const publish = await post(`/v1.0/${THREADS_USER_ID}/threads_publish`, {
    creation_id: container.id,
    access_token: THREADS_ACCESS_TOKEN
  });
  
  console.log('Publish response:', JSON.stringify(publish, null, 2));
  
  if (publish.error) {
    console.error('❌ Error publishing:', publish.error.message);
    return;
  }
  
  console.log('\n🎉 POSTED TO THREADS!');
  console.log('Post ID:', publish.id);
  console.log('\n✅ Mở Threads @baddie.4296 để xem bài viết!');
}

main().catch(console.error);
