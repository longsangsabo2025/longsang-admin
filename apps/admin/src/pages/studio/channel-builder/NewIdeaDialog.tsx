/**
 * New Idea Dialog - Create a new content idea
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface NewIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  ideaType: 'video' | 'reel' | 'image' | 'story';
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onIdeaTypeChange: (v: 'video' | 'reel' | 'image' | 'story') => void;
  onSubmit: () => void;
}

export function NewIdeaDialog({
  open,
  onOpenChange,
  title,
  description,
  ideaType,
  onTitleChange,
  onDescriptionChange,
  onIdeaTypeChange,
  onSubmit,
}: NewIdeaDialogProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      // Reset form on close
      onTitleChange('');
      onDescriptionChange('');
      onIdeaTypeChange('video');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm ý tưởng mới</DialogTitle>
          <DialogDescription>
            Tạo ý tưởng nội dung mới cho kênh của bạn
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tiêu đề *</Label>
            <Input 
              placeholder="Nhập tiêu đề ý tưởng..." 
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div>
            <Label>Mô tả</Label>
            <Textarea 
              placeholder="Mô tả chi tiết về ý tưởng..." 
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>
          <div>
            <Label>Loại nội dung</Label>
            <Select value={ideaType} onValueChange={(v) => onIdeaTypeChange(v as typeof ideaType)}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="reel">Reel/Short</SelectItem>
                <SelectItem value="image">Ảnh</SelectItem>
                <SelectItem value="story">Story</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
