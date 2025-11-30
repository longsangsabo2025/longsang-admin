import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { soraVideoService, type SoraVideoResponse } from "@/lib/api/sora-video-service";
import { 
  Video, 
  Sparkles, 
  Play, 
  Loader2, 
  Download, 
  ExternalLink,
  Wand2,
  Monitor,
  Smartphone,
  Square,
  Clock,
  FolderOpen,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";

const SoraVideoGenerator = () => {
  const { toast } = useToast();
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [useAIEnhance, setUseAIEnhance] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1">("16:9");
  const [duration, setDuration] = useState(5);
  const [folderId, setFolderId] = useState("root");
  
  // Status state
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<SoraVideoResponse | null>(null);

  // Quick prompts for testing
  const quickPrompts = [
    "A flying pig in the sunset sky",
    "Robot dancing in a neon city",
    "Ocean waves crashing on rocks",
    "Fireworks exploding over a city skyline",
    "Cat playing piano in a concert hall"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập prompt để tạo video",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      toast({
        title: "🎬 Đang tạo video...",
        description: useAIEnhance 
          ? "AI đang enhance prompt và gửi đến Sora 2..." 
          : "Đang gửi prompt đến Sora 2..."
      });

      const response = await soraVideoService.generateVideo({
        prompt,
        use_ai_enhance: useAIEnhance,
        aspect_ratio: aspectRatio,
        duration,
        folder_id: folderId
      });

      setResult(response);

      if (response.success) {
        toast({
          title: "✅ Video đã tạo thành công!",
          description: response.data?.google_drive 
            ? "Video đã được upload lên Google Drive" 
            : "Video đã sẵn sàng"
        });
      } else {
        toast({
          title: "❌ Lỗi tạo video",
          description: response.error || "Đã có lỗi xảy ra",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Lỗi",
        description: error.message || "Không thể kết nối đến n8n",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleQuickGenerate = async (quickPrompt: string) => {
    setPrompt(quickPrompt);
    
    setIsGenerating(true);
    setResult(null);

    try {
      const response = await soraVideoService.quickGenerate(quickPrompt);
      setResult(response);
      
      if (response.success) {
        toast({
          title: "✅ Video đã tạo thành công!",
          description: "Video đã được upload lên Google Drive"
        });
      }
    } catch (error: any) {
      toast({
        title: "❌ Lỗi",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Video className="h-8 w-8 text-purple-500" />
            Sora Video Generator
          </h1>
          <p className="text-muted-foreground mt-1">
            Tạo video AI với Sora 2 và tự động upload lên Google Drive
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Powered by Sora 2 + n8n
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Input Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5" />
              Tạo Video Mới
            </CardTitle>
            <CardDescription>
              Nhập prompt mô tả video bạn muốn tạo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Ví dụ: Một con heo đang bay trên bầu trời hoàng hôn..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Mô tả chi tiết video bạn muốn tạo. AI sẽ enhance prompt nếu được bật.
              </p>
            </div>

            {/* Settings Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AI Enhance */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  <Label htmlFor="ai-enhance" className="text-sm">AI Enhance</Label>
                </div>
                <Switch
                  id="ai-enhance"
                  checked={useAIEnhance}
                  onCheckedChange={setUseAIEnhance}
                />
              </div>

              {/* Aspect Ratio */}
              <div className="space-y-2">
                <Label className="text-sm">Tỉ lệ khung hình</Label>
                <Select value={aspectRatio} onValueChange={(v: any) => setAspectRatio(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        16:9 (Wide)
                      </div>
                    </SelectItem>
                    <SelectItem value="9:16">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        9:16 (Vertical)
                      </div>
                    </SelectItem>
                    <SelectItem value="1:1">
                      <div className="flex items-center gap-2">
                        <Square className="h-4 w-4" />
                        1:1 (Square)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label className="text-sm">Thời lượng (giây)</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 5)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>

            {/* Folder Selection */}
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Google Drive Folder ID (optional)
              </Label>
              <Input
                placeholder="root (mặc định là thư mục gốc)"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value || "root")}
              />
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !prompt.trim()}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang tạo video... (có thể mất 1-5 phút)
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  Tạo Video
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quick Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🚀 Quick Prompts</CardTitle>
            <CardDescription>Click để tạo nhanh với các prompt mẫu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {quickPrompts.map((qp, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4"
                onClick={() => handleQuickGenerate(qp)}
                disabled={isGenerating}
              >
                <span className="truncate">{qp}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Result Section */}
      {result && (
        <Card className={result.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Video Đã Tạo Thành Công!
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-500" />
                  Lỗi Tạo Video
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.success && result.data ? (
              <Tabs defaultValue="video" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="prompts">Prompts</TabsTrigger>
                  <TabsTrigger value="details">Chi tiết</TabsTrigger>
                </TabsList>

                <TabsContent value="video" className="space-y-4">
                  {/* Video Preview */}
                  {result.data.video_url && (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video 
                        src={result.data.video_url} 
                        controls 
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  {/* Google Drive Links */}
                  {result.data.google_drive && (
                    <div className="flex flex-wrap gap-3">
                      <Button asChild>
                        <a 
                          href={result.data.google_drive.view_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Xem trên Google Drive
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a 
                          href={result.data.google_drive.download_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Tải xuống
                        </a>
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="prompts" className="space-y-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs text-muted-foreground">Prompt gốc</Label>
                      <p className="mt-1">{result.data.prompt?.original}</p>
                    </div>
                    {result.data.prompt?.enhanced !== result.data.prompt?.original && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200">
                        <Label className="text-xs text-amber-600">Prompt đã enhance bởi AI</Label>
                        <p className="mt-1">{result.data.prompt?.enhanced}</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs text-muted-foreground">Task ID</Label>
                      <p className="mt-1 font-mono text-sm">{result.data.task_id}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs text-muted-foreground">Model</Label>
                      <p className="mt-1">{result.data.settings?.model}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs text-muted-foreground">Aspect Ratio</Label>
                      <p className="mt-1">{result.data.settings?.aspect_ratio}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <Label className="text-xs text-muted-foreground">Duration</Label>
                      <p className="mt-1">{result.data.settings?.duration}s</p>
                    </div>
                    {result.data.google_drive && (
                      <div className="p-3 bg-muted rounded-lg col-span-2">
                        <Label className="text-xs text-muted-foreground">Google Drive File ID</Label>
                        <p className="mt-1 font-mono text-sm">{result.data.google_drive.file_id}</p>
                      </div>
                    )}
                    {result.data.processing && (
                      <div className="p-3 bg-muted rounded-lg col-span-2">
                        <Label className="text-xs text-muted-foreground">Processing Time</Label>
                        <p className="mt-1">{result.data.processing.total_time_seconds} seconds ({result.data.processing.poll_count} polls)</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <p className="text-red-600">{result.error || result.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Hướng dẫn sử dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• <strong>AI Enhance</strong>: Tự động cải thiện prompt của bạn để video chất lượng hơn</p>
          <p>• <strong>16:9</strong>: Tốt cho YouTube, website</p>
          <p>• <strong>9:16</strong>: Tốt cho TikTok, Instagram Reels</p>
          <p>• <strong>1:1</strong>: Tốt cho Instagram Feed</p>
          <p>• Video sẽ tự động upload lên Google Drive sau khi tạo xong</p>
          <p>• Thời gian tạo video: 1-5 phút tùy độ phức tạp</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SoraVideoGenerator;
