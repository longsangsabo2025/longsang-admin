import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatLastSaved } from '@/hooks/useAutoSave';
import {
  Loader2,
  Sparkles,
  Film,
  CheckCircle,
  Clock,
  PlayCircle,
  Edit,
  Trash2,
  ChevronRight,
  Wand2,
  RefreshCw,
  Clapperboard,
  BookOpen,
  Target,
  Zap,
  Layers,
} from 'lucide-react';
import type { Series, Episode } from './shared';

export interface SeriesDetailViewProps {
  selectedSeries: Series;
  onBack: () => void;
  onDeleteSeries: (id: string) => void;
  onRegenerateArcs: (series: Series) => void;
  onGenerateScript: (episode: Episode) => void;
  onProduceVideo: (episode: Episode) => void;
  onBatchGenerate: () => void;
  onSelectEpisode: (episode: Episode) => void;
  onShowScript: () => void;
  selectedEpisode: Episode | null;
  isGenerating: boolean;
  generationStep: string;
  isAutoSaving: boolean;
  autoSaveLastSaved: Date | null;
}

export function SeriesDetailView({
  selectedSeries,
  onBack,
  onDeleteSeries,
  onRegenerateArcs,
  onGenerateScript,
  onProduceVideo,
  onBatchGenerate,
  onSelectEpisode,
  onShowScript,
  selectedEpisode,
  isGenerating,
  generationStep,
  isAutoSaving,
  autoSaveLastSaved,
}: SeriesDetailViewProps) {
  return (
    <>
      {/* Series Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-2"
          >
            ← Quay lại danh sách
          </Button>
          <h2 className="text-2xl font-bold">{selectedSeries.title}</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            {selectedSeries.description}
            {isAutoSaving ? (
              <span className="text-xs text-blue-500 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Đang lưu...
              </span>
            ) : autoSaveLastSaved ? (
              <span className="text-xs text-green-600">
                ✅ {formatLastSaved(autoSaveLastSaved)}
              </span>
            ) : null}
          </p>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{selectedSeries.mainCharacter}</Badge>
            <Badge variant="outline">{selectedSeries.location}</Badge>
            <Badge variant="secondary">{selectedSeries.totalEpisodes} tập</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" />
            Sửa
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={() => onDeleteSeries(selectedSeries.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Story Arcs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Story Arcs
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRegenerateArcs(selectedSeries)}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
            Tạo lại
          </Button>
        </CardHeader>
        <CardContent>
          {selectedSeries.arcs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
              <p className="mb-2">Chưa có Story Arcs</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRegenerateArcs(selectedSeries)}
                disabled={isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Tạo bằng AI
              </Button>
            </div>
          ) : (
            <div className="flex gap-4">
              {selectedSeries.arcs.map((arc, index) => (
                <div key={index} className="flex-1 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="font-semibold">{arc.phase}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{arc.description}</p>
                  <div className="flex gap-1 mt-2">
                    {arc.episodes.map(epNum => (
                      <Badge key={epNum} variant="outline" className="text-xs">
                        Ep {epNum}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Episodes List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Film className="h-5 w-5" />
                Episodes
              </CardTitle>
              <CardDescription>
                Click để xem/viết script cho từng tập
              </CardDescription>
            </div>
            {/* Batch Generation Button */}
            {selectedSeries.episodes.some(ep => ep.status === 'outline') && (
              <Button
                variant="default"
                size="sm"
                onClick={onBatchGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Tạo tất cả ({selectedSeries.episodes.filter(ep => ep.status === 'outline').length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedSeries.episodes.map((episode) => (
              <div
                key={episode.id}
                className="p-4 rounded-lg border hover:border-primary transition-colors cursor-pointer"
                onClick={() => {
                  onSelectEpisode(episode);
                  if (episode.status !== 'outline') {
                    onShowScript();
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                      {episode.number}
                    </div>
                    <div>
                      <h4 className="font-medium">{episode.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {episode.synopsis}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {episode.duration}s
                    </Badge>
                    {episode.status === 'outline' && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateScript(episode);
                        }}
                        disabled={isGenerating}
                      >
                        {isGenerating && selectedEpisode?.id === episode.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Wand2 className="h-4 w-4 mr-1" />
                            Viết Script
                          </>
                        )}
                      </Button>
                    )}
                    {episode.status === 'scripted' && (
                      <>
                        <Badge className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Có Script
                        </Badge>
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-orange-500 hover:bg-orange-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onProduceVideo(episode);
                          }}
                        >
                          <Layers className="h-4 w-4 mr-1" />
                          To Production
                        </Button>
                      </>
                    )}
                    {episode.status === 'in_production' && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Đang sản xuất
                      </Badge>
                    )}
                    {episode.status === 'completed' && (
                      <Badge className="bg-blue-500">
                        <PlayCircle className="h-3 w-3 mr-1" />
                        Hoàn thành
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Production Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Production Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tổng tiến độ</span>
              <span>
                {selectedSeries.episodes.filter(e => e.status === 'completed').length}/
                {selectedSeries.totalEpisodes} tập hoàn thành
              </span>
            </div>
            <Progress
              value={
                (selectedSeries.episodes.filter(e => e.status === 'completed').length /
                selectedSeries.totalEpisodes) * 100
              }
            />
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold">
                  {selectedSeries.episodes.filter(e => e.status === 'outline').length}
                </p>
                <p className="text-xs text-muted-foreground">Outline</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-green-500/10">
                <p className="text-2xl font-bold text-green-500">
                  {selectedSeries.episodes.filter(e => e.status === 'scripted').length}
                </p>
                <p className="text-xs text-muted-foreground">Có Script</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                <p className="text-2xl font-bold text-yellow-500">
                  {selectedSeries.episodes.filter(e => e.status === 'in_production').length}
                </p>
                <p className="text-xs text-muted-foreground">Đang sản xuất</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-blue-500/10">
                <p className="text-2xl font-bold text-blue-500">
                  {selectedSeries.episodes.filter(e => e.status === 'completed').length}
                </p>
                <p className="text-xs text-muted-foreground">Hoàn thành</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
