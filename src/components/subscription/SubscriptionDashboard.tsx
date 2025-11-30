import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getUserSubscription, getUserUsage, checkUsageLimits } from "@/lib/subscription/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { 
  TrendingUp, 
  Zap, 
  Database, 
  Bot, 
  Key, 
  Crown,
  AlertCircle 
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function SubscriptionDashboard() {
  const navigate = useNavigate();

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ['user-subscription'],
    queryFn: () => getUserSubscription()
  });

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['user-usage'],
    queryFn: () => getUserUsage()
  });

  const { data: limits } = useQuery({
    queryKey: ['usage-limits'],
    queryFn: () => checkUsageLimits()
  });

  if (subLoading || usageLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  const plan = subscription?.plan;
  const currentUsage = usage || {
    api_calls_count: 0,
    workflows_executed: 0,
    agents_created: 0,
    storage_used_mb: 0,
    credentials_stored: 0
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 70) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Current Plan: {plan?.display_name}
            </CardTitle>
            <CardDescription>
              {plan?.description}
            </CardDescription>
          </div>
          <Button onClick={() => navigate('/pricing')}>
            {plan?.name === 'free' ? 'Upgrade Plan' : 'View Plans'}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${plan?.price_monthly || 0}</div>
              <div className="text-sm text-muted-foreground">per month</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {subscription?.subscription.status === 'active' ? '✅' : '⏸️'}
              </div>
              <div className="text-sm text-muted-foreground capitalize">
                {subscription?.subscription.status || 'N/A'}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {subscription?.subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              </div>
              <div className="text-sm text-muted-foreground">Billing Cycle</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Limits Warning */}
      {limits && !limits.withinLimits && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Usage Limit Exceeded</AlertTitle>
          <AlertDescription>
            You've exceeded your plan limits for: {limits.exceeded.join(', ')}.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Current Month Usage
          </CardTitle>
          <CardDescription>
            Usage resets on the 1st of each month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Calls */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="font-medium">API Calls</span>
              </div>
              <span className={`text-sm font-mono ${getUsageColor(getUsagePercentage(currentUsage.api_calls_count, plan?.max_api_calls || 1))}`}>
                {currentUsage.api_calls_count.toLocaleString()} / {plan?.max_api_calls?.toLocaleString() || 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(currentUsage.api_calls_count, plan?.max_api_calls || 1)} 
              className="h-2"
            />
          </div>

          {/* Workflows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">Workflows Executed</span>
              </div>
              <span className={`text-sm font-mono ${getUsageColor(getUsagePercentage(currentUsage.workflows_executed, plan?.max_workflows || 1))}`}>
                {currentUsage.workflows_executed} / {plan?.max_workflows || 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(currentUsage.workflows_executed, plan?.max_workflows || 1)} 
              className="h-2"
            />
          </div>

          {/* AI Agents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="font-medium">AI Agents Created</span>
              </div>
              <span className={`text-sm font-mono ${getUsageColor(getUsagePercentage(currentUsage.agents_created, plan?.max_agents || 1))}`}>
                {currentUsage.agents_created} / {plan?.max_agents || 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(currentUsage.agents_created, plan?.max_agents || 1)} 
              className="h-2"
            />
          </div>

          {/* Storage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span className="font-medium">Storage Used</span>
              </div>
              <span className={`text-sm font-mono ${getUsageColor(getUsagePercentage(currentUsage.storage_used_mb, plan?.max_storage_mb || 1))}`}>
                {currentUsage.storage_used_mb.toFixed(2)} MB / {plan?.max_storage_mb || 'Unlimited'} MB
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(currentUsage.storage_used_mb, plan?.max_storage_mb || 1)} 
              className="h-2"
            />
          </div>

          {/* Credentials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">Credentials Stored</span>
              </div>
              <span className={`text-sm font-mono ${getUsageColor(getUsagePercentage(currentUsage.credentials_stored, plan?.max_credentials || 1))}`}>
                {currentUsage.credentials_stored} / {plan?.max_credentials || 'Unlimited'}
              </span>
            </div>
            <Progress 
              value={getUsagePercentage(currentUsage.credentials_stored, plan?.max_credentials || 1)} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Features Available */}
      <Card>
        <CardHeader>
          <CardTitle>Available Features</CardTitle>
          <CardDescription>Features included in your current plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {plan?.features && Object.entries(plan.features as Record<string, string>).map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 p-3 border rounded-lg">
                <Badge variant="secondary" className="mt-0.5">✓</Badge>
                <div>
                  <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
