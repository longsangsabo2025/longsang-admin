import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  RefreshCw, 
  Share2,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  MessageCircle,
  Music2,
  Globe,
  Users,
  Edit2,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type-safe Supabase client for project_social_links
// Note: Types will be updated after regenerating Supabase types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const socialLinksTable = () => supabase.from("project_social_links") as any;

interface SocialLink {
  id: string;
  project_id: string;
  platform: string;
  url: string;
  username: string;
  follower_count: number;
  is_verified: boolean;
  is_primary: boolean;
  notes: string;
  credential_id: string | null;
  page_id: string | null;
  api_endpoint: string | null;
  auto_post_enabled: boolean;
  last_synced_at: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined credential data
  credential?: {
    id: string;
    name: string;
    type: string;
  };
}

interface Credential {
  id: string;
  name: string;
  type: string;
  project_id: string;
}

interface ProjectSocialTabProps {
  projectId: string;
  projectName?: string;
}

// Platform configurations - Using custom icon components for social platforms
// Note: lucide-react deprecated Facebook, Youtube, Instagram, Twitter, Linkedin icons
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const PLATFORMS = {
  facebook: {
    name: "Facebook",
    icon: FacebookIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    placeholder: "https://facebook.com/yourpage",
    userPlaceholder: "@yourpage"
  },
  youtube: {
    name: "YouTube",
    icon: YoutubeIcon,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    placeholder: "https://youtube.com/@yourchannel",
    userPlaceholder: "@yourchannel"
  },
  instagram: {
    name: "Instagram",
    icon: InstagramIcon,
    color: "text-pink-600",
    bgColor: "bg-gradient-to-tr from-yellow-500/10 via-pink-500/10 to-purple-500/10",
    borderColor: "border-pink-500/30",
    placeholder: "https://instagram.com/yourhandle",
    userPlaceholder: "@yourhandle"
  },
  twitter: {
    name: "X (Twitter)",
    icon: TwitterIcon,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    placeholder: "https://x.com/yourhandle",
    userPlaceholder: "@yourhandle"
  },
  tiktok: {
    name: "TikTok",
    icon: Music2,
    color: "text-black dark:text-white",
    bgColor: "bg-gradient-to-r from-cyan-500/10 to-pink-500/10",
    borderColor: "border-gray-500/30",
    placeholder: "https://tiktok.com/@yourhandle",
    userPlaceholder: "@yourhandle"
  },
  linkedin: {
    name: "LinkedIn",
    icon: LinkedinIcon,
    color: "text-blue-700",
    bgColor: "bg-blue-700/10",
    borderColor: "border-blue-700/30",
    placeholder: "https://linkedin.com/company/yourcompany",
    userPlaceholder: "yourcompany"
  },
  telegram: {
    name: "Telegram",
    icon: MessageCircle,
    color: "text-sky-500",
    bgColor: "bg-sky-500/10",
    borderColor: "border-sky-500/30",
    placeholder: "https://t.me/yourchannel",
    userPlaceholder: "@yourchannel"
  },
  discord: {
    name: "Discord",
    icon: MessageCircle,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    placeholder: "https://discord.gg/yourserver",
    userPlaceholder: "yourserver"
  },
  threads: {
    name: "Threads",
    icon: Share2,
    color: "text-gray-900 dark:text-white",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    placeholder: "https://threads.net/@yourhandle",
    userPlaceholder: "@yourhandle"
  },
  pinterest: {
    name: "Pinterest",
    icon: Share2,
    color: "text-red-600",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/30",
    placeholder: "https://pinterest.com/yourhandle",
    userPlaceholder: "@yourhandle"
  },
  zalo: {
    name: "Zalo",
    icon: MessageCircle,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    placeholder: "https://zalo.me/yourpage",
    userPlaceholder: "yourpage"
  },
  other: {
    name: "Other",
    icon: Globe,
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    placeholder: "https://...",
    userPlaceholder: "username"
  }
};

const formatFollowers = (count: number): string => {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
  return count.toString();
};

export function ProjectSocialTab({ projectId, projectName }: Readonly<ProjectSocialTabProps>) {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingLink, setEditingLink] = useState<SocialLink | null>(null);
  const [formData, setFormData] = useState({
    platform: "facebook",
    url: "",
    username: "",
    follower_count: 0,
    is_verified: false,
    is_primary: false,
    notes: "",
    credential_id: "",
    page_id: "",
    auto_post_enabled: false
  });

  useEffect(() => {
    fetchSocialLinks();
    fetchCredentials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchCredentials = async () => {
    try {
      const { data, error } = await supabase
        .from("project_credentials")
        .select("id, name, type, project_id")
        .eq("project_id", projectId)
        .order("name");

      if (error) throw error;
      setCredentials(data || []);
    } catch (error: unknown) {
      console.error("Error fetching credentials:", error);
    }
  };

  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await socialLinksTable()
        .select("*, credential:project_credentials(id, name, type)")
        .eq("project_id", projectId)
        .order("is_primary", { ascending: false })
        .order("platform", { ascending: true });

      if (error) throw error;
      setSocialLinks(data || []);
    } catch (error: unknown) {
      console.error("Error fetching social links:", error);
      toast.error("Không thể tải social links");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      platform: "facebook",
      url: "",
      username: "",
      follower_count: 0,
      is_verified: false,
      is_primary: false,
      notes: "",
      credential_id: "",
      page_id: "",
      auto_post_enabled: false
    });
    setEditingLink(null);
  };

  const openEditDialog = (link: SocialLink) => {
    setEditingLink(link);
    setFormData({
      platform: link.platform,
      url: link.url,
      username: link.username || "",
      follower_count: link.follower_count || 0,
      is_verified: link.is_verified || false,
      is_primary: link.is_primary || false,
      notes: link.notes || "",
      credential_id: link.credential_id || "",
      page_id: link.page_id || "",
      auto_post_enabled: link.auto_post_enabled || false
    });
    setShowAddDialog(true);
  };

  const copyToClipboard = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      toast.success("Đã copy!");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Không thể copy");
    }
  };

  const saveSocialLink = async () => {
    if (!formData.url) {
      toast.error("URL là bắt buộc");
      return;
    }

    try {
      const saveData = {
        platform: formData.platform,
        url: formData.url,
        username: formData.username || null,
        follower_count: formData.follower_count || null,
        is_verified: formData.is_verified,
        is_primary: formData.is_primary,
        notes: formData.notes || null,
        credential_id: formData.credential_id || null,
        page_id: formData.page_id || null,
        auto_post_enabled: formData.auto_post_enabled
      };

      if (editingLink) {
        // Update existing
        const { error } = await socialLinksTable()
          .update({
            ...saveData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingLink.id);

        if (error) throw error;
        toast.success("Đã cập nhật social link!");
      } else {
        // Create new
        const { error } = await socialLinksTable()
          .insert({
            ...saveData,
            project_id: projectId
          });

        if (error) throw error;
        toast.success("Đã thêm social link!");
      }
      
      setShowAddDialog(false);
      resetForm();
      fetchSocialLinks();
    } catch (error: unknown) {
      console.error("Error saving social link:", error);
      const message = error instanceof Error ? error.message : "Không thể lưu social link";
      toast.error(message);
    }
  };

  const deleteSocialLink = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa social link này?")) return;
    
    try {
      const { error } = await socialLinksTable()
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa!");
      fetchSocialLinks();
    } catch (error: unknown) {
      console.error("Error deleting social link:", error);
      toast.error("Không thể xóa");
    }
  };

  const togglePrimary = async (link: SocialLink) => {
    try {
      const { error } = await socialLinksTable()
        .update({ 
          is_primary: !link.is_primary,
          updated_at: new Date().toISOString()
        })
        .eq("id", link.id);

      if (error) throw error;
      fetchSocialLinks();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  // Stats
  const totalFollowers = socialLinks.reduce((sum, l) => sum + (l.follower_count || 0), 0);
  const verifiedCount = socialLinks.filter(l => l.is_verified).length;
  const primaryLinks = socialLinks.filter(l => l.is_primary);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentPlatform = PLATFORMS[formData.platform as keyof typeof PLATFORMS] || PLATFORMS.other;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {socialLinks.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Share2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{socialLinks.length}</p>
                  <p className="text-xs text-muted-foreground">Platforms</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatFollowers(totalFollowers)}</p>
                  <p className="text-xs text-muted-foreground">Total Followers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Check className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{verifiedCount}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{primaryLinks.length}</p>
                  <p className="text-xs text-muted-foreground">Primary</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Social Media Accounts
          </h3>
          <p className="text-sm text-muted-foreground">
            Quản lý tất cả kênh social media của {projectName || "dự án"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSocialLinks}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showAddDialog} onOpenChange={(open) => {
            setShowAddDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Social
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingLink ? "Chỉnh sửa Social Link" : "Thêm Social Link"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Platform Select */}
                <div className="space-y-2">
                  <Label>Platform</Label>
                  <Select 
                    value={formData.platform}
                    onValueChange={(v) => setFormData({...formData, platform: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORMS).map(([key, platform]) => {
                        const Icon = platform.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${platform.color}`} />
                              {platform.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* URL */}
                <div className="space-y-2">
                  <Label>URL *</Label>
                  <Input 
                    placeholder={currentPlatform.placeholder}
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label>Username / Handle</Label>
                  <Input 
                    placeholder={currentPlatform.userPlaceholder}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>

                {/* Followers */}
                <div className="space-y-2">
                  <Label>Số Followers</Label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={formData.follower_count || ""}
                    onChange={(e) => setFormData({...formData, follower_count: Number.parseInt(e.target.value) || 0})}
                  />
                </div>

                {/* Switches */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_verified"
                      checked={formData.is_verified}
                      onCheckedChange={(checked) => setFormData({...formData, is_verified: checked})}
                    />
                    <Label htmlFor="is_verified" className="cursor-pointer">
                      Verified Account
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_primary"
                      checked={formData.is_primary}
                      onCheckedChange={(checked) => setFormData({...formData, is_primary: checked})}
                    />
                    <Label htmlFor="is_primary" className="cursor-pointer">
                      Primary
                    </Label>
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label>Ghi chú</Label>
                  <Textarea 
                    placeholder="Mô tả về kênh này, mục đích sử dụng..."
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    rows={2}
                  />
                </div>

                {/* Credential Selection */}
                {credentials.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="flex items-center gap-2">
                      🔑 Liên kết Credential
                      <Badge variant="outline" className="text-xs">Tùy chọn</Badge>
                    </Label>
                    <Select 
                      value={formData.credential_id || "none"}
                      onValueChange={(v) => setFormData({...formData, credential_id: v === "none" ? "" : v})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn credential..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Không liên kết</SelectItem>
                        {credentials.map((cred) => (
                          <SelectItem key={cred.id} value={cred.id}>
                            <div className="flex items-center gap-2">
                              <span>{cred.name}</span>
                              <Badge variant="secondary" className="text-xs">{cred.type}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Liên kết credential để auto-post hoặc sync stats
                    </p>
                  </div>
                )}

                {/* Page ID for API integration */}
                {formData.credential_id && (
                  <div className="space-y-2">
                    <Label>Page/Channel ID</Label>
                    <Input 
                      placeholder="ID của page hoặc channel (cho API)"
                      value={formData.page_id}
                      onChange={(e) => setFormData({...formData, page_id: e.target.value})}
                    />
                    <p className="text-xs text-muted-foreground">
                      ID cần thiết để gọi API của platform
                    </p>
                  </div>
                )}

                {/* Auto post toggle */}
                {formData.credential_id && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      <Label className="cursor-pointer">Auto-post</Label>
                      <p className="text-xs text-muted-foreground">
                        Tự động đăng bài lên platform này
                      </p>
                    </div>
                    <Switch
                      checked={formData.auto_post_enabled}
                      onCheckedChange={(checked) => setFormData({...formData, auto_post_enabled: checked})}
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  resetForm();
                }}>
                  Hủy
                </Button>
                <Button onClick={saveSocialLink}>
                  {editingLink ? "Cập nhật" : "Thêm"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Social Links Grid */}
      {socialLinks.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-muted">
                <Share2 className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h3 className="font-semibold mb-2">Chưa có Social Media nào</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Thêm các kênh social media của dự án để quản lý tập trung
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Social Link đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {socialLinks.map((link) => {
            const platform = PLATFORMS[link.platform as keyof typeof PLATFORMS] || PLATFORMS.other;
            const Icon = platform.icon;
            
            return (
              <Card 
                key={link.id} 
                className={`relative overflow-hidden transition-all hover:shadow-md ${
                  link.is_primary ? `border-2 ${platform.borderColor}` : ""
                }`}
              >
                {link.is_primary && (
                  <div className="absolute top-0 right-0 px-2 py-1 bg-yellow-500 text-yellow-950 text-xs font-medium rounded-bl-lg">
                    <Star className="h-3 w-3 inline mr-1" />
                    Primary
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-3 rounded-xl ${platform.bgColor} shrink-0`}>
                      <Icon className={`h-6 w-6 ${platform.color}`} />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{platform.name}</span>
                        {link.is_verified && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            <Check className="h-3 w-3 mr-0.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {link.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          {link.username}
                        </p>
                      )}
                      
                      {link.follower_count > 0 && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="h-3.5 w-3.5" />
                          {formatFollowers(link.follower_count)} followers
                        </div>
                      )}

                      {/* Credential badge */}
                      {link.credential && (
                        <div className="flex items-center gap-1 mt-2">
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/30">
                            🔑 {link.credential.name}
                          </Badge>
                          {link.auto_post_enabled && (
                            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                              Auto-post
                            </Badge>
                          )}
                        </div>
                      )}

                      {link.notes && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {link.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(link.url, link.id)}
                        title="Copy URL"
                      >
                        {copiedId === link.id ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(link.url, "_blank")}
                        title="Mở link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePrimary(link)}
                        title={link.is_primary ? "Bỏ Primary" : "Đặt làm Primary"}
                      >
                        <Star className={`h-4 w-4 ${link.is_primary ? "fill-yellow-500 text-yellow-500" : ""}`} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(link)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deleteSocialLink(link.id)}
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Add Buttons */}
      {socialLinks.length > 0 && socialLinks.length < 5 && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Thêm nhanh các platform phổ biến:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(PLATFORMS)
                .filter(([key]) => !socialLinks.some(l => l.platform === key))
                .slice(0, 6)
                .map(([key, platform]) => {
                  const Icon = platform.icon;
                  return (
                    <Button
                      key={key}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData({ ...formData, platform: key });
                        setShowAddDialog(true);
                      }}
                    >
                      <Icon className={`h-4 w-4 mr-1 ${platform.color}`} />
                      {platform.name}
                    </Button>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
