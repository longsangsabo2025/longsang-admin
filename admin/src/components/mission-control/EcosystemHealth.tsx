import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Loader2, RefreshCw, Server, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  type CloudHealthResult,
  type EcosystemProduct,
  type HealthResult,
  PRODUCTS,
  pingService,
  RelativeTime,
  type ServiceStatus,
  StatusDot,
} from './mission-control.types';

interface EcosystemHealthProps {
  registerCheckAll?: (fn: () => Promise<void>) => void;
  onCheckingChange?: (isChecking: boolean) => void;
}

export function EcosystemHealth({ registerCheckAll, onCheckingChange }: EcosystemHealthProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [healthResults, setHealthResults] = useState<Record<string, HealthResult>>({});
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  // ── Cloud health data from Edge Function (v_latest_health view)
  const { data: cloudHealth = [] } = useQuery<CloudHealthResult[]>({
    queryKey: ['mission-control', 'cloud-health'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_latest_health')
        .select('product, status, response_ms, http_status, error, checked_at');
      if (error) {
        console.warn('v_latest_health:', error.message);
        return [];
      }
      return (data ?? []) as CloudHealthResult[];
    },
    refetchInterval: 60000,
  });

  // ── Realtime for ecosystem_health_logs
  useEffect(() => {
    const healthChannel = supabase
      .channel('health-logs-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ecosystem_health_logs' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mission-control', 'cloud-health'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(healthChannel);
    };
  }, [queryClient]);

  // ── Check single service health
  const checkHealth = useCallback(async (product: EcosystemProduct) => {
    setCheckingIds((prev) => new Set(prev).add(product.id));
    const { ok, latencyMs } = await pingService(product.url);
    const result: HealthResult = {
      id: product.id,
      status: ok ? 'up' : 'down',
      latencyMs,
      checkedAt: new Date().toISOString(),
    };
    setHealthResults((prev) => ({ ...prev, [product.id]: result }));
    setCheckingIds((prev) => {
      const next = new Set(prev);
      next.delete(product.id);
      return next;
    });
  }, []);

  // ── Check ALL services
  const checkAllServices = useCallback(async () => {
    await Promise.allSettled(PRODUCTS.filter((p) => p.url).map((p) => checkHealth(p)));
    toast({ title: 'Health check complete', description: 'All services have been pinged.' });
  }, [checkHealth, toast]);

  // Register checkAll with parent + report checking status
  useEffect(() => {
    registerCheckAll?.(checkAllServices);
  }, [checkAllServices, registerCheckAll]);

  useEffect(() => {
    onCheckingChange?.(checkingIds.size > 0);
  }, [checkingIds.size, onCheckingChange]);

  const getStatus = (id: string): ServiceStatus => {
    if (checkingIds.has(id)) return 'checking';
    if (healthResults[id]) return healthResults[id].status;
    const product = PRODUCTS.find((p) => p.id === id);
    if (product) {
      const cloud = cloudHealth.find(
        (h) => h.product.toLowerCase().replace(/\s+/g, '-') === id || product.name === h.product
      );
      if (cloud) return cloud.status === 'up' ? 'up' : 'down';
    }
    return 'unknown';
  };

  const getCloudCheck = (productName: string): CloudHealthResult | undefined => {
    return cloudHealth.find((h) => h.product === productName);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {PRODUCTS.map((product) => {
        const status = getStatus(product.id);
        const health = healthResults[product.id];
        const cloud = getCloudCheck(product.name);
        const Icon = product.icon;
        return (
          <Card key={product.id} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <StatusDot status={status} />
              </div>
              <CardTitle className="text-sm font-medium leading-tight">{product.name}</CardTitle>
              <CardDescription className="text-xs">{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {product.url ? (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  {product.displayUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{product.displayUrl}</span>
              )}

              {product.statusField && (
                <Badge variant="secondary" className="text-[10px]">
                  {product.statusField}
                </Badge>
              )}

              {/* Cloud health from Edge Function (15-min checks) */}
              {cloud && (
                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  Cloud: {cloud.status} {cloud.response_ms != null && `(${cloud.response_ms}ms)`}
                  {' · '}
                  <RelativeTime iso={cloud.checked_at} />
                </div>
              )}

              {status !== 'unknown' && (
                <Badge
                  variant={
                    status === 'up'
                      ? 'default'
                      : status === 'checking'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className="text-[10px]"
                >
                  {status === 'up' && <Wifi className="h-3 w-3 mr-1" />}
                  {status === 'down' && <WifiOff className="h-3 w-3 mr-1" />}
                  {status === 'checking' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  {status.toUpperCase()}
                  {health?.latencyMs != null && status === 'up' && ` ${health.latencyMs}ms`}
                </Badge>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs px-2"
                  disabled={checkingIds.has(product.id) || !product.url}
                  onClick={() => checkHealth(product)}
                >
                  {checkingIds.has(product.id) ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" /> Check
                    </>
                  )}
                </Button>
                {health && (
                  <span className="text-[10px] text-muted-foreground">
                    <RelativeTime iso={health.checkedAt} />
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
