import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Users, Mail, Phone, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: boolean;
  notes: string;
  created_at: string;
}

interface ProjectTeamTabProps {
  projectId: string;
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    role: 'developer',
    email: '',
    phone: '',
    is_primary: false,
    notes: '',
  });

  useEffect(() => {
    fetchContacts();
  }, [projectId]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_contacts')
        .select('*')
        .eq('project_id', projectId)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Error fetching contacts:', error);
      toast.error('Không thể tải contacts');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    try {
      const { error } = await supabase.from('project_contacts').insert({
        ...newContact,
        project_id: projectId,
      });

      if (error) throw error;

      toast.success('Đã thêm team member!');
      setShowAddDialog(false);
      setNewContact({
        name: '',
        role: 'developer',
        email: '',
        phone: '',
        is_primary: false,
        notes: '',
      });
      fetchContacts();
    } catch (error: any) {
      console.error('Error adding contact:', error);
      toast.error('Không thể thêm contact');
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa?')) return;

    try {
      const { error } = await supabase.from('project_contacts').delete().eq('id', id);

      if (error) throw error;
      toast.success('Đã xóa!');
      fetchContacts();
    } catch (error: any) {
      console.error('Error deleting contact:', error);
      toast.error('Không thể xóa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team & Contacts</h3>
          <p className="text-sm text-muted-foreground">
            Quản lý team members và contacts của dự án
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tên</Label>
                <Input
                  placeholder="Nguyễn Văn A"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newContact.role}
                  onValueChange={(v) => setNewContact({ ...newContact, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="designer">Designer</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+84 xxx xxx xxx"
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={newContact.is_primary}
                  onChange={(e) => setNewContact({ ...newContact, is_primary: e.target.checked })}
                />
                <Label htmlFor="is_primary">Primary Contact</Label>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input
                  placeholder="Mô tả thêm..."
                  value={newContact.notes}
                  onChange={(e) => setNewContact({ ...newContact, notes: e.target.value })}
                />
              </div>
              <Button onClick={addContact} className="w-full">
                Thêm Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team List */}
      {contacts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có team member nào</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Member đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contacts.map((contact) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{contact.name}</span>
                        {contact.is_primary && <Badge variant="default">Primary</Badge>}
                      </div>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {contact.role}
                      </Badge>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
