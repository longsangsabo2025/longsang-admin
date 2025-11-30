import { useScoreKnowledge, useImprovementSuggestions } from '@/brain/hooks/useLearning';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';

interface KnowledgeQualityScoreProps {
  knowledgeId: string;
}

export function KnowledgeQualityScore({ knowledgeId }: KnowledgeQualityScoreProps) {
  const scoreMutation = useScoreKnowledge();
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    useImprovementSuggestions(knowledgeId);

  const handleScore = async () => {
    await scoreMutation.mutateAsync(knowledgeId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number): 'default' | 'secondary' | 'destructive' => {
    if (score >= 70) return 'default';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quality Score</span>
          <Button
            onClick={handleScore}
            disabled={scoreMutation.isPending}
            size="sm"
            variant="outline"
          >
            {scoreMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>Knowledge item quality assessment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {scoreMutation.data ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Score</span>
                <Badge variant={getScoreVariant(scoreMutation.data.score)}>
                  {scoreMutation.data.score.toFixed(1)}/100
                </Badge>
              </div>
              <Progress value={scoreMutation.data.score} className="h-2" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Score Components</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Recency</span>
                  <span>{scoreMutation.data.components.recency.toFixed(1)}/40</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage</span>
                  <span>{scoreMutation.data.components.usage.toFixed(1)}/30</span>
                </div>
                <div className="flex justify-between">
                  <span>Feedback</span>
                  <span>{scoreMutation.data.components.feedback.toFixed(1)}/30</span>
                </div>
              </div>
            </div>

            {suggestions && suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" /> Improvement Suggestions
                </p>
                <div className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm p-2 bg-muted rounded">
                      {suggestion.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              Click refresh to calculate quality score
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
