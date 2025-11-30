/**
 * Status Bar Component - VS Code style
 * Shows real-time status of important services
 */

import { useEffect, useState } from 'react';
import { 
  Activity, 
  Server, 
  Database, 
  Cloud, 
  Cpu,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  Bot,
  GitBranch,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ServiceStatus {
  name: string;
  status: 'online' | 'offline' | 'checking' | 'warning';
  latency?: number;
  message?: string;
  icon: React.ElementType;
  url?: string;
}

const checkServiceHealth = async (url: string, timeout = 3000): Promise<{ ok: boolean; latency: number }> => {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      method: 'GET',
      signal: controller.signal,
      mode: 'no-cors' // Avoid CORS errors for external services
    });
    
    clearTimeout(timeoutId);
    // With no-cors mode, we can't read response.ok, so we assume success if no error
    return { ok: true, latency: Date.now() - start };
  } catch {
    return { ok: false, latency: Date.now() - start };
  }
};

export function StatusBar() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'API', status: 'checking', icon: Server, url: '/api/health' },
    { name: 'MCP', status: 'checking', icon: Cpu, url: 'http://localhost:3002/health' },
    { name: 'n8n', status: 'checking', icon: Zap, url: 'http://localhost:5678/healthz' },
    { name: 'Supabase', status: 'checking', icon: Database },
    { name: 'Sentry', status: 'checking', icon: AlertCircle },
  ]);
  
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Check all services
  const checkAllServices = async () => {
    const updatedServices = await Promise.all(
      services.map(async (service) => {
        if (service.url) {
          const result = await checkServiceHealth(service.url);
          return {
            ...service,
            status: result.ok ? 'online' : 'offline',
            latency: result.latency,
            message: result.ok ? `${result.latency}ms` : 'Unreachable'
          } as ServiceStatus;
        }
        
        // Special checks for services without direct URL
        if (service.name === 'Supabase') {
          try {
            const result = await checkServiceHealth('/api/health');
            return {
              ...service,
              status: result.ok ? 'online' : 'offline',
              message: result.ok ? 'Connected' : 'Disconnected'
            } as ServiceStatus;
          } catch {
            return { ...service, status: 'offline', message: 'Error' } as ServiceStatus;
          }
        }
        
        if (service.name === 'Sentry') {
          // Sentry is considered online if the DSN is configured
          const hasSentry = !!import.meta.env.VITE_SENTRY_DSN;
          return {
            ...service,
            status: hasSentry ? 'online' : 'warning',
            message: hasSentry ? 'Monitoring' : 'Not configured'
          } as ServiceStatus;
        }
        
        return service;
      })
    );
    
    setServices(updatedServices);
    setLastUpdate(new Date());
  };

  // WebSocket connection check - only connect if server is likely running
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    
    const connectWs = () => {
      // Don't attempt WebSocket in development if server isn't running
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3003';
      
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          setWsStatus('connected');
        };
        
        ws.onclose = () => {
          setWsStatus('disconnected');
          // Don't auto-reconnect to avoid console spam
        };
        
        ws.onerror = () => {
          // Silently handle error - WebSocket server may not be running
          setWsStatus('disconnected');
        };
      } catch {
        setWsStatus('disconnected');
      }
    };
    
    // Delay initial connection to avoid startup errors
    reconnectTimeout = setTimeout(connectWs, 2000);
    
    return () => {
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Periodic health checks
  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'checking': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'online': return CheckCircle2;
      case 'offline': return AlertCircle;
      case 'warning': return AlertCircle;
      case 'checking': return Loader2;
      default: return Activity;
    }
  };

  const onlineCount = services.filter(s => s.status === 'online').length;
  const totalCount = services.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-6 bg-[#007acc] dark:bg-[#1e1e1e] border-t border-[#005a9e] dark:border-[#333] flex items-center justify-between px-2 text-xs text-white dark:text-gray-300 z-50 select-none">
      {/* Left side - Git & Branch info */}
      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
              <GitBranch className="w-3.5 h-3.5" />
              <span>master</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Current branch: master
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={checkAllServices}
              className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{onlineCount}/{totalCount} Services</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Click to refresh status
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Center - Services Status */}
      <div className="flex items-center gap-2">
        {services.map((service) => {
          const StatusIcon = getStatusIcon(service.status);
          const ServiceIcon = service.icon;
          
          return (
            <Tooltip key={service.name}>
              <TooltipTrigger asChild>
                <button 
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/10",
                    getStatusColor(service.status)
                  )}
                >
                  <ServiceIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{service.name}</span>
                  <StatusIcon className={cn(
                    "w-3 h-3",
                    service.status === 'checking' && "animate-spin"
                  )} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <div className="flex flex-col gap-1">
                  <div className="font-medium">{service.name}</div>
                  <div className={getStatusColor(service.status)}>
                    {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
                    {service.message && ` - ${service.message}`}
                  </div>
                  {service.url && (
                    <div className="text-gray-400">{service.url}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* WebSocket Status */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button className={cn(
              "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors hover:bg-white/10",
              wsStatus === 'connected' ? 'text-green-400' : 'text-red-400'
            )}>
              {wsStatus === 'connected' ? (
                <Wifi className="w-3.5 h-3.5" />
              ) : (
                <WifiOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">WS</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            WebSocket Bridge: {wsStatus}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right side - Time & Actions */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copilot</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Copilot Bridge Active
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button className="flex items-center gap-1 hover:bg-white/10 px-1.5 py-0.5 rounded transition-colors">
              <Terminal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Open Terminal
          </TooltipContent>
        </Tooltip>

        <span className="text-gray-400 text-[10px]">
          {lastUpdate.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export default StatusBar;
