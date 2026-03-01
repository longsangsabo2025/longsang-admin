/**
 * Gemini 3 Pro Chat Component
 * AI-powered chat using Google's latest Gemini 3 Pro model
 * Supports text, images, and multimodal conversations
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Send, 
  Loader2, 
  Sparkles, 
  User, 
  Bot, 
  ImagePlus, 
  X, 
  Copy, 
  Check,
  Trash2,
  Settings,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Gemini API Configuration
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyBfLqZs_2OeJ8ZptYcaeTlB1HqMegtKSmA';

const MODELS = {
  'gemini-2.0-flash': { 
    name: 'Gemini 2.0 Flash', 
    desc: 'Fast & efficient',
    inputPrice: '$0.10/1M',
    outputPrice: '$0.40/1M'
  },
  'gemini-2.5-pro-preview-06-05': { 
    name: 'Gemini 2.5 Pro', 
    desc: 'Advanced reasoning',
    inputPrice: '$1.25/1M',
    outputPrice: '$10/1M'
  },
  'gemini-2.5-flash-preview-05-20': { 
    name: 'Gemini 2.5 Flash', 
    desc: 'Balance speed & quality',
    inputPrice: '$0.15/1M',
    outputPrice: '$0.60/1M'
  },
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  images?: string[];
  timestamp: Date;
  model?: string;
  tokensUsed?: number;
}

interface Props {
  className?: string;
  initialPrompt?: string;
  onResponse?: (response: string) => void;
}

export function GeminiChat({ className, initialPrompt, onResponse }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gemini-2.0-flash');
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to Gemini
  const sendMessage = useCallback(async () => {
    if (!input.trim() && attachedImages.length === 0) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      images: attachedImages.length > 0 ? [...attachedImages] : undefined,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setAttachedImages([]);
    setIsLoading(true);

    try {
      // Build request
      const contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [
          ...(msg.images?.map(img => ({
            inline_data: {
              mime_type: 'image/jpeg',
              data: img.split(',')[1],
            }
          })) || []),
          { text: msg.content }
        ],
      }));

      // Add current message
      contents.push({
        role: 'user',
        parts: [
          ...(userMessage.images?.map(img => ({
            inline_data: {
              mime_type: 'image/jpeg',
              data: img.split(',')[1],
            }
          })) || []),
          { text: userMessage.content }
        ],
      });

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'API Error');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;

      const assistantMessage: Message = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: text,
        timestamp: new Date(),
        model,
        tokensUsed,
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (onResponse) {
        onResponse(text);
      }

      toast.success(`Response generated (${tokensUsed} tokens)`);

    } catch (error) {
      console.error('Gemini API Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Error: ${errorMessage}`);
      
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: `❌ Error: ${errorMessage}`,
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, attachedImages, messages, model, onResponse]);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Copy message
  const copyMessage = useCallback((id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Copied to clipboard');
  }, []);

  // Clear chat
  const clearChat = useCallback(() => {
    setMessages([]);
    toast.success('Chat cleared');
  }, []);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Gemini Chat
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                <Zap className="h-3 w-3 mr-1" />
                AI
              </Badge>
            </CardTitle>
            <CardDescription>
              Chat với Google Gemini - Hỗ trợ text & images
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODELS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col">
                      <span>{value.name}</span>
                      <span className="text-xs text-muted-foreground">{value.desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <Bot className="h-12 w-12 mb-3 opacity-30" />
            <p>Bắt đầu chat với Gemini</p>
            <p className="text-xs mt-1">Hỗ trợ text và hình ảnh</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'flex-row-reverse' : ''
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={cn(
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                  )}>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>

                <div className={cn(
                  "flex flex-col max-w-[80%]",
                  message.role === 'user' ? 'items-end' : 'items-start'
                )}>
                  {/* Images */}
                  {message.images && message.images.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {message.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Attached ${i + 1}`}
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className={cn(
                    "rounded-lg px-4 py-2 text-sm",
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-muted'
                  )}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.tokensUsed && (
                      <Badge variant="outline" className="text-xs">
                        {message.tokensUsed} tokens
                      </Badge>
                    )}
                    {message.role === 'assistant' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyMessage(message.id, message.content)}
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        {/* Attached Images Preview */}
        {attachedImages.length > 0 && (
          <div className="flex gap-2 mb-2 flex-wrap">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative">
                <img src={img} alt={`Attach ${i + 1}`} className="h-16 w-16 object-cover rounded" />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5"
                  onClick={() => setAttachedImages(prev => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageUpload}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <ImagePlus className="h-4 w-4" />
          </Button>

          <Textarea
            placeholder="Nhập tin nhắn... (Shift+Enter để xuống dòng)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />

          <Button
            onClick={sendMessage}
            disabled={isLoading || (!input.trim() && attachedImages.length === 0)}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          Model: {MODELS[model as keyof typeof MODELS]?.name} • 
          Input: {MODELS[model as keyof typeof MODELS]?.inputPrice}
        </p>
      </div>
    </Card>
  );
}

export default GeminiChat;
