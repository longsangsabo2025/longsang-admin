/**
 * Canvas Keyboard Shortcuts Hook - Keyboard commands for Visual Workspace
 */

import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSelectAll: () => void;
  onEscape: () => void;
  onSave?: () => void;
  enabled?: boolean;
}

export function useCanvasKeyboard({
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onSelectAll,
  onEscape,
  onSave,
  enabled = true,
}: KeyboardShortcutsConfig) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputField) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? event.metaKey : event.ctrlKey;

      // Escape - Deselect all
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }

      // Delete/Backspace - Delete selected
      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        onDelete();
        return;
      }

      // Cmd/Ctrl + Key combinations
      if (cmdKey) {
        switch (event.key.toLowerCase()) {
          case 'c':
            event.preventDefault();
            onCopy();
            break;
          case 'x':
            event.preventDefault();
            onCut();
            break;
          case 'v':
            event.preventDefault();
            onPaste();
            break;
          case 'd':
            event.preventDefault();
            onDuplicate();
            break;
          case 'a':
            event.preventDefault();
            onSelectAll();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              onRedo();
            } else {
              onUndo();
            }
            break;
          case 'y':
            event.preventDefault();
            onRedo();
            break;
          case 's':
            if (onSave) {
              event.preventDefault();
              onSave();
            }
            break;
        }
      }
    },
    [
      enabled,
      onCopy,
      onCut,
      onPaste,
      onDelete,
      onDuplicate,
      onUndo,
      onRedo,
      onSelectAll,
      onEscape,
      onSave,
    ]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Keyboard shortcut display helper
export const KEYBOARD_SHORTCUTS = [
  { key: 'Ctrl/⌘ + C', action: 'Copy', category: 'Edit' },
  { key: 'Ctrl/⌘ + X', action: 'Cut', category: 'Edit' },
  { key: 'Ctrl/⌘ + V', action: 'Paste', category: 'Edit' },
  { key: 'Ctrl/⌘ + D', action: 'Duplicate', category: 'Edit' },
  { key: 'Ctrl/⌘ + Z', action: 'Undo', category: 'Edit' },
  { key: 'Ctrl/⌘ + Shift + Z', action: 'Redo', category: 'Edit' },
  { key: 'Ctrl/⌘ + Y', action: 'Redo', category: 'Edit' },
  { key: 'Delete / Backspace', action: 'Delete selected', category: 'Edit' },
  { key: 'Ctrl/⌘ + A', action: 'Select All', category: 'Selection' },
  { key: 'Escape', action: 'Deselect All', category: 'Selection' },
  { key: 'Shift + Click', action: 'Multi-select', category: 'Selection' },
  { key: 'Shift + Drag', action: 'Box Select', category: 'Selection' },
  { key: 'Ctrl/⌘ + S', action: 'Save', category: 'File' },
];
