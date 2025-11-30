import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular';
  animate?: boolean;
}

function Skeleton({ 
  className, 
  variant = 'rectangular',
  animate = true,
  ...props 
}: SkeletonProps) {
  const baseClasses = "bg-gradient-to-r from-gray-700/50 via-gray-600/50 to-gray-700/50";
  
  const variantClasses = {
    text: "h-4 rounded",
    rectangular: "rounded-lg",
    circular: "rounded-full"
  };

  const Component = animate ? motion.div : 'div';
  const motionProps = animate ? {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 }
  } : {};

  return (
    <Component
      className={cn(
        baseClasses,
        "animate-pulse",
        variantClasses[variant],
        className
      )}
      {...motionProps}
      {...props}
    />
  );
}

// Project Card Skeleton
export const ProjectCardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 bg-dark-surface/50 backdrop-blur-sm border border-primary/10 rounded-xl"
  >
    <div className="flex items-center gap-4 mb-4">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
    <Skeleton className="h-16 w-full mb-4" />
    <div className="flex gap-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-6 w-16 rounded-full" />
      ))}
    </div>
  </motion.div>
);

// Stats Skeleton
export const StatsSkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: i * 0.1 }}
        className="bg-dark-surface/30 backdrop-blur-sm rounded-xl p-6 border border-primary/10"
      >
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-4 w-20" />
      </motion.div>
    ))}
  </div>
);

// Form Skeleton
export const FormSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.1 }}
      >
        <Skeleton className="h-10 w-full mb-2" />
      </motion.div>
    ))}
    <Skeleton className="h-32 w-full" />
    <div className="flex gap-4">
      <Skeleton className="h-12 w-32" />
      <Skeleton className="h-12 w-24" />
    </div>
  </div>
);

export { Skeleton };
