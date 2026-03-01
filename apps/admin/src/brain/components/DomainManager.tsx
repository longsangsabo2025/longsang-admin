/**
 * Domain Manager Component
 * Manages domain CRUD operations
 */

import {
  useCreateDomain,
  useDeleteDomain,
  useDomains,
  useUpdateDomain,
} from '@/brain/hooks/useDomains';
import type { CreateDomainInput, Domain } from '@/brain/types/brain.types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit, FolderOpen, Plus, Trash2, BarChart3, Bot, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDomainStats } from '@/brain/hooks/useDomainStats';

interface DomainManagerProps {
  readonly onDomainSelect?: (domainId: string | null) => void;
  readonly selectedDomainId?: string | null;
}

export function DomainManager({ onDomainSelect, selectedDomainId }: DomainManagerProps) {
  const { data: domains, isLoading } = useDomains();
  const createDomain = useCreateDomain();
  const updateDomain = useUpdateDomain();
  const deleteDomain = useDeleteDomain();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [deletingDomain, setDeletingDomain] = useState<Domain | null>(null);
  const [formData, setFormData] = useState<CreateDomainInput>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'folder',
  });

  const handleCreate = async () => {
    try {
      await createDomain.mutateAsync(formData);
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', color: '#3B82F6', icon: 'folder' });
    } catch {
      // Error handled by hook
    }
  };

  const handleUpdate = async () => {
    if (!editingDomain) return;
    try {
      await updateDomain.mutateAsync({ id: editingDomain.id, input: formData });
      setEditingDomain(null);
      setFormData({ name: '', description: '', color: '#3B82F6', icon: 'folder' });
    } catch {
      // Error handled by hook
    }
  };

  const handleDelete = async () => {
    if (!deletingDomain) return;
    try {
      await deleteDomain.mutateAsync(deletingDomain.id);
      setDeletingDomain(null);
    } catch {
      // Error handled by hook
    }
  };

  const startEdit = (domain: Domain) => {
    setEditingDomain(domain);
    setFormData({
      name: domain.name,
      description: domain.description || '',
      color: domain.color || '#3B82F6',
      icon: domain.icon || 'folder',
    });
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading domains...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Create Button */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Domain
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Domain</DialogTitle>
            <DialogDescription>
              Add a new knowledge domain to organize your information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Business, Technology, Health"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formData.name || createDomain.isPending}>
              {createDomain.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingDomain} onOpenChange={(open) => !open && setEditingDomain(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
            <DialogDescription>Update domain information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input
                id="edit-color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="h-10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDomain(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name || updateDomain.isPending}>
              {updateDomain.isPending ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingDomain}
        onOpenChange={(open) => !open && setDeletingDomain(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingDomain?.name}"? This will also delete all
              knowledge in this domain. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Domains List */}
      {domains && domains.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {domains.map((domain) => (
            <DomainCard
              key={domain.id}
              domain={domain}
              selectedDomainId={selectedDomainId}
              onSelect={() => onDomainSelect?.(domain.id)}
              onEdit={() => startEdit(domain)}
              onDelete={() => setDeletingDomain(domain)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No domains yet. Create your first domain to get started!</p>
        </div>
      )}
    </div>
  );
}

/**
 * Domain Card Component with Statistics Preview
 */
function DomainCard({
  domain,
  selectedDomainId,
  onSelect,
  onEdit,
  onDelete,
}: {
  readonly domain: Domain;
  readonly selectedDomainId?: string | null;
  readonly onSelect: () => void;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}) {
  const { data: stats } = useDomainStats(domain.id);

  return (
    <div
      className={`p-4 border rounded-lg transition-colors ${
        selectedDomainId === domain.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          <FolderOpen className="h-5 w-5" style={{ color: domain.color || '#3B82F6' }} />
          <div className="flex-1">
            <h3 className="font-semibold">{domain.name}</h3>
            {domain.description && (
              <p className="text-sm text-muted-foreground">{domain.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Link to={`/brain/domain/${domain.id}`}>
            <Button variant="ghost" size="sm" asChild>
              <span>
                <ExternalLink className="h-4 w-4" />
              </span>
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Statistics Preview */}
      {stats && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t">
          <div className="text-center">
            <p className="text-lg font-bold">{stats.totalKnowledge}</p>
            <p className="text-xs text-muted-foreground">Items</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{stats.totalQueries}</p>
            <p className="text-xs text-muted-foreground">Queries</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">{stats.uniqueTags}</p>
            <p className="text-xs text-muted-foreground">Tags</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mt-3">
        <Link to={`/brain/domain/${domain.id}?tab=agent`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <Bot className="h-3 w-3 mr-1" />
            Agent
          </Button>
        </Link>
        <Link to={`/brain/domain/${domain.id}?tab=overview`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            <BarChart3 className="h-3 w-3 mr-1" />
            Stats
          </Button>
        </Link>
      </div>
    </div>
  );
}
