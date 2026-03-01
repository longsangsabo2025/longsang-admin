/**
 * Multi-Domain Query Component
 * Interface for querying across multiple domains
 */

import { useMultiDomainQuery, useRelevantDomains } from '@/brain/hooks/useMultiDomain';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Sparkles, Globe } from 'lucide-react';
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function MultiDomainQuery() {
  const [query, setQuery] = useState('');
  const [domainIds, setDomainIds] = useState<string[]>([]);
  const queryMutation = useMultiDomainQuery();
  const { data: relevantDomains, isLoading: isLoadingDomains } = useRelevantDomains(
    query.length > 3 ? query : null,
    5
  );

  const handleQuery = async () => {
    if (!query.trim()) return;

    try {
      await queryMutation.mutateAsync({
        query: query.trim(),
        domainIds: domainIds.length > 0 ? domainIds : undefined,
        options: {
          rerank: true,
          keywordBoost: true,
          limit: 20,
        },
      });
    } catch (error) {
      console.error('Query error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Multi-Domain Query</h2>
        <p className="text-muted-foreground">
          Query across all your domains simultaneously. The system will automatically route to
          relevant domains.
        </p>
      </div>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Search Across Domains
          </CardTitle>
          <CardDescription>
            Enter your query and let the system find relevant information from all domains
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleQuery();
                }
              }}
              placeholder="Ask a question that might span multiple domains..."
              className="flex-1"
            />
            <Button onClick={handleQuery} disabled={queryMutation.isPending || !query.trim()}>
              {queryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Relevant Domains Preview */}
          {isLoadingDomains && query.length > 3 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding relevant domains...
            </div>
          )}

          {relevantDomains && relevantDomains.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Relevant Domains:</p>
              <div className="flex flex-wrap gap-2">
                {relevantDomains.map((domain) => (
                  <Badge
                    key={domain.domainId}
                    variant={domainIds.includes(domain.domainId) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (domainIds.includes(domain.domainId)) {
                        setDomainIds(domainIds.filter((id) => id !== domain.domainId));
                      } else {
                        setDomainIds([...domainIds, domain.domainId]);
                      }
                    }}
                  >
                    {domain.domainName} ({(domain.relevanceScore * 100).toFixed(0)}%)
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {queryMutation.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Synthesized Response
            </CardTitle>
            <CardDescription>
              Response synthesized from {queryMutation.data.resultCount} results across{' '}
              {queryMutation.data.results.length > 0
                ? new Set(queryMutation.data.results.map((r) => r.domainId)).size
                : 0}{' '}
              domains
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{queryMutation.data.response}</p>
            </div>

            {/* Source Results */}
            {queryMutation.data.results.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Source Results:</p>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {queryMutation.data.results.map((result, idx) => (
                      <Card key={result.id || idx} className="p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{result.title}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {result.domainName || result.domainId}
                            </Badge>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {(result.combinedScore || result.similarity || 0) * 100}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {result.content}
                        </p>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
