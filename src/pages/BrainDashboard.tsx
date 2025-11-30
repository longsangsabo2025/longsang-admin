/**
 * Brain Dashboard Page
 * Main interface for AI Second Brain
 */

import { BulkOperations } from '@/brain/components/BulkOperations';
import { DomainManager } from '@/brain/components/DomainManager';
import { DocumentationViewer } from '@/brain/components/DocumentationViewer';
import { KnowledgeIngestion } from '@/brain/components/KnowledgeIngestion';
import { KnowledgeManager } from '@/brain/components/KnowledgeManager';
import { KnowledgeSearch } from '@/brain/components/KnowledgeSearch';
import { MultiDomainQuery } from '@/brain/components/MultiDomainQuery';
import { MasterBrainInterface } from '@/brain/components/MasterBrainInterface';
import { KnowledgeGraphVisualizer } from '@/brain/components/KnowledgeGraphVisualizer';
import { DomainRouter } from '@/brain/components/DomainRouter';
import { useDomains } from '@/brain/hooks/useDomains';
import { useCoreLogic } from '@/brain/hooks/useCoreLogic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Brain,
  FolderOpen,
  Search,
  Upload,
  Sparkles,
  Globe,
  Network,
  Route,
  Database,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function BrainDashboard() {
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const { data: domains } = useDomains();

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">AI Second Brain</h1>
          </div>
          <DocumentationViewer />
        </div>
        <p className="text-muted-foreground text-lg">
          Your personal knowledge management system powered by AI
        </p>
      </div>

      {/* Core Logic Overview */}
      {domains && domains.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {domains.slice(0, 3).map((domain) => (
            <DomainCoreLogicPreview key={domain.id} domainId={domain.id} domainName={domain.name} />
          ))}
        </div>
      )}

      {/* Main Content with Tabs */}
      <Tabs defaultValue="domains" className="space-y-6">
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="domains" className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Domains
          </TabsTrigger>
          <TabsTrigger value="manager" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Manage
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Add
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="multi-domain" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Multi
          </TabsTrigger>
          <TabsTrigger value="master-brain" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Brain
          </TabsTrigger>
          <TabsTrigger value="graph" className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            Graph
          </TabsTrigger>
          <TabsTrigger value="router" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Router
          </TabsTrigger>
          <TabsTrigger value="bulk" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk
          </TabsTrigger>
        </TabsList>

        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manage Domains</CardTitle>
              <CardDescription>
                Organize your knowledge into domains (categories). Each domain can contain multiple
                knowledge items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DomainManager
                onDomainSelect={setSelectedDomainId}
                selectedDomainId={selectedDomainId}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Manager Tab */}
        <TabsContent value="manager" className="space-y-4">
          <KnowledgeManager selectedDomainId={selectedDomainId} />
        </TabsContent>

        {/* Knowledge Ingestion Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Knowledge</CardTitle>
              <CardDescription>
                Add new knowledge to your brain. The system will automatically generate embeddings
                for semantic search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeIngestion selectedDomainId={selectedDomainId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Knowledge</CardTitle>
              <CardDescription>
                Search your knowledge base using natural language. The AI will find the most
                relevant information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeSearch selectedDomainId={selectedDomainId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-Domain Tab */}
        <TabsContent value="multi-domain" className="space-y-4">
          <MultiDomainQuery />
        </TabsContent>

        {/* Master Brain Tab */}
        <TabsContent value="master-brain" className="space-y-4">
          <MasterBrainInterface />
        </TabsContent>

        {/* Knowledge Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          <KnowledgeGraphVisualizer />
        </TabsContent>

        {/* Domain Router Tab */}
        <TabsContent value="router" className="space-y-4">
          <DomainRouter />
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <BulkOperations domainId={selectedDomainId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Domain Core Logic Preview Component
 */
function DomainCoreLogicPreview({
  domainId,
  domainName,
}: {
  readonly domainId: string;
  readonly domainName: string;
}) {
  const { data: coreLogic } = useCoreLogic(domainId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{domainName}</CardTitle>
          <Link to={`/brain/domain/${domainId}?tab=core-logic`}>
            <Sparkles className="h-4 w-4 text-muted-foreground hover:text-primary" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {coreLogic ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="outline">{coreLogic.version}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Principles:</span>{' '}
                {coreLogic.firstPrinciples.length}
              </div>
              <div>
                <span className="text-muted-foreground">Models:</span>{' '}
                {coreLogic.mentalModels.length}
              </div>
              <div>
                <span className="text-muted-foreground">Rules:</span>{' '}
                {coreLogic.decisionRules.length}
              </div>
              <div>
                <span className="text-muted-foreground">Anti-patterns:</span>{' '}
                {coreLogic.antiPatterns.length}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No core logic yet</p>
        )}
      </CardContent>
    </Card>
  );
}
