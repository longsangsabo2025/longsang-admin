/**
 * =================================================================
 * SOCIAL MEDIA EXAMPLES - Usage Examples
 * =================================================================
 */

import { getSocialMediaManager } from './index';

/**
 * Example 1: Basic Setup
 */
export async function exampleBasicSetup() {
  const manager = getSocialMediaManager();

  // Register platforms
  manager.registerPlatform('linkedin', {
    accessToken: import.meta.env.VITE_LINKEDIN_ACCESS_TOKEN,
  });

  manager.registerPlatform('twitter', {
    bearerToken: import.meta.env.VITE_TWITTER_BEARER_TOKEN,
  });

  manager.registerPlatform('telegram', {
    botToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
    channelId: import.meta.env.VITE_TELEGRAM_CHANNEL_ID,
  });

  console.log('✅ Platforms registered:', manager.getRegisteredPlatforms());
}

/**
 * Example 2: Post to Single Platform
 */
export async function exampleSinglePost() {
  const manager = getSocialMediaManager();

  const result = await manager.postToPlatform('linkedin', {
    platforms: ['linkedin'],
    text: '🚀 Excited to announce our new AI automation platform! Built with React, TypeScript, and cutting-edge AI models.',
    contentType: 'text',
    hashtags: ['AI', 'Automation', 'React', 'TypeScript', 'Innovation'],
    linkUrl: 'https://longsang.dev',
  });

  if (result.success) {
    console.log('✅ Post published successfully!');
    console.log('Post URL:', result.postUrl);
  } else {
    console.error('❌ Post failed:', result.error?.message);
  }

  return result;
}

/**
 * Example 3: Multi-Platform Posting
 */
export async function exampleMultiPlatformPost() {
  const manager = getSocialMediaManager();

  const bulkResult = await manager.postToMultiplePlatforms({
    platforms: ['linkedin', 'twitter', 'telegram'],
    text: '🎉 New feature launched!\n\nWe just released automatic social media posting across all major platforms. Now you can:\n\n✅ Post to LinkedIn, Twitter, Telegram\n✅ Schedule posts\n✅ Track analytics\n✅ Manage multiple accounts\n\nTry it out! 👇',
    contentType: 'text',
    hashtags: ['ProductLaunch', 'SocialMedia', 'Automation', 'MarTech'],
    linkUrl: 'https://longsang.dev/features/social-automation',
  });

  console.log('📊 Summary:', bulkResult.summary);
  console.log(`✅ Successful: ${bulkResult.summary.successful}/${bulkResult.summary.total}`);

  bulkResult.results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    console.log(
      `${status} ${result.platform}: ${result.success ? result.postUrl : result.error?.message}`
    );
  });

  return bulkResult;
}

/**
 * Example 4: Health Check
 */
export async function exampleHealthCheck() {
  const manager = getSocialMediaManager();

  console.log('🔍 Checking platform connections...\n');

  // Test all connections
  const results = await manager.testAllConnections();

  Object.entries(results).forEach(([platform, isHealthy]) => {
    const status = isHealthy ? '✅' : '❌';
    console.log(`${status} ${platform}: ${isHealthy ? 'Connected' : 'Failed'}`);
  });

  // Get detailed status
  const linkedinStatus = await manager.getConnectionStatus('linkedin');
  console.log('\n📋 LinkedIn Details:');
  console.log('Account:', linkedinStatus.accountInfo?.displayName);
  console.log('Profile:', linkedinStatus.accountInfo?.profileUrl);
  console.log('Status:', linkedinStatus.health.status);
  console.log('Last Checked:', linkedinStatus.health.lastChecked);

  // Get overall health
  const health = await manager.getHealthStatus();
  console.log('\n🏥 Overall Health:');
  console.log(`Healthy: ${health.healthy}/${health.total}`);
  console.log(`Warning: ${health.warning}/${health.total}`);
  console.log(`Error: ${health.error}/${health.total}`);

  return health;
}

/**
 * Example 5: Platform Capabilities
 */
export async function exampleCapabilities() {
  const manager = getSocialMediaManager();

  const platforms = ['linkedin', 'twitter', 'telegram'];

  console.log('📋 Platform Capabilities:\n');

  platforms.forEach((platform) => {
    try {
      manager.registerPlatform(platform as any, { accessToken: 'dummy' });
      const caps = manager.getCapabilities(platform as any);

      console.log(`\n${platform.toUpperCase()}:`);
      console.log(`- Max Text Length: ${caps.limits.textLength} chars`);
      console.log(`- Max Hashtags: ${caps.limits.hashtagsMax}`);
      console.log(`- Max Images: ${caps.limits.imagesMax}`);
      console.log(`- Max Posts/Day: ${caps.limits.postsPerDay}`);
      console.log(`- Supports:`);
      console.log(`  • Images: ${caps.features.imagePosts ? '✅' : '❌'}`);
      console.log(`  • Videos: ${caps.features.videoPosts ? '✅' : '❌'}`);
      console.log(`  • Scheduling: ${caps.features.scheduling ? '✅' : '❌'}`);
      console.log(`  • Analytics: ${caps.features.analytics ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${platform}: Not implemented yet`);
    }
  });
}

/**
 * Example 6: Content with Media
 */
export async function exampleMediaPost() {
  const manager = getSocialMediaManager();

  const result = await manager.postToPlatform('linkedin', {
    platforms: ['linkedin'],
    text: 'Check out our beautiful new office space! 🏢✨',
    contentType: 'image',
    media: [
      {
        type: 'image',
        url: 'https://cdn.longsang.dev/office-space.jpg',
        alt: 'Modern office with natural lighting and plants',
      },
    ],
    hashtags: ['OfficeLife', 'Workspace', 'Design'],
  });

  return result;
}

/**
 * Example 7: Platform-Specific Options
 */
export async function examplePlatformOptions() {
  const manager = getSocialMediaManager();

  // LinkedIn with specific visibility
  const linkedinResult = await manager.postToPlatform('linkedin', {
    platforms: ['linkedin'],
    text: 'Team update: Q4 planning session summary',
    contentType: 'text',
    options: {
      linkedinVisibility: 'CONNECTIONS',
      linkedinCommentable: false,
    },
  });

  // Twitter with reply settings
  const twitterResult = await manager.postToPlatform('twitter', {
    platforms: ['twitter'],
    text: 'Hot take: TypeScript > JavaScript 🔥',
    contentType: 'text',
    options: {
      twitterReplySettings: 'following',
    },
  });

  // Telegram with silent notification
  const telegramResult = await manager.postToPlatform('telegram', {
    platforms: ['telegram'],
    text: '<b>System Update</b>\n\nMaintenance scheduled for tonight.',
    contentType: 'text',
    options: {
      telegramDisableNotification: true,
      telegramParseMode: 'HTML',
    },
  });

  return { linkedinResult, twitterResult, telegramResult };
}

/**
 * Example 8: Update Platform Settings
 */
export async function exampleUpdateSettings() {
  const manager = getSocialMediaManager();

  // Update LinkedIn settings
  manager.updateSettings('linkedin', {
    maxHashtags: 15,
    autoHashtags: true,
    defaultVisibility: 'public',
    maxPostsPerDay: 30,
  });

  // Update Twitter settings
  manager.updateSettings('twitter', {
    maxHashtags: 5,
    minIntervalMinutes: 10,
    notifyOnError: true,
  });

  console.log('✅ Settings updated');
  console.log('LinkedIn settings:', manager.getSettings('linkedin'));
}

/**
 * Example 9: Error Handling
 */
export async function exampleErrorHandling() {
  const manager = getSocialMediaManager();

  try {
    // Try to post without registering platform
    const result = await manager.postToPlatform('facebook', {
      platforms: ['facebook'],
      text: 'This will fail',
      contentType: 'text',
    });

    if (!result.success) {
      console.error('Error:', result.error?.code);
      console.error('Message:', result.error?.message);
    }
  } catch (error) {
    console.error('Exception:', error);
  }

  try {
    // Try to post with invalid content
    const result = await manager.postToPlatform('twitter', {
      platforms: ['twitter'],
      text: 'a'.repeat(300), // Exceeds Twitter limit
      contentType: 'text',
    });

    if (!result.success) {
      console.error('Validation error:', result.error?.message);
    }
  } catch (error) {
    console.error('Validation exception:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('🚀 Running Social Media Examples\n');
  console.log('='.repeat(50));

  try {
    console.log('\n📝 Example 1: Basic Setup');
    await exampleBasicSetup();

    console.log('\n📝 Example 2: Single Post');
    await exampleSinglePost();

    console.log('\n📝 Example 3: Multi-Platform Post');
    await exampleMultiPlatformPost();

    console.log('\n📝 Example 4: Health Check');
    await exampleHealthCheck();

    console.log('\n📝 Example 5: Capabilities');
    await exampleCapabilities();

    console.log('\n📝 Example 6: Media Post');
    // await exampleMediaPost(); // Uncomment if you have media URL

    console.log('\n📝 Example 7: Platform Options');
    // await examplePlatformOptions(); // Uncomment to test

    console.log('\n📝 Example 8: Update Settings');
    await exampleUpdateSettings();

    console.log('\n📝 Example 9: Error Handling');
    await exampleErrorHandling();

    console.log('\n' + '='.repeat(50));
    console.log('✅ All examples completed!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}
