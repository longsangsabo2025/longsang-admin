/**
 * Text to Image Generator Component
 * Generate images from text prompts using AI
 */

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Wand2, Loader2, Download, Copy, Sparkles, RefreshCw, Image as ImageIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createJob, updateJob, estimateCost } from '@/services/ai-jobs';

const KIE_API_KEY = 'eb957901436a99006ef620bd3a532c82';
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';

// Style presets
const STYLE_PRESETS = [
  { id: 'realistic', name: '📸 Realistic', prompt: 'photorealistic, highly detailed, 8K, professional photography' },
  { id: 'cinematic', name: '🎬 Cinematic', prompt: 'cinematic lighting, dramatic composition, movie still, film grain' },
  { id: 'anime', name: '🎌 Anime', prompt: 'anime style, vibrant colors, detailed illustration, studio ghibli inspired' },
  { id: 'digital-art', name: '🎨 Digital Art', prompt: 'digital art, concept art, highly detailed, artstation trending' },
  { id: '3d-render', name: '🧊 3D Render', prompt: '3D render, octane render, unreal engine, highly detailed, volumetric lighting' },
  { id: 'oil-painting', name: '🖼️ Oil Painting', prompt: 'oil painting, classical art, brush strokes, canvas texture, masterpiece' },
  { id: 'watercolor', name: '💧 Watercolor', prompt: 'watercolor painting, soft colors, artistic, delicate brush strokes' },
  { id: 'minimalist', name: '⬜ Minimalist', prompt: 'minimalist design, clean lines, simple, elegant, modern aesthetic' },
];

// Aspect ratios
const ASPECT_RATIOS = [
  { id: '1:1', name: '1:1 (Square)', width: 1024, height: 1024 },
  { id: '16:9', name: '16:9 (Landscape)', width: 1344, height: 768 },
  { id: '9:16', name: '9:16 (Portrait)', width: 768, height: 1344 },
  { id: '4:3', name: '4:3 (Standard)', width: 1152, height: 896 },
  { id: '3:4', name: '3:4 (Portrait)', width: 896, height: 1152 },
];

interface TextToImageProps {
  onGenerated?: (item: { type: string; outputUrl: string; prompt: string }) => void;
}

export function TextToImage({ onGenerated }: TextToImageProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  // Create Kie.ai task for text-to-image
  const createKieTask = async (fullPrompt: string): Promise<string> => {
    setProgress('Đang tạo task...');
    
    const ratio = ASPECT_RATIOS.find(r => r.id === aspectRatio)!;
    
    const response = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': KIE_API_KEY,
      },
      body: JSON.stringify({
        model: 'kling-v2-master',
        task_type: 'text2image',
        input: {
          prompt: fullPrompt,
          negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
          cfg_scale: 7,
          aspect_ratio: aspectRatio,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create task');
    }

    const data = await response.json();
    return data.data.task_id;
  };

  // Poll for result
  const pollResult = async (taskId: string): Promise<string> => {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      setProgress(`Đang xử lý... (${attempts + 1}/${maxAttempts})`);
      
      const response = await fetch(`${KIE_API_URL}/${taskId}`, {
        headers: { 'Api-Key': KIE_API_KEY },
      });

      if (!response.ok) throw new Error('Failed to check status');

      const data = await response.json();
      const state = data.data.task_status;

      if (state === 'succeed') {
        return data.data.task_result.images[0].url;
      }
      
      if (state === 'failed') {
        throw new Error(data.data.task_status_msg || 'Generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Timeout - quá thời gian chờ');
  };

  // Generate image
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Vui lòng nhập mô tả!');
      return;
    }

    setIsGenerating(true);
    setResult(null);
    const startTime = Date.now();

    // Create job in database
    let dbJobId: string | undefined;

    try {
      // Build full prompt with style
      const stylePreset = STYLE_PRESETS.find(s => s.id === style);
      const fullPrompt = stylePreset 
        ? `${prompt}, ${stylePreset.prompt}`
        : prompt;

      // Save job to database BEFORE creating task
      const dbJob = await createJob({
        job_type: 'text-to-image',
        status: 'processing',
        original_prompt: prompt,
        enhanced_prompt: fullPrompt,
        model: 'kling-v2-master',
        provider: 'kie.ai',
        settings: {
          style: style,
          styleName: stylePreset?.name,
          aspectRatio: aspectRatio,
        },
      });
      
      if (dbJob?.id) {
        dbJobId = dbJob.id;
        console.log('[TextToImage] Created DB job:', dbJobId);
      }

      // Create task
      const taskId = await createKieTask(fullPrompt);
      toast.info('Đang tạo ảnh...');
      
      // Update DB job with task ID
      if (dbJobId) {
        updateJob(dbJobId, { external_task_id: taskId });
      }

      // Poll for result
      const imageUrl = await pollResult(taskId);
      setResult(imageUrl);
      toast.success('🎉 Tạo ảnh thành công!');

      // Update DB job as SUCCESS
      if (dbJobId) {
        updateJob(dbJobId, {
          status: 'success',
          output_url: imageUrl,
          cost_usd: estimateCost('kling-v2-master'),
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
      }

      // Add to history
      if (onGenerated) {
        onGenerated({
          type: 'text-to-image',
          outputUrl: imageUrl,
          prompt: prompt,
        });
      }
    } catch (error) {
      console.error('Generation error:', error);
      
      // Update DB job as FAILED
      if (dbJobId) {
        updateJob(dbJobId, {
          status: 'failed',
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
      }
      
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  // Download image
  const handleDownload = () => {
    if (result) {
      window.open(result, '_blank');
      toast.success('Ảnh đã mở trong tab mới');
    }
  };

  // Copy URL
  const handleCopyUrl = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      toast.success('Đã copy URL!');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Text to Image
          </CardTitle>
          <CardDescription>Tạo ảnh từ mô tả văn bản</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prompt */}
          <div className="space-y-2">
            <Label>Mô tả ảnh</Label>
            <Textarea
              placeholder="Mô tả chi tiết ảnh bạn muốn tạo..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label>Phong cách</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_PRESETS.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label>Tỷ lệ ảnh</Label>
            <Select value={aspectRatio} onValueChange={setAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress || 'Đang tạo...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tạo ảnh
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Kết quả
          </CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border">
                <img
                  src={result}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Tải xuống
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleCopyUrl}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy URL
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>Nhập mô tả và nhấn "Tạo ảnh"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
