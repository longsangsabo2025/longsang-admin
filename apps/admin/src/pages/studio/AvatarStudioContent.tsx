/**
 * 🎭 SABO AI Avatar Studio Content
 * 
 * AI-powered avatar system for SABO Arena marketing (Supabase persistence)
 * Thin shell importing from avatar-studio/ sub-modules
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Camera, Wand2, Image as ImageIcon, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAvatarProfiles } from './avatar-studio/useAvatarProfiles';
import { useAvatarPortraits } from './avatar-studio/useAvatarPortraits';
import { useAvatarGeneration } from './avatar-studio/useAvatarGeneration';
import { StudioHeader } from './avatar-studio/StudioHeader';
import { ProfileTab } from './avatar-studio/ProfileTab';
import { PortraitsTab } from './avatar-studio/PortraitsTab';
import { GenerateTab } from './avatar-studio/GenerateTab';
import { LibraryTab } from './avatar-studio/LibraryTab';
import { PublishTab } from './avatar-studio/PublishTab';
import { BrainLibraryDialog, CharacterPickerDialog } from './avatar-studio/AvatarDialogs';

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function AvatarStudioContent() {
  const [activeTab, setActiveTab] = useState('profile');

  // Hooks
  const profilesHook = useAvatarProfiles({ mode: 'supabase' });
  const portraitsHook = useAvatarPortraits();
  const generationHook = useAvatarGeneration({
    profile: profilesHook.profile,
    ownerPortraits: portraitsHook.ownerPortraits,
  });

  // Handle selecting a character from Brain Library to use as Avatar Identity
  const handleSelectBrainCharacter = useCallback((character: any) => {
    const name = character.name || '';
    const personality = character.personality || character.visual_traits || '';

    profilesHook.updateProfile({
      name,
      personality: personality || profilesHook.profile.personality,
      brainCharacterId: character.id,
    });

    // Also fetch images for this character as portraits
    const imageIds = character.reference_image_ids || character.referenceImageIds || [];
    if (imageIds.length > 0) {
      portraitsHook.fetchImagesForCharacter(imageIds);
    }

    portraitsHook.setShowCharacterPicker(false);
    toast.success(`Đã chọn nhân vật "${name}" từ Brain Library`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle portrait selection
  const handleTogglePortrait = useCallback((portraitId: string) => {
    portraitsHook.setSelectedPortraits(prev =>
      prev.includes(portraitId)
        ? prev.filter(id => id !== portraitId)
        : [...prev, portraitId]
    );
  }, [portraitsHook]);

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <StudioHeader
        profiles={profilesHook.profiles}
        activeProfileId={profilesHook.activeProfileId}
        ownerPortraitCount={portraitsHook.ownerPortraits.length}
        onSwitchProfile={profilesHook.switchProfile}
        onCreateProfile={profilesHook.createNewProfile}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="portraits" className="flex items-center gap-2">
            <Camera className="h-4 w-4" /> Portraits
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Generate
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Library
          </TabsTrigger>
          <TabsTrigger value="publish" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Publish
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <ProfileTab
            profile={profilesHook.profile}
            profiles={profilesHook.profiles}
            activeProfileId={profilesHook.activeProfileId}
            ownerPortraitCount={portraitsHook.ownerPortraits.length}
            generatedContent={generationHook.generatedContent}
            onUpdateProfile={profilesHook.updateProfile}
            onSaveProfiles={profilesHook.saveProfiles}
            onDeleteProfile={profilesHook.deleteProfile}
            onShowCharacterPicker={() => portraitsHook.setShowCharacterPicker(true)}
          />
        </TabsContent>

        <TabsContent value="portraits" className="space-y-4">
          <PortraitsTab
            ownerPortraits={portraitsHook.ownerPortraits}
            selectedPortraits={portraitsHook.selectedPortraits}
            onTogglePortrait={handleTogglePortrait}
            onShowBrainLibrary={() => portraitsHook.setShowBrainLibrary(true)}
            onRefresh={portraitsHook.fetchOwnerPortraits}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <GenerateTab
            selectedTemplate={generationHook.selectedTemplate}
            customScript={generationHook.customScript}
            selectedStyle={generationHook.selectedStyle}
            selectedPlatform={generationHook.selectedPlatform}
            generationProgress={generationHook.generationProgress}
            isGenerating={generationHook.isGenerating}
            ownerPortraitCount={portraitsHook.ownerPortraits.length}
            onSelectTemplate={generationHook.setSelectedTemplate}
            onSetCustomScript={generationHook.setCustomScript}
            onSetSelectedStyle={generationHook.setSelectedStyle}
            onSetSelectedPlatform={generationHook.setSelectedPlatform}
            onGenerate={generationHook.generateAvatarContent}
          />
        </TabsContent>

        <TabsContent value="library" className="space-y-4">
          <LibraryTab generatedContent={generationHook.generatedContent} />
        </TabsContent>

        <TabsContent value="publish" className="space-y-4">
          <PublishTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <BrainLibraryDialog
        open={portraitsHook.showBrainLibrary}
        onOpenChange={portraitsHook.setShowBrainLibrary}
        onSelectImages={portraitsHook.handleBrainLibrarySelect}
      />
      <CharacterPickerDialog
        open={portraitsHook.showCharacterPicker}
        onOpenChange={portraitsHook.setShowCharacterPicker}
        brainCharacters={portraitsHook.brainCharacters}
        onSelectCharacter={handleSelectBrainCharacter}
      />
    </div>
  );
}
