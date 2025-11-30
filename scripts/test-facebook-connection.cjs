/**
 * Facebook API Connection Test
 * Tests the connection to Facebook Graph API using App credentials
 */

require('dotenv').config();
const https = require('https');

const FACEBOOK_APP_ID = process.env.VITE_FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

console.log('\n🔵 Facebook API Connection Test');
console.log('================================\n');

// Check if credentials exist
if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
  console.log('❌ Missing Facebook credentials!');
  console.log('   VITE_FACEBOOK_APP_ID:', FACEBOOK_APP_ID ? '✓ Set' : '✗ Missing');
  console.log('   FACEBOOK_APP_SECRET:', FACEBOOK_APP_SECRET ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

console.log('📋 Credentials Status:');
console.log('   App ID:', FACEBOOK_APP_ID);
console.log('   App Secret:', FACEBOOK_APP_SECRET.substring(0, 8) + '...' + FACEBOOK_APP_SECRET.substring(FACEBOOK_APP_SECRET.length - 4));
console.log('');

// Test 1: Get App Access Token
async function getAppAccessToken() {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    }).on('error', reject);
  });
}

// Test 2: Get App Info
async function getAppInfo(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v18.0/${FACEBOOK_APP_ID}?fields=id,name,category,link,namespace,description&access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    }).on('error', reject);
  });
}

// Test 3: Debug Token
async function debugToken(accessToken) {
  return new Promise((resolve, reject) => {
    const url = `https://graph.facebook.com/v18.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + data));
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  try {
    // Test 1: Get App Access Token
    console.log('🔄 Test 1: Getting App Access Token...');
    const tokenResponse = await getAppAccessToken();
    
    if (tokenResponse.error) {
      console.log('❌ Failed to get access token!');
      console.log('   Error:', tokenResponse.error.message);
      console.log('   Type:', tokenResponse.error.type);
      console.log('   Code:', tokenResponse.error.code);
      return false;
    }
    
    const accessToken = tokenResponse.access_token;
    console.log('✅ Got App Access Token!');
    console.log('   Token Type:', tokenResponse.token_type || 'bearer');
    console.log('   Token Preview:', accessToken.substring(0, 30) + '...');
    console.log('');
    
    // Test 2: Get App Info
    console.log('🔄 Test 2: Fetching App Information...');
    const appInfo = await getAppInfo(accessToken);
    
    if (appInfo.error) {
      console.log('⚠️  Could not fetch app info (this may be normal for some app types)');
      console.log('   Error:', appInfo.error.message);
    } else {
      console.log('✅ App Information:');
      console.log('   App ID:', appInfo.id);
      console.log('   Name:', appInfo.name || 'N/A');
      console.log('   Category:', appInfo.category || 'N/A');
      console.log('   Namespace:', appInfo.namespace || 'N/A');
    }
    console.log('');
    
    // Test 3: Debug Token
    console.log('🔄 Test 3: Validating Token...');
    const debugInfo = await debugToken(accessToken);
    
    if (debugInfo.data) {
      console.log('✅ Token Validation:');
      console.log('   App ID:', debugInfo.data.app_id);
      console.log('   Type:', debugInfo.data.type);
      console.log('   Valid:', debugInfo.data.is_valid ? '✓ Yes' : '✗ No');
      if (debugInfo.data.scopes) {
        console.log('   Scopes:', debugInfo.data.scopes.join(', '));
      }
    }
    console.log('');
    
    // Summary
    console.log('================================');
    console.log('🎉 Facebook API Connection: SUCCESS!');
    console.log('================================');
    console.log('');
    console.log('📌 Next Steps:');
    console.log('   1. Set up Facebook Login in your app');
    console.log('   2. Get User Access Token via OAuth');
    console.log('   3. Get Page Access Token for page management');
    console.log('   4. Add required permissions in App Review');
    console.log('');
    console.log('🔗 Facebook Developer Console:');
    console.log('   https://developers.facebook.com/apps/' + FACEBOOK_APP_ID);
    console.log('');
    
    return true;
    
  } catch (error) {
    console.log('');
    console.log('❌ Connection Test Failed!');
    console.log('   Error:', error.message);
    console.log('');
    console.log('🔍 Troubleshooting:');
    console.log('   1. Check if App ID and Secret are correct');
    console.log('   2. Verify app is not in Development Mode restrictions');
    console.log('   3. Check if app has been deleted or disabled');
    console.log('   4. Ensure network connection is working');
    return false;
  }
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
});
