import { AppShowcaseData } from "@/types/app-showcase.types";
import { supabase } from "@/integrations/supabase/client";

// Service để load và save data với Supabase
export class AppShowcaseService {
  
  // Load data từ Supabase
  static async loadData(appId: string): Promise<AppShowcaseData | null> {
    try {
      const { data, error } = await supabase
        .from('app_showcase')
        .select('*')
        .eq('app_id', appId)
        .single();

      if (error) {
        console.error("Failed to load app showcase data:", error);
        return null;
      }

      if (!data) return null;

      // Transform database format to AppShowcaseData format
      return {
        id: data.app_id,
        slug: data.slug || data.app_id,
        appName: data.app_name,
        tagline: data.tagline || '',
        description: data.description || '',
        icon: data.icon || '',
        productionUrl: data.production_url || '',
        hero: data.hero,
        branding: data.branding,
        downloads: data.downloads,
        social: data.social,
        features: data.features,
        cta: data.cta,
        metadata: {
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          publishedAt: data.published_at,
          status: data.status as 'draft' | 'published'
        }
      };
    } catch (error) {
      console.error("Failed to load app showcase data:", error);
      return null;
    }
  }

  // Load all published projects
  static async loadAllProjects(): Promise<AppShowcaseData[]> {
    try {
      const { data, error } = await supabase
        .from('app_showcase')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Failed to load all projects:", error);
        return [];
      }

      if (!data) return [];

      return data.map(item => ({
        id: item.app_id,
        slug: item.slug || item.app_id,
        appName: item.app_name,
        tagline: item.tagline || '',
        description: item.description || '',
        icon: item.icon || '',
        productionUrl: item.production_url || '',
        hero: item.hero,
        branding: item.branding,
        downloads: item.downloads,
        social: item.social,
        features: item.features,
        cta: item.cta,
        metadata: {
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          publishedAt: item.published_at,
          status: item.status as 'draft' | 'published'
        }
      }));
    } catch (error) {
      console.error("Failed to load all projects:", error);
      return [];
    }
  }
  
  // Save data vào Supabase
  static async saveData(data: AppShowcaseData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('app_showcase')
        .upsert({
          app_id: data.id,
          slug: data.slug || data.id,
          app_name: data.appName,
          tagline: data.tagline,
          description: data.description,
          icon: data.icon || '',
          production_url: data.productionUrl || '',
          hero: data.hero,
          branding: data.branding,
          downloads: data.downloads,
          social: data.social,
          features: data.features,
          cta: data.cta,
          status: data.metadata.status,
          published_at: data.metadata.status === 'published' ? new Date().toISOString() : null
        }, {
          onConflict: 'app_id'
        });

      if (error) {
        console.error("Failed to save app showcase data:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to save app showcase data:", error);
      return false;
    }
  }
  
  // List all apps
  static async listApps(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('app_showcase')
        .select('app_id, app_name')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Failed to list apps:", error);
        return [];
      }

      return data.map(app => ({ id: app.app_id, name: app.app_name }));
    } catch (error) {
      console.error("Failed to list apps:", error);
      return [];
    }
  }
  
  // Upload image to Supabase Storage
  static async uploadImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('app-showcase')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error("Failed to upload image:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('app-showcase')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Failed to upload image:", error);
      // Fallback to base64 if upload fails
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    }
  }

  // Delete image from Supabase Storage
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/app-showcase/');
      if (urlParts.length < 2) return false;
      
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from('app-showcase')
        .remove([filePath]);

      if (error) {
        console.error("Failed to delete image:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to delete image:", error);
      return false;
    }
  }

  // Subscribe to realtime changes
  static subscribeToChanges(appId: string, callback: (data: AppShowcaseData) => void) {
    const channel = supabase
      .channel(`app_showcase:${appId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_showcase',
          filter: `app_id=eq.${appId}`
        },
        async (payload) => {
          if (payload.new) {
            const data = await AppShowcaseService.loadData(appId);
            if (data) callback(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}
