'use client';

import { useEffect, useRef } from 'react';

/**
 * Adds the class `.is-revealed` to the element when it enters the viewport.
 * CSS handles the actual transition. One-shot — once revealed, stays revealed.
 */
export function useRevealOnScroll<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      el.classList.add('is-revealed');
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('is-revealed');
          io.unobserve(e.target);
        }
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}
