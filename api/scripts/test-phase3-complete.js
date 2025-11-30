/**
 * Phase 3 Complete Testing Script
 * Test all Phase 3 features: Multi-platform, Optimization, Budget Reallocation, Monitoring
 *
 * Usage: node scripts/test-phase3-complete.js
 */

const axios = require('axios');
const WebSocket = require('ws');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const WS_URL = process.env.WS_URL || 'ws://localhost:3001';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n[STEP ${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'yellow');
}

async function testStep(stepName, testFn) {
  try {
    logStep(stepName, `Testing: ${stepName}`);
    const result = await testFn();
    logSuccess(`${stepName} passed`);
    return result;
  } catch (error) {
    logError(`${stepName} failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', 'blue');
  log('║     PHASE 3: COMPLETE FEATURES TEST                       ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════╝', 'blue');

  try {
    // ============================================================
    // STEP 1: Check Services Health
    // ============================================================
    await testStep('1.1', async () => {
      logInfo('Checking API server...');
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      if (response.data.status === 'OK') {
        logSuccess('API server is running');
        return true;
      }
      throw new Error('API server not healthy');
    });

    // ============================================================
    // STEP 2: Test Multi-Platform Deployment
    // ============================================================
    await testStep('2.1', async () => {
      logInfo('Getting supported platforms...');
      const response = await axios.get(`${API_BASE_URL}/api/multi-platform/platforms`);

      if (response.data.success && response.data.platforms) {
        logSuccess(`Found ${response.data.platforms.length} supported platforms`);
        logInfo('Platforms: ' + response.data.platforms.join(', '));
        return response.data.platforms;
      }
      throw new Error('Failed to get platforms');
    });

    // ============================================================
    // STEP 3: Test Advanced Optimization
    // ============================================================
    await testStep('3.1', async () => {
      logInfo('Testing budget optimization (Thompson Sampling)...');

      const mockCampaignData = {
        variants: [
          {
            variant_id: "A",
            conversions: 45,
            impressions: 1000,
            conversion_rate: 0.045,
            cpc: 0.5
          },
          {
            variant_id: "B",
            conversions: 62,
            impressions: 1000,
            conversion_rate: 0.062,
            cpc: 0.45
          }
        ]
      };

      const response = await axios.post(
        `${API_BASE_URL.replace('http://', 'http://').replace('3001', '3003')}/mcp/advanced-optimization/budget-allocation`,
        {
          campaign_data: mockCampaignData,
          total_budget: 1000,
          method: "thompson_sampling"
        },
        {
          timeout: 30000
        }
      );

      if (response.data.success && response.data.allocations) {
        logSuccess('Budget optimization completed');
        logInfo(`Algorithm: ${response.data.algorithm}`);
        logInfo(`Allocations: ${response.data.allocations.length} variants`);
        return response.data;
      }
      throw new Error('Budget optimization failed');
    });

    // ============================================================
    // STEP 4: Test Budget Reallocation
    // ============================================================
    await testStep('4.1', async () => {
      logInfo('Testing budget reallocation...');

      const mockCampaignData = {
        variants: [
          {
            variant_id: "A",
            conversions: 45,
            impressions: 1000,
            current_budget: 500
          },
          {
            variant_id: "B",
            conversions: 62,
            impressions: 1000,
            current_budget: 500
          }
        ]
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/budget-reallocation/analyze`,
        {
          campaign_data: mockCampaignData,
          total_budget: 1000,
          method: "thompson_sampling",
          auto_apply: false
        },
        {
          timeout: 30000
        }
      );

      if (response.data.success && response.data.allocations) {
        logSuccess('Budget reallocation analysis completed');
        logInfo(`Actions: ${response.data.actions?.length || 0}`);
        return response.data;
      }
      throw new Error('Budget reallocation failed');
    });

    // ============================================================
    // STEP 5: Test Performance Forecasting
    // ============================================================
    await testStep('5.1', async () => {
      logInfo('Testing performance forecasting...');

      const historicalData = [
        { date: '2025-01-01', conversions: 45, impressions: 1000, spend: 500 },
        { date: '2025-01-02', conversions: 48, impressions: 1100, spend: 550 },
        { date: '2025-01-03', conversions: 52, impressions: 1200, spend: 600 },
        { date: '2025-01-04', conversions: 50, impressions: 1150, spend: 575 },
        { date: '2025-01-05', conversions: 55, impressions: 1300, spend: 650 }
      ];

      const response = await axios.post(
        `${API_BASE_URL}/api/budget-reallocation/forecast`,
        {
          historical_data: historicalData,
          days_ahead: 7
        },
        {
          timeout: 30000
        }
      );

      if (response.data.success && response.data.forecast) {
        logSuccess('Performance forecasting completed');
        logInfo(`Forecast days: ${response.data.forecast_days}`);
        logInfo(`Total forecasted conversions: ${response.data.summary?.total_forecasted_conversions || 0}`);
        return response.data;
      }
      throw new Error('Forecasting failed');
    });

    // ============================================================
    // STEP 6: Test Campaign Monitoring (REST API)
    // ============================================================
    await testStep('6.1', async () => {
      logInfo('Testing campaign monitoring (REST API)...');

      const testCampaignId = 'test-campaign-' + Date.now();

      // Start monitoring
      const startResponse = await axios.post(
        `${API_BASE_URL}/api/campaign-monitoring/start`,
        {
          campaign_id: testCampaignId,
          platforms: ['facebook'],
          update_interval: 10000
        }
      );

      if (startResponse.data.success) {
        logSuccess('Campaign monitoring started');

        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Get status
        const statusResponse = await axios.get(`${API_BASE_URL}/api/campaign-monitoring/status`);
        if (statusResponse.data.success) {
          logInfo(`Active monitors: ${statusResponse.data.active_monitors}`);
        }

        // Stop monitoring
        await axios.post(`${API_BASE_URL}/api/campaign-monitoring/stop`, {
          campaign_id: testCampaignId
        });

        return startResponse.data;
      }
      throw new Error('Failed to start monitoring');
    });

    // ============================================================
    // STEP 7: Test WebSocket Monitoring
    // ============================================================
    await testStep('7.1', async () => {
      logInfo('Testing WebSocket monitoring...');

      return new Promise((resolve, reject) => {
        const ws = new WebSocket(`${WS_URL}/ws/campaign-monitoring`);

        ws.on('open', () => {
          logSuccess('WebSocket connected');

          // Send start monitoring message
          ws.send(JSON.stringify({
            type: 'start_monitoring',
            payload: {
              campaign_id: 'test-ws-' + Date.now(),
              platforms: ['facebook'],
              update_interval: 5000
            }
          }));
        });

        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());

          if (message.type === 'connected') {
            logSuccess('WebSocket handshake successful');
          } else if (message.type === 'monitoring_started') {
            logSuccess('Monitoring started via WebSocket');
            ws.close();
            resolve(message);
          } else if (message.type === 'error') {
            ws.close();
            reject(new Error(message.error));
          }
        });

        ws.on('error', (error) => {
          logError(`WebSocket error: ${error.message}`);
          reject(error);
        });

        // Timeout
        setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket test timeout'));
        }, 10000);
      });
    });

    // ============================================================
    // SUMMARY
    // ============================================================
    log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║              ✅ ALL PHASE 3 TESTS PASSED                   ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝', 'green');

    log('\n📊 Phase 3 Features Tested:', 'cyan');
    log('   • Multi-platform deployment ✅', 'cyan');
    log('   • Advanced optimization algorithms ✅', 'cyan');
    log('   • Budget reallocation ✅', 'cyan');
    log('   • Performance forecasting ✅', 'cyan');
    log('   • Campaign monitoring (REST) ✅', 'cyan');
    log('   • Real-time monitoring (WebSocket) ✅', 'cyan');

    log('\n🎉 Phase 3 Complete!', 'green');

  } catch (error) {
    log('\n╔═══════════════════════════════════════════════════════════╗', 'red');
    log('║              ❌ TESTS FAILED                               ║', 'red');
    log('╚═══════════════════════════════════════════════════════════╝', 'red');

    logError(`\nError: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }

    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

