import React from 'react';
import { WorkspaceChat } from '@/components/WorkspaceChat';
import { Bot, Sparkles, Brain, FolderOpen } from 'lucide-react';

export default function WorkspaceChatPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 rounded-lg">
                <Bot className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Workspace AI Assistant
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                </h1>
                <p className="text-sm text-slate-400">
                  Chat với AI có context của toàn bộ workspace
                </p>
              </div>
            </div>

            {/* Features badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">
                <Brain className="w-3 h-3 text-purple-400" />
                AI Second Brain
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-full text-xs text-slate-300">
                <FolderOpen className="w-3 h-3 text-cyan-400" />
                Workspace Access
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="max-w-5xl mx-auto p-4">
        <div className="h-[calc(100vh-140px)]">
          <WorkspaceChat className="h-full" />
        </div>
      </div>
    </div>
  );
}
