/**
 * 🔔 Intelligent Alerts Component
 *
 * Displays intelligent alerts detected by AI monitoring
 *
 * @author LongSang Admin
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, X, CheckCircle, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Alert {
  id: string;
  type: 'anomaly' | 'threshold' | 'pattern' | 'opportunity';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  detected_at: string;
  suggested_workflow_id?: string;
  auto_resolve: boolean;
  resolved_at?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const SEVERITY_CONFIG = {
  critical: {
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  warning: {
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: <AlertTriangle className="w-4 h-4" />,
  },
  info: {
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: <Info className="w-4 h-4" />,
  },
};

export function IntelligentAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/ai/alerts`);
      const data = await response.json();

      if (data.success) {
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/ai/alerts/${id}/resolve`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        setAlerts((prev) => prev.filter((a) => a.id !== id));
        toast({
          title: 'Đã giải quyết',
          description: 'Alert đã được resolve',
        });
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể resolve alert',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-muted-foreground">Đang tải alerts...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return null;
  }

  // Filter unresolved alerts
  const unresolved = alerts.filter((a) => !a.resolved_at);

  if (unresolved.length === 0) {
    return null;
  }

  // Group by severity
  const critical = unresolved.filter((a) => a.severity === 'critical');
  const warnings = unresolved.filter((a) => a.severity === 'warning');
  const info = unresolved.filter((a) => a.severity === 'info');

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold">🔔 Intelligent Alerts</h3>
          <Badge variant="destructive">{unresolved.length}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchAlerts}>
          Refresh
        </Button>
      </div>

      {/* Critical Alerts */}
      {critical.length > 0 && (
        <div className="space-y-2">
          {critical.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
          ))}
        </div>
      )}

      {/* Warning Alerts */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
          ))}
        </div>
      )}

      {/* Info Alerts */}
      {info.length > 0 && (
        <details className="space-y-2">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            {info.length} info alert(s)
          </summary>
          <div className="mt-2 space-y-2">
            {info.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onResolve={handleResolve} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function AlertCard({ alert, onResolve }: { alert: Alert; onResolve: (id: string) => void }) {
  const { toast } = useToast();
  const severityConfig = SEVERITY_CONFIG[alert.severity];

  return (
    <Card
      className={`border-l-4 ${
        alert.severity === 'critical'
          ? 'border-l-red-500'
          : alert.severity === 'warning'
            ? 'border-l-yellow-500'
            : 'border-l-blue-500'
      }`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {severityConfig.icon}
              <CardTitle className="text-base">{alert.type}</CardTitle>
              <Badge className={severityConfig.color}>{alert.severity}</Badge>
            </div>
            <CardDescription className="text-sm">{alert.message}</CardDescription>
            <div className="mt-2 text-xs text-muted-foreground">
              Detected: {new Date(alert.detected_at).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-2">
          {alert.suggested_workflow_id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // TODO: Execute suggested workflow
                toast({
                  title: 'Thực hiện workflow',
                  description: 'Workflow sẽ được thực hiện',
                });
              }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Thực hiện workflow
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onResolve(alert.id)}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Resolve
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
