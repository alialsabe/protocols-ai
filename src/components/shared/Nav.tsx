"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { T } from '@/lib/design-tokens';
import { Search, FlaskConical, LayoutGrid, Beaker } from 'lucide-react';

const NAV_ITEMS: { href: string; label: string; icon: typeof Search; matchExact?: boolean }[] = [
  { href: '/', label: 'Home', icon: Search, matchExact: true },
  { href: '/#catalog', label: 'Catalog', icon: LayoutGrid },
  { href: '/advisor', label: 'Advisor', icon: Beaker },
];

function LogoMark() {
  return (
    <div
      className="flex items-center justify-center rounded-lg shrink-0"
      style={{
        width: 32, height: 32,
        background: `linear-gradient(135deg, ${T.accent}, ${T.sky})`,
        boxShadow: `0 0 18px ${T.accentGlow}`,
      }}
    >
      <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth={2.5}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </div>
  );
}

/** Desktop sidebar nav */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex w-[240px] shrink-0 flex-col sticky top-0 h-dvh"
      style={{
        background: 'rgba(17,17,19,0.85)',
        borderRight: `1px solid ${T.border}`,
        backdropFilter: 'blur(40px) saturate(1.2)',
      }}
    >
      <Link href="/" className="flex items-center gap-3 px-6 h-16 shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
        <LogoMark />
        <span className="text-lg font-extrabold tracking-tight" style={{ color: T.text }}>
          Protocols<span style={{ color: T.accent }}>.ai</span>
        </span>
      </Link>

      <nav className="flex-1 p-3 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors duration-200',
              )}
              style={{
                background: active ? T.accentDim : 'transparent',
                border: `1px solid ${active ? T.borderAccent : 'transparent'}`,
                color: active ? T.accent : T.textDim,
              }}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4" style={{ borderTop: `1px solid ${T.border}` }}>
        <p className="text-[10px] font-medium" style={{ color: T.textFaint }}>
          279 supplements indexed
        </p>
      </div>
    </aside>
  );
}

/** Mobile bottom nav */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around h-16 px-2"
      style={{
        background: 'rgba(17,17,19,0.92)',
        borderTop: `1px solid ${T.border}`,
        backdropFilter: 'blur(40px) saturate(1.2)',
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center gap-1 py-1 px-3 min-w-[64px]"
          >
            <Icon className="w-5 h-5" style={{ color: active ? T.accent : T.textDim }} />
            <span
              className="text-[10px] font-semibold"
              style={{ color: active ? T.accent : T.textDim }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
