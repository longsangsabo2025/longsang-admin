import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, User } from 'lucide-react';
import { UserRole } from '@/types/roles';
import { cn } from '@/lib/utils';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const ROLE_CONFIG: Record<UserRole, {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  icon: typeof Shield;
  className: string;
}> = {
  admin: {
    label: 'Admin',
    variant: 'default',
    icon: ShieldCheck,
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  manager: {
    label: 'Manager',
    variant: 'default',
    icon: Shield,
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  user: {
    label: 'User',
    variant: 'secondary',
    icon: User,
    className: '',
  },
};

export function RoleBadge({ role, size = 'md', showIcon = true, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };
  
  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14,
  };

  return (
    <Badge 
      variant={config.variant}
      className={cn(sizeClasses[size], config.className, className)}
    >
      {showIcon && <Icon size={iconSizes[size]} className="mr-1" />}
      {config.label}
    </Badge>
  );
}
