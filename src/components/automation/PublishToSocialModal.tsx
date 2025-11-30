/**
 * =================================================================
 * PUBLISH TO SOCIAL MEDIA MODAL
 * =================================================================
 * Modal to publish content from Content Queue to Social Media platforms
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getSocialMediaManager } from "@/lib/social";
import { supabase } from "@/lib/supabase";
import type { ContentQueue } from "@/types/automation";
import type { SocialPlatform, SocialPostRequest } from "@/types/social-media";
import { AlertCircle, Loader2, Share2 } from "lucide-react";
import { useState } from "react";

interface PublishToSocialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: ContentQueue | null;
  onPublished?: () => void;
}

const platformInfo: Record<SocialPlatform, { name: string; icon: string; limit: number }> = {
  linkedin: { name: "LinkedIn", icon: "💼", limit: 3000 },
  twitter: { name: "Twitter/X", icon: "𝕏", limit: 280 },
  facebook: { name: "Facebook", icon: "👥", limit: 63206 },
  instagram: { name: "Instagram", icon: "📸", limit: 2200 },
  youtube: { name: "YouTube", icon: "▶️", limit: 5000 },
  telegram: { name: "Telegram", icon: "✈️", limit: 4096 },
  discord: { name: "Discord", icon: "🎮", limit: 2000 },
};

export function PublishToSocialModal({
  open,
  onOpenChange,
  content,
  onPublished,
}: PublishToSocialModalProps) {
  const { toast } = useToast();
  const manager = getSocialMediaManager();

  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>([]);
  const [postText, setPostText] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  // Initialize post text from content when modal opens
  if (content && open && !postText) {
    // Extract first 280 chars from content as social snippet
    const snippet = content.content?.body
      ? content.content.body.replace(/[#*\n]+/g, " ").substring(0, 280)
      : content.title || "";
    setPostText(snippet);

    // Extract hashtags from content metadata if available
    const tags = content.metadata?.tags || content.content?.seo?.tags || [];
    if (tags.length > 0) {
      setHashtags(tags.map((t: string) => `#${t}`).join(" "));
    }
  }

  const togglePlatform = (platform: SocialPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const selectAll = () => {
    setSelectedPlatforms(Object.keys(platformInfo) as SocialPlatform[]);
  };

  const clearAll = () => {
    setSelectedPlatforms([]);
  };

  // Get minimum character limit across selected platforms
  const minCharLimit =
    selectedPlatforms.length > 0
      ? Math.min(...selectedPlatforms.map((p) => platformInfo[p].limit))
      : 0;

  const isOverLimit = postText.length > minCharLimit && minCharLimit > 0;

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast({
        title: "⚠️ No Platforms Selected",
        description: "Please select at least one platform",
        variant: "destructive",
      });
      return;
    }

    if (!postText.trim()) {
      toast({
        title: "⚠️ No Content",
        description: "Please enter some text to post",
        variant: "destructive",
      });
      return;
    }

    if (isOverLimit) {
      toast({
        title: "⚠️ Content Too Long",
        description: `Your post exceeds the ${minCharLimit} character limit`,
        variant: "destructive",
      });
      return;
    }

    setPublishing(true);
    setResults([]);

    try {
      // Parse hashtags
      const hashtagList = hashtags
        .split(/[\s,]+/)
        .filter((tag) => tag.startsWith("#"))
        .map((tag) => tag.substring(1));

      // Prepare post request
      const postRequest: SocialPostRequest = {
        platforms: selectedPlatforms,
        contentType: "text",
        text: postText,
        hashtags: hashtagList,
        linkUrl: linkUrl || undefined,
        media: imageUrl ? [{ type: "image", url: imageUrl }] : undefined,
      };

      // Post to social media
      const response = await manager.postToMultiplePlatforms(postRequest);
      setResults(response.results);

      // Update content_queue with social media metadata
      if (content) {
        const socialMetadata = {
          ...content.metadata,
          social_posts: {
            posted_at: new Date().toISOString(),
            platforms: selectedPlatforms,
            results: response.results,
            summary: response.summary,
          },
        };

        await supabase
          .from("content_queue")
          .update({
            metadata: socialMetadata as any,
            status: "published",
          } as any)
          .eq("id", content.id);
      }

      // Show results
      toast({
        title: "🎉 Publishing Complete!",
        description: `Posted to ${response.summary.successful}/${response.summary.total} platforms`,
      });

      if (onPublished) {
        onPublished();
      }
    } catch (error) {
      console.error("Failed to publish:", error);
      toast({
        title: "❌ Publishing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Publish to Social Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Original Content</CardTitle>
              <CardDescription>{content.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {content.content?.body?.substring(0, 200)}...
              </p>
            </CardContent>
          </Card>

          {/* Platform Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Platforms</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(platformInfo) as SocialPlatform[]).map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={platform}
                    checked={selectedPlatforms.includes(platform)}
                    onCheckedChange={() => togglePlatform(platform)}
                  />
                  <Label
                    htmlFor={platform}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <span className="text-lg">{platformInfo[platform].icon}</span>
                    {platformInfo[platform].name}
                    <Badge variant="secondary" className="text-xs">
                      {platformInfo[platform].limit}
                    </Badge>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Post Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-text">Post Text</Label>
              <span
                className={`text-sm ${
                  isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground"
                }`}
              >
                {postText.length}
                {minCharLimit > 0 && ` / ${minCharLimit}`} characters
              </span>
            </div>
            <Textarea
              id="post-text"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What do you want to share?"
              className="min-h-32"
            />
            {isOverLimit && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                Content exceeds character limit for selected platforms
              </div>
            )}
          </div>

          {/* Hashtags */}
          <div className="space-y-2">
            <Label htmlFor="hashtags">Hashtags (optional)</Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#marketing #automation #ai"
            />
            <p className="text-xs text-muted-foreground">Separate hashtags with spaces or commas</p>
          </div>

          {/* Link URL */}
          <div className="space-y-2">
            <Label htmlFor="link-url">Link URL (optional)</Label>
            <Input
              id="link-url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL (optional)</Label>
            <Input
              id="image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            {imageUrl && (
              <div className="mt-2">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="max-w-xs rounded-lg border"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label className="text-base font-semibold">Publishing Results</Label>
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.platform}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">
                        {platformInfo[result.platform as SocialPlatform].icon}
                      </span>
                      <div>
                        <p className="font-medium capitalize">{result.platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.success ? "Published successfully" : result.error?.message}
                        </p>
                      </div>
                    </div>
                    {result.success ? (
                      <Badge variant="default">✓ Success</Badge>
                    ) : (
                      <Badge variant="destructive">✗ Failed</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing || selectedPlatforms.length === 0 || isOverLimit}
              className="flex-1"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Publish to {selectedPlatforms.length} Platform
                  {selectedPlatforms.length === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
