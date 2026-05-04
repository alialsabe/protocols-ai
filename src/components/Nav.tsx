'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';

// XP / Volume number = days since launch epoch.
const LAUNCH_EPOCH = new Date('2026-04-01T00:00:00Z').getTime();

function getXP(): string {
  const days = Math.max(1, Math.floor((Date.now() - LAUNCH_EPOCH) / 86_400_000) + 1);
  return String(days).padStart(3, '0');
}

export function Nav() {
  const pathname = usePathname();
  const isToday    = pathname === '/';
  const isStack    = pathname === '/routine' || pathname === '/routine/'
                  || pathname === '/stack'   || pathname === '/stack/';
  const isLibrary  = pathname.startsWith('/research') || pathname.startsWith('/protocol')
                  || (pathname === '/' && typeof window !== 'undefined' && window.location.search.includes('view=library'));
  const isAudit    = pathname.startsWith('/routine/audit');
  const isMe       = pathname.startsWith('/account');

  const { user, loading: authLoading } = useAuth();

  const [xp, setXP] = useState('');
  const [routineCount, setRoutineCount] = useState(0);

  useEffect(() => {
    setXP(getXP());
    const id = setInterval(() => setXP(getXP()), 60_000);
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
    <>
      {/* Top bar — L+ RPG aesthetic */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(14, 18, 24, 0.92)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--gold)',
        }}
      >
        <div
          className="nav-inner"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '12px 40px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Brand — Cinzel serif with gold fleur-de-lis */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '2.5px',
              color: 'var(--gold)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>⚜</span>
            <span>Stack Lab</span>
          </Link>

          {/* Desktop nav links — center */}
          <div className="nav-links" style={{ display: 'flex', gap: 28, justifySelf: 'center' }}>
            {([
              ['Today',   '/',                isToday && !isLibrary],
              ['Stack',   '/routine',         isStack],
              ['Library', '/?view=library',   isLibrary],
              ['Audit',   '/routine/audit',   isAudit],
              ['About',   '/about',           pathname === '/about'],
            ] as const).map(([label, href, active]) => (
              <Link
                key={`${label}-${href}`}
                href={href}
                style={{
                  fontFamily: 'var(--font-cinzel), serif',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '1.6px',
                  textTransform: 'uppercase',
                  color: active ? 'var(--gold)' : 'var(--text-3)',
                  paddingBottom: 4,
                  borderBottom: active ? '1.5px solid var(--gold)' : '1.5px solid transparent',
                  transition: 'color 150ms var(--ease), border-color 150ms var(--ease)',
                  textDecoration: 'none',
                }}
              >
                {label}
                {label === 'Stack' && routineCount > 0 && (
                  <span
                    className="footnote"
                    style={{
                      marginLeft: 6,
                      color: active ? 'var(--gold)' : 'var(--text-4)',
                      fontSize: 10,
                      fontFamily: 'var(--font-jetbrains-mono), monospace',
                    }}
                  >
                    {routineCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right: XP counter + auth */}
          <div
            className="nav-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              className="nav-xp"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--gold)',
                letterSpacing: '1px',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', boxShadow: '0 0 6px var(--gold-glow)' }} />
              {xp} XP
            </div>
            {!authLoading && (
              user ? (
                <Link
                  href="/account"
                  className="nav-auth"
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1.6px',
                    textTransform: 'uppercase',
                    color: isMe ? 'var(--gold)' : 'var(--text-3)',
                    textDecoration: 'none',
                    transition: 'color 150ms var(--ease)',
                  }}
                >
                  Hero
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="nav-auth"
                  style={{
                    fontFamily: 'var(--font-cinzel), serif',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '1.6px',
                    textTransform: 'uppercase',
                    color: 'var(--gold)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    border: '1px solid var(--gold)',
                    borderRadius: 3,
                  }}
                >
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>

        {/* Mobile: hide center nav links + XP block (replaced by bottom tab bar) */}
        <style>{`
          @media (max-width: 820px) {
            .nav-inner {
              grid-template-columns: auto 1fr auto !important;
              padding: 12px 20px !important;
              gap: 12px !important;
            }
            .nav-links { display: none !important; }
            .nav-xp { font-size: 10px !important; }
          }
        `}</style>
      </nav>

      {/* Mobile bottom tab bar — L+ */}
      <nav className="g-tabbar" aria-label="Primary mobile navigation">
        <Link href="/" data-active={isToday && !isLibrary ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Today
        </Link>
        <Link href="/routine" data-active={isStack ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Stack
        </Link>
        <Link href="/?view=library" data-active={isLibrary ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Library
        </Link>
        <Link href="/routine/audit" data-active={isAudit ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Scout
        </Link>
        <Link href={user ? '/account' : '/login'} data-active={isMe ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Hero
        </Link>
      </nav>
    </>
  );
}
