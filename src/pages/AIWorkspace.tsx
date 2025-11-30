/**
 * AI Workspace Page
 * Main page for AI Workspace with 6 specialized assistants
 * ChatGPT-style interface
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatGPTChat } from '@/components/ai-workspace/ChatGPTChat';
import { ConversationHistory } from '@/components/ai-workspace/ConversationHistory';
import { FileUpload } from '@/components/ai-workspace/FileUpload';
import { DocumentList } from '@/components/ai-workspace/DocumentList';
import { AnalyticsPanel } from '@/components/ai-workspace/AnalyticsPanel';
import { AIWorkspaceCommandPalette } from '@/components/ai-workspace/AIWorkspaceCommandPalette';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createClient } from '@supabase/supabase-js';
import { Conversation } from '@/hooks/useConversations';
import { Button } from '@/components/ui/button';
import { SettingsPanel } from '@/components/ai-workspace/SettingsPanel';
import { KnowledgeManager } from '@/components/ai-workspace/KnowledgeManager';
import { AssistantType } from '@/hooks/useAssistant';
import { PanelLeft, PanelLeftClose, MessageSquare, FileText, Settings, BarChart3, Brain } from 'lucide-react';
import { usePersistedState, useScrollRestore } from '@/hooks/usePersistedState';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export default function AIWorkspace() {
  // Restore scroll position when navigating back
  useScrollRestore('ai-workspace');

  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState<string | undefined>();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Persisted states - will survive navigation
  const [currentAssistant, setCurrentAssistant] = usePersistedState<AssistantType>('ai-workspace-assistant', 'research');
  const [sidebarOpen, setSidebarOpen] = usePersistedState('ai-workspace-sidebar', true);
  const [activeTab, setActiveTab] = usePersistedState('ai-workspace-tab', 'chat');

  // Get default assistant from URL params
  const defaultAssistant = (searchParams.get('assistant') ||
    'research') as AssistantType;

  // Initialize currentAssistant from URL
  useEffect(() => {
    setCurrentAssistant(defaultAssistant);
  }, [defaultAssistant]);

  // Handle conversation select - auto switch assistant type
  const handleConversationSelect = useCallback((conv: Conversation | null) => {
    setSelectedConversation(conv);
    if (conv?.assistant_type) {
      setCurrentAssistant(conv.assistant_type as AssistantType);
      console.log('[AIWorkspace] Switched to assistant:', conv.assistant_type);
    }
  }, []);

  // Handle new conversation created
  const handleConversationCreated = useCallback((conversationId: string) => {
    setRefreshKey(prev => prev + 1);
    console.log('[AIWorkspace] New conversation created:', conversationId);
  }, []);

  // Handle assistant change from chat component
  const handleAssistantChange = useCallback((assistant: AssistantType) => {
    setCurrentAssistant(assistant);
    // Clear selected conversation when changing assistant manually
    setSelectedConversation(null);
  }, []);

  // Get current user - with fallback for single-user app
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        } else {
          // Fallback: Use default user ID for single-user app (no login required)
          setUserId('default-longsang-user');
        }
      } catch (error) {
        // If Supabase auth fails, use default user
        console.warn('[AIWorkspace] Auth error, using default user:', error);
        setUserId('default-longsang-user');
      }
    };
    getCurrentUser();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-4rem)] flex flex-col">
      <div className="shrink-0 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🚀 AI Workspace</h1>
            <p className="text-muted-foreground">
              Văn phòng ảo với 6 trợ lý AI chuyên biệt - Tiết kiệm 83 giờ/tháng
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar - Conversation History */}
        {sidebarOpen && (
          <div className="hidden lg:block w-80 shrink-0">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <ConversationHistory
                  userId={userId}
                  selectedConversationId={selectedConversation?.id}
                  onConversationSelect={handleConversationSelect}
                  refreshTrigger={refreshKey}
                  showAllAssistants={true}
                  className="h-full"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Mobile Sidebar - Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
            <div className="w-80 h-full border-r bg-background">
              <Card className="h-full border-0 rounded-none">
                <CardContent className="p-0 h-full">
                  <div className="p-4 border-b flex items-center justify-between">
                    <h3 className="font-semibold">Lịch sử</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </div>
                  <ConversationHistory
                    userId={userId}
                    selectedConversationId={selectedConversation?.id}
                    onConversationSelect={(conv) => {
                      handleConversationSelect(conv);
                      setSidebarOpen(false);
                    }}
                    refreshTrigger={refreshKey}
                    showAllAssistants={true}
                    className="h-[calc(100%-4rem)]"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Main Content - Tabs */}
        <Card className="flex-1 h-full">
          <CardContent className="p-0 h-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="knowledge" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Knowledge
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="flex-1 m-0 mt-4 overflow-hidden">
                <ChatGPTChat
                  userId={userId}
                  conversationId={selectedConversation?.id}
                  defaultAssistant={currentAssistant}
                  onAssistantChange={handleAssistantChange}
                  onConversationCreated={handleConversationCreated}
                  className="h-full"
                />
              </TabsContent>
              <TabsContent value="knowledge" className="flex-1 m-0 mt-4 p-4 overflow-auto">
                <KnowledgeManager />
              </TabsContent>
              <TabsContent value="documents" className="flex-1 m-0 mt-4 p-4 space-y-4">
                <FileUpload assistantType={currentAssistant} userId={userId} />
                <div className="border-t pt-4">
                  <DocumentList assistantType={currentAssistant} userId={userId} className="h-[400px]" />
                </div>
              </TabsContent>
              <TabsContent value="analytics" className="flex-1 m-0 mt-4 p-4">
                <AnalyticsPanel userId={userId} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Command Palette */}
      <AIWorkspaceCommandPalette />

      {/* Settings Panel */}
      <SettingsPanel open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}