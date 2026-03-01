import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { useSurvivalMetrics, useUpdateSurvivalSettings } from '@/hooks/use-survival';

// =====================================================
// PROPS
// =====================================================

export interface SurvivalSettingsProps {
  onClose: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function SurvivalSettings({ onClose }: SurvivalSettingsProps) {
  const { data: metrics } = useSurvivalMetrics();
  const updateSettings = useUpdateSurvivalSettings();
  
  const [daysRemaining, setDaysRemaining] = useState(metrics?.daysRemaining || 30);
  const [targetAmount, setTargetAmount] = useState(metrics?.targetAmount || 2000);
  const [currentAmount, setCurrentAmount] = useState(metrics?.currentAmount || 0);

  const handleSave = () => {
    updateSettings.mutate({
      daysRemaining,
      targetAmount,
      currentAmount,
    }, {
      onSuccess: () => onClose(),
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Survival Settings
        </DialogTitle>
        <DialogDescription>
          Cấu hình mục tiêu survival của bạn
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="days">Số ngày còn lại</Label>
          <Input
            id="days"
            type="number"
            value={daysRemaining}
            onChange={(e) => setDaysRemaining(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Mục tiêu ($)</Label>
          <Input
            id="target"
            type="number"
            value={targetAmount}
            onChange={(e) => setTargetAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="current">Đã có ($)</Label>
          <Input
            id="current"
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(parseInt(e.target.value) || 0)}
          />
        </div>

        <div className="p-4 rounded-lg bg-muted">
          <div className="flex justify-between">
            <span>Cần kiếm mỗi ngày:</span>
            <span className="font-bold text-orange-500">
              ${Math.ceil((targetAmount - currentAmount) / daysRemaining) || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={updateSettings.isPending}>
          {updateSettings.isPending ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>
    </>
  );
}
