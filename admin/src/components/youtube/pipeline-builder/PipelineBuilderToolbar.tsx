/**
 * 🛠️ PipelineBuilderToolbar — Save / Load / Run / Template controls
 */
import { useEffect, useRef, useState } from 'react';
import { getPool, onPoolChange } from '@/services/pipeline/api-key-pool';
import type { PipelineTemplate } from '@/services/pipeline/pipeline-builder-types';
import { deleteTemplate, getAllTemplates } from '@/services/pipeline/pipeline-templates';

interface ToolbarProps {
  currentTemplate: PipelineTemplate | null;
  isRunning: boolean;
  nodeCount: number;
  edgeCount: number;
  onLoadTemplate: (template: PipelineTemplate) => void;
  onSave: () => void;
  onRun: () => void;
  onClear: () => void;
  onOpenAISettings: () => void;
}

export function PipelineBuilderToolbar({
  currentTemplate,
  isRunning,
  nodeCount,
  edgeCount,
  onLoadTemplate,
  onSave,
  onRun,
  onClear,
  onOpenAISettings,
}: ToolbarProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateVersion, setTemplateVersion] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Re-fetch templates when version changes (after delete)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const templates = getAllTemplates();
  void templateVersion; // used to trigger re-render

  // Track API key count for status indicator
  const [keyCount, setKeyCount] = useState(() => getPool().filter((e) => !e.disabled).length);
  useEffect(() => {
    return onPoolChange(() => setKeyCount(getPool().filter((e) => !e.disabled).length));
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showTemplates) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as HTMLElement)) {
        setShowTemplates(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showTemplates]);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur">
      {/* Left: Template info */}
      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            className="
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-muted hover:bg-muted/80 text-sm font-medium
              transition-colors
            "
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <span>{currentTemplate?.icon || '📋'}</span>
            <span>{currentTemplate?.name || 'Select Template'}</span>
            <svg
              className="w-3 h-3 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Template dropdown */}
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1 w-[320px] bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-2 border-b border-border">
                <div className="text-xs font-semibold text-muted-foreground px-2">
                  Pipeline Templates
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto p-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer group"
                    onClick={() => {
                      onLoadTemplate(tpl);
                      setShowTemplates(false);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onLoadTemplate(tpl);
                        setShowTemplates(false);
                      }
                    }}
                  >
                    <span className="text-lg mt-0.5">{tpl.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground flex items-center gap-1">
                        {tpl.name}
                        {tpl.isBuiltIn && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">
                            Built-in
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground">{tpl.description}</div>
                      <div className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {tpl.nodes.length} nodes · {tpl.edges.length} connections
                      </div>
                    </div>
                    {!tpl.isBuiltIn && (
                      <button
                        className="opacity-0 group-hover:opacity-100 text-xs text-red-500 hover:text-red-400 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTemplate(tpl.id);
                          setTemplateVersion((v) => v + 1);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span>{nodeCount} nodes</span>
          <span>·</span>
          <span>{edgeCount} edges</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors flex items-center gap-1.5"
          onClick={onOpenAISettings}
          title="AI Model Settings — Dán API key"
        >
          🔑 AI Keys
          {keyCount > 0 ? (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-500 font-medium">
              {keyCount}
            </span>
          ) : (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-yellow-500/15 text-yellow-600 font-medium">
              0
            </span>
          )}
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          onClick={onClear}
        >
          Clear
        </button>
        <button
          className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
          onClick={onSave}
          disabled={nodeCount === 0}
        >
          💾 Save
        </button>
        <button
          className={`
            px-4 py-1.5 text-xs rounded-lg font-semibold transition-all
            ${
              isRunning
                ? 'bg-orange-500 text-white animate-pulse cursor-wait'
                : nodeCount > 0
                  ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
            }
          `}
          onClick={onRun}
          disabled={isRunning || nodeCount === 0}
        >
          {isRunning ? '⏳ Running...' : '▶ Run Pipeline'}
        </button>
      </div>
    </div>
  );
}
