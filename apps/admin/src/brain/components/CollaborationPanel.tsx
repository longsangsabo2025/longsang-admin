import { useSharedKnowledge, useTeamWorkspaces } from '@/brain/hooks/useCollaboration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Share2, Users } from 'lucide-react';

export function CollaborationPanel() {
  const { data: sharedKnowledge, isLoading: isLoadingShared } = useSharedKnowledge();
  const { data: teams, isLoading: isLoadingTeams } = useTeamWorkspaces();

  if (isLoadingShared || isLoadingTeams) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading collaboration data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Shared Knowledge
          </CardTitle>
          <CardDescription>Knowledge items shared with you</CardDescription>
        </CardHeader>
        <CardContent>
          {sharedKnowledge && sharedKnowledge.length > 0 ? (
            <div className="space-y-2">
              {sharedKnowledge.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex-1">
                    <p className="font-medium">{share.knowledge?.title || 'Untitled'}</p>
                    <p className="text-sm text-muted-foreground">
                      Shared by {share.shared_by_user?.email || share.shared_by}
                    </p>
                  </div>
                  <Badge variant="outline">{share.permission}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No shared knowledge items</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Team Workspaces
          </CardTitle>
          <CardDescription>Teams you are a member of</CardDescription>
        </CardHeader>
        <CardContent>
          {teams && teams.length > 0 ? (
            <div className="space-y-2">
              {teams.map((team) => (
                <div key={team.id} className="p-3 border rounded">
                  <p className="font-medium">{team.name}</p>
                  {team.description && (
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="secondary">{team.members?.length || 0} members</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No team workspaces</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
