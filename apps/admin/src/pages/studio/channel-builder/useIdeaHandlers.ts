/**
 * Custom hook for Channel Builder idea management handlers
 */

import { toast } from 'sonner';
import { contentIdeasApi, type ContentIdea as ApiContentIdea } from '@/services/channelBuilderApi';
import { CONTENT_CATEGORIES, type ContentIdea } from './types';

interface UseIdeaHandlersParams {
  ideas: ContentIdea[];
  setIdeas: React.Dispatch<React.SetStateAction<ContentIdea[]>>;
  setIsGeneratingIdeas: (v: boolean) => void;
  setShowConnectDialog: (v: boolean) => void;
  setShowNewIdeaDialog: (v: boolean) => void;
  aiModel: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  newIdeaTitle: string;
  newIdeaDescription: string;
  newIdeaType: 'video' | 'reel' | 'image' | 'story';
  setNewIdeaTitle: (v: string) => void;
  setNewIdeaDescription: (v: string) => void;
  setNewIdeaType: (v: 'video' | 'reel' | 'image' | 'story') => void;
}

export function useIdeaHandlers({
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
}: UseIdeaHandlersParams) {

  const handleGenerateIdeas = async () => {
    setIsGeneratingIdeas(true);
    toast.info('🧠 AI đang phân tích persona và tạo ý tưởng...');

    try {
      const response = await fetch('/api/ai-assistant/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Hãy tạo 3 ý tưởng content mới cho kênh social media về công nghệ và AI.
Tập trung vào các chủ đề: ${CONTENT_CATEGORIES.map(c => c.name).join(', ')}.
Trả về JSON array với format: [{ "title": "...", "description": "...", "platform": ["youtube", "tiktok"], "type": "video|reel|short", "tags": ["tag1", "tag2"] }]`,
          model: aiModel,
          temperature,
          maxTokens,
          systemPrompt,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate ideas');

      const data = await response.json();
      
      let generatedIdeas: ContentIdea[] = [];
      try {
        const content = data.enhancedPrompt || data.content || '';
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          generatedIdeas = parsed.map((idea: { title: string; description: string; platform: string[]; type: string; tags: string[] }) => ({
            id: String(Date.now()) + Math.random().toString(36).substring(7),
            title: idea.title,
            description: idea.description,
            platform: idea.platform || ['youtube'],
            type: idea.type || 'video',
            status: 'idea' as const,
            aiGenerated: true,
            tags: idea.tags || [],
          }));
        }
      } catch {
        console.log('Could not parse AI response as JSON, using fallback');
      }

      if (generatedIdeas.length === 0) {
        generatedIdeas = [{
          id: String(Date.now()),
          title: 'Cách tôi sử dụng AI để tăng năng suất 10x',
          description: 'Chia sẻ workflow cá nhân với các công cụ AI',
          platform: ['youtube', 'tiktok', 'instagram'],
          type: 'video',
          status: 'idea' as const,
          aiGenerated: true,
          tags: ['AI', 'productivity', 'workflow'],
        }];
      }

      try {
        const apiIdeas: Partial<ApiContentIdea>[] = generatedIdeas.map(idea => ({
          title: idea.title,
          description: idea.description,
          platforms: idea.platform,
          content_type: idea.type,
          status: 'idea',
          ai_generated: true,
          ai_model: aiModel,
          generation_prompt: systemPrompt,
          tags: idea.tags,
        }));
        
        const savedIdeas = await contentIdeasApi.bulkCreate(apiIdeas);
        const ideasWithDbIds: ContentIdea[] = savedIdeas.map((saved, idx) => ({
          ...generatedIdeas[idx],
          id: saved.id,
        }));
        
        setIdeas(prev => [...ideasWithDbIds, ...prev]);
        toast.success(`✨ Đã tạo và lưu ${savedIdeas.length} ý tưởng mới từ AI!`);
      } catch (saveError) {
        console.error('Failed to save generated ideas to Supabase:', saveError);
        setIdeas(prev => [...generatedIdeas, ...prev]);
        toast.success(`✨ Đã tạo ${generatedIdeas.length} ý tưởng mới (lưu local)`);
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      const newIdea: ContentIdea = {
        id: String(Date.now()),
        title: 'Cách tôi sử dụng AI để tăng năng suất 10x',
        description: 'Chia sẻ workflow cá nhân với các công cụ AI',
        platform: ['youtube', 'tiktok', 'instagram'],
        type: 'video',
        status: 'idea',
        aiGenerated: true,
        tags: ['AI', 'productivity', 'workflow'],
      };
      setIdeas(prev => [newIdea, ...prev]);
      toast.success('✨ Đã tạo ý tưởng mới!');
    } finally {
      setIsGeneratingIdeas(false);
    }
  };

  const handleConnectPlatform = (_platform: string) => {
    setShowConnectDialog(true);
  };

  const handleDeleteIdea = async (ideaId: string) => {
    try {
      await contentIdeasApi.delete(ideaId);
      setIdeas(prev => prev.filter(i => i.id !== ideaId));
      toast.success('Đã xóa ý tưởng');
    } catch (error) {
      console.error('Failed to delete idea:', error);
      toast.error('Không thể xóa ý tưởng');
    }
  };

  const handleScheduleIdea = async (ideaId: string) => {
    try {
      const scheduledAt = new Date(Date.now() + 86400000);
      await contentIdeasApi.update(ideaId, {
        status: 'scheduled',
        scheduled_at: scheduledAt,
      });
      
      setIdeas(prev => prev.map(i => 
        i.id === ideaId 
          ? { ...i, status: 'scheduled' as const, scheduledAt }
          : i
      ));
      toast.success('📅 Đã lên lịch đăng!');
    } catch (error) {
      console.error('Failed to schedule idea:', error);
      toast.error('Không thể lên lịch');
    }
  };

  const handleCreateNewIdea = async () => {
    if (!newIdeaTitle.trim()) {
      toast.error('Vui lòng nhập tiêu đề ý tưởng');
      return;
    }
    
    try {
      const savedIdea = await contentIdeasApi.create({
        title: newIdeaTitle.trim(),
        description: newIdeaDescription.trim(),
        platforms: ['youtube', 'tiktok'],
        content_type: newIdeaType,
        status: 'idea',
        ai_generated: false,
        tags: [],
      });
      
      const newIdea: ContentIdea = {
        id: savedIdea.id,
        title: savedIdea.title,
        description: savedIdea.description || '',
        platform: savedIdea.platforms || ['youtube', 'tiktok'],
        type: (savedIdea.content_type as ContentIdea['type']) || newIdeaType,
        status: (savedIdea.status || 'idea') as ContentIdea['status'],
        aiGenerated: false,
        tags: savedIdea.tags || [],
      };
      
      setIdeas(prev => [newIdea, ...prev]);
      toast.success('✨ Đã thêm và lưu ý tưởng mới!');
    } catch (error) {
      console.error('Failed to save idea to Supabase:', error);
      toast.error('Không thể lưu ý tưởng');
      return;
    }
    
    setNewIdeaTitle('');
    setNewIdeaDescription('');
    setNewIdeaType('video');
    setShowNewIdeaDialog(false);
  };

  return {
    handleGenerateIdeas,
    handleConnectPlatform,
    handleDeleteIdea,
    handleScheduleIdea,
    handleCreateNewIdea,
  };
}
