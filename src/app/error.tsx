'use client';

import { useEffect } from 'react';
import Link from 'next/link';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: Props) {
  useEffect(() => {
    // Server logs already capture the stack via Vercel; this surfaces
    // it client-side so the browser console has the same context if a
    // user reports a bug.
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-5 py-16 text-center md:py-24">
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: '#ef4444' }}
      >
        Something broke
      </span>
      <h1
        className="mt-3 text-[36px] font-extrabold tracking-[-0.5px] md:text-[44px]"
        style={{ color: 'var(--fg)' }}
      >
        We hit an error rendering this page
      </h1>
      <p
        className="mt-4 max-w-[480px] text-[15px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        It&apos;s us, not you. The error has been logged. Try again or head back home.
      </p>

      {error.digest && (
        <p
          className="mt-3 font-mono text-[11px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[44px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{ border: '1px solid var(--hair-strong)', color: 'var(--fg)' }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
