import { useIntegrations, useCreateIntegration, useDeleteIntegration, useTestSlackIntegration } from '@/brain/hooks/useIntegrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Settings, Plus, Trash2, TestTube } from 'lucide-react';
import { useState } from 'react';

export function IntegrationSettings() {
  const { data: integrations, isLoading } = useIntegrations();
  const createIntegrationMutation = useCreateIntegration();
  const deleteIntegrationMutation = useDeleteIntegration();
  const testSlackMutation = useTestSlackIntegration();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [integrationType, setIntegrationType] = useState<'slack' | 'webhook'>('slack');
  const [webhookUrl, setWebhookUrl] = useState('');

  const handleCreateIntegration = async () => {
    if (integrationType === 'slack' && !webhookUrl) {
      return;
    }

    await createIntegrationMutation.mutateAsync({
      integrationType,
      config: {
        webhook_url: webhookUrl,
      },
      isActive: true,
    });

    setWebhookUrl('');
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this integration?')) {
      await deleteIntegrationMutation.mutateAsync(id);
    }
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
              <Settings className="h-5 w-5" /> Integrations
            </CardTitle>
            <CardDescription>Manage external integrations</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Integration</DialogTitle>
                <DialogDescription>Configure a new external integration</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Integration Type</Label>
                  <select
                    className="w-full p-2 border rounded"
                    value={integrationType}
                    onChange={(e) => setIntegrationType(e.target.value as any)}
                  >
                    <option value="slack">Slack</option>
                    <option value="webhook">Webhook</option>
                  </select>
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <Input
                    placeholder="Enter webhook URL"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateIntegration} disabled={createIntegrationMutation.isPending || !webhookUrl} className="w-full">
                  {createIntegrationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Add Integration
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {integrations && integrations.length > 0 ? (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div key={integration.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{integration.integration_type}</span>
                    <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                      {integration.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {integration.integration_type === 'slack' && 'Slack notifications'}
                    {integration.integration_type === 'webhook' && 'Custom webhook'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {integration.integration_type === 'slack' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testSlackMutation.mutate()}
                      disabled={testSlackMutation.isPending}
                    >
                      <TestTube className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(integration.id)}
                    disabled={deleteIntegrationMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No integrations configured</p>
        )}
      </CardContent>
    </Card>
  );
}

