'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
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
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-[#06d6a0] font-semibold mb-8 text-center tracking-tight">
          ← Protocols.ai
        </Link>

        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Sign in</h1>
          <p className="text-[#71717a] text-sm mb-6">
            Save your supplement stack and get personalized guidance.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 px-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#06d6a0]/40 focus:ring-1 focus:ring-[#06d6a0]/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-[#a1a1aa] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-11 px-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#06d6a0]/40 focus:ring-1 focus:ring-[#06d6a0]/20"
                placeholder="••••••••"
              />
            </div>

            {error ? (
              <div className="text-sm text-[#fb7185] bg-[#fb7185]/10 border border-[#fb7185]/20 rounded-lg px-3 py-2">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#06d6a0] hover:bg-[#06d6a0]/90 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-[#71717a] mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#06d6a0] hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-[#71717a] hover:text-[#a1a1aa] mt-4"
        >
          Continue without an account
        </Link>
      </div>
    </div>
  );
}
