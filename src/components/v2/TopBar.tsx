import Link from 'next/link';
import { UserMenu } from '@/components/UserMenu';

export function TopBar() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 h-14 backdrop-blur-xl"
      style={{
        background: 'rgba(9,9,11,0.72)',
        borderBottom: '1px solid var(--hair)',
      }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 md:px-10 lg:px-16">
        <Link href="/" className="flex items-baseline gap-3">
          <span
            className="text-[14px] font-extrabold tracking-[-0.2px]"
            style={{ color: 'var(--fg)' }}
          >
            PROTOCOLS.AI
          </span>
          <span
            className="hidden font-mono text-[10px] uppercase tracking-[1.4px] md:inline"
            style={{ color: 'var(--fg-dim)' }}
          >
            v2 / supplement intelligence
          </span>
        </Link>

        {/* Desktop nav — hidden on mobile, bottom tab bar replaces */}
        <nav role="navigation" className="hidden items-center gap-6 md:flex">
          {[
            ['Stack', '/stack'],
            ['Compare', '/compare'],
            ['Protocol', '/protocol'],
            ['Advisor', '/advisor'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] font-bold tracking-[-0.1px] transition-opacity hover:opacity-80"
              style={{ color: 'var(--fg)' }}
            >
              {label}
            </Link>
          ))}
          <UserMenu />
        </nav>

        {/* Mobile: mono status tag instead of cramped nav */}
        <span
          className="font-mono text-[10px] uppercase tracking-[1.4px] md:hidden"
          style={{ color: 'var(--fg-dim)' }}
        >
          v2 · live
        </span>
      </div>
    </header>
  );
}
