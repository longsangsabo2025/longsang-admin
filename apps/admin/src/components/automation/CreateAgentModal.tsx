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
import { createAgent } from '@/lib/automation/api';
import { toast } from 'sonner';
import { Loader2, Sparkles } from 'lucide-react';

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const agentTypes = [
  { value: 'content_writer', label: 'Content Writer', icon: '✍️' },
  { value: 'lead_nurture', label: 'Lead Nurture', icon: '💌' },
  { value: 'social_media', label: 'Social Media', icon: '📱' },
  { value: 'analytics', label: 'Analytics', icon: '📊' },
  { value: 'custom', label: 'Custom Agent', icon: '🤖' },
];

export const CreateAgentModal = ({ open, onOpenChange }: CreateAgentModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    category: 'website',
    status: 'paused' as 'active' | 'paused',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const createMutation = useMutation({
    mutationFn: createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Agent created successfully! 🎉');
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      category: 'website',
      status: 'paused',
    });
  };

  const generateDescription = async () => {
    if (!formData.type || !formData.name) {
      toast.error('Please select agent type and enter name first');
      return;
    }

    setIsGenerating(true);

    try {
      // Find agent type details
      const agentType = agentTypes.find((t) => t.value === formData.type);

      // Simple AI-powered description generation
      const descriptions: Record<string, string> = {
        content_writer: `An intelligent content creation agent that generates high-quality blog posts, articles, and marketing content. "${formData.name}" uses advanced AI to craft engaging, SEO-optimized content that resonates with your target audience while maintaining your brand voice and style guidelines.`,
        lead_nurture: `An automated lead nurturing agent that builds relationships with prospects through personalized email sequences. "${formData.name}" intelligently engages leads at the right time with relevant content, moving them through your sales funnel while tracking engagement and conversion metrics.`,
        social_media: `A social media automation agent that creates, schedules, and publishes engaging content across multiple platforms. "${formData.name}" generates platform-optimized posts, analyzes performance, and maintains consistent brand presence to grow your social media following.`,
        analytics: `A data analysis agent that monitors key metrics and generates actionable insights. "${formData.name}" tracks performance indicators, identifies trends, and creates comprehensive reports to help you make data-driven decisions for your business growth.`,
        custom: `A versatile AI agent tailored to your specific automation needs. "${formData.name}" can be configured to handle various tasks, from data processing to customer interactions, providing flexible automation that adapts to your unique business requirements.`,
      };

      const description =
        descriptions[formData.type] ||
        `An AI-powered automation agent named "${formData.name}" designed to streamline your ${agentType?.label || 'business'} processes with intelligent automation.`;

      setFormData({ ...formData, description });
      toast.success('Description generated! ✨');
    } catch (error) {
      toast.error('Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Default configs based on agent type
    const defaultConfigs: Record<string, any> = {
      content_writer: {
        ai_model: 'claude-sonnet-4',
        auto_publish: false,
        require_approval: true,
        tone: 'professional',
        max_length: 2000,
        generate_seo: true,
      },
      lead_nurture: {
        ai_model: 'gpt-4',
        follow_up_delay_hours: 24,
        max_follow_ups: 3,
        email_provider: 'sendgrid',
        personalization_level: 'high',
      },
      social_media: {
        ai_model: 'gpt-4',
        platforms: ['linkedin', 'twitter', 'facebook'],
        post_variants: 3,
        include_hashtags: true,
        auto_schedule: false,
      },
      analytics: {
        ai_model: 'gpt-4',
        report_frequency: 'weekly',
        metrics_to_track: ['page_views', 'conversions', 'bounce_rate'],
      },
      custom: {
        ai_model: 'gpt-4',
      },
    };

    createMutation.mutate({
      name: formData.name,
      type: formData.type as any,
      description: formData.description,
      category: formData.category,
      status: formData.status,
      config: defaultConfigs[formData.type] || {},
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Set up a new AI automation agent. You can configure advanced settings after creation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">
                  <span className="flex items-center gap-2">
                    <span>🌐</span>
                    <span>Website Automation</span>
                  </span>
                </SelectItem>
                <SelectItem value="ecommerce">
                  <span className="flex items-center gap-2">
                    <span>🛒</span>
                    <span>E-commerce</span>
                  </span>
                </SelectItem>
                <SelectItem value="crm">
                  <span className="flex items-center gap-2">
                    <span>👥</span>
                    <span>CRM & Sales</span>
                  </span>
                </SelectItem>
                <SelectItem value="marketing">
                  <span className="flex items-center gap-2">
                    <span>📢</span>
                    <span>Marketing</span>
                  </span>
                </SelectItem>
                <SelectItem value="operations">
                  <span className="flex items-center gap-2">
                    <span>⚙️</span>
                    <span>Operations</span>
                  </span>
                </SelectItem>
                <SelectItem value="other">
                  <span className="flex items-center gap-2">
                    <span>💼</span>
                    <span>Other</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which project or area this agent will support
            </p>
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Agent Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agent type" />
              </SelectTrigger>
              <SelectContent>
                {agentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Agent Name *</Label>
            <Input
              id="name"
              placeholder="e.g., My Content Writer"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateDescription}
                disabled={isGenerating || !formData.type || !formData.name}
                className="h-8 text-xs gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </Button>
            </div>
            <Textarea
              id="description"
              placeholder="What does this agent do?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {formData.type && formData.name
                ? '✨ Click "Generate with AI" for a smart description'
                : 'Select agent type and name first to use AI generation'}
            </p>
          </div>

          {/* Initial Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Initial Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'paused') =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paused">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>Paused (Recommended)</span>
                  </span>
                </SelectItem>
                <SelectItem value="active">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span>Active</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Start paused to configure triggers before activation
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Agent
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
