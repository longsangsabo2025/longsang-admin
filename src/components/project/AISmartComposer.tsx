/**
 * =================================================================
 * AI SMART COMPOSER - Compose with AI Platform Adapters
 * =================================================================
 * Write once, AI adapts for each platform automatically
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
import { AutoUploadTextarea, ImagePicker } from '@/components/media';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { ProjectSocialAccount } from '@/lib/projects';
import {
  adaptContentForPlatforms,
  PLATFORM_CONFIGS,
  PLATFORM_PROMPTS,
  AI_MODELS,
  type AdaptedContent,
  type SocialPlatform,
  type ContentLanguage,
  type AIModel,
} from '@/lib/social/content-adapters';
import {
  Bot,
  CheckCircle2,
  Copy,
  Image,
  Link as LinkIcon,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Wand2,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface AISmartComposerProps {
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

// Platform icons
const PLATFORM_ICONS: Record<string, string> = {
  facebook: 'f',
  instagram: 'IG',
  linkedin: 'in',
  twitter: 'X',
  threads: '@',
  tiktok: 'TT',
  youtube: 'YT',
  telegram: 'TG',
};

export function AISmartComposer({
  projectId,
  projectName: _projectName,
  onPostSuccess,
}: Readonly<AISmartComposerProps>) {
  const { toast } = useToast();

  // Accounts state
  const [accounts, setAccounts] = useState<ProjectSocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

  // Content state
  const [originalContent, setOriginalContent] = useState('');
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [language, setLanguage] = useState<ContentLanguage>('vi');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  // AI Settings state
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o-mini');
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [customPrompts, setCustomPrompts] = useState<Record<SocialPlatform, string>>(
    {} as Record<SocialPlatform, string>
  );
  const [editingPromptPlatform, setEditingPromptPlatform] = useState<SocialPlatform | null>(null);

  // AI Adaptation state
  const [isAdapting, setIsAdapting] = useState(false);
  const [adaptedContents, setAdaptedContents] = useState<AdaptedContent[]>([]);
  const [editedContents, setEditedContents] = useState<Record<string, string>>({});
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set());

  // Posting state
  const [isPosting, setIsPosting] = useState(false);
  const [postResults, setPostResults] = useState<PostResult[]>([]);

  // Load accounts
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await (supabase.from('project_social_accounts') as any)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true);

      if (error) throw error;

      const accountsList = (data || []) as ProjectSocialAccount[];
      setAccounts(accountsList);

      // Auto-select accounts with auto_post enabled
      const autoPostAccounts = accountsList.filter((a) => a.auto_post_enabled).map((a) => a.id);
      setSelectedAccounts(new Set(autoPostAccounts));
    } catch (error) {
      console.error('Failed to load accounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load social accounts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Get unique platforms from selected accounts
  const getSelectedPlatforms = (): SocialPlatform[] => {
    const platforms = new Set<SocialPlatform>();
    for (const account of accounts) {
      if (selectedAccounts.has(account.id)) {
        platforms.add(account.platform as SocialPlatform);
      }
    }
    return Array.from(platforms);
  };

  // Toggle account selection
  const toggleAccount = (accountId: string) => {
    const newSet = new Set(selectedAccounts);
    if (newSet.has(accountId)) {
      newSet.delete(accountId);
    } else {
      newSet.add(accountId);
    }
    setSelectedAccounts(newSet);
    // Clear adaptations when selection changes
    setAdaptedContents([]);
    setEditedContents({});
  };

  // AI Adapt content
  const handleAdaptContent = async () => {
    if (!originalContent.trim()) {
      toast({
        title: 'Add Content',
        description: 'Please write your original content first',
        variant: 'destructive',
      });
      return;
    }

    const platforms = getSelectedPlatforms();
    if (platforms.length === 0) {
      toast({
        title: 'Select Accounts',
        description: 'Please select at least one account',
        variant: 'destructive',
      });
      return;
    }

    setIsAdapting(true);
    setAdaptedContents([]);
    setEditedContents({});

    try {
      const results = await adaptContentForPlatforms({
        originalContent: originalContent.trim(),
        platforms,
        context: context || undefined,
        targetAudience: targetAudience || undefined,
        callToAction: callToAction || undefined,
        language,
        includeEmoji: true,
        customPrompts: Object.keys(customPrompts).length > 0 ? customPrompts : undefined,
        model: selectedModel,
      });

      setAdaptedContents(results);

      // Initialize edited contents with adapted contents
      const edited: Record<string, string> = {};
      for (const r of results) {
        edited[r.platform] = r.adaptedContent;
      }
      setEditedContents(edited);

      // Expand all platforms
      setExpandedPlatforms(new Set(platforms));

      toast({
        title: 'Content Adapted',
        description: `AI has optimized your content for ${results.length} platform(s)`,
      });
    } catch (error) {
      console.error('Adaptation failed:', error);
      toast({
        title: 'Adaptation Failed',
        description: 'Could not adapt content. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAdapting(false);
    }
  };

  // Update edited content for a platform
  const updateEditedContent = (platform: string, content: string) => {
    setEditedContents((prev) => ({
      ...prev,
      [platform]: content,
    }));
  };

  // Toggle platform expansion
  const togglePlatformExpand = (platform: string) => {
    const newSet = new Set(expandedPlatforms);
    if (newSet.has(platform)) {
      newSet.delete(platform);
    } else {
      newSet.add(platform);
    }
    setExpandedPlatforms(newSet);
  };

  // Copy content to clipboard
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Content copied to clipboard' });
  };

  // Helper: Post to a single account
  const postToAccount = async (account: ProjectSocialAccount): Promise<PostResult> => {
    const content = editedContents[account.platform] || originalContent;

    try {
      const response = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          credentialId: account.credential_id,
          platform: account.platform,
          content,
          imageUrl: imageUrl || undefined,
        }),
      });

      const result = await response.json();

      // Save successful posts to database
      if (result.success) {
        await (supabase.from('project_posts') as any).insert({
          project_id: projectId,
          social_account_id: account.id,
          platform: account.platform,
          content,
          media_urls: imageUrl ? [imageUrl] : null,
          external_post_id: result.postId,
          status: 'published',
          published_at: new Date().toISOString(),
        });
      }

      return {
        platform: account.platform,
        accountName: account.account_name,
        success: result.success,
        postId: result.postId,
        error: result.error,
      };
    } catch (error) {
      return {
        platform: account.platform,
        accountName: account.account_name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Post to all platforms
  const handlePostAll = async () => {
    if (adaptedContents.length === 0) {
      toast({
        title: 'Adapt First',
        description: 'Please adapt content before posting',
        variant: 'destructive',
      });
      return;
    }

    setIsPosting(true);
    setPostResults([]);

    const selectedAccountsList = accounts.filter((a) => selectedAccounts.has(a.id));
    const results: PostResult[] = [];

    for (const account of selectedAccountsList) {
      const result = await postToAccount(account);
      results.push(result);
    }

    setPostResults(results);
    setIsPosting(false);

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.length - successCount;

    if (successCount > 0) {
      toast({
        title: `Posted to ${successCount} account(s)`,
        description: failedCount === 0 ? 'All posts successful!' : `${failedCount} failed`,
      });
      onPostSuccess?.(results);
    } else {
      toast({
        title: 'All posts failed',
        description: 'Check the results for details',
        variant: 'destructive',
      });
    }
  };

  // Group accounts by platform
  const groupedAccounts = accounts.reduce(
    (acc, account) => {
      const platform = account.platform;
      if (!acc[platform]) {
        acc[platform] = [];
      }
      acc[platform].push(account);
      return acc;
    },
    {} as Record<string, ProjectSocialAccount[]>
  );

  if (loading) {
    return (
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
            <Wand2 className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI Smart Composer</h2>
            <p className="text-sm text-muted-foreground">Write once, AI adapts for each platform</p>
          </div>
        </div>
        <Badge variant="outline" className="gap-1 bg-purple-500/10 border-purple-500/30">
          <Bot className="w-3 h-3" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Account Selection */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Select Accounts</CardTitle>
            <CardDescription>
              {selectedAccounts.size} of {accounts.length} selected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedAccounts).map(([platform, platformAccounts]) => {
                  const config = PLATFORM_CONFIGS[platform as SocialPlatform];
                  const icon = PLATFORM_ICONS[platform] || platform[0].toUpperCase();

                  return (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold">
                          {icon}
                        </span>
                        <span>{config?.name || platform}</span>
                        <Badge variant="secondary" className="text-xs ml-auto">
                          {config?.charLimit || '?'} chars
                        </Badge>
                      </div>
                      {platformAccounts.map((account) => (
                        <label
                          key={account.id}
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                            selectedAccounts.has(account.id)
                              ? 'border-purple-500 bg-purple-500/10'
                              : 'border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <Checkbox
                            checked={selectedAccounts.has(account.id)}
                            onCheckedChange={() => toggleAccount(account.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{account.account_name}</p>
                            {account.account_username && (
                              <p className="text-xs text-muted-foreground">
                                @{account.account_username}
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Center: Original Content */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Write Original Content</CardTitle>
            <CardDescription>AI will adapt this for each platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <AutoUploadTextarea
                placeholder="Write your main content here. AI will optimize it for each selected platform... (Paste ảnh để auto-upload)"
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                rows={6}
                className="bg-slate-800/50 border-slate-600"
                onImageUpload={(url) => setImageUrl(url)}
                showStatus={true}
              />
              <p className="text-xs text-muted-foreground text-right">
                {originalContent.length} characters
              </p>
            </div>

            {/* Context fields */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Context (optional)</Label>
                <Input
                  placeholder="e.g., Product launch, Event promotion..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target Audience (optional)</Label>
                <Input
                  placeholder="e.g., Young professionals, Tech enthusiasts..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 h-8 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Call to Action</Label>
                  <Input
                    placeholder="e.g., Buy now, Learn more..."
                    value={callToAction}
                    onChange={(e) => setCallToAction(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Language</Label>
                  <Select value={language} onValueChange={(v) => setLanguage(v as ContentLanguage)}>
                    <SelectTrigger className="bg-slate-800/50 border-slate-600 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vi">Tieng Viet</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Media */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <Image className="w-3 h-3" /> Hình ảnh
                </Label>
                <ImagePicker
                  value={imageUrl}
                  onChange={(url) => setImageUrl(url || '')}
                  placeholder="Chọn từ Drive"
                  aspect="square"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Link URL
                </Label>
                <Input
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="bg-slate-800/50 border-slate-600 h-8 text-sm"
                />
              </div>
            </div>

            {/* AI Settings */}
            <div className="border-t border-slate-700 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Bot className="w-4 h-4" /> AI Settings
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPromptEditor(!showPromptEditor)}
                  className="text-xs"
                >
                  {showPromptEditor ? 'Hide' : 'Customize'} Prompts
                </Button>
              </div>

              {/* Model Selection */}
              <div className="space-y-1">
                <Label className="text-xs">AI Model</Label>
                <Select value={selectedModel} onValueChange={(v) => setSelectedModel(v as AIModel)}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-600 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <span className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <span className="text-xs text-muted-foreground">
                            - {model.description}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Prompts Editor */}
              {showPromptEditor && (
                <div className="space-y-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                  <p className="text-xs text-muted-foreground">
                    Customize AI prompts for each platform. Leave empty to use default.
                  </p>

                  {/* Platform prompt tabs */}
                  <div className="flex flex-wrap gap-1">
                    {getSelectedPlatforms().map((platform) => {
                      const config = PLATFORM_CONFIGS[platform];
                      const hasCustom = !!customPrompts[platform];
                      return (
                        <Button
                          key={platform}
                          variant={editingPromptPlatform === platform ? 'default' : 'ghost'}
                          size="sm"
                          className={`text-xs h-7 ${hasCustom ? 'border border-purple-500/50' : ''}`}
                          onClick={() =>
                            setEditingPromptPlatform(
                              editingPromptPlatform === platform ? null : platform
                            )
                          }
                        >
                          {config.icon} {config.name}
                          {hasCustom && <span className="ml-1 text-purple-400">*</span>}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Prompt editor for selected platform */}
                  {editingPromptPlatform && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">
                          {PLATFORM_CONFIGS[editingPromptPlatform].name} Prompt
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-6"
                          onClick={() => {
                            setCustomPrompts((prev) => {
                              const updated = { ...prev };
                              delete updated[editingPromptPlatform];
                              return updated;
                            });
                          }}
                        >
                          Reset to Default
                        </Button>
                      </div>
                      <Textarea
                        value={
                          customPrompts[editingPromptPlatform] ||
                          PLATFORM_PROMPTS[editingPromptPlatform]
                        }
                        onChange={(e) => {
                          setCustomPrompts((prev) => ({
                            ...prev,
                            [editingPromptPlatform]: e.target.value,
                          }));
                        }}
                        rows={6}
                        className="bg-slate-900/50 border-slate-600 text-xs font-mono"
                        placeholder="Enter custom prompt..."
                      />
                      <p className="text-xs text-muted-foreground">
                        Tip: The original content will be appended after your prompt.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t border-slate-700 pt-4">
            <Button
              onClick={handleAdaptContent}
              disabled={isAdapting || !originalContent.trim() || selectedAccounts.size === 0}
              className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {isAdapting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI is adapting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Adapt for {getSelectedPlatforms().length} Platform(s)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Right: Adapted Content Preview */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              3. Review & Post
              {adaptedContents.length > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {adaptedContents.length} adapted
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Edit if needed, then post to all platforms</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[350px] pr-4">
              {adaptedContents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wand2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Adapted content will appear here</p>
                  <p className="text-xs mt-1">Click &quot;Adapt&quot; to generate</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {adaptedContents.map((adapted) => {
                    const config = PLATFORM_CONFIGS[adapted.platform];
                    const icon = PLATFORM_ICONS[adapted.platform];
                    const isExpanded = expandedPlatforms.has(adapted.platform);
                    const currentContent =
                      editedContents[adapted.platform] || adapted.adaptedContent;
                    const isOverLimit = currentContent.length > config.charLimit;

                    return (
                      <div
                        key={adapted.platform}
                        className={`rounded-lg border ${
                          isOverLimit
                            ? 'border-red-500/50 bg-red-500/5'
                            : 'border-slate-700 bg-slate-800/30'
                        }`}
                      >
                        {/* Header */}
                        <button
                          type="button"
                          className="flex items-center gap-2 p-3 cursor-pointer w-full text-left"
                          onClick={() => togglePlatformExpand(adapted.platform)}
                        >
                          <span className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-xs font-bold">
                            {icon}
                          </span>
                          <span className="font-medium flex-1">{config.name}</span>
                          <span
                            className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-muted-foreground'}`}
                          >
                            {currentContent.length}/{config.charLimit}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>

                        {/* Content */}
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2">
                            <Textarea
                              value={currentContent}
                              onChange={(e) =>
                                updateEditedContent(adapted.platform, e.target.value)
                              }
                              rows={4}
                              className="bg-slate-900/50 border-slate-600 text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(currentContent)}
                              >
                                <Copy className="w-3 h-3 mr-1" />
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  updateEditedContent(adapted.platform, adapted.adaptedContent)
                                }
                              >
                                <RefreshCw className="w-3 h-3 mr-1" />
                                Reset
                              </Button>
                            </div>
                            {adapted.hashtags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {adapted.hashtags.slice(0, 5).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    #{tag}
                                  </Badge>
                                ))}
                                {adapted.hashtags.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{adapted.hashtags.length - 5} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="border-t border-slate-700 pt-4">
            <Button
              onClick={handlePostAll}
              disabled={isPosting || adaptedContents.length === 0}
              className="w-full gap-2"
            >
              {isPosting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Post to {selectedAccounts.size} Account(s)
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Results */}
      {postResults.length > 0 && (
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-base">Post Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {postResults.map((result, index) => {
                const icon = PLATFORM_ICONS[result.platform];
                return (
                  <div
                    key={`${result.platform}-${result.accountName}-${index}`}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      result.success
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <span className="w-8 h-8 rounded bg-slate-700 flex items-center justify-center text-sm font-bold">
                      {icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.accountName}</p>
                      <p className="text-xs text-muted-foreground">{result.platform}</p>
                    </div>
                    {result.success ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <span title={result.error}>
                        <XCircle className="w-5 h-5 text-red-500" />
                      </span>
                    )}
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

export default AISmartComposer;
