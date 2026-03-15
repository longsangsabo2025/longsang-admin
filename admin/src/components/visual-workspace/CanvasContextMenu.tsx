/**
 * Canvas Context Menu - Right-click menu for Visual Workspace
 */

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Clipboard,
  Copy,
  Grid,
  Layers,
  Lock,
  Plus,
  Redo,
  Scissors,
  Trash2,
  Undo,
  Unlock,
} from 'lucide-react';
import React from 'react';
import { Node } from 'reactflow';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface CanvasContextMenuProps {
  children: React.ReactNode;
  selectedNodes: Node[];
  hasClipboard: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onAlignLeft: () => void;
  onAlignCenter: () => void;
  onAlignRight: () => void;
  onToggleLock: () => void;
  onAddNode: (type: string) => void;
}

export function CanvasContextMenu({
  children,
  selectedNodes,
  hasClipboard,
  canUndo,
  canRedo,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onSelectAll,
  onBringToFront,
  onSendToBack,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onToggleLock,
  onAddNode,
}: CanvasContextMenuProps) {
  const hasSelection = selectedNodes.length > 0;
  const hasMultipleSelection = selectedNodes.length > 1;
  const isLocked = selectedNodes.some((n) => n.data?.locked);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56 bg-[#1a1a1a] border-[#2a2a2a]">
        {/* Edit Actions */}
        <ContextMenuItem
          disabled={!canUndo}
          onClick={onUndo}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Undo className="mr-2 h-4 w-4" />
          Undo
          <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!canRedo}
          onClick={onRedo}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Redo className="mr-2 h-4 w-4" />
          Redo
          <ContextMenuShortcut>⌘⇧Z</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-[#2a2a2a]" />

        {/* Selection Actions */}
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onCopy}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onCut}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Scissors className="mr-2 h-4 w-4" />
          Cut
          <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasClipboard}
          onClick={onPaste}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Clipboard className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onDuplicate}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Layers className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-[#2a2a2a]" />

        {/* Add Node Submenu */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Component
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="bg-[#1a1a1a] border-[#2a2a2a]">
            <ContextMenuItem
              onClick={() => onAddNode('uiComponent')}
              className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
            >
              🎨 UI Component
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddNode('apiService')}
              className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
            >
              🔌 API Service
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddNode('database')}
              className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
            >
              🗄️ Database
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => onAddNode('dataFlow')}
              className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
            >
              📊 Data Flow
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="bg-[#2a2a2a]" />

        {/* Alignment Submenu - only show when multiple nodes selected */}
        {hasMultipleSelection && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white">
                <Grid className="mr-2 h-4 w-4" />
                Align
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <ContextMenuItem
                  onClick={onAlignLeft}
                  className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
                >
                  <AlignLeft className="mr-2 h-4 w-4" />
                  Align Left
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={onAlignCenter}
                  className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
                >
                  <AlignCenter className="mr-2 h-4 w-4" />
                  Align Center
                </ContextMenuItem>
                <ContextMenuItem
                  onClick={onAlignRight}
                  className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
                >
                  <AlignRight className="mr-2 h-4 w-4" />
                  Align Right
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator className="bg-[#2a2a2a]" />
          </>
        )}

        {/* Layer Actions */}
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onBringToFront}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <ArrowUp className="mr-2 h-4 w-4" />
          Bring to Front
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onSendToBack}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <ArrowDown className="mr-2 h-4 w-4" />
          Send to Back
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-[#2a2a2a]" />

        {/* Lock/Unlock */}
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onToggleLock}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          {isLocked ? (
            <>
              <Unlock className="mr-2 h-4 w-4" />
              Unlock
            </>
          ) : (
            <>
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </>
          )}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onSelectAll}
          className="text-gray-300 focus:bg-[#2a2a2a] focus:text-white"
        >
          <Layers className="mr-2 h-4 w-4" />
          Select All
          <ContextMenuShortcut>⌘A</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator className="bg-[#2a2a2a]" />

        {/* Delete */}
        <ContextMenuItem
          disabled={!hasSelection}
          onClick={onDelete}
          className="text-red-400 focus:bg-red-500/10 focus:text-red-300"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
