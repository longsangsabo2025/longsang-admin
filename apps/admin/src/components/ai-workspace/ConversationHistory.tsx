/**
 * ConversationHistory Component
 * Sidebar để hiển thị và quản lý conversation history
 */

import { useEffect, useState } from 'react';
import { useConversations, Conversation } from '@/hooks/useConversations';
import { AssistantType } from '@/hooks/useAssistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { History, Search, Trash2, Edit2, MessageSquare, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Assistant type labels for display
const ASSISTANT_LABELS: Record<string, { label: string; color: string }> = {
  course: { label: '📚 Khóa học', color: 'text-blue-500' },
  financial: { label: '💰 Tài chính', color: 'text-green-500' },
  research: { label: '🔍 Nghiên cứu', color: 'text-purple-500' },
  news: { label: '📰 Tin tức', color: 'text-orange-500' },
  career: { label: '💼 Career', color: 'text-indigo-500' },
  daily: { label: '📅 Planner', color: 'text-pink-500' },
};

interface ConversationHistoryProps {
  assistantType?: AssistantType;
  userId?: string;
  selectedConversationId?: string;
  onConversationSelect: (conversation: Conversation | null) => void;
  className?: string;
  refreshTrigger?: number;
  showAllAssistants?: boolean; // New: show all conversations regardless of assistant type
}

export function ConversationHistory({
  assistantType,
  userId,
  selectedConversationId,
  onConversationSelect,
  className,
  refreshTrigger = 0,
  showAllAssistants = false,
}: ConversationHistoryProps) {
  const {
    conversations,
    isLoading,
    fetchConversations,
    fetchAllConversations,
    deleteConversation,
    renameConversation,
  } = useConversations({ assistantType, userId });
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);
  const [conversationToRename, setConversationToRename] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const { toast } = useToast();

  // Fetch conversations based on mode
  useEffect(() => {
    if (userId) {
      console.log(
        '[ConversationHistory] Fetching conversations, showAll:',
        showAllAssistants,
        'trigger:',
        refreshTrigger
      );
      if (showAllAssistants) {
        fetchAllConversations();
      } else if (assistantType) {
        fetchConversations();
      }
    }
  }, [
    userId,
    assistantType,
    fetchConversations,
    fetchAllConversations,
    refreshTrigger,
    showAllAssistants,
  ]);

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages[0]?.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!conversationToDelete) return;

    const success = await deleteConversation(conversationToDelete);
    if (success) {
      toast({
        title: '✅ Đã xóa',
        description: 'Conversation đã được xóa thành công',
      });
      if (selectedConversationId === conversationToDelete) {
        onConversationSelect(null);
      }
    } else {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể xóa conversation',
        variant: 'destructive',
      });
    }
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleRename = async () => {
    if (!conversationToRename || !newTitle.trim()) return;

    const success = await renameConversation(conversationToRename.id, newTitle.trim());
    if (success) {
      toast({
        title: '✅ Đã đổi tên',
        description: 'Conversation đã được đổi tên thành công',
      });
    } else {
      toast({
        title: '❌ Lỗi',
        description: 'Không thể đổi tên conversation',
        variant: 'destructive',
      });
    }
    setRenameDialogOpen(false);
    setConversationToRename(null);
    setNewTitle('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return 'Hôm nay';
    } else if (days === 1) {
      return 'Hôm qua';
    } else if (days < 7) {
      return `${days} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  const getPreview = (conversation: Conversation) => {
    const firstMessage = conversation.messages[0];
    if (!firstMessage) return 'Không có nội dung';
    return firstMessage.content.substring(0, 60) + (firstMessage.content.length > 60 ? '...' : '');
  };

  return (
    <div className={cn('flex flex-col h-full border-r bg-muted/50', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-3">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Lịch sử</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-4 border-b">
        <Button variant="default" className="w-full" onClick={() => onConversationSelect(null)}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Cuộc trò chuyện mới
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Không tìm thấy conversation' : 'Chưa có conversation nào'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const assistantInfo = ASSISTANT_LABELS[conversation.assistant_type] || {
                label: '🤖 AI',
                color: 'text-gray-500',
              };
              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'group relative p-3 rounded-lg cursor-pointer transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-muted'
                  )}
                  onClick={() => onConversationSelect(conversation)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4
                        className={cn(
                          'font-medium text-sm truncate',
                          isSelected && 'text-primary-foreground'
                        )}
                      >
                        {conversation.title}
                      </h4>
                      <p
                        className={cn(
                          'text-xs mt-1 line-clamp-2',
                          isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                        )}
                      >
                        {getPreview(conversation)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {showAllAssistants && (
                          <span
                            className={cn(
                              'text-xs',
                              isSelected ? 'text-primary-foreground/70' : assistantInfo.color
                            )}
                          >
                            {assistantInfo.label}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-xs',
                            isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'
                          )}
                        >
                          {formatDate(conversation.updated_at || conversation.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6', isSelected && 'hover:bg-primary-foreground/20')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToRename({ id: conversation.id, title: conversation.title });
                        setNewTitle(conversation.title);
                        setRenameDialogOpen(true);
                      }}
                    >
                      <Edit2 className={cn('h-3 w-3', isSelected && 'text-primary-foreground')} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn('h-6 w-6', isSelected && 'hover:bg-primary-foreground/20')}
                      onClick={(e) => {
                        e.stopPropagation();
                        setConversationToDelete(conversation.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className={cn('h-3 w-3', isSelected && 'text-primary-foreground')} />
                    </Button>
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
              Bạn có chắc chắn muốn xóa conversation này? Hành động này không thể hoàn tác.
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

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên conversation</DialogTitle>
            <DialogDescription>Nhập tên mới cho conversation này</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Tên conversation..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRename();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleRename} disabled={!newTitle.trim()}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
