/**
 * =================================================================
 * PROJECT POST COMPOSER - Post to all social accounts of a project
 * =================================================================
 * This component allows composing and posting content to all social
 * media accounts linked to a specific project.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectSocialAccount } from "@/lib/projects";
import { ImagePicker, AutoUploadTextarea } from "@/components/media";
import {
  CheckCircle2,
  Image,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Send,
  XCircle,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ProjectPostComposerProps {
  projectId: string;
  projectName?: string;
  onPostSuccess?: (results: PostResult[]) => void;
}

interface PostResult {
  platform: string;
  accountName: string;
  success: boolean;
  postId?: string;
  error?: string;
}

// Platform configurations
const PLATFORM_CONFIG: Record<string, { 
  name: string; 
  icon: string; 
  limit: number;
  color: string;
  bgColor: string;
}> = {
  facebook: { name: "Facebook", icon: "f", limit: 63206, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  instagram: { name: "Instagram", icon: "IG", limit: 2200, color: "text-pink-500", bgColor: "bg-pink-500/10" },
  youtube: { name: "YouTube", icon: "YT", limit: 5000, color: "text-red-500", bgColor: "bg-red-500/10" },
  linkedin: { name: "LinkedIn", icon: "in", limit: 3000, color: "text-blue-600", bgColor: "bg-blue-600/10" },
  twitter: { name: "X (Twitter)", icon: "X", limit: 280, color: "text-gray-800 dark:text-white", bgColor: "bg-gray-500/10" },
  threads: { name: "Threads", icon: "@", limit: 500, color: "text-gray-800 dark:text-white", bgColor: "bg-gray-500/10" },
  tiktok: { name: "TikTok", icon: "TT", limit: 2200, color: "text-black dark:text-white", bgColor: "bg-gradient-to-r from-cyan-500/10 to-pink-500/10" },
  telegram: { name: "Telegram", icon: "TG", limit: 4096, color: "text-sky-500", bgColor: "bg-sky-500/10" },
  discord: { name: "Discord", icon: "DC", limit: 2000, color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
};

export function ProjectPostComposer({ 
  projectId, 
  projectName,
  onPostSuccess 
}: Readonly<ProjectPostComposerProps>) {
  const { toast } = useToast();
  
  // State
  const [accounts, setAccounts] = useState<ProjectSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<PostResult[]>([]);
  
  // Form state
  const [content, setContent] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Load project's social accounts
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('project_social_accounts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) throw error;
      
      const accountsList = (data || []) as ProjectSocialAccount[];
      setAccounts(accountsList);
      
      // Auto-select accounts with auto_post enabled
      const autoPostAccounts = accountsList
        .filter(a => a.auto_post_enabled)
        .map(a => a.id);
      setSelectedAccounts(new Set(autoPostAccounts));
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load social accounts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    const newSet = new Set(selectedAccounts);
    if (newSet.has(accountId)) {
      newSet.delete(accountId);
    } else {
      newSet.add(accountId);
    }
    setSelectedAccounts(newSet);
  };

  // Select/Deselect all
  const selectAll = () => {
    setSelectedAccounts(new Set(accounts.map(a => a.id)));
  };

  const deselectAll = () => {
    setSelectedAccounts(new Set());
  };

  // Get character limit (minimum of selected platforms)
  const getMinCharLimit = () => {
    if (selectedAccounts.size === 0) return 0;
    
    const selectedPlatforms = accounts
      .filter(a => selectedAccounts.has(a.id))
      .map(a => a.platform);
    
    const limits = selectedPlatforms.map(p => PLATFORM_CONFIG[p]?.limit || 5000);
    return Math.min(...limits);
  };

  // Group accounts by platform
  const groupedAccounts = accounts.reduce((acc, account) => {
    const platform = account.platform;
    if (!acc[platform]) {
      acc[platform] = [];
    }
    acc[platform].push(account);
    return acc;
  }, {} as Record<string, ProjectSocialAccount[]>);

  // Handle post
  const handlePost = async () => {
    if (selectedAccounts.size === 0) {
      toast({
        title: "Select Accounts",
        description: "Please select at least one account to post to",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Add Content",
        description: "Please enter some content to post",
        variant: "destructive",
      });
      return;
    }

    setPosting(true);
    setResults([]);

    const postResults: PostResult[] = [];
    const selectedAccountsList = accounts.filter(a => selectedAccounts.has(a.id));

    // Parse hashtags
    const hashtagArray = hashtags
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => tag.replace(/^#/, ""));

    // Build full content
    let fullContent = content.trim();
    if (hashtagArray.length > 0) {
      fullContent += "\n\n" + hashtagArray.map(tag => `#${tag}`).join(" ");
    }
    if (linkUrl) {
      fullContent += "\n\n" + linkUrl;
    }

    // Post to each selected account
    for (const account of selectedAccountsList) {
      try {
        // Call the API endpoint to post
        const response = await fetch('/api/social/post', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId: account.id,
            credentialId: account.credential_id,
            platform: account.platform,
            content: fullContent,
            imageUrl: imageUrl || undefined,
            pageId: account.page_id,
          }),
        });

        const result = await response.json();
        
        postResults.push({
          platform: account.platform,
          accountName: account.account_name,
          success: result.success,
          postId: result.postId,
          error: result.error,
        });

        // Also save to project_posts table
        if (result.success) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('project_posts') as any).insert({
            project_id: projectId,
            social_account_id: account.id,
            platform: account.platform,
            content: fullContent,
            media_urls: imageUrl ? [imageUrl] : null,
            external_post_id: result.postId,
            status: 'published',
            published_at: new Date().toISOString(),
          });
        }
      } catch (error) {
        postResults.push({
          platform: account.platform,
          accountName: account.account_name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    setResults(postResults);
    setPosting(false);

    // Show summary
    const successCount = postResults.filter(r => r.success).length;
    const failCount = postResults.filter(r => !r.success).length;

    if (successCount > 0) {
      toast({
        title: `✅ Posted to ${successCount} account(s)`,
        description: failCount > 0 ? `${failCount} failed` : "All posts successful!",
      });
      onPostSuccess?.(postResults);

      // Clear form on full success
      if (failCount === 0) {
        setContent("");
        setHashtags("");
        setLinkUrl("");
        setImageUrl("");
        setSelectedAccounts(new Set());
      }
    } else {
      toast({
        title: "❌ All posts failed",
        description: "Check the results for details",
        variant: "destructive",
      });
    }
  };

  const charLimit = getMinCharLimit();
  const isOverLimit = charLimit > 0 && content.length > charLimit;

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No social accounts linked to this project yet.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5" />
            Post to {projectName || "Project"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Compose and publish to multiple platforms at once
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          {accounts.length} accounts
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Account Selection */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Select Accounts</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={selectAll}>
                  All
                </Button>
                <Button variant="ghost" size="sm" onClick={deselectAll}>
                  None
                </Button>
              </div>
            </div>
            <CardDescription>
              {selectedAccounts.size} of {accounts.length} selected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => {
              const config = PLATFORM_CONFIG[platform] || { name: platform, icon: "🌐", color: "text-gray-500", bgColor: "bg-gray-500/10" };
              
              return (
                <div key={platform} className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm font-medium ${config.color}`}>
                    <span>{config.icon}</span>
                    {config.name}
                  </div>
                  {platformAccounts.map(account => (
                    <label
                      key={account.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAccounts.has(account.id)
                          ? 'border-primary bg-primary/10'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <Checkbox
                        checked={selectedAccounts.has(account.id)}
                        onCheckedChange={() => toggleAccount(account.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {account.account_name}
                        </p>
                        {account.account_username && (
                          <p className="text-xs text-muted-foreground truncate">
                            @{account.account_username}
                          </p>
                        )}
                      </div>
                      {account.auto_post_enabled && (
                        <Badge variant="secondary" className="text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Auto
                        </Badge>
                      )}
                    </label>
                  ))}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Center: Compose */}
        <Card className="lg:col-span-2 bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Compose Post</CardTitle>
            <CardDescription>
              {charLimit > 0 && (
                <span className={isOverLimit ? "text-red-500" : ""}>
                  {content.length} / {charLimit} characters
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content - Auto upload khi paste ảnh */}
            <div className="space-y-2">
              <Label>Content</Label>
              <AutoUploadTextarea
                placeholder="What's on your mind? (Paste ảnh để auto-upload)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className={`bg-slate-800/50 border-slate-600 ${isOverLimit ? "border-red-500" : ""}`}
                onImageUpload={(url) => {
                  // Auto set image URL khi paste ảnh
                  setImageUrl(url);
                }}
                showStatus={true}
              />
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <span>#</span> Hashtags
              </Label>
              <Input
                placeholder="ai, marketing, social (comma separated)"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="bg-slate-800/50 border-slate-600"
              />
            </div>

            {/* Link & Image */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Link URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-slate-800/50 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="w-4 h-4" /> Hình ảnh
                </Label>
                <ImagePicker
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url || "")}
                  placeholder="Chọn hoặc upload ảnh từ Drive"
                  aspect="video"
                />
              </div>
            </div>

            {/* Schedule (Optional) */}
            <Tabs defaultValue="now" className="w-full">
              <TabsList className="bg-slate-800/50">
                <TabsTrigger value="now">Post Now</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              <TabsContent value="schedule" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Date
                    </Label>
                    <Input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-slate-800/50 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Time
                    </Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      className="bg-slate-800/50 border-slate-600"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t border-slate-700 pt-4">
            <div className="text-sm text-muted-foreground">
              Posting to {selectedAccounts.size} account(s)
            </div>
            <Button
              onClick={handlePost}
              disabled={posting || selectedAccounts.size === 0 || !content.trim() || isOverLimit}
              className="gap-2"
            >
              {posting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post Now
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Post Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((result, index) => {
                const config = PLATFORM_CONFIG[result.platform] || { icon: "🌐", name: result.platform };
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      result.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{config.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{result.accountName}</p>
                        <p className="text-xs text-muted-foreground">{config.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="text-sm text-green-500">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-500" />
                          <span className="text-sm text-red-500" title={result.error}>
                            Failed
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProjectPostComposer;
