/**
 * 📺 SABO AI Channel Builder
 * 
 * Build and manage AI-powered personal channels for AI Avatar
 * - Connect with Avatar Studio (use AI persona)
 * - Content Planning & Calendar
 * - Multi-platform management (YouTube, TikTok, Facebook, Instagram)
 * - Auto-publish scheduling
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAutoSave } from '@/hooks/useAutoSave';
import { contentIdeasApi } from '@/services/channelBuilderApi';
import {
  Loader2,
  Tv,
  Calendar,
  Settings,
  Lightbulb,
  BarChart3,
  Globe,
  Crown,
  Clapperboard,
  Layers,
} from 'lucide-react';

// Sub-components from channel-builder/
import {
  type ContentIdea,
  DEFAULT_AI_SETTINGS,
  loadChannelSettings,
  saveChannelSettingsLocal,
  saveChannelSettingsToSupabase,
  MOCK_CHANNELS,
  MOCK_IDEAS,
  useIdeaHandlers,
  OverviewTab,
  IdeasTab,
  CalendarTab,
  AnalyticsTab,
  SettingsTab,
  NewIdeaDialog,
  ConnectPlatformDialog,
} from './channel-builder';

// Lazy load heavy components
const SeriesPlannerContent = lazy(() => import('./SeriesPlannerContent'));
const SceneProductionContent = lazy(() => import('./SceneProductionContent'));

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ChannelBuilderContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [channels] = useState(MOCK_CHANNELS);
  const [ideas, setIdeas] = useState<ContentIdea[]>(MOCK_IDEAS);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [showNewIdeaDialog, setShowNewIdeaDialog] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  
  // New Idea Form State
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDescription, setNewIdeaDescription] = useState('');
  const [newIdeaType, setNewIdeaType] = useState<'video' | 'reel' | 'image' | 'story'>('video');

  // AI Settings states
  const savedSettings = loadChannelSettings();
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiModel, setAiModel] = useState(savedSettings.aiModel || DEFAULT_AI_SETTINGS.model);
  const [temperature, setTemperature] = useState(savedSettings.temperature ?? DEFAULT_AI_SETTINGS.temperature);
  const [maxTokens, setMaxTokens] = useState(savedSettings.maxTokens || DEFAULT_AI_SETTINGS.maxTokens);
  const [systemPrompt, setSystemPrompt] = useState(savedSettings.systemPrompt || DEFAULT_AI_SETTINGS.systemPrompt);

  // Load content ideas from Supabase on mount
  useEffect(() => {
    const loadIdeas = async () => {
      try {
        setIsLoadingIdeas(true);
        const data = await contentIdeasApi.list({ limit: 100 });
        
        const converted: ContentIdea[] = data.map(idea => ({
          id: idea.id,
          title: idea.title,
          description: idea.description || '',
          platform: idea.platforms || [],
          type: (idea.content_type as ContentIdea['type']) || 'video',
          status: idea.status || 'idea',
          scheduledAt: idea.scheduled_at ? new Date(idea.scheduled_at) : undefined,
          aiGenerated: idea.ai_generated || false,
          tags: idea.tags || [],
        }));
        
        setIdeas(converted);
      } catch (error) {
        console.error('Failed to load content ideas:', error);
        toast.error('Không thể tải ý tưởng nội dung');
      } finally {
        setIsLoadingIdeas(false);
      }
    };
    
    loadIdeas();
  }, []);

  // Auto-save content ideas to Supabase
  const { isSaving: isSavingIdeas, lastSaved: ideasLastSaved } = useAutoSave({
    data: ideas,
    saveFunction: async (ideasToSave) => {
      console.log('[Auto-Save] Saving content ideas to Supabase...', ideasToSave.length);
    },
    interval: 10000,
    enabled: !isLoadingIdeas && ideas.length > 0,
    showToast: false,
  });

  // Auto-save AI settings (localStorage immediate, Supabase debounced)
  useEffect(() => {
    saveChannelSettingsLocal({ aiModel, temperature, maxTokens, systemPrompt });
    
    const timeoutId = setTimeout(() => {
      saveChannelSettingsToSupabase({ model: aiModel, temperature, maxTokens, systemPrompt });
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [aiModel, temperature, maxTokens, systemPrompt]);

  // Listen for tab switch events from child components
  useEffect(() => {
    const handleTabSwitch = (event: CustomEvent<string>) => {
      setActiveTab(event.detail);
    };
    
    globalThis.addEventListener('switch-channel-tab', handleTabSwitch as EventListener);
    return () => {
      globalThis.removeEventListener('switch-channel-tab', handleTabSwitch as EventListener);
    };
  }, []);

  // Derived stats
  const totalFollowers = channels.reduce((sum, c) => sum + c.followers, 0);
  const connectedChannels = channels.filter(c => c.isConnected).length;

  // Handlers from custom hook
  const {
    handleGenerateIdeas,
    handleConnectPlatform,
    handleDeleteIdea,
    handleScheduleIdea,
    handleCreateNewIdea,
  } = useIdeaHandlers({
    ideas,
    setIdeas,
    setIsGeneratingIdeas,
    setShowConnectDialog,
    setShowNewIdeaDialog,
    aiModel,
    temperature,
    maxTokens,
    systemPrompt,
    newIdeaTitle,
    newIdeaDescription,
    newIdeaType,
    setNewIdeaTitle,
    setNewIdeaDescription,
    setNewIdeaType,
  });

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tv className="h-7 w-7 text-primary" />
            Channel Builder
          </h1>
          <p className="text-muted-foreground">
            Xây dựng và quản lý kênh cá nhân cho AI Avatar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Crown className="h-3 w-3 mr-1" />
            Pro
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Globe className="h-4 w-4 mr-2" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="ideas">
            <Lightbulb className="h-4 w-4 mr-2" />
            Ý tưởng
          </TabsTrigger>
          <TabsTrigger value="series">
            <Clapperboard className="h-4 w-4 mr-2" />
            Series
          </TabsTrigger>
          <TabsTrigger value="production">
            <Layers className="h-4 w-4 mr-2" />
            Production
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <Calendar className="h-4 w-4 mr-2" />
            Lịch đăng
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab
            channels={channels}
            ideas={ideas}
            totalFollowers={totalFollowers}
            connectedChannels={connectedChannels}
            onGenerateIdeas={handleGenerateIdeas}
            onShowNewIdeaDialog={() => setShowNewIdeaDialog(true)}
            onShowConnectDialog={() => setShowConnectDialog(true)}
            onSetActiveTab={setActiveTab}
          />
        </TabsContent>
        <TabsContent value="ideas" className="mt-6">
          <IdeasTab
            ideas={ideas}
            isLoadingIdeas={isLoadingIdeas}
            isSavingIdeas={isSavingIdeas}
            ideasLastSaved={ideasLastSaved}
            isGeneratingIdeas={isGeneratingIdeas}
            showAISettings={showAISettings}
            aiModel={aiModel}
            temperature={temperature}
            maxTokens={maxTokens}
            systemPrompt={systemPrompt}
            onSetShowAISettings={setShowAISettings}
            onSetAiModel={setAiModel}
            onSetTemperature={setTemperature}
            onSetMaxTokens={setMaxTokens}
            onSetSystemPrompt={setSystemPrompt}
            onShowNewIdeaDialog={() => setShowNewIdeaDialog(true)}
            onGenerateIdeas={handleGenerateIdeas}
            onScheduleIdea={handleScheduleIdea}
            onDeleteIdea={handleDeleteIdea}
          />
        </TabsContent>
        <TabsContent value="series" className="mt-0 -mx-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <SeriesPlannerContent />
          </Suspense>
        </TabsContent>
        <TabsContent value="production" className="mt-0 -mx-6">
          <Suspense fallback={
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          }>
            <SceneProductionContent />
          </Suspense>
        </TabsContent>
        <TabsContent value="calendar" className="mt-6">
          <CalendarTab ideas={ideas} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab channels={channels} />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsTab channels={channels} onConnectPlatform={handleConnectPlatform} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <NewIdeaDialog
        open={showNewIdeaDialog}
        onOpenChange={setShowNewIdeaDialog}
        title={newIdeaTitle}
        description={newIdeaDescription}
        ideaType={newIdeaType}
        onTitleChange={setNewIdeaTitle}
        onDescriptionChange={setNewIdeaDescription}
        onIdeaTypeChange={setNewIdeaType}
        onSubmit={handleCreateNewIdea}
      />

      <ConnectPlatformDialog
        open={showConnectDialog}
        onOpenChange={setShowConnectDialog}
      />
    </div>
  );
}

export default ChannelBuilderContent;
