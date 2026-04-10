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
    <div
      className={cn(
        'glass-panel rounded-sm overflow-hidden transition-colors duration-200',
        hover && 'hover:bg-[rgba(30,41,59,0.6)]',
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'flex h-12 w-full px-4 py-2 text-sm transition-all duration-200',
        'focus:outline-none focus:border-[#adc6ff]',
        'placeholder:text-[#64748b]',
        props.className,
      )}
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${T.border}`,
        color: T.text,
        borderRadius: 4,
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
    default: {
      background: T.primaryDim,
      color: T.primary,
      border: `1px solid ${T.borderAccent}`,
    },
    primary: {
      background: `linear-gradient(135deg, ${T.primary}, ${T.primaryContainer})`,
      color: T.textOnPrimary,
      border: 'none',
      boxShadow: `0 0 20px ${T.primaryGlow}`,
    },
    ghost: {
      background: 'transparent',
      color: T.textMuted,
      border: 'none',
    },
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center text-sm font-bold transition-all duration-200 h-12 px-6',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]',
        'uppercase tracking-widest text-[11px]',
        className,
      )}
      style={{ borderRadius: 4, ...styles[variant] }}
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
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
        className,
      )}
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 2,
        background: 'rgba(255,255,255,0.05)',
        color: T.textMuted,
        ...props.style,
      }}
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
          background: T.primary,
          boxShadow: `0 0 8px ${T.primaryGlow}`,
        }}
      />
      <span
        className="text-[10px] font-bold uppercase tracking-widest"
        style={{ color: T.primary }}
      >
        {children}
      </span>
    </div>
  );
}
