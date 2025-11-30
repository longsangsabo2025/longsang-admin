/**
 * YouTube API Connection Test
 * 
 * Sử dụng Google Service Account đã có trong .env
 */

const https = require('https');
const crypto = require('crypto');

// Service Account từ .env
const SERVICE_ACCOUNT = {
  "type": "service_account",
  "project_id": "long-sang-automation",
  "private_key_id": "44cb0ad226a70f49698d83f0c89f16eff2ee03a3",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDU2CM1JeNKkjZP\nkOZKd5KF6kkD6cJ4IZ9gJJlYRcfHfyemjMYwgnO4IrlpiP03h4V1P1pLKvqagNyd\nlvd5YNiGLSio3VFxTm3rGr8PidgdiauFRVJ0to7EImmNe3yq4I5yrvGo1psFXfEN\neLH5UqmOVNMEFRNl3EeXgojcgoXgG/WMl6tGmIyPgSUTIDpsTe20QkRjwe2UtSIb\nDO2V5bcsk0kkeM8TEbl5/BxmvjaIe43KF1FDFL30K9CMSjAXdnAqoT50kwM4z9bf\nIIZ7XiZpQWfDc+ZuKNS7whANH+qwvGSok/482fRastQ6bdxXtILI1okaTHc26Fm6\nmBTsse4DAgMBAAECggEAC1zT2a0sH88DweZPulSn0ykEEjFohavwgNwd/kMQvJW3\n3YGmaEXj55tISq9a1Ua8LoYzS8//kOqlhxmIHJ1kRxrMu4xqd0y4kX8xXqL9O+vI\nPFUhvG6tMHX7LJJrFV7nkTfFruhws4NQWxJrwzj71EgIUS95hEvo29hxdf7XJso+\nVo6z8vk0PJOqlDZxJFAOnD5ZndTeXtkjJi+QvIM6iX3g4C84+2dCUSP8iiLkls1k\nl5LjEWbAtD26TaC6x4flxx5Yxrlsoyz7JIIAkeCUycAaoVde9Dgr+64WG51TNGYf\nuMrJUl/O5qKvRdBqF4mgHGsv1a7zl/jXcGgXGJZwAQKBgQD50fVrPNbIBP4w6pRe\nf3QpgLZ6tOHKT/EtiKfbxm2CgiWLWdvXc+v7U/AJI1huEcmjQvyHRjos2jXoxlXu\n/GVUoB8bsIkAHeebWhua3GI8ewNtZs40gLqcaQx61G9aOlSjGd+3iwSA5ARznca0\nEdySN0Ol9oowKdnBrhWuehgd6wKBgQDaHAViQcUkgiDegjpL6zOy6Ttb6enIEd/o\nIjI4u0bozuLWINmQmaqXriva0LUYiOQ0T4hzCi8YffpN930BSCOlXn/NUlEuR9yl\n8n8V364oZOiVkr6mJw40h2+ZMc3rQ2GZ1PWutRF0jZbrsoeN71PeLNg8DTasAgAy\nsHI90AyySQKBgQD4LV6TpCLzHhKv4bp3jkKGIHonuJ4+b+B2jbXEHYIZDtXhc+l0\nRpL+YMqrKVPmNQGNkTRx5pBQko7PqokgG9lGkrOUvHG9jffSW1flJl7pGoOzIVhk\nzCWW0L03IOdmSWBfj4qyOgbFTMAnY2xM4xmun/wyWZO6eTj8scaUSHLA9QKBgDBw\nhrWSu9Dm4ZvpOj9AJkQ2zksUgSpA5gRtC9BTr2TnBbPeqdMWfa+gK/c14PJo/J2t\niDVcbqc2209ThryxI9GHUkTsYkEwDo4AdD8MZWZtOsZ1R8go5lu+NIfGauA0H8oF\nZOb/KbhD9d+0z6wzGeI+/Wsg2CKNczPOwiB+Q0OZAoGBAI8RGhwwAeN4zJtfNU9+\nw3omcaBc5r6ZGWU+fkQqoqzVIIh/OUJPgoSRgr9CX3Yh7Zcpj1yeZEl9QyYsxKRU\n3qxNCxz+QeG+/tljoMvisE0L5/8Pfqnil5nqPHw7AqJZgIfZwhykSia7XQjCk0Rn\nWPQZyZ71RX2s8dciPGI3dhpp\n-----END PRIVATE KEY-----\n",
  "client_email": "automation-bot-102@long-sang-automation.iam.gserviceaccount.com",
  "client_id": "117804804101353490237",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token"
};

// Base64url encode
function base64url(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create JWT
function createJWT(scopes) {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };
  
  const payload = {
    iss: SERVICE_ACCOUNT.client_email,
    scope: scopes.join(' '),
    aud: SERVICE_ACCOUNT.token_uri,
    iat: now,
    exp: now + 3600
  };
  
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(signatureInput);
  const signature = sign.sign(SERVICE_ACCOUNT.private_key, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return `${signatureInput}.${signature}`;
}

// Get access token
function getAccessToken(scopes) {
  return new Promise((resolve, reject) => {
    const jwt = createJWT(scopes);
    
    const postData = new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString();
    
    const options = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
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
          resolve({ error: data });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Make API request
function apiRequest(url, token) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    https.get(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data, status: res.statusCode });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('📺 YOUTUBE API CONNECTION TEST\n');
  console.log('Service Account:', SERVICE_ACCOUNT.client_email);
  console.log('=' .repeat(50));
  
  // YouTube API scopes
  const scopes = [
    'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube.readonly'
  ];
  
  console.log('\n🔐 Getting access token...');
  const tokenResponse = await getAccessToken(scopes);
  
  if (tokenResponse.error) {
    console.log('❌ Token error:', tokenResponse.error);
    console.log('\n⚠️ Service Account KHÔNG THỂ dùng trực tiếp cho YouTube!');
    console.log('\n📝 Lý do: YouTube Data API yêu cầu OAuth 2.0 với user consent');
    console.log('   Service Account chỉ hoạt động với G Suite domain-wide delegation');
    console.log('\n✅ GIẢI PHÁP: Cần tạo OAuth credentials cho YouTube');
    return;
  }
  
  console.log('✅ Token received!');
  console.log('Token:', tokenResponse.access_token?.substring(0, 50) + '...');
  
  // Test YouTube API
  console.log('\n📺 Testing YouTube API...');
  const channelResponse = await apiRequest(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    tokenResponse.access_token
  );
  
  console.log('Channel response:', JSON.stringify(channelResponse, null, 2));
  
  if (channelResponse.error) {
    console.log('\n⚠️ Lỗi:', channelResponse.error.message);
    console.log('\n📝 Service Account không có quyền truy cập YouTube channel');
    console.log('   Cần sử dụng OAuth 2.0 flow để đăng nhập với tài khoản YouTube');
  }
}

main().catch(console.error);
