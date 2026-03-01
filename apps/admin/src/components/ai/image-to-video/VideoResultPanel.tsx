import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Video, Download, Loader2, Trash2, RefreshCw,
  Play, History, Film, FolderPlus,
} from 'lucide-react';
import type { VideoResult } from './types';

interface VideoResultPanelProps {
  result: VideoResult | null;
  isGenerating: boolean;
  progress: string;
  history: VideoResult[];
  isPlaying: boolean;
  isSavingToDrive: boolean;
  isSavingToLibrary: boolean;
  onSetIsPlaying: (playing: boolean) => void;
  onDownload: () => void;
  onSaveToDrive: () => void;
  onSaveToLibrary: () => void;
  onSelectResult: (result: VideoResult) => void;
  onRetry: () => void;
}

export function VideoResultPanel({
  result,
  isGenerating,
  progress,
  history,
  isSavingToDrive,
  isSavingToLibrary,
  onSetIsPlaying,
  onDownload,
  onSaveToDrive,
  onSaveToLibrary,
  onSelectResult,
  onRetry,
}: VideoResultPanelProps) {
  return (
    <>
      {/* Result Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Film className="h-4 w-4" />
            Kết quả
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result?.state === 'success' && result.videoUrl ? (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={result.videoUrl}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                  onPlay={() => onSetIsPlaying(true)}
                  onPause={() => onSetIsPlaying(false)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={onDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải Video
                </Button>
                <Button
                  variant="outline"
                  onClick={onSaveToDrive}
                  disabled={isSavingToDrive}
                >
                  {isSavingToDrive ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>☁️ Drive</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={onSaveToLibrary}
                  disabled={isSavingToLibrary}
                  title="Lưu vào Thư Viện bên trái"
                >
                  {isSavingToLibrary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <><FolderPlus className="h-4 w-4 mr-1" />Thư Viện</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(result.videoUrl!)}
                >
                  Copy URL
                </Button>
              </div>

              {result.prompt && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Prompt:</p>
                  <p className="text-sm">{result.prompt}</p>
                </div>
              )}
            </div>
          ) : result?.state === 'fail' ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <Trash2 className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-red-500 font-medium">Tạo video thất bại</p>
              <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
              <Button variant="outline" className="mt-4" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Thử lại
              </Button>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
              <p className="font-medium">{progress || 'Đang xử lý...'}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Video có thể mất 1-3 phút để tạo
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Video className="h-16 w-16 opacity-20 mb-4" />
              <p className="text-center">
                Chọn ảnh, nhập mô tả và nhấn <br />
                <span className="font-medium text-foreground">"Tạo Video"</span>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="h-4 w-4" />
              Lịch sử ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {history.slice(0, 6).map((item) => (
                <div
                  key={item.taskId}
                  className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer border transition-all ${
                    result?.taskId === item.taskId
                      ? 'ring-2 ring-purple-500'
                      : 'hover:ring-1 hover:ring-border'
                  }`}
                  onClick={() => item.state === 'success' && onSelectResult(item)}
                >
                  {item.videoUrl ? (
                    <video
                      src={item.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Video className="h-6 w-6 opacity-30" />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                    <div className="flex items-center gap-1">
                      {item.state === 'success' ? (
                        <Play className="h-3 w-3 text-white" />
                      ) : (
                        <Loader2 className="h-3 w-3 text-white animate-spin" />
                      )}
                      <span className="text-xs text-white truncate">
                        {item.prompt?.substring(0, 20)}...
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
