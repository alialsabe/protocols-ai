"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, FileText, Brain, FlaskConical } from 'lucide-react';
import { T } from '@/lib/design-tokens';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: LayoutGrid, matchExact: true },
  { href: '/#catalog', label: 'Protocols', icon: FileText },
  { href: '/advisor', label: 'Advisor', icon: Brain },
];

/** Desktop top header bar */
export function DesktopNav() {
  const pathname = usePathname();

  return (
    <header
      className="hidden md:flex fixed top-0 w-full z-50 items-center justify-between px-8 h-16 border-b"
      style={{
        background: 'rgba(19, 27, 46, 0.85)',
        backdropFilter: 'blur(16px)',
        borderColor: T.border,
      }}
    >
      <div className="flex items-center gap-3">
        <FlaskConical className="w-5 h-5" style={{ color: T.primary }} />
        <Link href="/" className="text-lg font-black tracking-tighter uppercase" style={{ color: T.primary }}>
          Protocols.ai
        </Link>
      </div>

      <div className="flex items-center gap-8">
        <nav className="flex gap-6">
          {NAV_ITEMS.map((item) => {
            const active = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs font-medium uppercase tracking-widest transition-colors duration-200"
                style={{ color: active ? T.primary : T.textDim }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

/** Mobile bottom nav bar */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around items-center h-20 px-4 pb-4 border-t"
      style={{
        background: 'rgba(11, 19, 38, 0.92)',
        backdropFilter: 'blur(16px)',
        borderColor: T.border,
      }}
    >
      {NAV_ITEMS.map((item) => {
        const active = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center py-1.5 px-4 transition-all active:scale-95 duration-75"
            style={{
              color: active ? T.primary : T.textDim,
              background: active ? 'rgba(173, 198, 255, 0.08)' : 'transparent',
              borderRadius: 4,
            }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium tracking-widest uppercase mt-1">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
