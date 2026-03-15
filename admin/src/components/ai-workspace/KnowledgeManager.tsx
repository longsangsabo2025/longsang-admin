/**
 * 🧠 Knowledge Manager
 * UI để quản lý kiến thức nạp cho AI
 * - Profile: Thông tin cá nhân
 * - Projects: Các dự án đang làm
 * - Goals: Mục tiêu & Roadmap
 * - Knowledge Base: Kiến thức tổng hợp
 * - Prompt Debug: Xem prompt cuối cùng
 */

import {
  BookOpen,
  Brain,
  Bug,
  Building2,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Target,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PromptDebugger } from './PromptDebugger';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AdminProfile {
  user_id: string;
  full_name: string;
  role: string;
  communication_style: string;
  response_preference: string;
  expertise_level: string;
  preferred_language: string;
  ai_verbosity: string;
}

interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
  priority: number;
  tech_stack: Record<string, unknown>;
  urls: Record<string, string>;
  created_at: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  timeframe: string;
  priority: number;
  status: string;
  progress_percent: number;
  key_results: string[];
}

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
  importance: number;
  tags: string[];
  source: string;
  created_at: string;
}

interface Business {
  id: string;
  name: string;
  type: string;
  description: string;
  status: string;
}

export function KnowledgeManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Data states
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  // Dialog states
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [businessDialogOpen, setBusinessDialogOpen] = useState(false);

  // Edit states
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [editingGoal, setEditingGoal] = useState<Partial<Goal> | null>(null);
  const [editingKnowledge, setEditingKnowledge] = useState<Partial<KnowledgeEntry> | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Partial<Business> | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { 'x-user-id': 'default-longsang-user' };

      const [profileRes, projectsRes, goalsRes, knowledgeRes, businessesRes] = await Promise.all([
        fetch(`${API_BASE}/api/knowledge/profile`, { headers }),
        fetch(`${API_BASE}/api/knowledge/projects`, { headers }),
        fetch(`${API_BASE}/api/knowledge/goals`, { headers }),
        fetch(`${API_BASE}/api/knowledge/entries`, { headers }),
        fetch(`${API_BASE}/api/knowledge/businesses`, { headers }),
      ]);

      const [profileData, projectsData, goalsData, knowledgeData, businessesData] =
        await Promise.all([
          profileRes.json(),
          projectsRes.json(),
          goalsRes.json(),
          knowledgeRes.json(),
          businessesRes.json(),
        ]);

      if (profileData.success) setProfile(profileData.profile);
      if (projectsData.success) setProjects(projectsData.projects || []);
      if (goalsData.success) setGoals(goalsData.goals || []);
      if (knowledgeData.success) setKnowledge(knowledgeData.entries || []);
      if (businessesData.success) setBusinesses(businessesData.businesses || []);
    } catch (error) {
      // Use centralized error handler
      const { captureError } = await import('@/lib/bug-system');
      await captureError(error as Error, {
        component: 'KnowledgeManager',
        action: 'fetchData',
      });
      toast.error('Không thể tải dữ liệu Knowledge Base');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save profile
  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'default-longsang-user',
        },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Đã lưu profile thành công!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi khi lưu profile');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Add/Update Project
  const saveProject = async () => {
    if (!editingProject?.name) return;
    setSaving(true);
    try {
      const method = editingProject.id ? 'PUT' : 'POST';
      const url = editingProject.id
        ? `${API_BASE}/api/knowledge/projects/${editingProject.id}`
        : `${API_BASE}/api/knowledge/projects`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'default-longsang-user',
        },
        body: JSON.stringify(editingProject),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingProject.id ? 'Đã cập nhật project!' : 'Đã thêm project mới!');
        setProjectDialogOpen(false);
        setEditingProject(null);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi khi lưu project');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Add/Update Goal
  const saveGoal = async () => {
    if (!editingGoal?.title) return;
    setSaving(true);
    try {
      const method = editingGoal.id ? 'PUT' : 'POST';
      const url = editingGoal.id
        ? `${API_BASE}/api/knowledge/goals/${editingGoal.id}`
        : `${API_BASE}/api/knowledge/goals`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'default-longsang-user',
        },
        body: JSON.stringify(editingGoal),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingGoal.id ? 'Đã cập nhật goal!' : 'Đã thêm goal mới!');
        setGoalDialogOpen(false);
        setEditingGoal(null);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi khi lưu goal');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Add/Update Knowledge Entry
  const saveKnowledge = async () => {
    if (!editingKnowledge?.title || !editingKnowledge?.content) return;
    setSaving(true);
    try {
      const method = editingKnowledge.id ? 'PUT' : 'POST';
      const url = editingKnowledge.id
        ? `${API_BASE}/api/knowledge/entries/${editingKnowledge.id}`
        : `${API_BASE}/api/knowledge/entries`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'default-longsang-user',
        },
        body: JSON.stringify(editingKnowledge),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingKnowledge.id ? 'Đã cập nhật kiến thức!' : 'Đã thêm kiến thức mới!');
        setKnowledgeDialogOpen(false);
        setEditingKnowledge(null);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Lỗi khi lưu kiến thức');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const deleteProject = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa project này?')) return;
    try {
      await fetch(`${API_BASE}/api/knowledge/projects/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'default-longsang-user' },
      });
      toast.success('Đã xóa project!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa project');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa goal này?')) return;
    try {
      await fetch(`${API_BASE}/api/knowledge/goals/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'default-longsang-user' },
      });
      toast.success('Đã xóa goal!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa goal');
    }
  };

  const deleteKnowledge = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa kiến thức này?')) return;
    try {
      await fetch(`${API_BASE}/api/knowledge/entries/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': 'default-longsang-user' },
      });
      toast.success('Đã xóa kiến thức!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi khi xóa kiến thức');
    }
  };

  // Filter knowledge by search
  const filteredKnowledge = knowledge.filter(
    (k) =>
      k.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'planning':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'paused':
        return 'bg-gray-500';
      case 'live':
        return 'bg-purple-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'personal':
        return <User className="h-4 w-4" />;
      case 'business':
        return <Building2 className="h-4 w-4" />;
      case 'project':
        return <FolderKanban className="h-4 w-4" />;
      case 'technical':
        return <Search className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải Knowledge Base...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Knowledge Manager</h2>
          <Badge variant="secondary" className="ml-2">
            {projects.length} Projects • {goals.length} Goals • {knowledge.length} Entries
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="projects" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="h-4 w-4" />
            Goals ({goals.length})
          </TabsTrigger>
          <TabsTrigger value="knowledge" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Knowledge ({knowledge.length})
          </TabsTrigger>
          <TabsTrigger value="businesses" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business ({businesses.length})
          </TabsTrigger>
          <TabsTrigger value="debug" className="gap-2">
            <Bug className="h-4 w-4" />
            Debug
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="flex-1 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Admin Profile
              </CardTitle>
              <CardDescription>Thông tin cá nhân để AI hiểu bạn hơn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Họ tên</Label>
                      <Input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Vai trò</Label>
                      <Input
                        value={profile.role}
                        onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phong cách giao tiếp</Label>
                      <Select
                        value={profile.communication_style}
                        onValueChange={(v) => setProfile({ ...profile, communication_style: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Trực tiếp</SelectItem>
                          <SelectItem value="formal">Trang trọng</SelectItem>
                          <SelectItem value="casual">Thoải mái</SelectItem>
                          <SelectItem value="technical">Kỹ thuật</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ngôn ngữ ưa thích</Label>
                      <Select
                        value={profile.preferred_language}
                        onValueChange={(v) => setProfile({ ...profile, preferred_language: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vi">Tiếng Việt</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="both">Cả hai</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Trình độ chuyên môn</Label>
                      <Select
                        value={profile.expertise_level}
                        onValueChange={(v) => setProfile({ ...profile, expertise_level: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Mới bắt đầu</SelectItem>
                          <SelectItem value="intermediate">Trung cấp</SelectItem>
                          <SelectItem value="advanced">Nâng cao</SelectItem>
                          <SelectItem value="expert">Chuyên gia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Độ dài câu trả lời AI</Label>
                      <Select
                        value={profile.ai_verbosity}
                        onValueChange={(v) => setProfile({ ...profile, ai_verbosity: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="concise">Ngắn gọn</SelectItem>
                          <SelectItem value="medium">Vừa phải</SelectItem>
                          <SelectItem value="detailed">Chi tiết</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={saveProfile} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Lưu Profile
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Project Registry
                  </CardTitle>
                  <CardDescription>
                    Các dự án bạn đang thực hiện - AI sẽ biết để hỗ trợ tốt hơn
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingProject({});
                    setProjectDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{project.name}</h4>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(project.status)} text-white`}
                            >
                              {project.status}
                            </Badge>
                            <Badge variant="secondary">{project.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.description}
                          </p>
                          {project.urls && Object.keys(project.urls).length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {Object.entries(project.urls).map(([key, url]) => (
                                <a
                                  key={key}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline"
                                >
                                  {key}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingProject(project);
                              setProjectDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có project nào. Thêm project để AI biết bạn đang làm gì!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Goals & Roadmap
                  </CardTitle>
                  <CardDescription>
                    Mục tiêu và lộ trình - AI sẽ nhắc nhở và hỗ trợ bạn đạt được
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingGoal({});
                    setGoalDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Goal
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{goal.title}</h4>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(goal.status)} text-white`}
                            >
                              {goal.status}
                            </Badge>
                            <Badge variant="secondary">{goal.timeframe}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${goal.progress_percent}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium">{goal.progress_percent}%</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingGoal(goal);
                              setGoalDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteGoal(goal.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {goals.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có goal nào. Thêm mục tiêu để AI giúp bạn theo dõi!
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Knowledge Base
                  </CardTitle>
                  <CardDescription>
                    Kiến thức tổng hợp - AI sẽ dùng để trả lời câu hỏi của bạn
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tìm kiếm..."
                      className="pl-9 w-[200px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      setEditingKnowledge({});
                      setKnowledgeDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm Kiến thức
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {filteredKnowledge.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(entry.category)}
                            <h4 className="font-semibold">{entry.title}</h4>
                            <Badge variant="secondary">{entry.category}</Badge>
                            <Badge variant="outline">Độ quan trọng: {entry.importance}/10</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {entry.content}
                          </p>
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {entry.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingKnowledge(entry);
                              setKnowledgeDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteKnowledge(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredKnowledge.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {searchQuery
                        ? 'Không tìm thấy kết quả.'
                        : 'Chưa có kiến thức nào. Thêm để AI học hỏi!'}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Businesses Tab */}
        <TabsContent value="businesses" className="flex-1 mt-4">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Business Entities
                  </CardTitle>
                  <CardDescription>Các công ty/doanh nghiệp của bạn</CardDescription>
                </div>
                <Button
                  onClick={() => {
                    setEditingBusiness({});
                    setBusinessDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm Business
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            <h4 className="font-semibold">{business.name}</h4>
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(business.status)} text-white`}
                            >
                              {business.status}
                            </Badge>
                            <Badge variant="secondary">{business.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {business.description}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {businesses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có business entity nào.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Tab */}
        <TabsContent value="debug" className="flex-1 mt-4">
          <PromptDebugger />
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProject?.id ? 'Sửa Project' : 'Thêm Project mới'}</DialogTitle>
            <DialogDescription>
              Thông tin project sẽ được AI sử dụng để hỗ trợ bạn tốt hơn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tên Project *</Label>
              <Input
                value={editingProject?.name || ''}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                placeholder="VD: AI Newbie Platform"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select
                  value={editingProject?.type || 'webapp'}
                  onValueChange={(v) => setEditingProject({ ...editingProject, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webapp">Web App</SelectItem>
                    <SelectItem value="mobile">Mobile App</SelectItem>
                    <SelectItem value="api">API/Backend</SelectItem>
                    <SelectItem value="ai">AI/ML</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                <Select
                  value={editingProject?.status || 'active'}
                  onValueChange={(v) => setEditingProject({ ...editingProject, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={editingProject?.description || ''}
                onChange={(e) =>
                  setEditingProject({ ...editingProject, description: e.target.value })
                }
                placeholder="Mô tả ngắn về project..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProjectDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveProject} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGoal?.id ? 'Sửa Goal' : 'Thêm Goal mới'}</DialogTitle>
            <DialogDescription>Mục tiêu để AI theo dõi và nhắc nhở bạn</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề Goal *</Label>
              <Input
                value={editingGoal?.title || ''}
                onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                placeholder="VD: Launch AI Newbie MVP"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select
                  value={editingGoal?.timeframe || 'Q1 2025'}
                  onValueChange={(v) => setEditingGoal({ ...editingGoal, timeframe: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Q4 2025">Q4 2025</SelectItem>
                    <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                    <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                    <SelectItem value="2026">Năm 2026</SelectItem>
                    <SelectItem value="long-term">Dài hạn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tiến độ (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editingGoal?.progress_percent || 0}
                  onChange={(e) =>
                    setEditingGoal({
                      ...editingGoal,
                      progress_percent: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Mô tả</Label>
              <Textarea
                value={editingGoal?.description || ''}
                onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                placeholder="Chi tiết về mục tiêu..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveGoal} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Knowledge Dialog */}
      <Dialog open={knowledgeDialogOpen} onOpenChange={setKnowledgeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingKnowledge?.id ? 'Sửa Kiến thức' : 'Thêm Kiến thức mới'}
            </DialogTitle>
            <DialogDescription>
              Kiến thức này sẽ được AI sử dụng khi trả lời câu hỏi của bạn
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tiêu đề *</Label>
              <Input
                value={editingKnowledge?.title || ''}
                onChange={(e) =>
                  setEditingKnowledge({ ...editingKnowledge, title: e.target.value })
                }
                placeholder="VD: Quy trình deploy website"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Danh mục</Label>
                <Select
                  value={editingKnowledge?.category || 'technical'}
                  onValueChange={(v) => setEditingKnowledge({ ...editingKnowledge, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Cá nhân</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                    <SelectItem value="process">Quy trình</SelectItem>
                    <SelectItem value="decision">Quyết định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Độ quan trọng (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={editingKnowledge?.importance || 5}
                  onChange={(e) =>
                    setEditingKnowledge({
                      ...editingKnowledge,
                      importance: parseInt(e.target.value, 10) || 5,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nội dung *</Label>
              <Textarea
                value={editingKnowledge?.content || ''}
                onChange={(e) =>
                  setEditingKnowledge({ ...editingKnowledge, content: e.target.value })
                }
                placeholder="Nội dung chi tiết..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Tags (cách nhau bằng dấu phẩy)</Label>
              <Input
                value={(editingKnowledge?.tags || []).join(', ')}
                onChange={(e) =>
                  setEditingKnowledge({
                    ...editingKnowledge,
                    tags: e.target.value
                      .split(',')
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="deploy, vercel, nextjs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKnowledgeDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={saveKnowledge} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default KnowledgeManager;
