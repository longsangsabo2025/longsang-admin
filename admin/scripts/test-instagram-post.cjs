const https = require('https');

// SABO Billiards Instagram 
const INSTAGRAM_ID = '17841474279844606';
const PAGE_TOKEN = 'EAATDePmTd34BQDJMP9a6IqX79SZBtE1MuOuvP1cyZAWQ1Kmh8ceGrsUpyYk0P7P0S7IZAHMndzVt11gCWPunK6KWKl4rospYBj9Bm75mdOaKpX3nTay7kX5AGT5ZBdY2c8ippUXdhyL7CQeCw1ijB8gksw2NqT4j5svZCxt9IuCFblGksu5PFYwyMuT8Qxi4Np2oeZBTkZD';

// Test image - use a public image URL
const IMAGE_URL = 'https://images.unsplash.com/photo-1493246318656-5bfd4cfb29b8?w=1080';
const CAPTION = '🎱 Test từ SABO Admin - Instagram API đã kết nối thành công! #SABOBilliards #Test';

function post(path, data) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams(data).toString();
    const options = {
      hostname: 'graph.facebook.com',
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
          resolve(data);
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('📸 INSTAGRAM POST TEST\n');
  console.log('Instagram Account ID:', INSTAGRAM_ID);
  console.log('Image:', IMAGE_URL);
  console.log('Caption:', CAPTION);
  console.log('\n' + '='.repeat(50));
  
  // Step 1: Create media container
  console.log('\n📤 Step 1: Creating media container...');
  const container = await post(`/v18.0/${INSTAGRAM_ID}/media`, {
    image_url: IMAGE_URL,
    caption: CAPTION,
    access_token: PAGE_TOKEN
  });
  
  if (container.error) {
    console.error('❌ Error creating container:', container.error.message);
    console.error('Error code:', container.error.code);
    console.error('Error type:', container.error.type);
    return;
  }
  
  console.log('✅ Container created! ID:', container.id);
  
  // Step 2: Wait a moment for processing
  console.log('\n⏳ Step 2: Waiting for media processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Step 3: Publish the media
  console.log('\n📤 Step 3: Publishing to Instagram...');
  const publish = await post(`/v18.0/${INSTAGRAM_ID}/media_publish`, {
    creation_id: container.id,
    access_token: PAGE_TOKEN
  });
  
  if (publish.error) {
    console.error('❌ Error publishing:', publish.error.message);
    return;
  }
  
  console.log('✅ POSTED TO INSTAGRAM!');
  console.log('Post ID:', publish.id);
  console.log('\n🎉 Mở Instagram @sabobilliard để xem bài viết!');
}

main().catch(console.error);
