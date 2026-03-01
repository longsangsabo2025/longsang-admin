/**
 * Hook for Avatar Profile management
 * Supports both localStorage-only and Supabase persistence modes
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { AvatarProfile } from './types';
import { DEFAULT_PROFILE, STORAGE_KEY, ACTIVE_PROFILE_KEY } from './constants';

interface UseAvatarProfilesOptions {
  mode: 'local' | 'supabase';
}

export function useAvatarProfiles({ mode }: UseAvatarProfilesOptions) {
  const [profiles, setProfiles] = useState<AvatarProfile[]>([DEFAULT_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(mode === 'supabase');
  const [isSaving, setIsSaving] = useState(false);

  const profile = profiles.find(p => p.id === activeProfileId) || profiles[0] || DEFAULT_PROFILE;

  // Load profiles on mount
  useEffect(() => {
    if (mode === 'local') {
      loadFromLocalStorage();
    } else {
      loadFromSupabase();
    }
  }, []);

  function loadFromLocalStorage() {
    const savedProfiles = localStorage.getItem(STORAGE_KEY);
    const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);

    if (savedProfiles) {
      try {
        const parsed = JSON.parse(savedProfiles);
        // Handle migration from old single profile format
        if (Array.isArray(parsed)) {
          setProfiles(parsed);
        } else if (parsed.name) {
          // Old format - convert to new
          const migratedProfile = { ...parsed, id: 'migrated-' + Date.now() };
          setProfiles([migratedProfile]);
          setActiveProfileId(migratedProfile.id);
        }
      } catch (e) {
        console.error('Failed to load avatar profiles:', e);
      }
    }

    if (savedActiveId) {
      setActiveProfileId(savedActiveId);
    }
  }

  async function loadFromSupabase() {
    try {
      const response = await fetch('/api/avatars/profiles');
      const result = await response.json();

      if (result.success && result.data && result.data.length > 0) {
        // Transform from Supabase format
        const transformedProfiles = result.data.map((p: any) => ({
          id: p.id,
          name: p.name,
          role: p.role || '',
          brand: p.brand || '',
          personality: p.personality || '',
          speakingStyle: p.speaking_style || '',
          languages: p.languages || ['Vietnamese'],
          portraits: p.portraits || [],
          brainCharacterId: p.brain_character_id,
          createdAt: p.created_at,
        }));
        setProfiles(transformedProfiles);
        if (result.activeProfileId) {
          setActiveProfileId(result.activeProfileId);
        }
      } else {
        // Try localStorage migration
        const savedProfiles = localStorage.getItem(STORAGE_KEY);
        const savedActiveId = localStorage.getItem(ACTIVE_PROFILE_KEY);

        if (savedProfiles) {
          try {
            const parsed = JSON.parse(savedProfiles);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setProfiles(parsed);
              if (savedActiveId) setActiveProfileId(savedActiveId);

              // Migrate to Supabase
              console.log('[Avatar] Migrating profiles to Supabase...');
              await fetch('/api/avatars/profiles/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profiles: parsed, activeProfileId: savedActiveId }),
              });
              toast.success('Đã migrate profiles sang database');
            }
          } catch (e) {
            console.error('Failed to migrate avatar profiles:', e);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load avatar profiles:', error);
      // Fallback to localStorage
      const savedProfiles = localStorage.getItem(STORAGE_KEY);
      if (savedProfiles) {
        try {
          setProfiles(JSON.parse(savedProfiles));
        } catch { /* ignore */ }
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Helper to update current profile
  const updateProfile = useCallback((updates: Partial<AvatarProfile>) => {
    setProfiles(prev => prev.map(p =>
      p.id === activeProfileId ? { ...p, ...updates } : p
    ));
  }, [activeProfileId]);

  // Save profile to Supabase (used for auto-save)
  const saveProfileToSupabase = useCallback(async (profileToSave: AvatarProfile) => {
    if (mode !== 'supabase') return;
    setIsSaving(true);
    try {
      const payload = {
        name: profileToSave.name,
        role: profileToSave.role,
        brand: profileToSave.brand,
        personality: profileToSave.personality,
        speakingStyle: profileToSave.speakingStyle,
        languages: profileToSave.languages,
        portraits: profileToSave.portraits,
        brainCharacterId: profileToSave.brainCharacterId,
      };

      const response = await fetch(`/api/avatars/profiles/${profileToSave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      }
    } catch (error) {
      console.error('Failed to save profile to Supabase:', error);
    } finally {
      setIsSaving(false);
    }
  }, [mode, profiles]);

  // Save all profiles
  const saveProfiles = useCallback(async () => {
    if (mode === 'local') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);
      toast.success('Profile saved!');
      return;
    }

    setIsSaving(true);
    try {
      await fetch('/api/avatars/profiles/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profiles, activeProfileId }),
      });

      // Also save to localStorage as cache
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
      localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfileId);

      toast.success('Profile saved to database!');
    } catch (error) {
      console.error('Failed to save profiles:', error);
      toast.error('Lưu thất bại');
    } finally {
      setIsSaving(false);
    }
  }, [mode, profiles, activeProfileId]);

  // Auto-save profile changes (supabase mode only, debounced 5s)
  useEffect(() => {
    if (mode !== 'supabase' || isLoading) return;

    const timeoutId = setTimeout(() => {
      const currentProfile = profiles.find(p => p.id === activeProfileId);
      if (currentProfile) {
        saveProfileToSupabase(currentProfile);
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [mode, profiles, activeProfileId, isLoading, saveProfileToSupabase]);

  // Create new profile
  const createNewProfile = useCallback(async (name: string = 'New Avatar') => {
    const newProfile: AvatarProfile = {
      id: `profile-${Date.now()}`,
      name,
      role: '',
      brand: '',
      personality: '',
      speakingStyle: '',
      languages: ['Vietnamese'],
      portraits: [],
      createdAt: new Date().toISOString(),
    };

    setProfiles(prev => [...prev, newProfile]);
    setActiveProfileId(newProfile.id);

    if (mode === 'supabase') {
      try {
        await fetch('/api/avatars/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile),
        });
      } catch (error) {
        console.error('Failed to create profile in Supabase:', error);
      }
    }

    toast.success(`Đã tạo profile "${name}"`);
    return newProfile;
  }, [mode]);

  // Delete profile
  const deleteProfile = useCallback(async (profileId: string) => {
    if (profiles.length <= 1) {
      toast.error('Không thể xóa profile cuối cùng');
      return;
    }

    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfileId === profileId) {
      setActiveProfileId(profiles.find(p => p.id !== profileId)?.id || 'default');
    }

    if (mode === 'supabase') {
      try {
        await fetch(`/api/avatars/profiles/${profileId}`, { method: 'DELETE' });
      } catch (error) {
        console.error('Failed to delete profile from Supabase:', error);
      }
    }

    toast.success('Đã xóa profile');
  }, [mode, profiles, activeProfileId]);

  // Switch profile
  const switchProfile = useCallback(async (profileId: string) => {
    setActiveProfileId(profileId);
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);

    if (mode === 'supabase') {
      try {
        await fetch('/api/avatars/active', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId }),
        });
      } catch (error) {
        console.error('Failed to update active profile:', error);
      }
    }
  }, [mode]);

  return {
    profiles,
    activeProfileId,
    profile,
    isLoading,
    isSaving,
    updateProfile,
    saveProfiles,
    createNewProfile,
    deleteProfile,
    switchProfile,
  };
}
