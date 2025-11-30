/**
 * Knowledge Analysis Component
 * Displays knowledge patterns, concepts, relationships, and topics
 */

import { useAnalyzeDomain, useKnowledgePatterns, useKeyConcepts, useRelationships, useTopics } from "@/brain/hooks/useKnowledgeAnalysis";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp, Brain, Network, BookOpen, Loader2 } from "lucide-react";

interface KnowledgeAnalysisProps {
  domainId: string;
}

export function KnowledgeAnalysis({ domainId }: KnowledgeAnalysisProps) {
  const analyzeMutation = useAnalyzeDomain(domainId);
  const { data: patterns, isLoading: patternsLoading } = useKnowledgePatterns(domainId);
  const { data: concepts, isLoading: conceptsLoading } = useKeyConcepts(domainId);
  const { data: relationships, isLoading: relationshipsLoading } = useRelationships(domainId);
  const { data: topics, isLoading: topicsLoading } = useTopics(domainId);

  const handleAnalyze = async () => {
    try {
      await analyzeMutation.mutateAsync();
    // Data will be refreshed via queries
    window.location.reload(); // Simple refresh - could be improved with query invalidation
    // eslint-disable-next-line no-empty
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Knowledge Analysis</h2>
          <p className="text-muted-foreground">Patterns, concepts, and relationships in your knowledge</p>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzeMutation.isPending} variant="outline">
          {analyzeMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="patterns">
            <TrendingUp className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="concepts">
            <Brain className="h-4 w-4 mr-2" />
            Concepts
          </TabsTrigger>
          <TabsTrigger value="relationships">
            <Network className="h-4 w-4 mr-2" />
            Relationships
          </TabsTrigger>
          <TabsTrigger value="topics">
            <BookOpen className="h-4 w-4 mr-2" />
            Topics
          </TabsTrigger>
        </TabsList>

        {/* Patterns */}
        <TabsContent value="patterns">
          {patternsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin" />
              </CardContent>
            </Card>
          ) : patterns && patterns.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {patterns.map((pattern, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <Badge variant={pattern.frequency === "high" ? "default" : "secondary"}>
                        {pattern.frequency}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                    {pattern.examples && pattern.examples.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Examples:</p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                          {pattern.examples.map((example, eIdx) => (
                            <li key={eIdx}>{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No patterns identified. Run analysis to discover patterns.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Concepts */}
        <TabsContent value="concepts">
          {conceptsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin" />
              </CardContent>
            </Card>
          ) : concepts && concepts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {concepts.map((concept, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{concept.term}</CardTitle>
                      <Badge variant={concept.importance === "high" ? "default" : "secondary"}>
                        {concept.importance}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{concept.definition}</p>
                    {concept.relatedTerms && concept.relatedTerms.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Related Terms:</p>
                        <div className="flex flex-wrap gap-1">
                          {concept.relatedTerms.map((term, tIdx) => (
                            <Badge key={tIdx} variant="outline" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No concepts identified. Run analysis to extract concepts.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relationships */}
        <TabsContent value="relationships">
          {relationshipsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin" />
              </CardContent>
            </Card>
          ) : relationships && relationships.length > 0 ? (
            <div className="space-y-4">
              {relationships.map((rel, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <p className="font-semibold">{rel.concept1}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rel.type}</Badge>
                        <Badge variant={rel.strength === "strong" ? "default" : "secondary"}>
                          {rel.strength}
                        </Badge>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="font-semibold">{rel.concept2}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No relationships identified. Run analysis to discover relationships.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Topics */}
        <TabsContent value="topics">
          {topicsLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin" />
              </CardContent>
            </Card>
          ) : topics && topics.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {topics.map((topic, idx) => (
                <Card key={idx}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{topic.name}</CardTitle>
                      <Badge variant="outline">{topic.knowledgeCount} items</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{topic.description}</p>
                    {topic.keyConcepts && topic.keyConcepts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Key Concepts:</p>
                        <div className="flex flex-wrap gap-1">
                          {topic.keyConcepts.map((concept, cIdx) => (
                            <Badge key={cIdx} variant="secondary" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>No topics identified. Run analysis to discover topics.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

