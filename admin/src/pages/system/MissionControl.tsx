/**
 * 🚀 MISSION CONTROL — Unified Command Center
 * Real-time ecosystem health, quick actions, automation status, revenue & costs.
 */

import { Activity, Calendar, CheckCircle2, RefreshCw, Rocket, Sparkles, Zap } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { WidgetGrid, WidgetSection } from '@/components/admin/WidgetGrid';
import { WidgetLayoutEditor } from '@/components/admin/WidgetLayoutEditor';
import {
  AIToolsStack,
  AutomationRevenue,
  CalendarQueue,
  EcosystemHealth,
  QuickActions,
  RecentActivity,
} from '@/components/mission-control';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useWidgetLayout } from '@/hooks/useWidgetLayout';

const MissionControl = () => {
  // Bridge for EcosystemHealth's checkAll → header & QuickActions
  const checkAllRef = useRef<() => Promise<void>>();
  const [isCheckingServices, setIsCheckingServices] = useState(false);

  const registerCheckAll = useCallback((fn: () => Promise<void>) => {
    checkAllRef.current = fn;
  }, []);

  const handleCheckAll = useCallback(() => {
    checkAllRef.current?.();
  }, []);

  // Widget layout system
  const widgetLayout = useWidgetLayout();

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* ── HEADER ─── */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            Mission Control
          </h1>
          <p className="text-muted-foreground mt-1">
            Unified command center for the LongSang ecosystem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <WidgetLayoutEditor
            layout={widgetLayout.layout}
            toggleVisibility={widgetLayout.toggleVisibility}
            moveUp={widgetLayout.moveUp}
            moveDown={widgetLayout.moveDown}
            resetLayout={widgetLayout.resetLayout}
          />
          <Button onClick={handleCheckAll} variant="outline" className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isCheckingServices ? 'animate-spin' : ''}`} />
            Check All Services
          </Button>
        </div>
      </div>

      <Separator />

      <WidgetGrid
        layout={widgetLayout.layout}
        onMoveUp={widgetLayout.moveUp}
        onMoveDown={widgetLayout.moveDown}
        onToggleVisibility={widgetLayout.toggleVisibility}
      >
        <WidgetSection
          id="ecosystem-health"
          title="Ecosystem Health"
          icon={<Activity className="h-5 w-5" />}
        >
          <EcosystemHealth
            registerCheckAll={registerCheckAll}
            onCheckingChange={setIsCheckingServices}
          />
        </WidgetSection>

        <WidgetSection id="quick-actions" title="Quick Actions" icon={<Zap className="h-5 w-5" />}>
          <QuickActions
            onCheckAllServices={handleCheckAll}
            isCheckingServices={isCheckingServices}
          />
        </WidgetSection>

        <WidgetSection id="ai-tools" title="AI Tools Stack" icon={<Sparkles className="h-5 w-5" />}>
          <AIToolsStack />
        </WidgetSection>

        <WidgetSection
          id="automation"
          title="Automation & Revenue"
          icon={<Sparkles className="h-5 w-5" />}
        >
          <AutomationRevenue />
        </WidgetSection>

        <WidgetSection
          id="calendar-queue"
          title="Calendar & Queue"
          icon={<Calendar className="h-5 w-5" />}
        >
          <CalendarQueue />
        </WidgetSection>

        <WidgetSection
          id="recent-activity"
          title="Recent Activity"
          icon={<CheckCircle2 className="h-5 w-5" />}
        >
          <RecentActivity />
        </WidgetSection>
      </WidgetGrid>
    </div>
  );
};

export default MissionControl;
