/**
 * Skeleton Loader Components
 * Modern loading placeholders for better UX
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends Readonly<React.HTMLAttributes<HTMLDivElement>> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-muted/50", className)} {...props} />;
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  );
}

// Page Skeleton
export function PageSkeleton() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`stat-${i}`} className="rounded-lg border bg-card p-6">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={`card-${i}`} />
        ))}
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: Readonly<{ rows?: number }>) {
  return (
    <div className="rounded-md border">
      {/* Table Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={`row-${i}`} className="border-b p-4 last:border-0">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Hero Skeleton
export function HeroSkeleton() {
  return (
    <div className="min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-5/6" />
            <Skeleton className="h-6 w-3/4" />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>

          {/* Right Image */}
          <Skeleton className="h-96 lg:h-[500px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// Navigation Skeleton
export function NavSkeleton() {
  return (
    <div className="h-20 border-b">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Skeleton className="h-8 w-24" />
        <div className="hidden lg:flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={`nav-${i}`} className="h-4 w-20" />
          ))}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 5 }: Readonly<{ items?: number }>) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={`list-${i}`} className="flex items-center gap-4 p-4 rounded-lg border">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      ))}
    </div>
  );
}
