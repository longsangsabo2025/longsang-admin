/**
 * DocsTab - Marketing docs tab content (pack info, documents list, preview)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Hash,
  FolderOpen,
  FileText,
  Package,
  Palette,
  FileCode,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { AIMarketingHub } from '@/components/project/AIMarketingHub';
import type { MarketingOverview } from './types';

interface DocsTabProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  loadingDocs: boolean;
  marketingDocs: MarketingOverview | null;
  selectedDoc: string | null;
  docContent: string;
  loadingDocContent: boolean;
  onLoadMarketingDocs: () => void;
  onLoadDocContent: (docId: string) => void;
  onClearSelectedDoc: () => void;
  onShowCreatePackDialog: () => void;
  onDataReload: () => void;
}

export function DocsTab({
  projectId,
  projectName,
  projectSlug,
  loadingDocs,
  marketingDocs,
  selectedDoc,
  docContent,
  loadingDocContent,
  onLoadMarketingDocs,
  onLoadDocContent,
  onClearSelectedDoc,
  onShowCreatePackDialog,
  onDataReload,
}: DocsTabProps) {
  if (loadingDocs) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!marketingDocs || !marketingDocs.hasMarketingPack) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium mb-2">Chưa có tài liệu marketing</p>
          <p className="text-muted-foreground mb-4">
            Tạo MARKETING_PACK để quản lý tài liệu marketing cho dự án này
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={onLoadMarketingDocs} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Tải lại
            </Button>
            <Button onClick={onShowCreatePackDialog} className="gap-2">
              <Plus className="h-4 w-4" /> Tạo Marketing Pack
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Quick Info Card */}
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Thông tin nhanh
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {marketingDocs.quickInfo.appName && (
            <div>
              <p className="text-xs text-muted-foreground">Tên App</p>
              <p className="font-medium">{marketingDocs.quickInfo.appName}</p>
            </div>
          )}
          {marketingDocs.quickInfo.version && (
            <div>
              <p className="text-xs text-muted-foreground">Phiên bản</p>
              <p className="font-medium">{marketingDocs.quickInfo.version}</p>
            </div>
          )}
          {marketingDocs.quickInfo.oneLiner && (
            <div>
              <p className="text-xs text-muted-foreground">Slogan</p>
              <p className="font-medium text-sm italic">"{marketingDocs.quickInfo.oneLiner}"</p>
            </div>
          )}
          {marketingDocs.quickInfo.category && (
            <div>
              <p className="text-xs text-muted-foreground">Danh mục</p>
              <Badge variant="secondary">{marketingDocs.quickInfo.category}</Badge>
            </div>
          )}

          {/* Brand Colors */}
          {marketingDocs.quickInfo.brandColors && marketingDocs.quickInfo.brandColors.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Palette className="h-3 w-3" /> Brand Colors
              </p>
              <div className="flex gap-2 flex-wrap">
                {marketingDocs.quickInfo.brandColors.map((color, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 text-xs"
                    title={color.name}
                  >
                    <div
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: color.hex }}
                    />
                    <span className="text-muted-foreground">{color.hex}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hashtags */}
          {marketingDocs.quickInfo.hashtags && marketingDocs.quickInfo.hashtags.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Hash className="h-3 w-3" /> Hashtags
              </p>
              <div className="flex gap-1 flex-wrap">
                {marketingDocs.quickInfo.hashtags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      navigator.clipboard.writeText(tag);
                      toast.success(`Đã copy ${tag}`);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* USPs */}
          {marketingDocs.usps.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> USPs
              </p>
              <ul className="space-y-1">
                {marketingDocs.usps.slice(0, 5).map((usp, idx) => (
                  <li key={idx} className="text-xs flex items-start gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{usp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Tài liệu ({marketingDocs.documents.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onLoadMarketingDocs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            {marketingDocs.packPath}
          </CardDescription>
        </CardHeader>

        {/* AI Generate Campaigns Button + Config */}
        <div className="px-6 pb-4 space-y-2">
          <AIMarketingHub
            projectId={projectId}
            projectName={projectName}
            projectSlug={projectSlug}
            onCampaignsCreated={onDataReload}
          />
        </div>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {marketingDocs.documents.map((doc) => (
                <div
                  key={doc.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50",
                    selectedDoc === doc.id && "bg-primary/10 border-primary"
                  )}
                  onClick={() => onLoadDocContent(doc.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.filename}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Document Preview */}
      {selectedDoc && (
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileCode className="h-4 w-4 text-primary" />
                Nội dung tài liệu
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(docContent);
                    toast.success('Đã copy nội dung');
                  }}
                >
                  <Copy className="h-4 w-4 mr-1" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={onClearSelectedDoc}>
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDocContent ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
                  {docContent}
                </pre>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
