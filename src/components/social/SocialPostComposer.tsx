/**
 * =================================================================
 * SOCIAL POST COMPOSER - UI Component for Creating Posts
 * =================================================================
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getSocialMediaManager } from '@/lib/social';
import type { BulkPostResponse, SocialPlatform } from '@/types/social-media';
import { CheckCircle2, Image, Link, Loader2, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface SocialPostComposerProps {
  availablePlatforms?: SocialPlatform[];
  onPostSuccess?: (result: BulkPostResponse) => void;
  onPostError?: (error: Error) => void;
}

const PLATFORM_INFO: Record<SocialPlatform, { name: string; icon: string; limit: number }> = {
  linkedin: { name: 'LinkedIn', icon: '💼', limit: 3000 },
  twitter: { name: 'Twitter/X', icon: '𝕏', limit: 280 },
  facebook: { name: 'Facebook', icon: '👥', limit: 63206 },
  instagram: { name: 'Instagram', icon: '📸', limit: 2200 },
  youtube: { name: 'YouTube', icon: '▶️', limit: 5000 },
  telegram: { name: 'Telegram', icon: '✈️', limit: 4096 },
  discord: { name: 'Discord', icon: '🎮', limit: 2000 },
};

export const SocialPostComposer = ({
  availablePlatforms,
  onPostSuccess,
  onPostError,
}: SocialPostComposerProps) => {
  const { toast } = useToast();
  const manager = getSocialMediaManager();

  const [text, setText] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<SocialPlatform>>(new Set());
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<BulkPostResponse | null>(null);

  // Get registered platforms
  const registeredPlatforms = availablePlatforms || manager.getRegisteredPlatforms();

  const togglePlatform = (platform: SocialPlatform) => {
    const newSet = new Set(selectedPlatforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setSelectedPlatforms(newSet);
  };

  const selectAll = () => {
    setSelectedPlatforms(new Set(registeredPlatforms));
  };

  const deselectAll = () => {
    setSelectedPlatforms(new Set());
  };

  const getMinCharacterLimit = () => {
    if (selectedPlatforms.size === 0) return 0;

    return Math.min(...Array.from(selectedPlatforms).map((p) => PLATFORM_INFO[p].limit));
  };

  const handlePost = async () => {
    if (selectedPlatforms.size === 0) {
      toast({
        title: 'Select Platforms',
        description: 'Please select at least one platform',
        variant: 'destructive',
      });
      return;
    }

    if (!text.trim()) {
      toast({
        title: 'Add Content',
        description: 'Please enter some text',
        variant: 'destructive',
      });
      return;
    }

    setPosting(true);
    setResult(null);

    try {
      const hashtagArray = hashtags
        .split(/[,\s]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
        .map((tag) => tag.replace(/^#/, ''));

      const media = imageUrl
        ? [
            {
              type: 'image' as const,
              url: imageUrl,
            },
          ]
        : undefined;

      const postResult = await manager.postToMultiplePlatforms({
        platforms: Array.from(selectedPlatforms),
        text: text.trim(),
        contentType: media ? 'image' : 'text',
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
        linkUrl: linkUrl || undefined,
        media,
      });

      setResult(postResult);

      if (postResult.summary.successful > 0) {
        toast({
          title: `✅ Posted Successfully!`,
          description: `${postResult.summary.successful}/${postResult.summary.total} platforms`,
        });

        onPostSuccess?.(postResult);

        // Clear form on success
        if (postResult.summary.successful === postResult.summary.total) {
          setText('');
          setHashtags('');
          setLinkUrl('');
          setImageUrl('');
          setSelectedPlatforms(new Set());
        }
      }

      if (postResult.summary.failed > 0) {
        toast({
          title: '⚠️ Some Posts Failed',
          description: `${postResult.summary.failed}/${postResult.summary.total} platforms failed`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Posting Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });

      onPostError?.(error as Error);
    } finally {
      setPosting(false);
    }
  };

  const minLimit = getMinCharacterLimit();
  const isOverLimit = minLimit > 0 && text.length > minLimit;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Create Social Post
        </CardTitle>
        <CardDescription>Compose and publish to multiple platforms simultaneously</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Platform Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Select Platforms</Label>
            <div className="space-x-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {registeredPlatforms.map((platform) => {
              const info = PLATFORM_INFO[platform];
              const isSelected = selectedPlatforms.has(platform);

              return (
                <div
                  key={platform}
                  onClick={() => togglePlatform(platform)}
                  className={`
                    flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-muted hover:border-primary/50'
                    }
                  `}
                >
                  <Checkbox checked={isSelected} />
                  <span className="text-xl">{info.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{info.name}</p>
                    <p className="text-xs text-muted-foreground">{info.limit} chars</p>
                  </div>
                </div>
              );
            })}
          </div>

          {registeredPlatforms.length === 0 && (
            <div className="text-center p-6 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">
                No platforms connected. Please connect at least one platform first.
              </p>
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="post-text">Post Content</Label>
            <span
              className={`text-sm ${isOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {text.length}
              {minLimit > 0 && ` / ${minLimit}`}
            </span>
          </div>
          <Textarea
            id="post-text"
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[150px] resize-none"
            disabled={posting}
          />
          {isOverLimit && (
            <p className="text-sm text-destructive">
              Text exceeds the {minLimit} character limit for selected platforms
            </p>
          )}
        </div>

        {/* Hashtags */}
        <div className="space-y-2">
          <Label htmlFor="hashtags" className="flex items-center gap-2">
            # Hashtags
            <span className="text-xs text-muted-foreground">(comma or space separated)</span>
          </Label>
          <Input
            id="hashtags"
            placeholder="ai, automation, productivity"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            disabled={posting}
          />
        </div>

        {/* Link URL */}
        <div className="space-y-2">
          <Label htmlFor="link-url" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Link URL
          </Label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            disabled={posting}
          />
        </div>

        {/* Image URL */}
        <div className="space-y-2">
          <Label htmlFor="image-url" className="flex items-center gap-2">
            <Image className="w-4 h-4" />
            Image URL
          </Label>
          <Input
            id="image-url"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            disabled={posting}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full max-w-md rounded-lg border"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Post Results */}
        {result && (
          <div className="space-y-2 p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-3">Post Results</h4>
            <div className="space-y-2">
              {result.results.map((res) => (
                <div key={res.platform} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORM_INFO[res.platform].icon}</span>
                    <span className="font-medium">{PLATFORM_INFO[res.platform].name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {res.success ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        {res.postUrl && (
                          <a
                            href={res.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            View Post
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-destructive" />
                        <Badge variant="destructive">{res.error?.message}</Badge>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span>Total: {result.summary.total}</span>
                <span className="text-green-500">Success: {result.summary.successful}</span>
                <span className="text-destructive">Failed: {result.summary.failed}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handlePost}
          disabled={posting || selectedPlatforms.size === 0 || !text.trim() || isOverLimit}
          className="w-full"
          size="lg"
        >
          {posting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Posting to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''}
              ...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Post to {selectedPlatforms.size > 0 ? selectedPlatforms.size : ''} Platform
              {selectedPlatforms.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
