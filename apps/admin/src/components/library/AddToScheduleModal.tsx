/**
 * Add to Schedule Modal with AI Caption
 * 
 * Tính năng:
 * - Thêm ảnh vào lịch đăng bài
 * - AI tự động viết caption dựa trên mô tả ảnh
 * - Phân tích ảnh với Gemini Vision
 * - Tích hợp Brain Library để lấy context tốt hơn
 * - Chọn platforms và thời gian đăng
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Loader2,
  Wand2,
  Send,
  Copy,
  Check,
  ImageIcon,
  Hash,
  Brain
} from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { toast } from 'sonner';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { imageMemoryApi } from '@/brain/lib/services/image-memory-api';

// Gemini API for caption generation
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Platform options
const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', icon: FaFacebook, color: '#1877F2' },
  { id: 'instagram', name: 'Instagram', icon: FaInstagram, color: '#E4405F' },
  { id: 'tiktok', name: 'TikTok', icon: null, color: '#000000', emoji: '🎵' },
  { id: 'zalo', name: 'Zalo OA', icon: null, color: '#0068FF', emoji: '💬' },
];

// Caption styles
const CAPTION_STYLES = [
  { id: 'engaging', name: 'Thu hút', desc: 'Hook mạnh, CTA rõ ràng', emoji: '🔥' },
  { id: 'storytelling', name: 'Kể chuyện', desc: 'Narrative, emotional', emoji: '📖' },
  { id: 'professional', name: 'Chuyên nghiệp', desc: 'Formal, business', emoji: '💼' },
  { id: 'casual', name: 'Thân thiện', desc: 'Casual, friendly', emoji: '😊' },
  { id: 'viral', name: 'Viral', desc: 'Trending, catchy', emoji: '🚀' },
];

interface ImageInfo {
  url: string;
  name?: string;
  description?: string;
  tags?: string[];
  projectSlug?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ImageInfo;
  onScheduled?: (post: ScheduledPost) => void;
}

interface ScheduledPost {
  id: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
  scheduledAt: Date;
  status: 'scheduled' | 'draft';
}

export function AddToScheduleModal({ open, onOpenChange, image, onScheduled }: Props) {
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [captionStyle, setCaptionStyle] = useState('engaging');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<string | null>(null);
  const [brainContext, setBrainContext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Set default date to tomorrow
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
  }, [open]);

  // Load Brain Library context when modal opens
  useEffect(() => {
    if (open && image.url) {
      loadBrainContext();
    }
  }, [open, image.url]);

  // Load context from Brain Library (image-memory)
  const loadBrainContext = useCallback(async () => {
    try {
      // Search for similar images or get context based on image name/description
      const searchQuery = image.name || image.description || 'product image';
      const result = await imageMemoryApi.buildGenerationContext({
        prompt: `Tạo caption cho ảnh: ${searchQuery}`,
        maxReferences: 3,
      });

      if (result.success && result.context) {
        const contextParts: string[] = [];
        
        if (result.context.enhancedPrompt) {
          contextParts.push(`📝 Enhanced: ${result.context.enhancedPrompt}`);
        }
        if (result.context.characterProfiles?.length) {
          const names = result.context.characterProfiles.map(c => c.name).join(', ');
          contextParts.push(`👤 Characters: ${names}`);
        }
        if (result.context.locationProfiles?.length) {
          const names = result.context.locationProfiles.map(l => l.name).join(', ');
          contextParts.push(`📍 Locations: ${names}`);
        }
        if (result.context.intent) {
          if (result.context.intent.style) {
            contextParts.push(`🎨 Style: ${result.context.intent.style}`);
          }
          if (result.context.intent.mood) {
            contextParts.push(`✨ Mood: ${result.context.intent.mood}`);
          }
        }

        if (contextParts.length > 0) {
          setBrainContext(contextParts.join('\n'));
        }
      }
    } catch (error) {
      console.log('Brain context not available:', error);
      // Silently fail - Brain context is optional enhancement
    }
  }, [image.name, image.description]);

  // Analyze image with Gemini Vision
  const analyzeImage = useCallback(async () => {
    if (!image.url) return;
    
    setIsAnalyzing(true);
    try {
      // Fetch image and convert to base64
      const response = await fetch(image.url);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      // Call Gemini Vision API
      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64.split(',')[1],
                  }
                },
                {
                  text: `Phân tích hình ảnh này và mô tả chi tiết:
1. Chủ đề chính của hình ảnh
2. Các yếu tố nổi bật (màu sắc, bố cục, đối tượng)
3. Cảm xúc/mood của hình ảnh
4. Đề xuất 5-10 hashtags phù hợp (tiếng Việt và tiếng Anh)

Trả lời ngắn gọn, súc tích bằng tiếng Việt.`
                }
              ]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1024,
            },
          }),
        }
      );

      if (geminiResponse.ok) {
        const data = await geminiResponse.json();
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setImageAnalysis(analysis);
        
        // Extract hashtags from analysis
        const hashtagMatches = analysis.match(/#\w+/g) || [];
        if (hashtagMatches.length > 0) {
          setHashtags(prev => [...new Set([...prev, ...hashtagMatches.map((h: string) => h.replace('#', ''))])]);
        }
        
        toast.success('Đã phân tích hình ảnh!');
      }
    } catch (error) {
      console.error('Image analysis error:', error);
      toast.error('Lỗi phân tích hình ảnh');
    } finally {
      setIsAnalyzing(false);
    }
  }, [image.url]);

  // Generate AI caption with Brain Library context
  const generateCaption = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const styleConfig = CAPTION_STYLES.find(s => s.id === captionStyle);
      const platformNames = selectedPlatforms.map(p => 
        PLATFORMS.find(pl => pl.id === p)?.name
      ).join(', ');

      // Build Brain Library context info
      const brainInfo = brainContext 
        ? `\n🧠 BRAIN LIBRARY CONTEXT:\n${brainContext}`
        : '';

      const prompt = `Viết caption cho bài đăng mạng xã hội về hình ảnh này.

THÔNG TIN HÌNH ẢNH:
${imageAnalysis || image.description || 'Hình ảnh sản phẩm/nội dung marketing'}
${image.name ? `Tên file: ${image.name}` : ''}
${image.tags?.length ? `Tags: ${image.tags.join(', ')}` : ''}
${brainInfo}

YÊU CẦU:
- Phong cách: ${styleConfig?.name} (${styleConfig?.desc})
- Nền tảng: ${platformNames}
- Viết bằng tiếng Việt
- Có hook mở đầu hấp dẫn
- Có CTA (call-to-action) cuối bài
- Độ dài: 150-300 ký tự
- KHÔNG bao gồm hashtags (sẽ thêm riêng)
- Nếu có Brain Library context, hãy tận dụng thông tin đó để viết caption chính xác và phù hợp hơn

Chỉ trả về caption, không giải thích.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 512,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const generatedCaption = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        setCaption(generatedCaption.trim());
        toast.success('Đã tạo caption!');
      } else {
        throw new Error('API Error');
      }
    } catch (error) {
      console.error('Caption generation error:', error);
      toast.error('Lỗi tạo caption');
    } finally {
      setIsGenerating(false);
    }
  }, [captionStyle, selectedPlatforms, imageAnalysis, image, brainContext]);

  // Toggle platform
  const togglePlatform = useCallback((platformId: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  }, []);

  // Add hashtag
  const addHashtag = useCallback(() => {
    if (hashtagInput.trim()) {
      const tag = hashtagInput.trim().replace('#', '');
      if (!hashtags.includes(tag)) {
        setHashtags(prev => [...prev, tag]);
      }
      setHashtagInput('');
    }
  }, [hashtagInput, hashtags]);

  // Remove hashtag
  const removeHashtag = useCallback((tag: string) => {
    setHashtags(prev => prev.filter(h => h !== tag));
  }, []);

  // Copy caption
  const copyCaption = useCallback(() => {
    const fullCaption = `${caption}\n\n${hashtags.map(h => `#${h}`).join(' ')}`;
    navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Đã copy caption!');
  }, [caption, hashtags]);

  // Save to schedule
  const saveToSchedule = useCallback(async () => {
    if (!caption.trim()) {
      toast.error('Vui lòng nhập caption');
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error('Vui lòng chọn ít nhất 1 platform');
      return;
    }

    setIsSaving(true);
    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`);
      
      // Save to Supabase scheduled_posts table
      const { data, error } = await supabaseAdmin
        .from('scheduled_posts')
        .insert({
          image_url: image.url,
          caption: caption,
          hashtags: hashtags,
          platforms: selectedPlatforms,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
          project_slug: image.projectSlug || 'default',
          metadata: {
            captionStyle,
            imageAnalysis,
            imageName: image.name,
          }
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Đã thêm vào lịch đăng bài!');
      
      if (onScheduled && data) {
        onScheduled({
          id: data.id,
          imageUrl: image.url,
          caption,
          hashtags,
          platforms: selectedPlatforms,
          scheduledAt,
          status: 'scheduled',
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Lỗi lưu bài đăng. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  }, [caption, hashtags, selectedPlatforms, scheduledDate, scheduledTime, image, captionStyle, imageAnalysis, onScheduled, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-500" />
            Thêm vào Lịch Đăng Bài
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Caption
            </Badge>
          </DialogTitle>
          <DialogDescription>
            AI sẽ phân tích hình ảnh và tạo caption phù hợp
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {/* Image Preview */}
            <div className="flex gap-4">
              <div className="shrink-0">
                <img 
                  src={image.url} 
                  alt={image.name || 'Preview'} 
                  className="h-32 w-32 object-cover rounded-lg border"
                />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium">{image.name || 'Untitled Image'}</p>
                {image.description && (
                  <p className="text-xs text-muted-foreground">{image.description}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <ImageIcon className="h-4 w-4 mr-1" />
                  )}
                  Phân tích hình ảnh
                </Button>
              </div>
            </div>

            {/* Image Analysis */}
            {imageAnalysis && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <p className="font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Phân tích AI:
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">{imageAnalysis}</p>
              </div>
            )}

            {/* Brain Library Context */}
            {brainContext && (
              <div className="p-3 rounded-lg bg-purple-500/10 text-sm border border-purple-500/20">
                <p className="font-medium mb-1 flex items-center gap-1 text-purple-400">
                  <Brain className="h-4 w-4" />
                  Brain Library Context:
                </p>
                <p className="text-muted-foreground whitespace-pre-wrap">{brainContext}</p>
              </div>
            )}

            {/* Caption Style */}
            <div className="space-y-2">
              <Label>Phong cách Caption</Label>
              <div className="flex flex-wrap gap-2">
                {CAPTION_STYLES.map(style => (
                  <Button
                    key={style.id}
                    variant={captionStyle === style.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCaptionStyle(style.id)}
                  >
                    <span className="mr-1">{style.emoji}</span>
                    {style.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Caption</Label>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={generateCaption}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-1" />
                    )}
                    Tạo AI Caption
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCaption}
                    disabled={!caption}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Nhập caption hoặc click 'Tạo AI Caption'..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {caption.length} ký tự
              </p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Hashtags
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Thêm hashtag..."
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button variant="outline" onClick={addHashtag}>
                  Thêm
                </Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {hashtags.map(tag => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => removeHashtag(tag)}
                    >
                      #{tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Platforms */}
            <div className="space-y-2">
              <Label>Nền tảng đăng bài</Label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(platform => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  return (
                    <Button
                      key={platform.id}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePlatform(platform.id)}
                      style={isSelected ? { backgroundColor: platform.color } : {}}
                    >
                      {Icon ? (
                        <Icon className="h-4 w-4 mr-1" />
                      ) : (
                        <span className="mr-1">{platform.emoji}</span>
                      )}
                      {platform.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Ngày đăng
                </Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Giờ đăng
                </Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={saveToSchedule} disabled={isSaving || !caption.trim()}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Thêm vào lịch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddToScheduleModal;
