/**
 * =================================================================
 * SOCIAL MEDIA LIBRARY - Main Export
 * =================================================================
 */

// Types
export * from '@/types/social-media';
// Core Classes
export { BaseSocialPlatform } from './BaseSocialPlatform';
export { getSocialCredentialsService, SocialCredentialsService } from './credentials-service';

// Platform Implementations
export { DiscordPlatform } from './DiscordPlatform';
export { FacebookPlatform } from './FacebookPlatform';
export { InstagramPlatform } from './InstagramPlatform';
export { LinkedInPlatform } from './LinkedInPlatform';
export {
  getSocialMediaManager,
  resetSocialMediaManager,
  SocialMediaManager,
} from './SocialMediaManager';
export { TelegramPlatform } from './TelegramPlatform';
export { TwitterPlatform } from './TwitterPlatform';
export { YouTubePlatform } from './YouTubePlatform';
