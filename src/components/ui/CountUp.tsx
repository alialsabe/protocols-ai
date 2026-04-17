'use client';

import { useCountUp } from '@/hooks/useCountUp';

/**
 * <CountUp value={1144} /> renders a span that animates 0 → 1,144 when scrolled into view.
 * Formats with en-US thousands separators.
 */
const nf = new Intl.NumberFormat('en-US');

export function CountUp({
  value,
  duration = 800,
  className,
  style,
}: {
  value: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { ref, value: displayed } = useCountUp(value, duration);
  return (
    <span ref={ref as React.RefObject<HTMLSpanElement>} className={className} style={style}>
      {nf.format(displayed)}
    </span>
  );
}
