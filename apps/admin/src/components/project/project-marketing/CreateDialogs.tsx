/**
 * CreatePackDialog + CreateCampaignDialog
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Rocket,
  Loader2,
  Megaphone,
  FileText,
  Package,
} from 'lucide-react';
import { PLATFORMS } from './constants';
import type { NewCampaign, NewPackInfo } from './types';

// ==================== Create Marketing Pack Dialog ====================

interface CreatePackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newPackInfo: NewPackInfo;
  onPackInfoChange: (info: NewPackInfo) => void;
  creatingPack: boolean;
  onCreatePack: () => void;
}

export function CreatePackDialog({
  open, onOpenChange, newPackInfo, onPackInfoChange, creatingPack, onCreatePack,
}: CreatePackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="create-pack-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Tạo Marketing Pack mới
          </DialogTitle>
          <DialogDescription id="create-pack-description">
            Tạo bộ tài liệu marketing chuẩn cho dự án của bạn
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="text-sm text-muted-foreground">
              Marketing Pack sẽ được tạo với template chuẩn bao gồm:
            </p>
            <ul className="mt-2 text-sm space-y-1">
              {['Product Overview', 'Feature List', 'User Journey Map', 'Marketing Copy', 'Assets Inventory', 'Technical Specs', 'Content Calendar'].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <FileText className="h-3 w-3" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <Label>Tên sản phẩm</Label>
            <Input placeholder="VD: SABO Arena" value={newPackInfo.name}
              onChange={(e) => onPackInfoChange({ ...newPackInfo, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Danh mục</Label>
            <Input placeholder="VD: Sports, Real Estate, AI..." value={newPackInfo.category}
              onChange={(e) => onPackInfoChange({ ...newPackInfo, category: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Slogan / One-liner</Label>
            <Input placeholder="VD: Nền tảng bida số 1 Việt Nam" value={newPackInfo.oneLiner}
              onChange={(e) => onPackInfoChange({ ...newPackInfo, oneLiner: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Thị trường mục tiêu</Label>
            <Input placeholder="VD: Vietnam, SEA..." value={newPackInfo.targetMarket}
              onChange={(e) => onPackInfoChange({ ...newPackInfo, targetMarket: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={onCreatePack} disabled={creatingPack} className="gap-2">
              {creatingPack ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {creatingPack ? 'Đang tạo...' : 'Tạo Marketing Pack'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== Create Campaign Dialog ====================

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newCampaign: NewCampaign;
  onCampaignChange: (campaign: NewCampaign) => void;
  onCreateCampaign: () => void;
}

export function CreateCampaignDialog({
  open, onOpenChange, newCampaign, onCampaignChange, onCreateCampaign,
}: CreateCampaignDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="create-campaign-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Tạo chiến dịch mới
          </DialogTitle>
          <DialogDescription id="create-campaign-description">
            Tạo chiến dịch marketing mới cho dự án
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tên chiến dịch</Label>
            <Input placeholder="VD: Launch Campaign Q1 2025" value={newCampaign.name}
              onChange={(e) => onCampaignChange({ ...newCampaign, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Nội dung</Label>
            <Textarea placeholder="Mô tả nội dung chiến dịch..." value={newCampaign.content}
              onChange={(e) => onCampaignChange({ ...newCampaign, content: e.target.value })} className="min-h-[100px]" />
          </div>
          <div className="space-y-2">
            <Label>Nền tảng</Label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const isSelected = newCampaign.platforms.includes(platform.id);
                return (
                  <Button key={platform.id} type="button" variant={isSelected ? 'default' : 'outline'}
                    size="sm" className="gap-2"
                    style={isSelected ? { backgroundColor: platform.color } : {}}
                    onClick={() => onCampaignChange({
                      ...newCampaign,
                      platforms: isSelected ? newCampaign.platforms.filter(p => p !== platform.id) : [...newCampaign.platforms, platform.id]
                    })}
                  >
                    <Icon className="h-4 w-4" /> {platform.name}
                  </Button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Thời gian bắt đầu (tùy chọn)</Label>
            <Input type="datetime-local" value={newCampaign.scheduled_at}
              onChange={(e) => onCampaignChange({ ...newCampaign, scheduled_at: e.target.value })} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={onCreateCampaign} className="gap-2">
              <Rocket className="h-4 w-4" /> Tạo chiến dịch
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
