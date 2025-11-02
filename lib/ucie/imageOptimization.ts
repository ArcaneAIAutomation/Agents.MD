// Image optimization utilities for UCIE mobile performance

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
}

/**
 * Generate optimized image URL with Next.js Image Optimization API
 */
export function getOptimizedImageUrl(
  src: string,
  options: ImageOptimizationOptions = {}
): string {
  const {
    width,
    height,
    quality = 75,
    format = 'webp',
  } = options;

  // If it's an external URL, use Next.js image optimization
  if (src.startsWith('http')) {
    const params = new URLSearchParams();
    params.append('url', src);
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());
    
    return `/_next/image?${params.toString()}`;
  }

  // For local images, return as-is (Next.js will optimize)
  return src;
}

/**
 * Generate responsive image srcset for different screen sizes
 */
export function generateResponsiveSrcSet(
  src: string,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920]
): string {
  return widths
    .map((width) => {
      const url = getOptimizedImageUrl(src, { width, quality: 75 });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Get appropriate image size based on device
 */
export function getResponsiveImageSize(screenWidth: number): number {
  if (screenWidth < 640) return 640;
  if (screenWidth < 768) return 768;
  if (screenWidth < 1024) return 1024;
  if (screenWidth < 1280) return 1280;
  return 1920;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string, options: ImageOptimizationOptions = {}) {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = getOptimizedImageUrl(src, options);
  
  if (options.format === 'webp') {
    link.type = 'image/webp';
  }

  document.head.appendChild(link);
}

/**
 * Convert image to WebP format (client-side)
 */
export async function convertToWebP(
  imageFile: File,
  quality: number = 0.8
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/webp',
          quality
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Compress image for mobile upload
 */
export async function compressImage(
  imageFile: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        
        // Calculate new dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          quality
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(imageFile);
  });
}

/**
 * Check if WebP is supported
 */
export function isWebPSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalImageFormat(): 'webp' | 'jpeg' {
  return isWebPSupported() ? 'webp' : 'jpeg';
}
