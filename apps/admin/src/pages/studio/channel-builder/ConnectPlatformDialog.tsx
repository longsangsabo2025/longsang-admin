/**
 * Connect Platform Dialog - Choose a social platform to connect
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { PLATFORM_CONFIG } from './types';

interface ConnectPlatformDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConnectPlatformDialog({ open, onOpenChange }: ConnectPlatformDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kết nối nền tảng</DialogTitle>
          <DialogDescription>
            Kết nối tài khoản social media để đăng tự động
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {Object.entries(PLATFORM_CONFIG).map(([key, config]) => {
            return (
              <Button
                key={key}
                variant="outline"
                className="h-auto py-6 flex-col gap-2"
                onClick={() => {
                  toast.info(`Đang kết nối ${config.name}...`);
                  onOpenChange(false);
                }}
              >
                <span className="text-3xl">{config.emoji}</span>
                <span>{config.name}</span>
              </Button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
