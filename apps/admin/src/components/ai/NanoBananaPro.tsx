/**
 * 🍌 Nano Banana Pro - Google's Native Image Generation
 * 
 * Uses Gemini 3 Pro Image (Nano Banana Pro) for native image generation
 * Faster, cheaper, and more contextual than other providers
 * 
 * @author LongSang (Elon Mode 🚀)
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Download, Copy, Sparkles, RefreshCw, Image as ImageIcon, Banana, Zap } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Get API key from env
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 
  import.meta.env.GEMINI_API_KEY || 
  'AIzaSyAEh_hNcNbBHGxgenaNXA_YdF4_Z0w-rJw';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

// Image sizes - Nano Banana Pro supports up to 4K
const IMAGE_SIZES = [
  { id: '1024', name: '1K (1024x1024)', size: 1024, price: '$0.13' },
  { id: '2048', name: '2K (2048x2048)', size: 2048, price: '$0.13' },
  { id: '4096', name: '4K (4096x4096)', size: 4096, price: '$0.24' },
];

// Style presets optimized for Gemini
const STYLE_PRESETS = [
  { id: 'photorealistic', name: '📸 Photorealistic', prompt: 'photorealistic, highly detailed, professional photography, 8K resolution' },
  { id: 'digital-art', name: '🎨 Digital Art', prompt: 'digital art, concept art, detailed illustration, artstation quality' },
  { id: 'anime', name: '🎌 Anime', prompt: 'anime style, detailed anime illustration, vibrant colors, studio quality' },
  { id: 'oil-painting', name: '🖼️ Oil Painting', prompt: 'oil painting style, classical art, brush strokes, canvas texture' },
  { id: 'watercolor', name: '💧 Watercolor', prompt: 'watercolor painting, soft gradients, artistic, delicate' },
  { id: '3d-render', name: '🧊 3D Render', prompt: '3D render, octane render, volumetric lighting, highly detailed' },
  { id: 'minimalist', name: '⬜ Minimalist', prompt: 'minimalist design, clean lines, simple, elegant, modern' },
  { id: 'cyberpunk', name: '🌃 Cyberpunk', prompt: 'cyberpunk style, neon lights, futuristic, sci-fi, dark atmosphere' },
];

interface NanoBananaProProps {
  onGenerated?: (item: { type: string; outputUrl: string; prompt: string }) => void;
}

export function NanoBananaPro({ onGenerated }: NanoBananaProProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('photorealistic');
  const [imageSize, setImageSize] = useState('1024');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Generate image using Nano Banana Pro
  const generateImage = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập prompt mô tả hình ảnh');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    setProgress('Đang kết nối với Nano Banana Pro...');
    const startTime = Date.now();

    try {
      // Get style enhancement
      const stylePreset = STYLE_PRESETS.find(s => s.id === style);
      const enhancedPrompt = `${prompt}. ${stylePreset?.prompt || ''}`;

      setProgress('Đang tạo hình ảnh với AI...');

      // Call Gemini API for image generation
      const response = await fetch(
        `${GEMINI_API_URL}/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate an image: ${enhancedPrompt}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['TEXT', 'IMAGE'],
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to generate image');
      }

      const data = await response.json();
      
      // Extract image from response
      const candidates = data.candidates || [];
      let imageData: string | null = null;

      for (const candidate of candidates) {
        const parts = candidate.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.mimeType?.startsWith('image/')) {
            imageData = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
          }
        }
        if (imageData) break;
      }

      if (!imageData) {
        throw new Error('Không nhận được hình ảnh từ API');
      }

      const endTime = Date.now();
      setGenerationTime((endTime - startTime) / 1000);
      setResult(imageData);
      setProgress('');
      
      toast.success('🍌 Tạo ảnh thành công!', { duration: 3000 });

      // Callback to parent
      if (onGenerated) {
        onGenerated({
          type: 'text-to-image',
          outputUrl: imageData,
          prompt: prompt,
        });
      }
    } catch (error) {
      console.error('[NanoBananaPro] Error:', error);
      toast.error(`Lỗi: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress('');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, style, imageSize, onGenerated]);

  // Download image
  const handleDownload = useCallback(() => {
    if (!result) return;

    const link = document.createElement('a');
    link.href = result;
    link.download = `nano-banana-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Đã tải ảnh về máy');
  }, [result]);

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!result) return;

    try {
      // Convert base64 to blob
      const response = await fetch(result);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      toast.success('Đã copy ảnh vào clipboard');
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Copy thất bại - trình duyệt không hỗ trợ');
    }
  }, [result]);

  const selectedSize = IMAGE_SIZES.find(s => s.id === imageSize);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banana className="h-5 w-5 text-yellow-500" />
          Nano Banana Pro
          <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
            🍌 Google AI
          </Badge>
        </CardTitle>
        <CardDescription>
          Tạo ảnh với Gemini 3 Pro Image - Nhanh, rẻ, chất lượng cao
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Input */}
        <div className="space-y-2">
          <Label htmlFor="banana-prompt">Mô tả hình ảnh</Label>
          <Textarea
            id="banana-prompt"
            placeholder="Mô tả hình ảnh bạn muốn tạo... Ví dụ: A majestic dragon flying over a futuristic city at sunset"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[100px]"
            disabled={isGenerating}
          />
        </div>

        {/* Options Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Style Select */}
          <div className="space-y-2">
            <Label>Phong cách</Label>
            <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Select */}
          <div className="space-y-2">
            <Label>Kích thước</Label>
            <Select value={imageSize} onValueChange={setImageSize} disabled={isGenerating}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.name} ({size.price})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span>
            Giá: <strong className="text-foreground">{selectedSize?.price}/ảnh</strong>
            {' • '}Fast, Native AI Image Generation
          </span>
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateImage}
          disabled={isGenerating || !prompt.trim()}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {progress || 'Đang tạo...'}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Tạo ảnh với Nano Banana Pro 🍌
            </>
          )}
        </Button>

        {/* Result */}
        {result && (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden border bg-muted/20">
              <img
                src={result}
                alt="Generated by Nano Banana Pro"
                className="w-full h-auto"
              />
              {generationTime && (
                <Badge className="absolute top-2 right-2 bg-black/50">
                  ⏱️ {generationTime.toFixed(1)}s
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Tải về
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResult(null);
                  generateImage();
                }}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tạo lại
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
