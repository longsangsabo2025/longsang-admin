/**
 * 🧠 Brain Image Library Component
 * 
 * Main UI for managing visual memory - upload, browse, search images
 * that the AI can use for consistent generation
 * 
 * @author LongSang (Elon Mode 🚀)
 * 
 * Refactored: thin orchestrator consuming hook + sub-components
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ImageCategory } from '@/brain/types/image-memory.types';
import {
  Brain,
  Upload,
  Search,
  Image as ImageIcon,
  User,
  MapPin,
  FolderOpen,
  Loader2,
  Filter,
  Grid,
  List,
  X,
  Check,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  ImageCard,
  ImageDetailDialog,
  ImageBrainDialogs,
  useImageBrainLibraryHook,
} from './image-brain-library';
import type { ImageBrainLibraryProps } from './image-brain-library';

export function ImageBrainLibrary({
  onSelectImages,
  selectionMode = false,
  maxSelection = 5,
  className,
}: ImageBrainLibraryProps) {
  const hook = useImageBrainLibraryHook({ onSelectImages, selectionMode, maxSelection });

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Brain Image Library</h2>
            <p className="text-xs text-muted-foreground">
              {hook.stats?.totalImages || hook.images.length} ảnh • {hook.normalizedCharacters.length} nhân vật • {hook.normalizedLocations.length} địa điểm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectionMode && hook.selectedImages.size > 0 && (
            <Button onClick={() => onSelectImages?.(hook.selectedImagesList)}>
              <Check className="w-4 h-4 mr-2" />
              Chọn {hook.selectedImages.size} ảnh
            </Button>
          )}
          <Button onClick={() => hook.setShowUploadDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 border-b space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm ảnh bằng ngôn ngữ tự nhiên..."
              value={hook.searchQuery}
              onChange={(e) => hook.setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && hook.handleSearch()}
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={hook.handleSearch} disabled={hook.isSearching}>
            {hook.isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Select value={hook.selectedCategory} onValueChange={(v) => hook.setSelectedCategory(v as ImageCategory | 'all')}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="person">👤 Người</SelectItem>
              <SelectItem value="location">📍 Địa điểm</SelectItem>
              <SelectItem value="object">📦 Đối tượng</SelectItem>
              <SelectItem value="outfit">👔 Trang phục</SelectItem>
              <SelectItem value="mood">😊 Mood</SelectItem>
              <SelectItem value="action">⚡ Hành động</SelectItem>
              <SelectItem value="style">🎨 Style</SelectItem>
              <SelectItem value="scene">📷 Cảnh</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button variant={hook.viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => hook.setViewMode('grid')}>
              <Grid className="w-4 h-4" />
            </Button>
            <Button variant={hook.viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => hook.setViewMode('list')}>
              <List className="w-4 h-4" />
            </Button>
          </div>

          {hook.searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => hook.setSearchQuery('')}>
              <X className="w-4 h-4 mr-1" />
              Xóa tìm kiếm
            </Button>
          )}
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={hook.activeTab} onValueChange={(v) => hook.setActiveTab(v as typeof hook.activeTab)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="all" className="flex items-center gap-1"><ImageIcon className="w-4 h-4" />Tất cả</TabsTrigger>
          <TabsTrigger value="characters" className="flex items-center gap-1"><User className="w-4 h-4" />Nhân vật</TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-1"><MapPin className="w-4 h-4" />Địa điểm</TabsTrigger>
          <TabsTrigger value="collections" className="flex items-center gap-1"><FolderOpen className="w-4 h-4" />Bộ sưu tập</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1 p-4">
          {/* All Images */}
          <TabsContent value="all" className="mt-0">
            {hook.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : hook.filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Brain className="w-12 h-12 mb-4 opacity-50" />
                <p>Chưa có ảnh nào trong Brain Library</p>
                <Button variant="outline" className="mt-4" onClick={() => hook.setShowUploadDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />Upload ảnh đầu tiên
                </Button>
              </div>
            ) : (
              <div className={cn('grid gap-4', hook.viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1')}>
                {hook.filteredImages.map((image) => (
                  <ImageCard
                    key={image.id}
                    image={image}
                    selected={hook.selectedImages.has(image.id)}
                    onSelect={hook.handleSelectImage}
                    onEdit={hook.setDetailImage}
                    onDelete={hook.handleDeleteImage}
                    onToggleFavorite={hook.handleToggleFavorite}
                    compact={hook.viewMode === 'list'}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Characters */}
          <TabsContent value="characters" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hook.normalizedCharacters.map((character) => (
                <Card key={character.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />{character.name}
                      {character.isOwner && <Badge variant="secondary" className="text-xs">Owner</Badge>}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{character.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {(character.referenceImageIds || []).slice(0, 3).map((imgId: string) => {
                        const img = hook.normalizedImages.find((i) => i.id === imgId);
                        return img ? (
                          <div key={imgId} className="w-12 h-12 rounded overflow-hidden">
                            <img src={img.thumbnailUrl || img.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null;
                      })}
                      <Button variant="ghost" size="sm" className="w-12 h-12" onClick={(e) => { e.stopPropagation(); hook.setAddImageToCharacterId(character.id); }}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={() => hook.setShowCreateCharacterDialog(true)}>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tạo nhân vật mới</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Locations */}
          <TabsContent value="locations" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hook.normalizedLocations.map((location) => (
                <Card key={location.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4" />{location.name}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{location.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {(location.referenceImageIds || []).slice(0, 3).map((imgId: string) => {
                        const img = hook.normalizedImages.find((i) => i.id === imgId);
                        return img ? (
                          <div key={imgId} className="w-12 h-12 rounded overflow-hidden">
                            <img src={img.thumbnailUrl || img.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : null;
                      })}
                      <Button variant="ghost" size="sm" className="w-12 h-12" onClick={(e) => { e.stopPropagation(); hook.setAddImageToLocationId(location.id); }}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={() => hook.setShowCreateLocationDialog(true)}>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tạo địa điểm mới</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collections */}
          <TabsContent value="collections" className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {hook.collections.map((collection) => (
                <Card key={collection.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="w-4 h-4" />{collection.name}</CardTitle>
                    <CardDescription className="text-xs">{(collection.imageIds || []).length} ảnh</CardDescription>
                  </CardHeader>
                </Card>
              ))}
              <Card className="border-dashed cursor-pointer hover:border-primary transition-colors" onClick={() => hook.setShowCreateCollectionDialog(true)}>
                <CardContent className="flex flex-col items-center justify-center h-32">
                  <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Tạo bộ sưu tập mới</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Image Detail Dialog */}
      <ImageDetailDialog
        image={hook.detailImage}
        open={!!hook.detailImage}
        onOpenChange={(open) => !open && hook.setDetailImage(null)}
        onSave={(updates) => {
          if (hook.detailImage) {
            hook.handleUpdateImage(hook.detailImage.id, updates);
          }
        }}
      />

      {/* All Creation & Add-Images Dialogs */}
      <ImageBrainDialogs
        showUploadDialog={hook.showUploadDialog}
        setShowUploadDialog={hook.setShowUploadDialog}
        handleUpload={hook.handleUpload}
        isUploading={hook.isUploading}
        detailImage={hook.detailImage}
        setDetailImage={hook.setDetailImage}
        handleUpdateImage={hook.handleUpdateImage}
        showCreateCharacterDialog={hook.showCreateCharacterDialog}
        setShowCreateCharacterDialog={hook.setShowCreateCharacterDialog}
        newCharacter={hook.newCharacter}
        setNewCharacter={hook.setNewCharacter}
        handleCreateCharacter={hook.handleCreateCharacter}
        selectedImagesSize={hook.selectedImages.size}
        showCreateLocationDialog={hook.showCreateLocationDialog}
        setShowCreateLocationDialog={hook.setShowCreateLocationDialog}
        newLocation={hook.newLocation}
        setNewLocation={hook.setNewLocation}
        handleCreateLocation={hook.handleCreateLocation}
        showCreateCollectionDialog={hook.showCreateCollectionDialog}
        setShowCreateCollectionDialog={hook.setShowCreateCollectionDialog}
        newCollection={hook.newCollection}
        setNewCollection={hook.setNewCollection}
        handleCreateCollection={hook.handleCreateCollection}
        addImageToCharacterId={hook.addImageToCharacterId}
        setAddImageToCharacterId={hook.setAddImageToCharacterId}
        normalizedCharacters={hook.normalizedCharacters}
        normalizedImages={hook.normalizedImages}
        selectedImages={hook.selectedImages}
        setSelectedImages={hook.setSelectedImages}
        handleAddImagesToCharacter={hook.handleAddImagesToCharacter}
        addImageToLocationId={hook.addImageToLocationId}
        setAddImageToLocationId={hook.setAddImageToLocationId}
        normalizedLocations={hook.normalizedLocations}
        handleAddImagesToLocation={hook.handleAddImagesToLocation}
      />
    </div>
  );
}
