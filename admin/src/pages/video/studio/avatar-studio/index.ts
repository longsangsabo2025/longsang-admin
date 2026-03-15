/**
 * Avatar Studio barrel exports
 */

export { BrainLibraryDialog, CharacterPickerDialog } from './AvatarDialogs';

// Constants
export {
  ACTIVE_PROFILE_KEY,
  CONTENT_TEMPLATES,
  DEFAULT_PROFILE,
  GENERATION_STYLES,
  PLATFORM_CONFIGS,
  STORAGE_KEY,
} from './constants';
export { GenerateTab } from './GenerateTab';
export { LibraryTab } from './LibraryTab';
export { PortraitsTab } from './PortraitsTab';
export { ProfileTab } from './ProfileTab';
export { PublishTab } from './PublishTab';
// Components
export { StudioHeader } from './StudioHeader';
// Types
export type {
  AvatarProfile,
  ContentTemplate,
  GeneratedContent,
  GenerationStyle,
  OwnerPortrait,
  PlatformConfig,
  PlatformKey,
} from './types';
export { useAvatarGeneration } from './useAvatarGeneration';
export { useAvatarPortraits } from './useAvatarPortraits';
// Hooks
export { useAvatarProfiles } from './useAvatarProfiles';
