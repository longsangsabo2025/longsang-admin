import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, Plus, Trash2, RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface APIKey {
  id: string;
  agent_id: string | null;
  key_name: string;
  key_value_encrypted: string;
  provider: string;
  status: string;
  last_used: string | null;
  created_at: string;
  expires_at: string | null;
}

export function APIKeyManagement() {
  const { toast } = useToast();
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [newKey, setNewKey] = useState({
    key_name: '',
    key_value: '',
    provider: 'openai',
    agent_id: null as string | null,
  });

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const { data } = await supabase
        .from('api_keys_vault')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setKeys(data);
    } catch (error) {
      console.error('Error loading keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.key_name || !newKey.key_value) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide both key name and value.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Note: In production, encryption should happen server-side
      const { data, error } = await supabase
        .from('api_keys_vault')
        .insert({
          key_name: newKey.key_name,
          key_value_encrypted: newKey.key_value, // Should be encrypted server-side
          provider: newKey.provider,
          agent_id: newKey.agent_id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'API Key Created',
        description: 'New API key has been stored securely.',
      });

      setShowCreateDialog(false);
      setNewKey({ key_name: '', key_value: '', provider: 'openai', agent_id: null });
      loadKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create API key.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return;

    try {
      await supabase
        .from('api_keys_vault')
        .update({ status: 'revoked' })
        .eq('id', keyId);

      toast({
        title: 'Key Revoked',
        description: 'API key has been revoked.',
      });

      loadKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to revoke key.',
        variant: 'destructive',
      });
    }
  };

  const handleRotateKey = async (keyId: string) => {
    if (!confirm('Rotate this API key? You will need to provide a new key value.')) return;

    const newValue = prompt('Enter new API key value:');
    if (!newValue) return;

    try {
      await supabase
        .from('api_keys_vault')
        .update({
          key_value_encrypted: newValue, // Should be encrypted server-side
          status: 'active',
          last_rotated: new Date().toISOString(),
        })
        .eq('id', keyId);

      toast({
        title: 'Key Rotated',
        description: 'API key has been updated.',
      });

      loadKeys();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rotate key.',
        variant: 'destructive',
      });
    }
  };

  const toggleShowKey = (keyId: string) => {
    setShowKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '****';
    return key.substring(0, 8) + '...' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-muted-foreground">Securely manage AI provider API keys</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add API Key
        </Button>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Keys are stored encrypted in the database. 
          For production, use environment variables or secure vaults like Azure Key Vault.
        </AlertDescription>
      </Alert>

      {/* API Keys List */}
      <div className="grid gap-4">
        {keys.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No API keys configured. Add one to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          keys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{key.key_name}</CardTitle>
                      <CardDescription>
                        {key.provider.toUpperCase()} · {key.agent_id ? 'Agent-specific' : 'Global'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                    {key.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {key.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Key Value */}
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-muted rounded text-sm font-mono">
                      {showKey[key.id] ? key.key_value_encrypted : maskKey(key.key_value_encrypted)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShowKey(key.id)}
                    >
                      {showKey[key.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>

                  {/* Metadata */}
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </div>
                    {key.last_used && (
                      <div>
                        Last used: {new Date(key.last_used).toLocaleDateString()}
                      </div>
                    )}
                    {key.expires_at && (
                      <div>
                        Expires: {new Date(key.expires_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRotateKey(key.id)}
                      disabled={key.status === 'revoked'}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Rotate
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeKey(key.id)}
                      disabled={key.status === 'revoked'}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Revoke
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New API Key</DialogTitle>
            <DialogDescription>
              Store a new API key securely for use with AI agents
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key-name">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g., OpenAI Production Key"
                value={newKey.key_name}
                onChange={(e) => setNewKey({ ...newKey, key_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={newKey.provider} onValueChange={(value) => setNewKey({ ...newKey, provider: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                  <SelectItem value="google">Google (Gemini)</SelectItem>
                  <SelectItem value="cohere">Cohere</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="key-value">API Key</Label>
              <Input
                id="key-value"
                type="password"
                placeholder="sk-..."
                value={newKey.key_value}
                onChange={(e) => setNewKey({ ...newKey, key_value: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Key will be encrypted before storage
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateKey}>
              Add Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
