/**
 * AI Learning Assistant Component
 * In-lesson chatbot powered by OpenAI GPT-4
 * Helps students with questions, debugging, and understanding concepts
 */

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User,
  X,
  Minimize2,
  Maximize2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface AIAssistantProps {
  lessonId: string;
  lessonTitle: string;
  lessonContext?: string; // Current lesson content for context
  isOpen?: boolean;
  onToggle?: () => void;
}

export function AIAssistant({ 
  lessonId, 
  lessonTitle, 
  lessonContext = '',
  isOpen: controlledIsOpen,
  onToggle
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi! I'm your AI Learning Assistant for **${lessonTitle}**. 

I can help you with:
- 🎯 Understanding concepts
- 🐛 Debugging code
- 💡 Explaining steps
- 🚀 Best practices

Ask me anything!`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledIsOpen ?? internalIsOpen;

  useEffect(() => {
    // Auto-scroll to bottom when new message arrives
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call AI Assistant API
      const response = await fetch('http://localhost:3001/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          lessonTitle,
          lessonContext,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          userMessage: input
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I\'m having trouble connecting. Please try again in a moment.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleClose = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={onToggle || (() => setInternalIsOpen(true))}
          size="lg"
          className="h-16 w-16 rounded-full bg-gradient-to-r from-gaming-purple to-gaming-cyan shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Sparkles className="w-6 h-6" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          height: isMinimized ? '60px' : '600px'
        }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        className="fixed bottom-6 right-6 z-50 w-96"
      >
        <Card className="glass-card border-gaming-purple/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gaming-purple to-gaming-cyan p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="w-6 h-6 text-white" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"
                />
              </div>
              <div>
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <p className="text-white/70 text-xs">Always here to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea ref={scrollRef} className="h-[440px] p-4 bg-background/50">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className={message.role === 'user' ? 'bg-gaming-cyan' : 'bg-gaming-purple'}>
                          {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-gaming-cyan/20 text-white'
                              : 'bg-gaming-purple/10 text-foreground'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-8 h-8 mt-1">
                        <AvatarFallback className="bg-gaming-purple">
                          <Bot className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="inline-block p-3 rounded-lg bg-gaming-purple/10">
                          <div className="flex gap-1">
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                              className="w-2 h-2 bg-gaming-purple rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                              className="w-2 h-2 bg-gaming-purple rounded-full"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.5, 1] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                              className="w-2 h-2 bg-gaming-purple rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-gaming-purple/20 bg-background/80 backdrop-blur">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 bg-background/50 border-gaming-purple/20 focus:border-gaming-cyan"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-gaming-purple to-gaming-cyan hover:opacity-90"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Press Enter to send • Powered by GPT-4
                </p>
              </div>
            </>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
