import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  Clock,
  Database,
  Webhook,
  Play,
  Settings,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

interface AgentGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AgentGuideModal = ({ open, onOpenChange }: AgentGuideModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🤖 How to Use Your AI Agents
          </DialogTitle>
          <DialogDescription>Complete guide to activate and automate your agents</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold">Click on an Agent Card</h3>
            </div>
            <p className="text-sm text-muted-foreground ml-11">
              Click any agent card to open the detailed configuration page where you can manage
              triggers, settings, and view activity logs.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-bold">
                2
              </div>
              <h3 className="text-lg font-semibold">Set Up Triggers</h3>
            </div>
            <div className="ml-11 space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose how your agent should be activated:
              </p>

              <div className="grid gap-3">
                {/* Manual Trigger */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Play className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Manual Trigger</span>
                      <Badge variant="secondary" className="text-xs">
                        Instant
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Click "Run Now" button to execute immediately. Perfect for testing or one-time
                      tasks.
                    </p>
                  </div>
                </div>

                {/* Schedule Trigger */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Schedule Trigger</span>
                      <Badge variant="secondary" className="text-xs">
                        Automated
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set recurring schedule (daily, weekly, monthly). Example: "Generate 3 blog
                      posts every Monday at 9 AM"
                    </p>
                  </div>
                </div>

                {/* Database Trigger */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Database className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Database Trigger</span>
                      <Badge variant="secondary" className="text-xs">
                        Event-based
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Activate when data changes. Example: "Generate content when new contact
                      submits form"
                    </p>
                  </div>
                </div>

                {/* Webhook Trigger */}
                <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <Webhook className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">Webhook Trigger</span>
                      <Badge variant="secondary" className="text-xs">
                        API
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Get API endpoint to trigger from external services (Zapier, Make, custom apps)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 font-bold">
                3
              </div>
              <h3 className="text-lg font-semibold">Configure Settings</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-sm text-muted-foreground">
                Customize agent behavior based on type:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>
                  <strong>Content Writer:</strong> AI model, tone, length, SEO settings
                </li>
                <li>
                  <strong>Lead Nurture:</strong> Follow-up delays, email templates, personalization
                </li>
                <li>
                  <strong>Social Media:</strong> Platforms, post variants, hashtags, scheduling
                </li>
                <li>
                  <strong>Analytics:</strong> Metrics to track, report frequency, dashboards
                </li>
              </ul>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 text-yellow-600 font-bold">
                4
              </div>
              <h3 className="text-lg font-semibold">Monitor & Optimize</h3>
            </div>
            <div className="ml-11 space-y-2">
              <p className="text-sm text-muted-foreground">
                Track performance and improve results:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>View activity logs to see what your agent is doing</li>
                <li>Check success rates and execution times</li>
                <li>Review generated content in the Content Queue</li>
                <li>Adjust settings based on performance data</li>
              </ul>
            </div>
          </div>

          {/* Quick Start */}
          <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Quick Start: Test Your First Agent</h3>
            </div>
            <ol className="text-sm space-y-2 ml-7">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Click on "SABO Billiard Content Agent" or any Content Writer agent</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Click the green "Run Now" button to test manually</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Watch the activity log to see real-time execution</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Check Content Queue for generated content</span>
              </li>
            </ol>
          </div>

          {/* API Keys Notice */}
          <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 p-4">
            <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-orange-900 dark:text-orange-100">
                  ⚠️ Important: Add Your API Keys
                </h4>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  To enable AI generation, add your OpenAI or Anthropic API key in the{' '}
                  <code className="px-1 py-0.5 bg-orange-100 dark:bg-orange-900 rounded">.env</code>{' '}
                  file:
                </p>
                <ul className="text-xs text-orange-700 dark:text-orange-300 space-y-1 mt-2 list-disc list-inside">
                  <li>
                    <code>VITE_OPENAI_API_KEY=sk-...</code>
                  </li>
                  <li>
                    <code>VITE_ANTHROPIC_API_KEY=sk-ant-...</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Close Guide
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              // Optional: scroll to agents section
            }}
            className="gap-2"
          >
            Start Using Agents
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
