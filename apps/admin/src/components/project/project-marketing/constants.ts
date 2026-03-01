/**
 * Constants for ProjectMarketingTab
 */

import {
  Edit,
  Clock,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
} from 'lucide-react';
import {
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTiktok,
} from 'react-icons/fa';

export const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877f2' },
  { id: 'linkedin', name: 'LinkedIn', icon: FaLinkedin, color: '#0a66c2' },
  { id: 'twitter', name: 'Twitter/X', icon: FaTwitter, color: '#1da1f2' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#e4405f' },
  { id: 'youtube', name: 'YouTube', icon: FaYoutube, color: '#ff0000' },
  { id: 'tiktok', name: 'TikTok', icon: FaTiktok, color: '#000000' },
  { id: 'threads', name: 'Threads', icon: FaInstagram, color: '#000000' },
] as const;

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Nháp', color: 'bg-gray-500', icon: Edit },
  scheduled: { label: 'Đã lên lịch', color: 'bg-blue-500', icon: Clock },
  running: { label: 'Đang chạy', color: 'bg-green-500', icon: PlayCircle },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-500', icon: CheckCircle2 },
  paused: { label: 'Tạm dừng', color: 'bg-amber-500', icon: PauseCircle },
  pending: { label: 'Chờ đăng', color: 'bg-blue-500', icon: Clock },
  posted: { label: 'Đã đăng', color: 'bg-green-500', icon: CheckCircle2 },
  published: { label: 'Đã đăng', color: 'bg-green-500', icon: CheckCircle2 },
  failed: { label: 'Thất bại', color: 'bg-red-500', icon: XCircle },
};
