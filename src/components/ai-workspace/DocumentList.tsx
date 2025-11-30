/**
 * DocumentList Component
 * Display list of uploaded documents
 */

import { useEffect } from 'react';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { AssistantType } from '@/hooks/useAssistant';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { File, Trash2, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DocumentListProps {
  assistantType?: AssistantType;
  userId?: string;
  className?: string;
}

export function DocumentList({ assistantType, userId, className }: DocumentListProps) {
  const { documents, isLoading, fetchDocuments, deleteDocument } = useDocumentUpload({
    userId,
    assistantType,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchDocuments();
    }
  }, [userId, assistantType, fetchDocuments]);

  const handleDelete = async () => {
    if (!documentToDelete) return;

    const success = await deleteDocument(documentToDelete);
    if (success) {
      toast({
        title: '✅ Đã xóa',
        description: 'Document đã được xóa thành công',
      });
    } else {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể xóa document',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <File className="h-5 w-5" />
          Documents ({documents.length})
        </h3>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <File className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">Chưa có documents nào</p>
            <p className="text-xs text-muted-foreground mt-1">Upload file để index vào RAG</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {documents.map((doc) => {
              const fileName = doc.metadata?.file_name || doc.source_id;
              const fileSize = doc.metadata?.file_size;
              const chunksCount = doc.metadata?.chunks_count;

              return (
                <div
                  key={doc.id}
                  className="group p-3 rounded-lg border bg-background hover:bg-muted transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <File className="h-4 w-4 text-muted-foreground shrink-0" />
                        <h4 className="font-medium text-sm truncate">{fileName}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {fileSize && <span>{formatFileSize(fileSize)}</span>}
                        {chunksCount && <span>{chunksCount} chunks</span>}
                        <span>{formatDate(doc.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          // Preview document (can be implemented later)
                          toast({
                            title: 'Preview',
                            description: 'Preview feature coming soon',
                          });
                        }}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          setDocumentToDelete(doc.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa document này? Tất cả chunks đã index sẽ bị xóa. Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
