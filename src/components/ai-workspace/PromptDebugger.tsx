/**
 * 🔍 Prompt Debugger
 * Xem chi tiết prompt cuối cùng được gửi đến AI
 * Giúp tinh chỉnh Knowledge Base hiệu quả hơn
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bug, 
  Play, 
  FileText, 
  User, 
  FolderKanban, 
  Target, 
  BookOpen,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Loader2,
  Sparkles,
  AlertCircle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface PromptSection {
  content: string;
  tokens: number;
  documentCount?: number;
  profile?: Record<string, unknown>;
  projectCount?: number;
  goalCount?: number;
  knowledgeCount?: number;
}

interface PromptPreview {
  assistantType: string;
  query: string;
  sections: {
    basePrompt: PromptSection;
    ragContext: PromptSection;
    personalContext: PromptSection;
  };
  fullPrompt: string;
  totalTokens: number;
  rawContext: {
    profile: Record<string, unknown>;
    projects: Array<Record<string, unknown>>;
    goals: Array<Record<string, unknown>>;
    knowledge: Array<Record<string, unknown>>;
  };
}

export function PromptDebugger() {
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [assistantType, setAssistantType] = useState('research');
  const [preview, setPreview] = useState<PromptPreview | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basePrompt: false,
    ragContext: true,
    personalContext: true,
    fullPrompt: false,
  });

  const previewPrompt = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/knowledge/preview-prompt`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': 'default-longsang-user'
        },
        body: JSON.stringify({ query, assistantType }),
      });
      
      const data = await res.json();
      if (data.success) {
        setPreview(data.preview);
        toast.success('Đã tạo preview prompt!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Lỗi khi preview prompt');
    } finally {
      setLoading(false);
    }
  }, [query, assistantType]);

  const copyToClipboard = useCallback((text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success('Đã copy vào clipboard!');
    setTimeout(() => setCopiedSection(null), 2000);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  const getTokenColor = (tokens: number) => {
    if (tokens < 500) return 'text-green-500';
    if (tokens < 2000) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Bug className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-bold">Prompt Debugger</h2>
        <Badge variant="secondary">Debug Mode</Badge>
      </div>

      {/* Input Section */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Test Query
          </CardTitle>
          <CardDescription>
            Nhập câu hỏi mẫu để xem prompt cuối cùng sẽ được gửi đến AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="VD: Tôi đang làm những project gì?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && previewPrompt()}
              />
            </div>
            <Select value={assistantType} onValueChange={setAssistantType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research">🔬 Research</SelectItem>
                <SelectItem value="course">📚 Course</SelectItem>
                <SelectItem value="financial">💰 Financial</SelectItem>
                <SelectItem value="news">📰 News</SelectItem>
                <SelectItem value="career">💼 Career</SelectItem>
                <SelectItem value="daily">📅 Daily</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={previewPrompt} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Preview Prompt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {preview && (
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Prompt Preview
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Assistant: {preview.assistantType}
                </Badge>
                <Badge variant="secondary" className={getTokenColor(preview.totalTokens)}>
                  ~{preview.totalTokens.toLocaleString()} tokens
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-hidden p-0">
            <Tabs defaultValue="breakdown" className="h-full flex flex-col">
              <TabsList className="mx-4 shrink-0">
                <TabsTrigger value="breakdown">📊 Breakdown</TabsTrigger>
                <TabsTrigger value="full">📝 Full Prompt</TabsTrigger>
                <TabsTrigger value="raw">🔧 Raw Data</TabsTrigger>
              </TabsList>

              {/* Breakdown Tab */}
              <TabsContent value="breakdown" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Base System Prompt */}
                    <Collapsible 
                      open={expandedSections.basePrompt}
                      onOpenChange={() => toggleSection('basePrompt')}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            {expandedSections.basePrompt ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="font-medium">Base System Prompt</span>
                          </div>
                          <Badge variant="outline" className={getTokenColor(preview.sections.basePrompt.tokens)}>
                            ~{preview.sections.basePrompt.tokens} tokens
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(preview.sections.basePrompt.content, 'base')}
                            >
                              {copiedSection === 'base' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              Copy
                            </Button>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border max-h-[300px] overflow-auto">
                            {preview.sections.basePrompt.content}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* RAG Context */}
                    <Collapsible 
                      open={expandedSections.ragContext}
                      onOpenChange={() => toggleSection('ragContext')}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <div className="flex items-center gap-2">
                            {expandedSections.ragContext ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <BookOpen className="h-4 w-4 text-purple-500" />
                            <span className="font-medium">RAG Context (Documents)</span>
                            <Badge variant="secondary" className="ml-2">
                              {preview.sections.ragContext.documentCount || 0} docs
                            </Badge>
                          </div>
                          <Badge variant="outline" className={getTokenColor(preview.sections.ragContext.tokens)}>
                            ~{preview.sections.ragContext.tokens} tokens
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(preview.sections.ragContext.content, 'rag')}
                            >
                              {copiedSection === 'rag' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              Copy
                            </Button>
                          </div>
                          {preview.sections.ragContext.content ? (
                            <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border max-h-[300px] overflow-auto">
                              {preview.sections.ragContext.content}
                            </pre>
                          ) : (
                            <div className="text-sm text-muted-foreground italic p-3">
                              Không có documents nào được tìm thấy
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Personal Context - THE IMPORTANT ONE */}
                    <Collapsible 
                      open={expandedSections.personalContext}
                      onOpenChange={() => toggleSection('personalContext')}
                    >
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg cursor-pointer hover:bg-primary/20 transition-colors border border-primary/30">
                          <div className="flex items-center gap-2">
                            {expandedSections.personalContext ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-medium">🧠 Personal Knowledge Base</span>
                            <div className="flex gap-1 ml-2">
                              <Badge variant="secondary" className="text-xs">
                                <FolderKanban className="h-3 w-3 mr-1" />
                                {preview.sections.personalContext.projectCount} projects
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                <Target className="h-3 w-3 mr-1" />
                                {preview.sections.personalContext.goalCount} goals
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {preview.sections.personalContext.knowledgeCount} knowledge
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className={getTokenColor(preview.sections.personalContext.tokens)}>
                            ~{preview.sections.personalContext.tokens} tokens
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex justify-end mb-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(preview.sections.personalContext.content, 'personal')}
                            >
                              {copiedSection === 'personal' ? (
                                <Check className="h-3 w-3 mr-1" />
                              ) : (
                                <Copy className="h-3 w-3 mr-1" />
                              )}
                              Copy
                            </Button>
                          </div>
                          {preview.sections.personalContext.content ? (
                            <pre className="text-xs whitespace-pre-wrap font-mono bg-background p-3 rounded border max-h-[400px] overflow-auto">
                              {preview.sections.personalContext.content}
                            </pre>
                          ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3">
                              <AlertCircle className="h-4 w-4" />
                              Chưa có Personal Context. Hãy thêm dữ liệu trong tab Knowledge!
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Token Summary */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Token Summary
                      </h4>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Base Prompt</div>
                          <div className="font-mono font-medium">{preview.sections.basePrompt.tokens}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">RAG Context</div>
                          <div className="font-mono font-medium">{preview.sections.ragContext.tokens}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Personal Context</div>
                          <div className="font-mono font-medium">{preview.sections.personalContext.tokens}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground font-medium">Total</div>
                          <div className={`font-mono font-bold ${getTokenColor(preview.totalTokens)}`}>
                            {preview.totalTokens}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Full Prompt Tab */}
              <TabsContent value="full" className="flex-1 m-0 overflow-hidden">
                <div className="h-full flex flex-col p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">
                      Full System Prompt (~{preview.totalTokens} tokens)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(preview.fullPrompt, 'full')}
                    >
                      {copiedSection === 'full' ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      Copy Full Prompt
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 border rounded-lg">
                    <pre className="text-xs whitespace-pre-wrap font-mono p-4">
                      {preview.fullPrompt}
                    </pre>
                  </ScrollArea>
                </div>
              </TabsContent>

              {/* Raw Data Tab */}
              <TabsContent value="raw" className="flex-1 m-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {/* Profile */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </h4>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto">
                        {JSON.stringify(preview.rawContext.profile, null, 2)}
                      </pre>
                    </div>

                    <Separator />

                    {/* Projects */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <FolderKanban className="h-4 w-4" />
                        Projects ({preview.rawContext.projects?.length || 0})
                      </h4>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-[200px]">
                        {JSON.stringify(preview.rawContext.projects, null, 2)}
                      </pre>
                    </div>

                    <Separator />

                    {/* Goals */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Goals ({preview.rawContext.goals?.length || 0})
                      </h4>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-[200px]">
                        {JSON.stringify(preview.rawContext.goals, null, 2)}
                      </pre>
                    </div>

                    <Separator />

                    {/* Relevant Knowledge */}
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Relevant Knowledge ({preview.rawContext.knowledge?.length || 0})
                      </h4>
                      <pre className="text-xs font-mono bg-muted p-3 rounded overflow-auto max-h-[200px]">
                        {JSON.stringify(preview.rawContext.knowledge, null, 2)}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!preview && !loading && (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Bug className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Nhập câu hỏi và click "Preview Prompt"</p>
            <p className="text-sm mt-1">để xem chi tiết prompt được gửi đến AI</p>
          </div>
        </Card>
      )}
    </div>
  );
}

export default PromptDebugger;
