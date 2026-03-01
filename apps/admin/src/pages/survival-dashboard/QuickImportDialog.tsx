import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardPaste,
  DollarSign,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useCreateTask } from '@/hooks/use-survival';
import { TASK_CATEGORIES, calculateICE } from '@/types/survival.types';
import { parseTasksFromText, type ParsedTask } from './shared';

// =====================================================
// PROPS
// =====================================================

export interface QuickImportDialogProps {
  onSuccess: () => void;
}

// =====================================================
// COMPONENT
// =====================================================

export function QuickImportDialog({ onSuccess }: QuickImportDialogProps) {
  const createTask = useCreateTask();
  const [inputText, setInputText] = useState('');
  const [parsedTasks, setParsedTasks] = useState<ParsedTask[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [useAI, setUseAI] = useState(true); // Default to AI parsing
  
  // Parse with AI
  const parseWithAI = async (text: string) => {
    if (!text.trim()) {
      setParsedTasks([]);
      return;
    }
    
    setIsParsing(true);
    setParseError(null);
    
    try {
      const response = await fetch('/api/ai-task-parser/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      
      const data = await response.json();
      
      if (data.success && data.tasks) {
        setParsedTasks(data.tasks.map((t: any) => ({
          title: t.title,
          category: t.category,
          size: t.size,
          impact: t.impact,
          confidence: t.confidence,
          ease: t.ease,
          potential_revenue: t.potential_revenue,
          urgent: t.urgent,
          important: t.important,
        })));
      } else {
        setParseError(data.error || 'Failed to parse tasks');
        // Fallback to manual parsing
        const tasks = parseTasksFromText(text);
        setParsedTasks(tasks);
      }
    } catch (error) {
      console.error('AI parse error:', error);
      setParseError('AI không khả dụng, sử dụng parser thường');
      // Fallback to manual parsing
      const tasks = parseTasksFromText(text);
      setParsedTasks(tasks);
    } finally {
      setIsParsing(false);
    }
  };
  
  // Debounced AI parsing
  useEffect(() => {
    if (!useAI) {
      // Use manual parsing
      if (inputText.trim()) {
        const tasks = parseTasksFromText(inputText);
        setParsedTasks(tasks);
      } else {
        setParsedTasks([]);
      }
      return;
    }
    
    // Debounce AI parsing
    const timer = setTimeout(() => {
      parseWithAI(inputText);
    }, 800); // Wait 800ms after typing stops
    
    return () => clearTimeout(timer);
  }, [inputText, useAI]);
  
  const handleImport = async () => {
    if (parsedTasks.length === 0) return;
    
    setIsImporting(true);
    setImportProgress(0);
    setImportedCount(0);
    
    for (let i = 0; i < parsedTasks.length; i++) {
      const task = parsedTasks[i];
      
      try {
        await new Promise<void>((resolve, reject) => {
          createTask.mutate({
            title: task.title,
            category: task.category as any,
            size: task.size,
            urgent: task.urgent,
            important: task.important,
            impact: task.impact,
            confidence: task.confidence,
            ease: task.ease,
            potential_revenue: task.potential_revenue,
          }, {
            onSuccess: () => resolve(),
            onError: () => reject(),
          });
        });
        setImportedCount(prev => prev + 1);
      } catch (error) {
        console.error('Failed to import task:', task.title);
      }
      
      setImportProgress(Math.round(((i + 1) / parsedTasks.length) * 100));
    }
    
    setIsImporting(false);
    onSuccess();
  };
  
  const getSizeIcon = (size: string) => 
    size === 'major' ? '🎯' : size === 'medium' ? '📋' : '⚡';
  
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Quick Import Tasks
        </DialogTitle>
        <DialogDescription>
          Gõ tự nhiên, AI sẽ tự hiểu và tạo tasks cho bạn
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* AI Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg border bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <div>
              <p className="font-medium">AI Smart Parse</p>
              <p className="text-xs text-muted-foreground">
                Gõ tự nhiên, AI tự hiểu category, size, ICE...
              </p>
            </div>
          </div>
          <Switch checked={useAI} onCheckedChange={setUseAI} />
        </div>
        
        {/* Input Area */}
        <div className="space-y-2">
          <Label htmlFor="import-text">
            {useAI ? '✍️ Gõ tự nhiên...' : '📝 Nhập theo format...'}
          </Label>
          <Textarea
            id="import-text"
            placeholder={useAI 
              ? `Ví dụ:
Apply 10 job trên Upwork
Sửa lỗi website cho khách, deadline ngày mai, $200
Dọn bàn bida, lau sàn quán
Học React Query 1 tiếng
Tập thể dục 30 phút

Cứ gõ thoải mái, AI sẽ tự hiểu!`
              : `Format: | Task | Category | Size | ICE | $ |
Ví dụ:
| Apply 10 job Upwork | Freelance | Major | 8/8/7 | $500 |`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="text-sm"
          />
        </div>
        
        {/* Parsing Status */}
        {isParsing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            AI đang phân tích...
          </div>
        )}
        
        {parseError && (
          <div className="flex items-center gap-2 text-sm text-yellow-600">
            <AlertTriangle className="h-4 w-4" />
            {parseError}
          </div>
        )}
        
        {/* Parsed Preview */}
        {parsedTasks.length > 0 && !isParsing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                {useAI ? 'AI đã parse' : 'Đã parse'} {parsedTasks.length} tasks
              </Label>
            </div>
            <ScrollArea className="h-[200px] border rounded-lg p-3">
              <div className="space-y-2">
                {parsedTasks.map((task, index) => {
                  const category = TASK_CATEGORIES.find(c => c.id === task.category);
                  const iceScore = calculateICE(task.impact, task.confidence, task.ease);
                  
                  return (
                    <div 
                      key={`task-${index}-${task.title.substring(0, 10)}`}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-muted-foreground font-mono text-sm">
                        #{index + 1}
                      </span>
                      <span>{category?.icon || '📌'}</span>
                      <span className="flex-1 font-medium truncate">{task.title}</span>
                      <Badge variant="outline" className="text-xs">
                        {getSizeIcon(task.size)} {task.size}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ICE: {iceScore}
                      </Badge>
                      {task.potential_revenue && (
                        <Badge variant="default" className="text-xs gap-1">
                          <DollarSign className="h-3 w-3" />
                          {task.potential_revenue}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Import Progress */}
        {isImporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Đang import...</span>
              <span>{importedCount}/{parsedTasks.length} tasks</span>
            </div>
            <Progress value={importProgress} />
          </div>
        )}
        
        {/* Tips */}
        {useAI && inputText.length === 0 && (
          <div className="p-3 rounded-lg bg-purple-500/10 text-sm">
            <p className="font-medium mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Tips
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Gõ mỗi task một dòng</li>
              <li>Có thể gộp: "dọn bàn, lau sàn, check đồ" → 3 tasks</li>
              <li>Nhắc tiền: "$500" hoặc "500k" → tự nhận potential revenue</li>
              <li>Nhắc deadline: "ngày mai", "gấp" → tự đánh urgent</li>
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onSuccess}>
          Hủy
        </Button>
        <Button 
          onClick={handleImport} 
          disabled={parsedTasks.length === 0 || isImporting || isParsing}
        >
          {isImporting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              Đang import...
            </>
          ) : (
            <>
              <ClipboardPaste className="h-4 w-4 mr-1" />
              Import {parsedTasks.length} Tasks
            </>
          )}
        </Button>
      </div>
    </>
  );
}
