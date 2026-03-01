/**
 * Gemini Chat Page
 * Full-page AI chat experience with Gemini Pro
 */

import { GeminiChat } from '@/components/ai/GeminiChat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowLeft, Zap, Brain, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GeminiChatPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6 text-blue-500" />
                  Gemini Chat
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Assistant
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Chat với Google Gemini - Hỗ trợ text, images, và multimodal
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat */}
          <div className="lg:col-span-3">
            <GeminiChat className="h-[calc(100vh-180px)]" />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Model Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  Models
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Gemini 2.0 Flash</p>
                  <p className="text-xs text-muted-foreground">Fast & efficient</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">$0.10/1M in</Badge>
                    <Badge variant="outline" className="text-xs">$0.40/1M out</Badge>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Gemini 2.5 Pro</p>
                  <p className="text-xs text-muted-foreground">Advanced reasoning</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">$1.25/1M in</Badge>
                    <Badge variant="outline" className="text-xs">$10/1M out</Badge>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="font-medium text-sm">Gemini 2.5 Flash</p>
                  <p className="text-xs text-muted-foreground">Balance speed & quality</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">$0.15/1M in</Badge>
                    <Badge variant="outline" className="text-xs">$0.60/1M out</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Tính năng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">✓</Badge>
                    Multimodal (text + images)
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">✓</Badge>
                    Conversation memory
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">✓</Badge>
                    Multiple model options
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">✓</Badge>
                    Token tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">✓</Badge>
                    Copy responses
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">💡 Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Upload images để phân tích với Gemini Vision</p>
                <p>• Shift+Enter để xuống dòng</p>
                <p>• Chọn model phù hợp với task</p>
                <p>• Flash cho speed, Pro cho quality</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
