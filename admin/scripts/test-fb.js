// Test Facebook API
import 'dotenv/config';

const token = process.env.FACEBOOK_PAGE_SABO_ARENA_TOKEN;
const pageId = process.env.FACEBOOK_PAGE_SABO_ARENA_ID;

console.log('Testing SABO Arena...');
console.log('Page ID:', pageId);
console.log('Token:', token ? token.substring(0, 20) + '...' : 'MISSING');

fetch(`https://graph.facebook.com/v18.0/${pageId}/feed?fields=message,created_time&limit=3&access_token=${token}`)
  .then(r => r.json())
  .then(data => {
    console.log('\n📝 Recent posts on SABO Arena:');
    if (data.data) {
      data.data.forEach((post, i) => {
        console.log(`\n${i+1}. [${post.created_time}]`);
        console.log(`   ${post.message ? post.message.substring(0, 60) + '...' : '(no message)'}`);
      });
    } else {
      console.log('Error:', data);
    }
  })
  .catch(err => console.error('Error:', err));
