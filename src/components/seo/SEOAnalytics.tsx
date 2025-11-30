import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export function SEOAnalytics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          SEO Analytics
        </CardTitle>
        <CardDescription>Thống kê traffic và performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Analytics dashboard sẽ được tích hợp sau
        </div>
      </CardContent>
    </Card>
  );
}
