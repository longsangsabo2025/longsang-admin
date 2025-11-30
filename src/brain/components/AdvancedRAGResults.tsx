/**
 * Advanced RAG Results Component
 * Displays results from advanced RAG search with reranking
 */

import type { MultiDomainQueryResult } from "@/brain/types/multi-domain.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, TrendingUp } from "lucide-react";

interface AdvancedRAGResultsProps {
  readonly results: MultiDomainQueryResult[];
  readonly query?: string;
}

export function AdvancedRAGResults({ results, query }: AdvancedRAGResultsProps) {
  if (!results || results.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">No results found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Advanced RAG Results
        </CardTitle>
        <CardDescription>
          {results.length} result{results.length !== 1 ? "s" : ""} found
          {query && ` for "${query}"`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div key={result.id || idx} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{result.title}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      {result.domainName && (
                        <Badge variant="outline" className="text-xs">
                          {result.domainName}
                        </Badge>
                      )}
                      {result.tags &&
                        result.tags.slice(0, 3).map((tag, tagIdx) => (
                          <Badge key={tagIdx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {result.combinedScore !== undefined && (
                      <Badge variant="default" className="text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {(result.combinedScore * 100).toFixed(1)}%
                      </Badge>
                    )}
                    {result.similarity !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3">{result.content}</p>
                {result.createdAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(result.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

