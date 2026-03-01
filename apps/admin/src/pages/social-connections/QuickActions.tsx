import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>🚀 Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <a href="/admin/social-media">
              <span className="text-2xl mb-2">✍️</span>
              <span>Compose Post</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <a href="/admin/workflows">
              <span className="text-2xl mb-2">⚡</span>
              <span>n8n Workflows</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col" asChild>
            <a href="/admin/credentials">
              <span className="text-2xl mb-2">🔐</span>
              <span>Manage Credentials</span>
            </a>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex-col">
            <span className="text-2xl mb-2">📊</span>
            <span>View Analytics</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
