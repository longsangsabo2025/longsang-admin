/**
 * Domain View Page
 * Dedicated page for viewing and managing a single domain
 */

import { CoreLogicDistillation } from "@/brain/components/CoreLogicDistillation";
import { CoreLogicViewer } from "@/brain/components/CoreLogicViewer";
import { CoreLogicComparison } from "@/brain/components/CoreLogicComparison";
import { KnowledgeAnalysis } from "@/brain/components/KnowledgeAnalysis";
import { DomainAgent } from "@/brain/components/DomainAgent";
import { DomainSettings } from "@/brain/components/DomainSettings";
import { DomainStatistics } from "@/brain/components/DomainStatistics";
import { KnowledgeIngestion } from "@/brain/components/KnowledgeIngestion";
import { KnowledgeSearch } from "@/brain/components/KnowledgeSearch";
import { useDomain } from "@/brain/hooks/useDomains";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, Navigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Bot, BookOpen, Search, Settings, Sparkles, GitCompare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function DomainView() {
  const { id } = useParams<{ id: string }>();
  const { data: domain, isLoading, error } = useDomain(id || null);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div>Loading domain...</div>
      </div>
    );
  }

  if (error || !domain) {
    return <Navigate to="/brain" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/brain">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{domain.name}</h1>
            {domain.description && (
              <p className="text-muted-foreground">{domain.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-8">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <BookOpen className="h-4 w-4 mr-2" />
            Knowledge
          </TabsTrigger>
          <TabsTrigger value="core-logic">
            <Sparkles className="h-4 w-4 mr-2" />
            Core Logic
          </TabsTrigger>
          <TabsTrigger value="distillation">
            <Sparkles className="h-4 w-4 mr-2" />
            Distill
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <GitCompare className="h-4 w-4 mr-2" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="agent">
            <Bot className="h-4 w-4 mr-2" />
            Agent
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <DomainStatistics domainId={domain.id} />
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Add Knowledge</CardTitle>
              <CardDescription>Add new knowledge to this domain</CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeIngestion selectedDomainId={domain.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Core Logic Tab */}
        <TabsContent value="core-logic">
          <CoreLogicViewer domainId={domain.id} />
        </TabsContent>

        {/* Distillation Tab */}
        <TabsContent value="distillation">
          <CoreLogicDistillation domainId={domain.id} />
        </TabsContent>

        {/* Comparison Tab */}
        <TabsContent value="comparison">
          <CoreLogicComparison domainId={domain.id} />
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis">
          <KnowledgeAnalysis domainId={domain.id} />
        </TabsContent>

        {/* Agent Tab */}
        <TabsContent value="agent">
          <DomainAgent domainId={domain.id} domainName={domain.name} />
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search">
          <Card>
            <CardHeader>
              <CardTitle>Search Knowledge</CardTitle>
              <CardDescription>Search within this domain</CardDescription>
            </CardHeader>
            <CardContent>
              <KnowledgeSearch selectedDomainId={domain.id} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <DomainSettings domainId={domain.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

