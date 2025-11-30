/**
 * 🔌 Service Status Component
 * 
 * Shows status of backend services (n8n, API, etc.)
 * Only visible in Electron desktop app.
 */

import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Play, 
  Square,
  ExternalLink,
  Server,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useElectron, isElectron } from '@/hooks/useElectron';
import { cn } from '@/lib/utils';

interface ServiceInfo {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  port: number;
  editorUrl?: string;
}

const SERVICES: ServiceInfo[] = [
  {
    name: 'n8n',
    displayName: 'n8n Workflows',
    icon: <Server className="h-4 w-4" />,
    port: 5678,
    editorUrl: 'http://localhost:5678',
  },
  {
    name: 'vite',
    displayName: 'Vite Dev Server',
    icon: <Server className="h-4 w-4" />,
    port: 8080,
  },
];

interface ServiceStatusItemProps {
  readonly service: ServiceInfo;
}

function ServiceStatusItem({ service }: Readonly<ServiceStatusItemProps>) {
  const { getServiceStatus, startService, stopService, restartService, openExternal } = useElectron();
  const [status, setStatus] = useState<'stopped' | 'starting' | 'running' | 'stopping' | 'error'>('stopped');
  const [loading, setLoading] = useState(false);

  // Fetch status
  useEffect(() => {
    const fetchStatus = async () => {
      const result = await getServiceStatus(service.name);
      if (result) {
        setStatus(result.status);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, [service.name, getServiceStatus]);

  const handleStart = async () => {
    setLoading(true);
    await startService(service.name);
    setLoading(false);
  };

  const handleStop = async () => {
    setLoading(true);
    await stopService(service.name);
    setLoading(false);
  };

  const handleRestart = async () => {
    setLoading(true);
    await restartService(service.name);
    setLoading(false);
  };

  const handleOpenEditor = () => {
    if (service.editorUrl) {
      openExternal(service.editorUrl);
    }
  };

  const isRunning = status === 'running';
  const isStarting = status === 'starting';
  const isStopping = status === 'stopping';

  // Helper to get status-based classes
  const getStatusClasses = () => {
    if (isRunning) return "bg-green-500/20 text-green-500";
    if (isStarting || isStopping) return "bg-yellow-500/20 text-yellow-500";
    return "bg-red-500/20 text-red-500";
  };

  // Helper to get status icon
  const getStatusIcon = () => {
    if (isStarting || isStopping || loading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isRunning) {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    return <XCircle className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* Status Icon */}
        <div className={cn(
          "p-2 rounded-full",
          getStatusClasses()
        )}>
          {getStatusIcon()}
        </div>

        {/* Service Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{service.displayName}</span>
            <Badge variant={isRunning ? "default" : "secondary"} className="text-xs">
              Port {service.port}
            </Badge>
          </div>
          <span className="text-xs text-muted-foreground capitalize">
            {status}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {service.editorUrl && isRunning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={handleOpenEditor}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open Editor</TooltipContent>
          </Tooltip>
        )}

        {isRunning ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleRestart}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restart</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-red-500 hover:text-red-600"
                  onClick={handleStop}
                  disabled={loading}
                >
                  <Square className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-green-500 hover:text-green-600"
                onClick={handleStart}
                disabled={loading || isStarting}
              >
                <Play className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

export function ServiceStatusPanel() {
  // Only show in Electron
  if (!isElectron()) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="h-5 w-5" />
          Services
        </CardTitle>
        <CardDescription>
          Manage backend services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {SERVICES.map((service) => (
          <ServiceStatusItem key={service.name} service={service} />
        ))}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar/header
export function ServiceStatusBadges() {
  const { getServiceStatus } = useElectron();
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isElectron()) return;

    const fetchAll = async () => {
      const results: Record<string, boolean> = {};
      for (const service of SERVICES) {
        const status = await getServiceStatus(service.name);
        results[service.name] = status?.running ?? false;
      }
      setStatuses(results);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 10000);

    return () => clearInterval(interval);
  }, [getServiceStatus]);

  if (!isElectron()) return null;

  return (
    <div className="flex items-center gap-2">
      {SERVICES.map((service) => (
        <Tooltip key={service.name}>
          <TooltipTrigger asChild>
            <div className={cn(
              "w-2 h-2 rounded-full",
              statuses[service.name] ? "bg-green-500" : "bg-red-500"
            )} />
          </TooltipTrigger>
          <TooltipContent>
            {service.displayName}: {statuses[service.name] ? 'Running' : 'Stopped'}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export default ServiceStatusPanel;
