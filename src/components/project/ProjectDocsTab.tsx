import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  RefreshCw, 
  FolderOpen,
  FileText,
  ExternalLink,
  Trash2,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Document {
  id: string;
  title: string;
  doc_type: string;
  url: string;
  content: string;
  notes: string;
  created_at: string;
}

interface ProjectDocsTabProps {
  projectId: string;
}

export function ProjectDocsTab({ projectId }: ProjectDocsTabProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: "",
    doc_type: "note",
    url: "",
    content: "",
    notes: ""
  });

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error("Không thể tải documents");
    } finally {
      setLoading(false);
    }
  };

  const addDocument = async () => {
    try {
      const { error } = await supabase
        .from("project_documents")
        .insert({
          ...newDoc,
          project_id: projectId
        });

      if (error) throw error;
      
      toast.success("Đã thêm document!");
      setShowAddDialog(false);
      setNewDoc({
        title: "",
        doc_type: "note",
        url: "",
        content: "",
        notes: ""
      });
      fetchDocuments();
    } catch (error: any) {
      console.error("Error adding document:", error);
      toast.error("Không thể thêm document");
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa?")) return;
    
    try {
      const { error } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Đã xóa!");
      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Không thể xóa");
    }
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case "link":
        return <ExternalLink className="h-5 w-5 text-blue-500" />;
      case "file":
        return <Download className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-purple-500" />;
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
          <h3 className="text-lg font-semibold">Documents & Notes</h3>
          <p className="text-sm text-muted-foreground">
            Lưu trữ tài liệu và ghi chú cho dự án
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Thêm Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tiêu đề</Label>
                <Input 
                  placeholder="Tên document"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({...newDoc, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select 
                  value={newDoc.doc_type}
                  onValueChange={(v) => setNewDoc({...newDoc, doc_type: v})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="link">External Link</SelectItem>
                    <SelectItem value="file">File</SelectItem>
                    <SelectItem value="readme">README</SelectItem>
                    <SelectItem value="guide">Guide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>URL (nếu có)</Label>
                <Input 
                  placeholder="https://..."
                  value={newDoc.url}
                  onChange={(e) => setNewDoc({...newDoc, url: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Nội dung</Label>
                <Textarea 
                  placeholder="Nội dung document..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({...newDoc, content: e.target.value})}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Input 
                  placeholder="Mô tả thêm..."
                  value={newDoc.notes}
                  onChange={(e) => setNewDoc({...newDoc, notes: e.target.value})}
                />
              </div>
              <Button onClick={addDocument} className="w-full">
                Thêm Document
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents List */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Chưa có document nào</p>
            <Button className="mt-4" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Document đầu tiên
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      {getDocIcon(doc.doc_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{doc.title}</span>
                        <Badge variant="outline">{doc.doc_type}</Badge>
                      </div>
                      {doc.content && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {doc.content}
                        </p>
                      )}
                      {doc.url && (
                        <a 
                          href={doc.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {doc.url}
                        </a>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(doc.created_at).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
