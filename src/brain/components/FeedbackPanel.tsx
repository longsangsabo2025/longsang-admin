import { useSubmitFeedback } from '@/brain/hooks/useLearning';
import type { FeedbackInput } from '@/brain/types/learning.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, Star, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface FeedbackPanelProps {
  queryId?: string;
  onSubmitted?: () => void;
}

export function FeedbackPanel({ queryId, onSubmitted }: FeedbackPanelProps) {
  const [feedbackType, setFeedbackType] = useState<'thumbs_up' | 'thumbs_down' | 'rating'>('thumbs_up');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');

  const submitFeedbackMutation = useSubmitFeedback();

  const handleSubmit = async () => {
    const input: FeedbackInput = {
      queryId,
      feedbackType,
      rating: feedbackType === 'rating' ? rating : undefined,
      comment: comment || undefined,
    };

    await submitFeedbackMutation.mutateAsync(input);
    setComment('');
    onSubmitted?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provide Feedback</CardTitle>
        <CardDescription>Help improve the system by providing feedback on this response</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Feedback Type</Label>
          <RadioGroup value={feedbackType} onValueChange={(value) => setFeedbackType(value as any)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thumbs_up" id="thumbs_up" />
              <Label htmlFor="thumbs_up" className="flex items-center gap-2 cursor-pointer">
                <ThumbsUp className="h-4 w-4" /> Helpful
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="thumbs_down" id="thumbs_down" />
              <Label htmlFor="thumbs_down" className="flex items-center gap-2 cursor-pointer">
                <ThumbsDown className="h-4 w-4" /> Not Helpful
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rating" id="rating" />
              <Label htmlFor="rating" className="flex items-center gap-2 cursor-pointer">
                <Star className="h-4 w-4" /> Rating
              </Label>
            </div>
          </RadioGroup>
        </div>

        {feedbackType === 'rating' && (
          <div>
            <Label>Rating (1-5)</Label>
            <Select value={rating.toString()} onValueChange={(value) => setRating(parseInt(value, 10))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Poor</SelectItem>
                <SelectItem value="2">2 - Fair</SelectItem>
                <SelectItem value="3">3 - Good</SelectItem>
                <SelectItem value="4">4 - Very Good</SelectItem>
                <SelectItem value="5">5 - Excellent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="comment">Comment (Optional)</Label>
          <Textarea
            id="comment"
            placeholder="Share your thoughts..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={submitFeedbackMutation.isPending} className="w-full">
          {submitFeedbackMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : null}
          Submit Feedback
        </Button>
      </CardContent>
    </Card>
  );
}


