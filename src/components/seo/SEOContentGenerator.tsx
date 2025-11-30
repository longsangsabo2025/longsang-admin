/**
 * =================================================================
 * SEO CONTENT GENERATOR
 * =================================================================
 * AI-powered SEO content generation for blog posts, descriptions,
 * meta tags, and social media content
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ImagePicker } from "@/components/media";
import {
  FileText,
  Sparkles,
  Copy,
  Loader2,
  Hash,
  Globe,
  Image,
  Wand2,
  CheckCircle2,
} from "lucide-react";

interface GeneratedContent {
  title: string;
  metaDescription: string;
  h1: string;
  introduction: string;
  outline: string[];
  keywords: string[];
  socialPosts: {
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  imageAlt: string;
}

interface SEOContentGeneratorProps {
  readonly projectId?: string;
  readonly projectName?: string;
}

// Helper to create hashtag from topic
const toHashtag = (str: string): string => str.split(/\s+/).join("");

export function SEOContentGenerator({ projectId: _projectId, projectName }: Readonly<SEOContentGeneratorProps>) {
  const { toast } = useToast();
  
  // Input fields
  const [topic, setTopic] = useState("");
  const [targetKeyword, setTargetKeyword] = useState("");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [contentType, setContentType] = useState<"blog" | "product" | "service" | "landing">("blog");
  const [tone, setTone] = useState<"professional" | "casual" | "friendly" | "formal">("professional");
  
  // Generated content
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // Copy to clipboard
  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "✅ Đã copy!",
        description: `${label} đã được copy vào clipboard`,
      });
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể copy. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  // Generate SEO content using AI
  const generateContent = async () => {
    if (!topic.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập chủ đề bài viết",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    
    try {
      toast({
        title: "🤖 Đang tạo nội dung SEO...",
        description: `Chủ đề: ${topic}`,
      });

      // Simulate AI generation (would call real AI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const hashtag = toHashtag(topic);

      // Mock generated content
      const content: GeneratedContent = {
        title: language === "vi" 
          ? `${topic} - Hướng dẫn chi tiết từ A đến Z [2025]`
          : `${topic} - Complete Guide from A to Z [2025]`,
        metaDescription: language === "vi"
          ? `Khám phá ${topic.toLowerCase()} với hướng dẫn chi tiết nhất. Cập nhật 2025. ✓ Mẹo hay ✓ Thủ thuật ✓ Best practices từ chuyên gia.`
          : `Discover ${topic.toLowerCase()} with the most detailed guide. Updated 2025. ✓ Tips ✓ Tricks ✓ Best practices from experts.`,
        h1: language === "vi"
          ? `${topic}: Tất cả những gì bạn cần biết`
          : `${topic}: Everything you need to know`,
        introduction: language === "vi"
          ? `Trong bài viết này, chúng ta sẽ khám phá chi tiết về ${topic.toLowerCase()}. Dù bạn là người mới hay đã có kinh nghiệm, hướng dẫn này sẽ cung cấp những thông tin giá trị giúp bạn thành công.`
          : `In this article, we will explore ${topic.toLowerCase()} in detail. Whether you're a beginner or experienced, this guide will provide valuable insights for your success.`,
        outline: language === "vi" ? [
          `1. ${topic} là gì?`,
          `2. Tại sao ${topic} quan trọng?`,
          "3. Hướng dẫn từng bước",
          "4. Các mẹo và thủ thuật",
          "5. Những sai lầm cần tránh",
          "6. Công cụ hữu ích",
          "7. Kết luận và bước tiếp theo"
        ] : [
          `1. What is ${topic}?`,
          `2. Why is ${topic} important?`,
          "3. Step-by-step guide",
          "4. Tips and tricks",
          "5. Common mistakes to avoid",
          "6. Useful tools",
          "7. Conclusion and next steps"
        ],
        keywords: [
          targetKeyword || topic.toLowerCase(),
          `hướng dẫn ${topic.toLowerCase()}`,
          `${topic.toLowerCase()} cho người mới`,
          `cách ${topic.toLowerCase()}`,
          `tips ${topic.toLowerCase()}`,
        ],
        socialPosts: {
          facebook: language === "vi"
            ? `🔥 ${topic} - Hướng dẫn chi tiết 2025!\n\n✅ Mẹo hay từ chuyên gia\n✅ Thủ thuật ít ai biết\n✅ Công cụ miễn phí\n\n👉 Đọc ngay: [link]\n\n#${hashtag} #Tips #HuongDan`
            : `🔥 ${topic} - Complete Guide 2025!\n\n✅ Expert tips\n✅ Hidden tricks\n✅ Free tools\n\n👉 Read now: [link]\n\n#${hashtag} #Tips #Guide`,
          instagram: language === "vi"
            ? `💡 ${topic}\n\nSave lại để đọc sau! 📌\n\n1️⃣ Bắt đầu với những điều cơ bản\n2️⃣ Thực hành mỗi ngày\n3️⃣ Học từ những người giỏi\n4️⃣ Không ngừng cải tiến\n\n#${hashtag} #TipsVietNam`
            : `💡 ${topic}\n\nSave for later! 📌\n\n1️⃣ Start with the basics\n2️⃣ Practice daily\n3️⃣ Learn from experts\n4️⃣ Keep improving\n\n#${hashtag} #Tips`,
          linkedin: language === "vi"
            ? `🎯 ${topic} - Những điều tôi học được\n\nSau nhiều năm làm việc trong lĩnh vực này, đây là những bài học quan trọng:\n\n▪️ Điều 1: Kiên trì là chìa khóa\n▪️ Điều 2: Học từ thất bại\n▪️ Điều 3: Networking là quan trọng\n\n#${hashtag}`
            : `🎯 ${topic} - Key lessons learned\n\nAfter years in this field, here are the important lessons:\n\n▪️ Lesson 1: Persistence is key\n▪️ Lesson 2: Learn from failures\n▪️ Lesson 3: Networking matters\n\n#${hashtag}`,
          twitter: language === "vi"
            ? `${topic} trong 5 bước đơn giản:\n\n1. Nghiên cứu\n2. Lên kế hoạch\n3. Thực hiện\n4. Đánh giá\n5. Cải tiến\n\n🔗 Chi tiết: [link]\n\n#${hashtag} #Tips`
            : `${topic} in 5 simple steps:\n\n1. Research\n2. Plan\n3. Execute\n4. Evaluate\n5. Improve\n\n🔗 Details: [link]\n\n#${hashtag} #Tips`,
        },
        imageAlt: language === "vi"
          ? `Hình ảnh minh họa về ${topic.toLowerCase()} - Hướng dẫn chi tiết`
          : `Illustration of ${topic.toLowerCase()} - Detailed guide`,
      };

      setGeneratedContent(content);
      
      toast({
        title: "✅ Đã tạo nội dung SEO!",
        description: "Bạn có thể copy và sử dụng ngay",
      });

    } catch (error) {
      console.error("Failed to generate content:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo nội dung. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleImageChange = (url: string | undefined) => {
    setImageUrl(url ?? "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-primary" />
            SEO Content Generator
          </h2>
          <p className="text-muted-foreground">
            Tạo nội dung SEO tự động với AI
            {projectName && ` cho ${projectName}`}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Thông tin bài viết
            </CardTitle>
            <CardDescription>
              Nhập thông tin để AI tạo nội dung SEO
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic">Chủ đề bài viết *</Label>
              <Input
                id="topic"
                placeholder="VD: Cách đầu tư bất động sản"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            {/* Target Keyword */}
            <div className="space-y-2">
              <Label htmlFor="keyword">
                <Hash className="w-4 h-4 inline mr-1" />
                Từ khóa chính
              </Label>
              <Input
                id="keyword"
                placeholder="VD: đầu tư bất động sản"
                value={targetKeyword}
                onChange={(e) => setTargetKeyword(e.target.value)}
              />
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label>
                <Globe className="w-4 h-4 inline mr-1" />
                Ngôn ngữ
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={language === "vi" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("vi")}
                >
                  🇻🇳 Tiếng Việt
                </Button>
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLanguage("en")}
                >
                  🇬🇧 English
                </Button>
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Loại nội dung</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "blog", label: "📝 Blog" },
                  { value: "product", label: "🛒 Sản phẩm" },
                  { value: "service", label: "🛠️ Dịch vụ" },
                  { value: "landing", label: "🎯 Landing" },
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={contentType === type.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setContentType(type.value as typeof contentType)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Giọng văn</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "professional", label: "👔 Chuyên nghiệp" },
                  { value: "casual", label: "😊 Thoải mái" },
                  { value: "friendly", label: "🤝 Thân thiện" },
                  { value: "formal", label: "📋 Trang trọng" },
                ].map((t) => (
                  <Button
                    key={t.value}
                    variant={tone === t.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTone(t.value as typeof tone)}
                  >
                    {t.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label>
                <Image className="w-4 h-4 inline mr-1" />
                Ảnh đại diện
              </Label>
              <ImagePicker
                value={imageUrl}
                onChange={handleImageChange}
                placeholder="Chọn ảnh cho bài viết"
              />
            </div>

            {/* Generate Button */}
            <Button
              className="w-full"
              onClick={generateContent}
              disabled={generating || !topic.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo nội dung SEO
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Nội dung được tạo
            </CardTitle>
            <CardDescription>
              {generatedContent ? "Copy và sử dụng ngay" : "Nhập thông tin và nhấn tạo"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {generatedContent ? (
              <Tabs defaultValue="seo" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="content">Nội dung</TabsTrigger>
                  <TabsTrigger value="social">Social</TabsTrigger>
                </TabsList>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Title Tag
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.title, "Title")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {generatedContent.title}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {generatedContent.title.length}/60 ký tự
                    </Badge>
                  </div>

                  {/* Meta Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Meta Description
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.metaDescription, "Meta")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {generatedContent.metaDescription}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {generatedContent.metaDescription.length}/160 ký tự
                    </Badge>
                  </div>

                  {/* H1 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        H1 Tag
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.h1, "H1")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm font-bold">
                      {generatedContent.h1}
                    </div>
                  </div>

                  {/* Keywords */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      <Hash className="w-4 h-4" />
                      Keywords gợi ý
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {generatedContent.keywords.map((kw) => (
                        <Badge 
                          key={kw} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                          onClick={() => copyText(kw, "Keyword")}
                        >
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Image Alt */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        Image Alt Text
                      </Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.imageAlt, "Alt")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {generatedContent.imageAlt}
                    </div>
                  </div>
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4">
                  {/* Introduction */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Đoạn mở đầu</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.introduction, "Intro")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md text-sm">
                      {generatedContent.introduction}
                    </div>
                  </div>

                  {/* Outline */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Dàn bài</Label>
                      <Button variant="ghost" size="sm" onClick={() => copyText(generatedContent.outline.join("\n"), "Outline")}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-3 bg-muted rounded-md space-y-1">
                      {generatedContent.outline.map((item) => (
                        <div key={item} className="text-sm">{item}</div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Social Tab */}
                <TabsContent value="social" className="space-y-4">
                  {Object.entries(generatedContent.socialPosts).map(([platform, content]) => (
                    <div key={platform} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="capitalize flex items-center gap-2">
                          {platform === "facebook" && "📘"}
                          {platform === "instagram" && "📸"}
                          {platform === "linkedin" && "💼"}
                          {platform === "twitter" && "🐦"}
                          {platform}
                        </Label>
                        <Button variant="ghost" size="sm" onClick={() => copyText(content, platform)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-line">
                        {content}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                <p>Nhập thông tin bài viết và nhấn "Tạo nội dung SEO"</p>
                <p className="text-sm">AI sẽ tạo title, meta description, dàn bài và social posts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SEOContentGenerator;
