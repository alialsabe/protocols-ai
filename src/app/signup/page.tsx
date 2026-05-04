'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <main
        className="proto-grid relative flex min-h-screen items-center justify-center px-6"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-full max-w-md rounded-[16px] p-10 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            CONFIRMATION SENT
          </span>
          <h1
            className="mt-4 text-[24px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            Check your email.
          </h1>
          <p className="mt-3 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
            We sent a confirmation link to{' '}
            <span className="font-mono" style={{ color: 'var(--fg)' }}>
              {email}
            </span>
            . Click it to activate your account.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
            style={{ color: 'var(--accent)' }}
          >
            ← BACK TO SIGN IN
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="proto-grid relative flex min-h-screen items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors hover:text-white"
          style={{ color: 'var(--fg-dim)' }}
        >
          ⚜ STACK LAB
        </Link>

        <div
          className="rounded-[16px] p-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            ACCESS · CREATE ACCOUNT
          </span>
          <h1
            className="mt-4 text-[28px] font-extrabold tracking-[-0.6px]"
            style={{ color: 'var(--fg)' }}
          >
            Build your protocol.
          </h1>
          <p className="mt-2 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
            Free forever. Save your stack, compare supplements, get personalized science.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <label
              htmlFor="email"
              className="block font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="proto-focus h-11 w-full rounded-md px-3 font-mono text-[14px]"
              style={{
                background: 'var(--surface-raise)',
                border: '1px solid var(--hair)',
                color: 'var(--fg)',
                outline: 'none',
              }}
            />

            <label
              htmlFor="password"
              className="block font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="proto-focus h-11 w-full rounded-md px-3 font-mono text-[14px]"
              style={{
                background: 'var(--surface-raise)',
                border: '1px solid var(--hair)',
                color: 'var(--fg)',
                outline: 'none',
              }}
            />

            {error ? (
              <div
                className="rounded-md px-3 py-2 font-mono text-[12px]"
                style={{
                  background: 'rgba(251, 113, 133, 0.08)',
                  border: '1px solid rgba(251, 113, 133, 0.3)',
                  color: '#fb7185',
                }}
              >
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md font-mono text-[12px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#09090b' }}
            >
              {loading ? 'CREATING…' : 'CREATE ACCOUNT →'}
            </button>
          </form>

          <p
            className="mt-6 text-center font-mono text-[11px] uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            ALREADY HAVE AN ACCOUNT?{' '}
            <Link
              href="/login"
              className="transition-colors hover:text-white"
              style={{ color: 'var(--accent)' }}
            >
              SIGN IN
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="mt-4 block text-center font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
          style={{ color: 'var(--fg-dim)' }}
        >
          CONTINUE WITHOUT AN ACCOUNT
        </Link>
      </div>
    </main>
  );
}
