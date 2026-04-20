'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';

export function UserMenu() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: 28,
          width: 120,
          background: 'var(--paper-2)',
          borderRadius: 4,
        }}
      />
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link
          href="/login"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-3)',
            letterSpacing: '-0.1px',
            textDecoration: 'none',
            transition: 'color 150ms var(--ease)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-3)')}
        >
          Log in
        </Link>
        <Link
          href="/signup"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
            padding: '7px 14px',
            background: 'var(--ink)',
            color: 'var(--paper)',
            border: '1px solid var(--ink)',
            borderRadius: 3,
            textDecoration: 'none',
            transition: 'background 150ms var(--ease), border-color 150ms var(--ease)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--accent)';
            e.currentTarget.style.borderColor = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--ink)';
            e.currentTarget.style.borderColor = 'var(--ink)';
          }}
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initial = (user.email?.[0] ?? '?').toUpperCase();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Link
        href="/welcome"
        title={user.email ?? 'Account'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--accent-tint)',
          border: '1px solid var(--rule)',
          color: 'var(--accent-ink)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '-0.2px',
          textDecoration: 'none',
        }}
      >
        {initial}
      </Link>
      <form action="/api/auth/signout" method="post" style={{ margin: 0 }}>
        <button
          type="submit"
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--ink-3)',
            background: 'transparent',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            transition: 'color 150ms var(--ease)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ink-3)')}
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
