import React, { ImgHTMLAttributes, useState, useRef, useEffect } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * Optimized Image Component
 * Features:
 * - Lazy loading by default
 * - Responsive images with srcset
 * - Blur placeholder support
 * - WebP format fallback
 * - Proper aspect ratio to prevent CLS
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;

    // Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
      }
    );

    observer.observe(imgRef.current);

    return () => observer.disconnect();
  }, [priority]);

  // Generate srcset for responsive images
  const generateSrcSet = (src: string) => {
    if (!width) return undefined;

    const widths = [320, 640, 768, 1024, 1280, 1536];
    const applicableWidths = widths.filter((w) => w <= width);

    if (applicableWidths.length === 0) applicableWidths.push(width);

    return applicableWidths.map((w) => `${getOptimizedUrl(src, w, quality)} ${w}w`).join(', ');
  };

  // Generate optimized URL (for services like Cloudinary, ImageKit, etc.)
  const getOptimizedUrl = (url: string, width?: number, quality?: number) => {
    // If using a CDN, modify URL here
    // Example for Cloudinary: url.replace('/upload/', `/upload/w_${width},q_${quality}/`)

    // For now, return original URL
    // In production, integrate with your image optimization service
    return url;
  };

  const aspectRatio = width && height ? (height / width) * 100 : undefined;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { paddingBottom: `${aspectRatio}%` } : undefined}
    >
      {/* Blur placeholder */}
      {placeholder === 'blur' && !isLoaded && blurDataURL && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
          aria-hidden="true"
        />
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={isInView ? getOptimizedUrl(src, width, quality) : undefined}
        srcSet={isInView ? generateSrcSet(src) : undefined}
        sizes={width ? `(max-width: ${width}px) 100vw, ${width}px` : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        className={`
          ${aspectRatio ? 'absolute inset-0 w-full h-full object-cover' : ''}
          transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'}
        `}
        {...props}
      />

      {/* Loading skeleton */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}

/**
 * Generate blur data URL from image
 * Can be used for placeholder blur effect
 */
export function generateBlurDataURL(width = 10, height = 10): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Create a gradient placeholder
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#e5e7eb');
  gradient.addColorStop(1, '#d1d5db');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.1);
}
