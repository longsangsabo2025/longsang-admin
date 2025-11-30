import { useCreateTeam, useTeamWorkspaces, useAddTeamMember } from '@/brain/hooks/useCollaboration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useState } from 'react';

export function TeamWorkspace() {
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: teams, isLoading } = useTeamWorkspaces();
  const createTeamMutation = useCreateTeam();
  const addMemberMutation = useAddTeamMember();

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;

    await createTeamMutation.mutateAsync({
      name: teamName.trim(),
      description: teamDescription.trim() || undefined,
    });

    setTeamName('');
    setTeamDescription('');
    setIsDialogOpen(false);
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Team Workspaces
            </CardTitle>
            <CardDescription>Create and manage team workspaces</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Team Workspace</DialogTitle>
                <DialogDescription>Create a new team workspace for collaboration</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    placeholder="Enter team name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="teamDescription">Description</Label>
                  <Textarea
                    id="teamDescription"
                    placeholder="Enter team description"
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending || !teamName.trim()} className="w-full">
                  {createTeamMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Team
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {teams && teams.length > 0 ? (
          <div className="space-y-3">
            {teams.map((team) => (
              <div key={team.id} className="p-4 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{team.name}</h3>
                  <Button size="sm" variant="outline">
                    Manage
                  </Button>
                </div>
                {team.description && <p className="text-sm text-muted-foreground mb-2">{team.description}</p>}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{team.members?.length || 0} members</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No team workspaces yet. Create one to get started.</p>
        )}
      </CardContent>
    </Card>
  );
}

