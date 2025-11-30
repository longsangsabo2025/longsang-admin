// ================================================
// CONTENT REVIEW MODAL
// ================================================
// Admin reviews generated content before publishing

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Calendar, Check, Edit, Eye, Share2, User, X } from 'lucide-react';
import { useState } from 'react';
import { PublishToSocialModal } from './PublishToSocialModal';

interface ContentReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: any;
  onUpdate: () => void;
}

export function ContentReviewModal({
  open,
  onOpenChange,
  content,
  onUpdate,
}: ContentReviewModalProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content?.content?.body || '');
  const [saving, setSaving] = useState(false);
  const [socialModalOpen, setSocialModalOpen] = useState(false);

  if (!content) return null;

  const handleApprove = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_queue')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          content: editing ? { ...content.content, body: editedContent } : content.content,
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: '✅ Content Approved',
        description: 'Content has been approved and will be published',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to approve:', error);
      toast({
        title: '❌ Approval Failed',
        description: 'Could not approve content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_queue')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: '❌ Content Rejected',
        description: 'Content has been rejected and will not be published',
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to reject:', error);
      toast({
        title: '❌ Rejection Failed',
        description: 'Could not reject content',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('content_queue')
        .update({
          content: { ...content.content, body: editedContent },
        })
        .eq('id', content.id);

      if (error) throw error;

      toast({
        title: '✅ Edits Saved',
        description: 'Your changes have been saved',
      });

      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to save edit:', error);
      toast({
        title: '❌ Save Failed',
        description: 'Could not save changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review Content
            </DialogTitle>
            <Badge
              variant={
                content.status === 'pending'
                  ? 'outline'
                  : content.status === 'approved'
                    ? 'default'
                    : content.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
              }
            >
              {content.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span>{format(new Date(content.created_at), 'PPp')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Type:</span>
              <span className="capitalize">{content.content_type}</span>
            </div>
          </div>

          {/* Title */}
          {content.title && (
            <div>
              <h3 className="text-sm font-medium mb-2">Title</h3>
              <p className="text-lg font-semibold">{content.title}</p>
            </div>
          )}

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Content</h3>
              {!editing && content.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(true);
                    setEditedContent(content.content?.body || '');
                  }}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </div>

            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} disabled={saving}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 border rounded-lg bg-background">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: content.content?.body || 'No content',
                  }}
                />
              </div>
            )}
          </div>

          {/* Metadata from content */}
          {content.content?.seo && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">SEO Metadata</h3>
              <div className="p-4 border rounded-lg space-y-2 text-sm">
                {content.content.seo.keywords && (
                  <div>
                    <span className="font-medium">Keywords:</span>{' '}
                    <span className="text-muted-foreground">
                      {content.content.seo.keywords.join(', ')}
                    </span>
                  </div>
                )}
                {content.content.seo.description && (
                  <div>
                    <span className="font-medium">Description:</span>{' '}
                    <span className="text-muted-foreground">{content.content.seo.description}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scheduled info */}
          {content.scheduled_for && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm">
                <Calendar className="inline h-4 w-4 mr-1" />
                <strong>Scheduled for:</strong> {format(new Date(content.scheduled_for), 'PPp')}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          {content.status === 'pending' && (
            <div className="flex flex-col gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <Button onClick={handleApprove} disabled={saving} className="flex-1">
                  <Check className="h-4 w-4 mr-2" />
                  Approve & Publish
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={saving}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
              <Button
                onClick={() => setSocialModalOpen(true)}
                variant="outline"
                disabled={saving}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share to Social Media
              </Button>
            </div>
          )}

          {/* Approved content can also be shared to social */}
          {content.status === 'approved' && (
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={() => setSocialModalOpen(true)} variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share to Social Media
              </Button>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Social Media Publish Modal */}
      <PublishToSocialModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        content={content}
        onPublished={() => {
          setSocialModalOpen(false);
          onUpdate();
        }}
      />
    </Dialog>
  );
}
