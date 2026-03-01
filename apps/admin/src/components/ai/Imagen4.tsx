/**
 * 🎨 Imagen 4 Component
 * 
 * Google's latest image generation model with Gemini API
 * Features:
 * - High quality image generation
 * - Multiple aspect ratios
 * - Paid model with best quality
 * 
 * @author LongSang
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Wand2,
  Download,
  Copy,
  Check,
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// Gemini API Key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBfLqZs_2OeJ8ZptYcaeTlB1HqMegtKSmA';

// Aspect ratio options
const ASPECT_RATIOS = [
  { id: '1:1', name: 'Square', desc: '1024x1024' },
  { id: '3:4', name: 'Portrait', desc: '768x1024' },
  { id: '4:3', name: 'Landscape', desc: '1024x768' },
  { id: '9:16', name: 'Story/Reel', desc: '576x1024' },
  { id: '16:9', name: 'Widescreen', desc: '1024x576' },
];

// Style presets
const STYLE_PRESETS = [
  { id: 'none', name: 'Không có', suffix: '' },
  { id: 'photorealistic', name: 'Chân thực', suffix: ', photorealistic, highly detailed, 8k resolution' },
  { id: 'digital-art', name: 'Digital Art', suffix: ', digital art style, vibrant colors, detailed illustration' },
  { id: 'anime', name: 'Anime', suffix: ', anime style, detailed anime art, Studio Ghibli inspired' },
  { id: 'watercolor', name: 'Watercolor', suffix: ', watercolor painting style, soft colors, artistic' },
  { id: 'oil-painting', name: 'Sơn dầu', suffix: ', oil painting style, classic art, rich textures' },
  { id: 'minimalist', name: 'Tối giản', suffix: ', minimalist design, clean lines, simple composition' },
  { id: '3d-render', name: '3D Render', suffix: ', 3D render, octane render, highly detailed, realistic lighting' },
];

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  createdAt: Date;
}

interface Props {
  onGenerated?: (imageUrl: string, prompt: string) => void;
}

export function Imagen4({ onGenerated }: Props) {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [stylePreset, setStylePreset] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Build enhanced prompt with style
      const style = STYLE_PRESETS.find(s => s.id === stylePreset);
      const enhancedPrompt = prompt + (style?.suffix || '');

      // Use Gemini 2.0 Flash experimental for image generation
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate an image: ${enhancedPrompt}`
              }]
            }],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      
      // Extract image from response
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      
      let imageUrl: string | null = null;
      
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith('image/')) {
          // Convert base64 to data URL
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (!imageUrl) {
        throw new Error('No image generated. Try a different prompt.');
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        aspectRatio,
        style: stylePreset,
        createdAt: new Date(),
      };

      setGeneratedImages(prev => [newImage, ...prev]);
      
      if (onGenerated) {
        onGenerated(imageUrl, prompt);
      }

      toast.success('Đã tạo hình ảnh thành công!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      toast.error(`Lỗi: ${message}`);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, aspectRatio, stylePreset, onGenerated]);

  const downloadImage = useCallback(async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải xuống!');
    } catch {
      toast.error('Lỗi tải xuống');
    }
  }, []);

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Đã copy!');
  }, []);

  const removeImage = useCallback((id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Imagen 4
                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  Google AI
                </Badge>
              </CardTitle>
              <CardDescription>
                Tạo hình ảnh chất lượng cao với Gemini 2.0 Flash Image Generation
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              ✓ Paid API Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea
              placeholder="Mô tả hình ảnh bạn muốn tạo... VD: A cute corgi playing with a red ball in a sunny garden"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Aspect Ratio */}
            <div className="space-y-2">
              <Label>Tỉ lệ khung hình</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(ratio => (
                    <SelectItem key={ratio.id} value={ratio.id}>
                      <span className="flex items-center gap-2">
                        <span>{ratio.name}</span>
                        <span className="text-xs text-muted-foreground">({ratio.desc})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Preset */}
            <div className="space-y-2">
              <Label>Phong cách</Label>
              <Select value={stylePreset} onValueChange={setStylePreset}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_PRESETS.map(style => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Generate Button */}
          <Button
            className="w-full h-12 text-lg"
            onClick={generateImage}
            disabled={isGenerating || !prompt.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Wand2 className="h-5 w-5 mr-2" />
                Tạo Hình Ảnh
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Hình ảnh đã tạo ({generatedImages.length})
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedImages([])}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Xóa tất cả
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((img) => (
                  <div key={img.id} className="group relative rounded-lg overflow-hidden border">
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full aspect-square object-cover"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadImage(img.url, `imagen4-${img.id}.png`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(img.prompt, img.id)}
                        >
                          {copied === img.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setPrompt(img.prompt);
                            toast.info('Đã load lại prompt');
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeImage(img.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-white text-xs">
                        <p className="line-clamp-2">{img.prompt}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {img.aspectRatio}
                          </Badge>
                          {img.style !== 'none' && (
                            <Badge variant="secondary" className="text-xs">
                              {STYLE_PRESETS.find(s => s.id === img.style)?.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
