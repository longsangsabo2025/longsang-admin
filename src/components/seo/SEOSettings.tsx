import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings, Save, Key, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function SEOSettings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    googleApiEnabled: true,
    googleServiceAccount: "",
    bingApiEnabled: false,
    bingApiKey: "",
    autoSubmitNewContent: true,
    dailyQuotaLimit: 200,
    retryFailedAfterHours: 24,
    sitemapAutoUpdate: true,
    searchConsoleWebhook: ""
  });

  const handleSave = () => {
    toast({
      title: "✅ Đã lưu",
      description: "Cài đặt SEO đã được cập nhật thành công"
    });
  };

  return (
    <div className="space-y-4">
      {/* Google API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Google Indexing API
          </CardTitle>
          <CardDescription>
            Cấu hình Google Indexing API để tự động submit URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Kích hoạt Google API</Label>
              <div className="text-sm text-muted-foreground">
                Tự động submit URLs vào Google Search Console
              </div>
            </div>
            <Switch
              checked={settings.googleApiEnabled}
              onCheckedChange={(checked) => 
                setSettings({...settings, googleApiEnabled: checked})
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="googleServiceAccount">
              Google Service Account JSON
            </Label>
            <Textarea
              id="googleServiceAccount"
              placeholder='{"type": "service_account", "project_id": "...", ...}'
              className="font-mono text-xs"
              rows={6}
              value={settings.googleServiceAccount}
              onChange={(e) => 
                setSettings({...settings, googleServiceAccount: e.target.value})
              }
            />
            <p className="text-xs text-muted-foreground">
              Paste toàn bộ nội dung file JSON từ Google Cloud Console
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyQuota">Daily Quota Limit</Label>
            <Input
              id="dailyQuota"
              type="number"
              value={settings.dailyQuotaLimit}
              onChange={(e) => 
                setSettings({...settings, dailyQuotaLimit: parseInt(e.target.value)})
              }
            />
            <p className="text-xs text-muted-foreground">
              Giới hạn số lượng URLs submit mỗi ngày (Google limit: 200/day)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bing API Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Bing Webmaster Tools
          </CardTitle>
          <CardDescription>
            Cấu hình Bing Webmaster API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Kích hoạt Bing API</Label>
              <div className="text-sm text-muted-foreground">
                Tự động submit URLs vào Bing Webmaster
              </div>
            </div>
            <Switch
              checked={settings.bingApiEnabled}
              onCheckedChange={(checked) => 
                setSettings({...settings, bingApiEnabled: checked})
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bingApiKey">Bing API Key</Label>
            <Input
              id="bingApiKey"
              type="password"
              placeholder="Nhập Bing Webmaster API key"
              value={settings.bingApiKey}
              onChange={(e) => 
                setSettings({...settings, bingApiKey: e.target.value})
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Tự Động Hóa
          </CardTitle>
          <CardDescription>
            Cấu hình các tính năng tự động
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-submit nội dung mới</Label>
              <div className="text-sm text-muted-foreground">
                Tự động submit khi có bài viết/trang mới
              </div>
            </div>
            <Switch
              checked={settings.autoSubmitNewContent}
              onCheckedChange={(checked) => 
                setSettings({...settings, autoSubmitNewContent: checked})
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tự động cập nhật Sitemap</Label>
              <div className="text-sm text-muted-foreground">
                Tạo lại sitemap khi có content mới
              </div>
            </div>
            <Switch
              checked={settings.sitemapAutoUpdate}
              onCheckedChange={(checked) => 
                setSettings({...settings, sitemapAutoUpdate: checked})
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retryHours">Retry thất bại sau (giờ)</Label>
            <Input
              id="retryHours"
              type="number"
              value={settings.retryFailedAfterHours}
              onChange={(e) => 
                setSettings({...settings, retryFailedAfterHours: parseInt(e.target.value)})
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook">Search Console Webhook URL (Optional)</Label>
            <Input
              id="webhook"
              placeholder="https://your-domain.com/api/seo-webhook"
              value={settings.searchConsoleWebhook}
              onChange={(e) => 
                setSettings({...settings, searchConsoleWebhook: e.target.value})
              }
            />
            <p className="text-xs text-muted-foreground">
              URL nhận thông báo khi có thay đổi từ Search Console
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center gap-2">
          <Save className="w-4 h-4" />
          Lưu Cài Đặt
        </Button>
      </div>
    </div>
  );
}
