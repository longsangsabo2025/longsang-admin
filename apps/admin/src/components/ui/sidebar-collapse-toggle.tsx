import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

// ============================================
// SIDEBAR COLLAPSE TOGGLE - Multiple Variants
// ============================================

interface SidebarCollapseToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  variant?: 'default' | 'minimal' | 'pill' | 'floating' | 'edge' | 'icon-only';
  position?: 'top' | 'bottom' | 'middle';
  showTooltip?: boolean;
  className?: string;
}

/**
 * SidebarCollapseToggle - Nút mở rộng/thu gọn sidebar
 * 
 * Variants:
 * - default: Nút với icon và text
 * - minimal: Chỉ có icon nhỏ
 * - pill: Dạng viên thuốc với animation
 * - floating: Nổi bên cạnh sidebar
 * - edge: Dính vào cạnh sidebar
 * - icon-only: Icon xoay khi toggle
 */
export const SidebarCollapseToggle = React.forwardRef<
  HTMLButtonElement,
  SidebarCollapseToggleProps
>(
  (
    {
      isCollapsed,
      onToggle,
      variant = 'default',
      position = 'bottom',
      showTooltip = true,
      className,
    },
    ref
  ) => {
    const tooltipText = isCollapsed ? 'Mở rộng (Ctrl+B)' : 'Thu gọn (Ctrl+B)';

    // Variant: Default - Full button with icon and text
    if (variant === 'default') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5',
            'bg-gradient-to-r from-slate-800/50 to-slate-900/50',
            'border border-slate-700/50 hover:border-purple-500/50',
            'text-slate-400 hover:text-white',
            'transition-all duration-300 ease-out',
            'hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-slate-800/50',
            'hover:shadow-lg hover:shadow-purple-500/10',
            'active:scale-[0.98]',
            className
          )}
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'bg-slate-700/50 group-hover:bg-purple-600/30',
              'transition-all duration-300'
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 transition-transform duration-300" />
            ) : (
              <PanelLeftClose className="h-4 w-4 transition-transform duration-300" />
            )}
          </div>
          <span
            className={cn(
              'text-sm font-medium whitespace-nowrap',
              'transition-all duration-300',
              isCollapsed && 'opacity-0 w-0 overflow-hidden'
            )}
          >
            {isCollapsed ? 'Mở rộng' : 'Thu gọn'}
          </span>
          <ChevronLeft
            className={cn(
              'ml-auto h-4 w-4 transition-transform duration-300',
              isCollapsed ? 'rotate-180 opacity-0' : 'rotate-0'
            )}
          />
        </button>
      );
    }

    // Variant: Minimal - Small icon button
    if (variant === 'minimal') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'bg-slate-800/60 hover:bg-purple-600/40',
            'border border-slate-700/50 hover:border-purple-500/50',
            'text-slate-400 hover:text-white',
            'transition-all duration-200 ease-out',
            'hover:shadow-md hover:shadow-purple-500/20',
            'active:scale-95',
            className
          )}
        >
          <ChevronLeft
            className={cn(
              'h-5 w-5 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>
      );
    }

    // Variant: Pill - Animated pill shape
    if (variant === 'pill') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'group relative flex items-center gap-2 overflow-hidden',
            'rounded-full px-2 py-2',
            'bg-gradient-to-r from-purple-600/20 to-indigo-600/20',
            'border border-purple-500/30 hover:border-purple-400/60',
            'text-slate-300 hover:text-white',
            'transition-all duration-300 ease-out',
            'hover:from-purple-600/30 hover:to-indigo-600/30',
            'hover:shadow-lg hover:shadow-purple-500/20',
            isCollapsed ? 'w-10' : 'w-auto pr-4',
            className
          )}
        >
          {/* Animated background glow */}
          <div
            className={cn(
              'absolute inset-0 opacity-0 group-hover:opacity-100',
              'bg-gradient-to-r from-purple-500/10 via-transparent to-indigo-500/10',
              'transition-opacity duration-300'
            )}
          />
          
          <div className="relative flex h-6 w-6 items-center justify-center">
            <Menu
              className={cn(
                'h-4 w-4 transition-all duration-300',
                isCollapsed ? 'rotate-0 scale-100' : 'rotate-90 scale-0 absolute'
              )}
            />
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-all duration-300',
                isCollapsed ? 'rotate-90 scale-0 absolute' : 'rotate-0 scale-100'
              )}
            />
          </div>
          
          <span
            className={cn(
              'relative text-xs font-medium whitespace-nowrap',
              'transition-all duration-300',
              isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
            )}
          >
            Thu gọn
          </span>
        </button>
      );
    }

    // Variant: Floating - Floating button beside sidebar
    if (variant === 'floating') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'absolute -right-3 z-50',
            'flex h-6 w-6 items-center justify-center',
            'rounded-full',
            'bg-slate-800 hover:bg-purple-600',
            'border-2 border-slate-600 hover:border-purple-400',
            'text-slate-400 hover:text-white',
            'transition-all duration-200 ease-out',
            'hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30',
            'active:scale-100',
            position === 'top' && 'top-4',
            position === 'middle' && 'top-1/2 -translate-y-1/2',
            position === 'bottom' && 'bottom-4',
            className
          )}
        >
          <ChevronLeft
            className={cn(
              'h-3.5 w-3.5 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>
      );
    }

    // Variant: Edge - Attached to sidebar edge
    if (variant === 'edge') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'absolute -right-4 z-50',
            'flex h-8 w-4 items-center justify-center',
            'rounded-r-md',
            'bg-gradient-to-r from-slate-800 to-slate-700',
            'hover:from-purple-700 hover:to-purple-600',
            'border border-l-0 border-slate-600 hover:border-purple-400',
            'text-slate-400 hover:text-white',
            'transition-all duration-200 ease-out',
            'hover:w-5',
            'group',
            position === 'top' && 'top-4',
            position === 'middle' && 'top-1/2 -translate-y-1/2',
            position === 'bottom' && 'bottom-4',
            className
          )}
        >
          <ChevronLeft
            className={cn(
              'h-3 w-3 transition-transform duration-300',
              isCollapsed && 'rotate-180'
            )}
          />
          {/* Hover indicator line */}
          <div
            className={cn(
              'absolute inset-y-1 left-0 w-0.5 rounded-full',
              'bg-purple-500 opacity-0 group-hover:opacity-100',
              'transition-opacity duration-200'
            )}
          />
        </button>
      );
    }

    // Variant: Icon-only - Rotating icon
    if (variant === 'icon-only') {
      return (
        <button
          ref={ref}
          onClick={onToggle}
          title={showTooltip ? tooltipText : undefined}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-slate-800 to-slate-900',
            'hover:from-purple-700/50 hover:to-indigo-800/50',
            'border border-slate-700/50 hover:border-purple-500/50',
            'text-slate-400 hover:text-white',
            'transition-all duration-300 ease-out',
            'hover:shadow-xl hover:shadow-purple-500/20',
            'active:scale-95',
            'group',
            className
          )}
        >
          <div className="relative h-5 w-5">
            <ChevronRight
              className={cn(
                'absolute inset-0 h-5 w-5 transition-all duration-500',
                'group-hover:text-purple-300',
                isCollapsed
                  ? 'rotate-0 opacity-100'
                  : 'rotate-180 opacity-100'
              )}
            />
          </div>
        </button>
      );
    }

    return null;
  }
);
SidebarCollapseToggle.displayName = 'SidebarCollapseToggle';

// ============================================
// ANIMATED HAMBURGER TOGGLE
// ============================================

interface HamburgerToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const HamburgerToggle = React.forwardRef<HTMLButtonElement, HamburgerToggleProps>(
  ({ isOpen, onToggle, size = 'md', className }, ref) => {
    const sizeClasses = {
      sm: { button: 'h-8 w-8', bar: 'h-0.5 w-4' },
      md: { button: 'h-10 w-10', bar: 'h-0.5 w-5' },
      lg: { button: 'h-12 w-12', bar: 'h-1 w-6' },
    };

    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={cn(
          'relative flex items-center justify-center rounded-lg',
          'bg-slate-800/60 hover:bg-purple-600/40',
          'border border-slate-700/50 hover:border-purple-500/50',
          'transition-all duration-200',
          'hover:shadow-lg hover:shadow-purple-500/20',
          'active:scale-95',
          sizeClasses[size].button,
          className
        )}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <div className="relative flex flex-col items-center justify-center gap-1">
          {/* Top bar */}
          <span
            className={cn(
              'rounded-full bg-current transition-all duration-300',
              sizeClasses[size].bar,
              isOpen && 'translate-y-1.5 rotate-45'
            )}
          />
          {/* Middle bar */}
          <span
            className={cn(
              'rounded-full bg-current transition-all duration-300',
              sizeClasses[size].bar,
              isOpen && 'scale-0 opacity-0'
            )}
          />
          {/* Bottom bar */}
          <span
            className={cn(
              'rounded-full bg-current transition-all duration-300',
              sizeClasses[size].bar,
              isOpen && '-translate-y-1.5 -rotate-45'
            )}
          />
        </div>
      </button>
    );
  }
);
HamburgerToggle.displayName = 'HamburgerToggle';

// ============================================
// SIDEBAR COLLAPSE BUTTON WITH ICON ANIMATION
// ============================================

interface AnimatedCollapseButtonProps {
  isCollapsed: boolean;
  onToggle: () => void;
  label?: string;
  className?: string;
}

export const AnimatedCollapseButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedCollapseButtonProps
>(({ isCollapsed, onToggle, label, className }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onToggle}
      className={cn(
        'group relative flex items-center gap-3 w-full',
        'rounded-xl px-3 py-3',
        'bg-gradient-to-r from-slate-800/80 via-slate-800/60 to-slate-900/80',
        'hover:from-purple-900/40 hover:via-purple-800/30 hover:to-indigo-900/40',
        'border border-slate-700/50 hover:border-purple-500/40',
        'text-slate-400 hover:text-white',
        'transition-all duration-300 ease-out',
        'hover:shadow-xl hover:shadow-purple-500/10',
        'overflow-hidden',
        className
      )}
      title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
    >
      {/* Animated background effect */}
      <div
        className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100',
          'bg-gradient-to-r from-purple-600/5 via-transparent to-indigo-600/5',
          'transition-opacity duration-500'
        )}
      />
      
      {/* Glow effect on hover */}
      <div
        className={cn(
          'absolute -inset-1 opacity-0 group-hover:opacity-100 blur-xl',
          'bg-gradient-to-r from-purple-600/20 to-indigo-600/20',
          'transition-opacity duration-500 -z-10'
        )}
      />

      {/* Icon container with rotation */}
      <div
        className={cn(
          'relative flex h-9 w-9 items-center justify-center',
          'rounded-lg bg-slate-700/50 group-hover:bg-purple-600/30',
          'border border-slate-600/50 group-hover:border-purple-500/50',
          'transition-all duration-300',
          'shrink-0'
        )}
      >
        <svg
          className={cn(
            'h-5 w-5 transition-transform duration-500 ease-out',
            isCollapsed ? 'rotate-180' : 'rotate-0'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
          />
        </svg>
      </div>

      {/* Label with slide animation */}
      <div
        className={cn(
          'flex flex-col items-start overflow-hidden',
          'transition-all duration-300 ease-out',
          isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
      >
        <span className="text-sm font-medium whitespace-nowrap">
          {label || (isCollapsed ? 'Mở rộng' : 'Thu gọn')}
        </span>
        <span className="text-[10px] text-slate-500 group-hover:text-purple-400 whitespace-nowrap transition-colors">
          Ctrl + B
        </span>
      </div>

      {/* Arrow indicator */}
      <ChevronLeft
        className={cn(
          'ml-auto h-4 w-4 shrink-0',
          'transition-all duration-300',
          isCollapsed ? 'rotate-180 opacity-0 w-0' : 'rotate-0 opacity-60'
        )}
      />
    </button>
  );
});
AnimatedCollapseButton.displayName = 'AnimatedCollapseButton';

// ============================================
// COMPACT TOGGLE FOR COLLAPSED STATE
// ============================================

interface CompactToggleProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export const CompactToggle = React.forwardRef<HTMLButtonElement, CompactToggleProps>(
  ({ isCollapsed, onToggle, className }, ref) => {
    return (
      <button
        ref={ref}
        onClick={onToggle}
        className={cn(
          'group flex items-center justify-center',
          'h-10 w-full rounded-lg',
          'bg-gradient-to-r from-slate-800/60 to-slate-700/60',
          'hover:from-purple-700/40 hover:to-indigo-700/40',
          'border border-slate-600/50 hover:border-purple-500/50',
          'text-slate-400 hover:text-white',
          'transition-all duration-300',
          'hover:shadow-lg hover:shadow-purple-500/20',
          className
        )}
        title={isCollapsed ? 'Mở rộng (Ctrl+B)' : 'Thu gọn (Ctrl+B)'}
      >
        <div className="relative">
          {/* Double chevron icon */}
          <svg
            className={cn(
              'h-5 w-5 transition-transform duration-500',
              isCollapsed ? 'rotate-0' : 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
          
          {/* Pulse ring on hover */}
          <div
            className={cn(
              'absolute inset-0 rounded-full',
              'bg-purple-500/30 scale-0 group-hover:scale-150',
              'transition-transform duration-500 opacity-0 group-hover:opacity-100'
            )}
          />
        </div>
      </button>
    );
  }
);
CompactToggle.displayName = 'CompactToggle';

export default SidebarCollapseToggle;
