/**
 * Knowledge Manager Component
 * Full CRUD management for knowledge items with filtering, search, edit, delete
 */

import { useDomains } from "@/brain/hooks/useDomains";
import { useAllKnowledge, useDeleteKnowledge, useUpdateKnowledge } from "@/brain/hooks/useKnowledge";
import type { Knowledge } from "@/brain/types/brain.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Code,
  Link,
  StickyNote,
  Database,
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface KnowledgeManagerProps {
  readonly selectedDomainId?: string | null;
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  url: <Link className="h-4 w-4" />,
  note: <StickyNote className="h-4 w-4" />,
};

const PAGE_SIZE = 20;

export function KnowledgeManager({ selectedDomainId }: KnowledgeManagerProps) {
  // State
  const [page, setPage] = useState(0);
  const [filterDomainId, setFilterDomainId] = useState<string>(selectedDomainId || "all");
  const [filterContentType, setFilterContentType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingKnowledge, setEditingKnowledge] = useState<Knowledge | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    content: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  
  // View dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingKnowledge, setViewingKnowledge] = useState<Knowledge | null>(null);
  
  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Hooks
  const { data: domains } = useDomains();
  const { data: knowledgeData, isLoading, refetch, isFetching } = useAllKnowledge({
    domainId: filterDomainId === "all" ? undefined : filterDomainId,
    contentType: filterContentType === "all" ? undefined : filterContentType,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });
  const updateKnowledge = useUpdateKnowledge();
  const deleteKnowledge = useDeleteKnowledge();

  // Computed values
  const knowledge = knowledgeData?.data || [];
  const total = knowledgeData?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Filter locally by search query
  const filteredKnowledge = useMemo(() => {
    if (!searchQuery.trim()) return knowledge;
    const q = searchQuery.toLowerCase();
    return knowledge.filter(
      (k) =>
        k.title.toLowerCase().includes(q) ||
        k.content.toLowerCase().includes(q) ||
        k.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [knowledge, searchQuery]);

  // Domain name lookup
  const getDomainName = (domainId: string) => {
    const domain = domains?.find((d) => d.id === domainId);
    return domain?.name || "Unknown Domain";
  };

  // Handlers
  const handleEdit = (item: Knowledge) => {
    setEditingKnowledge(item);
    setEditForm({
      title: item.title,
      content: item.content,
      tags: item.tags || [],
    });
    setEditDialogOpen(true);
  };

  const handleView = (item: Knowledge) => {
    setViewingKnowledge(item);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteKnowledge.mutateAsync(deletingId);
      setDeleteDialogOpen(false);
      setDeletingId(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const saveEdit = async () => {
    if (!editingKnowledge) return;
    try {
      await updateKnowledge.mutateAsync({
        id: editingKnowledge.id,
        ...editForm,
      });
      setEditDialogOpen(false);
      setEditingKnowledge(null);
    } catch (error) {
      // Error handled by hook
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !editForm.tags.includes(tagInput.trim())) {
      setEditForm({
        ...editForm,
        tags: [...editForm.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setEditForm({
      ...editForm,
      tags: editForm.tags.filter((t) => t !== tag),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Knowledge Manager
            </CardTitle>
            <CardDescription>
              Quản lý tất cả kiến thức đã nạp vào Brain ({total} items)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo title, content, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Select value={filterDomainId} onValueChange={(v) => { setFilterDomainId(v); setPage(0); }}>
            <SelectTrigger className="w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by Domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              {domains?.map((domain) => (
                <SelectItem key={domain.id} value={domain.id}>
                  {domain.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterContentType} onValueChange={(v) => { setFilterContentType(v); setPage(0); }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="code">Code</SelectItem>
              <SelectItem value="url">URL</SelectItem>
              <SelectItem value="note">Note</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredKnowledge.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có knowledge nào</p>
            <p className="text-sm">Sử dụng Knowledge Ingestion để thêm kiến thức mới</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Title</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKnowledge.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium truncate max-w-[300px]" title={item.title}>
                        {item.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {item.content.substring(0, 80)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDomainName(item.domainId)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {CONTENT_TYPE_ICONS[item.contentType] || <FileText className="h-4 w-4" />}
                        <span className="text-sm capitalize">{item.contentType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {item.tags?.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(item.tags?.length || 0) > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(item.tags?.length || 0) - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(item)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(item)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingKnowledge?.title}</DialogTitle>
            <DialogDescription>
              {viewingKnowledge && getDomainName(viewingKnowledge.domainId)} •{" "}
              {viewingKnowledge?.contentType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {viewingKnowledge?.tags?.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                {viewingKnowledge?.content}
              </pre>
            </div>
            {viewingKnowledge?.sourceUrl && (
              <p className="text-sm text-muted-foreground">
                Source: <a href={viewingKnowledge.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{viewingKnowledge.sourceUrl}</a>
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Created: {viewingKnowledge && new Date(viewingKnowledge.createdAt).toLocaleString("vi-VN")}
              {viewingKnowledge?.updatedAt && viewingKnowledge.updatedAt !== viewingKnowledge.createdAt && (
                <> • Updated: {new Date(viewingKnowledge.updatedAt).toLocaleString("vi-VN")}</>
              )}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Knowledge</DialogTitle>
            <DialogDescription>
              Chỉnh sửa nội dung knowledge. Embedding sẽ được regenerate nếu content thay đổi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEdit} disabled={updateKnowledge.isPending}>
              {updateKnowledge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa knowledge này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteKnowledge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
