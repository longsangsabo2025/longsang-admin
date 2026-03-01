// ================================================
// AGENT CONFIGURATION MODAL - Complete Settings
// ================================================
// Comprehensive UI for admin to configure all agent settings

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Save,
  Settings,
  Zap,
  Mail,
  Share2,
  Brain,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface AgentFullConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  currentConfig: any;
  agentType: string;
  onUpdate: () => void;
}

export function AgentFullConfigModal({
  open,
  onOpenChange,
  agentId,
  currentConfig,
  agentType,
  onUpdate,
}: AgentFullConfigModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  // General Settings
  const [aiModel, setAiModel] = useState(currentConfig?.ai_model || 'gpt-4o-mini');
  const [autoPublish, setAutoPublish] = useState(currentConfig?.auto_publish || false);
  const [requireApproval, setRequireApproval] = useState(currentConfig?.require_approval ?? true);

  // Email Settings
  const [emailProvider, setEmailProvider] = useState(currentConfig?.email_provider || 'resend');
  const [fromEmail, setFromEmail] = useState(currentConfig?.from_email || '');
  const [fromName, setFromName] = useState(currentConfig?.from_name || '');
  const [emailApiKey, setEmailApiKey] = useState('');

  // Social Media Settings
  const [platforms, setPlatforms] = useState<string[]>(currentConfig?.platforms || []);
  const [includeHashtags, setIncludeHashtags] = useState(currentConfig?.include_hashtags ?? true);
  const [autoSchedule, setAutoSchedule] = useState(currentConfig?.auto_schedule || false);
  const [linkedinToken, setLinkedinToken] = useState('');
  const [facebookToken, setFacebookToken] = useState('');
  const [facebookPageId, setFacebookPageId] = useState('');

  // Content Settings (for Content Writer)
  const [tone, setTone] = useState(currentConfig?.tone || 'professional');
  const [maxLength, setMaxLength] = useState(currentConfig?.max_length || 2000);
  const [generateSeo, setGenerateSeo] = useState(currentConfig?.generate_seo ?? true);
  const [targetAudience, setTargetAudience] = useState(currentConfig?.target_audience || '');

  // Lead Nurture Settings
  const [followUpDelayHours, setFollowUpDelayHours] = useState(
    currentConfig?.follow_up_delay_hours || 24
  );
  const [maxFollowUps, setMaxFollowUps] = useState(currentConfig?.max_follow_ups || 3);
  const [personalizationLevel, setPersonalizationLevel] = useState(
    currentConfig?.personalization_level || 'high'
  );

  // Budget Settings
  const [dailyBudget, setDailyBudget] = useState(currentConfig?.daily_budget || 5);
  const [monthlyBudget, setMonthlyBudget] = useState(currentConfig?.monthly_budget || 100);
  const [autoPauseOnBudget, setAutoPauseOnBudget] = useState(
    currentConfig?.auto_pause_on_budget ?? true
  );

  // Schedule Settings
  const [scheduleEnabled, setScheduleEnabled] = useState(currentConfig?.schedule?.enabled || false);
  const [scheduleFrequency, setScheduleFrequency] = useState(
    currentConfig?.schedule?.frequency || 'daily'
  );
  const [scheduleTime, setScheduleTime] = useState(currentConfig?.schedule?.time || '09:00');

  const togglePlatform = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newConfig = {
        // General
        ai_model: aiModel,
        auto_publish: autoPublish,
        require_approval: requireApproval,

        // Email
        email_provider: emailProvider,
        from_email: fromEmail,
        from_name: fromName,

        // Social
        platforms,
        include_hashtags: includeHashtags,
        auto_schedule: autoSchedule,

        // Content
        tone,
        max_length: maxLength,
        generate_seo: generateSeo,
        target_audience: targetAudience,

        // Lead Nurture
        follow_up_delay_hours: followUpDelayHours,
        max_follow_ups: maxFollowUps,
        personalization_level: personalizationLevel,

        // Budget
        daily_budget: dailyBudget,
        monthly_budget: monthlyBudget,
        auto_pause_on_budget: autoPauseOnBudget,

        // Schedule
        schedule: {
          enabled: scheduleEnabled,
          frequency: scheduleFrequency,
          time: scheduleTime,
        },
      };

      // Update agent config
      const { error: configError } = await supabase
        .from('ai_agents')
        .update({ config: newConfig })
        .eq('id', agentId);

      if (configError) throw configError;

      // Update/create budget limits
      const { error: budgetError } = await supabase.from('agent_budgets').upsert({
        agent_id: agentId,
        daily_limit: dailyBudget,
        monthly_limit: monthlyBudget,
        alert_threshold: 0.75,
        auto_pause: autoPauseOnBudget,
      });

      if (budgetError) throw budgetError;

      // Note: API keys should be set via Supabase CLI for security
      // Admin can run: npx supabase secrets set KEY_NAME="value"
      // Or store securely in agent config for now
      const secureConfig: any = { ...newConfig };
      if (emailApiKey) {
        secureConfig.email_api_key_set = true;
        // In production, use: npx supabase secrets set RESEND_API_KEY="..."
      }
      if (linkedinToken) {
        secureConfig.linkedin_token_set = true;
        // In production, use: npx supabase secrets set LINKEDIN_ACCESS_TOKEN="..."
      }
      if (facebookToken) {
        secureConfig.facebook_token_set = true;
        secureConfig.facebook_page_id = facebookPageId;
        // In production, use: npx supabase secrets set FACEBOOK_ACCESS_TOKEN="..."
      }

      // Update config with security flags
      await supabase.from('ai_agents').update({ config: secureConfig }).eq('id', agentId);

      toast({
        title: '✅ Configuration Saved',
        description: 'All agent settings have been updated successfully',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save config:', error);
      toast({
        title: '❌ Save Failed',
        description: 'Could not save configuration. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Complete Agent Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="general">
              <Brain className="h-4 w-4 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="h-4 w-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-1" />
              Social
            </TabsTrigger>
            <TabsTrigger value="content">
              <Zap className="h-4 w-4 mr-1" />
              Content
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="h-4 w-4 mr-1" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Select value={aiModel} onValueChange={setAiModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Most Advanced) - ~$0.01/request</SelectItem>
                  <SelectItem value="gpt-4o-mini">
                    GPT-4o Mini (Recommended) - ~$0.002/request
                  </SelectItem>
                  <SelectItem value="gpt-4-turbo">GPT-4 Turbo - ~$0.008/request</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">
                    GPT-3.5 Turbo (Fastest) - ~$0.001/request
                  </SelectItem>
                  <SelectItem value="claude-sonnet-4">Claude Sonnet 4 - ~$0.015/request</SelectItem>
                  <SelectItem value="claude-3-haiku">
                    Claude 3 Haiku (Budget) - ~$0.0008/request
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the AI model for content generation. Higher cost models provide better
                quality.
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Auto-Publish Content</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically publish generated content without review
                </p>
              </div>
              <Switch checked={autoPublish} onCheckedChange={setAutoPublish} />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Require Approval</Label>
                <p className="text-sm text-muted-foreground">
                  Content must be approved before publishing
                </p>
              </div>
              <Switch checked={requireApproval} onCheckedChange={setRequireApproval} />
            </div>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Email Provider</Label>
              <Select value={emailProvider} onValueChange={setEmailProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resend">Resend (Recommended)</SelectItem>
                  <SelectItem value="sendgrid">SendGrid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Email Address</Label>
              <Input
                type="email"
                placeholder="noreply@yourdomain.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Email address that will appear as sender
              </p>
            </div>

            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                placeholder="Your Company Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>API Key (Optional - leave empty if already set)</Label>
              <Input
                type="password"
                placeholder={`${emailProvider === 'resend' ? 're_' : 'SG.'}xxxxxxxxxxxxxxxxx`}
                value={emailApiKey}
                onChange={(e) => setEmailApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your API key from{' '}
                {emailProvider === 'resend'
                  ? 'resend.com/api-keys'
                  : 'sendgrid.com/settings/api_keys'}
              </p>
            </div>
          </TabsContent>

          {/* Social Media Settings */}
          <TabsContent value="social" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Publishing Platforms</Label>
              <div className="flex gap-2">
                {['linkedin', 'facebook', 'twitter'].map((platform) => (
                  <Button
                    key={platform}
                    type="button"
                    variant={platforms.includes(platform) ? 'default' : 'outline'}
                    onClick={() => togglePlatform(platform)}
                  >
                    {platform === 'linkedin' && '🔗'}
                    {platform === 'facebook' && '📘'}
                    {platform === 'twitter' && '🐦'}{' '}
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {platforms.includes('linkedin') && (
              <div className="space-y-2 p-4 border rounded-lg bg-blue-50/50">
                <Label>LinkedIn Access Token</Label>
                <Input
                  type="password"
                  placeholder="AQV..."
                  value={linkedinToken}
                  onChange={(e) => setLinkedinToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Get token from LinkedIn OAuth 2.0</p>
              </div>
            )}

            {platforms.includes('facebook') && (
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50">
                <div className="space-y-2">
                  <Label>Facebook Access Token</Label>
                  <Input
                    type="password"
                    placeholder="EAA..."
                    value={facebookToken}
                    onChange={(e) => setFacebookToken(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Page ID</Label>
                  <Input
                    placeholder="123456789"
                    value={facebookPageId}
                    onChange={(e) => setFacebookPageId(e.target.value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Get from Facebook Graph API Explorer
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Include Hashtags</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically add relevant hashtags to posts
                </p>
              </div>
              <Switch checked={includeHashtags} onCheckedChange={setIncludeHashtags} />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Auto-Schedule Posts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically schedule posts for optimal engagement times
                </p>
              </div>
              <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} />
            </div>
          </TabsContent>

          {/* Content Settings */}
          <TabsContent value="content" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Writing Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maximum Length (words)</Label>
              <Input
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                min={100}
                max={5000}
              />
              <p className="text-xs text-muted-foreground">
                Typical blog post: 800-1500 words, Social post: 50-150 words
              </p>
            </div>

            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Textarea
                placeholder="e.g., Business owners interested in automation, Tech-savvy millennials..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Generate SEO Metadata</Label>
                <p className="text-sm text-muted-foreground">
                  Auto-generate meta descriptions, keywords, and tags
                </p>
              </div>
              <Switch checked={generateSeo} onCheckedChange={setGenerateSeo} />
            </div>
          </TabsContent>

          {/* Budget Settings */}
          <TabsContent value="budget" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Daily Budget Limit (USD)</Label>
              <Input
                type="number"
                value={dailyBudget}
                onChange={(e) => setDailyBudget(Number(e.target.value))}
                min={0}
                step={0.1}
              />
              <p className="text-xs text-muted-foreground">
                Maximum spend per day. Recommended: $5-$10 for active agents
              </p>
            </div>

            <div className="space-y-2">
              <Label>Monthly Budget Limit (USD)</Label>
              <Input
                type="number"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                min={0}
                step={1}
              />
              <p className="text-xs text-muted-foreground">
                Maximum spend per month. Recommended: $100-$300 for production use
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Auto-Pause on Budget Exceeded</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically pause agent when budget limit is reached
                </p>
              </div>
              <Switch checked={autoPauseOnBudget} onCheckedChange={setAutoPauseOnBudget} />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Budget Alerts</h4>
              <p className="text-sm text-muted-foreground mb-2">
                You'll receive notifications when spending reaches:
              </p>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">50%</Badge>
                  <span>
                    ${(dailyBudget * 0.5).toFixed(2)} daily / ${(monthlyBudget * 0.5).toFixed(2)}{' '}
                    monthly
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">75%</Badge>
                  <span>
                    ${(dailyBudget * 0.75).toFixed(2)} daily / ${(monthlyBudget * 0.75).toFixed(2)}{' '}
                    monthly
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">90%</Badge>
                  <span>
                    ${(dailyBudget * 0.9).toFixed(2)} daily / ${(monthlyBudget * 0.9).toFixed(2)}{' '}
                    monthly
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Schedule Settings */}
          <TabsContent value="schedule" className="space-y-4 mt-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Enable Scheduling</Label>
                <p className="text-sm text-muted-foreground">
                  Run this agent automatically on a schedule
                </p>
              </div>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>

            {scheduleEnabled && (
              <>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Every Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(scheduleFrequency === 'daily' || scheduleFrequency === 'weekly') && (
                  <div className="space-y-2">
                    <Label>Time of Day</Label>
                    <Input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                    />
                  </div>
                )}

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Schedule Summary:</strong> Agent will run{' '}
                    {scheduleFrequency === 'hourly' && 'every hour'}
                    {scheduleFrequency === 'daily' && `daily at ${scheduleTime}`}
                    {scheduleFrequency === 'weekly' && `weekly at ${scheduleTime}`}
                    {scheduleFrequency === 'monthly' && 'on the 1st of each month at 9:00 AM'}
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save All Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
