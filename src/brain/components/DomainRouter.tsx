/**
 * Domain Router Component
 * Visualizes query routing decisions
 */

import { useRouteQuery, useRoutingHistory, useRelevantDomains } from "@/brain/hooks/useMultiDomain";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Route, History, TrendingUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DomainRouter() {
  const [query, setQuery] = useState("");
  const routeMutation = useRouteQuery();
  const { data: routingHistory } = useRoutingHistory(20);
  const { data: relevantDomains, isLoading: isLoadingRelevant } = useRelevantDomains(
    query.length > 3 ? query : null,
    5
  );

  const handleRoute = async () => {
    if (!query.trim()) return;
    await routeMutation.mutateAsync({ query: query.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Domain Router</h2>
        <p className="text-muted-foreground">
          Test and visualize how queries are routed to different domains
        </p>
      </div>

      {/* Route Query */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Route Query
          </CardTitle>
          <CardDescription>
            Enter a query to see which domains it would be routed to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRoute();
                }
              }}
              placeholder="Enter a query to route..."
              className="flex-1"
            />
            <Button onClick={handleRoute} disabled={routeMutation.isPending || !query.trim()}>
              {routeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Route className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Relevant Domains Preview */}
          {isLoadingRelevant && query.length > 3 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding relevant domains...
            </div>
          )}

          {relevantDomains && relevantDomains.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Preview - Relevant Domains:</p>
              <div className="space-y-2">
                {relevantDomains.map((domain) => (
                  <div key={domain.domainId} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-semibold">{domain.domainName}</p>
                      <p className="text-xs text-muted-foreground">Rank: {domain.rank}</p>
                    </div>
                    <Badge variant="secondary">{(domain.relevanceScore * 100).toFixed(1)}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Routing Result */}
          {routeMutation.data && (
            <div className="mt-4 p-4 bg-muted rounded-md">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold">Routing Decision</p>
                <Badge variant={routeMutation.data.routingConfidence > 0.7 ? "default" : "secondary"}>
                  Confidence: {(routeMutation.data.routingConfidence * 100).toFixed(1)}%
                </Badge>
              </div>
              <div className="space-y-2">
                {routeMutation.data.selectedDomains.map((domain) => (
                  <div key={domain.domainId} className="flex items-center justify-between p-2 bg-background rounded">
                    <div>
                      <p className="font-semibold">{domain.domainName}</p>
                      <p className="text-xs text-muted-foreground">Rank: {domain.rank}</p>
                    </div>
                    <Badge variant="outline">{(domain.relevanceScore * 100).toFixed(1)}%</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Routing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Routing History
          </CardTitle>
          <CardDescription>Recent query routing decisions</CardDescription>
        </CardHeader>
        <CardContent>
          {routingHistory && routingHistory.length > 0 ? (
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {routingHistory.map((entry) => (
                  <div key={entry.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-semibold line-clamp-1">{entry.queryText}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.createdAt), "MMM dd, yyyy HH:mm")}
                        </p>
                      </div>
                      <Badge variant={entry.routingConfidence > 0.7 ? "default" : "secondary"}>
                        {(entry.routingConfidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(entry.domainScores || {})
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([domainId, score]) => (
                          <Badge key={domainId} variant="outline" className="text-xs">
                            {domainId.substring(0, 8)}: {((score as number) * 100).toFixed(0)}%
                          </Badge>
                        ))}
                    </div>
                    {entry.userRating && (
                      <div className="mt-2 flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Rating: {entry.userRating}/5</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-muted-foreground py-8">No routing history yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

