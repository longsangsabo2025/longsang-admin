import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function KeywordTracker() {
  const keywords = [
    {
      keyword: 'cơ thủ bi-a việt nam',
      position: 3,
      change: 2,
      volume: 'Medium',
      difficulty: '★★☆',
    },
    { keyword: 'xếp hạng bi-a', position: 7, change: -1, volume: 'High', difficulty: '★☆☆' },
    { keyword: 'sabo arena', position: 1, change: 0, volume: 'Medium', difficulty: '★☆☆' },
    {
      keyword: 'giải đấu bi-a việt nam',
      position: 12,
      change: 5,
      volume: 'Medium',
      difficulty: '★★☆',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Theo Dõi Keywords
        </CardTitle>
        <CardDescription>Ranking của keywords quan trọng trên Google</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {keywords.map((kw, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{kw.keyword}</div>
                <div className="text-sm text-muted-foreground">
                  Volume: {kw.volume} • Difficulty: {kw.difficulty}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant={kw.position <= 3 ? 'default' : 'secondary'}>#{kw.position}</Badge>
                {kw.change !== 0 && (
                  <span className={kw.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {kw.change > 0 ? '↑' : '↓'} {Math.abs(kw.change)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
