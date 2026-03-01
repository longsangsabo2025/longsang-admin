/**
 * Avatar Studio Dialogs - Brain Library and Character Picker
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ImageBrainLibrary } from '@/brain/components/ImageBrainLibrary';
import { Brain, Camera, User } from 'lucide-react';

// =============================================================================
// Brain Image Library Dialog
// =============================================================================

interface BrainLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectImages: (images: any[]) => void;
}

export function BrainLibraryDialog({
  open,
  onOpenChange,
  onSelectImages,
}: BrainLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Chọn ảnh từ Brain Image Library
          </DialogTitle>
          <DialogDescription>
            Chọn ảnh chân dung để sử dụng làm reference cho AI Avatar. Nên chọn ảnh rõ mặt, nhiều góc độ khác nhau.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[70vh] overflow-hidden">
          <ImageBrainLibrary
            selectionMode={true}
            maxSelection={10}
            onSelectImages={onSelectImages}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// Character Picker Dialog
// =============================================================================

interface CharacterPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brainCharacters: any[];
  onSelectCharacter: (character: any) => void;
}

export function CharacterPickerDialog({
  open,
  onOpenChange,
  brainCharacters,
  onSelectCharacter,
}: CharacterPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Chọn nhân vật từ Brain Library
          </DialogTitle>
          <DialogDescription>
            Chọn nhân vật đã tạo trong Brain Library để sử dụng làm Avatar Identity
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          {brainCharacters.length > 0 ? (
            <div className="grid gap-3 p-1">
              {brainCharacters.map((character) => (
                <button
                  key={character.id}
                  type="button"
                  className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors text-left w-full"
                  onClick={() => onSelectCharacter(character)}
                >
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{character.name}</h4>
                      {character.is_owner && (
                        <Badge variant="secondary" className="text-xs">Owner</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {character.description || 'Không có mô tả'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Camera className="h-3 w-3" />
                      {(character.reference_image_ids || []).length} ảnh
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <User className="h-12 w-12 mb-4" />
              <p className="font-medium">Chưa có nhân vật nào</p>
              <p className="text-sm mt-1">Tạo nhân vật trong Brain Library trước</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
