import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import { Plus, Key, Database, Mail, CreditCard, Globe, Cloud, Shield } from 'lucide-react';

interface CredentialFormData {
  name: string;
  platform: string;
  category: 'api' | 'database' | 'email' | 'payment' | 'social' | 'cloud' | 'other';
  username?: string;
  email?: string;
  password?: string;
  apiKey?: string;
  secretKey?: string;
  accessToken?: string;
  refreshToken?: string;
  notes?: string;
  tags: string;
  isActive: boolean;
  isFavorite: boolean;
}

interface AddCredentialFormProps {
  onSave: (credential: CredentialFormData) => void;
  onCancel: () => void;
  editingCredential?: any;
}

const AddCredentialForm = ({ onSave, onCancel, editingCredential }: AddCredentialFormProps) => {
  const [formData, setFormData] = useState<CredentialFormData>({
    name: editingCredential?.name || '',
    platform: editingCredential?.platform || '',
    category: editingCredential?.category || 'api',
    username: editingCredential?.username || '',
    email: editingCredential?.email || '',
    password: editingCredential?.password || '',
    apiKey: editingCredential?.apiKey || '',
    secretKey: editingCredential?.secretKey || '',
    accessToken: editingCredential?.accessToken || '',
    refreshToken: editingCredential?.refreshToken || '',
    notes: editingCredential?.notes || '',
    tags: editingCredential?.tags?.join(', ') || '',
    isActive: editingCredential?.isActive ?? true,
    isFavorite: editingCredential?.isFavorite ?? false,
  });

  const categoryIcons = {
    api: Key,
    database: Database,
    email: Mail,
    payment: CreditCard,
    social: Globe,
    cloud: Cloud,
    other: Shield
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.platform) {
      toast.error('❌ Name and Platform are required');
      return;
    }

    onSave(formData);
    toast.success(`✅ Credential ${editingCredential ? 'updated' : 'added'} successfully`);
  };

  const updateFormData = (field: keyof CredentialFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Plus className="h-5 w-5 text-blue-600" />
          </div>
          {editingCredential ? 'Edit Credential' : 'Add New Credential'}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Credential Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., OpenAI API, Gmail Account"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform *</Label>
                <Input
                  id="platform"
                  placeholder="e.g., OpenAI, Google, GitHub"
                  value={formData.platform}
                  onChange={(e) => updateFormData('platform', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => updateFormData('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">🔑 API Keys</SelectItem>
                  <SelectItem value="database">🗄️ Database</SelectItem>
                  <SelectItem value="email">📧 Email</SelectItem>
                  <SelectItem value="payment">💳 Payment</SelectItem>
                  <SelectItem value="social">🌐 Social</SelectItem>
                  <SelectItem value="cloud">☁️ Cloud</SelectItem>
                  <SelectItem value="other">📋 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Authentication Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Authentication Details</CardTitle>
            <CardDescription>
              Fill in the relevant authentication information for this credential
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Username or login name"
                  value={formData.username}
                  onChange={(e) => updateFormData('username', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password (will be encrypted)"
                value={formData.password}
                onChange={(e) => updateFormData('password', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Textarea
                id="apiKey"
                placeholder="API Key or public key"
                value={formData.apiKey}
                onChange={(e) => updateFormData('apiKey', e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretKey">Secret Key</Label>
              <Textarea
                id="secretKey"
                placeholder="Secret key, private key, or client secret"
                value={formData.secretKey}
                onChange={(e) => updateFormData('secretKey', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  placeholder="Access token"
                  value={formData.accessToken}
                  onChange={(e) => updateFormData('accessToken', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="refreshToken">Refresh Token</Label>
                <Input
                  id="refreshToken"
                  placeholder="Refresh token"
                  value={formData.refreshToken}
                  onChange={(e) => updateFormData('refreshToken', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes, usage instructions, or important information..."
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Separate tags with commas (e.g., production, ai, openai)"
                value={formData.tags}
                onChange={(e) => updateFormData('tags', e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Tags help organize and search your credentials
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => updateFormData('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active credential</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFavorite"
                    checked={formData.isFavorite}
                    onCheckedChange={(checked) => updateFormData('isFavorite', checked)}
                  />
                  <Label htmlFor="isFavorite">Mark as favorite</Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            <Plus className="h-4 w-4 mr-2" />
            {editingCredential ? 'Update Credential' : 'Add Credential'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCredentialForm;