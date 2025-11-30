import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Activity, Zap, Eye, Clock } from 'lucide-react';
import { getWebVitalsStatus, WebVitalMetric } from '@/utils/web-vitals-tracker';

interface WebVitalsData {
  LCP?: WebVitalMetric;
  FID?: WebVitalMetric;
  CLS?: WebVitalMetric;
  FCP?: WebVitalMetric;
  TTFB?: WebVitalMetric;
  INP?: WebVitalMetric;
}

export function WebVitalsDashboard() {
  const [metrics, setMetrics] = useState<WebVitalsData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebVitals();
  }, []);

  async function loadWebVitals() {
    try {
      const data = await getWebVitalsStatus() as WebVitalsData;
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load web vitals:', error);
    } finally {
      setLoading(false);
    }
  }

  function getRatingColor(rating?: string) {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  }

  function getRatingBadge(rating?: string) {
    switch (rating) {
      case 'good': return <Badge className="bg-green-500">Good</Badge>;
      case 'needs-improvement': return <Badge className="bg-yellow-500">Needs Improvement</Badge>;
      case 'poor': return <Badge className="bg-red-500">Poor</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  }

  function formatValue(name: string, value?: number) {
    if (!value) return 'N/A';
    if (name === 'CLS') return value.toFixed(3);
    return `${Math.round(value)}ms`;
  }

  function getScorePercentage(rating?: string) {
    switch (rating) {
      case 'good': return 100;
      case 'needs-improvement': return 60;
      case 'poor': return 30;
      default: return 0;
    }
  }

  const vitalsConfig = [
    {
      key: 'LCP',
      name: 'Largest Contentful Paint',
      icon: Eye,
      description: 'Measures loading performance',
      goodThreshold: '< 2.5s',
    },
    {
      key: 'FID',
      name: 'First Input Delay',
      icon: Zap,
      description: 'Measures interactivity',
      goodThreshold: '< 100ms',
    },
    {
      key: 'CLS',
      name: 'Cumulative Layout Shift',
      icon: Activity,
      description: 'Measures visual stability',
      goodThreshold: '< 0.1',
    },
    {
      key: 'FCP',
      name: 'First Contentful Paint',
      icon: Clock,
      description: 'First paint timing',
      goodThreshold: '< 1.8s',
    },
    {
      key: 'INP',
      name: 'Interaction to Next Paint',
      icon: Zap,
      description: 'Replaces FID',
      goodThreshold: '< 200ms',
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Core Web Vitals
          </CardTitle>
          <CardDescription>
            Real-time performance metrics for SEO and user experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vitalsConfig.map(config => {
              const metric = metrics[config.key as keyof WebVitalsData];
              const Icon = config.icon;
              
              return (
                <Card key={config.key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-medium">
                          {config.name}
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {config.description}
                        </CardDescription>
                      </div>
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">
                        {formatValue(config.key, metric?.value)}
                      </span>
                      {getRatingBadge(metric?.rating)}
                    </div>
                    
                    <Progress 
                      value={getScorePercentage(metric?.rating)} 
                      className="h-2"
                    />
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Target: {config.goodThreshold}</span>
                      {metric?.rating === 'good' ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <TrendingUp className="w-3 h-3" />
                          Excellent
                        </span>
                      ) : metric?.rating === 'poor' ? (
                        <span className="flex items-center gap-1 text-red-600">
                          <TrendingDown className="w-3 h-3" />
                          Needs Work
                        </span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Overall Score */}
          <Card className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Overall Performance</h3>
                <div className="flex items-center justify-center gap-8">
                  {['LCP', 'FID', 'CLS'].map(key => {
                    const metric = metrics[key as keyof WebVitalsData];
                    return (
                      <div key={key} className="text-center">
                        <div className={`w-16 h-16 rounded-full ${getRatingColor(metric?.rating)} flex items-center justify-center text-white font-bold mb-2`}>
                          {metric?.rating === 'good' ? '✓' : metric?.rating ? '!' : '?'}
                        </div>
                        <div className="text-sm font-medium">{key}</div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Core Web Vitals are essential metrics that Google uses for ranking
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {metrics.LCP?.rating !== 'good' && (
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <span>Optimize images and use lazy loading to improve LCP</span>
                  </li>
                )}
                {metrics.FID?.rating !== 'good' && (
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <span>Reduce JavaScript execution time to improve FID</span>
                  </li>
                )}
                {metrics.CLS?.rating !== 'good' && (
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠️</span>
                    <span>Set explicit dimensions for images and iframes to reduce CLS</span>
                  </li>
                )}
                {metrics.LCP?.rating === 'good' && metrics.FID?.rating === 'good' && metrics.CLS?.rating === 'good' && (
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>All Core Web Vitals are in good range! Keep monitoring.</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
