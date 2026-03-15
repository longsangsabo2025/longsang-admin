import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import TravisChat from '../travis/TravisChat';
import { AdminHeader } from './AdminHeader';
import { AdminSidebar } from './AdminSidebar';
import { FloatingQuickCapture } from './FloatingQuickCapture';
import { GlobalCommandPalette } from './GlobalCommandPalette';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('admin-sidebar-collapsed');
    return saved === 'true';
  });

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const [shortcutsHelpOpen, setShortcutsHelpOpen] = useState(false);
  useKeyboardShortcuts({ onShowHelp: () => setShortcutsHelpOpen(true) });

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const newState = !prev;
      localStorage.setItem('admin-sidebar-collapsed', String(newState));
      return newState;
    });
  };

  // Keyboard shortcut Ctrl+B để toggle sidebar
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        toggleSidebarCollapse();
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <AdminSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        expandedGroups={expandedGroups}
        onToggleCollapse={toggleSidebarCollapse}
        onClose={() => setSidebarOpen(false)}
        onToggleGroup={(label) => setExpandedGroups((prev) => ({ ...prev, [label]: !prev[label] }))}
      />

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 top-16 z-30 bg-background/80 backdrop-blur-sm lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content */}
      <main
        className={`pt-16 pb-8 transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}
      >
        <div className="container mx-auto p-6">
          <Outlet />
        </div>
      </main>

      <FloatingQuickCapture />
      <TravisChat />
      <GlobalCommandPalette />
      <KeyboardShortcutsHelp open={shortcutsHelpOpen} onOpenChange={setShortcutsHelpOpen} />
    </div>
  );
};
