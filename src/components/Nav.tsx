'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  House,
  MagnifyingGlass,
  StackSimple,
  UserCircle,
} from '@phosphor-icons/react';
import { useAuth } from '@/lib/use-auth';

const ROUTINE_KEY = 'protocolsai.routine.v2';

export function Nav() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [routineCount, setRoutineCount] = useState(0);

  useEffect(() => {
    const read = () => {
      try {
        const ids: string[] = JSON.parse(localStorage.getItem(ROUTINE_KEY) || '[]');
        setRoutineCount(ids.length);
      } catch {
        setRoutineCount(0);
      }
    };

    read();
    window.addEventListener('routine:update', read);
    return () => window.removeEventListener('routine:update', read);
  }, []);

  const accountHref = user ? '/account' : '/login';
  const links = [
    { label: 'Today', href: '/', active: pathname === '/' },
    {
      label: 'My Stack',
      href: '/routine',
      active: pathname.startsWith('/routine') || pathname === '/stack',
      count: routineCount,
    },
    {
      label: 'Discover',
      href: '/#library',
      active: pathname.startsWith('/research') || pathname === '/stacks',
    },
  ];

  return (
    <>
      <header className="top-nav">
        <div className="top-nav__inner">
          <Link href="/" className="brand-lockup" aria-label="Stack Lab home">
            <span className="brand-lockup__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span>
              <strong>Stack Lab</strong>
              <small>by Revive One</small>
            </span>
          </Link>

          <nav className="top-nav__links" aria-label="Primary navigation">
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                data-active={item.active ? 'true' : undefined}
                aria-current={item.active ? 'page' : undefined}
              >
                {item.label}
                {item.count ? <span>{item.count}</span> : null}
              </Link>
            ))}
          </nav>

          <div className="top-nav__account">
            <span className="member-label">Included with Revive One</span>
            {!authLoading && (
              <Link href={accountHref}>{user ? 'Account' : 'Sign in'}</Link>
            )}
          </div>
        </div>
      </header>

      <nav className="mobile-tabs" aria-label="Mobile navigation">
        <Link href="/" data-active={pathname === '/' ? 'true' : undefined} aria-current={pathname === '/' ? 'page' : undefined}>
          <House size={20} weight="regular" />
          <span>Today</span>
        </Link>
        <Link
          href="/routine"
          data-active={pathname.startsWith('/routine') || pathname === '/stack' ? 'true' : undefined}
          aria-current={pathname.startsWith('/routine') || pathname === '/stack' ? 'page' : undefined}
        >
          <span className="mobile-tabs__icon">
            <StackSimple size={20} weight="regular" />
            {routineCount > 0 ? <small>{routineCount}</small> : null}
          </span>
          <span>Stack</span>
        </Link>
        <Link href="/#library" data-active={pathname.startsWith('/research') ? 'true' : undefined} aria-current={pathname.startsWith('/research') ? 'page' : undefined}>
          <MagnifyingGlass size={20} weight="regular" />
          <span>Discover</span>
        </Link>
        <Link href={accountHref} data-active={pathname.startsWith('/account') ? 'true' : undefined} aria-current={pathname.startsWith('/account') ? 'page' : undefined}>
          <UserCircle size={20} weight="regular" />
          <span>{user ? 'Account' : 'Sign in'}</span>
        </Link>
      </nav>
    </>
  );
}
