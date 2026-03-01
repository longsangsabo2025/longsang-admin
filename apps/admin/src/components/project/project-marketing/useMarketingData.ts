/**
 * useMarketingData - Custom hook for all marketing data loading and handler logic
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { marketingApi } from '@/lib/marketing-api';
import { toast } from 'sonner';
import type {
  Campaign,
  ScheduledPost,
  MarketingOverview,
  MarketingStats,
  EditingPost,
  NewCampaign,
  NewPackInfo,
} from './types';

export function useMarketingData(projectId: string, projectName: string, projectSlug: string) {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [activeTab, setActiveTab] = useState('campaigns');

  // Quick Post state
  const [quickPostContent, setQuickPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');
  const [posting, setPosting] = useState(false);

  // Marketing Docs state
  const [marketingDocs, setMarketingDocs] = useState<MarketingOverview | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loadingDocContent, setLoadingDocContent] = useState(false);
  const [creatingPack, setCreatingPack] = useState(false);
  const [showCreatePackDialog, setShowCreatePackDialog] = useState(false);
  const [newPackInfo, setNewPackInfo] = useState<NewPackInfo>({
    name: '', category: '', oneLiner: '', targetMarket: 'Vietnam',
  });

  // Create Campaign Dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCampaign, setNewCampaign] = useState<NewCampaign>({
    name: '', type: 'social_media', content: '', platforms: [], scheduled_at: '',
  });

  // Stats
  const [stats, setStats] = useState<MarketingStats>({
    totalCampaigns: 0, activeCampaigns: 0, totalReach: 0, totalEngagement: 0, scheduledPosts: 0,
  });

  // Campaign detail
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCampaignDetail, setShowCampaignDetail] = useState(false);
  const [generatingPosts, setGeneratingPosts] = useState(false);
  const [aiContent, setAiContent] = useState<string>('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // Scheduled post actions
  const [selectedScheduledPost, setSelectedScheduledPost] = useState<ScheduledPost | null>(null);
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [showEditPostDialog, setShowEditPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<EditingPost | null>(null);
  const [savingPost, setSavingPost] = useState(false);

  // ==================== Data Loading ====================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: campaignsData, error: campaignsError } = await supabaseAdmin
        .from('marketing_campaigns').select('*').eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (campaignsError) { console.warn('Marketing campaigns query error:', campaignsError.message); throw new Error(campaignsError.message); }

      if (campaignsData) {
        setCampaigns(campaignsData);
        const active = campaignsData.filter(c => c.status === 'running').length;
        const reach = campaignsData.reduce((sum, c) => sum + (c.metrics?.impressions || 0), 0);
        const engagement = campaignsData.reduce((sum, c) => sum + (c.metrics?.engagement || 0), 0);
        setStats(prev => ({ ...prev, totalCampaigns: campaignsData.length, activeCampaigns: active, totalReach: reach, totalEngagement: engagement }));
      }

      try {
        const postsResult = await supabaseAdmin.from('content_queue').select('*')
          .eq('project_id', projectId).eq('status', 'scheduled')
          .not('scheduled_for', 'is', null).order('scheduled_for', { ascending: true });
        if (postsResult.error) { console.warn('Content queue query error:', postsResult.error.message); }
        else if (postsResult.data) {
          const transformedPosts = postsResult.data.map(item => ({
            id: item.id, content: item.content || item.title,
            platform: item.platform || item.metadata?.platform || 'facebook',
            platforms: item.platform ? [item.platform] : (item.metadata?.platform ? [item.metadata.platform] : ['facebook']),
            scheduled_at: item.scheduled_for, status: item.status,
            campaign_id: item.metadata?.campaign_id, campaign_name: item.metadata?.campaign_name || item.title,
          }));
          setScheduledPosts(transformedPosts);
          setStats(prev => ({ ...prev, scheduledPosts: transformedPosts.length }));
        }
      } catch (postsErr) { console.warn('Content queue query error:', postsErr); }
    } catch {
      console.warn('Using demo data - marketing tables may not be fully configured');
      setCampaigns([
        { id: '1', name: `${projectName} Launch Campaign`, type: 'social_media', status: 'running',
          platforms: ['facebook', 'linkedin', 'instagram'], content: `🚀 Excited to announce ${projectName}! Stay tuned for more updates.`,
          scheduled_at: null, created_at: new Date().toISOString(),
          metrics: { impressions: 12500, clicks: 450, engagement: 890, conversions: 45 } },
        { id: '2', name: 'Weekly Content Series', type: 'social_media', status: 'scheduled',
          platforms: ['facebook', 'twitter'], content: 'Tips & Tricks weekly series for our community.',
          scheduled_at: new Date(Date.now() + 86400000).toISOString(), created_at: new Date().toISOString(),
          metrics: { impressions: 0, clicks: 0, engagement: 0, conversions: 0 } },
      ]);
      setStats({ totalCampaigns: 2, activeCampaigns: 1, totalReach: 12500, totalEngagement: 890, scheduledPosts: 3 });
    } finally { setLoading(false); }
  }, [projectId, projectName]);

  useEffect(() => { loadData(); }, [loadData]);

  // ==================== Marketing Docs ====================

  const loadMarketingDocs = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await fetch(`/api/marketing-docs/${projectSlug}`);
      const data = await response.json();
      setMarketingDocs(data.success ? data : null);
    } catch (error) { console.error('Error loading marketing docs:', error); setMarketingDocs(null); }
    finally { setLoadingDocs(false); }
  }, [projectSlug]);

  const loadDocContent = useCallback(async (docId: string) => {
    setLoadingDocContent(true); setSelectedDoc(docId);
    try {
      const response = await fetch(`/api/marketing-docs/${projectSlug}/documents/${docId}`);
      const data = await response.json();
      if (data.success) setDocContent(data.document.content);
    } catch (error) { console.error('Error loading document:', error); toast.error('Không thể tải tài liệu'); }
    finally { setLoadingDocContent(false); }
  }, [projectSlug]);

  useEffect(() => { if (activeTab === 'docs' && !marketingDocs) loadMarketingDocs(); }, [activeTab, marketingDocs, loadMarketingDocs]);

  const handleCreateMarketingPack = useCallback(async () => {
    setCreatingPack(true);
    try {
      const response = await fetch(`/api/marketing-docs/${projectSlug}/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPackInfo.name || projectName, category: newPackInfo.category, oneLiner: newPackInfo.oneLiner, targetMarket: newPackInfo.targetMarket }),
      });
      const data = await response.json();
      if (data.success) { toast.success('Đã tạo Marketing Pack thành công!'); setShowCreatePackDialog(false); setNewPackInfo({ name: '', category: '', oneLiner: '', targetMarket: 'Vietnam' }); loadMarketingDocs(); }
      else { toast.error(data.error || 'Không thể tạo Marketing Pack'); }
    } catch (error) { console.error('Error creating marketing pack:', error); toast.error('Lỗi khi tạo Marketing Pack'); }
    finally { setCreatingPack(false); }
  }, [projectSlug, projectName, newPackInfo, loadMarketingDocs]);

  // ==================== Handlers ====================

  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => prev.includes(platformId) ? prev.filter(p => p !== platformId) : [...prev, platformId]);
  }, []);

  const handleViewCampaign = useCallback((campaign: Campaign) => { setSelectedCampaign(campaign); setShowCampaignDetail(true); }, []);

  const handleDeleteCampaign = useCallback(async (campaignId: string) => {
    if (!confirm('Bạn có chắc muốn xóa chiến dịch này? Tất cả bài đăng liên quan cũng sẽ bị xóa.')) return;
    try {
      const result = await marketingApi.deleteCampaign(campaignId);
      if (result.success) { toast.success('Đã xóa chiến dịch'); loadData(); }
      else { toast.error(result.error || 'Không thể xóa chiến dịch'); }
    } catch (error) { console.error('Delete campaign error:', error); toast.error('Lỗi khi xóa chiến dịch'); }
  }, [loadData]);

  const handleDuplicateCampaign = useCallback(async (campaignId: string) => {
    try {
      const result = await marketingApi.duplicateCampaign(campaignId);
      if (result.success) { toast.success('Đã nhân bản chiến dịch'); loadData(); }
      else { toast.error(result.error || 'Không thể nhân bản chiến dịch'); }
    } catch (error) { console.error('Duplicate campaign error:', error); toast.error('Lỗi khi nhân bản chiến dịch'); }
  }, [loadData]);

  const handleStatusChange = useCallback(async (campaignId: string, newStatus: 'running' | 'paused' | 'completed') => {
    try {
      const result = await marketingApi.updateCampaignStatus(campaignId, newStatus);
      if (result.success) {
        const labels = { running: 'Đã bắt đầu chạy', paused: 'Đã tạm dừng', completed: 'Đã hoàn thành' };
        toast.success(labels[newStatus]); loadData();
      } else { toast.error(result.error || 'Không thể cập nhật trạng thái'); }
    } catch (error) { console.error('Update status error:', error); toast.error('Lỗi khi cập nhật trạng thái'); }
  }, [loadData]);

  const handleGeneratePosts = useCallback(async (campaign: Campaign) => {
    setGeneratingPosts(true); setAiContent('');
    try {
      const result = await marketingApi.generateAndSaveCampaignPosts(campaign.id, { platforms: campaign.platforms, count: 5, autoSchedule: true });
      if (result.success) {
        if (result.saved) { toast.success(`Đã tạo ${result.posts?.length || 0} bài đăng từ AI`); loadData(); }
        else { setAiContent(result.aiResponse); toast.info('AI đã tạo content, cần xử lý thủ công'); }
      } else { toast.error(result.error || 'Không thể tạo bài đăng'); }
    } catch (error) { console.error('Generate posts error:', error); toast.error('Lỗi khi tạo bài đăng với AI'); }
    finally { setGeneratingPosts(false); }
  }, [loadData]);

  const handleEditScheduledPost = useCallback((post: ScheduledPost) => {
    setEditingPost({ id: post.id, content: post.content, scheduled_at: new Date(post.scheduled_at).toISOString().slice(0, 16), platforms: post.platforms || [post.platform] });
    setShowEditPostDialog(true);
  }, []);

  const handleSaveEditedPost = useCallback(async () => {
    if (!editingPost) return;
    setSavingPost(true);
    try {
      const { error } = await supabaseAdmin.from('content_queue')
        .update({ content: editingPost.content, scheduled_for: new Date(editingPost.scheduled_at).toISOString() })
        .eq('id', editingPost.id);
      if (error) throw error;
      toast.success('Đã cập nhật bài đăng'); setShowEditPostDialog(false); setEditingPost(null); loadData();
    } catch (error) { console.error('Error updating post:', error); toast.error('Không thể cập nhật bài đăng'); }
    finally { setSavingPost(false); }
  }, [editingPost, loadData]);

  const handleCopyPost = useCallback((post: ScheduledPost) => {
    navigator.clipboard.writeText(post.content); toast.success('Đã sao chép nội dung');
  }, []);

  const handlePublishNow = useCallback(async (postId: string) => {
    if (!confirm('Bạn có chắc muốn đăng bài này ngay bây giờ?')) return;
    try {
      const { error } = await supabaseAdmin.from('content_queue')
        .update({ scheduled_for: new Date().toISOString(), status: 'pending' }).eq('id', postId);
      if (error) throw error;
      toast.success('Bài đăng sẽ được xử lý ngay'); loadData();
    } catch (error) { console.error('Error publishing now:', error); toast.error('Không thể đăng bài'); }
  }, [loadData]);

  const handleAIWritePost = useCallback(async () => {
    if (!selectedPlatforms.length) { toast.error('Vui lòng chọn ít nhất 1 platform'); return; }
    setAiGenerating(true);
    try {
      const result = await marketingApi.quickGeneratePost({ platform: selectedPlatforms[0], topic: quickPostContent || `Giới thiệu về ${projectName}`, projectSlug, tone: 'professional' });
      if (result.success) { setQuickPostContent(result.content); toast.success('AI đã viết bài cho bạn!'); }
      else { toast.error(result.error || 'AI không thể viết bài'); }
    } catch (error) { console.error('AI write error:', error); toast.error('Lỗi khi gọi AI'); }
    finally { setAiGenerating(false); }
  }, [selectedPlatforms, quickPostContent, projectName, projectSlug]);

  const handleQuickPost = useCallback(async () => {
    if (!quickPostContent.trim()) { toast.error('Vui lòng nhập nội dung bài đăng'); return; }
    if (selectedPlatforms.length === 0) { toast.error('Vui lòng chọn ít nhất 1 nền tảng'); return; }
    setPosting(true);
    try {
      const campaignData = { name: `Quick Post - ${new Date().toLocaleDateString('vi-VN')}`, type: 'social_media',
        status: isScheduled ? 'scheduled' : 'running', platforms: selectedPlatforms, content: quickPostContent,
        scheduled_at: isScheduled ? scheduledTime : null, metrics: { impressions: 0, clicks: 0, engagement: 0, conversions: 0 } };
      let result = await supabaseAdmin.from('marketing_campaigns').insert({ project_id: projectId, ...campaignData }).select().single();
      if (result.error?.message?.includes('project_id')) {
        console.warn('project_id column not found, inserting without it');
        result = await supabaseAdmin.from('marketing_campaigns').insert(campaignData).select().single();
      }
      if (result.error) throw result.error;
      const campaign = result.data;
      const posts = selectedPlatforms.map(platform => ({ campaign_id: campaign.id, platform, content: quickPostContent, status: isScheduled ? 'pending' : 'posted', scheduled_at: isScheduled ? scheduledTime : null }));
      const postsResult = await supabaseAdmin.from('campaign_posts').insert(posts);
      if (postsResult.error) console.warn('Error creating posts:', postsResult.error);
      toast.success(isScheduled ? `Đã lên lịch đăng lên ${selectedPlatforms.length} nền tảng` : `Đã đăng lên ${selectedPlatforms.length} nền tảng`);
      setQuickPostContent(''); setSelectedPlatforms([]); setIsScheduled(false); setScheduledTime(''); loadData();
    } catch (error) { console.error('Quick post error:', error); toast.error('Không thể đăng bài. Vui lòng thử lại.'); }
    finally { setPosting(false); }
  }, [quickPostContent, selectedPlatforms, isScheduled, scheduledTime, projectId, loadData]);

  const handleCreateCampaign = useCallback(async () => {
    if (!newCampaign.name.trim()) { toast.error('Vui lòng nhập tên chiến dịch'); return; }
    try {
      const campaignData = { ...newCampaign, status: newCampaign.scheduled_at ? 'scheduled' : 'draft', metrics: { impressions: 0, clicks: 0, engagement: 0, conversions: 0 } };
      let result = await supabaseAdmin.from('marketing_campaigns').insert({ project_id: projectId, ...campaignData });
      if (result.error?.message?.includes('project_id')) {
        console.warn('project_id column not found, inserting without it');
        result = await supabaseAdmin.from('marketing_campaigns').insert(campaignData);
      }
      if (result.error) throw result.error;
      toast.success('Đã tạo chiến dịch mới'); setShowCreateDialog(false);
      setNewCampaign({ name: '', type: 'social_media', content: '', platforms: [], scheduled_at: '' }); loadData();
    } catch (error) { console.error('Create campaign error:', error); toast.error('Không thể tạo chiến dịch. Vui lòng kiểm tra database schema.'); }
  }, [newCampaign, projectId, loadData]);

  return {
    // State
    loading, activeTab, setActiveTab, campaigns, scheduledPosts, stats,
    // Quick post
    quickPostContent, setQuickPostContent, selectedPlatforms, isScheduled, setIsScheduled,
    scheduledTime, setScheduledTime, posting, aiGenerating,
    // Docs
    marketingDocs, loadingDocs, selectedDoc, setSelectedDoc, docContent, loadingDocContent,
    creatingPack, showCreatePackDialog, setShowCreatePackDialog, newPackInfo, setNewPackInfo,
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
  };
}
