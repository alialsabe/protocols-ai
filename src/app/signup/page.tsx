'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../utils/supabase/client';

export default function SignupPage() {
  const router = useRouter();
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
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
        <div className="w-full max-w-md bg-[#111113] border border-white/[0.06] rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">📬</div>
          <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-[#71717a] text-sm mb-6">
            We sent a confirmation link to <span className="text-white">{email}</span>. Click it to
            activate your account.
          </p>
          <Link href="/login" className="text-[#06d6a0] hover:underline text-sm">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b] px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-[#06d6a0] font-semibold mb-8 text-center tracking-tight">
          ← Protocols.ai
        </Link>

        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">Create your account</h1>
          <p className="text-[#71717a] text-sm mb-6">
            Free forever. Save your stack, get personalized science.
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
                minLength={8}
                autoComplete="new-password"
                className="w-full h-11 px-3 bg-[#18181b] border border-white/[0.06] rounded-lg text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#06d6a0]/40 focus:ring-1 focus:ring-[#06d6a0]/20"
                placeholder="At least 8 characters"
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
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-[#71717a] mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#06d6a0] hover:underline">
              Sign in
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
