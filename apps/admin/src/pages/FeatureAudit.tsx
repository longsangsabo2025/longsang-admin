import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNavigate } from 'react-router-dom';
import {
  FileSearch,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeatureItem {
  id: string;
  name: string;
  route: string;
  page: string;
  status: 'in-menu' | 'hidden' | 'duplicate' | 'orphan';
  category: string;
  description: string;
  duplicateOf?: string;
}

const allFeatures: FeatureItem[] = [
  // ===== ĐANG CÓ TRONG MENU =====
  {
    id: '1',
    name: 'Bảng Điều Khiển',
    route: '/admin',
    page: 'AdminDashboard.tsx',
    status: 'in-menu',
    category: 'Trung Tâm',
    description: 'Dashboard chính',
  },
  {
    id: '2',
    name: 'Quản Lý Dự Án',
    route: '/admin/projects',
    page: 'ProjectsHub.tsx',
    status: 'in-menu',
    category: 'Trung Tâm',
    description: 'Danh sách tất cả projects',
  },
  {
    id: '3',
    name: 'Credentials Vault',
    route: '/admin/vault',
    page: 'CredentialsVault.tsx',
    status: 'in-menu',
    category: 'Trung Tâm',
    description: 'Quản lý API keys tổng hợp',
  },
  {
    id: '4',
    name: 'Project Agents',
    route: '/admin/project-agents',
    page: 'ProjectAgentsManager.tsx',
    status: 'in-menu',
    category: 'Trung Tâm',
    description: 'Quản lý agents theo project',
  },
  {
    id: '5',
    name: 'n8n Server',
    route: '/admin/n8n',
    page: 'N8nManagement.tsx',
    status: 'in-menu',
    category: 'AI & Automation',
    description: 'Quản lý n8n server',
  },
  {
    id: '6',
    name: 'Workflows',
    route: '/admin/workflows',
    page: 'AdminWorkflows.tsx',
    status: 'in-menu',
    category: 'AI & Automation',
    description: 'Test & debug workflows',
  },
  {
    id: '7',
    name: 'Import Workflow',
    route: '/admin/workflow-import',
    page: 'WorkflowImport.tsx',
    status: 'in-menu',
    category: 'AI & Automation',
    description: 'Import workflow từ JSON',
  },
  {
    id: '8',
    name: 'AI Agents',
    route: '/agent-center',
    page: 'AgentCenter.tsx',
    status: 'in-menu',
    category: 'AI & Automation',
    description: 'Trung tâm AI Agents',
  },
  {
    id: '9',
    name: 'Sora Video AI',
    route: '/admin/sora-video',
    page: 'SoraVideoGenerator.tsx',
    status: 'in-menu',
    category: 'AI & Automation',
    description: 'Tạo video với Sora AI',
  },
  {
    id: '10',
    name: 'SEO Center',
    route: '/admin/seo-center',
    page: 'AdminSEOCenter.tsx',
    status: 'in-menu',
    category: 'Marketing',
    description: 'Quản lý SEO',
  },
  {
    id: '11',
    name: 'Nội Dung',
    route: '/admin/content-queue',
    page: 'AdminContentQueue.tsx',
    status: 'in-menu',
    category: 'Marketing',
    description: 'Hàng đợi nội dung',
  },
  {
    id: '12',
    name: 'Social Media',
    route: '/admin/social-media',
    page: 'SocialMediaManagement.tsx',
    status: 'in-menu',
    category: 'Marketing',
    description: 'Quản lý mạng xã hội',
  },
  {
    id: '13',
    name: 'Google Services',
    route: '/admin/google-services',
    page: 'GoogleServices.tsx',
    status: 'in-menu',
    category: 'Marketing',
    description: 'Tích hợp Google',
  },
  {
    id: '14',
    name: 'AI Academy',
    route: '/academy',
    page: 'Academy.tsx',
    status: 'in-menu',
    category: 'Đào Tạo',
    description: 'Nền tảng học AI',
  },
  {
    id: '15',
    name: 'Khóa Học',
    route: '/admin/courses',
    page: 'AdminCourses.tsx',
    status: 'in-menu',
    category: 'Đào Tạo',
    description: 'Quản lý khóa học',
  },
  {
    id: '16',
    name: 'Quản Lý Users',
    route: '/admin/users',
    page: 'AdminUsers.tsx',
    status: 'in-menu',
    category: 'Hệ Thống',
    description: 'Quản lý người dùng',
  },
  {
    id: '17',
    name: 'Files & Docs',
    route: '/admin/files',
    page: 'AdminFileManagerReal.tsx',
    status: 'in-menu',
    category: 'Hệ Thống',
    description: 'Quản lý file',
  },
  {
    id: '18',
    name: 'Database',
    route: '/admin/database-schema',
    page: 'DatabaseSchema.tsx',
    status: 'in-menu',
    category: 'Hệ Thống',
    description: 'Schema database',
  },
  {
    id: '19',
    name: 'Cài Đặt',
    route: '/admin/settings',
    page: 'AdminSettings.tsx',
    status: 'in-menu',
    category: 'Hệ Thống',
    description: 'Cài đặt hệ thống',
  },

  // ===== CÓ ROUTE NHƯNG KHÔNG TRONG MENU =====
  {
    id: '20',
    name: 'Analytics',
    route: '/admin/analytics',
    page: 'AdminAnalytics.tsx',
    status: 'hidden',
    category: 'Marketing',
    description: 'Analytics dashboard',
  },
  {
    id: '21',
    name: 'Consultations',
    route: '/admin/consultations',
    page: 'AdminConsultations.tsx',
    status: 'hidden',
    category: 'Trung Tâm',
    description: 'Quản lý tư vấn',
  },
  {
    id: '22',
    name: 'Document Editor',
    route: '/admin/documents',
    page: 'AdminDocumentEditor.tsx',
    status: 'hidden',
    category: 'Hệ Thống',
    description: 'Soạn thảo văn bản',
  },
  {
    id: '23',
    name: 'Credential Manager',
    route: '/admin/credentials',
    page: 'CredentialManager.tsx',
    status: 'duplicate',
    category: 'Trung Tâm',
    description: 'Quản lý credentials (cũ)',
    duplicateOf: 'Credentials Vault',
  },
  {
    id: '24',
    name: 'SEO Monitoring',
    route: '/admin/seo-monitoring',
    page: 'SEOMonitoringDashboard',
    status: 'duplicate',
    category: 'Marketing',
    description: 'Giám sát SEO',
    duplicateOf: 'SEO Center',
  },
  {
    id: '25',
    name: 'Subscription',
    route: '/admin/subscription',
    page: 'SubscriptionDashboard',
    status: 'hidden',
    category: 'Hệ Thống',
    description: 'Quản lý gói đăng ký',
  },
  {
    id: '26',
    name: 'Platform Integrations',
    route: '/admin/integrations',
    page: 'PlatformIntegrations.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Tích hợp platform',
  },
  {
    id: '27',
    name: 'Google Automation',
    route: '/admin/google-automation',
    page: 'GoogleAutomation.tsx',
    status: 'duplicate',
    category: 'Marketing',
    description: 'Google automation',
    duplicateOf: 'Google Services',
  },
  {
    id: '28',
    name: 'Google Maps',
    route: '/admin/google-maps',
    page: 'GoogleMaps.tsx',
    status: 'duplicate',
    category: 'Marketing',
    description: 'Google Maps',
    duplicateOf: 'Google Services',
  },
  {
    id: '29',
    name: 'Unified Analytics',
    route: '/admin/unified-analytics',
    page: 'UnifiedAnalyticsDashboard',
    status: 'duplicate',
    category: 'Marketing',
    description: 'Analytics tổng hợp',
    duplicateOf: 'Analytics',
  },
  {
    id: '30',
    name: 'Marketing Automation',
    route: '/admin/marketing-automation',
    page: 'MarketingAutomation.tsx',
    status: 'hidden',
    category: 'Marketing',
    description: 'Tự động hóa marketing',
  },
  {
    id: '31',
    name: 'Knowledge Base',
    route: '/admin/knowledge-base',
    page: 'KnowledgeBaseEditor.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Quản lý knowledge base',
  },
  {
    id: '32',
    name: 'Workflow Manager',
    route: '/admin/workflow-manager',
    page: 'WorkflowManager.tsx',
    status: 'duplicate',
    category: 'AI & Automation',
    description: 'Quản lý workflow (cũ)',
    duplicateOf: 'Workflows',
  },

  // ===== CÓ FILE NHƯNG KHÔNG CÓ ROUTE =====
  {
    id: '33',
    name: 'AINewbie Showcase',
    route: 'N/A',
    page: 'AINewbieShowcase.tsx',
    status: 'orphan',
    category: 'Showcase',
    description: 'Showcase AINewbie',
  },
  {
    id: '34',
    name: 'App Showcase',
    route: 'N/A',
    page: 'AppShowcase.tsx',
    status: 'orphan',
    category: 'Showcase',
    description: 'Showcase ứng dụng',
  },
  {
    id: '35',
    name: 'App Showcase List',
    route: 'N/A',
    page: 'AppShowcaseList.tsx',
    status: 'orphan',
    category: 'Showcase',
    description: 'Danh sách showcase',
  },
  {
    id: '36',
    name: 'SaboHub Showcase',
    route: 'N/A',
    page: 'SaboHubShowcase.tsx',
    status: 'orphan',
    category: 'Showcase',
    description: 'Showcase SaboHub',
  },
  {
    id: '37',
    name: 'Agent Detail Python',
    route: 'N/A',
    page: 'AgentDetailPython.tsx',
    status: 'orphan',
    category: 'AI & Automation',
    description: 'Chi tiết agent Python',
  },
  {
    id: '38',
    name: 'Project Investment',
    route: 'N/A',
    page: 'ProjectInvestment.tsx',
    status: 'orphan',
    category: 'Investment',
    description: 'Đầu tư dự án',
  },
  {
    id: '39',
    name: 'Automation Dashboard',
    route: '/automation',
    page: 'AutomationDashboard.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Dashboard automation',
  },
  {
    id: '40',
    name: 'Agent Detail',
    route: '/automation/agents/:id',
    page: 'AgentDetail.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Chi tiết agent',
  },
  {
    id: '41',
    name: 'Agent Test',
    route: '/agent-test',
    page: 'AgentTest.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Test agent',
  },
  {
    id: '42',
    name: 'Analytics Dashboard',
    route: '/analytics',
    page: 'AnalyticsDashboard.tsx',
    status: 'hidden',
    category: 'Marketing',
    description: 'Dashboard analytics',
  },
  {
    id: '43',
    name: 'Workflow Test',
    route: '/workflow-test',
    page: 'WorkflowTest.tsx',
    status: 'hidden',
    category: 'AI & Automation',
    description: 'Test workflow (public)',
  },

  // ===== PROJECT DETAIL PAGES =====
  {
    id: '44',
    name: 'Project Detail',
    route: '/admin/projects/:projectId',
    page: 'ProjectDetail.tsx',
    status: 'in-menu',
    category: 'Trung Tâm',
    description: 'Chi tiết project (từ ProjectsHub)',
  },
  {
    id: '45',
    name: 'Project Command Center',
    route: '/admin/p/:slug',
    page: 'ProjectCommandCenter.tsx',
    status: 'hidden',
    category: 'Trung Tâm',
    description: 'Command center dự án',
  },
];

const statusConfig = {
  'in-menu': { label: 'Đang hiển thị', color: 'bg-green-500', icon: Check },
  hidden: { label: 'Ẩn (có route)', color: 'bg-yellow-500', icon: EyeOff },
  duplicate: { label: 'Trùng lặp', color: 'bg-orange-500', icon: AlertTriangle },
  orphan: { label: 'Mồ côi (không route)', color: 'bg-red-500', icon: X },
};

const FeatureAudit = () => {
  const navigate = useNavigate();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllByStatus = (status: string) => {
    const items = allFeatures.filter((f) => f.status === status);
    setSelectedItems(new Set(items.map((i) => i.id)));
  };

  const filteredFeatures =
    filterStatus === 'all' ? allFeatures : allFeatures.filter((f) => f.status === filterStatus);

  const groupedFeatures = filteredFeatures.reduce(
    (acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push(feature);
      return acc;
    },
    {} as Record<string, FeatureItem[]>
  );

  const stats = {
    total: allFeatures.length,
    inMenu: allFeatures.filter((f) => f.status === 'in-menu').length,
    hidden: allFeatures.filter((f) => f.status === 'hidden').length,
    duplicate: allFeatures.filter((f) => f.status === 'duplicate').length,
    orphan: allFeatures.filter((f) => f.status === 'orphan').length,
  };

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      stats,
      features: allFeatures,
      selectedForRemoval: Array.from(selectedItems).map((id) =>
        allFeatures.find((f) => f.id === id)
      ),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature-audit-report.json';
    a.click();

    toast.success('Đã xuất báo cáo!');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
            <FileSearch className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">🔍 Feature Audit</h1>
            <p className="text-muted-foreground">Kiểm tra tất cả tính năng trong codebase</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => setFilterStatus('all')}>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Tổng cộng</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md border-green-500/50"
          onClick={() => setFilterStatus('in-menu')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{stats.inMenu}</div>
            <div className="text-sm text-muted-foreground">Đang hiển thị</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md border-yellow-500/50"
          onClick={() => setFilterStatus('hidden')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.hidden}</div>
            <div className="text-sm text-muted-foreground">Ẩn</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md border-orange-500/50"
          onClick={() => setFilterStatus('duplicate')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.duplicate}</div>
            <div className="text-sm text-muted-foreground">Trùng lặp</div>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:shadow-md border-red-500/50"
          onClick={() => setFilterStatus('orphan')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-red-600">{stats.orphan}</div>
            <div className="text-sm text-muted-foreground">Mồ côi</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {selectedItems.size > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedItems.size} đã chọn</Badge>
              <span className="text-sm text-muted-foreground">
                Sẵn sàng để xóa hoặc thêm vào menu
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                Bỏ chọn tất cả
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa {selectedItems.size} file
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh sách tính năng</CardTitle>
              <CardDescription>
                {filterStatus === 'all'
                  ? 'Tất cả'
                  : statusConfig[filterStatus as keyof typeof statusConfig]?.label}{' '}
                ({filteredFeatures.length} items)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => selectAllByStatus('duplicate')}>
                Chọn trùng lặp
              </Button>
              <Button variant="outline" size="sm" onClick={() => selectAllByStatus('orphan')}>
                Chọn mồ côi
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            {Object.entries(groupedFeatures).map(([category, features]) => (
              <div key={category} className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                  📁 {category} ({features.length})
                </h3>
                <div className="space-y-2">
                  {features.map((feature) => {
                    const StatusIcon = statusConfig[feature.status].icon;
                    return (
                      <div
                        key={feature.id}
                        className={`p-3 rounded-lg border transition-all ${
                          selectedItems.has(feature.id)
                            ? 'border-red-500 bg-red-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedItems.has(feature.id)}
                            onCheckedChange={() => toggleSelect(feature.id)}
                          />
                          <div
                            className={`w-2 h-2 rounded-full ${statusConfig[feature.status].color}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{feature.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  feature.status === 'in-menu'
                                    ? 'border-green-500 text-green-500'
                                    : feature.status === 'hidden'
                                      ? 'border-yellow-500 text-yellow-500'
                                      : feature.status === 'duplicate'
                                        ? 'border-orange-500 text-orange-500'
                                        : 'border-red-500 text-red-500'
                                }`}
                              >
                                {statusConfig[feature.status].label}
                              </Badge>
                              {feature.duplicateOf && (
                                <Badge variant="secondary" className="text-xs">
                                  ↔️ {feature.duplicateOf}
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {feature.description}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <code className="bg-slate-800 px-1.5 py-0.5 rounded">
                                {feature.route}
                              </code>
                              <span className="text-slate-500">{feature.page}</span>
                            </div>
                          </div>
                          {feature.route !== 'N/A' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  feature.route
                                    .replace(':projectId', 'test')
                                    .replace(':slug', 'test')
                                    .replace(':id', 'test')
                                )
                              }
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="mt-4" />
              </div>
            ))}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📋 Chú thích</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm">
                <strong>Đang hiển thị:</strong> Có trong menu sidebar
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="text-sm">
                <strong>Ẩn:</strong> Có route nhưng không trong menu
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm">
                <strong>Trùng lặp:</strong> Tính năng giống tính năng khác
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm">
                <strong>Mồ côi:</strong> Có file nhưng không có route
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeatureAudit;
