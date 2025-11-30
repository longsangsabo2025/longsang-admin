/**
 * =================================================================
 * AUTO-PUBLISH SETTINGS COMPONENT
 * =================================================================
 * Settings to configure auto-publish behavior without review
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { SocialPlatform } from "@/types/social-media";
import { AlertTriangle, Save, Settings, Zap } from "lucide-react";
import { useEffect, useState } from "react";

const platformInfo: Record<SocialPlatform, { name: string; icon: string }> = {
  linkedin: { name: "LinkedIn", icon: "💼" },
  twitter: { name: "Twitter/X", icon: "𝕏" },
  facebook: { name: "Facebook", icon: "👥" },
  instagram: { name: "Instagram", icon: "📸" },
  youtube: { name: "YouTube", icon: "▶️" },
  telegram: { name: "Telegram", icon: "✈️" },
  discord: { name: "Discord", icon: "🎮" },
};

interface AutoPublishSettings {
  enabled: boolean;
  platforms: SocialPlatform[];
  auto_approve: boolean;
  add_hashtags: boolean;
  include_link: boolean;
}

export function AutoPublishSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AutoPublishSettings>({
    enabled: false,
    platforms: [],
    auto_approve: false,
    add_hashtags: true,
    include_link: true,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .eq("key", "auto_publish_settings")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data?.value) {
        setSettings(data.value as AutoPublishSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("system_settings").upsert({
        key: "auto_publish_settings",
        value: settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "✅ Settings Saved",
        description: "Auto-publish settings have been updated",
      });
    } catch (error) {
      console.error("Failed to save settings:", error);
      toast({
        title: "❌ Save Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (platform: SocialPlatform) => {
    setSettings((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>Auto-Publish Settings</CardTitle>
          </div>
          {settings.enabled && (
            <Badge variant="default" className="gap-1">
              <Zap className="h-3 w-3" />
              Active
            </Badge>
          )}
        </div>
        <CardDescription>Configure automatic publishing without manual review</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Master Switch */}
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="auto-publish-enabled" className="text-base font-semibold">
              Enable Auto-Publish
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically publish content from n8n workflows without review
            </p>
          </div>
          <Switch
            id="auto-publish-enabled"
            checked={settings.enabled}
            onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, enabled: checked }))}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Warning */}
            <div className="flex items-start gap-3 p-4 border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  Caution: Auto-Publish Mode
                </p>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Content will be posted to social media automatically without manual approval.
                  Ensure your n8n workflows produce high-quality content.
                </p>
              </div>
            </div>

            {/* Auto-Approve Option */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="auto-approve" className="font-semibold">
                  Auto-Approve Content
                </Label>
                <p className="text-sm text-muted-foreground">
                  Mark content as approved before publishing
                </p>
              </div>
              <Switch
                id="auto-approve"
                checked={settings.auto_approve}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, auto_approve: checked }))
                }
              />
            </div>

            {/* Default Platforms */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Default Platforms</Label>
              <p className="text-sm text-muted-foreground">
                Select which platforms to publish to automatically
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {(Object.keys(platformInfo) as SocialPlatform[]).map((platform) => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`auto-${platform}`}
                      checked={settings.platforms.includes(platform)}
                      onCheckedChange={() => togglePlatform(platform)}
                    />
                    <Label
                      htmlFor={`auto-${platform}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <span className="text-lg">{platformInfo[platform].icon}</span>
                      {platformInfo[platform].name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Options */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Content Options</Label>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="add-hashtags" className="font-medium">
                    Add Hashtags
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically include hashtags from metadata
                  </p>
                </div>
                <Switch
                  id="add-hashtags"
                  checked={settings.add_hashtags}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, add_hashtags: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="include-link" className="font-medium">
                    Include Link
                  </Label>
                  <p className="text-xs text-muted-foreground">Add link back to original content</p>
                </div>
                <Switch
                  id="include-link"
                  checked={settings.include_link}
                  onCheckedChange={(checked) =>
                    setSettings((prev) => ({ ...prev, include_link: checked }))
                  }
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold">Auto-Publish Configuration</p>
              </div>
              <ul className="text-sm space-y-1 ml-6">
                <li>
                  • Status: <strong>{settings.enabled ? "Enabled" : "Disabled"}</strong>
                </li>
                <li>
                  • Platforms: <strong>{settings.platforms.length || "None"}</strong> selected
                </li>
                <li>
                  • Auto-approve: <strong>{settings.auto_approve ? "Yes" : "No"}</strong>
                </li>
                <li>
                  • Hashtags: <strong>{settings.add_hashtags ? "Yes" : "No"}</strong>
                </li>
                <li>
                  • Include link: <strong>{settings.include_link ? "Yes" : "No"}</strong>
                </li>
              </ul>
            </div>
          </>
        )}

        {/* Save Button */}
        <Button onClick={saveSettings} disabled={saving} className="w-full" size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
