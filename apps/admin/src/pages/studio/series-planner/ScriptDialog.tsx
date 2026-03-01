import { type Dispatch, type SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Loader2,
  Sparkles,
  FileText,
  Edit,
  Wand2,
  Video,
  Save,
  Layers,
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import type { Episode } from './shared';
import { renderContent } from './shared';

export interface ScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEpisode: Episode | null;
  isEditingScript: boolean;
  setIsEditingScript: (v: boolean) => void;
  editedScript: Partial<Episode>;
  setEditedScript: Dispatch<SetStateAction<Partial<Episode>>>;
  onRegenerateField: (field: 'hook' | 'story' | 'punchline' | 'cta' | 'visualNotes') => void;
  regeneratingField: string | null;
  onProduceVideo: (episode: Episode) => void;
  isSaving: boolean;
  onSaveScript: () => void;
}

export function ScriptDialog({
  open,
  onOpenChange,
  selectedEpisode,
  isEditingScript,
  setIsEditingScript,
  editedScript,
  setEditedScript,
  onRegenerateField,
  regeneratingField,
  onProduceVideo,
  isSaving,
  onSaveScript,
}: ScriptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Script Tập {selectedEpisode?.number}: {selectedEpisode?.title}
          </DialogTitle>
          <DialogDescription>
            Duration: {selectedEpisode?.duration}s
          </DialogDescription>
        </DialogHeader>

        {selectedEpisode && selectedEpisode.status !== 'outline' && (
          <div className="space-y-4">
            {/* Hook */}
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-red-500" />
                  Hook (3-5s)
                </h4>
                {isEditingScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerateField('hook')}
                    disabled={regeneratingField === 'hook'}
                  >
                    {regeneratingField === 'hook' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              {isEditingScript ? (
                <Textarea
                  value={editedScript.hook ?? selectedEpisode.hook ?? ''}
                  onChange={(e) => setEditedScript(prev => ({ ...prev, hook: e.target.value }))}
                  className="min-h-[80px] bg-background"
                  placeholder="Hook gây chú ý..."
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{renderContent(selectedEpisode.hook)}</p>
              )}
            </div>

            {/* Story */}
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Story (20-40s)
                </h4>
                {isEditingScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerateField('story')}
                    disabled={regeneratingField === 'story'}
                  >
                    {regeneratingField === 'story' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              {isEditingScript ? (
                <Textarea
                  value={editedScript.story ?? selectedEpisode.story ?? ''}
                  onChange={(e) => setEditedScript(prev => ({ ...prev, story: e.target.value }))}
                  className="min-h-[150px] bg-background"
                  placeholder="Nội dung chính..."
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{renderContent(selectedEpisode.story)}</p>
              )}
            </div>

            {/* Punchline */}
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Punchline
                </h4>
                {isEditingScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerateField('punchline')}
                    disabled={regeneratingField === 'punchline'}
                  >
                    {regeneratingField === 'punchline' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              {isEditingScript ? (
                <Textarea
                  value={editedScript.punchline ?? selectedEpisode.punchline ?? ''}
                  onChange={(e) => setEditedScript(prev => ({ ...prev, punchline: e.target.value }))}
                  className="min-h-[60px] bg-background"
                  placeholder="Twist cuối..."
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{renderContent(selectedEpisode.punchline)}</p>
              )}
            </div>

            {/* CTA */}
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Call to Action
                </h4>
                {isEditingScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerateField('cta')}
                    disabled={regeneratingField === 'cta'}
                  >
                    {regeneratingField === 'cta' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              {isEditingScript ? (
                <Input
                  value={editedScript.cta ?? selectedEpisode.cta ?? ''}
                  onChange={(e) => setEditedScript(prev => ({ ...prev, cta: e.target.value }))}
                  className="bg-background"
                  placeholder="Follow để xem tiếp!"
                />
              ) : (
                <p className="text-sm">{renderContent(selectedEpisode.cta)}</p>
              )}
            </div>

            {/* Visual Notes */}
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-500" />
                  Visual Notes
                </h4>
                {isEditingScript && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRegenerateField('visualNotes')}
                    disabled={regeneratingField === 'visualNotes'}
                  >
                    {regeneratingField === 'visualNotes' ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Wand2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              {isEditingScript ? (
                <Textarea
                  value={editedScript.visualNotes ?? selectedEpisode.visualNotes ?? ''}
                  onChange={(e) => setEditedScript(prev => ({ ...prev, visualNotes: e.target.value }))}
                  className="min-h-[80px] bg-background"
                  placeholder="Ghi chú góc quay, props..."
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{renderContent(selectedEpisode.visualNotes)}</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {!isEditingScript ? (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingScript(true);
                  setEditedScript({
                    hook: selectedEpisode?.hook || '',
                    story: selectedEpisode?.story || '',
                    punchline: selectedEpisode?.punchline || '',
                    cta: selectedEpisode?.cta || '',
                    visualNotes: selectedEpisode?.visualNotes || '',
                  });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
              {selectedEpisode && (
                <Button
                  className="bg-orange-500 hover:bg-orange-600"
                  onClick={() => {
                    onProduceVideo(selectedEpisode);
                    onOpenChange(false);
                  }}
                >
                  <Layers className="h-4 w-4 mr-2" />
                  To Production
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditingScript(false);
                  setEditedScript({});
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={onSaveScript}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Lưu
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
