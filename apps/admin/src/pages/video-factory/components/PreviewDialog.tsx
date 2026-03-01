import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Image as ImageIcon, Play, Video } from 'lucide-react';
import { useState } from 'react';
import type { VideoJob } from '@/services/video-factory.service';
import { IMAGE_MODELS_SET } from '../shared-data';

export const PreviewDialog = ({ job }: { job: VideoJob }) => {
  const [open, setOpen] = useState(false);
  const isImage = IMAGE_MODELS_SET.has(job.model);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Preview">
          <Play className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isImage ? <ImageIcon className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            {isImage ? 'Image' : 'Video'} Preview
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{job.prompt}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          {isImage ? (
            <img
              src={job.output_url}
              alt={job.prompt}
              className="max-h-[500px] rounded-lg object-contain w-full"
            />
          ) : (
            <video
              src={job.output_url}
              controls
              autoPlay
              loop
              className="max-h-[500px] rounded-lg w-full"
            />
          )}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-4">
                <Badge variant="outline">{job.model}</Badge>
                <span>{job.resolution} • {job.aspect_ratio}</span>
                {job.generation_time_seconds && (
                  <span>⏱️ {job.generation_time_seconds}s</span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => window.open(job.output_url, '_blank')}>
              <Download className="h-3 w-3" />
              Open
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
