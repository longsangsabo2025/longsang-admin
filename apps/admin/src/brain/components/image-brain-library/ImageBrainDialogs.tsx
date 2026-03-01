/**
 * ImageBrainDialogs - All creation/add-images dialogs
 */
import type { ImageMemoryItem } from '@/brain/types/image-memory.types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  User,
  MapPin,
  FolderOpen,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadDropzone } from './UploadDropzone';
import type { ImageBrainDialogsProps } from './types';

export function ImageBrainDialogs({
  // Upload dialog
  showUploadDialog,
  setShowUploadDialog,
  handleUpload,
  isUploading,

  // Detail dialog — not rendered here (separate component)

  // Create character dialog
  showCreateCharacterDialog,
  setShowCreateCharacterDialog,
  newCharacter,
  setNewCharacter,
  handleCreateCharacter,
  selectedImagesSize,

  // Create location dialog
  showCreateLocationDialog,
  setShowCreateLocationDialog,
  newLocation,
  setNewLocation,
  handleCreateLocation,

  // Create collection dialog
  showCreateCollectionDialog,
  setShowCreateCollectionDialog,
  newCollection,
  setNewCollection,
  handleCreateCollection,

  // Add images to character dialog
  addImageToCharacterId,
  setAddImageToCharacterId,
  normalizedCharacters,
  normalizedImages,
  selectedImages,
  setSelectedImages,
  handleAddImagesToCharacter,

  // Add images to location dialog
  addImageToLocationId,
  setAddImageToLocationId,
  normalizedLocations,
  handleAddImagesToLocation,
}: ImageBrainDialogsProps) {
  return (
    <>
      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Upload ảnh vào Brain
            </DialogTitle>
            <DialogDescription>
              AI sẽ tự động phân tích, phân loại và lưu trữ ảnh cho việc tạo ảnh sau này
            </DialogDescription>
          </DialogHeader>
          <UploadDropzone onUpload={handleUpload} isUploading={isUploading} />
        </DialogContent>
      </Dialog>

      {/* Create Character Dialog */}
      <Dialog open={showCreateCharacterDialog} onOpenChange={setShowCreateCharacterDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Tạo nhân vật mới
            </DialogTitle>
            <DialogDescription>
              Tạo profile nhân vật để AI có thể nhận diện và tạo ảnh nhất quán
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="char-name">Tên nhân vật *</Label>
              <Input
                id="char-name"
                placeholder="VD: Long Sang, Anh Minh..."
                value={newCharacter.name}
                onChange={(e) => setNewCharacter(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-desc">Mô tả</Label>
              <Textarea
                id="char-desc"
                placeholder="Mô tả đặc điểm nhân vật: phong cách, tính cách, đặc điểm nhận dạng..."
                value={newCharacter.description}
                onChange={(e) => setNewCharacter(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="char-owner"
                checked={newCharacter.isOwner}
                onCheckedChange={(checked) => setNewCharacter(prev => ({ ...prev, isOwner: !!checked }))}
              />
              <Label htmlFor="char-owner" className="text-sm">
                Đây là tôi (chủ sở hữu)
              </Label>
            </div>
            {selectedImagesSize > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedImagesSize} ảnh đã chọn sẽ được liên kết với nhân vật này
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCharacterDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCharacter}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo nhân vật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Location Dialog */}
      <Dialog open={showCreateLocationDialog} onOpenChange={setShowCreateLocationDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Tạo địa điểm mới
            </DialogTitle>
            <DialogDescription>
              Lưu địa điểm yêu thích để AI có thể tạo ảnh ở các địa điểm này
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="loc-name">Tên địa điểm *</Label>
              <Input
                id="loc-name"
                placeholder="VD: Văn phòng SABO, Bãi biển Vũng Tàu..."
                value={newLocation.name}
                onChange={(e) => setNewLocation(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-desc">Mô tả</Label>
              <Textarea
                id="loc-desc"
                placeholder="Mô tả chi tiết địa điểm: phong cảnh, đặc điểm, ánh sáng..."
                value={newLocation.description}
                onChange={(e) => setNewLocation(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            {selectedImagesSize > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedImagesSize} ảnh đã chọn sẽ được liên kết với địa điểm này
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLocationDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateLocation}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo địa điểm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Collection Dialog */}
      <Dialog open={showCreateCollectionDialog} onOpenChange={setShowCreateCollectionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Tạo bộ sưu tập mới
            </DialogTitle>
            <DialogDescription>
              Nhóm các ảnh liên quan lại với nhau để dễ quản lý
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="col-name">Tên bộ sưu tập *</Label>
              <Input
                id="col-name"
                placeholder="VD: Marketing Q4, Ảnh sản phẩm..."
                value={newCollection.name}
                onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-desc">Mô tả</Label>
              <Textarea
                id="col-desc"
                placeholder="Mô tả mục đích sử dụng bộ sưu tập..."
                value={newCollection.description}
                onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            {selectedImagesSize > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  {selectedImagesSize} ảnh đã chọn sẽ được thêm vào bộ sưu tập
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCollectionDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateCollection}>
              <Plus className="w-4 h-4 mr-2" />
              Tạo bộ sưu tập
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Images to Character Dialog */}
      <Dialog open={!!addImageToCharacterId} onOpenChange={(open) => !open && setAddImageToCharacterId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Thêm ảnh cho nhân vật: {normalizedCharacters.find(c => c.id === addImageToCharacterId)?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn ảnh từ thư viện để liên kết với nhân vật này
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-4 gap-2 p-2">
              {normalizedImages.map((img) => {
                const isSelected = selectedImages.has(img.id);
                const imgUrl = img.thumbnailUrl || img.imageUrl;
                console.log('[Dialog] Image:', img.id, 'URL:', imgUrl);
                return (
                  <div 
                    key={img.id} 
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                      isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={() => {
                      setSelectedImages(prev => {
                        const next = new Set(prev);
                        if (next.has(img.id)) {
                          next.delete(img.id);
                        } else {
                          next.add(img.id);
                        }
                        return next;
                      });
                    }}
                  >
                    <img 
                      src={imgUrl} 
                      alt={img.analysis?.title || ''} 
                      className="w-full h-full object-cover"
                      onError={(e) => console.log('[Dialog] Image load error:', img.id, imgUrl)}
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddImageToCharacterId(null);
              setSelectedImages(new Set());
            }}>
              Hủy
            </Button>
            <Button 
              onClick={() => handleAddImagesToCharacter(Array.from(selectedImages))}
              disabled={selectedImages.size === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm {selectedImages.size} ảnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Images to Location Dialog */}
      <Dialog open={!!addImageToLocationId} onOpenChange={(open) => !open && setAddImageToLocationId(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Thêm ảnh cho địa điểm: {normalizedLocations.find(l => l.id === addImageToLocationId)?.name}
            </DialogTitle>
            <DialogDescription>
              Chọn ảnh từ thư viện để liên kết với địa điểm này
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-4 gap-2 p-2">
              {normalizedImages.map((img) => {
                const isSelected = selectedImages.has(img.id);
                const imgUrl = img.thumbnailUrl || img.imageUrl;
                return (
                  <div 
                    key={img.id} 
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all",
                      isSelected ? "border-primary ring-2 ring-primary/30" : "border-transparent hover:border-muted-foreground/30"
                    )}
                    onClick={() => {
                      setSelectedImages(prev => {
                        const next = new Set(prev);
                        if (next.has(img.id)) {
                          next.delete(img.id);
                        } else {
                          next.add(img.id);
                        }
                        return next;
                      });
                    }}
                  >
                    <img 
                      src={imgUrl} 
                      alt={img.analysis?.title || ''} 
                      className="w-full h-full object-cover"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddImageToLocationId(null);
              setSelectedImages(new Set());
            }}>
              Hủy
            </Button>
            <Button 
              onClick={() => handleAddImagesToLocation(Array.from(selectedImages))}
              disabled={selectedImages.size === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm {selectedImages.size} ảnh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
