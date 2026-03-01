/**
 * Shared helper functions for Social Media Connections Dashboard
 */

import { Badge } from '@/components/ui/badge';
import type { SocialAccount } from './types';

export const getTokenStatusBadge = (status: SocialAccount['tokenStatus']) => {
  switch (status) {
    case 'permanent':
      return <Badge className="bg-green-500">♾️ Permanent</Badge>;
    case 'active':
      return <Badge className="bg-blue-500">✅ Active</Badge>;
    case 'expiring':
      return <Badge className="bg-yellow-500">⚠️ Expiring Soon</Badge>;
    case 'expired':
      return <Badge className="bg-red-500">❌ Expired</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
