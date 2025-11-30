/**
 * Core Logic Viewer Component
 * Displays core logic structure with first principles, mental models, etc.
 */

import { useCoreLogic } from "@/brain/hooks/useCoreLogic";
import type { CoreLogic } from "@/brain/types/core-logic.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbulb, Brain, CheckCircle, XCircle, Link2, Loader2 } from "lucide-react";

interface CoreLogicViewerProps {
  domainId: string;
}

export function CoreLogicViewer({ domainId }: CoreLogicViewerProps) {
  const { data: coreLogic, isLoading, error } = useCoreLogic(domainId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !coreLogic) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <p>No core logic available. Start distillation to generate core logic.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Core Logic</h2>
          <p className="text-muted-foreground">Version {coreLogic.version}</p>
        </div>
        <Badge variant={coreLogic.isActive ? "default" : "secondary"}>
          {coreLogic.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="principles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="principles">
            <Lightbulb className="h-4 w-4 mr-2" />
            First Principles ({coreLogic.firstPrinciples.length})
          </TabsTrigger>
          <TabsTrigger value="models">
            <Brain className="h-4 w-4 mr-2" />
            Mental Models ({coreLogic.mentalModels.length})
          </TabsTrigger>
          <TabsTrigger value="rules">
            <CheckCircle className="h-4 w-4 mr-2" />
            Decision Rules ({coreLogic.decisionRules.length})
          </TabsTrigger>
          <TabsTrigger value="anti-patterns">
            <XCircle className="h-4 w-4 mr-2" />
            Anti-patterns ({coreLogic.antiPatterns.length})
          </TabsTrigger>
          <TabsTrigger value="links">
            <Link2 className="h-4 w-4 mr-2" />
            Cross-domain Links ({coreLogic.crossDomainLinks.length})
          </TabsTrigger>
        </TabsList>

        {/* First Principles */}
        <TabsContent value="principles">
          <div className="space-y-4">
            {coreLogic.firstPrinciples.length > 0 ? (
              coreLogic.firstPrinciples.map((principle, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{principle.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{principle.description}</p>
                    {principle.examples && principle.examples.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Examples:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {principle.examples.map((example, eIdx) => (
                            <li key={eIdx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No first principles extracted yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Mental Models */}
        <TabsContent value="models">
          <div className="space-y-4">
            {coreLogic.mentalModels.length > 0 ? (
              coreLogic.mentalModels.map((model, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                    {model.application && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Application:</p>
                        <p className="text-sm text-muted-foreground">{model.application}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No mental models identified yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Decision Rules */}
        <TabsContent value="rules">
          <div className="space-y-4">
            {coreLogic.decisionRules.length > 0 ? (
              coreLogic.decisionRules.map((rule, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">Rule {idx + 1}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-semibold">Condition:</p>
                        <p className="text-sm text-muted-foreground">{rule.condition}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Action:</p>
                        <p className="text-sm text-muted-foreground">{rule.action}</p>
                      </div>
                      {rule.rationale && (
                        <div>
                          <p className="text-sm font-semibold">Rationale:</p>
                          <p className="text-sm text-muted-foreground">{rule.rationale}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No decision rules generated yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Anti-patterns */}
        <TabsContent value="anti-patterns">
          <div className="space-y-4">
            {coreLogic.antiPatterns.length > 0 ? (
              coreLogic.antiPatterns.map((pattern, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{pattern.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                    {pattern.alternative && (
                      <div>
                        <p className="text-sm font-semibold mb-2">Alternative:</p>
                        <p className="text-sm text-muted-foreground">{pattern.alternative}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No anti-patterns detected yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Cross-domain Links */}
        <TabsContent value="links">
          <div className="space-y-4">
            {coreLogic.crossDomainLinks.length > 0 ? (
              coreLogic.crossDomainLinks.map((link, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <CardTitle className="text-lg">{link.concept}</CardTitle>
                    <CardDescription>Domain: {link.domain}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{link.relationship}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <p>No cross-domain links identified yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Changelog */}
      {coreLogic.changelog && coreLogic.changelog.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Changelog</CardTitle>
            <CardDescription>History of changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {coreLogic.changelog.map((change, idx) => (
                <div key={idx} className="text-sm border-l-2 pl-3 py-1">
                  <p className="font-semibold">
                    Version {change.version} - {change.type}
                  </p>
                  {change.summary && <p className="text-muted-foreground">{change.summary}</p>}
                  <p className="text-xs text-muted-foreground">
                    {new Date(change.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

