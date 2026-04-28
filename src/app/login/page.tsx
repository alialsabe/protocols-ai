'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--bg)' }} />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
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
          ← MATERIA
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
            ACCESS · SIGN IN
          </span>
          <h1
            className="mt-4 text-[28px] font-extrabold tracking-[-0.6px]"
            style={{ color: 'var(--fg)' }}
          >
            Welcome back.
          </h1>
          <p className="mt-2 text-[13px] leading-[20px]" style={{ color: 'var(--fg-muted)' }}>
            Save your supplement stack and get personalized guidance.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(v) => setEmail(v)}
              autoComplete="email"
              placeholder="you@example.com"
            />

            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(v) => setPassword(v)}
              autoComplete="current-password"
              placeholder="••••••••"
            />

            {error ? <ErrorBox message={error} /> : null}

            <button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-md font-mono text-[12px] font-bold uppercase tracking-[1.4px] transition-opacity disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#09090b' }}
            >
              {loading ? 'SIGNING IN…' : 'SIGN IN →'}
            </button>
          </form>

          <p className="mt-6 text-center font-mono text-[11px] uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
            NO ACCOUNT?{' '}
            <Link href="/signup" className="transition-colors hover:text-white" style={{ color: 'var(--accent)' }}>
              CREATE ONE
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

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
      style={{ color: 'var(--fg-dim)' }}
    >
      {children}
    </label>
  );
}

function Input({
  id,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  minLength?: number;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      autoComplete={autoComplete}
      minLength={minLength}
      placeholder={placeholder}
      className="proto-focus h-11 w-full rounded-md px-3 font-mono text-[14px]"
      style={{
        background: 'var(--surface-raise)',
        border: '1px solid var(--hair)',
        color: 'var(--fg)',
        outline: 'none',
      }}
    />
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      className="rounded-md px-3 py-2 font-mono text-[12px]"
      style={{
        background: 'rgba(251, 113, 133, 0.08)',
        border: '1px solid rgba(251, 113, 133, 0.3)',
        color: '#fb7185',
      }}
    >
      {message}
    </div>
  );
}
