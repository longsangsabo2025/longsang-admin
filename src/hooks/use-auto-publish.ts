/**
 * =================================================================
 * USE AUTO-PUBLISH HOOK
 * =================================================================
 * React hook to manage auto-publish functionality
 */

import { useToast } from '@/hooks/use-toast';
import { getAutoPublishService } from '@/lib/automation/auto-publish-service';
import { useEffect, useState } from 'react';

export function useAutoPublish() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const service = getAutoPublishService();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const isEnabled = await service.isEnabled();
      setEnabled(isEnabled);
    } catch (error) {
      console.error('Failed to check auto-publish status:', error);
    } finally {
      setLoading(false);
    }
  };

  const processContent = async (contentId: string) => {
    try {
      await service.processContent(contentId);
      toast({
        title: '✅ Auto-Publish Triggered',
        description: 'Content is being published to social media',
      });
    } catch (error) {
      console.error('Failed to auto-publish:', error);
      toast({
        title: '❌ Auto-Publish Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  return {
    enabled,
    loading,
    processContent,
    refreshStatus: checkStatus,
  };
}
