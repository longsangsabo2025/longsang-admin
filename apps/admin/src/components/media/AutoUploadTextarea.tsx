/**
 * =================================================================
 * AUTO UPLOAD TEXTAREA
 * =================================================================
 * Textarea với tính năng auto-upload khi paste ảnh
 *
 * Usage:
 *   <AutoUploadTextarea
 *     value={content}
 *     onChange={setContent}
 *     onImageUpload={(url) => setImageUrl(url)}
 *     placeholder="Viết nội dung hoặc paste ảnh..."
 *   />
 */

import { useRef, useState, forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useClipboardUpload } from '@/hooks/useClipboardUpload';
import { Loader2, Image, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutoUploadTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Called when image is uploaded */
  onImageUpload?: (url: string, fileId: string) => void;
  /** Target folder in Google Drive */
  folderId?: string;
  /** Show upload status indicator */
  showStatus?: boolean;
  /** Insert image URL into textarea content */
  insertUrlIntoContent?: boolean;
}

export const AutoUploadTextarea = forwardRef<HTMLTextAreaElement, AutoUploadTextareaProps>(
  (
    {
      onImageUpload,
      folderId,
      showStatus = true,
      insertUrlIntoContent = false,
      className,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const [showUploadSuccess, setShowUploadSuccess] = useState(false);

    const { uploading, progress } = useClipboardUpload({
      targetRef: containerRef,
      folderId,
      onUpload: (url, fileId) => {
        // Insert URL into content if enabled
        if (insertUrlIntoContent && textareaRef.current) {
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const currentValue = String(value || '');
          const newValue =
            currentValue.substring(0, start) + `\n![image](${url})\n` + currentValue.substring(end);

          // Trigger onChange
          const event = {
            target: { value: newValue },
          } as React.ChangeEvent<HTMLTextAreaElement>;
          onChange?.(event);
        }

        // Callback
        onImageUpload?.(url, fileId);

        // Show success indicator
        setShowUploadSuccess(true);
        setTimeout(() => setShowUploadSuccess(false), 2000);
      },
      showToast: true,
    });

    return (
      <div ref={containerRef} className="relative">
        <Textarea
          ref={(node) => {
            // Handle both refs
            textareaRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          value={value}
          onChange={onChange}
          className={cn(
            'transition-all',
            uploading && 'border-blue-500 bg-blue-500/5',
            showUploadSuccess && 'border-green-500 bg-green-500/5',
            className
          )}
          {...props}
        />

        {/* Upload Status Overlay */}
        {showStatus && uploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-sm text-muted-foreground">Đang upload... {progress}%</span>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        {showStatus && (
          <div className="absolute right-2 bottom-2 flex items-center gap-1">
            {uploading && (
              <div className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Uploading...</span>
              </div>
            )}
            {showUploadSuccess && (
              <div className="flex items-center gap-1 text-xs text-green-500 bg-green-500/10 px-2 py-1 rounded animate-in fade-in">
                <CheckCircle2 className="h-3 w-3" />
                <span>Uploaded!</span>
              </div>
            )}
            {!uploading && !showUploadSuccess && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-50">
                <Image className="h-3 w-3" />
                <span>Paste ảnh để upload</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

AutoUploadTextarea.displayName = 'AutoUploadTextarea';

export default AutoUploadTextarea;
