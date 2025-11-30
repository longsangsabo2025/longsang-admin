/**
 * =================================================================
 * SOCIAL MEDIA LIBRARY - Main Export
 * =================================================================
 */

// Core Classes
export { BaseSocialPlatform } from './BaseSocialPlatform';
export { SocialCredentialsService, getSocialCredentialsService } from './credentials-service';
export {
  SocialMediaManager,
  getSocialMediaManager,
  resetSocialMediaManager,
} from './SocialMediaManager';

// Platform Implementations
export { DiscordPlatform } from './DiscordPlatform';
export { FacebookPlatform } from './FacebookPlatform';
export { InstagramPlatform } from './InstagramPlatform';
export { LinkedInPlatform } from './LinkedInPlatform';
export { TelegramPlatform } from './TelegramPlatform';
export { TwitterPlatform } from './TwitterPlatform';
export { YouTubePlatform } from './YouTubePlatform';

// Types
export * from '@/types/social-media';
