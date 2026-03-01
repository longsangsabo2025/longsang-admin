/**
 * 🎬 ScenesStep Component
 * Step 2: Edit scenes before production
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ChevronRight,
  ChevronDown,
  ImagePlus,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  X,
  GripVertical,
} from 'lucide-react';
import type { Scene, ReferenceImage } from './types';
import { CAMERA_MOVEMENTS, MOODS } from './types';

interface ScenesStepProps {
  scenes: Scene[];
  brainImages: ReferenceImage[];
  expandedScene: string | null;
  onExpandScene: (sceneId: string | null) => void;
  onUpdateScene: (sceneId: string, updates: Partial<Scene>) => void;
  onDeleteScene: (sceneId: string) => void;
  onAddScene: (afterNumber: number) => void;
  onAddReference: (sceneId: string, imageId: string) => void;
  onOpenBrainPicker: (sceneId: string) => void;
  onReorderScenes: (fromIndex: number, toIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export function ScenesStep({
  scenes,
  brainImages,
  expandedScene,
  onExpandScene,
  onUpdateScene,
  onDeleteScene,
  onAddScene,
  onAddReference,
  onOpenBrainPicker,
  onReorderScenes,
  onBack,
  onNext,
}: Readonly<ScenesStepProps>) {
  // Guard against undefined
  const safeScenes = scenes || [];
  const safeBrainImages = brainImages || [];
  
  // 🚀 ELON MODE: Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  // 🚀 ELON MODE: Bulk Edit State
  const [selectedScenes, setSelectedScenes] = useState<Set<string>>(new Set());
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkCameraMovement, setBulkCameraMovement] = useState('');
  const [bulkMood, setBulkMood] = useState('');
  const [bulkDuration, setBulkDuration] = useState<number | null>(null);
  
  const totalDuration = safeScenes.reduce((sum, s) => sum + s.duration, 0);
  
  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };
  
  const handleDragLeave = () => {
    setDragOverIndex(null);
  };
  
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderScenes(draggedIndex, index);
      toast.success('✅ Đã sắp xếp lại scene');
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };
  
  // Bulk edit handlers
  const toggleSceneSelection = (sceneId: string) => {
    setSelectedScenes(prev => {
      const next = new Set(prev);
      if (next.has(sceneId)) {
        next.delete(sceneId);
      } else {
        next.add(sceneId);
      }
      return next;
    });
  };
  
  const selectAllScenes = () => {
    setSelectedScenes(new Set(safeScenes.map(s => s.id)));
  };
  
  const clearSelection = () => {
    setSelectedScenes(new Set());
  };
  
  const applyBulkEdit = () => {
    if (selectedScenes.size === 0) return;
    
    const updates: Partial<Scene> = {};
    if (bulkCameraMovement) updates.cameraMovement = bulkCameraMovement;
    if (bulkMood) updates.mood = bulkMood;
    if (bulkDuration) updates.duration = bulkDuration;
    
    selectedScenes.forEach(sceneId => {
      onUpdateScene(sceneId, updates);
    });
    
    toast.success(`✅ Đã cập nhật ${selectedScenes.size} scene`);
    setShowBulkEdit(false);
    clearSelection();
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{safeScenes.length}</div>
                <div className="text-xs text-muted-foreground">Scenes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{totalDuration}s</div>
                <div className="text-xs text-muted-foreground">Tổng thời lượng</div>
              </div>
              {selectedScenes.size > 0 && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{selectedScenes.size}</div>
                  <div className="text-xs text-muted-foreground">Đã chọn</div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {selectedScenes.size > 0 ? (
                <>
                  <Button variant="outline" onClick={clearSelection}>
                    <X className="h-4 w-4 mr-2" />
                    Bỏ chọn
                  </Button>
                  <Button variant="outline" onClick={() => setShowBulkEdit(!showBulkEdit)}>
                    Sửa hàng loạt ({selectedScenes.size})
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={selectAllScenes}>
                  Chọn tất cả
                </Button>
              )}
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <Button onClick={onNext} disabled={safeScenes.length === 0}>
                Tiếp tục sản xuất <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Bulk Edit Panel */}
      {showBulkEdit && selectedScenes.size > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm">✏️ Sửa hàng loạt {selectedScenes.size} scene</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Camera Movement</Label>
                <Select value={bulkCameraMovement} onValueChange={setBulkCameraMovement}>
                  <SelectTrigger>
                    <SelectValue placeholder="Không thay đổi" />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_MOVEMENTS.map(cam => (
                      <SelectItem key={cam} value={cam}>{cam}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Mood</Label>
                <Select value={bulkMood} onValueChange={setBulkMood}>
                  <SelectTrigger>
                    <SelectValue placeholder="Không thay đổi" />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map(mood => (
                      <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Duration (s)</Label>
                <Input
                  type="number"
                  placeholder="Không thay đổi"
                  value={bulkDuration || ''}
                  onChange={(e) => setBulkDuration(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBulkEdit(false)}>
                Hủy
              </Button>
              <Button onClick={applyBulkEdit}>
                Áp dụng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Scenes List */}
      <ScrollArea className="h-[calc(100vh-20rem)]">
        <div className="space-y-3 pr-4">
          {safeScenes.map((scene, index) => {
            const safeReferenceIds = scene.referenceImageIds || [];
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            
            return (
            <Card 
              key={scene.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`border-l-4 transition-all ${
                expandedScene === scene.id ? 'border-l-primary' : 'border-l-muted'
              } ${isDragging ? 'opacity-50 scale-95' : ''} ${isDragOver ? 'ring-2 ring-primary' : ''}`}
            >
              <Collapsible 
                open={expandedScene === scene.id}
                onOpenChange={(open) => onExpandScene(open ? scene.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedScenes.has(scene.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSceneSelection(scene.id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 cursor-pointer"
                        />
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                        <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                          {scene.number}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{scene.description.slice(0, 60)}...</div>
                          <div className="text-xs text-muted-foreground">
                            {scene.duration}s • {scene.cameraMovement} • {scene.mood}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {safeReferenceIds.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            <ImagePlus className="h-3 w-3 mr-1" />
                            {safeReferenceIds.length}
                          </Badge>
                        )}
                        {expandedScene === scene.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Description */}
                    <div>
                      <Label className="text-xs">Mô tả scene</Label>
                      <Input
                        value={scene.description}
                        onChange={(e) => onUpdateScene(scene.id, { description: e.target.value })}
                      />
                    </div>
                    
                    {/* Visual Prompt */}
                    <div>
                      <Label className="text-xs">Visual Prompt (chi tiết cho Image Generator)</Label>
                      <Textarea
                        value={scene.visualPrompt}
                        onChange={(e) => onUpdateScene(scene.id, { visualPrompt: e.target.value })}
                        rows={4}
                        className="text-sm"
                        placeholder="Mô tả chi tiết hình ảnh: người, không gian, ánh sáng, góc máy..."
                      />
                    </div>
                    
                    {/* Camera & Mood & Duration */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs">Camera</Label>
                        <Select 
                          value={scene.cameraMovement} 
                          onValueChange={(v) => onUpdateScene(scene.id, { cameraMovement: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CAMERA_MOVEMENTS.map(cm => (
                              <SelectItem key={cm} value={cm}>{cm}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Mood</Label>
                        <Select 
                          value={scene.mood} 
                          onValueChange={(v) => onUpdateScene(scene.id, { mood: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MOODS.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Duration: {scene.duration}s</Label>
                        <Slider
                          value={[scene.duration]}
                          onValueChange={([v]) => onUpdateScene(scene.id, { duration: v })}
                          min={3}
                          max={8}
                          step={1}
                          className="mt-3"
                        />
                      </div>
                    </div>
                    
                    {/* Dialogue */}
                    <div>
                      <Label className="text-xs">Dialogue / Voiceover (nếu có)</Label>
                      <Input
                        value={scene.dialogue || ''}
                        onChange={(e) => onUpdateScene(scene.id, { dialogue: e.target.value })}
                        placeholder="Lời thoại trong scene này..."
                      />
                    </div>
                    
                    {/* Reference Images */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Reference Images (từ Brain Library)</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => onOpenBrainPicker(scene.id)}
                        >
                          <ImagePlus className="h-3 w-3 mr-1" />
                          Chọn ảnh
                        </Button>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {safeReferenceIds.map(imgId => {
                          const img = safeBrainImages.find(i => i.id === imgId);
                          if (!img) return null;
                          
                          return (
                            <button
                              key={imgId}
                              type="button"
                              title={`Xóa ảnh tham chiếu: ${img.title}`}
                              className="w-16 h-16 rounded overflow-hidden relative group"
                              onClick={() => onAddReference(scene.id, imgId)}
                            >
                              <img src={img.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-red-500/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <X className="h-4 w-4 text-white" />
                              </div>
                            </button>
                          );
                        })}
                        {safeReferenceIds.length === 0 && (
                          <div className="text-xs text-muted-foreground py-2">
                            Chưa có ảnh tham chiếu. Click "Chọn ảnh" để thêm.
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex justify-between pt-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onAddScene(scene.number);
                          toast.success('Đã thêm scene mới');
                        }}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Thêm scene sau
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          onDeleteScene(scene.id);
                          toast.success('Đã xóa scene');
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

export default ScenesStep;
