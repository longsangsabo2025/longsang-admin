import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { updateAgent } from '@/lib/automation/api';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';
import type { AIAgent } from '@/types/automation';

interface EditConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: AIAgent;
}

const AI_MODELS = [
  { value: 'gpt-4', label: 'GPT-4 (OpenAI)', provider: 'OpenAI' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (Faster)', provider: 'OpenAI' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Budget)', provider: 'OpenAI' },
  { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Latest)', provider: 'Anthropic' },
  { value: 'claude-opus-4', label: 'Claude Opus 4 (Most Capable)', provider: 'Anthropic' },
  { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

const TONE_OPTIONS = ['professional', 'casual', 'friendly', 'formal', 'humorous', 'technical'];

export const EditConfigModal = ({ open, onOpenChange, agent }: EditConfigModalProps) => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(agent.config);

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateAgent(agent.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agent.id] });
      toast.success('Configuration updated successfully! 🎉');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      config,
    });
  };

  const updateConfig = (key: string, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  const renderContentWriterConfig = () => (
    <>
      {/* AI Model */}
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select
          value={config.ai_model || 'claude-sonnet-4'}
          onValueChange={(value) => updateConfig('ai_model', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                <div className="flex flex-col">
                  <span>{model.label}</span>
                  <span className="text-xs text-muted-foreground">{model.provider}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tone */}
      <div className="space-y-2">
        <Label>Writing Tone</Label>
        <Select
          value={config.tone || 'professional'}
          onValueChange={(value) => updateConfig('tone', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TONE_OPTIONS.map((tone) => (
              <SelectItem key={tone} value={tone}>
                <span className="capitalize">{tone}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Max Length */}
      <div className="space-y-2">
        <Label>Max Content Length (words)</Label>
        <Input
          type="number"
          value={config.max_length || 2000}
          onChange={(e) => updateConfig('max_length', parseInt(e.target.value))}
          min="100"
          max="10000"
        />
      </div>

      {/* Custom Prompt */}
      <div className="space-y-2">
        <Label>Custom Instructions (Optional)</Label>
        <Textarea
          placeholder="e.g., Always include billiard tips, target Vietnamese audience..."
          value={config.custom_prompt || ''}
          onChange={(e) => updateConfig('custom_prompt', e.target.value)}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Add specific instructions to customize the AI's behavior
        </p>
      </div>

      {/* Generate SEO */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Generate SEO Metadata</Label>
          <p className="text-xs text-muted-foreground">
            Auto-generate meta titles and descriptions
          </p>
        </div>
        <Switch
          checked={config.generate_seo ?? true}
          onCheckedChange={(checked) => updateConfig('generate_seo', checked)}
        />
      </div>

      {/* Require Approval */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Require Approval</Label>
          <p className="text-xs text-muted-foreground">Review content before publishing</p>
        </div>
        <Switch
          checked={config.require_approval ?? true}
          onCheckedChange={(checked) => updateConfig('require_approval', checked)}
        />
      </div>

      {/* Auto Publish */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Auto Publish</Label>
          <p className="text-xs text-muted-foreground">Automatically publish approved content</p>
        </div>
        <Switch
          checked={config.auto_publish ?? false}
          onCheckedChange={(checked) => updateConfig('auto_publish', checked)}
        />
      </div>
    </>
  );

  const renderLeadNurtureConfig = () => (
    <>
      {/* AI Model */}
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select
          value={config.ai_model || 'gpt-4'}
          onValueChange={(value) => updateConfig('ai_model', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Follow-up Delay */}
      <div className="space-y-2">
        <Label>Follow-up Delay (hours)</Label>
        <Input
          type="number"
          value={config.follow_up_delay_hours || 24}
          onChange={(e) => updateConfig('follow_up_delay_hours', parseInt(e.target.value))}
          min="1"
          max="168"
        />
        <p className="text-xs text-muted-foreground">Time between follow-up emails</p>
      </div>

      {/* Max Follow-ups */}
      <div className="space-y-2">
        <Label>Max Follow-ups</Label>
        <Input
          type="number"
          value={config.max_follow_ups || 3}
          onChange={(e) => updateConfig('max_follow_ups', parseInt(e.target.value))}
          min="1"
          max="10"
        />
      </div>

      {/* Personalization Level */}
      <div className="space-y-2">
        <Label>Personalization Level</Label>
        <Select
          value={config.personalization_level || 'high'}
          onValueChange={(value) => updateConfig('personalization_level', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low - Generic emails</SelectItem>
            <SelectItem value="medium">Medium - Some personalization</SelectItem>
            <SelectItem value="high">High - Highly personalized</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );

  const renderSocialMediaConfig = () => (
    <>
      {/* AI Model */}
      <div className="space-y-2">
        <Label>AI Model</Label>
        <Select
          value={config.ai_model || 'gpt-4'}
          onValueChange={(value) => updateConfig('ai_model', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AI_MODELS.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Post Variants */}
      <div className="space-y-2">
        <Label>Post Variants</Label>
        <Input
          type="number"
          value={config.post_variants || 3}
          onChange={(e) => updateConfig('post_variants', parseInt(e.target.value))}
          min="1"
          max="10"
        />
        <p className="text-xs text-muted-foreground">Number of variations to generate</p>
      </div>

      {/* Include Hashtags */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Include Hashtags</Label>
          <p className="text-xs text-muted-foreground">Auto-generate relevant hashtags</p>
        </div>
        <Switch
          checked={config.include_hashtags ?? true}
          onCheckedChange={(checked) => updateConfig('include_hashtags', checked)}
        />
      </div>

      {/* Auto Schedule */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Auto Schedule</Label>
          <p className="text-xs text-muted-foreground">Automatically schedule posts</p>
        </div>
        <Switch
          checked={config.auto_schedule ?? false}
          onCheckedChange={(checked) => updateConfig('auto_schedule', checked)}
        />
      </div>
    </>
  );

  const renderConfigFields = () => {
    switch (agent.type) {
      case 'content_writer':
        return renderContentWriterConfig();
      case 'lead_nurture':
        return renderLeadNurtureConfig();
      case 'social_media':
        return renderSocialMediaConfig();
      default:
        return (
          <div className="space-y-2">
            <Label>Custom Configuration (JSON)</Label>
            <Textarea
              value={JSON.stringify(config, null, 2)}
              onChange={(e) => {
                try {
                  setConfig(JSON.parse(e.target.value));
                } catch (e) {
                  // Invalid JSON, ignore
                }
              }}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Edit Configuration
          </DialogTitle>
          <DialogDescription>
            Customize your agent's behavior, AI model, and automation settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">{renderConfigFields()}</div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
