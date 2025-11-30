# Social Media Automation Foundation

## 📚 Tổng quan

Foundation hoàn chỉnh cho việc đăng bài tự động lên **TẤT CẢ** các nền tảng mạng xã hội hỗ trợ API.

## 🎯 Platforms được hỗ trợ

| Platform         | Status      | Account Type       | API                       |
| ---------------- | ----------- | ------------------ | ------------------------- |
| ✅ **LinkedIn**  | Ready       | Personal + Company | LinkedIn Marketing API v2 |
| ✅ **Twitter/X** | Ready       | Personal           | Twitter API v2            |
| ✅ **Telegram**  | Ready       | Channel + Group    | Telegram Bot API          |
| 🔄 **Facebook**  | Coming Soon | Business Page      | Graph API v18             |
| 🔄 **Instagram** | Coming Soon | Business           | Instagram Graph API       |
| 🔄 **YouTube**   | Coming Soon | Channel            | YouTube Data API v3       |
| 🔄 **Discord**   | Coming Soon | Channel            | Discord Webhook/Bot API   |

## 🏗️ Kiến trúc

```
src/lib/social/
├── index.ts                    # Main export
├── BaseSocialPlatform.ts       # Abstract base class
├── SocialMediaManager.ts       # Unified manager
├── LinkedInPlatform.ts         # LinkedIn implementation
├── TwitterPlatform.ts          # Twitter implementation
├── TelegramPlatform.ts         # Telegram implementation
├── FacebookPlatform.ts         # (Coming soon)
├── InstagramPlatform.ts        # (Coming soon)
├── YouTubePlatform.ts          # (Coming soon)
└── DiscordPlatform.ts          # (Coming soon)

src/types/
└── social-media.ts             # All type definitions
```

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { getSocialMediaManager } from "@/lib/social";

// Get singleton instance
const manager = getSocialMediaManager();

// Register platforms
manager.registerPlatform("linkedin", {
  accessToken: "YOUR_LINKEDIN_TOKEN",
});

manager.registerPlatform("twitter", {
  bearerToken: "YOUR_TWITTER_BEARER_TOKEN",
});

manager.registerPlatform("telegram", {
  botToken: "YOUR_BOT_TOKEN",
  channelId: "@your_channel",
});

// Post to single platform
const result = await manager.postToPlatform("linkedin", {
  platforms: ["linkedin"],
  text: "Hello from LongSang Forge! 🚀",
  contentType: "text",
  hashtags: ["automation", "ai", "productivity"],
});

console.log(result);
// {
//   platform: 'linkedin',
//   success: true,
//   postId: 'urn:li:share:123456',
//   postUrl: 'https://www.linkedin.com/feed/update/...',
//   status: 'published',
//   publishedAt: '2025-11-22T...'
// }
```

### 2. Multi-Platform Posting

```typescript
// Post to multiple platforms at once
const bulkResult = await manager.postToMultiplePlatforms({
  platforms: ["linkedin", "twitter", "telegram"],
  text: "🎉 New feature launched! Check it out!",
  contentType: "text",
  hashtags: ["launch", "newfeature", "tech"],
  linkUrl: "https://longsang.dev/new-feature",
});

console.log(bulkResult.summary);
// {
//   total: 3,
//   successful: 3,
//   failed: 0,
//   pending: 0
// }

bulkResult.results.forEach((result) => {
  console.log(`${result.platform}: ${result.success ? "✅" : "❌"}`);
});
```

### 3. Check Connection Status

```typescript
// Test single platform
const isHealthy = await manager.testConnection("linkedin");
console.log(`LinkedIn: ${isHealthy ? "✅ Connected" : "❌ Failed"}`);

// Test all platforms
const allStatuses = await manager.testAllConnections();
console.log(allStatuses);
// {
//   linkedin: true,
//   twitter: true,
//   telegram: false
// }

// Get detailed status
const status = await manager.getConnectionStatus("linkedin");
console.log(status);
// {
//   platform: 'linkedin',
//   connected: true,
//   accountInfo: {
//     id: '...',
//     displayName: 'LongSang',
//     profileUrl: 'https://linkedin.com/in/...',
//     ...
//   },
//   health: {
//     status: 'healthy',
//     lastChecked: Date,
//     message: 'Connected'
//   }
// }
```

### 4. Platform Capabilities

```typescript
// Get capabilities for a platform
const capabilities = manager.getCapabilities("twitter");
console.log(capabilities);
// {
//   platform: 'twitter',
//   features: {
//     textPosts: true,
//     imagePosts: true,
//     videoPosts: true,
//     hashtags: true,
//     ...
//   },
//   limits: {
//     textLength: 280,
//     hashtagsMax: 10,
//     imagesMax: 4,
//     ...
//   }
// }

// Get all capabilities
const allCaps = manager.getAllCapabilities();
```

### 5. Advanced Options

```typescript
// Post with platform-specific options
await manager.postToPlatform("linkedin", {
  platforms: ["linkedin"],
  text: "Check out our latest blog post!",
  contentType: "link",
  linkUrl: "https://longsang.dev/blog/post",
  hashtags: ["blog", "tech"],

  // Platform-specific options
  options: {
    linkedinVisibility: "PUBLIC",
    linkedinCommentable: true,
  },
});

// Post with media
await manager.postToPlatform("twitter", {
  platforms: ["twitter"],
  text: "Amazing sunset! 🌅",
  contentType: "image",
  media: [
    {
      type: "image",
      url: "https://cdn.longsang.dev/sunset.jpg",
      alt: "Beautiful sunset over the ocean",
    },
  ],
  hashtags: ["photography", "nature"],
});

// Schedule post (requires backend implementation)
await manager.postToPlatform("telegram", {
  platforms: ["telegram"],
  text: "Scheduled announcement 📢",
  contentType: "text",
  publishAt: new Date("2025-11-23T10:00:00Z"),
  timezone: "Asia/Ho_Chi_Minh",
  options: {
    telegramDisableNotification: false,
    telegramParseMode: "HTML",
  },
});
```

## 🔧 Configuration

### Environment Variables

Create `.env` file:

```bash
# LinkedIn
VITE_LINKEDIN_ACCESS_TOKEN=your_linkedin_token

# Twitter/X
VITE_TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Telegram
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_TELEGRAM_CHANNEL_ID=@your_channel

# Facebook (Coming soon)
VITE_FACEBOOK_ACCESS_TOKEN=your_facebook_token
VITE_FACEBOOK_PAGE_ID=your_page_id

# Instagram (Coming soon)
VITE_INSTAGRAM_BUSINESS_ACCOUNT_ID=your_account_id
VITE_INSTAGRAM_ACCESS_TOKEN=your_instagram_token
```

### Platform Settings

```typescript
manager.registerPlatform(
  "linkedin",
  {
    accessToken: "TOKEN",
  },
  {
    // Settings
    defaultVisibility: "public",
    autoHashtags: true,
    maxHashtags: 10,
    imageQuality: "high",
    maxPostsPerDay: 50,
    minIntervalMinutes: 5,
    autoScheduleOptimal: false,
    crossPostEnabled: true,
    notifyOnError: true,
  }
);
```

## 📖 API Reference

### SocialMediaManager

#### Methods

- `registerPlatform(platform, credentials, settings?)` - Register a platform
- `unregisterPlatform(platform)` - Unregister a platform
- `isPlatformRegistered(platform)` - Check if registered
- `getRegisteredPlatforms()` - Get all registered platforms
- `postToPlatform(platform, request)` - Post to single platform
- `postToMultiplePlatforms(request)` - Post to multiple platforms
- `testConnection(platform)` - Test connection
- `testAllConnections()` - Test all connections
- `getConnectionStatus(platform)` - Get detailed status
- `getAllConnectionStatuses()` - Get all statuses
- `getCapabilities(platform)` - Get platform capabilities
- `getAllCapabilities()` - Get all capabilities
- `updateCredentials(platform, credentials)` - Update credentials
- `updateSettings(platform, settings)` - Update settings
- `getSettings(platform)` - Get settings
- `getHealthStatus()` - Get overall health

### Types

See `src/types/social-media.ts` for complete type definitions:

- `SocialPlatform` - Supported platforms
- `SocialPostRequest` - Post request structure
- `SocialPostResponse` - Post response structure
- `BulkPostResponse` - Multi-platform response
- `PlatformCredentials` - Platform credentials
- `PlatformSettings` - Platform settings
- `PlatformCapabilities` - Platform features & limits
- `PlatformConnection` - Connection status
- `MediaAttachment` - Media attachment structure
- `PostOptions` - Platform-specific options
- Error types: `SocialMediaError`, `AuthenticationError`, `RateLimitError`, `ValidationError`

## 🎨 UI Integration (Coming Soon)

```typescript
// Platform connection UI component
import { PlatformConnectionCard } from "@/components/social/PlatformConnectionCard";

<PlatformConnectionCard
  platform="linkedin"
  onConnect={handleConnect}
  onDisconnect={handleDisconnect}
/>;

// Post composer component
import { SocialPostComposer } from "@/components/social/SocialPostComposer";

<SocialPostComposer availablePlatforms={["linkedin", "twitter", "telegram"]} onPost={handlePost} />;
```

## 🔐 Getting API Credentials

### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create an app
3. Request permissions: `r_liteprofile`, `w_member_social`
4. Get OAuth 2.0 Access Token

### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a project and app
3. Enable OAuth 2.0
4. Get Bearer Token or OAuth tokens

### Telegram

1. Talk to [@BotFather](https://t.me/botfather)
2. Create a new bot with `/newbot`
3. Get the bot token
4. Add bot to your channel as admin

### Facebook (Coming Soon)

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app
3. Get Page Access Token
4. Request `pages_manage_posts` permission

## 📊 Features

- ✅ Type-safe TypeScript implementation
- ✅ Unified interface for all platforms
- ✅ Error handling & validation
- ✅ Rate limiting support
- ✅ Connection health monitoring
- ✅ Platform capabilities detection
- ✅ Multi-platform posting
- ✅ Hashtag formatting
- ✅ Media attachment support
- ✅ Platform-specific options
- 🔄 Scheduling (requires backend)
- 🔄 Analytics integration
- 🔄 Queue management
- 🔄 Retry logic

## 🚧 Roadmap

- [ ] Add Facebook Platform implementation
- [ ] Add Instagram Platform implementation
- [ ] Add YouTube Platform implementation
- [ ] Add Discord Platform implementation
- [ ] Add media upload handling
- [ ] Add scheduling system
- [ ] Add analytics tracking
- [ ] Add post queue management
- [ ] Add retry mechanism
- [ ] Build UI components
- [ ] Add batch operations
- [ ] Add template system
- [ ] Add campaign management

## 📝 License

MIT License - LongSang Automation

---

Made with ❤️ by LongSang Team
