'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/use-auth';

// Volume number = days since launch epoch.
// Anchor: 2026-04-01. Adjust if you want a different "Vol 001" date.
const LAUNCH_EPOCH = new Date('2026-04-01T00:00:00Z').getTime();

function getVolume(): string {
  const days = Math.max(1, Math.floor((Date.now() - LAUNCH_EPOCH) / 86_400_000) + 1);
  return String(days).padStart(3, '0');
}

function getDateString(): string {
  const d = new Date();
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return `${days[d.getDay()]} · ${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
}

export function Nav() {
  const pathname = usePathname();
  const isToday    = pathname === '/';
  const isStack    = pathname === '/routine' || pathname === '/routine/'
                  || pathname === '/stack'   || pathname === '/stack/';
  const isLibrary  = pathname.startsWith('/research') || pathname.startsWith('/protocol');
  const isAudit    = pathname.startsWith('/routine/audit');
  const isMe       = pathname.startsWith('/account');

  const { user, loading: authLoading } = useAuth();

  const [vol, setVol] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [routineCount, setRoutineCount] = useState(0);

  useEffect(() => {
    const tick = () => {
      setVol(getVolume());
      setDateStr(getDateString());
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
    <>
      {/* Top masthead — newspaper style on desktop, brand-only on mobile */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--paper)',
          borderBottom: '2px solid var(--ink)',
        }}
      >
        <div
          className="nav-inner"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '14px 40px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            alignItems: 'center',
            gap: 32,
          }}
        >
          {/* Brand — Fraunces serif with red dot */}
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 9,
              fontFamily: 'var(--font-fraunces), serif',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-0.4px',
              color: 'var(--ink)',
              textDecoration: 'none',
              lineHeight: 1,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                background: 'var(--accent)',
                borderRadius: '50%',
                flexShrink: 0,
              }}
            />
            <span>Stack Lab</span>
          </Link>

          {/* Desktop nav links — center */}
          <div className="nav-links" style={{ display: 'flex', gap: 28, justifySelf: 'center' }}>
            {([
              ['Today',    '/',                isToday],
              ['Stack',    '/routine',         isStack],
              ['Library',  '/?view=library',   isLibrary],
              ['Audit',    '/routine/audit',   isAudit],
              ['About',    '/about',           pathname === '/about'],
            ] as const).map(([label, href, active]) => (
              <Link
                key={`${label}-${href}`}
                href={href}
                style={{
                  fontFamily: 'var(--font-inter), sans-serif',
                  fontSize: 13,
                  fontWeight: 500,
                  letterSpacing: '0.2px',
                  color: active ? 'var(--accent)' : 'var(--ink-3)',
                  paddingBottom: 4,
                  borderBottom: active ? '1.5px solid var(--accent)' : '1.5px solid transparent',
                  transition: 'color 150ms var(--ease), border-color 150ms var(--ease)',
                  textDecoration: 'none',
                }}
              >
                {label}
                {label === 'Stack' && routineCount > 0 && (
                  <span className="footnote" style={{ marginLeft: 6, color: active ? 'var(--accent)' : 'var(--ink-4)', fontSize: 10 }}>
                    ({routineCount})
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right: VOL + date + auth */}
          <div
            className="nav-right"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              className="nav-vol"
              style={{
                fontFamily: 'var(--font-jetbrains-mono), monospace',
                fontSize: 9.5,
                letterSpacing: '1.2px',
                color: 'var(--ink-3)',
                textAlign: 'right',
                lineHeight: 1.4,
              }}
            >
              <div style={{ color: 'var(--ink)', fontWeight: 600 }}>VOL {vol}</div>
              <div>{dateStr}</div>
            </div>
            {!authLoading && (
              user ? (
                <Link
                  href="/account"
                  className="nav-auth"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    color: isMe ? 'var(--accent)' : 'var(--ink-3)',
                    textDecoration: 'none',
                    transition: 'color 150ms var(--ease)',
                  }}
                >
                  Account
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="nav-auth"
                  style={{
                    fontFamily: 'var(--font-jetbrains-mono), monospace',
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

        {/* Mobile: hide center nav links + VOL block (replaced by bottom tab bar) */}
        <style>{`
          @media (max-width: 820px) {
            .nav-inner {
              grid-template-columns: auto 1fr auto !important;
              padding: 12px 20px !important;
              gap: 12px !important;
            }
            .nav-links { display: none !important; }
            .nav-vol {
              font-size: 9px !important;
              text-align: right !important;
            }
          }
        `}</style>
      </nav>

      {/* Mobile bottom tab bar */}
      <nav className="g-tabbar" aria-label="Primary mobile navigation">
        <Link href="/" data-active={isToday ? 'true' : undefined} className="g-tab">
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
          Audit
        </Link>
        <Link href={user ? '/account' : '/login'} data-active={isMe ? 'true' : undefined} className="g-tab">
          <span className="tab-icon" />
          Me
        </Link>
      </nav>
    </>
  );
}
