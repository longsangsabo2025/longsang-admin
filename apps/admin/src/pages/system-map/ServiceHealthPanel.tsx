/**
 * Service health grid and status badge for SystemMap
 */

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, WifiOff, Loader2, AlertCircle, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServiceHealth, ServiceStatus } from './shared';

// ============================================================
// PROPS
// ============================================================

export interface StatusBadgeProps {
  status: ServiceStatus;
}

export interface ServiceHealthGridProps {
  services: ServiceHealth[];
}

// ============================================================
// STATUS BADGE
// ============================================================

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    online: { icon: CheckCircle2, color: 'text-green-600 bg-green-100', text: 'Online' },
    offline: { icon: WifiOff, color: 'text-red-600 bg-red-100', text: 'Offline' },
    checking: { icon: Loader2, color: 'text-yellow-600 bg-yellow-100', text: 'Checking' },
    degraded: { icon: AlertCircle, color: 'text-orange-600 bg-orange-100', text: 'Degraded' },
    unknown: { icon: Wifi, color: 'text-gray-600 bg-gray-100', text: 'Unknown' },
  };

  const { icon: Icon, color, text } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', color)}>
      <Icon className={cn('h-3 w-3', status === 'checking' && 'animate-spin')} />
      {text}
    </Badge>
  );
}

// ============================================================
// SERVICE HEALTH GRID
// ============================================================

export function ServiceHealthGrid({ services }: ServiceHealthGridProps) {
  const categorized = {
    core: services.filter((s) => s.category === 'core'),
    ai: services.filter((s) => s.category === 'ai'),
    automation: services.filter((s) => s.category === 'automation'),
    storage: services.filter((s) => s.category === 'storage'),
    external: services.filter((s) => s.category === 'external'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(categorized).map(
        ([category, items]) =>
          items.length > 0 && (
            <div key={category}>
              <h3 className="text-sm font-semibold uppercase text-muted-foreground mb-3">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((service) => (
                  <Card
                    key={service.id}
                    className={cn(
                      'transition-all',
                      service.status === 'online' && 'border-green-500/30 bg-green-500/5',
                      service.status === 'offline' && 'border-red-500/30 bg-red-500/5',
                      service.status === 'degraded' && 'border-orange-500/30 bg-orange-500/5'
                    )}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{service.name}</div>
                          <div className="text-xs text-muted-foreground">{service.description}</div>
                        </div>
                        <StatusBadge status={service.status} />
                      </div>
                      {service.latency !== undefined && service.latency > 0 && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Latency: {service.latency}ms
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
