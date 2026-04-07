'use client';

import { useEffect, useRef } from 'react';

interface UseIntersectionObserverOptions {
  enabled: boolean;
  rootMargin?: string;
  onIntersect: () => void;
}

export function useIntersectionObserver({
  enabled,
  rootMargin = '0px',
  onIntersect,
}: UseIntersectionObserverOptions) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onIntersect();
        }
      },
      { rootMargin }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, onIntersect]);

  return targetRef;
}
