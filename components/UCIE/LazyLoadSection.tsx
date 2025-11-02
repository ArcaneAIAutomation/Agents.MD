import React, { useEffect, useRef, useState } from 'react';
import MobileLoadingSkeleton from './MobileLoadingSkeleton';

interface LazyLoadSectionProps {
  children: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
  placeholder?: React.ReactNode;
  skeletonType?: 'card' | 'chart' | 'stat' | 'list';
}

export default function LazyLoadSection({
  children,
  threshold = 0.1,
  rootMargin = '100px',
  placeholder,
  skeletonType = 'card',
}: LazyLoadSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, hasLoaded]);

  return (
    <div ref={sectionRef} className="min-h-[100px]">
      {isVisible ? (
        children
      ) : (
        placeholder || <MobileLoadingSkeleton type={skeletonType} count={1} />
      )}
    </div>
  );
}

// Hook for lazy loading images
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded) {
            const img = new Image();
            img.src = src;
            img.onload = () => {
              setImageSrc(src);
              setIsLoaded(true);
            };
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    const currentRef = imgRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [src, isLoaded]);

  return { imageSrc, isLoaded, imgRef };
}
