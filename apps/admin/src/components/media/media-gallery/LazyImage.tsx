import { useState, useEffect, useRef } from 'react';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LazyImageProps } from './types';

export const LazyImage = ({ src, alt = '', className, fallbackIcon, onError }: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Start loading 100px before visible
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden bg-muted/50', className)}>
      {/* Loading skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/80 to-muted animate-pulse">
          <Loader2 className="h-5 w-5 text-muted-foreground/50 animate-spin" />
        </div>
      )}
      
      {/* Error state with fallback icon */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          {fallbackIcon || <ImageIcon className="h-6 w-6 text-muted-foreground/40" />}
        </div>
      )}
      
      {/* Actual image - only load when in view */}
      {inView && !error && (
        <img
          src={src}
          alt={alt}
          className={cn('h-full w-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};
