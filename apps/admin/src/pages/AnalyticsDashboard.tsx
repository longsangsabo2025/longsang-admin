import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CostDashboard } from '@/components/automation/CostDashboard';
import { APIKeyManagement } from '@/components/automation/APIKeyManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Key, TrendingUp, Zap } from 'lucide-react';

export default function AnalyticsDashboard() {
  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics & Management</h1>
          <p className="text-muted-foreground text-lg">
            Track costs, manage API keys, and analyze agent performance
          </p>
        </div>

        <Tabs defaultValue="costs" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="costs" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Analytics
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="optimization" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Optimization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="costs" className="space-y-6">
            <CostDashboard />
          </TabsContent>

          <TabsContent value="keys" className="space-y-6">
            <APIKeyManagement />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Coming soon: Agent performance analytics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-6 text-center text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Performance Dashboard</h3>
                    <p className="text-sm">
                      Advanced metrics including success rates, average response times, and model
                      comparison will be available here.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="optimization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Optimization</CardTitle>
                <CardDescription>
                  Coming soon: AI-powered cost optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-lg p-6 text-center text-muted-foreground">
                    <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="font-semibold mb-2">Optimization Insights</h3>
                    <p className="text-sm mb-4">
                      Get intelligent recommendations for reducing costs while maintaining quality:
                    </p>
                    <ul className="text-sm space-y-2 text-left max-w-md mx-auto">
                      <li>• Switch to cheaper models for simple tasks</li>
                      <li>• Optimize prompt length and token usage</li>
                      <li>• Identify underutilized agents</li>
                      <li>• Suggest batch processing opportunities</li>
                      <li>• Detect anomalous spending patterns</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
