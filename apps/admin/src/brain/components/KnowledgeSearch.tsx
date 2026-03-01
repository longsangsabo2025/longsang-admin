/**
 * Knowledge Search Component
 * Search interface for finding knowledge using vector similarity
 */

import { useDomains } from '@/brain/hooks/useDomains';
import { useSearchKnowledge } from '@/brain/hooks/useKnowledge';
import type { KnowledgeSearchResult } from '@/brain/types/brain.types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BookOpen, Loader2, Search, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';

interface KnowledgeSearchProps {
  readonly selectedDomainId?: string | null;
}

export function KnowledgeSearch({ selectedDomainId }: KnowledgeSearchProps) {
  const { data: domains } = useDomains();
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(selectedDomainId || null);
  const [matchThreshold, setMatchThreshold] = useState(0.7);

  const searchOptions = useMemo(
    () => ({
      domainId: domainFilter || undefined,
      matchThreshold,
      matchCount: 10,
    }),
    [domainFilter, matchThreshold]
  );

  const {
    data: results,
    isLoading,
    isFetching,
  } = useSearchKnowledge(
    query.trim().length > 0 ? query : null,
    searchOptions,
    query.trim().length > 0
  );

  const formatSimilarity = (similarity: number) => {
    return `${(similarity * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Query</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question or search for information..."
            className="pl-10"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Use natural language to search your knowledge base. The AI will find the most relevant
          information.
        </p>
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="domain-filter">Filter by Domain</Label>
          <Select
            value={domainFilter || 'all'}
            onValueChange={(value) => setDomainFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger id="domain-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="threshold">Similarity Threshold</Label>
          <Select
            value={matchThreshold.toString()}
            onValueChange={(value) => setMatchThreshold(Number.parseFloat(value))}
          >
            <SelectTrigger id="threshold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">50% (More results)</SelectItem>
              <SelectItem value="0.6">60%</SelectItem>
              <SelectItem value="0.7">70% (Recommended)</SelectItem>
              <SelectItem value="0.8">80%</SelectItem>
              <SelectItem value="0.9">90% (Strict)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {(isLoading || isFetching) && query.trim().length > 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Searching...</span>
        </div>
      )}

      {/* Results */}
      {!isLoading && !isFetching && query.trim().length > 0 && results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {results.length} {results.length === 1 ? 'result' : 'results'} found
            </h3>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result: KnowledgeSearchResult) => {
                const domain = domains?.find((d) => d.id === result.domainId);
                return (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-semibold text-lg">{result.title}</h4>
                          </div>
                          {domain && (
                            <Badge variant="outline" className="mb-2">
                              {domain.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-600">
                            {formatSimilarity(result.similarity)}
                          </span>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-3">{result.content}</p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {result.contentType}
                        </Badge>
                        {result.tags && result.tags.length > 0 && (
                          <>
                            {result.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 3} more
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No results found. Try adjusting your search query or similarity threshold.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {query.trim().length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Enter a search query to find knowledge</p>
        </div>
      )}
    </div>
  );
}
