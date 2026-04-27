'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';

export function Nav() {
  const pathname = usePathname();
  const isHome      = pathname === '/';
  const isResearch  = pathname.startsWith('/research');
  const isRoutine   = pathname === '/stack' || pathname === '/stack/';
  const isAbout     = pathname === '/about';
  const isDashboard = pathname === '/dashboard';

  const { user, loading: authLoading } = useAuth();

  const [now, setNow] = useState('');
  const [routineCount, setRoutineCount] = useState(0);

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, '0');
      setNow(`${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const read = () => {
      try {
        const ids: string[] = JSON.parse(
          localStorage.getItem('protocolsai.routine.v2') || '[]',
        );
        setRoutineCount(ids.length);
      } catch {
        setRoutineCount(0);
      }
    };
    read();
    window.addEventListener('routine:update', read);
    return () => window.removeEventListener('routine:update', read);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: 'var(--paper)',
        borderBottom: '1px solid var(--rule)',
      }}
    >
      <div
        className="nav-inner"
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '18px 40px',
          display: 'grid',
          gridTemplateColumns: 'auto 1fr auto',
          alignItems: 'center',
          gap: 48,
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontWeight: 600, fontSize: 17, letterSpacing: '-0.3px', color: 'var(--ink)', textDecoration: 'none' }}>
          <span
            style={{
              display: 'inline-block',
              width: 7,
              height: 7,
              background: 'var(--accent)',
              transform: 'translateY(-1px)',
              flexShrink: 0,
            }}
          />
          <span>
            Protocols<span style={{ color: 'var(--accent)' }}>.</span>ai
          </span>
          <span
            className="footnote nav-ref"
            style={{ marginLeft: 8, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase' }}
          >
            Reference · 2026
          </span>
        </Link>

        {/* Nav links */}
        <div className="nav-links" style={{ display: 'flex', gap: 32, justifySelf: 'center' }}>
          {([
            ['Browse',     '/',          isHome],
            ['My Routine', '/stack',     isRoutine],
            ['About',      '/about',     isAbout],
          ] as const).map(([label, href, active]) => (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: active ? 'var(--ink)' : 'var(--ink-3)',
                paddingBottom: 4,
                borderBottom: active ? '1px solid var(--ink)' : '1px solid transparent',
                transition: 'color 150ms var(--ease), border-color 150ms var(--ease)',
                textDecoration: 'none',
              }}
            >
              {label}
              {label === 'My Routine' && routineCount > 0 && (
                <span className="footnote" style={{ marginLeft: 6, color: 'var(--ink-4)', fontSize: 11 }}>
                  ({routineCount})
                </span>
              )}
            </Link>
          ))}
          {user && (
            <Link
              href="/dashboard"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: isDashboard ? 'var(--ink)' : 'var(--ink-3)',
                paddingBottom: 4,
                borderBottom: isDashboard ? '1px solid var(--ink)' : '1px solid transparent',
                transition: 'color 150ms var(--ease), border-color 150ms var(--ease)',
                textDecoration: 'none',
              }}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Date + Auth */}
        <div
          className="footnote nav-date"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            letterSpacing: '0.4px',
          }}
        >
          {now}
          {!authLoading && (
            user ? (
              <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
                <button
                  type="submit"
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: 'var(--ink-4)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'color 150ms var(--ease)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-4)')}
                >
                  Sign Out
                </button>
              </form>
            ) : (
              <Link
                href="/login"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '1.2px',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
            )
          )}
        </div>
      </div>

      {/* Mobile: compact — hide REFERENCE label + date, shrink padding/gap, keep nav links visible */}
      <style>{`
        @media (max-width: 820px) {
          .nav-inner {
            grid-template-columns: auto 1fr !important;
            padding: 14px 20px !important;
            gap: 16px !important;
          }
          .nav-ref, .nav-date { display: none !important; }
          .nav-links { gap: 20px !important; justify-self: end !important; }
          .nav-links a { font-size: 13px !important; }
        }
        @media (max-width: 380px) {
          .nav-links { gap: 14px !important; }
        }
      `}</style>
    </nav>
  );
}
