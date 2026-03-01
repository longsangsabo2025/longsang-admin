/**
 * ImageDetailDialog - view and edit image details analyzed by AI
 */
import { useState } from 'react';
import type { ImageMemoryItem } from '@/brain/types/image-memory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, Check } from 'lucide-react';
import type { ImageDetailDialogProps } from './types';

export function ImageDetailDialog({ image, open, onOpenChange, onSave }: ImageDetailDialogProps) {
  const [customTitle, setCustomTitle] = useState(image?.customTitle || '');
  const [customDescription, setCustomDescription] = useState(image?.customDescription || '');
  const [isOwnerPortrait, setIsOwnerPortrait] = useState(image?.isOwnerPortrait || false);
  const [characterName, setCharacterName] = useState(image?.characterName || '');

  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Chi tiết ảnh trong Brain
          </DialogTitle>
          <DialogDescription>
            Xem và chỉnh sửa thông tin ảnh đã được AI phân tích
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-square">
              <img
                src={image.imageUrl}
                alt={image.analysis.title}
                className="w-full h-full object-contain"
              />
            </div>

            {/* AI Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Phân tích AI
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <Label className="text-xs text-muted-foreground">Mô tả</Label>
                  <p>{image.analysis.description}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Mood</Label>
                  <p>{image.analysis.mood}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Style</Label>
                  <p>{image.analysis.style}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Lighting</Label>
                  <p>{image.analysis.lighting}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="space-y-4">
            {/* Category & Tags */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Danh mục</Label>
              <div className="flex flex-wrap gap-1">
                {image.analysis.categories.map((cat, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {cat.category}: {cat.subcategory}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tags</Label>
              <div className="flex flex-wrap gap-1">
                {image.analysis.tags.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Custom Title */}
            <div className="space-y-2">
              <Label htmlFor="customTitle">Tiêu đề tùy chỉnh</Label>
              <Input
                id="customTitle"
                placeholder={image.analysis.title}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            {/* Custom Description */}
            <div className="space-y-2">
              <Label htmlFor="customDescription">Ghi chú</Label>
              <Textarea
                id="customDescription"
                placeholder="Thêm ghi chú về ảnh này..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                rows={3}
              />
            </div>

            {/* Owner Portrait */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isOwnerPortrait"
                checked={isOwnerPortrait}
                onCheckedChange={(checked) => setIsOwnerPortrait(checked as boolean)}
              />
              <Label htmlFor="isOwnerPortrait" className="text-sm">
                Đây là ảnh chân dung của tôi (owner)
              </Label>
            </div>

            {/* Character Name */}
            <div className="space-y-2">
              <Label htmlFor="characterName">Tên nhân vật (nếu có)</Label>
              <Input
                id="characterName"
                placeholder="Ví dụ: Long Sang, SABO Owner..."
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
              />
            </div>

            {/* Stats */}
            <Card className="bg-muted/50">
              <CardContent className="p-3 text-xs space-y-1">
                <p><span className="text-muted-foreground">Đã sử dụng:</span> {image.useCount} lần</p>
                <p><span className="text-muted-foreground">Chất lượng:</span> {image.analysis.quality.overall}</p>
                <p><span className="text-muted-foreground">Phân tích lúc:</span> {new Date(image.analyzedAt).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => {
              onSave?.({
                customTitle: customTitle || undefined,
                customDescription: customDescription || undefined,
                isOwnerPortrait,
                characterName: characterName || undefined,
              });
              onOpenChange(false);
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
