'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Count from 0 to `target` over `duration` ms, starting when the attached
 * element enters the viewport. Respects prefers-reduced-motion (snaps to target).
 * Returns a ref to attach to the display element and the current value.
 */
export function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(target);
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || triggered.current) continue;
        triggered.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          // ease-out cubic
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(target * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.4 });

    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value };
}
