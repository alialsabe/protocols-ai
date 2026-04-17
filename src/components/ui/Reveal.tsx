'use client';

import { useRevealOnScroll } from '@/hooks/useRevealOnScroll';

/**
 * Wraps children in a div that fades+slides-up when scrolled into view.
 * Pass-through for className/style so it nests cleanly inside existing layouts.
 */
export function Reveal({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRevealOnScroll<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${className}`} style={style}>
      {children}
    </div>
  );
}
