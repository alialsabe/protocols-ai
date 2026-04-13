'use client';

import Link from 'next/link';
import { Search, Layers, MessageSquare, User } from 'lucide-react';
import { openAdvisor } from './advisor/advisorStore';

export function BottomTabBar() {
  const itemCls =
    'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[1.4px]';
  const itemStyle = { color: 'var(--fg-dim)' } as const;

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex h-16 md:hidden"
      style={{
        background: 'rgba(9,9,11,0.92)',
        borderTop: '1px solid var(--hair)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Link href="/" className={itemCls} style={itemStyle}>
        <Search size={20} strokeWidth={1.75} aria-hidden color="var(--accent)" />
        <span className="font-mono">Search</span>
      </Link>
      <Link href="/stack" className={itemCls} style={itemStyle}>
        <Layers size={20} strokeWidth={1.75} aria-hidden color="var(--accent)" />
        <span className="font-mono">Stack</span>
      </Link>
      <button
        type="button"
        onClick={openAdvisor}
        aria-label="Open advisor"
        className={itemCls}
        style={{ ...itemStyle, background: 'transparent', border: 'none' }}
      >
        <MessageSquare size={20} strokeWidth={1.75} aria-hidden color="var(--accent)" />
        <span className="font-mono">Advisor</span>
      </button>
      <Link href="/signin" className={itemCls} style={itemStyle}>
        <User size={20} strokeWidth={1.75} aria-hidden color="var(--accent)" />
        <span className="font-mono">Account</span>
      </Link>
    </nav>
  );
}
