/**
 * Phase 2 Testing Script
 * Test video generation and A/B testing
 *
 * Usage: node scripts/test-phase2-video-ab.js
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
  log('║     PHASE 2: VIDEO GENERATION & A/B TESTING               ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════╝', 'blue');

  // Test data
  const testProduct = {
    name: 'Premium Coffee Beans',
    description: 'Artisan roasted coffee beans from Vietnam',
    category: 'Food & Beverage'
  };

  let generatedVideo = null;
  let videoVariants = null;
  let abTestResult = null;

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
        const response = await axios.get(`${MCP_SERVER_URL}/docs`, { timeout: 2000 });
        logSuccess('MCP Server HTTP API is running');
        return true;
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          logError('MCP Server HTTP API not running on port 3003');
          logInfo('Please start MCP Server: python mcp-server/server.py');
          throw new Error('MCP Server not available');
        }
        logSuccess('MCP Server HTTP API is running (endpoint check)');
        return true;
      }
    });

    // ============================================================
    // STEP 2: Test Platform Formats
    // ============================================================
    await testStep('2', async () => {
      logInfo('Fetching platform formats...');
      const response = await axios.get(`${API_BASE_URL}/api/video-ads/platform-formats`);

      if (response.data.success && response.data.formats) {
        const platforms = Object.keys(response.data.formats);
        logSuccess(`Found ${platforms.length} platform formats`);
        logInfo('Platforms: ' + platforms.join(', '));
        return response.data.formats;
      }
      throw new Error('Failed to get platform formats');
    });

    // ============================================================
    // STEP 3: Test Video Generation from Product Info
    // ============================================================
    generatedVideo = await testStep('3', async () => {
      logInfo('Generating video ad from product info...');
      logInfo('This may take 1-5 minutes...');

      const response = await axios.post(
        `${API_BASE_URL}/api/video-ads/generate`,
        {
          product_info: testProduct,
          ad_style: 'product',
          duration: 15,
          aspect_ratio: '9:16',
          num_images: 3
        },
        {
          timeout: 300000 // 5 minutes
        }
      );

      if (response.data.success && response.data.video_path) {
        logSuccess(`Video generated: ${response.data.video_path}`);
        logInfo(`Duration: ${response.data.duration}s`);
        logInfo(`Aspect ratio: ${response.data.aspect_ratio}`);
        logInfo(`Method: ${response.data.method || 'N/A'}`);
        logInfo(`File size: ${(response.data.file_size / 1024 / 1024).toFixed(2)} MB`);
        return response.data;
      }
      throw new Error('Video generation failed');
    });

    // ============================================================
    // STEP 4: Test Video Variants Generation
    // ============================================================
    videoVariants = await testStep('4', async () => {
      logInfo('Generating video variants for A/B testing...');
      logInfo('This may take 3-10 minutes...');

      const response = await axios.post(
        `${API_BASE_URL}/api/video-ads/generate-variants`,
        {
          product_info: testProduct,
          num_variants: 2, // Reduced for testing
          ad_styles: ['product', 'lifestyle'],
          duration: 15,
          aspect_ratio: '9:16'
        },
        {
          timeout: 600000 // 10 minutes
        }
      );

      if (response.data.success && response.data.variants) {
        logSuccess(`Generated ${response.data.variants.length} video variants`);
        response.data.variants.forEach((variant, index) => {
          logInfo(`Variant ${index + 1}: ${variant.ad_style} - ${variant.video_path}`);
        });
        return response.data.variants;
      }
      throw new Error('Video variants generation failed');
    });

    // ============================================================
    // STEP 5: Test A/B Testing Analysis (Mock Data)
    // ============================================================
    abTestResult = await testStep('5', async () => {
      logInfo('Testing A/B testing analysis with mock campaign data...');

      // Mock campaign performance data
      const mockCampaignData = {
        variant_a_name: "Product Style Video",
        variant_b_name: "Lifestyle Style Video",
        metrics: {
          CTR: {
            variant_a: [2.1, 2.3, 2.0, 2.2, 2.4, 2.1, 2.3, 2.2, 2.0, 2.3],
            variant_b: [2.5, 2.7, 2.6, 2.8, 2.9, 2.6, 2.7, 2.8, 2.5, 2.7]
          },
          CPC: {
            variant_a: [0.45, 0.43, 0.47, 0.44, 0.46, 0.45, 0.44, 0.46, 0.45, 0.44],
            variant_b: [0.38, 0.36, 0.39, 0.37, 0.38, 0.36, 0.37, 0.38, 0.36, 0.37]
          }
        },
        conversions: {
          variant_a_conversions: 45,
          variant_a_impressions: 1000,
          variant_b_conversions: 62,
          variant_b_impressions: 1000
        }
      };

      const response = await axios.post(
        `${MCP_SERVER_URL}/mcp/ab-testing/analyze`,
        {
          campaign_data: mockCampaignData,
          confidence_level: 0.95
        },
        {
          timeout: 30000
        }
      );

      if (response.data.success && response.data.results) {
        logSuccess(`A/B test analysis completed`);
        logInfo(`Total tests: ${response.data.summary.total_tests}`);
        logInfo(`Significant tests: ${response.data.summary.significant_tests}`);
        logInfo(`Overall winner: ${response.data.summary.overall_winner || 'None'}`);

        // Show detailed results
        response.data.results.forEach((result, index) => {
          logInfo(`\nTest ${index + 1}: ${result.metric}`);
          logInfo(`  Variant A: ${result.variant_a_value.toFixed(4)}`);
          logInfo(`  Variant B: ${result.variant_b_value.toFixed(4)}`);
          logInfo(`  Improvement: ${result.improvement_percent.toFixed(2)}%`);
          logInfo(`  P-value: ${result.p_value.toFixed(4)}`);
          logInfo(`  Significant: ${result.is_significant ? 'Yes' : 'No'}`);
          logInfo(`  Winner: ${result.winner || 'None'}`);
        });

        return response.data;
      }
      throw new Error('A/B testing analysis failed');
    });

    // ============================================================
    // STEP 6: Test Video Generation from Images (if we have images)
    // ============================================================
    if (generatedVideo && generatedVideo.generated_images) {
      await testStep('6', async () => {
        logInfo('Testing video generation from existing images...');

        const response = await axios.post(
          `${API_BASE_URL}/api/video-ads/generate-from-images`,
          {
            image_paths: generatedVideo.generated_images.slice(0, 2), // Use first 2 images
            duration: 10,
            fps: 30,
            transition: 'fade',
            aspect_ratio: '9:16'
          },
          {
            timeout: 300000 // 5 minutes
          }
        );

        if (response.data.success && response.data.video_path) {
          logSuccess(`Video from images generated: ${response.data.video_path}`);
          return response.data;
        }
        throw new Error('Video from images generation failed');
      });
    } else {
      logInfo('Skipping video from images test (no images available)');
    }

    // ============================================================
    // SUMMARY
    // ============================================================
    log('\n╔═══════════════════════════════════════════════════════════╗', 'green');
    log('║              ✅ ALL TESTS PASSED                          ║', 'green');
    log('╚═══════════════════════════════════════════════════════════╝', 'green');

    log('\n📊 Test Summary:', 'cyan');
    log(`   • Video generated: ${generatedVideo ? '✅' : '❌'}`, 'cyan');
    log(`   • Video variants: ${videoVariants?.length || 0}`, 'cyan');
    log(`   • A/B test analysis: ${abTestResult ? '✅' : '❌'}`, 'cyan');

    log('\n📝 Next Steps:', 'yellow');
    log('   1. Test with real campaign data', 'yellow');
    log('   2. Integrate A/B testing into campaign workflow', 'yellow');
    log('   3. Create campaign optimization agent', 'yellow');

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

