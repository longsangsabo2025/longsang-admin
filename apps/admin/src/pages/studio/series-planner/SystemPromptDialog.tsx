import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  FileText,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { DEFAULT_AI_SETTINGS } from './shared';

export interface SystemPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
}

export function SystemPromptDialog({
  open,
  onOpenChange,
  systemPrompt,
  setSystemPrompt,
}: SystemPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            System Prompt
          </DialogTitle>
          <DialogDescription>
            Tùy chỉnh cách AI viết kịch bản series
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={20}
            className="text-sm font-mono"
            placeholder="Nhập system prompt..."
          />

          <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">
              Thay đổi được lưu tự động
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSystemPrompt(DEFAULT_AI_SETTINGS.systemPrompt);
              toast.success('Đã reset về mặc định');
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset mặc định
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
