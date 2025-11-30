import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, RefreshCw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function SitemapGenerator() {
  const { toast } = useToast();

  const sitemaps = [
    { name: 'sitemap.xml', urls: 310, size: '59.9 KB', lastUpdate: '2025-11-11 20:18:00' },
    { name: 'sitemap-users.xml', urls: 123, size: '25.2 KB', lastUpdate: '2025-11-11 20:18:00' },
    { name: 'sitemap-matches.xml', urls: 170, size: '34.1 KB', lastUpdate: '2025-11-11 20:18:00' },
    { name: 'sitemap-news.xml', urls: 8, size: '2.4 KB', lastUpdate: '2025-11-11 20:18:00' },
  ];

  const handleGenerate = () => {
    toast({
      title: 'Đang tạo sitemap...',
      description: 'Sitemap đang được tạo tự động',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quản Lý Sitemap
            </CardTitle>
            <CardDescription>Tự động tạo và cập nhật sitemap cho tất cả domains</CardDescription>
          </div>
          <Button onClick={handleGenerate} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Tạo lại Sitemap
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sitemaps.map((sitemap, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{sitemap.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {sitemap.urls} URLs • {sitemap.size} • Updated {sitemap.lastUpdate}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{sitemap.urls} URLs</Badge>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Tải xuống
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
