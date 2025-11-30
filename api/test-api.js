/**
 * API Test Helper
 * Quick test script for Google API endpoints
 */

const API_BASE = 'http://localhost:3001';

// Test Analytics API
async function testAnalyticsOverview() {
  console.log('\n📊 Testing Analytics Overview...');
  try {
    const response = await fetch(`${API_BASE}/api/google/analytics/overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: '123456789', // Replace with real GA4 property ID
        startDate: '7daysAgo',
        endDate: 'today'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAnalyticsTrafficSources() {
  console.log('\n🚦 Testing Traffic Sources...');
  try {
    const response = await fetch(`${API_BASE}/api/google/analytics/traffic-sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: '123456789',
        startDate: '30daysAgo',
        endDate: 'today'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAnalyticsTopPages() {
  console.log('\n📄 Testing Top Pages...');
  try {
    const response = await fetch(`${API_BASE}/api/google/analytics/top-pages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: '123456789',
        startDate: '30daysAgo',
        endDate: 'today',
        limit: 10
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test Calendar API
async function testCalendarCreateEvent() {
  console.log('\n📅 Testing Calendar Create Event...');
  try {
    const response = await fetch(`${API_BASE}/api/google/calendar/create-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarEmail: 'your-calendar@example.com',
        event: {
          summary: 'Test Meeting',
          description: 'This is a test event',
          start: {
            dateTime: '2025-11-15T10:00:00+07:00',
            timeZone: 'Asia/Ho_Chi_Minh'
          },
          end: {
            dateTime: '2025-11-15T11:00:00+07:00',
            timeZone: 'Asia/Ho_Chi_Minh'
          }
        }
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testCalendarListEvents() {
  console.log('\n📋 Testing Calendar List Events...');
  try {
    const response = await fetch(`${API_BASE}/api/google/calendar/list-events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarEmail: 'your-calendar@example.com',
        maxResults: 10
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test Gmail API
async function testGmailSendEmail() {
  console.log('\n📧 Testing Gmail Send Email...');
  try {
    const response = await fetch(`${API_BASE}/api/google/gmail/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromEmail: 'noreply@longsang.com',
        to: 'test@example.com',
        subject: 'Test Email from API',
        body: '<h1>Hello!</h1><p>This is a test email from the Gmail API.</p>'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testGmailSendWelcome() {
  console.log('\n👋 Testing Gmail Send Welcome Email...');
  try {
    const response = await fetch(`${API_BASE}/api/google/gmail/send-welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromEmail: 'noreply@longsang.com',
        userEmail: 'newuser@example.com',
        userName: 'John Doe'
      })
    });
    
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Test Health Check
async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    const data = await response.json();
    console.log('✅ Status:', response.status);
    console.log('📄 Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting API Tests...');
  console.log('=' .repeat(50));
  
  await testHealthCheck();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 ANALYTICS API TESTS');
  console.log('='.repeat(50));
  // await testAnalyticsOverview();
  // await testAnalyticsTrafficSources();
  // await testAnalyticsTopPages();
  // Note: Commented out - requires valid GA4 property ID
  console.log('⚠️  Analytics tests require valid GA4 property ID');
  console.log('💡 Set GOOGLE_SERVICE_ACCOUNT_JSON in .env and update propertyId');
  
  console.log('\n' + '='.repeat(50));
  console.log('📅 CALENDAR API TESTS');
  console.log('='.repeat(50));
  // await testCalendarCreateEvent();
  // await testCalendarListEvents();
  // Note: Commented out - requires valid calendar email
  console.log('⚠️  Calendar tests require valid calendar email');
  console.log('💡 Set calendarEmail in test functions');
  
  console.log('\n' + '='.repeat(50));
  console.log('📧 GMAIL API TESTS');
  console.log('='.repeat(50));
  // await testGmailSendEmail();
  // await testGmailSendWelcome();
  // Note: Commented out - requires valid email configuration
  console.log('⚠️  Gmail tests require valid email configuration');
  console.log('💡 Set fromEmail and configure Gmail API access');
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Test suite completed!');
  console.log('💡 Uncomment individual tests and configure credentials to run');
  console.log('='.repeat(50));
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testHealthCheck,
  testAnalyticsOverview,
  testAnalyticsTrafficSources,
  testAnalyticsTopPages,
  testCalendarCreateEvent,
  testCalendarListEvents,
  testGmailSendEmail,
  testGmailSendWelcome,
};
