'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/use-auth';

export function UserMenu() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="h-8 w-20 bg-white/[0.03] rounded-lg animate-pulse" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="h-8 px-3 inline-flex items-center text-sm text-[#a1a1aa] hover:text-white rounded-lg transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="h-8 px-3 inline-flex items-center text-sm font-medium text-black bg-[#06d6a0] hover:bg-[#06d6a0]/90 rounded-lg transition-colors"
        >
          Sign up
        </Link>
      </div>
    );
  }

  const initial = (user.email?.[0] ?? '?').toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-[#06d6a0]/20 border border-[#06d6a0]/30 flex items-center justify-center text-sm font-semibold text-[#06d6a0]">
        {initial}
      </div>
      <form action="/api/auth/signout" method="post">
        <button
          type="submit"
          className="h-8 px-3 text-sm text-[#a1a1aa] hover:text-white rounded-lg transition-colors"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
