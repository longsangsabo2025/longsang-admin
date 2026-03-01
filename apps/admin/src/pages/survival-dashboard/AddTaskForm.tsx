import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Plus, Star } from 'lucide-react';
import { useCreateTask } from '@/hooks/use-survival';
import {
  EISENHOWER_QUADRANTS,
  TASK_CATEGORIES,
  calculateICE,
} from '@/types/survival.types';

// =====================================================
// PROPS
// =====================================================

export interface AddTaskFormProps {
  onSuccess: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function AddTaskForm({ onSuccess }: AddTaskFormProps) {
  const createTask = useCreateTask();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('freelance');
  const [size, setSize] = useState<'major' | 'medium' | 'small'>('medium');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(true);
  const [impact, setImpact] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [ease, setEase] = useState(5);
  const [potentialRevenue, setPotentialRevenue] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');

  const iceScore = calculateICE(impact, confidence, ease);
  
  const handleSubmit = () => {
    if (!title.trim()) return;
    
    createTask.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category as any,
      size,
      urgent,
      important,
      impact,
      confidence,
      ease,
      potential_revenue: potentialRevenue ? parseInt(potentialRevenue) : undefined,
      estimated_minutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
    }, {
      onSuccess: () => {
        onSuccess();
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Thêm Task Mới
        </DialogTitle>
        <DialogDescription>
          Điền thông tin task theo Eisenhower + ICE Scoring
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Tiêu đề *</Label>
          <Input
            id="title"
            placeholder="VD: Apply 10 job trên Upwork"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Mô tả</Label>
          <Textarea
            id="description"
            placeholder="Chi tiết công việc..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {/* Category & Size */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TASK_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.nameVi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Kích thước (1-3-5)</Label>
            <Select value={size} onValueChange={(v) => setSize(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="major">🎯 Major (1/ngày)</SelectItem>
                <SelectItem value="medium">📋 Medium (3/ngày)</SelectItem>
                <SelectItem value="small">⚡ Small (5/ngày)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Eisenhower Matrix */}
        <div className="space-y-3">
          <Label>Eisenhower Matrix</Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span>Khẩn cấp?</span>
              </div>
              <Switch checked={urgent} onCheckedChange={setUrgent} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>Quan trọng?</span>
              </div>
              <Switch checked={important} onCheckedChange={setImportant} />
            </div>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted">
            → {EISENHOWER_QUADRANTS[
              urgent && important ? 'do_now' :
              !urgent && important ? 'schedule' :
              urgent && !important ? 'delegate' : 'eliminate'
            ].icon} {EISENHOWER_QUADRANTS[
              urgent && important ? 'do_now' :
              !urgent && important ? 'schedule' :
              urgent && !important ? 'delegate' : 'eliminate'
            ].nameVi}
          </div>
        </div>

        {/* ICE Scoring */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>ICE Scoring</Label>
            <Badge className="text-lg px-3 py-1">
              Score: {iceScore}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Impact (Tác động)</span>
                <span className="font-mono">{impact}</span>
              </div>
              <Slider
                value={[impact]}
                onValueChange={([v]) => setImpact(v)}
                min={1}
                max={10}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Confidence (Độ chắc chắn)</span>
                <span className="font-mono">{confidence}</span>
              </div>
              <Slider
                value={[confidence]}
                onValueChange={([v]) => setConfidence(v)}
                min={1}
                max={10}
                step={1}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Ease (Độ dễ, 10 = dễ nhất)</span>
                <span className="font-mono">{ease}</span>
              </div>
              <Slider
                value={[ease]}
                onValueChange={([v]) => setEase(v)}
                min={1}
                max={10}
                step={1}
              />
            </div>
          </div>
        </div>

        {/* Revenue & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="revenue">Potential Revenue ($)</Label>
            <Input
              id="revenue"
              type="number"
              placeholder="500"
              value={potentialRevenue}
              onChange={(e) => setPotentialRevenue(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="time">Thời gian (phút)</Label>
            <Input
              id="time"
              type="number"
              placeholder="30"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSuccess}>
          Hủy
        </Button>
        <Button onClick={handleSubmit} disabled={!title.trim() || createTask.isPending}>
          {createTask.isPending ? 'Đang tạo...' : 'Tạo Task'}
        </Button>
      </div>
    </>
  );
}
