import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search,
  TrendingUp,
  Target,
  FileText,
  ExternalLink
} from "lucide-react";

interface ProjectSEOTabProps {
  projectId: string;
}

export function ProjectSEOTab({ projectId }: ProjectSEOTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">SEO Settings</h3>
          <p className="text-sm text-muted-foreground">
            Quản lý SEO, keywords, và meta tags cho dự án
          </p>
        </div>
      </div>

      {/* SEO Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Target Keywords
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Quản lý keywords mục tiêu cho SEO
            </p>
            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              Quản lý Keywords
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Meta Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Title, Description, Open Graph tags
            </p>
            <Button variant="outline" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Chỉnh sửa Meta Tags
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Theo dõi thứ hạng và traffic
            </p>
            <Button variant="outline" className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Xem Báo Cáo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Backlinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-4">
              Quản lý và theo dõi backlinks
            </p>
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem Backlinks
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon Notice */}
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h4 className="font-semibold mb-2">SEO Dashboard Coming Soon</h4>
          <p className="text-sm text-muted-foreground">
            Tính năng SEO đầy đủ sẽ được cập nhật trong phiên bản tiếp theo
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
