/**
 * 🧠 Model Intelligence Tab — Thin Orchestrator
 * Delegates to sub-components for each view mode.
 */

import { useState } from 'react';
import {
  Activity,
  BarChart3,
  Eye,
  Layers,
  Loader2,
  Zap,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MODEL_INTELLIGENCE } from '../shared-data';

import {
  useModelIntelligence,
  ModelOverviewStats,
  ModelRankingsView,
  ModelCardsView,
  ChannelMatrixView,
  ModelCompareView,
  ABTestView,
} from './model-intelligence';
import type { ViewMode } from './model-intelligence';

// ─── Component ────────────────────────────────────────────────────────────────

export const ModelIntelligenceTab = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('rankings');
  const hook = useModelIntelligence();

  if (hook.loadingPerf) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Overview Stats + Capacity + Alerts ─────────────────────────── */}
      <ModelOverviewStats
        totalProduction={hook.totalProduction}
        activeModels={hook.activeModels}
        totalModelsCount={Object.keys(MODEL_INTELLIGENCE).length}
        avgTime={hook.avgTime}
        topModel={hook.topModel}
        capacityData={hook.capacityData}
        alerts={hook.alerts}
      />

      {/* ── View Toggle ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant={viewMode === 'rankings' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('rankings')} className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Rankings
        </Button>
        <Button variant={viewMode === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('cards')} className="gap-1.5">
          <Layers className="h-3.5 w-3.5" /> Model Cards
        </Button>
        <Button variant={viewMode === 'matrix' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('matrix')} className="gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Channel Matrix
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <Button variant={viewMode === 'compare' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('compare')} className="gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Compare
        </Button>
        <Button variant={viewMode === 'ab-test' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('ab-test')} className="gap-1.5">
          <Zap className="h-3.5 w-3.5" /> A/B Test
        </Button>
      </div>

      {/* ── Active View ────────────────────────────────────────────────── */}
      {viewMode === 'rankings' && (
        <ModelRankingsView modelPerf={hook.modelPerf} />
      )}

      {viewMode === 'cards' && (
        <ModelCardsView modelPerf={hook.modelPerf} />
      )}

      {viewMode === 'matrix' && (
        <ChannelMatrixView
          channels={hook.channels}
          modelPerf={hook.modelPerf}
          totalProduction={hook.totalProduction}
          allModelIds={hook.allModelIds}
          switchModelMutation={hook.switchModelMutation}
        />
      )}

      {viewMode === 'compare' && (
        <ModelCompareView
          compareModels={hook.compareModels}
          setCompareModels={hook.setCompareModels}
          allModelIds={hook.allModelIds}
          modelPerf={hook.modelPerf}
        />
      )}

      {viewMode === 'ab-test' && (
        <ABTestView
          allModelIds={hook.allModelIds}
          abTestPrompt={hook.abTestPrompt}
          setAbTestPrompt={hook.setAbTestPrompt}
          abTestModels={hook.abTestModels}
          setAbTestModels={hook.setAbTestModels}
          abTestId={hook.abTestId}
          abTestData={hook.abTestData}
          abTestMutation={hook.abTestMutation}
        />
      )}
    </div>
  );
};
