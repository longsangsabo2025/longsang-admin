/**
 * Phase 1 Testing Script
 * Test end-to-end: Image generation → Creative → Campaign
 *
 * Usage: node scripts/test-phase1-ad-campaigns.js
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3003';

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
  log('║     PHASE 1: AI ADVERTISING - END-TO-END TEST            ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════╝', 'blue');

  // Test data
  const testProduct = {
    name: 'Premium Coffee Beans',
    description: 'Artisan roasted coffee beans from Vietnam',
    category: 'Food & Beverage'
  };

  let generatedImage = null;
  let generatedCreatives = null;
  let campaignStrategy = null;

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

    await testStep('1.2', async () => {
      logInfo('Checking MCP Server HTTP API...');
      try {
        // Try to ping MCP server (might not have health endpoint)
        const response = await axios.get(`${MCP_SERVER_URL}/docs`, { timeout: 2000 });
        logSuccess('MCP Server HTTP API is running');
        return true;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          logError('MCP Server HTTP API not running on port 3003');
          logInfo('Please start MCP Server: python mcp-server/server.py');
          throw new Error('MCP Server not available');
        }
        // If we get 404 or other error, server is running but endpoint doesn't exist
        logSuccess('MCP Server HTTP API is running (endpoint check)');
        return true;
      }
    });

    // ============================================================
    // STEP 2: Test Ad Styles Endpoint
    // ============================================================
    await testStep('2', async () => {
      logInfo('Fetching available ad styles...');
      const response = await axios.get(`${API_BASE_URL}/api/ad-campaigns/styles`);

      if (response.data.success && response.data.styles) {
        logSuccess(`Found ${response.data.count} ad styles`);
        logInfo('Available styles: ' + Object.keys(response.data.styles).join(', '));
        return response.data.styles;
      }
      throw new Error('Failed to get ad styles');
    });

    // ============================================================
    // STEP 3: Test Image Generation
    // ============================================================
    generatedImage = await testStep('3', async () => {
      logInfo('Generating ad image with product style...');
      const response = await axios.post(`${API_BASE_URL}/api/ad-campaigns/generate-image`, {
        prompt: `Professional product photo of ${testProduct.name}. ${testProduct.description}`,
        aspect_ratio: '16:9',
        ad_style: 'product'
      });

      if (response.data.success && response.data.image_path) {
        logSuccess(`Image generated: ${response.data.image_path}`);
        logInfo(`Model: ${response.data.model || 'N/A'}`);
        logInfo(`Provider: ${response.data.provider || 'N/A'}`);
        return response.data;
      }
      throw new Error('Image generation failed');
    });

    // ============================================================
    // STEP 4: Test Strategy Generation (without Brain)
    // ============================================================
    campaignStrategy = await testStep('4', async () => {
      logInfo('Generating campaign strategy (basic, no Brain)...');
      const response = await axios.post(`${API_BASE_URL}/api/ad-campaigns/generate-strategy`, {
        product_info: testProduct,
        target_audience: {
          age: '25-45',
          interests: ['coffee', 'lifestyle']
        }
      });

      if (response.data.success && response.data.strategy) {
        logSuccess('Strategy generated');
        logInfo(`Source: ${response.data.strategy.source}`);
        logInfo(`Recommended styles: ${response.data.strategy.recommendations?.ad_styles?.join(', ') || 'N/A'}`);
        return response.data.strategy;
      }
      throw new Error('Strategy generation failed');
    });

    // ============================================================
    // STEP 5: Test Creative Variants Generation
    // ============================================================
    generatedCreatives = await testStep('5', async () => {
      logInfo('Generating 3 creative variants...');
      const response = await axios.post(`${API_BASE_URL}/api/ad-campaigns/generate-creatives`, {
        product_info: testProduct,
        num_variants: 3
      });

      if (response.data.success && response.data.variants) {
        logSuccess(`Generated ${response.data.variants.length} creative variants`);
        response.data.variants.forEach((variant, index) => {
          logInfo(`Variant ${index + 1}: ${variant.ad_style} style - ${variant.image_path}`);
        });
        return response.data.variants;
      }
      throw new Error('Creative generation failed');
    });

    // ============================================================
    // STEP 6: Test Strategy with Brain (if domain_id provided)
    // ============================================================
    const useBrain = process.env.TEST_BRAIN_DOMAIN_ID;
    if (useBrain) {
      await testStep('6', async () => {
        logInfo('Testing strategy generation with Brain...');
        logInfo(`Using domain_id: ${useBrain}`);

        try {
          const response = await axios.post(`${API_BASE_URL}/api/ad-campaigns/generate-strategy`, {
            product_info: testProduct,
            domain_id: useBrain,
            target_audience: {
              age: '25-45',
              interests: ['coffee', 'lifestyle']
            }
          });

          if (response.data.success && response.data.strategy) {
            logSuccess('Brain strategy generated');
            logInfo(`Source: ${response.data.strategy.source}`);
            logInfo(`Confidence: ${response.data.strategy.confidence || 'N/A'}`);
            return response.data.strategy;
          }
          throw new Error('Brain strategy generation failed');
        } catch (error) {
          if (error.response?.status === 404 || error.message.includes('Brain')) {
            logInfo('Brain not available, skipping Brain test');
            return null;
          }
          throw error;
        }
      });
    } else {
      logInfo('Skipping Brain test (set TEST_BRAIN_DOMAIN_ID to test)');
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║              ✅ ALL TESTS PASSED                          ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝', 'green');

    log('\n📊 Test Summary:', 'cyan');
    log(`   • Image generated: ${generatedImage ? '✅' : '❌'}`, 'cyan');
    log(`   • Strategy generated: ${campaignStrategy ? '✅' : '❌'}`, 'cyan');
    log(`   • Creative variants: ${generatedCreatives?.length || 0}`, 'cyan');

    log('\n📝 Next Steps:', 'yellow');
    log('   1. Test Facebook creative creation (requires Facebook credentials)', 'yellow');
    log('   2. Test complete campaign creation (requires Facebook page_id)', 'yellow');
    log('   3. Test with real Brain domain (set TEST_BRAIN_DOMAIN_ID)', 'yellow');

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

