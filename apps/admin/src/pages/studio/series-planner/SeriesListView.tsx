import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Sparkles,
  Film,
  ArrowRight,
} from 'lucide-react';
import type { Series } from './shared';

export interface SeriesListViewProps {
  seriesList: Series[];
  onSelectSeries: (series: Series) => void;
  onCreateNew: () => void;
}

export function SeriesListView({ seriesList, onSelectSeries, onCreateNew }: SeriesListViewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Danh sách Series</h2>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Series mới
        </Button>
      </div>

      {seriesList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Film className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chưa có series nào</h3>
            <p className="text-muted-foreground mb-4">
              Bắt đầu tạo series video đầu tiên của bạn
            </p>
            <Button onClick={onCreateNew}>
              <Sparkles className="h-4 w-4 mr-2" />
              Tạo Series mới
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {seriesList.map((series) => (
            <Card
              key={series.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => onSelectSeries(series)}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{series.title}</h3>
                    <p className="text-sm text-muted-foreground">{series.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{series.location}</Badge>
                      <Badge variant="secondary">
                        {series.episodes.filter(e => e.status === 'completed').length}/{series.totalEpisodes} tập
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={
                        (series.episodes.filter(e => e.status !== 'outline').length /
                        series.totalEpisodes) * 100
                      }
                      className="w-24"
                    />
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
