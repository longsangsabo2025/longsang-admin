/**
 * Service health check hook for SystemMap
 */

import { useEffect, useState, useCallback } from 'react';
import type { ServiceHealth, ServiceStatus } from './shared';

// ============================================================
// SERVICE DEFINITIONS
// ============================================================

const SERVICES: Omit<ServiceHealth, 'status' | 'latency' | 'lastChecked'>[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'Database, Auth, Storage',
    url: import.meta.env.VITE_SUPABASE_URL,
    category: 'core',
  },
  {
    id: 'vite-dev',
    name: 'Vite Dev Server',
    description: 'Frontend :8080',
    port: 8080,
    category: 'core',
  },
  {
    id: 'api-server',
    name: 'API Server',
    description: 'Express :3001',
    port: 3001,
    category: 'core',
  },
  {
    id: 'mcp-server',
    name: 'MCP Server',
    description: 'Python :3002',
    port: 3002,
    category: 'ai',
    dependencies: ['gemini-api', 'vertex-ai'],
  },
  {
    id: 'gemini-api',
    name: 'Gemini AI',
    description: 'Google Gemini 2.5',
    url: 'https://generativelanguage.googleapis.com',
    category: 'ai',
  },
  {
    id: 'vertex-ai',
    name: 'Vertex AI',
    description: 'Imagen 3.0',
    url: 'https://us-central1-aiplatform.googleapis.com',
    category: 'ai',
  },
  {
    id: 'n8n',
    name: 'n8n Server',
    description: 'Workflows :5678',
    port: 5678,
    category: 'automation',
  },
  {
    id: 'youtube-api',
    name: 'YouTube API',
    description: 'Video management',
    url: 'https://www.googleapis.com/youtube/v3',
    category: 'external',
  },
  {
    id: 'drive-api',
    name: 'Google Drive',
    description: 'File storage',
    url: 'https://www.googleapis.com/drive/v3',
    category: 'storage',
  },
];

// ============================================================
// HELPERS
// ============================================================

function checkServiceConfig(serviceId: string): boolean {
  switch (serviceId) {
    case 'supabase':
      return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    case 'gemini-api':
    case 'vertex-ai':
    case 'youtube-api':
    case 'drive-api':
      return true;
    default:
      return false;
  }
}

// ============================================================
// HOOK
// ============================================================

export function useServiceHealth() {
  const [services, setServices] = useState<ServiceHealth[]>(
    SERVICES.map((s) => ({ ...s, status: 'unknown' as ServiceStatus }))
  );
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastFullCheck, setLastFullCheck] = useState<Date | null>(null);

  const checkService = useCallback(
    async (
      service: Omit<ServiceHealth, 'status' | 'latency' | 'lastChecked'>
    ): Promise<Partial<ServiceHealth>> => {
      const startTime = Date.now();

      try {
        if (service.port) {
          const response = await fetch(`http://localhost:${service.port}`, {
            method: 'HEAD',
            signal: AbortSignal.timeout(3000),
          }).catch(() => null);

          return {
            status: response ? 'online' : 'offline',
            latency: Date.now() - startTime,
            lastChecked: new Date(),
          };
        }

        if (service.url) {
          const hasConfig = checkServiceConfig(service.id);
          return {
            status: hasConfig ? 'online' : 'degraded',
            latency: 0,
            lastChecked: new Date(),
          };
        }

        return { status: 'unknown', lastChecked: new Date() };
      } catch {
        return { status: 'offline', lastChecked: new Date() };
      }
    },
    []
  );

  const fetchSystemStatus = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

      // Fetch system status from unified connector
      const [statusRes, metricsRes] = await Promise.all([
        fetch(`${apiUrl}/api/system/status`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${apiUrl}/api/system/metrics`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (statusRes?.success) {
        setSystemStatus(statusRes);
      }
      if (metricsRes?.success) {
        setMetrics(metricsRes);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  }, []);

  const checkAllServices = useCallback(async () => {
    setIsChecking(true);
    setServices((prev) => prev.map((s) => ({ ...s, status: 'checking' as ServiceStatus })));

    // Fetch from unified connector API
    await fetchSystemStatus();

    const results = await Promise.all(
      SERVICES.map(async (service) => {
        const result = await checkService(service);
        return { ...service, ...result } as ServiceHealth;
      })
    );

    setServices(results);
    setLastFullCheck(new Date());
    setIsChecking(false);
  }, [checkService, fetchSystemStatus]);

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, [checkAllServices]);

  return { services, systemStatus, metrics, isChecking, lastFullCheck, checkAllServices };
}
