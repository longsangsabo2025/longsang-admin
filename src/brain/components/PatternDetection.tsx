import { usePatterns } from '@/brain/hooks/useSuggestions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp } from 'lucide-react';

export function PatternDetection() {
  const { data: patterns, isLoading } = usePatterns();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!patterns || patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" /> Usage Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">No patterns detected yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" /> Usage Patterns
        </CardTitle>
        <CardDescription>Detected patterns in your usage</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {patterns.map((pattern, index) => (
            <div key={index} className="p-3 border rounded">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{pattern.type}</Badge>
              </div>
              <p className="text-sm">{pattern.message}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
