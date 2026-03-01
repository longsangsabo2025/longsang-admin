import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const ThreadsTab = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🧵</span>
              <div>
                <CardTitle>Threads</CardTitle>
                <CardDescription>Meta's text-based conversation app</CardDescription>
              </div>
            </div>
            <Badge className="bg-blue-500">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl">
                🧵
              </div>
              <div>
                <h3 className="font-bold text-lg">@baddie.4296</h3>
                <p className="text-muted-foreground">Vũng Tàu</p>
                <p className="text-sm font-mono text-muted-foreground">ID: 25295715200066837</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Token Status</p>
              <p className="font-medium">✅ Active (60 days)</p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="font-medium">~Jan 25, 2026</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {['Post text', 'Post images', 'Post videos', 'Carousels', 'Reply to threads'].map(
                (cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
