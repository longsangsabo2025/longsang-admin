/**
 * Brain Dashboard Page
 * Main interface for AI Second Brain
 * 
 * Architecture: Knowledge Harvesting System
 * - Multiple input sources (YouTube, News, Social, Files)
 * - AI-powered extraction and analysis
 * - Structured knowledge storage with vector embeddings
 */

import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy-load all tab components for code splitting (~250KB saved)
const BulkOperations = lazy(() => import('@/brain/components/BulkOperations').then(m => ({ default: m.BulkOperations })));
const DomainManager = lazy(() => import('@/brain/components/DomainManager').then(m => ({ default: m.DomainManager })));
import { DocumentationViewer } from '@/brain/components/DocumentationViewer';
const KnowledgeIngestion = lazy(() => import('@/brain/components/KnowledgeIngestion').then(m => ({ default: m.KnowledgeIngestion })));
const YouTubeHarvester = lazy(() => import('@/brain/components/YouTubeHarvester').then(m => ({ default: m.YouTubeHarvester })));
const NewsHarvester = lazy(() => import('@/brain/components/NewsHarvester').then(m => ({ default: m.NewsHarvester })));
const SocialHarvester = lazy(() => import('@/brain/components/SocialHarvester').then(m => ({ default: m.SocialHarvester })));
const FileHarvester = lazy(() => import('@/brain/components/FileHarvester').then(m => ({ default: m.FileHarvester })));
const AudioHarvester = lazy(() => import('@/brain/components/AudioHarvester').then(m => ({ default: m.AudioHarvester })));
const KnowledgeManager = lazy(() => import('@/brain/components/KnowledgeManager').then(m => ({ default: m.KnowledgeManager })));
const KnowledgeSearch = lazy(() => import('@/brain/components/KnowledgeSearch').then(m => ({ default: m.KnowledgeSearch })));
const MultiDomainQuery = lazy(() => import('@/brain/components/MultiDomainQuery').then(m => ({ default: m.MultiDomainQuery })));
const MasterBrainInterface = lazy(() => import('@/brain/components/MasterBrainInterface').then(m => ({ default: m.MasterBrainInterface })));
const KnowledgeGraphVisualizer = lazy(() => import('@/brain/components/KnowledgeGraphVisualizer').then(m => ({ default: m.KnowledgeGraphVisualizer })));
const DomainRouter = lazy(() => import('@/brain/components/DomainRouter').then(m => ({ default: m.DomainRouter })));
const ImageBrainLibrary = lazy(() => import('@/brain/components/ImageBrainLibrary').then(m => ({ default: m.ImageBrainLibrary })));
import { useDomains } from '@/brain/hooks/useDomains';
import { useCoreLogic } from '@/brain/hooks/useCoreLogic';

const TabLoader = () => (
  <div className="flex items-center justify-center min-h-[300px]">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Youtube,
  Newspaper,
  Twitter,
  FileText,
  Mic,
  Zap,
  ImageIcon,
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
            <div>
              <h1 className="text-4xl font-bold">AI Second Brain</h1>
              <p className="text-muted-foreground">
                Your Personal Knowledge Operating System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Zap className="h-3 w-3 mr-1" />
              {domains?.length || 0} Domains
            </Badge>
            <DocumentationViewer />
          </div>
        </div>
      </div>

      {/* Quick Stats - Core Logic Preview */}
      {domains && domains.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          {domains.slice(0, 3).map((domain) => (
            <DomainCoreLogicPreview key={domain.id} domainId={domain.id} domainName={domain.name} />
          ))}
        </div>
      )}

      {/* Main Navigation Tabs - Horizontal */}
      <Tabs defaultValue="harvesters" className="space-y-6">
        {/* Primary Tab Navigation */}
        <TabsList className="h-auto p-1 bg-muted/50">
          <div className="flex flex-wrap gap-1">
            {/* Knowledge Harvesters Group */}
            <TabsTrigger value="harvesters" className="flex items-center gap-2 px-4">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Harvesters</span>
            </TabsTrigger>
            
            {/* Knowledge Management Group */}
            <TabsTrigger value="domains" className="flex items-center gap-2 px-4">
              <FolderOpen className="h-4 w-4" />
              <span>Domains</span>
            </TabsTrigger>
            
            <TabsTrigger value="manager" className="flex items-center gap-2 px-4">
              <Database className="h-4 w-4" />
              <span>Manage</span>
            </TabsTrigger>
            
            <TabsTrigger value="knowledge" className="flex items-center gap-2 px-4">
              <BookOpen className="h-4 w-4" />
              <span>Add Manual</span>
            </TabsTrigger>
            
            <TabsTrigger value="bulk" className="flex items-center gap-2 px-4">
              <Upload className="h-4 w-4" />
              <span>Bulk</span>
            </TabsTrigger>

            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Query & Intelligence Group */}
            <TabsTrigger value="search" className="flex items-center gap-2 px-4">
              <Search className="h-4 w-4" />
              <span>Search</span>
            </TabsTrigger>
            
            <TabsTrigger value="master-brain" className="flex items-center gap-2 px-4">
              <Brain className="h-4 w-4 text-purple-500" />
              <span>Master Brain</span>
            </TabsTrigger>
            
            <TabsTrigger value="multi-domain" className="flex items-center gap-2 px-4">
              <Globe className="h-4 w-4" />
              <span>Multi-Query</span>
            </TabsTrigger>

            <Separator orientation="vertical" className="h-6 mx-1" />
            
            {/* Advanced Tools Group */}
            <TabsTrigger value="graph" className="flex items-center gap-2 px-4">
              <Network className="h-4 w-4 text-blue-500" />
              <span>Graph</span>
            </TabsTrigger>
            
            <TabsTrigger value="router" className="flex items-center gap-2 px-4">
              <Route className="h-4 w-4" />
              <span>Router</span>
            </TabsTrigger>
            
            <TabsTrigger value="image-library" className="flex items-center gap-2 px-4">
              <ImageIcon className="h-4 w-4 text-pink-500" />
              <span>🖼️ Image Library</span>
            </TabsTrigger>
          </div>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* KNOWLEDGE HARVESTERS TAB - The Content Collection Machine */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="harvesters" className="space-y-6">
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Zap className="h-6 w-6 text-yellow-500" />
                    Knowledge Harvesters
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Thu gom kiến thức tự động từ nhiều nguồn khác nhau
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  5 Sources Available
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Harvester Sub-Tabs */}
              <Tabs defaultValue="youtube" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5 h-auto">
                  <TabsTrigger value="youtube" className="flex flex-col items-center gap-1 py-3">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <span className="text-xs">YouTube</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="news" className="flex flex-col items-center gap-1 py-3">
                    <Newspaper className="h-5 w-5 text-blue-500" />
                    <span className="text-xs">News</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="social" className="flex flex-col items-center gap-1 py-3">
                    <Twitter className="h-5 w-5 text-sky-500" />
                    <span className="text-xs">Social</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="files" className="flex flex-col items-center gap-1 py-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <span className="text-xs">Files</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="audio" className="flex flex-col items-center gap-1 py-3">
                    <Mic className="h-5 w-5 text-purple-500" />
                    <span className="text-xs">Audio</span>
                    <Badge variant="default" className="text-[10px] px-1.5 py-0">Active</Badge>
                  </TabsTrigger>
                </TabsList>

                {/* YouTube Harvester */}
                <TabsContent value="youtube" className="mt-4">
                  <Suspense fallback={<TabLoader />}>
                    <YouTubeHarvester selectedDomainId={selectedDomainId} />
                  </Suspense>
                </TabsContent>

                {/* News Harvester */}
                <TabsContent value="news" className="mt-4">
                  <Suspense fallback={<TabLoader />}>
                    <NewsHarvester selectedDomainId={selectedDomainId} />
                  </Suspense>
                </TabsContent>

                {/* Social Monitor */}
                <TabsContent value="social" className="mt-4">
                  <Suspense fallback={<TabLoader />}>
                    <SocialHarvester selectedDomainId={selectedDomainId} />
                  </Suspense>
                </TabsContent>

                {/* File Scanner */}
                <TabsContent value="files" className="mt-4">
                  <Suspense fallback={<TabLoader />}>
                    <FileHarvester selectedDomainId={selectedDomainId} />
                  </Suspense>
                </TabsContent>

                {/* Audio Harvester */}
                <TabsContent value="audio" className="mt-4">
                  <Suspense fallback={<TabLoader />}>
                    <AudioHarvester selectedDomainId={selectedDomainId} />
                  </Suspense>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* KNOWLEDGE MANAGEMENT TABS */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        
        {/* Domains Tab */}
        <TabsContent value="domains" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Manage Domains
              </CardTitle>
              <CardDescription>
                Organize your knowledge into domains (categories). Each domain can contain multiple
                knowledge items.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TabLoader />}>
                <DomainManager
                  onDomainSelect={setSelectedDomainId}
                  selectedDomainId={selectedDomainId}
                />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Manager Tab */}
        <TabsContent value="manager" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <KnowledgeManager selectedDomainId={selectedDomainId} />
          </Suspense>
        </TabsContent>

        {/* Knowledge Ingestion Tab */}
        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Add Knowledge Manually
              </CardTitle>
              <CardDescription>
                Add new knowledge to your brain. The system will automatically generate embeddings
                for semantic search.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TabLoader />}>
                <KnowledgeIngestion selectedDomainId={selectedDomainId} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Operations Tab */}
        <TabsContent value="bulk" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <BulkOperations domainId={selectedDomainId} />
          </Suspense>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* QUERY & INTELLIGENCE TABS */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search Knowledge
              </CardTitle>
              <CardDescription>
                Search your knowledge base using natural language. The AI will find the most
                relevant information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<TabLoader />}>
                <KnowledgeSearch selectedDomainId={selectedDomainId} />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Master Brain Tab */}
        <TabsContent value="master-brain" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <MasterBrainInterface />
          </Suspense>
        </TabsContent>

        {/* Multi-Domain Tab */}
        <TabsContent value="multi-domain" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <MultiDomainQuery />
          </Suspense>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* ADVANCED TOOLS TABS */}
        {/* ═══════════════════════════════════════════════════════════════ */}

        {/* Knowledge Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <KnowledgeGraphVisualizer />
          </Suspense>
        </TabsContent>

        {/* Domain Router Tab */}
        <TabsContent value="router" className="space-y-4">
          <Suspense fallback={<TabLoader />}>
            <DomainRouter />
          </Suspense>
        </TabsContent>

        {/* 🖼️ IMAGE LIBRARY TAB - Visual Memory for AI */}
        <TabsContent value="image-library" className="space-y-4">
          <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <ImageIcon className="h-6 w-6 text-pink-500" />
                    🖼️ Image Brain Library
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Thư viện ảnh thông minh với AI Vision Analysis & Semantic Search
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  GPT-4 Vision
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100vh-20rem)]">
              <Suspense fallback={<TabLoader />}>
                <ImageBrainLibrary
                  selectionMode={false}
                  onSelectImages={(images) => {
                    console.log('[Brain Dashboard] Selected images:', images);
                  }}
                />
              </Suspense>
            </CardContent>
          </Card>
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
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{domainName}</CardTitle>
          <Link to={`/brain/domain/${domainId}?tab=core-logic`}>
            <Sparkles className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {coreLogic ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <Badge variant="outline">{coreLogic.version || '1.0'}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Principles:</span>{' '}
                {coreLogic.firstPrinciples?.length ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Models:</span>{' '}
                {coreLogic.mentalModels?.length ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Rules:</span>{' '}
                {coreLogic.decisionRules?.length ?? 0}
              </div>
              <div>
                <span className="text-muted-foreground">Anti-patterns:</span>{' '}
                {coreLogic.antiPatterns?.length ?? 0}
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

/**
 * Coming Soon Card Component - Placeholder for future harvesters
 */
function ComingSoonCard({
  icon,
  title,
  features,
}: {
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly features: string[];
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 rounded-full bg-muted/50">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <Badge variant="secondary" className="mb-4">Coming Soon</Badge>
          </div>
          <div className="text-left w-full max-w-md">
            <p className="text-sm text-muted-foreground mb-3">Planned Features:</p>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
