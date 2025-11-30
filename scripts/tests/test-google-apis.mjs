#!/usr/bin/env node

/**
 * TEST GOOGLE APIS - Kiểm tra xem các API đã hoạt động thực sự chưa
 */

import 'dotenv/config';

// Test 1: Google Maps Geocoding API
async function testGeocodingAPI() {
  console.log('\n🗺️  TEST 1: Google Maps Geocoding API');
  console.log('='.repeat(60));

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ FAILED: VITE_GOOGLE_MAPS_API_KEY not found in .env');
    return false;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...');

  try {
    const address = '123 Nguyễn Huệ, Quận 1, TP.HCM';
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;

    console.log('📍 Testing address:', address);
    console.log('🔗 Request URL:', url.substring(0, 80) + '...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      console.log('\n✅ SUCCESS! Geocoding API is working!');
      console.log('📍 Formatted Address:', result.formatted_address);
      console.log('🌍 Coordinates:', result.geometry.location);
      console.log('🆔 Place ID:', result.place_id);
      return true;
    } else {
      console.log('\n❌ FAILED:', data.status);
      console.log('Error:', data.error_message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  }
}

// Test 2: Google Indexing API
async function testIndexingAPI() {
  console.log('\n🔍 TEST 2: Google Indexing API');
  console.log('='.repeat(60));

  const serviceAccountKey = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    console.log('❌ FAILED: VITE_GOOGLE_SERVICE_ACCOUNT_KEY not found in .env');
    return false;
  }

  try {
    const credentials = JSON.parse(serviceAccountKey);
    console.log('✅ Service Account found:', credentials.client_email);

    // Get OAuth2 token
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const jwtClaim = Buffer.from(JSON.stringify({
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    })).toString('base64url');

    const { createSign } = await import('crypto');
    const signature = createSign('RSA-SHA256')
      .update(`${jwtHeader}.${jwtClaim}`)
      .sign(credentials.private_key, 'base64url');

    const jwt = `${jwtHeader}.${jwtClaim}.${signature}`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      console.log('❌ FAILED to get access token');
      console.log('Error:', tokenData.error_description || tokenData);
      return false;
    }

    console.log('✅ Access token obtained');

    // Test get metadata (không submit URL, chỉ check connection)
    const testUrl = 'https://longsang.com';
    const metadataUrl = `https://indexing.googleapis.com/v3/urlNotifications/metadata?url=${encodeURIComponent(testUrl)}`;

    const metadataResponse = await fetch(metadataUrl, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });

    if (metadataResponse.ok || metadataResponse.status === 404) {
      console.log('✅ SUCCESS! Indexing API is working!');
      console.log('📊 API Status:', metadataResponse.status);
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json();
        console.log('📝 Metadata:', metadata);
      } else {
        console.log('ℹ️  URL not indexed yet (404 is normal for unindexed URLs)');
      }
      return true;
    } else {
      console.log('❌ FAILED:', metadataResponse.status, metadataResponse.statusText);
      const errorText = await metadataResponse.text();
      console.log('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  }
}

// Test 3: Google Places API
async function testPlacesAPI() {
  console.log('\n📍 TEST 3: Google Places API');
  console.log('='.repeat(60));

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ FAILED: VITE_GOOGLE_MAPS_API_KEY not found');
    return false;
  }

  try {
    // Search for cafes near Nguyen Hue, District 1, HCMC
    const location = '10.7754,106.7009'; // Nguyen Hue coordinates
    const radius = 500; // 500 meters
    const type = 'cafe';
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${apiKey}`;

    console.log('🔍 Searching for cafes near Nguyen Hue...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      console.log('\n✅ SUCCESS! Places API is working!');
      console.log(`📊 Found ${data.results.length} cafes nearby`);
      console.log('\nTop 3 cafes:');
      data.results.slice(0, 3).forEach((place, i) => {
        console.log(`\n${i + 1}. ${place.name}`);
        console.log(`   📍 ${place.vicinity}`);
        console.log(`   ⭐ Rating: ${place.rating || 'N/A'}`);
      });
      return true;
    } else {
      console.log('\n❌ FAILED:', data.status);
      console.log('Error:', data.error_message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  }
}

// Test 4: Distance Matrix API
async function testDistanceMatrixAPI() {
  console.log('\n📏 TEST 4: Distance Matrix API');
  console.log('='.repeat(60));

  const apiKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.log('❌ FAILED: VITE_GOOGLE_MAPS_API_KEY not found');
    return false;
  }

  try {
    const origins = encodeURIComponent('Nguyen Hue, District 1, HCMC');
    const destinations = encodeURIComponent('Ben Thanh Market, HCMC');
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${apiKey}`;

    console.log('📍 From: Nguyen Hue, District 1');
    console.log('📍 To: Ben Thanh Market');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      const element = data.rows[0].elements[0];
      console.log('\n✅ SUCCESS! Distance Matrix API is working!');
      console.log('📏 Distance:', element.distance.text);
      console.log('⏱️  Duration:', element.duration.text);
      return true;
    } else {
      console.log('\n❌ FAILED:', data.status);
      console.log('Error:', data.error_message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🚀 GOOGLE APIS TESTING');
  console.log('='.repeat(60));
  console.log('Testing all Google APIs to verify they work...\n');

  const results = {
    geocoding: await testGeocodingAPI(),
    indexing: await testIndexingAPI(),
    places: await testPlacesAPI(),
    distanceMatrix: await testDistanceMatrixAPI(),
  };

  console.log('\n📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log('✅ Geocoding API:', results.geocoding ? 'WORKING' : 'FAILED');
  console.log('✅ Indexing API:', results.indexing ? 'WORKING' : 'FAILED');
  console.log('✅ Places API:', results.places ? 'WORKING' : 'FAILED');
  console.log('✅ Distance Matrix API:', results.distanceMatrix ? 'WORKING' : 'FAILED');

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(r => r).length;

  console.log('\n' + '='.repeat(60));
  console.log(`📈 TOTAL: ${passedTests}/${totalTests} APIs WORKING`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL APIS ARE WORKING! System ready for production!');
  } else {
    console.log('⚠️  Some APIs failed. Check configuration above.');
  }

  console.log('='.repeat(60) + '\n');
}

runAllTests().catch(console.error);
