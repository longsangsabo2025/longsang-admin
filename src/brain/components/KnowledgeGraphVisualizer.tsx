/**
 * Knowledge Graph Visualizer Component
 * Visualizes knowledge graph relationships
 */

import {
  useBuildGraph,
  useGraphStatistics,
  useRelatedConcepts,
  useTraverseGraph,
} from '@/brain/hooks/useKnowledgeGraph';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Network, Play, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDomains } from '@/brain/hooks/useDomains';

export function KnowledgeGraphVisualizer() {
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [startNodeId, setStartNodeId] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { data: domains } = useDomains();
  const buildGraphMutation = useBuildGraph();
  const { data: statistics } = useGraphStatistics(selectedDomainId);
  const { data: relatedConcepts } = useRelatedConcepts(selectedNodeId, 10);
  const traverseMutation = useTraverseGraph();

  const handleBuildGraph = async () => {
    if (!selectedDomainId) return;
    await buildGraphMutation.mutateAsync({ domainId: selectedDomainId });
  };

  const handleTraverse = async () => {
    if (!startNodeId.trim()) return;
    await traverseMutation.mutateAsync({ startNodeId: startNodeId.trim(), maxDepth });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Knowledge Graph</h2>
        <p className="text-muted-foreground">
          Visualize and explore relationships between concepts across your knowledge base
        </p>
      </div>

      {/* Build Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Build Knowledge Graph
          </CardTitle>
          <CardDescription>
            Build a knowledge graph from your domain's knowledge to discover relationships
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Domain</label>
            <Select value={selectedDomainId || ''} onValueChange={setSelectedDomainId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a domain" />
              </SelectTrigger>
              <SelectContent>
                {domains?.map((domain) => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={handleBuildGraph}
            disabled={!selectedDomainId || buildGraphMutation.isPending}
            className="w-full"
          >
            {buildGraphMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Network className="h-4 w-4 mr-2" />
            )}
            Build Graph
          </Button>
          {buildGraphMutation.data && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-semibold">Nodes created:</span>{' '}
                {buildGraphMutation.data.nodesCreated}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Edges created:</span>{' '}
                {buildGraphMutation.data.edgesCreated}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      {statistics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Graph Statistics
            </CardTitle>
            <CardDescription>Overview of your knowledge graph</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Nodes</p>
                <p className="text-2xl font-bold">{statistics.nodeCount}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Edges</p>
                <p className="text-2xl font-bold">{statistics.edgeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traverse Graph */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Traverse Graph
          </CardTitle>
          <CardDescription>Explore the graph starting from a specific node</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Start Node ID</label>
            <Input
              value={startNodeId}
              onChange={(e) => setStartNodeId(e.target.value)}
              placeholder="Enter node ID to start traversal"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Max Depth</label>
            <Input
              type="number"
              min="1"
              max="10"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number.parseInt(e.target.value, 10) || 3)}
            />
          </div>
          <Button
            onClick={handleTraverse}
            disabled={!startNodeId.trim() || traverseMutation.isPending}
            className="w-full"
          >
            {traverseMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Traverse
          </Button>
          {traverseMutation.data && traverseMutation.data.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Traversal Results:</p>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {traverseMutation.data.map((node, idx) => (
                  <div key={idx} className="p-2 border rounded text-sm">
                    <p className="font-semibold">{node.nodeLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      Type: {node.nodeType} | Depth: {node.depth}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Concepts */}
      {selectedNodeId && (
        <Card>
          <CardHeader>
            <CardTitle>Related Concepts</CardTitle>
            <CardDescription>Concepts related to the selected node</CardDescription>
          </CardHeader>
          <CardContent>
            {relatedConcepts && relatedConcepts.length > 0 ? (
              <div className="space-y-2">
                {relatedConcepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    onClick={() => setSelectedNodeId(concept.nodeId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold">{concept.nodeLabel}</p>
                      <Badge variant="outline">{(concept.similarityScore * 100).toFixed(0)}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type: {concept.nodeType} | Edge: {concept.edgeType}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No related concepts found. Select a node to explore.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Node Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Node</CardTitle>
          <CardDescription>Enter a node ID to explore its relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={selectedNodeId || ''}
            onChange={(e) => setSelectedNodeId(e.target.value || null)}
            placeholder="Enter node ID"
          />
        </CardContent>
      </Card>
    </div>
  );
}
