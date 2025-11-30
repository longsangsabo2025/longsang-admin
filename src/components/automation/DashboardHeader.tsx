import { Bot, Settings, BookOpen, BarChart3, Trash2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HelpGuide } from './HelpGuide';
import { AgentGuideModal } from './AgentGuideModal';
import { CreateProjectModal } from './CreateProjectModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

export const DashboardHeader = () => {
  const [showGuide, setShowGuide] = useState(false);
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCleanupAgents = async () => {
    setIsDeleting(true);

    try {
      // Delete all demo agents
      const { error } = await supabase
        .from('ai_agents')
        .delete()
        .or('name.like.%Agent,name.like.Demo%');

      if (error) throw error;

      toast({
        title: '✅ Cleanup Successful',
        description: 'All demo agents have been removed.',
      });

      // Reload page to refresh agent list
      globalThis.location.reload();
    } catch (error: any) {
      toast({
        title: '❌ Cleanup Failed',
        description: error.message || 'Failed to delete agents',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowCleanupDialog(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Personal Automation Hub
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered automation fleet for your business operations
            </p>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowCreateProject(true)}
                  className="gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Project
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Tạo project mới với agents</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuide(true)}
                  className="gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  How to Use
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Hướng dẫn sử dụng agents</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCleanupDialog(true)}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                  Clean Up Agents
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Xóa tất cả demo agents</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/analytics')}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View cost analytics & manage API keys</p>
              </TooltipContent>
            </Tooltip>
            <HelpGuide />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cài đặt hệ thống</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      <AgentGuideModal open={showGuide} onOpenChange={setShowGuide} />

      <CreateProjectModal
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onSuccess={() => {
          toast({
            title: 'Success',
            description: 'Project created! Refreshing...',
          });
          setTimeout(() => globalThis.location.reload(), 1000);
        }}
      />

      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🧹 Clean Up Demo Agents?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all demo agents (names containing "Agent" or "Demo").
              <br />
              <br />
              <strong>Agents created by you will NOT be affected.</strong>
              <br />
              <br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCleanupAgents}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Yes, Delete Demo Agents'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
