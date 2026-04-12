import Link from 'next/link';

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
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-6 md:px-10 lg:px-16">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="text-[14px] font-extrabold tracking-[-0.2px]" style={{ color: 'var(--fg)' }}>
            PROTOCOLS.AI
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            v2 / supplement intelligence
          </span>
        </Link>
        <nav role="navigation" className="flex items-center gap-6">
          {[
            ['Stack', '/stack'],
            ['Compare', '/compare'],
            ['Advisor', '/advisor'],
            ['Sign in', '/signin'],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="text-[13px] font-semibold transition-colors hover:text-white"
              style={{ color: 'var(--fg-muted)' }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
