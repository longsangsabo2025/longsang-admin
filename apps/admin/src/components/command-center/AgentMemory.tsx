/**
 * Agent Memory Component
 * Shared context/memory that persists across all agents
 * This is the "brain" that agents share
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Brain,
  Search,
  Plus,
  Edit,
  Trash2,
  Tag,
  Clock,
  User,
  Building2,
  Target,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  FileText,
  Link2,
  Star,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useMemories,
  useMemoryCategories,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
} from '@/hooks/use-solo-hub';
import type { AgentMemory as AgentMemoryType, CreateMemoryInput } from '@/types/solo-hub.types';

interface MemoryItem {
  id: string;
  type: 'fact' | 'preference' | 'goal' | 'constraint' | 'context' | 'learning';
  category: string;
  title: string;
  content: string;
  tags: string[];
  importance: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  createdAt: Date;
  updatedAt: Date;
  usedCount: number;
  linkedItems?: string[];
}

// Helper to transform DB memory to display format
function transformMemory(dbMemory: AgentMemoryType): MemoryItem {
  return {
    id: dbMemory.id,
    type: dbMemory.memory_type,
    category: dbMemory.category,
    title: dbMemory.title,
    content: dbMemory.content,
    tags: dbMemory.tags,
    importance: dbMemory.importance,
    source: dbMemory.source,
    createdAt: new Date(dbMemory.created_at),
    updatedAt: new Date(dbMemory.updated_at),
    usedCount: dbMemory.used_count,
    linkedItems: dbMemory.linked_items,
  };
}

// Mock memory items - fallback
const mockMemoryItems: MemoryItem[] = [
  // Facts
  {
    id: '1',
    type: 'fact',
    category: 'Business',
    title: 'Company Name',
    content: 'Long Sang - Công ty bất động sản và đầu tư tại Việt Nam',
    tags: ['company', 'brand'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    usedCount: 156,
  },
  {
    id: '2',
    type: 'fact',
    category: 'Business',
    title: 'Target Market',
    content: 'Solo founders, indie hackers, và small business owners muốn scale với AI automation',
    tags: ['market', 'target', 'audience'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-03-01'),
    usedCount: 89,
  },
  {
    id: '3',
    type: 'fact',
    category: 'Product',
    title: 'Main Product',
    content: 'AI-powered admin dashboard và automation tools cho one-person businesses',
    tags: ['product', 'ai', 'saas'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-10'),
    usedCount: 234,
  },

  // Preferences
  {
    id: '4',
    type: 'preference',
    category: 'Communication',
    title: 'Email Tone',
    content:
      'Professional nhưng friendly, không quá formal. Dùng emoji moderate. Luôn có CTA rõ ràng.',
    tags: ['email', 'tone', 'communication'],
    importance: 'high',
    source: 'manual',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    usedCount: 78,
  },
  {
    id: '5',
    type: 'preference',
    category: 'Content',
    title: 'Blog Writing Style',
    content:
      'Conversational, data-driven, với real examples. Avoid fluff, go straight to the point. Vietnamese hoặc English.',
    tags: ['content', 'blog', 'writing'],
    importance: 'high',
    source: 'manual',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    usedCount: 45,
  },
  {
    id: '6',
    type: 'preference',
    category: 'Technical',
    title: 'Tech Stack',
    content:
      'React + TypeScript + Vite, Supabase, TailwindCSS, shadcn/ui. Prefer simple over complex.',
    tags: ['tech', 'stack', 'development'],
    importance: 'high',
    source: 'auto',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
    usedCount: 189,
  },

  // Goals
  {
    id: '7',
    type: 'goal',
    category: 'Business',
    title: 'Q2 2024 Revenue Target',
    content: 'Đạt $10,000 MRR vào cuối Q2 2024',
    tags: ['revenue', 'q2', 'mrr'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    usedCount: 34,
  },
  {
    id: '8',
    type: 'goal',
    category: 'Marketing',
    title: 'Email List Growth',
    content: 'Grow email list to 5,000 subscribers by end of month',
    tags: ['email', 'list', 'growth'],
    importance: 'high',
    source: 'manual',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    usedCount: 12,
  },

  // Constraints
  {
    id: '9',
    type: 'constraint',
    category: 'Budget',
    title: 'Monthly Marketing Budget',
    content: 'Maximum $2,000/month cho tất cả marketing activities. Prefer organic > paid.',
    tags: ['budget', 'marketing', 'limit'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-03-01'),
    usedCount: 56,
  },
  {
    id: '10',
    type: 'constraint',
    category: 'Time',
    title: 'Available Time',
    content: 'Solo founder, maximum 4 hours/day cho business operations. Rest by automation.',
    tags: ['time', 'availability', 'automation'],
    importance: 'critical',
    source: 'manual',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    usedCount: 89,
  },

  // Learnings
  {
    id: '11',
    type: 'learning',
    category: 'Marketing',
    title: 'LinkedIn > Twitter for B2B',
    content:
      'A/B test showed LinkedIn posts get 3x engagement vs Twitter cho target audience. Focus more on LinkedIn.',
    tags: ['linkedin', 'twitter', 'social', 'learning'],
    importance: 'medium',
    source: 'auto',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    usedCount: 23,
  },
  {
    id: '12',
    type: 'learning',
    category: 'Sales',
    title: 'Best Email Send Time',
    content: 'Emails sent 9-10 AM Tuesday/Thursday có highest open rate (35% vs 22% average)',
    tags: ['email', 'timing', 'optimization'],
    importance: 'medium',
    source: 'auto',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    usedCount: 67,
  },
];

const typeIcons: Record<string, React.ReactNode> = {
  fact: <FileText className="h-4 w-4 text-blue-500" />,
  preference: <Star className="h-4 w-4 text-yellow-500" />,
  goal: <Target className="h-4 w-4 text-green-500" />,
  constraint: <AlertCircle className="h-4 w-4 text-red-500" />,
  context: <Building2 className="h-4 w-4 text-purple-500" />,
  learning: <Lightbulb className="h-4 w-4 text-orange-500" />,
};

const importanceColors = {
  critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  low: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

export function AgentMemory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);

  // Real data hooks
  const {
    data: memoriesData,
    isLoading,
    refetch,
  } = useMemories({
    memory_type: selectedType !== 'all' ? (selectedType as MemoryItem['type']) : undefined,
    search: searchQuery || undefined,
  });
  const createMemory = useCreateMemory();
  const deleteMemory = useDeleteMemory();

  // Transform and fallback to mock data
  const memories: MemoryItem[] = useMemo(() => {
    if (memoriesData && memoriesData.length > 0) {
      return memoriesData.map(transformMemory);
    }
    return mockMemoryItems;
  }, [memoriesData]);

  // New memory form state
  const [newMemory, setNewMemory] = useState({
    type: 'fact' as MemoryItem['type'],
    category: '',
    title: '',
    content: '',
    tags: '',
    importance: 'medium' as MemoryItem['importance'],
  });

  // Filter memories (already filtered by hook, but keep for local filtering)
  const filteredMemories = memories.filter((m) => {
    const matchesSearch =
      searchQuery === '' ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || m.type === selectedType;
    return matchesSearch && matchesType;
  });

  // Stats
  const totalMemories = memories.length;
  const criticalCount = memories.filter((m) => m.importance === 'critical').length;
  const recentlyUsed = memories.filter((m) => m.usedCount > 50).length;
  const byType = memories.reduce(
    (acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleAddMemory = async () => {
    const input: CreateMemoryInput = {
      memory_type: newMemory.type,
      category: newMemory.category,
      title: newMemory.title,
      content: newMemory.content,
      tags: newMemory.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      importance: newMemory.importance,
      source: 'manual',
    };

    await createMemory.mutateAsync(input);
    setIsAddDialogOpen(false);
    setNewMemory({
      type: 'fact',
      category: '',
      title: '',
      content: '',
      tags: '',
      importance: 'medium',
    });
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteMemory.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            Agent Memory
          </h1>
          <p className="text-muted-foreground">Shared context và knowledge cho tất cả AI Agents</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Memory
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Memory</DialogTitle>
              <DialogDescription>Thêm thông tin mới vào agent memory</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newMemory.type}
                    onChange={(e) =>
                      setNewMemory((prev) => ({
                        ...prev,
                        type: e.target.value as MemoryItem['type'],
                      }))
                    }
                  >
                    <option value="fact">Fact</option>
                    <option value="preference">Preference</option>
                    <option value="goal">Goal</option>
                    <option value="constraint">Constraint</option>
                    <option value="context">Context</option>
                    <option value="learning">Learning</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Importance</label>
                  <select
                    className="w-full mt-1 p-2 border rounded-md"
                    value={newMemory.importance}
                    onChange={(e) =>
                      setNewMemory((prev) => ({
                        ...prev,
                        importance: e.target.value as MemoryItem['importance'],
                      }))
                    }
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Input
                  placeholder="e.g., Business, Marketing, Technical"
                  value={newMemory.category}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="Brief title for this memory"
                  value={newMemory.title}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content</label>
                <Textarea
                  placeholder="The actual information/knowledge"
                  value={newMemory.content}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, content: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="tag1, tag2, tag3"
                  value={newMemory.tags}
                  onChange={(e) => setNewMemory((prev) => ({ ...prev, tags: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMemory}>Add Memory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Memories</p>
                <p className="text-2xl font-bold">{totalMemories}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Frequently Used</p>
                <p className="text-2xl font-bold text-green-500">{recentlyUsed}</p>
              </div>
              <ArrowUpRight className="h-8 w-8 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Learnings</p>
                <p className="text-2xl font-bold text-orange-500">{byType.learning || 0}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-orange-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={selectedType} onValueChange={setSelectedType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fact">Facts</TabsTrigger>
                <TabsTrigger value="preference">Preferences</TabsTrigger>
                <TabsTrigger value="goal">Goals</TabsTrigger>
                <TabsTrigger value="constraint">Constraints</TabsTrigger>
                <TabsTrigger value="learning">Learnings</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Memory List */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Bank</CardTitle>
          <CardDescription>{filteredMemories.length} memories found</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredMemories.map((memory) => (
                <MemoryCard
                  key={memory.id}
                  memory={memory}
                  onEdit={() => setEditingMemory(memory)}
                  onDelete={() => handleDeleteMemory(memory.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// Memory Card Component
function MemoryCard({
  memory,
  onEdit,
  onDelete,
}: {
  memory: MemoryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          {typeIcons[memory.type]}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{memory.title}</h4>
              <Badge variant="outline" className={importanceColors[memory.importance]}>
                {memory.importance}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {memory.category}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{memory.content}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3" />
                {memory.tags.join(', ')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {memory.updatedAt.toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                Used {memory.usedCount}x
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AgentMemory;
