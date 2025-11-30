/**
 * AI Command Center Page
 * Unified interface for solo founders to manage all AI agents
 * "One screen to rule them all"
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  Sun,
  Bot,
  AlertTriangle,
  Brain,
  Settings,
  Zap,
  Bell,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

import { MorningBriefing } from '@/components/command-center/MorningBriefing';
import { AgentOrchestrator } from '@/components/command-center/AgentOrchestrator';
import { DecisionQueue } from '@/components/command-center/DecisionQueue';
import { AgentMemory } from '@/components/command-center/AgentMemory';
import { AIChatPanel } from '@/components/command-center/AIChatPanel';

// Mock pending counts - will be replaced with real data
const pendingCounts = {
  decisions: 5,
  notifications: 12,
};

// Available agents for chat
const CHAT_AGENTS = [
  { id: 'dev', label: 'Dev' },
  { id: 'content', label: 'Content' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'advisor', label: 'Advisor' },
];

export default function AICommandCenter() {
  const [activeTab, setActiveTab] = useState('briefing');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedChatAgent, setSelectedChatAgent] = useState('advisor');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh all data from APIs
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  // Get current time of day for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <Command className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AI Command Center</h1>
                <p className="text-xs text-muted-foreground">{getGreeting()}, Founder! 👋</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {pendingCounts.notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCounts.notifications}
                </Badge>
              )}
            </Button>

            {/* Refresh */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Quick Action */}
            <Button size="sm">
              <Zap className="h-4 w-4 mr-2" />
              Quick Task
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="briefing" className="gap-2">
              <Sun className="h-4 w-4" />
              <span className="hidden sm:inline">Briefing</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Agents</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="gap-2 relative">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Decisions</span>
              {pendingCounts.decisions > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 p-0 flex items-center justify-center text-xs">
                  {pendingCounts.decisions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="memory" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Memory</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="briefing" className="space-y-4">
            <MorningBriefing />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            {/* Agent Selector */}
            <div className="flex gap-2 mb-4">
              {CHAT_AGENTS.map(agent => (
                <Button
                  key={agent.id}
                  variant={selectedChatAgent === agent.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChatAgent(agent.i