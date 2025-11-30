import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  Search,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Home,
  Book,
  Code,
  Database,
  Rocket,
  Settings,
  BarChart,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  BookOpen,
  Star,
  Filter,
  SortAsc,
  Layers,
  Building2,
  Grid3X3,
  List,
  Crown,
  TrendingUp,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Category icons
const categoryIcons: Record<string, React.ReactNode> = {
  '01-ARCHITECTURE': <Settings className="w-4 h-4" />,
  '02-FEATURES': <Code className="w-4 h-4" />,
  '03-OPERATIONS': <BarChart className="w-4 h-4" />,
  '04-DEPLOYMENT': <Rocket className="w-4 h-4" />,
  '05-GUIDES': <Book className="w-4 h-4" />,
  '07-API': <Database className="w-4 h-4" />,
  '08-DATABASE': <Database className="w-4 h-4" />,
  '09-REPORTS': <BarChart className="w-4 h-4" />,
};

// Document priority levels based on importance
const DOC_PRIORITY: Record<
  string,
  { level: number; label: string; color: string; icon: React.ReactNode }
> = {
  INVESTOR: {
    level: 1,
    label: 'Investor',
    color: 'bg-yellow-500',
    icon: <Crown className="w-3 h-3" />,
  },
  README: {
    level: 2,
    label: 'Overview',
    color: 'bg-blue-500',
    icon: <BookOpen className="w-3 h-3" />,
  },
  'START-HERE': {
    level: 2,
    label: 'Start Here',
    color: 'bg-green-500',
    icon: <Rocket className="w-3 h-3" />,
  },
  ARCHITECTURE: {
    level: 3,
    label: 'Architecture',
    color: 'bg-purple-500',
    icon: <Settings className="w-3 h-3" />,
  },
  FEATURES: {
    level: 4,
    label: 'Features',
    color: 'bg-cyan-500',
    icon: <Code className="w-3 h-3" />,
  },
  QUICK_START: {
    level: 5,
    label: 'Quick Start',
    color: 'bg-green-400',
    icon: <Rocket className="w-3 h-3" />,
  },
  API: { level: 6, label: 'API', color: 'bg-orange-500', icon: <Database className="w-3 h-3" /> },
  DATABASE: {
    level: 7,
    label: 'Database',
    color: 'bg-indigo-500',
    icon: <Database className="w-3 h-3" />,
  },
  DEPLOYMENT: {
    level: 8,
    label: 'Deployment',
    color: 'bg-red-500',
    icon: <Rocket className="w-3 h-3" />,
  },
  GUIDE: { level: 9, label: 'Guide', color: 'bg-teal-500', icon: <Book className="w-3 h-3" /> },
  REPORT: {
    level: 10,
    label: 'Report',
    color: 'bg-gray-500',
    icon: <BarChart className="w-3 h-3" />,
  },
  OTHER: {
    level: 99,
    label: 'Other',
    color: 'bg-slate-400',
    icon: <FileText className="w-3 h-3" />,
  },
};

// Project definitions with display info
const KNOWN_PROJECTS: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  'longsang-admin': {
    name: 'LongSang Admin',
    icon: <Crown className="w-4 h-4" />,
    color: 'bg-yellow-500',
  },
  'sabo-arena': {
    name: 'SABO Arena',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'bg-purple-500',
  },
  'sabo-hub': { name: 'SABO Hub', icon: <Building2 className="w-4 h-4" />, color: 'bg-blue-500' },
  ai_secretary: {
    name: 'AI Secretary',
    icon: <Settings className="w-4 h-4" />,
    color: 'bg-green-500',
  },
  'ainewbie-web': {
    name: 'AI Newbie Web',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'bg-cyan-500',
  },
  'music-video-app': {
    name: 'Music Video App',
    icon: <Code className="w-4 h-4" />,
    color: 'bg-pink-500',
  },
  'long-sang-forge': {
    name: 'Long Sang Forge',
    icon: <Rocket className="w-4 h-4" />,
    color: 'bg-orange-500',
  },
  'vungtau-dream-homes': {
    name: 'Vũng Tàu Dream Homes',
    icon: <Home className="w-4 h-4" />,
    color: 'bg-teal-500',
  },
};

// Get priority info for a document
function getDocPriority(docName: string): (typeof DOC_PRIORITY)[string] {
  const upperName = docName.toUpperCase();
  if (upperName.includes('INVESTOR')) return DOC_PRIORITY['INVESTOR'];
  if (upperName.includes('README')) return DOC_PRIORITY['README'];
  if (upperName.includes('START-HERE') || upperName.includes('START_HERE'))
    return DOC_PRIORITY['START-HERE'];
  if (upperName.includes('ARCHITECTURE')) return DOC_PRIORITY['ARCHITECTURE'];
  if (upperName.includes('FEATURE')) return DOC_PRIORITY['FEATURES'];
  if (upperName.includes('QUICK_START') || upperName.includes('QUICK-START'))
    return DOC_PRIORITY['QUICK_START'];
  if (upperName.includes('API')) return DOC_PRIORITY['API'];
  if (upperName.includes('DATABASE') || upperName.includes('DB_')) return DOC_PRIORITY['DATABASE'];
  if (upperName.includes('DEPLOY')) return DOC_PRIORITY['DEPLOYMENT'];
  if (upperName.includes('GUIDE')) return DOC_PRIORITY['GUIDE'];
  if (upperName.includes('REPORT')) return DOC_PRIORITY['REPORT'];
  return DOC_PRIORITY['OTHER'];
}

interface DocFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  category: string;
  size: number;
  modified: string;
  project?: string;
}

interface DocStats {
  total: number;
  byCategory: Record<string, number>;
  recentlyUpdated: number;
  outdated: number;
}

interface ProjectInfo {
  name: string;
  path: string;
  docsPath: string;
  hasIndex: boolean;
  hasStartHere: boolean;
}

type ViewMode = 'tree' | 'priority' | 'grid';
type SortMode = 'priority' | 'name' | 'modified' | 'category';

export default function DocsViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [stats, setStats] = useState<DocStats | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [projectPath, setProjectPath] = useState<string>(searchParams.get('project') || '');

  // New state for enhanced features
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [sortMode, setSortMode] = useState<SortMode>('priority');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [allProjectDocs, setAllProjectDocs] = useState<Map<string, DocFile[]>>(new Map());

  // Fetch available projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/docs/projects?basePath=D:/0.PROJECTS`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  // Fetch docs list
  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : '';
      const [docsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/docs/scan${params}`),
        fetch(`${API_BASE}/api/docs/stats${params}`),
      ]);

      if (docsRes.ok) {
        const data = await docsRes.json();
        // Map API response to DocFile interface and add project info
        const docsWithProject = (data.docs || data.documents || []).map((doc: any) => ({
          id: doc.id,
          name: doc.title || doc.name || doc.path?.split('/').pop() || 'Untitled',
          path: doc.fullPath || doc.path,
          relativePath: doc.path || doc.relativePath || '',
          category: doc.category || 'UNCATEGORIZED',
          size: doc.size || 0,
          modified: doc.modifiedAt || doc.modified || new Date().toISOString(),
          project: projectPath ? projectPath.split(/[/\\]/).pop() : 'longsang-admin',
        }));
        setDocs(docsWithProject);
        // Expand all categories by default
        const categories = new Set(docsWithProject.map((d: DocFile) => d.category) || []);
        setExpandedCategories(categories);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch docs:', error);
      toast.error('Failed to load documentation');
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  // Fetch docs from all projects
  const fetchAllProjectsDocs = useCallback(async () => {
    if (projects.length === 0) return;

    setLoading(true);
    const allDocs = new Map<string, DocFile[]>();

    try {
      await Promise.all(
        projects.map(async (project) => {
          try {
            const res = await fetch(
              `${API_BASE}/api/docs/scan?projectPath=${encodeURIComponent(project.path)}`
            );
            if (res.ok) {
              const data = await res.json();
              const docsWithProject = (data.docs || data.documents || []).map((doc: any) => ({
                id: doc.id,
                name: doc.title || doc.name || doc.path?.split('/').pop() || 'Untitled',
                path: doc.fullPath || doc.path,
                relativePath: doc.path || doc.relativePath || '',
                category: doc.category || 'UNCATEGORIZED',
                size: doc.size || 0,
                modified: doc.modifiedAt || doc.modified || new Date().toISOString(),
                project: project.name,
              }));
              allDocs.set(project.name, docsWithProject);
            }
          } catch (e) {
            console.error(`Failed to fetch docs for ${project.name}:`, e);
          }
        })
      );

      setAllProjectDocs(allDocs);
    } catch (error) {
      console.error('Failed to fetch all project docs:', error);
    } finally {
      setLoading(false);
    }
  }, [projects]);

  // Fetch doc content
  const fetchDocContent = useCallback(
    async (docId: string) => {
      setContentLoading(true);
      try {
        const params = projectPath ? `?projectPath=${encodeURIComponent(projectPath)}` : '';
        const res = await fetch(
          `${API_BASE}/api/docs/content/${encodeURIComponent(docId)}${params}`
        );
        if (res.ok) {
          const data = await res.json();
          setDocContent(data.content || '');
          setSelectedDoc(docId);
          setSearchParams({ doc: docId, ...(projectPath ? { project: projectPath } : {}) });
        }
      } catch (error) {
        console.error('Failed to fetch doc content:', error);
        toast.error('Failed to load document');
      } finally {
        setContentLoading(false);
      }
    },
    [projectPath, setSearchParams]
  );

  // Initial load
  useEffect(() => {
    fetchDocs();
    fetchProjects();
  }, [fetchDocs, fetchProjects]);

  // Fetch docs when project path changes
  useEffect(() => {
    if (projectPath) {
      fetchDocs();
    }
  }, [projectPath, fetchDocs]);

  // Fetch all project docs when projects are loaded
  useEffect(() => {
    if (projects.length > 0 && selectedProject === 'all') {
      fetchAllProjectsDocs();
    }
  }, [projects, selectedProject, fetchAllProjectsDocs]);

  // Load doc from URL param
  useEffect(() => {
    const docParam = searchParams.get('doc');
    if (docParam && !selectedDoc) {
      fetchDocContent(docParam);
    }
  }, [searchParams, selectedDoc, fetchDocContent]);

  // Group docs by category
  const groupedDocs = docs.reduce(
    (acc, doc) => {
      const category = doc.category || 'UNCATEGORIZED';
      if (!acc[category]) acc[category] = [];
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, DocFile[]>
  );

  // Get combined docs from all projects or selected project
  const combinedDocs = useMemo(() => {
    if (selectedProject === 'all') {
      const allDocs: DocFile[] = [];
      allProjectDocs.forEach((projectDocs) => {
        allDocs.push(...projectDocs);
      });
      return allDocs;
    }
    return docs;
  }, [selectedProject, allProjectDocs, docs]);

  // Sort docs by priority
  const sortedDocs = useMemo(() => {
    const sorted = [...combinedDocs];

    switch (sortMode) {
      case 'priority':
        sorted.sort((a, b) => {
          const priorityA = getDocPriority(a.name).level;
          const priorityB = getDocPriority(b.name).level;
          return priorityA - priorityB;
        });
        break;
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'modified':
        sorted.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());
        break;
      case 'category':
        sorted.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        break;
    }

    return sorted;
  }, [combinedDocs, sortMode]);

  // Filter by priority
  const filteredByPriority = useMemo(() => {
    if (priorityFilter === 'all') return sortedDocs;
    return sortedDocs.filter((doc) => {
      const priority = getDocPriority(doc.name);
      return priority.label.toLowerCase() === priorityFilter.toLowerCase();
    });
  }, [sortedDocs, priorityFilter]);

  // Group docs by project
  const docsByProject = useMemo(() => {
    const grouped: Record<string, DocFile[]> = {};
    filteredByPriority.forEach((doc) => {
      const project = doc.project || 'unknown';
      if (!grouped[project]) grouped[project] = [];
      grouped[project].push(doc);
    });
    return grouped;
  }, [filteredByPriority]);

  // Filter docs by search
  const filteredGroups = Object.entries(groupedDocs)
    .map(([category, categoryDocs]) => ({
      category,
      docs: categoryDocs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.relativePath.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((group) => group.docs.length > 0);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(docContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  // Quick start docs
  const quickStartDocs = [
    { name: '00-START-HERE.md', label: '👔 Giới thiệu', icon: <Home className="w-4 h-4" /> },
    { name: 'HOW_TO_READ_DOCS.md', label: '📖 Hướng dẫn', icon: <Book className="w-4 h-4" /> },
    {
      name: '05-GUIDES/QUICK_START.md',
      label: '⚡ Quick Start',
      icon: <Rocket className="w-4 h-4" />,
    },
    {
      name: '05-GUIDES/DOCS_VIEWER_USER_GUIDE.md',
      label: '❓ Hướng dẫn Viewer',
      icon: <HelpCircle className="w-4 h-4" />,
    },
  ];

  // Handle project selection change
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
    if (value !== 'all') {
      const project = projects.find((p) => p.name === value);
      if (project) {
        setProjectPath(project.path);
      }
    } else {
      setProjectPath('');
    }
  };

  // Render priority badge
  const renderPriorityBadge = (docName: string) => {
    const priority = getDocPriority(docName);
    return (
      <Badge className={`${priority.color} text-white text-[10px] px-1.5 py-0`}>
        {priority.icon}
        <span className="ml-1">{priority.label}</span>
      </Badge>
    );
  };

  // Render doc item
  const renderDocItem = (doc: DocFile, showProject = false) => {
    const priority = getDocPriority(doc.name);
    return (
      <button
        key={doc.id}
        onClick={() => {
          if (doc.project && doc.project !== 'longsang-admin') {
            const project = projects.find((p) => p.name === doc.project);
            if (project) {
              setProjectPath(project.path);
            }
          }
          fetchDocContent(doc.relativePath);
        }}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-md hover:bg-accent transition-colors ${
          selectedDoc === doc.relativePath ? 'bg-accent ring-1 ring-primary' : ''
        }`}
      >
        <div className={`w-1.5 h-1.5 rounded-full ${priority.color}`} />
        <FileText className="w-3 h-3 shrink-0 text-muted-foreground" />
        <div className="flex-1 min-w-0 text-left">
          <div className="truncate font-medium">{doc.name}</div>
          {showProject && doc.project && (
            <div className="text-[10px] text-muted-foreground truncate">
              {KNOWN_PROJECTS[doc.project]?.name || doc.project}
            </div>
          )}
        </div>
        {priority.level <= 5 && (
          <span className={`w-2 h-2 rounded-full ${priority.color}`} title={priority.label} />
        )}
      </button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Sidebar */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        {/* Header with view controls */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Docs Viewer
            </h2>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={viewMode === 'tree' ? 'default' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('tree')}
                title="Tree View"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'priority' ? 'default' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('priority')}
                title="Priority View"
              >
                <Star className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                className="h-7 w-7 p-0"
                onClick={() => setViewMode('grid')}
                title="Project View"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Project Selector */}
          <Select value={selectedProject} onValueChange={handleProjectChange}>
            <SelectTrigger className="h-9">
              <Building2 className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Chọn dự án..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Tất cả dự án</span>
                  <Badge variant="secondary" className="ml-2">
                    {projects.length}
                  </Badge>
                </div>
              </SelectItem>
              {projects.map((project) => {
                const projectInfo = KNOWN_PROJECTS[project.name];
                return (
                  <SelectItem key={project.name} value={project.name}>
                    <div className="flex items-center gap-2">
                      {projectInfo?.icon || <FolderOpen className="w-4 h-4" />}
                      <span>{projectInfo?.name || project.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Filters & Sort */}
        <div className="p-3 border-b flex gap-2">
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <SortAsc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Theo Độ Quan Trọng</SelectItem>
              <SelectItem value="name">Theo Tên</SelectItem>
              <SelectItem value="modified">Mới Cập Nhật</SelectItem>
              <SelectItem value="category">Theo Danh Mục</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 text-xs flex-1">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="investor">🏆 Investor</SelectItem>
              <SelectItem value="overview">📖 Overview</SelectItem>
              <SelectItem value="architecture">🏗️ Architecture</SelectItem>
              <SelectItem value="features">✨ Features</SelectItem>
              <SelectItem value="quick start">🚀 Quick Start</SelectItem>
              <SelectItem value="api">🔌 API</SelectItem>
              <SelectItem value="guide">📚 Guide</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Access - Important Docs */}
        {viewMode === 'priority' && (
          <div className="p-3 border-b bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
            <h3 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <Crown className="w-3 h-3 text-yellow-500" />
              TÀI LIỆU QUAN TRỌNG
            </h3>
            <div className="space-y-1">
              {filteredByPriority
                .filter((doc) => getDocPriority(doc.name).level <= 3)
                .slice(0, 5)
                .map((doc) => renderDocItem(doc, selectedProject === 'all'))}
            </div>
          </div>
        )}

        {/* Doc List */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : viewMode === 'tree' ? (
              /* Tree View - Group by Category */
              <div className="space-y-2">
                {filteredGroups
                  .filter((group) =>
                    group.docs.some(
                      (doc) =>
                        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        doc.relativePath.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  )
                  .map(({ category, docs: categoryDocs }) => (
                    <div key={category}>
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 text-sm font-medium hover:bg-accent rounded-md"
                      >
                        {expandedCategories.has(category) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        {categoryIcons[category] || <FolderOpen className="w-4 h-4" />}
                        <span className="truncate">{category}</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          {categoryDocs.length}
                        </Badge>
                      </button>
                      {expandedCategories.has(category) && (
                        <div className="ml-4 mt-1 space-y-0.5">
                          {categoryDocs.map((doc) => renderDocItem(doc))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ) : viewMode === 'priority' ? (
              /* Priority View - Sorted by importance */
              <div className="space-y-1">
                {filteredByPriority
                  .filter(
                    (doc) =>
                      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      doc.relativePath.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((doc) => renderDocItem(doc, selectedProject === 'all'))}
              </div>
            ) : (
              /* Grid/Project View - Group by Project */
              <div className="space-y-4">
                {Object.entries(docsByProject).map(([projectName, projectDocs]) => {
                  const projectInfo = KNOWN_PROJECTS[projectName];
                  const filteredProjectDocs = projectDocs.filter(
                    (doc) =>
                      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      doc.relativePath.toLowerCase().includes(searchQuery.toLowerCase())
                  );

                  if (filteredProjectDocs.length === 0) return null;

                  return (
                    <div key={projectName} className="border rounded-lg overflow-hidden">
                      <div
                        className={`px-3 py-2 ${projectInfo?.color || 'bg-slate-500'} bg-opacity-20 flex items-center gap-2`}
                      >
                        {projectInfo?.icon || <FolderOpen className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                          {projectInfo?.name || projectName}
                        </span>
                        <Badge variant="secondary" className="ml-auto">
                          {filteredProjectDocs.length}
                        </Badge>
                      </div>
                      <div className="p-2 space-y-0.5 bg-background/50">
                        {filteredProjectDocs.slice(0, 10).map((doc) => renderDocItem(doc))}
                        {filteredProjectDocs.length > 10 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{filteredProjectDocs.length - 10} more docs
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Stats Footer */}
        <div className="p-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <FileCheck className="w-3 h-3" />
                {selectedProject === 'all' ? combinedDocs.length : docs.length} docs
              </span>
              {stats && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {stats.outdated} outdated
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2"
              onClick={() => {
                if (selectedProject === 'all') {
                  fetchAllProjectsDocs();
                } else {
                  fetchDocs();
                }
              }}
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-background">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span>{selectedDoc || 'Select a document'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fetchDocContent('05-GUIDES/DOCS_VIEWER_USER_GUIDE.md')}
              title="Hướng dẫn sử dụng"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              disabled={!docContent}
              title="Copy nội dung"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => selectedDoc && window.open(`vscode://file/${selectedDoc}`, '_blank')}
              disabled={!selectedDoc}
              title="Mở trong VS Code"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto p-8">
            {contentLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : docContent ? (
              <article className="prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {docContent}
                </ReactMarkdown>
              </article>
            ) : (
              <div className="text-center py-20">
                <Book className="w-16 h-16 mx-auto text-muted-foreground/30" />
                <h2 className="mt-4 text-xl font-semibold">Documentation Viewer</h2>
                <p className="mt-2 text-muted-foreground">
                  Select a document from the sidebar to view its content
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  {quickStartDocs.map((doc) => (
                    <Button
                      key={doc.name}
                      variant="outline"
                      onClick={() => fetchDocContent(doc.name)}
                    >
                      {doc.icon}
                      <span className="ml-2">{doc.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
