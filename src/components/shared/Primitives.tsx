"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { T } from '@/lib/design-tokens';

export function Card({
  className,
  style,
  children,
  hover = true,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div className={cn('relative', hover && 'group')}>
      {hover && (
        <div className="absolute -inset-px bg-gradient-to-r from-[#06d6a0]/15 via-[#0ea5e9]/10 to-[#06d6a0]/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      )}
      <div
        className={cn('relative z-10 rounded-2xl overflow-hidden', className)}
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'flex h-12 w-full rounded-xl px-4 py-2 text-sm placeholder:text-zinc-600 transition-all duration-200',
        'focus:outline-none focus:ring-1 focus:ring-[#06d6a0]/40',
        props.className,
      )}
      style={{
        background: T.elevated,
        border: `1px solid ${T.border}`,
        color: T.text,
        ...props.style,
      }}
    />
  );
}

type BtnVariant = 'default' | 'primary' | 'ghost';

export function Button({
  variant = 'default',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, React.CSSProperties> = {
    default: { background: T.accentDim, color: T.accent, border: `1px solid rgba(6,214,160,0.2)` },
    primary: { background: `linear-gradient(135deg, ${T.accent}, ${T.sky})`, color: T.bg, border: 'none' },
    ghost: { background: 'transparent', color: T.textMuted, border: 'none' },
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 h-12 px-6',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]',
        className,
      )}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold', className)}
      style={{ border: `1px solid ${T.border}`, ...props.style }}
      {...props}
    >
      {children}
    </span>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{
          background: T.accent,
          boxShadow: `0 0 8px ${T.accentGlow}`,
          animation: 'proto-breathe 3s ease-in-out infinite',
        }}
      />
      <span className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: T.accent }}>
        {children}
      </span>
    </div>
  );
}
