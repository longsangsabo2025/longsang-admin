import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Download, Copy, ExternalLink, Check, Music, FileText } from 'lucide-react';
import type { MediaItem } from './types';
import { LazyImage } from './LazyImage';
import { getPreviewUrl, formatSize, formatDate, typeConfig } from './utils';
import { Image as ImageIcon } from 'lucide-react';

export interface MediaPreviewDialogProps {
  previewItem: MediaItem | null;
  onClose: () => void;
  onDownload: (item: MediaItem) => void;
  onCopyUrl: (item: MediaItem) => void;
  onSelectMedia?: (files: MediaItem[]) => void;
  onToggleSelection: (item: MediaItem) => void;
}

export function MediaPreviewDialog({
  previewItem, onClose, onDownload, onCopyUrl, onSelectMedia, onToggleSelection,
}: MediaPreviewDialogProps) {
  return (
    <Dialog open={!!previewItem} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden border-0">
        <VisuallyHidden>
          <DialogTitle>Preview: {previewItem?.name}</DialogTitle>
          <DialogDescription>Media preview dialog</DialogDescription>
        </VisuallyHidden>
        <div className="relative">
          <div className="bg-black flex items-center justify-center min-h-[50vh]">
            {previewItem?.type === 'image' && (
              <LazyImage
                src={getPreviewUrl(previewItem, 'large')}
                alt={previewItem.name}
                className="max-w-full max-h-[70vh] object-contain"
                fallbackIcon={<ImageIcon className="h-12 w-12 text-muted-foreground/40" />}
              />
            )}
            {previewItem?.type === 'video' && (
              <video src={previewItem.url} controls autoPlay className="max-w-full max-h-[70vh]" />
            )}
            {previewItem?.type === 'audio' && (
              <div className="p-12 text-center">
                <div className="h-24 w-24 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-6">
                  <Music className="h-12 w-12 text-pink-500" />
                </div>
                <audio src={previewItem.url} controls className="w-full max-w-md" autoPlay />
              </div>
            )}
            {(previewItem?.type === 'document' || previewItem?.type === 'other') && (
              <div className="text-center py-16 text-white/70">
                <FileText className="h-20 w-20 mx-auto mb-4 opacity-50" />
                <p>Không thể preview</p>
              </div>
            )}
          </div>

          {previewItem && (
            <div className="p-4 bg-background flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Badge className={`${typeConfig[previewItem.type].bg} ${typeConfig[previewItem.type].color} border ${typeConfig[previewItem.type].border}`}>
                  {typeConfig[previewItem.type].label}
                </Badge>
                <div className="min-w-0">
                  <p className="font-medium truncate">{previewItem.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatSize(previewItem.size)} {previewItem.modifiedTime && `• ${formatDate(previewItem.modifiedTime)}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => onDownload(previewItem)}>
                  <Download className="h-4 w-4 mr-2" /> Tải xuống
                </Button>
                <Button variant="outline" size="sm" onClick={() => onCopyUrl(previewItem)}>
                  <Copy className="h-4 w-4 mr-2" /> Copy URL
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(previewItem.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Mở gốc
                </Button>
                {onSelectMedia && (
                  <Button size="sm" onClick={() => { onToggleSelection(previewItem); onClose(); }}>
                    <Check className="h-4 w-4 mr-2" /> Chọn
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
