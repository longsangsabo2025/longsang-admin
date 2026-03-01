import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MediaLibrary, MediaFile } from './MediaLibrary';
import { Image, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImagePickerProps {
  /** Current image URL */
  value?: string;
  /** Called when image changes */
  onChange?: (url: string | undefined) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Additional class names */
  className?: string;
  /** Aspect ratio: "square" | "video" | "banner" */
  aspect?: 'square' | 'video' | 'banner';
  /** Disabled state */
  disabled?: boolean;
}

const aspectClasses = {
  square: 'aspect-square',
  video: 'aspect-video',
  banner: 'aspect-[3/1]',
};

export const ImagePicker = ({
  value,
  onChange,
  placeholder = 'Chọn ảnh',
  className,
  aspect = 'video',
  disabled = false,
}: ImagePickerProps) => {
  const [loading, setLoading] = useState(false);

  const handleSelect = (files: MediaFile[]) => {
    if (files.length > 0) {
      const file = files[0];
      // Convert Google Drive URL to direct image link
      const imageUrl = file.thumbnail || file.url;
      onChange?.(imageUrl);
    }
  };

  const handleRemove = () => {
    onChange?.(undefined);
  };

  return (
    <div className={cn('relative', className)}>
      {value ? (
        <div
          className={cn(
            'relative rounded-lg overflow-hidden border bg-muted',
            aspectClasses[aspect]
          )}
        >
          <img
            src={value}
            alt="Selected"
            className="w-full h-full object-cover"
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!disabled && (
            <div className="absolute top-2 right-2 flex gap-1">
              <MediaLibrary
                trigger={
                  <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Image className="h-4 w-4" />
                  </Button>
                }
                accept="image"
                onSelect={handleSelect}
                title="Thay đổi ảnh"
              />
              <Button size="icon" variant="destructive" className="h-8 w-8" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <MediaLibrary
          trigger={
            <div
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed cursor-pointer hover:border-primary hover:bg-accent transition-colors',
                aspectClasses[aspect],
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Image className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">{placeholder}</span>
              <span className="text-xs text-muted-foreground mt-1">Click để chọn từ thư viện</span>
            </div>
          }
          accept="image"
          onSelect={handleSelect}
          title="Chọn ảnh"
        />
      )}
    </div>
  );
};

export default ImagePicker;
