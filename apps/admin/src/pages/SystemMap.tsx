/**
 * 🗺️ SYSTEM MAP - Interactive Connection Network
 *
 * Full visualization with:
 * - React Flow for interactive diagrams
 * - Real-time service health
 *
 * @author LongSang Admin
 * @version 2.0.0 (refactored)
 * @date 2025-11-29
 */

import { useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  ArrowRight,
  Bot,
  Brain,
  Layers,
  MousePointer,
  Network,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  useServiceHealth,
  FlowDiagram,
  StatsOverview,
  ServiceHealthGrid,
  initialNodes,
  initialEdges,
  aiArchitectureNodes,
  aiArchitectureEdges,
  soloHubNodes,
  soloHubEdges,
  mcpToolsNodes,
  mcpToolsEdges,
  dataFlowNodes,
  dataFlowEdges,
  visualWorkspaceNodes,
  visualWorkspaceEdges,
} from './system-map';

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SystemMap() {
  const { services, systemStatus, metrics, isChecking, lastFullCheck, checkAllServices } =
    useServiceHealth();
  const [activeTab, setActiveTab] = useState('architecture');

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Network className="h-8 w-8 text-primary" />
            System Map
          </h1>
          <p className="text-muted-foreground mt-1">
            Interactive architecture diagrams & service monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          {systemStatus?.initialized && (
            <Badge variant="outline" className="bg-green-100 text-green-700">
              <Zap className="h-3 w-3 mr-1" />
              Unified Connector Active
            </Badge>
          )}
          {lastFullCheck && (
            <span className="text-xs text-muted-foreground">
              Last check: {lastFullCheck.toLocaleTimeString()}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={checkAllServices} disabled={isChecking}>
            <RefreshCw className={cn('h-4 w-4 mr-2', isChecking && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview services={services} />

      {/* System Metrics from Unified Connector */}
      {metrics && Object.keys(metrics.requests || {}).length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Real-time Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(metrics.requests || {})
                .slice(0, 8)
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground truncate">{key}</span>
                    <span className="font-mono">{value as number}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
        <CardContent className="pt-4">
          <div className="flex items-start gap-4">
            <MousePointer className="h-6 w-6 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold">Interactive Diagrams</h3>
              <p className="text-sm text-muted-foreground">
                🖱️ <strong>Drag</strong> nodes to rearrange • 🔍 <strong>Scroll</strong> to zoom •
                📍 Use <strong>MiniMap</strong> for navigation • ⚡ <strong>Animated edges</strong>{' '}
                show active connections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-2 bg-transparent p-0">
          <TabsTrigger
            value="architecture"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Layers className="h-4 w-4" />
            Full Architecture
          </TabsTrigger>
          <TabsTrigger
            value="ai-architecture"
            className="gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
          >
            <Brain className="h-4 w-4" />
            🤖 AI Multi-Tier
          </TabsTrigger>
          <TabsTrigger
            value="solo-hub"
            className="gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Zap className="h-4 w-4" />
            🎯 Solo Founder Hub
          </TabsTrigger>
          <TabsTrigger
            value="mcp-tools"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Bot className="h-4 w-4" />
            MCP Tools (47)
          </TabsTrigger>
          <TabsTrigger
            value="data-flow"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <ArrowRight className="h-4 w-4" />
            Data Flow
          </TabsTrigger>
          <TabsTrigger
            value="visual-workspace"
            className="gap-2 data-[state=active]:bg-cyan-600 data-[state=active]:text-white"
          >
            <Zap className="h-4 w-4" />
            Visual Workspace
          </TabsTrigger>
          <TabsTrigger
            value="health"
            className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Activity className="h-4 w-4" />
            Service Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="architecture">
          <FlowDiagram
            nodes={initialNodes}
            edges={initialEdges}
            title="Full System Architecture"
            description="Complete connection map: Frontend → Backend → AI → Database → External APIs"
          />
        </TabsContent>

        <TabsContent value="ai-architecture">
          <FlowDiagram
            nodes={aiArchitectureNodes}
            edges={aiArchitectureEdges}
            title="🧠 AI Multi-Tier Architecture"
            description="5-Tier AI System: User → 6 Assistants → Intelligent Memory → AI Models (Gemini/GPT) → Brain RAG Knowledge Base"
          />
        </TabsContent>

        <TabsContent value="solo-hub">
          <FlowDiagram
            nodes={soloHubNodes}
            edges={soloHubEdges}
            title="🎯 Solo Founder Hub - AI Command Center"
            description="3-Tier Agent Hierarchy: CEO Agent → Department Agents (Marketing, Sales, Product, Finance) → Worker Agents → n8n Automations"
          />
        </TabsContent>

        <TabsContent value="mcp-tools">
          <FlowDiagram
            nodes={mcpToolsNodes}
            edges={mcpToolsEdges}
            title="MCP Server Tools"
            description="47 tools organized by category: File, Git, Gemini AI, Brain, YouTube, Drive, Calendar, SEO"
          />
        </TabsContent>

        <TabsContent value="data-flow">
          <FlowDiagram
            nodes={dataFlowNodes}
            edges={dataFlowEdges}
            title="Data Flow"
            description="Request flow from User → Vite → React → API/MCP → Database/AI"
          />
        </TabsContent>

        <TabsContent value="visual-workspace">
          <FlowDiagram
            nodes={visualWorkspaceNodes}
            edges={visualWorkspaceEdges}
            title="🛠️ Visual Workspace - 4-Layer Execution Engine"
            description="Core Feature: Chat → SSE Stream → 4 Layers (Planning → Orchestration → Execution → Learning) → AI Models → Actions"
          />
        </TabsContent>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Service Health Monitor
              </CardTitle>
              <CardDescription>Real-time status of all connected services</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceHealthGrid services={services} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
