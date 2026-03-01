/**
 * ImageCard component - displays a single image with hover actions
 */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Image as ImageIcon,
  User,
  Star,
  StarOff,
  Trash2,
  Edit,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_ICONS, CATEGORY_COLORS } from './constants';
import type { ImageCardProps } from './types';

export function ImageCard({
  image,
  onSelect,
  onEdit,
  onDelete,
  onToggleFavorite,
  selected,
  compact = false,
}: ImageCardProps) {
  const CategoryIcon = CATEGORY_ICONS[image.analysis.primaryCategory] || ImageIcon;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden cursor-pointer transition-all',
        selected && 'ring-2 ring-primary',
        compact ? 'h-32' : 'h-48'
      )}
      onClick={() => onSelect?.(image)}
    >
      {/* Image */}
      <div className="absolute inset-0">
        <img
          src={image.thumbnailUrl || image.imageUrl}
          alt={image.analysis?.title || 'Image'}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            console.error('[ImageCard] Failed to load image:', image.imageUrl);
            (e.target as HTMLImageElement).src = '/placeholder-image.png';
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Category Badge */}
      <div className="absolute top-2 left-2">
        <Badge className={cn('text-white text-xs', CATEGORY_COLORS[image.analysis.primaryCategory])}>
          <CategoryIcon className="w-3 h-3 mr-1" />
          {image.analysis.primaryCategory}
        </Badge>
      </div>

      {/* Favorite */}
      {image.isFavorite && (
        <div className="absolute top-2 right-2">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
        </div>
      )}

      {/* Owner Portrait Badge */}
      {image.isOwnerPortrait && (
        <div className="absolute top-8 left-2">
          <Badge variant="secondary" className="text-xs bg-purple-600 text-white">
            <User className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        </div>
      )}

      {/* Hover Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-white text-xs font-medium line-clamp-2 mb-2">
          {image.customTitle || image.analysis.title}
        </p>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(image);
            }}
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(image.id, image.isFavorite);
            }}
          >
            {image.isFavorite ? (
              <StarOff className="w-3 h-3" />
            ) : (
              <Star className="w-3 h-3" />
            )}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-6 px-2 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(image.id);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Selected Indicator */}
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </Card>
  );
}
