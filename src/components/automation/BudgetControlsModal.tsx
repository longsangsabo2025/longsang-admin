import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

interface BudgetControlsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
}

interface Budget {
  id?: string;
  agent_id: string;
  daily_limit: number | null;
  monthly_limit: number | null;
  auto_pause_on_limit: boolean;
  alert_threshold: number;
  notify_on_threshold: boolean;
  current_daily_spend: number;
  current_monthly_spend: number;
}

export function BudgetControlsModal({
  open,
  onOpenChange,
  agentId,
  agentName,
}: BudgetControlsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [budget, setBudget] = useState<Budget>({
    agent_id: agentId,
    daily_limit: null,
    monthly_limit: null,
    auto_pause_on_limit: true,
    alert_threshold: 80,
    notify_on_threshold: true,
    current_daily_spend: 0,
    current_monthly_spend: 0,
  });

  useEffect(() => {
    if (open) {
      loadBudget();
    }
  }, [open, agentId]);

  const loadBudget = async () => {
    try {
      const { data } = await supabase
        .from('agent_budgets')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (data) {
        setBudget(data);
      }
    } catch (error) {
      console.error('Error loading budget:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const budgetData = {
        agent_id: agentId,
        daily_limit: budget.daily_limit,
        monthly_limit: budget.monthly_limit,
        auto_pause_on_limit: budget.auto_pause_on_limit,
        alert_threshold: budget.alert_threshold,
        notify_on_threshold: budget.notify_on_threshold,
      };

      if (budget.id) {
        // Update existing
        await supabase.from('agent_budgets').update(budgetData).eq('id', budget.id);
      } else {
        // Create new
        await supabase.from('agent_budgets').insert(budgetData);
      }

      toast({
        title: 'Budget Saved',
        description: 'Budget controls have been updated successfully.',
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save budget controls.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset budget counters? This will set current spend to $0.')) return;

    try {
      await supabase
        .from('agent_budgets')
        .update({
          current_daily_spend: 0,
          current_monthly_spend: 0,
          last_reset: new Date().toISOString(),
        })
        .eq('agent_id', agentId);

      toast({
        title: 'Budget Reset',
        description: 'Budget counters have been reset.',
      });

      loadBudget();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset budget.',
        variant: 'destructive',
      });
    }
  };

  const dailyUsagePercent = budget.daily_limit
    ? (budget.current_daily_spend / budget.daily_limit) * 100
    : 0;

  const monthlyUsagePercent = budget.monthly_limit
    ? (budget.current_monthly_spend / budget.monthly_limit) * 100
    : 0;

  const isOverBudget = dailyUsagePercent >= 100 || monthlyUsagePercent >= 100;
  const isNearLimit =
    dailyUsagePercent >= budget.alert_threshold || monthlyUsagePercent >= budget.alert_threshold;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Budget Controls - {agentName}</DialogTitle>
          <DialogDescription>Set spending limits and alerts for this agent</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Spending */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Current Spending
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Daily</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">${budget.current_daily_spend.toFixed(4)}</div>
                {budget.daily_limit && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>of ${budget.daily_limit.toFixed(4)}</span>
                      <span>{dailyUsagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          dailyUsagePercent >= 100
                            ? 'bg-red-500'
                            : dailyUsagePercent >= budget.alert_threshold
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(dailyUsagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly</span>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-2xl font-bold">${budget.current_monthly_spend.toFixed(4)}</div>
                {budget.monthly_limit && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>of ${budget.monthly_limit.toFixed(4)}</span>
                      <span>{monthlyUsagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          monthlyUsagePercent >= 100
                            ? 'bg-red-500'
                            : monthlyUsagePercent >= budget.alert_threshold
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(monthlyUsagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {isOverBudget && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Budget limit exceeded! Agent will be paused if auto-pause is enabled.
                </AlertDescription>
              </Alert>
            )}

            {!isOverBudget && isNearLimit && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Approaching budget limit ({budget.alert_threshold}% threshold reached)
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Budget Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Budget Limits
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily-limit">Daily Limit ($)</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={budget.daily_limit ?? ''}
                  onChange={(e) =>
                    setBudget({
                      ...budget,
                      daily_limit: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum daily spending. Leave empty for no limit.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly-limit">Monthly Limit ($)</Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="No limit"
                  value={budget.monthly_limit ?? ''}
                  onChange={(e) =>
                    setBudget({
                      ...budget,
                      monthly_limit: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum monthly spending. Leave empty for no limit.
                </p>
              </div>
            </div>
          </div>

          {/* Alerts & Controls */}
          <div className="space-y-4">
            <h3 className="font-semibold">Alerts & Automation</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Auto-Pause on Limit</div>
                  <div className="text-sm text-muted-foreground">
                    Automatically pause agent when budget limit is reached
                  </div>
                </div>
                <Switch
                  checked={budget.auto_pause_on_limit}
                  onCheckedChange={(checked) =>
                    setBudget({
                      ...budget,
                      auto_pause_on_limit: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">Threshold Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when approaching budget limit
                  </div>
                </div>
                <Switch
                  checked={budget.notify_on_threshold}
                  onCheckedChange={(checked) =>
                    setBudget({
                      ...budget,
                      notify_on_threshold: checked,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
                <Input
                  id="alert-threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={budget.alert_threshold}
                  onChange={(e) =>
                    setBudget({
                      ...budget,
                      alert_threshold: parseInt(e.target.value) || 80,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Receive alert when spending reaches this percentage of limit
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset Counters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Budget'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
