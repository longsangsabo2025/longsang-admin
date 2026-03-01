/**
 * Content Repurpose Settings
 * Cấu hình Facebook Page credentials và translation preferences
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  CheckCircle2,
  Key,
  Loader2,
  Save,
  Settings,
} from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface RepurposeSettings {
  id?: string;
  default_source_language: string;
  default_target_language: string;
  default_ai_model: string;
  auto_translate: boolean;
  facebook_page_id: string;
  facebook_page_name: string;
  facebook_page_access_token: string;
  translation_style: string;
  custom_translation_prompt: string;
}

export const ContentRepurposeSettings = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RepurposeSettings>({
    default_source_language: 'en',
    default_target_language: 'vi',
    default_ai_model: 'gpt-4o',
    auto_translate: false,
    facebook_page_id: '',
    facebook_page_name: '',
    facebook_page_access_token: '',
    translation_style: 'professional',
    custom_translation_prompt: '',
  });

  // Load settings
  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/settings`);
      const data = await response.json();
      if (data.success && data.data) {
        setSettings({
          ...settings,
          ...data.data,
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/content-repurpose/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: 'Đã lưu cài đặt',
          description: 'Các thay đổi đã được lưu thành công',
        });
        setOpen(false);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể lưu cài đặt',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Cài đặt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cài đặt Content Repurpose</DialogTitle>
          <DialogDescription>
            Cấu hình Facebook Page và tùy chọn dịch thuật
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Facebook Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FaFacebook className="w-5 h-5 text-blue-500" />
                  Facebook Page
                </CardTitle>
                <CardDescription>
                  Cấu hình Page đích để đăng bài
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Page ID</Label>
                    <Input
                      value={settings.facebook_page_id}
                      onChange={(e) => setSettings({ ...settings, facebook_page_id: e.target.value })}
                      placeholder="123456789..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Page Name</Label>
                    <Input
                      value={settings.facebook_page_name}
                      onChange={(e) => setSettings({ ...settings, facebook_page_name: e.target.value })}
                      placeholder="My Tech Page"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Page Access Token
                  </Label>
                  <Input
                    type="password"
                    value={settings.facebook_page_access_token}
                    onChange={(e) => setSettings({ ...settings, facebook_page_access_token: e.target.value })}
                    placeholder="EAAxxxxxxx..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Lấy token từ{' '}
                    <a
                      href="https://developers.facebook.com/tools/explorer/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Graph API Explorer
                    </a>
                    {' '}với quyền pages_manage_posts, pages_read_engagement
                  </p>
                </div>
                {settings.facebook_page_id && settings.facebook_page_access_token && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã cấu hình Facebook Page
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Translation Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cài đặt dịch thuật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ngôn ngữ nguồn</Label>
                    <Select
                      value={settings.default_source_language}
                      onValueChange={(v) => setSettings({ ...settings, default_source_language: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ngôn ngữ đích</Label>
                    <Select
                      value={settings.default_target_language}
                      onValueChange={(v) => setSettings({ ...settings, default_target_language: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vi">Tiếng Việt</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>AI Model</Label>
                    <Select
                      value={settings.default_ai_model}
                      onValueChange={(v) => setSettings({ ...settings, default_ai_model: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phong cách dịch</Label>
                    <Select
                      value={settings.translation_style}
                      onValueChange={(v) => setSettings({ ...settings, translation_style: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                        <SelectItem value="casual">Thân thiện</SelectItem>
                        <SelectItem value="formal">Trang trọng</SelectItem>
                        <SelectItem value="creative">Sáng tạo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tự động dịch</Label>
                    <p className="text-xs text-muted-foreground">
                      Tự động dịch ngay sau khi import
                    </p>
                  </div>
                  <Switch
                    checked={settings.auto_translate}
                    onCheckedChange={(v) => setSettings({ ...settings, auto_translate: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prompt tùy chỉnh (Optional)</Label>
                  <Textarea
                    value={settings.custom_translation_prompt}
                    onChange={(e) => setSettings({ ...settings, custom_translation_prompt: e.target.value })}
                    placeholder="Thêm hướng dẫn đặc biệt cho AI khi dịch..."
                    className="min-h-[80px]"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Lưu cài đặt
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ContentRepurposeSettings;
