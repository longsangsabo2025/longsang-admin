/**
 * FileUpload Component - Elon Musk Edition 🚀
 * Upload documents for RAG indexing
 *
 * Now uses global UploadManager - uploads persist across tab switches!
 */

import { useCallback, useState } from 'react';
import { useUploadManager } from '@/hooks/useUploadManager';
import { AssistantType } from '@/hooks/useAssistant';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UploadStatusPanel } from './UploadStatusPanel';

interface FileUploadProps {
  assistantType: AssistantType;
  userId?: string;
  className?: string;
  showStatusPanel?: boolean;
}

export function FileUpload({
  assistantType,
  userId,
  className,
  showStatusPanel = true,
}: FileUploadProps) {
  const { uploadFile, uploadFiles, hasActiveUploads, activeTasks } = useUploadManager({
    userId,
    assistantType,
    showToasts: true,
  });

  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!userId) {
        toast({
          title: '❌ Lỗi',
          description: 'Vui lòng đăng nhập để upload file',
          variant: 'destructive',
        });
        return;
      }
      uploadFile(file);
    },
    [uploadFile, userId, toast]
  );

  const handleMultipleFiles = useCallback(
    (files: FileList) => {
      if (!userId) {
        toast({
          title: '❌ Lỗi',
          description: 'Vui lòng đăng nhập để upload file',
          variant: 'destructive',
        });
        return;
      }
      uploadFiles(files);
    },
    [uploadFiles, userId, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 1) {
        handleMultipleFiles(e.dataTransfer.files);
      } else if (e.dataTransfer.files.length === 1) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect, handleMultipleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 1) {
        handleMultipleFiles(files);
      } else if (files && files.length === 1) {
        handleFileSelect(files[0]);
      }
      // Reset input
      e.target.value = '';
    },
    [handleFileSelect, handleMultipleFiles]
  );

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-semibold mb-2">Kéo thả file vào đây</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Hoặc click để chọn file (PDF, DOCX, TXT - tối đa 10MB)
          <br />
          <span className="text-xs text-green-600">
            ✨ Upload tiếp tục chạy khi bạn chuyển tab!
          </span>
        </p>
        <input
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
          multiple
        />
        <Button asChild variant="outline">
          <label htmlFor="file-upload" className="cursor-pointer">
            {hasActiveUploads ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang upload ({activeTasks.length})...
              </>
            ) : (
              <>
                <File className="h-4 w-4 mr-2" />
                Chọn file
              </>
            )}
          </label>
        </Button>
      </div>

      {/* Show upload status panel */}
      {showStatusPanel && <UploadStatusPanel showCompleted={true} />}
    </div>
  );
}
