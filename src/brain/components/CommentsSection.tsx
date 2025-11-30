import { useComments, useAddComment } from '@/brain/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MessageSquare, Send } from 'lucide-react';
import { useState } from 'react';

interface CommentsSectionProps {
  knowledgeId: string;
}

export function CommentsSection({ knowledgeId }: CommentsSectionProps) {
  const [comment, setComment] = useState('');
  const { data: comments, isLoading } = useComments(knowledgeId);
  const addCommentMutation = useAddComment();

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    await addCommentMutation.mutateAsync({
      knowledgeId,
      comment: comment.trim(),
    });

    setComment('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" /> Comments
        </CardTitle>
        <CardDescription>Discuss and collaborate on this knowledge item</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button onClick={handleAddComment} disabled={addCommentMutation.isPending || !comment.trim()} size="sm">
            {addCommentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Post Comment
          </Button>
        </div>

        <div className="space-y-3">
          {comments && comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{c.user?.email || c.user_id}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{c.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">No comments yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

