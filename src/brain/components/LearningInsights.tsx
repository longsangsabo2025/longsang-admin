import { useLearningMetrics, useRoutingAccuracy, useRoutingWeights } from '@/brain/hooks/useLearning';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Target, BarChart3 } from 'lucide-react';

export function LearningInsights() {
  const { data: metrics, isLoading: isLoadingMetrics } = useLearningMetrics();
  const { data: accuracy, isLoading: isLoadingAccuracy } = useRoutingAccuracy(24);
  const { data: weights, isLoading: isLoadingWeights } = useRoutingWeights();

  if (isLoadingMetrics || isLoadingAccuracy || isLoadingWeights) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading learning insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> Routing Accuracy
          </CardTitle>
          <CardDescription>How well the system routes queries to the right domains</CardDescription>
        </CardHeader>
        <CardContent>
          {accuracy ? (
            <div className="space-y-2">
              <div className="text-3xl font-bold">{accuracy.accuracy.toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">Last 24 hours</p>
            </div>
          ) : (
            <p className="text-muted-foreground">No accuracy data available yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Routing Weights
          </CardTitle>
          <CardDescription>Domain routing weights based on success rate</CardDescription>
        </CardHeader>
        <CardContent>
          {weights && weights.length > 0 ? (
            <div className="space-y-2">
              {weights.slice(0, 5).map((weight) => (
                <div key={weight.domain_id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Domain: {weight.domain_id.substring(0, 8)}...</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Weight: {weight.weight.toFixed(2)}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {weight.success_count}✓ / {weight.failure_count}✗
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No routing weights available yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Learning Metrics
          </CardTitle>
          <CardDescription>Recent learning metrics</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics && metrics.length > 0 ? (
            <div className="space-y-2">
              {metrics.slice(0, 10).map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-2 border rounded text-sm">
                  <span>{metric.metric_type}</span>
                  <Badge>{metric.metric_value.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No metrics available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


