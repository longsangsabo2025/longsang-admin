import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Clapperboard } from 'lucide-react';
import ProductionStudio from '@/components/studio/ProductionStudio';
import type { Series, Episode } from './shared';

export interface ProductionStudioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productionEpisode: Episode | null;
  selectedSeries: Series | null;
}

export function ProductionStudioDialog({
  open,
  onOpenChange,
  productionEpisode,
  selectedSeries,
}: ProductionStudioDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] w-full h-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            AI Production Studio
          </DialogTitle>
          <DialogDescription>
            Multi-agent production workflow for {productionEpisode?.title}
          </DialogDescription>
        </DialogHeader>

        {productionEpisode && selectedSeries && (
          <ProductionStudio
            episodeId={productionEpisode.id}
            scriptData={{
              hook: productionEpisode.hook || '',
              story: productionEpisode.story || '',
              punchline: productionEpisode.punchline || '',
              cta: productionEpisode.cta || '',
              visualNotes: productionEpisode.visualNotes || '',
            }}
            context={{
              seriesTitle: selectedSeries.title,
              episode: `Episode ${productionEpisode.number}: ${productionEpisode.title}`,
              tone: selectedSeries.theme,
              targetDuration: productionEpisode.duration,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
