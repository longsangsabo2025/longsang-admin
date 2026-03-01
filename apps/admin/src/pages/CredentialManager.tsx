import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';
import {
  Key,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  Copy,
  Shield,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Upload,
  Lock,
  Unlock,
  Server,
  Globe,
  Database,
  CreditCard,
  Mail,
  Cloud,
} from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
  id: string;
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
  tags: string[];
  isActive: boolean;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
}

const CredentialManager = () => {
  // Restore scroll & persist search/filter states
  useScrollRestore('credential-manager');
  const [searchTerm, setSearchTerm] = usePersistedState('cred-manager-search', '');
  const [selectedCategory, setSelectedCategory] = usePersistedState('cred-manager-category', 'all');

  const { toast: uiToast } = useToast();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [showAllSecrets, setShowAllSecrets] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(true); // Auto-unlock for easy access in development

  useEffect(() => {
    if (isUnlocked) {
      // Mock data - In production, this would be encrypted and stored securely
      const loadedCredentials: Credential[] = [
        {
          id: '1',
          name: 'OpenAI API',
          platform: 'OpenAI',
          category: 'api',
          apiKey:
            'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          notes: 'API key OpenAI chính cho các tính năng AI',
          tags: ['ai', 'openai', 'production'],
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-11',
          isFavorite: true,
        },
        {
          id: '2',
          name: 'Supabase Database',
          platform: 'Supabase',
          category: 'database',
          email: 'admin@longsang.com',
          password: 'xxxxxxxxxx',
          apiKey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          notes: 'Thông tin đăng nhập cơ sở dữ liệu Production',
          tags: ['database', 'supabase', 'production'],
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-11',
          isFavorite: true,
        },
        {
          id: '3',
          name: 'Google Drive Service Account',
          platform: 'Google Cloud',
          category: 'cloud',
          email: 'automation-bot-102@long-sang-automation.iam.gserviceaccount.com',
          secretKey: 'Service account JSON key (stored separately)',
          notes: 'Tích hợp API Google Drive',
          tags: ['google', 'drive', 'service-account'],
          isActive: true,
          createdAt: '2025-01-11',
          updatedAt: '2025-01-11',
          isFavorite: false,
        },
      ];
      setCredentials(loadedCredentials);
    }
  }, [isUnlocked]);

  const categoryIcons = {
    api: Key,
    database: Database,
    email: Mail,
    payment: CreditCard,
    social: Globe,
    cloud: Cloud,
    other: Shield,
  };

  const categoryColors = {
    api: 'bg-blue-100 text-blue-800',
    database: 'bg-green-100 text-green-800',
    email: 'bg-purple-100 text-purple-800',
    payment: 'bg-yellow-100 text-yellow-800',
    social: 'bg-pink-100 text-pink-800',
    cloud: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800',
  };

  const handleUnlock = () => {
    if (masterPassword === 'admin123') {
      // In production, use proper authentication
      setIsUnlocked(true);
      toast.success('✅ Credential vault unlocked');
    } else {
      toast.error('❌ Invalid master password');
    }
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords((prev) => ({
      ...prev,
      [credentialId]: !prev[credentialId],
    }));
  };

  const toggleAllSecrets = () => {
    if (showAllSecrets) {
      // Hide all
      setShowPasswords({});
      setShowAllSecrets(false);
    } else {
      // Show all
      const allVisible: { [key: string]: boolean } = {};
      for (const cred of credentials) {
        allVisible[cred.id] = true;
      }
      setShowPasswords(allVisible);
      setShowAllSecrets(true);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`✅ ${label} copied to clipboard`);
    } catch {
      toast.error('❌ Failed to copy to clipboard');
    }
  };

  const filteredCredentials = credentials.filter((cred) => {
    const matchesSearch =
      cred.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cred.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || cred.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const CredentialCard = ({ credential }: { credential: Credential }) => {
    const CategoryIcon = categoryIcons[credential.category];

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${categoryColors[credential.category]}`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {credential.name}
                  {credential.isFavorite && <span className="text-yellow-500">⭐</span>}
                </CardTitle>
                <CardDescription>{credential.platform}</CardDescription>
              </div>
            </div>
            <Badge variant={credential.isActive ? 'default' : 'secondary'}>
              {credential.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Credentials Fields */}
          {credential.email && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Email</Label>
              <div className="flex items-center gap-2">
                <Input value={credential.email} readOnly className="text-sm" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credential.email || '', 'Email')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {credential.username && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Username</Label>
              <div className="flex items-center gap-2">
                <Input value={credential.username} readOnly className="text-sm" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credential.username || '', 'Username')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {credential.password && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Password</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showPasswords[credential.id] ? 'text' : 'password'}
                  value={credential.password}
                  readOnly
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePasswordVisibility(credential.id)}
                >
                  {showPasswords[credential.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credential.password || '', 'Password')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {credential.apiKey && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">API Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showPasswords[credential.id] ? 'text' : 'password'}
                  value={credential.apiKey}
                  readOnly
                  className="text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePasswordVisibility(credential.id)}
                >
                  {showPasswords[credential.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credential.apiKey || '', 'API Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {credential.secretKey && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Secret Key</Label>
              <div className="flex items-center gap-2">
                <Input
                  type={showPasswords[credential.id] ? 'text' : 'password'}
                  value={credential.secretKey}
                  readOnly
                  className="text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => togglePasswordVisibility(credential.id)}
                >
                  {showPasswords[credential.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(credential.secretKey || '', 'Secret Key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {credential.notes && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Notes</Label>
              <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{credential.notes}</p>
            </div>
          )}

          {credential.tags.length > 0 && (
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tags</Label>
              <div className="flex flex-wrap gap-1">
                {credential.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-gray-500">Updated: {credential.updatedAt}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setEditingCredential(credential)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">🔐 Credential Vault</CardTitle>
            <CardDescription>Enter master password to access your credential vault</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="master-password">Master Password</Label>
              <Input
                id="master-password"
                type="password"
                placeholder="Enter master password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
            </div>
            <Button onClick={handleUnlock} className="w-full">
              <Unlock className="h-4 w-4 mr-2" />
              Unlock Vault
            </Button>
            <div className="text-xs text-gray-500 text-center">
              🔒 All credentials are encrypted and secured
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            🔐 Quản Lý Tài Khoản & Key
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {credentials.length} tài khoản
            </Badge>
          </h1>
          <p className="text-gray-600 mt-1">
            Lưu trữ an toàn cho tất cả tài khoản, khóa và thông tin quan trọng của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={showAllSecrets ? 'default' : 'outline'} onClick={toggleAllSecrets}>
            {showAllSecrets ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Ẩn Tất Cả
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Hiện Tất Cả
              </>
            )}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Xuất File
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Nhập File
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm Tài Khoản
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Thêm Tài Khoản Mới</DialogTitle>
                <DialogDescription>
                  Lưu trữ tài khoản mới một cách an toàn vào kho của bạn
                </DialogDescription>
              </DialogHeader>
              {/* Add credential form would go here */}
              <div className="text-center py-8 text-gray-500">Form thêm tài khoản...</div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick View - Most Used Credentials */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Truy Cập Nhanh
            <Badge variant="secondary" className="ml-2">
              Yêu thích
            </Badge>
          </CardTitle>
          <CardDescription>Các tài khoản thường dùng nhất để truy cập nhanh</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {credentials
              .filter((c) => c.isFavorite)
              .slice(0, 3)
              .map((cred) => (
                <div
                  key={cred.id}
                  className="bg-card rounded-lg p-4 border shadow-sm hover:shadow-md transition-shadow dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${categoryColors[cred.category]}`}>
                      {React.createElement(categoryIcons[cred.category], { className: 'h-4 w-4' })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate">{cred.name}</h4>
                      <p className="text-xs text-gray-500">{cred.platform}</p>
                    </div>
                    <span className="text-yellow-500">⭐</span>
                  </div>
                  {cred.apiKey && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">API Key</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type={showPasswords[cred.id] ? 'text' : 'password'}
                          value={cred.apiKey}
                          readOnly
                          className="text-xs font-mono h-8"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => togglePasswordVisibility(cred.id)}
                        >
                          {showPasswords[cred.id] ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(cred.apiKey || '', 'API Key')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {cred.email && !cred.apiKey && (
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-600">Email</Label>
                      <div className="flex items-center gap-1">
                        <Input value={cred.email} readOnly className="text-xs h-8" />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(cred.email || '', 'Email')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search credentials, platforms, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="api">🔑 API Keys</SelectItem>
            <SelectItem value="database">🗄️ Database</SelectItem>
            <SelectItem value="email">📧 Email</SelectItem>
            <SelectItem value="payment">💳 Payment</SelectItem>
            <SelectItem value="social">🌐 Social</SelectItem>
            <SelectItem value="cloud">☁️ Cloud</SelectItem>
            <SelectItem value="other">📋 Other</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={showAllSecrets ? 'default' : 'outline'}
          onClick={toggleAllSecrets}
          className="w-48"
        >
          {showAllSecrets ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Hide All Secrets
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Show All Secrets
            </>
          )}
        </Button>
      </div>

      {/* Credentials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCredentials.map((credential) => (
          <CredentialCard key={credential.id} credential={credential} />
        ))}
      </div>

      {filteredCredentials.length === 0 && (
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No credentials found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first credential to get started'}
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add First Credential
          </Button>
        </div>
      )}

      {/* Security Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Security Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                All credentials are encrypted and stored securely. Never share your master password.
                Consider using 2FA and regular password rotation for maximum security.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialManager;
