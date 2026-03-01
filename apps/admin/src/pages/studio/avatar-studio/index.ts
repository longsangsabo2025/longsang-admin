/**
 * Avatar Studio barrel exports
 */

// Types
export type {
  OwnerPortrait,
  ContentTemplate,
  GeneratedContent,
  AvatarProfile,
  PlatformConfig,
  GenerationStyle,
  PlatformKey,
} from './types';

// Constants
export {
  DEFAULT_PROFILE,
  STORAGE_KEY,
  ACTIVE_PROFILE_KEY,
  CONTENT_TEMPLATES,
  PLATFORM_CONFIGS,
  GENERATION_STYLES,
} from './constants';

// Hooks
export { useAvatarProfiles } from './useAvatarProfiles';
export { useAvatarPortraits } from './useAvatarPortraits';
export { useAvatarGeneration } from './useAvatarGeneration';

// Components
export { StudioHeader } from './StudioHeader';
export { ProfileTab } from './ProfileTab';
export { PortraitsTab } from './PortraitsTab';
export { GenerateTab } from './GenerateTab';
export { LibraryTab } from './LibraryTab';
export { PublishTab } from './PublishTab';
export { BrainLibraryDialog, CharacterPickerDialog } from './AvatarDialogs';
