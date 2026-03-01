/**
 * UploadDropzone component - drag-and-drop upload zone
 */
import { useCallback } from 'react';
import { Brain, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import type { UploadDropzoneProps } from './types';

export function UploadDropzone({ onUpload, isUploading }: UploadDropzoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles);
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    multiple: true,
    disabled: isUploading,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50',
        isUploading && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Đang phân tích ảnh với AI...</p>
        </div>
      ) : isDragActive ? (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-10 h-10 text-primary" />
          <p className="text-sm font-medium">Thả ảnh vào đây!</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm font-medium">Kéo thả ảnh hoặc click để chọn</p>
          <p className="text-xs text-muted-foreground">
            AI sẽ phân tích và phân loại ảnh tự động
          </p>
        </div>
      )}
    </div>
  );
}
