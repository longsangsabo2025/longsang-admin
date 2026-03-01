import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Zap } from 'lucide-react';

export const YouTubeTab = () => {
  return (
    <div className="space-y-4">
      <Card className="bg-red-950 border-red-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">▶️</span>
              <div>
                <CardTitle>YouTube</CardTitle>
                <CardDescription>Video sharing platform</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-500">🔄 Auto-Refresh</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-gray-900">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl">
                ▶️
              </div>
              <div>
                <h3 className="font-bold text-lg">Long Sang</h3>
                <p className="text-muted-foreground">YouTube Channel</p>
                <p className="text-sm font-mono text-muted-foreground">
                  ID: UCh08dvkDfJVJ8f1C-TbXbew
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">12</p>
              <p className="text-sm text-muted-foreground">Subscribers</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">20</p>
              <p className="text-sm text-muted-foreground">Videos</p>
            </div>
            <div className="p-3 rounded-lg border text-center">
              <p className="text-2xl font-bold text-red-600">4,820</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-green-700 bg-green-950">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-green-400" />
              <p className="text-sm font-medium text-green-400">
                Có Refresh Token - Token sẽ tự động renew khi hết hạn!
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Capabilities</h4>
            <div className="flex flex-wrap gap-2">
              {['Upload videos', 'Create playlists', 'Update metadata', 'Read analytics'].map(
                (cap) => (
                  <Badge key={cap} variant="secondary">
                    {cap}
                  </Badge>
                )
              )}
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a
              href="https://youtube.com/channel/UCh08dvkDfJVJ8f1C-TbXbew"
              target="_blank"
              rel="noopener"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Channel on YouTube
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
