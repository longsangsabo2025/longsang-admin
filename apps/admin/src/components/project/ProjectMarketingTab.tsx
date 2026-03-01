/**
 * ProjectMarketingTab - Marketing Hub for each project
 * Features: Campaigns, Quick Post, Scheduled Posts, Performance Analytics
 *
 * Thin orchestrator — all state & logic in useMarketingData hook,
 * all UI delegated to sub-components in ./project-marketing/
 */

import { ScheduledPostsManager } from '@/components/project/ScheduledPostsManager';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Loader2,
  Megaphone,
  Zap,
  Calendar,
  BarChart3,
  Book,
} from 'lucide-react';

import {
  MarketingStatsHeader,
  CampaignsTab,
  QuickPostTab,
  AnalyticsTab,
  DocsTab,
  CreatePackDialog,
  CreateCampaignDialog,
  CampaignDetailDialog,
  ViewPostDialog,
  EditPostDialog,
  useMarketingData,
} from './project-marketing';

import type { ProjectMarketingTabProps } from './project-marketing';

export function ProjectMarketingTab({ projectId, projectName, projectSlug }: ProjectMarketingTabProps) {
  const {
    // State
    loading, activeTab, setActiveTab, campaigns, stats,
    // Quick post
    quickPostContent, setQuickPostContent, selectedPlatforms,
    isScheduled, setIsScheduled, scheduledTime, setScheduledTime,
    posting, aiGenerating,
    // Docs
    marketingDocs, loadingDocs, selectedDoc, setSelectedDoc,
    docContent, loadingDocContent,
    creatingPack, showCreatePackDialog, setShowCreatePackDialog,
    newPackInfo, setNewPackInfo,
    // Campaign dialog
    showCreateDialog, setShowCreateDialog, newCampaign, setNewCampaign,
    selectedCampaign, showCampaignDetail, setShowCampaignDetail,
    generatingPosts, aiContent,
    // Post dialogs
    selectedScheduledPost, showPostDetail, setShowPostDetail,
    showEditPostDialog, setShowEditPostDialog, editingPost, setEditingPost, savingPost,
    // Actions
    loadData, loadMarketingDocs, loadDocContent, handleCreateMarketingPack,
    togglePlatform, handleViewCampaign, handleDeleteCampaign, handleDuplicateCampaign,
    handleStatusChange, handleGeneratePosts, handleEditScheduledPost, handleSaveEditedPost,
    handleCopyPost, handlePublishNow, handleAIWritePost, handleQuickPost, handleCreateCampaign,
  } = useMarketingData(projectId, projectName, projectSlug);

  // ==================== Render ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MarketingStatsHeader stats={stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="campaigns" className="gap-2">
              <Megaphone className="h-4 w-4" /> Chiến dịch
            </TabsTrigger>
            <TabsTrigger value="quickpost" className="gap-2">
              <Zap className="h-4 w-4" /> Đăng nhanh
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Calendar className="h-4 w-4" /> Lịch đăng
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Thống kê
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <Book className="h-4 w-4" /> Tài liệu
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Tạo chiến dịch
          </Button>
        </div>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsTab
            campaigns={campaigns}
            generatingPosts={generatingPosts}
            onCreateCampaign={() => setShowCreateDialog(true)}
            onViewCampaign={handleViewCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onDuplicateCampaign={handleDuplicateCampaign}
            onStatusChange={handleStatusChange}
            onGeneratePosts={handleGeneratePosts}
          />
        </TabsContent>

        <TabsContent value="quickpost">
          <QuickPostTab
            projectName={projectName}
            quickPostContent={quickPostContent}
            selectedPlatforms={selectedPlatforms}
            isScheduled={isScheduled}
            scheduledTime={scheduledTime}
            posting={posting}
            aiGenerating={aiGenerating}
            onContentChange={setQuickPostContent}
            onTogglePlatform={togglePlatform}
            onScheduledChange={setIsScheduled}
            onScheduledTimeChange={setScheduledTime}
            onAIWritePost={handleAIWritePost}
            onQuickPost={handleQuickPost}
          />
        </TabsContent>

        <TabsContent value="scheduled">
          <ScheduledPostsManager projectId={projectId} projectSlug={projectSlug} />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab stats={stats} campaigns={campaigns} />
        </TabsContent>

        <TabsContent value="docs" className="space-y-4">
          <DocsTab
            projectId={projectId}
            projectName={projectName}
            projectSlug={projectSlug}
            loadingDocs={loadingDocs}
            marketingDocs={marketingDocs}
            selectedDoc={selectedDoc}
            docContent={docContent}
            loadingDocContent={loadingDocContent}
            onLoadMarketingDocs={loadMarketingDocs}
            onLoadDocContent={loadDocContent}
            onClearSelectedDoc={() => setSelectedDoc(null)}
            onShowCreatePackDialog={() => {
              setNewPackInfo(prev => ({ ...prev, name: projectName }));
              setShowCreatePackDialog(true);
            }}
            onDataReload={loadData}
          />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreatePackDialog
        open={showCreatePackDialog}
        onOpenChange={setShowCreatePackDialog}
        newPackInfo={newPackInfo}
        onPackInfoChange={setNewPackInfo}
        creatingPack={creatingPack}
        onCreatePack={handleCreateMarketingPack}
      />

      <CreateCampaignDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        newCampaign={newCampaign}
        onCampaignChange={setNewCampaign}
        onCreateCampaign={handleCreateCampaign}
      />

      <CampaignDetailDialog
        open={showCampaignDetail}
        onOpenChange={setShowCampaignDetail}
        campaign={selectedCampaign}
        aiContent={aiContent}
        generatingPosts={generatingPosts}
        onGeneratePosts={handleGeneratePosts}
        onStatusChange={handleStatusChange}
      />

      <ViewPostDialog
        open={showPostDetail}
        onOpenChange={setShowPostDetail}
        post={selectedScheduledPost}
        onCopyPost={handleCopyPost}
        onEditPost={handleEditScheduledPost}
        onPublishNow={handlePublishNow}
      />

      <EditPostDialog
        open={showEditPostDialog}
        onOpenChange={setShowEditPostDialog}
        editingPost={editingPost}
        onEditingPostChange={setEditingPost}
        savingPost={savingPost}
        onSavePost={handleSaveEditedPost}
      />
    </div>
  );
}

export default ProjectMarketingTab;
