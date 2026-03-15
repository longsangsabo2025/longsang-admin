/**
 * Constants for ImageBrainLibrary
 */

import {
  Camera,
  Image as ImageIcon,
  MapPin,
  Palette,
  Shirt,
  Smile,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import type { ImageCategory } from '@/brain/types/image-memory.types';

export const CATEGORY_ICONS: Record<ImageCategory, React.ElementType> = {
  person: User,
  location: MapPin,
  object: ImageIcon,
  outfit: Shirt,
  mood: Smile,
  action: Zap,
  style: Palette,
  brand: Tag,
  character: User,
  scene: Camera,
  other: ImageIcon,
};

export const CATEGORY_COLORS: Record<ImageCategory, string> = {
  person: 'bg-blue-500',
  location: 'bg-green-500',
  object: 'bg-yellow-500',
  outfit: 'bg-purple-500',
  mood: 'bg-pink-500',
  action: 'bg-orange-500',
  style: 'bg-indigo-500',
  brand: 'bg-red-500',
  character: 'bg-cyan-500',
  scene: 'bg-emerald-500',
  other: 'bg-gray-500',
};
