import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { GalleryHorizontalEnd, Image as ImageIcon, Loader2, Video } from 'lucide-react';
import { useMemo } from 'react';
import { videoFactoryService, type VideoJob } from '@/services/video-factory.service';
import { IMAGE_MODELS_SET } from '../shared-data';
import { PreviewDialog } from './PreviewDialog';

export const GalleryTab = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['video-factory', 'queue', 'completed'],
    queryFn: () => videoFactoryService.listQueue({ status: 'completed', limit: 100 }),
    refetchInterval: 10000,
  });

  const jobs = data?.items || [];

  const images = useMemo(() => jobs.filter(j => IMAGE_MODELS_SET.has(j.model)), [jobs]);
  const videos = useMemo(() => jobs.filter(j => !IMAGE_MODELS_SET.has(j.model)), [jobs]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <GalleryHorizontalEnd className="h-12 w-12 mb-4" />
        <p>No completed outputs yet</p>
        <p className="text-sm">Generate videos or images to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{videos.length} videos • {images.length} images</p>
      </div>

      {videos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><Video className="h-4 w-4" /> Videos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map(job => (
              <GalleryCard key={job.id} job={job} isImage={false} />
            ))}
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map(job => (
              <GalleryCard key={job.id} job={job} isImage={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const GalleryCard = ({ job, isImage }: { job: VideoJob; isImage: boolean }) => {
  return (
    <div className="group relative rounded-lg border overflow-hidden bg-card hover:border-primary/40 transition-colors">
      <div className="aspect-video bg-muted relative">
        {job.thumbnail_url ? (
          <img src={job.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : job.output_url && isImage ? (
          <img src={job.output_url} alt="" className="w-full h-full object-cover" />
        ) : job.output_url && !isImage ? (
          <video src={job.output_url} muted className="w-full h-full object-cover" onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }} />
        ) : (
          <div className="flex items-center justify-center h-full">
            {isImage ? <ImageIcon className="h-8 w-8 text-muted-foreground/40" /> : <Video className="h-8 w-8 text-muted-foreground/40" />}
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <PreviewDialog job={job} />
        </div>
      </div>
      <div className="p-2 space-y-1">
        <p className="text-xs line-clamp-2 text-muted-foreground">{job.prompt}</p>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] px-1.5">{job.model}</Badge>
          <span className="text-[10px] text-muted-foreground">
            {new Date(job.completed_at || job.created_at).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </div>
  );
};
