/**
 * YouTube Harvester — Analysis Step (Step 2)
 *
 * Displays AI analysis results (summary, insights, mental models, etc.)
 * and the generated knowledge document. Provides navigation to review step.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

import type { AIAnalysis, FinalDocument } from './types';

export interface AnalysisStepProps {
  aiAnalysis: AIAnalysis | null;
  finalDocument: FinalDocument;
  setCurrentStep: (step: number) => void;
  proceedToReview: () => void;
}

export function AnalysisStep({
  aiAnalysis,
  finalDocument,
  setCurrentStep,
  proceedToReview,
}: AnalysisStepProps) {
  return (
    <div className="space-y-4">
      {aiAnalysis && (
        <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-orange-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                🧠 AI Deep Analysis
              </CardTitle>
              <Badge variant="outline" className="text-xs">GPT-4o</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-background/50 border">
              <span className="font-semibold text-primary">📋 Tóm tắt</span>
              <p className="text-muted-foreground mt-1 leading-relaxed">{aiAnalysis.summary}</p>
            </div>

            {/* Key Insights */}
            {aiAnalysis.keyInsights && aiAnalysis.keyInsights.length > 0 && (
              <div>
                <span className="font-semibold text-primary">💡 Key Insights</span>
                <ul className="mt-2 space-y-2">
                  {aiAnalysis.keyInsights.slice(0, 6).map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                      <span className="text-yellow-500 mt-0.5">▸</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mental Models */}
            {aiAnalysis.mentalModels && aiAnalysis.mentalModels.length > 0 && (
              <div>
                <span className="font-semibold text-primary">🧠 Mental Models</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiAnalysis.mentalModels.map((model, i) => (
                    <Badge key={i} variant="secondary" className="text-xs py-1">
                      {model}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items */}
            {aiAnalysis.actionItems && aiAnalysis.actionItems.length > 0 && (
              <div>
                <span className="font-semibold text-primary">✅ Action Items</span>
                <ul className="mt-2 space-y-1">
                  {aiAnalysis.actionItems.slice(0, 5).map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-muted-foreground text-xs">
                      <span className="text-green-500">☐</span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quotes */}
            {aiAnalysis.quotes && aiAnalysis.quotes.length > 0 && (
              <div className="border-l-2 border-yellow-500/50 pl-3">
                <span className="font-semibold text-primary">💬 Quotes Đáng Nhớ</span>
                {aiAnalysis.quotes.slice(0, 2).map((quote, i) => (
                  <p key={i} className="text-muted-foreground italic mt-2 text-xs">
                    "{quote}"
                  </p>
                ))}
              </div>
            )}

            {/* Critical Questions */}
            {aiAnalysis.criticalQuestions && aiAnalysis.criticalQuestions.length > 0 && (
              <div>
                <span className="font-semibold text-primary">❓ Câu Hỏi Suy Ngẫm</span>
                <ul className="mt-2 space-y-1">
                  {aiAnalysis.criticalQuestions.map((q, i) => (
                    <li key={i} className="text-muted-foreground text-xs flex items-start gap-2">
                      <span className="text-blue-500">?</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Main Topics & Tags */}
            <div className="flex flex-wrap gap-1 pt-2 border-t">
              {aiAnalysis.mainTopics?.map((topic, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Knowledge Document */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">📄 Knowledge Document</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted p-3 text-xs max-h-64 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans">{finalDocument.content.slice(0, 3000)}{finalDocument.content.length > 3000 ? '...' : ''}</pre>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(1)}>← Transcript</Button>
        <Button onClick={proceedToReview}>Review & Edit →</Button>
      </div>
    </div>
  );
}
