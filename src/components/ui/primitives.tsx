import * as React from 'react';
import { cn } from '@/lib/utils';
import { T } from '@/lib/design-tokens';

/**
 * Shared UI primitives. Keep these in sync with the inlined copies in
 * Dashboard.tsx until the Dashboard migration is complete.
 */

export const Card = ({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) => (
  <div
    className={cn('rounded-2xl p-6', className)}
    style={{
      backgroundColor: T.card,
      border: `1px solid ${T.border}`,
      ...style,
    }}
  >
    {children}
  </div>
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'ghost' | 'outline';
};

export const Button = ({ variant = 'default', className, children, ...props }: ButtonProps) => {
  const base =
    'inline-flex items-center justify-center rounded-lg px-4 h-10 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06d6a0]/40';
  const variants = {
    default: 'bg-[#06d6a0] text-black hover:bg-[#06d6a0]/90',
    ghost: 'text-[#a1a1aa] hover:text-white hover:bg-white/[0.04]',
    outline:
      'border border-white/[0.08] text-white hover:border-[#06d6a0]/40 hover:bg-[#06d6a0]/[0.06]',
  };
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export const Badge = ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase',
      className,
    )}
    {...props}
  >
    {children}
  </span>
);
