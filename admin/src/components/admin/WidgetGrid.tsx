/**
 * 🧩 Widget Grid System — Configurable layout for Mission Control
 * Provides collapse/expand and show/hide for each section, renders in layout order.
 */

import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, EyeOff, GripVertical } from 'lucide-react';
import { type ReactElement, type ReactNode, useCallback, useMemo, useState } from 'react';
import {
  COLLAPSED_PREFIX,
  readStorage,
  type WidgetConfig,
  writeStorage,
} from '@/hooks/useWidgetLayout';
import { cn } from '@/lib/utils';

// ─── Hook: useCollapsed ───────────────────────────────────────────────

function useCollapsed(id: string) {
  const [collapsed, setCollapsed] = useState(() => readStorage(`${COLLAPSED_PREFIX}${id}`, false));

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      writeStorage(`${COLLAPSED_PREFIX}${id}`, next);
      return next;
    });
  }, [id]);

  return { collapsed, toggle };
}

// ─── WidgetSection ────────────────────────────────────────────────────

export interface WidgetSectionProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onToggleVisibility?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function WidgetSection({
  id,
  title,
  icon,
  children,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  isFirst,
  isLast,
}: WidgetSectionProps) {
  const { collapsed, toggle } = useCollapsed(id);

  return (
    <section data-widget-id={id} className="group/widget relative rounded-lg transition-colors">
      {/* ── Toolbar: appears on hover ── */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 mb-1 rounded-md',
          'opacity-0 group-hover/widget:opacity-100 transition-opacity duration-150',
          'bg-muted/50'
        )}
      >
        {/* Grip icon */}
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />

        {/* Up / Down arrows */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className={cn(
            'p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed',
            'text-muted-foreground hover:text-foreground transition-colors'
          )}
          title="Di chuyển lên"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className={cn(
            'p-0.5 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed',
            'text-muted-foreground hover:text-foreground transition-colors'
          )}
          title="Di chuyển xuống"
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </button>

        {/* Section label */}
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 ml-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
          <span className="flex items-center gap-1.5">
            {icon}
            {title}
          </span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={onToggleVisibility}
          className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Ẩn mục này"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* ── Content ── */}
      {!collapsed && <div className="animate-in fade-in-0 duration-200">{children}</div>}
    </section>
  );
}

// ─── WidgetGrid ───────────────────────────────────────────────────────

export interface WidgetGridProps {
  layout: WidgetConfig[];
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  children: ReactElement<WidgetSectionProps>[];
}

export function WidgetGrid({
  layout,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  children,
}: WidgetGridProps) {
  // Build a map of id → child element
  const childMap = useMemo(() => {
    const map = new Map<string, ReactElement<WidgetSectionProps>>();
    for (const child of children) {
      if (child?.props?.id) {
        map.set(child.props.id, child);
      }
    }
    return map;
  }, [children]);

  // Sorted, visible-only layout
  const visibleLayout = useMemo(
    () => [...layout].filter((w) => w.visible).sort((a, b) => a.order - b.order),
    [layout]
  );

  return (
    <div className="space-y-6">
      {visibleLayout.map((config, index) => {
        const child = childMap.get(config.id);
        if (!child) return null;

        // Clone child with toolbar callbacks
        const isFirst = index === 0;
        const isLast = index === visibleLayout.length - 1;

        return (
          <WidgetSection
            key={config.id}
            id={child.props.id}
            title={child.props.title}
            icon={child.props.icon}
            onMoveUp={() => onMoveUp(config.id)}
            onMoveDown={() => onMoveDown(config.id)}
            onToggleVisibility={() => onToggleVisibility(config.id)}
            isFirst={isFirst}
            isLast={isLast}
          >
            {child.props.children}
          </WidgetSection>
        );
      })}
    </div>
  );
}
