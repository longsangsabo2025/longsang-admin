/**
 * 🚀 AI Marketing Hub v2 - With AI CMO Masterplan
 * 
 * Two modes:
 * 1. Quick Content - Tạo nhanh vài bài post (như cũ)
 * 2. Full Masterplan - AI CMO phân tích sâu, tạo chiến lược toàn diện
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  Save,
  RefreshCw,
  Settings2,
  ChevronDown,
  Copy,
  Edit3,
  X,
  Rocket,
  Zap,
  Brain,
  FileText,
  Target,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { FaFacebook, FaInstagram, FaTiktok, FaLinkedin, FaTwitter, FaYoutube } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';

import { useAIStrategist } from '@/hooks/useAIStrategist';
import { useAIPlatformWriter } from '@/hooks/useAIPlatformWriter';
import { useAIMasterStrategist } from '@/hooks/useAIMasterStrategist';
import { AIStrategistConfigDialog } from '@/components/project/AIStrategistConfig';
import { AIPlatformWriterConfigDialog } from '@/components/project/AIPlatformWriterConfig';
import { MarketingMasterplanView } from '@/components/project/MarketingMasterplanView';
import {
  PlatformContent,
  PlatformType,
  MarketingMasterplan,
  MasterplanCampaign,
} from '@/types/ai-marketing';

interface AIMarketingHubProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  onCampaignsCreated?: () => void;
}

const PLATFORM_ICONS: Record<PlatformType, React.ComponentType<{ className?: string }>> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  youtube: FaYoutube,
  threads: SiThreads,
  zalo: ({ className }) => <span className={`font-bold text-blue-500 ${className}`}>Z</span>,
};

const PLATFORM_COLORS: Record<PlatformType, string> = {
  facebook: 'text-blue-600 bg-blue-100',
  instagram: 'text-pink-600 bg-pink-100',
  tiktok: 'text-black bg-gray-200',
  linkedin: 'text-blue-700 bg-blue-100',
  twitter: 'text-sky-500 bg-sky-100',
  youtube: 'text-red-600 bg-red-100',
  threads: 'text-gray-900 bg-gray-200',
  zalo: 'text-blue-500 bg-blue-100',
};

type HubMode = 'select' | 'quick' | 'masterplan';
type QuickFlowState = 'idle' | 'generating' | 'done';

export function AIMarketingHub({
  projectId,
  projectName,
  projectSlug,
  onCampaignsCreated,
}: AIMarketingHubProps) {
  // Hooks
  const strategist = useAIStrategist();
  const writer = useAIPlatformWriter();
  const masterStrategist = useAIMasterStrategist();

  // State
  const [mode, setMode] = useState<HubMode>('select');
  const [quickFlowState, setQuickFlowState] = useState<QuickFlowState>('idle');
  const [progress, setProgress] = useState('');
  const [contents, setContents] = useState<PlatformContent[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [showStrategistConfig, setShowStrategistConfig] = useState(false);
  const [showWriterConfig, setShowWriterConfig] = useState(false);
  
  // Edit modal
  const [editingContent, setEditingContent] = useState<PlatformContent | null>(null);
  const [editedText, setEditedText] = useState('');

  // ==================== QUICK MODE HANDLERS ====================
  
  const handleQuickGenerate = async () => {
    setQuickFlowState('generating');
    setProgress('🧠 Đang phân tích tài liệu dự án...');
    setContents([]);

    try {
      const strategy = await strategist.generateStrategy(projectSlug, projectId, projectName);
      
      if (!strategy?.campaigns?.length) {
        throw new Error('Không tạo được chiến lược marketing');
      }

      await strategist.saveStrategy(strategy, projectId);

      const bestCampaign = strategy.campaigns.reduce((best, current) => 
        current.priority === 'high' ? current : best
      , strategy.campaigns[0]);

      setProgress(`✍️ Đang viết content cho ${bestCampaign.platforms.length} platforms...`);

      const results = await writer.generateAllPlatformContent(
        bestCampaign,
        projectSlug,
        projectId
      );

      setContents(results);
      setQuickFlowState('done');
      
      toast.success(`🎉 Xong! ${results.length} bài viết sẵn sàng`);

    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error('Có lỗi xảy ra', { description: err.message });
      setQuickFlowState('idle');
    }
  };

  const handleQuickSaveAll = async () => {
    setProgress('💾 Đang lưu...');
    
    let saved = 0;
    for (const content of contents) {
      try {
        await writer.saveContent(content, projectId);
        saved++;
      } catch (err) {
        console.error('Error saving:', err);
      }
    }
    
    toast.success(`✅ Đã lưu ${saved}/${contents.length} bài vào lịch đăng!`);
    onCampaignsCreated?.();
    handleReset();
  };

  // ==================== MASTERPLAN MODE HANDLERS ====================
  
  const handleGenerateMasterplan = async () => {
    await masterStrategist.generateMasterplan(projectSlug, projectId, projectName);
  };

  const handleSaveMasterplan = async () => {
    if (masterStrategist.masterplan) {
      await masterStrategist.saveMasterplan(masterStrategist.masterplan);
      onCampaignsCreated?.();
    }
  };

  const handleGenerateContentForCampaign = async (campaign: MasterplanCampaign) => {
    toast.info('🚧 Tính năng đang phát triển', {
      description: 'Generate content cho campaign cụ thể sẽ sớm có!',
    });
  };

  // ==================== COMMON HANDLERS ====================

  const handleReset = () => {
    setMode('select');
    setQuickFlowState('idle');
    setProgress('');
    setContents([]);
    strategist.reset();
    writer.reset();
    masterStrategist.reset();
  };

  const handleCopy = (content: PlatformContent) => {
    const text = `${content.content}\n\n${content.hashtags.join(' ')}`;
    navigator.clipboard.writeText(text);
    toast.success('Đã copy!');
  };

  const handleEditSave = () => {
    if (!editingContent) return;
    
    setContents(prev => prev.map(c => 
      c.platform === editingContent.platform && c.campaignId === editingContent.campaignId
        ? { ...c, content: editedText }
        : c
    ));
    setEditingContent(null);
    toast.success('Đã cập nhật!');
  };

  // Progress sync
  useEffect(() => {
    if (strategist.progress) setProgress(strategist.progress);
  }, [strategist.progress]);

  useEffect(() => {
    if (writer.progress) setProgress(writer.progress);
  }, [writer.progress]);

  useEffect(() => {
    if (masterStrategist.progress) setProgress(masterStrategist.progress);
  }, [masterStrategist.progress]);

  // ==================== RENDER ====================

  return (
    <>
      <Card className="overflow-hidden border-purple-500/30 bg-transparent">
        {/* Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Marketing Hub
              {mode !== 'select' && (
                <Badge variant="secondary" className="ml-2">
                  {mode === 'quick' ? 'Quick Mode' : 'Masterplan Mode'}
                </Badge>
              )}
            </CardTitle>
            
            {mode !== 'select' && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" /> Đổi mode
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* MODE SELECTION */}
          {mode === 'select' && (
            <div className="grid md:grid-cols-2 gap-4 py-4">
              {/* Quick Mode Card */}
              <Card 
                className="cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group border-slate-700 bg-slate-800/30"
                onClick={() => setMode('quick')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-full bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                      <Zap className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Quick Content</h3>
                      <p className="text-xs text-slate-400">~30 giây</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    Tạo nhanh 2-3 bài post cho các platforms. Phù hợp khi cần content gấp.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="outline">2-3 posts</Badge>
                    <Badge variant="outline">AI GPT-4</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Masterplan Mode Card */}
              <Card 
                className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all group border-purple-500/30 bg-slate-800/30"
                onClick={() => setMode('masterplan')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-full bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Marketing Masterplan</h3>
                      <p className="text-xs text-slate-400">~2-3 phút</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    AI CMO phân tích sâu tài liệu, xây dựng chiến lược marketing toàn diện với nhiều phases & campaigns.
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Full Strategy
                    </Badge>
                    <Badge variant="outline">Claude 3.5</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* QUICK MODE */}
          {mode === 'quick' && (
            <div className="space-y-4">
              {/* Idle State */}
              {quickFlowState === 'idle' && (
                <div className="text-center py-6">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg"
                    onClick={handleQuickGenerate}
                  >
                    <Zap className="h-5 w-5 mr-2" />
                    Tạo Quick Content
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    AI sẽ phân tích tài liệu → Tạo chiến lược → Viết 2-3 bài post
                  </p>
                </div>
              )}

              {/* Generating State */}
              {quickFlowState === 'generating' && (
                <div className="text-center py-8 space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
                  <p className="font-medium">{progress}</p>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4 mr-1" /> Hủy
                  </Button>
                </div>
              )}

              {/* Done State - Results */}
              {quickFlowState === 'done' && contents.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <span className="font-medium text-green-300">
                        {contents.length} bài viết sẵn sàng
                      </span>
                    </div>
                  </div>

                  <ScrollArea className="h-[350px] pr-4">
                    <div className="grid gap-3">
                      {contents.map((content) => {
                        const Icon = PLATFORM_ICONS[content.platform];
                        return (
                          <Card key={`${content.platform}-${content.campaignId}`}>
                            <div className="flex">
                              <div className={`w-2 ${PLATFORM_COLORS[content.platform].split(' ')[1].replace('100', '500')}`} />
                              <div className="flex-1 p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Icon className={`h-5 w-5 ${PLATFORM_COLORS[content.platform].split(' ')[0]}`} />
                                    <span className="font-medium capitalize">{content.platform}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {content.metadata.wordCount} từ
                                    </Badge>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(content)}>
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                      setEditingContent(content);
                                      setEditedText(content.content);
                                    }}>
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-3">
                                  {content.content}
                                </p>
                                {content.hashtags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {content.hashtags.slice(0, 4).map((tag) => (
                                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReset} className="flex-1">
                      <RefreshCw className="h-4 w-4 mr-2" /> Tạo lại
                    </Button>
                    <Button onClick={handleQuickSaveAll} className="flex-[2] bg-gradient-to-r from-green-600 to-emerald-600">
                      <Save className="h-4 w-4 mr-2" /> Lưu tất cả
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MASTERPLAN MODE */}
          {mode === 'masterplan' && (
            <div className="space-y-4">
              {/* No masterplan yet - Show generate button */}
              {!masterStrategist.masterplan && !masterStrategist.loading && (
                <div className="text-center py-8">
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">AI Chief Marketing Officer</h3>
                    <p className="text-slate-300 max-w-md mx-auto">
                      AI CMO sẽ đọc tất cả tài liệu trong tab Tài liệu và xây dựng 
                      Marketing Masterplan toàn diện với nhiều phases và campaigns.
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 mb-6 text-sm">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" /> Phân tích tài liệu
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Target className="h-3 w-3" /> Brand & Personas
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="h-3 w-3" /> Phases & Campaigns
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="h-3 w-3" /> KPIs & Metrics
                    </Badge>
                  </div>

                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    onClick={handleGenerateMasterplan}
                  >
                    <Rocket className="h-5 w-5 mr-2" />
                    Tạo Marketing Masterplan
                  </Button>
                  
                  <p className="text-xs text-slate-400 mt-4">
                    ⏱️ Mất khoảng 2-3 phút • 🧠 Powered by Claude 3.5 Sonnet
                  </p>
                </div>
              )}

              {/* Loading state */}
              {masterStrategist.loading && (
                <div className="text-center py-12 space-y-4">
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                      <Brain className="h-10 w-10 text-white" />
                    </div>
                    <Loader2 className="h-8 w-8 animate-spin absolute -bottom-1 -right-1 text-purple-400 bg-slate-900 rounded-full p-1" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-white">AI CMO đang làm việc...</p>
                    <p className="text-slate-400 mt-1">{masterStrategist.progress}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleReset}>
                    <X className="h-4 w-4 mr-1" /> Hủy
                  </Button>
                </div>
              )}

              {/* Error state */}
              {masterStrategist.error && !masterStrategist.loading && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-4">
                    <X className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="font-medium text-red-400 mb-2">Có lỗi xảy ra</p>
                  <p className="text-sm text-slate-400 mb-4">{masterStrategist.error}</p>
                  <Button onClick={handleGenerateMasterplan}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Thử lại
                  </Button>
                </div>
              )}

              {/* Masterplan result */}
              {masterStrategist.masterplan && !masterStrategist.loading && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/20">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-purple-400" />
                      <span className="font-medium text-purple-300">
                        Marketing Masterplan đã sẵn sàng!
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <RefreshCw className="h-4 w-4 mr-1" /> Tạo mới
                    </Button>
                  </div>

                  <ScrollArea className="h-[500px]">
                    <MarketingMasterplanView
                      masterplan={masterStrategist.masterplan}
                      onGenerateContent={handleGenerateContentForCampaign}
                      onSave={handleSaveMasterplan}
                    />
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editingContent} onOpenChange={() => setEditingContent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingContent && (
                <>
                  {(() => {
                    const Icon = PLATFORM_ICONS[editingContent.platform];
                    return <Icon className="h-5 w-5" />;
                  })()}
                  <span className="capitalize">Chỉnh sửa {editingContent.platform}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingContent(null)}>Hủy</Button>
            <Button onClick={handleEditSave}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Lưu
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Config Dialogs */}
      <AIStrategistConfigDialog
        open={showStrategistConfig}
        onOpenChange={setShowStrategistConfig}
        projectSlug={projectSlug}
      />
      <AIPlatformWriterConfigDialog
        open={showWriterConfig}
        onOpenChange={setShowWriterConfig}
        projectSlug={projectSlug}
      />
    </>
  );
}

export default AIMarketingHub;
