/**
 * Image Upscale Component
 * Upscale/enhance image resolution using AI
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ZoomIn, Upload, Loader2, Download, Copy, RefreshCw, Image as ImageIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { MediaItem } from '@/hooks/library/types';
import { cn } from '@/lib/utils';
import { createJob, updateJob, estimateCost } from '@/services/ai-jobs';

const IMGBB_API_KEY = '2c3d34ab82d9b3b679cc9303087a7769';
const KIE_API_KEY = 'eb957901436a99006ef620bd3a532c82';
const KIE_API_URL = 'https://api.kie.ai/api/v1/jobs';

// Upscale factors
const UPSCALE_FACTORS = [
  { id: '2x', name: '2x (Gấp đôi)', factor: 2 },
  { id: '4x', name: '4x (Gấp 4)', factor: 4 },
];

interface ImageUpscaleProps {
  selectedLibraryImage?: MediaItem;
  onGenerated?: (item: { type: string; outputUrl: string; inputUrl?: string }) => void;
  draggedItem?: MediaItem | null;
}

export function ImageUpscale({ selectedLibraryImage, onGenerated, draggedItem }: ImageUpscaleProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [scaleFactor, setScaleFactor] = useState('2x');

  // Update preview when library image is selected
  useEffect(() => {
    if (selectedLibraryImage) {
      setPreviewUrl(selectedLibraryImage.url);
      setSelectedFile(null);
    }
  }, [selectedLibraryImage]);

  // Handle file selection
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh!');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  }, []);

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    // Check if it's a library item being dropped
    if (draggedItem) {
      setPreviewUrl(draggedItem.url);
      setSelectedFile(null);
      setResult(null);
      toast.success(`Đã chọn: ${draggedItem.name}`);
      return;
    }
    
    // Otherwise handle file drop
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  }, [draggedItem]);

  // Upload to imgbb
  const uploadToImgbb = async (file: File): Promise<string> => {
    setProgress('Đang upload ảnh...');
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Upload ảnh thất bại');
    const data = await response.json();
    return data.data.url;
  };

  // Create upscale task using Kie.ai
  const createUpscaleTask = async (imageUrl: string): Promise<string> => {
    setProgress('Đang tạo task upscale...');
    
    const factor = UPSCALE_FACTORS.find(f => f.id === scaleFactor)?.factor || 2;
    
    const response = await fetch(KIE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': KIE_API_KEY,
      },
      body: JSON.stringify({
        model: 'kling-v2-master',
        task_type: 'image2image',
        input: {
          image: imageUrl,
          prompt: `high resolution, ${factor}x upscale, enhanced details, sharp, crystal clear, 8K quality, no artifacts`,
          negative_prompt: 'blurry, pixelated, low quality, noise, artifacts',
          cfg_scale: 5,
          denoising_strength: 0.3,
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
      setProgress(`Đang upscale... (${attempts + 1}/${maxAttempts})`);
      
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
        throw new Error(data.data.task_status_msg || 'Upscale failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Timeout - quá thời gian chờ');
  };

  // Process image
  const handleProcess = async () => {
    if (!previewUrl && !selectedFile) {
      toast.error('Vui lòng chọn ảnh!');
      return;
    }

    setIsProcessing(true);
    setResult(null);
    const startTime = Date.now();

    // Create job in database
    let dbJobId: string | undefined;

    try {
      let imageUrl: string;
      
      if (selectedFile) {
        imageUrl = await uploadToImgbb(selectedFile);
        toast.success('Upload ảnh thành công!');
      } else {
        imageUrl = previewUrl!;
      }

      const factor = UPSCALE_FACTORS.find(f => f.id === scaleFactor)?.factor || 2;

      // Save job to database BEFORE creating task
      const dbJob = await createJob({
        job_type: 'upscale',
        status: 'processing',
        input_images: [{ url: imageUrl, source: selectedFile ? 'upload' : 'library' }],
        model: 'kling-v2-master',
        provider: 'kie.ai',
        settings: {
          scaleFactor: scaleFactor,
          scaleMultiplier: factor,
        },
      });
      
      if (dbJob?.id) {
        dbJobId = dbJob.id;
        console.log('[Upscale] Created DB job:', dbJobId);
      }

      // Create upscale task
      const taskId = await createUpscaleTask(imageUrl);
      toast.info('Đang upscale ảnh...');
      
      // Update DB job with task ID
      if (dbJobId) {
        updateJob(dbJobId, { external_task_id: taskId });
      }

      // Poll for result
      const resultUrl = await pollResult(taskId);
      setResult(resultUrl);
      toast.success('🎉 Upscale thành công!');

      // Update DB job as SUCCESS
      if (dbJobId) {
        updateJob(dbJobId, {
          status: 'success',
          output_url: resultUrl,
          cost_usd: estimateCost('kling-v2-master'),
          processing_time_ms: Date.now() - startTime,
          completed_at: new Date().toISOString(),
        });
      }

      // Add to history
      if (onGenerated) {
        onGenerated({
          type: 'upscale',
          outputUrl: resultUrl,
          inputUrl: imageUrl,
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      
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
      setIsProcessing(false);
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
            <ZoomIn className="h-5 w-5" />
            Upscale ảnh
          </CardTitle>
          <CardDescription>Nâng cấp độ phân giải bằng AI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
              isDragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50",
              previewUrl && "border-solid"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('upscale-input')?.click()}
          >
            {previewUrl ? (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg object-contain"
                />
                <p className="text-sm text-muted-foreground">
                  Click hoặc kéo thả để thay đổi
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="text-sm font-medium">Kéo thả ảnh hoặc click để chọn</p>
                <p className="text-xs text-muted-foreground">
                  Hỗ trợ: PNG, JPG, WebP
                </p>
              </div>
            )}
            <input
              id="upscale-input"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Scale Factor */}
          <div className="space-y-2">
            <Label>Mức upscale</Label>
            <Select value={scaleFactor} onValueChange={setScaleFactor}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UPSCALE_FACTORS.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={isProcessing || !previewUrl}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress || 'Đang xử lý...'}
              </>
            ) : (
              <>
                <ZoomIn className="mr-2 h-4 w-4" />
                Upscale {scaleFactor}
              </>
            )}
          </Button>

          {/* Info */}
          <p className="text-xs text-muted-foreground text-center">
            💡 Tip: Chọn ảnh từ thư viện bên trái hoặc kéo thả vào đây
          </p>
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
                  alt="Result"
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
                <Button variant="outline" onClick={handleProcess} disabled={isProcessing}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
              <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
              <p>Chọn ảnh và nhấn "Upscale"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
