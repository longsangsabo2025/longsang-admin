import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, TrendingUp, FileText, Link2, CheckCircle2 } from 'lucide-react';
import { analyzeDomain, executeSEOAutomation } from '@/lib/ai-seo/client';
import type { KeywordAnalysis } from '@/lib/ai-seo/keyword-generator';
import type { SEOPlan } from '@/lib/ai-seo/plan-generator';
import { toast } from 'sonner';

export function AIAutoSEO() {
  const [domain, setDomain] = useState('');
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [keywords, setKeywords] = useState<KeywordAnalysis | null>(null);
  const [plan, setPlan] = useState<SEOPlan | null>(null);
  const [pages, setPages] = useState<string[]>([]);

  const handleAnalyze = async () => {
    if (!domain.trim()) {
      toast.error('Vui lòng nhập domain');
      return;
    }

    setAnalyzing(true);
    setProgress(0);

    try {
      // Progress simulation
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      toast.info('🤖 AI đang phân tích website...');

      const result = await analyzeDomain(domain, {
        language,
        country: language === 'vi' ? 'Vietnam' : undefined,
      });

      clearInterval(progressInterval);
      setProgress(100);

      setKeywords(result.keywords);
      setPlan(result.plan);
      setPages(result.pages);

      toast.success(`✅ Đã tạo ${result.keywords.totalKeywords} keywords và kế hoạch SEO!`);
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Lỗi phân tích domain');
    } finally {
      setAnalyzing(false);
      setProgress(0);
    }
  };

  const handleExecute = async () => {
    if (!keywords || !plan) {
      toast.error('Vui lòng phân tích domain trước');
      return;
    }

    setExecuting(true);

    try {
      toast.info('🚀 Đang khởi chạy SEO automation...');

      const result = await executeSEOAutomation(domain, keywords, plan, {
        autoIndex: true,
      });

      toast.success(
        `✅ ${result.message}\n` +
          `📊 Keywords: ${result.keywordsAdded}\n` +
          `🔗 Pages: ${result.pagesQueued}\n` +
          `🤖 Auto-indexing: ${result.autoIndexing ? 'Bật' : 'Tắt'}`
      );

      // Reset form
      setDomain('');
      setKeywords(null);
      setPlan(null);
      setPages([]);
    } catch (error) {
      console.error('Execution error:', error);
      toast.error(error instanceof Error ? error.message : 'Lỗi khởi chạy SEO');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            <div>
              <CardTitle>AI Auto SEO</CardTitle>
              <CardDescription>
                Nhập domain → AI tự động tạo keywords + kế hoạch SEO → Click "Chạy SEO" → Hoàn tất!
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Domain Input */}
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <div className="flex gap-2">
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="longsang.org hoặc saboarena.com"
                disabled={analyzing || executing}
              />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'vi')}
                className="px-3 py-2 border rounded-md"
                disabled={analyzing || executing}
              >
                <option value="vi">🇻🇳 Tiếng Việt</option>
                <option value="en">🇬🇧 English</option>
              </select>
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleAnalyze}
            disabled={analyzing || executing || !domain.trim()}
            className="w-full"
            size="lg"
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang phân tích AI...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Phân tích AI
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {analyzing && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {progress < 30 && 'Đang crawl website...'}
                {progress >= 30 && progress < 60 && 'AI đang phân tích nội dung...'}
                {progress >= 60 && progress < 90 && 'Đang tạo keywords...'}
                {progress >= 90 && 'Đang tạo kế hoạch SEO...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {keywords && plan && (
        <Tabs defaultValue="keywords" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="keywords">
              <TrendingUp className="mr-2 h-4 w-4" />
              Keywords ({keywords.totalKeywords})
            </TabsTrigger>
            <TabsTrigger value="plan">
              <FileText className="mr-2 h-4 w-4" />
              Kế hoạch SEO
            </TabsTrigger>
            <TabsTrigger value="pages">
              <Link2 className="mr-2 h-4 w-4" />
              Pages ({pages.length})
            </TabsTrigger>
          </TabsList>

          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📊 Keywords đã tạo</CardTitle>
                <CardDescription>
                  Tổng {keywords.totalKeywords} keywords | Trung bình{' '}
                  {keywords.avgSearchVolume.toLocaleString()} searches/tháng
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="primary">
                  <TabsList>
                    <TabsTrigger value="primary">
                      Chính ({keywords.primaryKeywords.length})
                    </TabsTrigger>
                    <TabsTrigger value="secondary">
                      Phụ ({keywords.secondaryKeywords.length})
                    </TabsTrigger>
                    <TabsTrigger value="longtail">
                      Long-tail ({keywords.longTailKeywords.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* Primary Keywords */}
                  <TabsContent value="primary" className="space-y-2">
                    {keywords.primaryKeywords.map((kw, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{kw.keyword}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">{kw.searchVolume.toLocaleString()}/mo</Badge>
                            <Badge
                              variant={
                                kw.competition === 'low'
                                  ? 'default'
                                  : kw.competition === 'medium'
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {kw.competition}
                            </Badge>
                            <Badge variant="outline">{kw.intent}</Badge>
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>Difficulty: {kw.difficulty}/100</div>
                          <div>Relevance: {kw.relevance}/100</div>
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  {/* Secondary Keywords */}
                  <TabsContent value="secondary" className="space-y-2">
                    {keywords.secondaryKeywords.slice(0, 20).map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-2 border rounded">
                        <span>{kw.keyword}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs">
                            {kw.searchVolume.toLocaleString()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {kw.competition}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {keywords.secondaryKeywords.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ...và {keywords.secondaryKeywords.length - 20} keywords khác
                      </p>
                    )}
                  </TabsContent>

                  {/* Long-tail Keywords */}
                  <TabsContent value="longtail" className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {keywords.longTailKeywords.slice(0, 20).map((kw, i) => (
                        <div key={i} className="p-2 border rounded text-sm">
                          {kw.keyword}
                        </div>
                      ))}
                    </div>
                    {keywords.longTailKeywords.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center">
                        ...và {keywords.longTailKeywords.length - 20} keywords khác
                      </p>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Recommendations */}
                {keywords.recommendations.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="font-semibold">💡 Khuyến nghị:</h4>
                    {keywords.recommendations.map((rec, i) => (
                      <Alert key={i}>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>{rec}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Plan Tab */}
          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📋 Kế hoạch SEO 6 tháng</CardTitle>
                <CardDescription>
                  Được tạo lúc: {new Date(plan.generatedAt).toLocaleString('vi-VN')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {/* Summary */}
                  <AccordionItem value="summary">
                    <AccordionTrigger>📊 Tổng quan</AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      <p>
                        <strong>Hiện trạng:</strong> {plan.summary.currentState}
                      </p>
                      <div>
                        <strong>Mục tiêu:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {plan.summary.targetGoals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                      <p>
                        <strong>Thời gian dự kiến:</strong> {plan.summary.estimatedTimeToResults}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Technical SEO */}
                  <AccordionItem value="technical">
                    <AccordionTrigger>
                      🔧 Technical SEO ({plan.technicalSEO.length} tasks)
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {plan.technicalSEO.slice(0, 10).map((task, i) => (
                          <div key={i} className="flex items-start gap-2 p-2 border rounded">
                            <Badge
                              variant={
                                task.priority === 'critical'
                                  ? 'destructive'
                                  : task.priority === 'high'
                                    ? 'default'
                                    : task.priority === 'medium'
                                      ? 'secondary'
                                      : 'outline'
                              }
                            >
                              {task.priority}
                            </Badge>
                            <div className="flex-1">
                              <p className="font-medium">{task.task}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.estimatedTime} • {task.deadline || 'Flexible'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Content Strategy */}
                  <AccordionItem value="content">
                    <AccordionTrigger>✍️ Content Strategy</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <p>{plan.contentStrategy.overview}</p>
                      <div>
                        <strong>Content Pillars:</strong>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {plan.contentStrategy.contentPillars.map((pillar, i) => (
                            <Badge key={i} variant="secondary">
                              {pillar}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <p>
                        <strong>Tần suất:</strong> {plan.contentStrategy.publishingFrequency}
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Timeline */}
                  <AccordionItem value="timeline">
                    <AccordionTrigger>📅 Timeline</AccordionTrigger>
                    <AccordionContent className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Week 1</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {plan.timeline.week1.map((task, i) => (
                            <li key={i} className="text-sm">
                              {task.task}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Month 1</h4>
                        <ul className="list-disc list-inside space-y-1">
                          {plan.timeline.month1.slice(0, 5).map((task, i) => (
                            <li key={i} className="text-sm">
                              {task.task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* KPIs */}
                  <AccordionItem value="kpis">
                    <AccordionTrigger>📈 KPIs & Metrics</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {plan.kpis.map((kpi, i) => (
                          <div key={i} className="p-3 border rounded">
                            <div className="flex justify-between items-center">
                              <strong>{kpi.metric}</strong>
                              <Badge>{kpi.timeframe}</Badge>
                            </div>
                            <div className="mt-1 text-sm flex justify-between">
                              <span>Current: {kpi.currentValue}</span>
                              <span>→</span>
                              <span className="text-green-600 font-medium">
                                Target: {kpi.targetValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pages Tab */}
          <TabsContent value="pages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>🔗 Pages được phát hiện</CardTitle>
                <CardDescription>
                  {pages.length} pages sẽ được đưa vào hàng đợi indexing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {pages.slice(0, 20).map((page, i) => (
                    <div key={i} className="p-2 border rounded text-sm font-mono truncate">
                      {page}
                    </div>
                  ))}
                  {pages.length > 20 && (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      ...và {pages.length - 20} pages khác
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Execute Button */}
      {keywords && plan && (
        <Card className="border-green-500 border-2">
          <CardContent className="pt-6">
            <Button
              onClick={handleExecute}
              disabled={executing}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Đang khởi chạy...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  🚀 CHẠY SEO (One-Click)
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Sẽ tự động: Save keywords → Save plan → Queue pages → Start indexing
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
