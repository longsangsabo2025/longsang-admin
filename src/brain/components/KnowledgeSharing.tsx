import { useShareKnowledge } from '@/brain/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface KnowledgeSharingProps {
  knowledgeId: string;
  onShared?: () => void;
}

export function KnowledgeSharing({ knowledgeId, onShared }: KnowledgeSharingProps) {
  const [sharedWithUserId, setSharedWithUserId] = useState('');
  const [permission, setPermission] = useState<'read' | 'write' | 'comment'>('read');

  const shareMutation = useShareKnowledge();

  const handleShare = async () => {
    if (!sharedWithUserId) {
      return;
    }

    await shareMutation.mutateAsync({
      knowledgeId,
      sharedWithUserId,
      permission,
    });

    setSharedWithUserId('');
    onShared?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" /> Share Knowledge
        </CardTitle>
        <CardDescription>Share this knowledge item with another user</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            placeholder="Enter user ID to share with"
            value={sharedWithUserId}
            onChange={(e) => setSharedWithUserId(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="permission">Permission</Label>
          <Select value={permission} onValueChange={(value) => setPermission(value as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="read">Read Only</SelectItem>
              <SelectItem value="comment">Comment</SelectItem>
              <SelectItem value="write">Write</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleShare} disabled={shareMutation.isPending || !sharedWithUserId} className="w-full">
          {shareMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Share2 className="h-4 w-4 mr-2" />
          )}
          Share
        </Button>
      </CardContent>
    </Card>
  );
}

