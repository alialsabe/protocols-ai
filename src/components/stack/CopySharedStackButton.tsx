'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CopySharedStackButtonProps {
  publicId: string;
}

export function CopySharedStackButton({ publicId }: CopySharedStackButtonProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'copying' | 'error'>('idle');

  async function copyStack() {
    setStatus('copying');
    const res = await fetch('/api/stack/copy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    }).catch(() => null);

    if (!res) {
      setStatus('error');
      return;
    }

    if (res.status === 401) {
      router.push(`/signup?copy=${encodeURIComponent(publicId)}`);
      return;
    }

    if (!res.ok) {
      setStatus('error');
      return;
    }

    const data = await res.json().catch(() => ({ url: '/routine' }));
    router.push(typeof data.url === 'string' ? data.url : '/routine');
  }

  return (
    <button
      type="button"
      onClick={copyStack}
      disabled={status === 'copying'}
      className="inline-flex min-h-[44px] items-center rounded-md px-5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: 'var(--accent)', color: '#09090b' }}
    >
      {status === 'copying' ? 'Copying...' : status === 'error' ? 'Try again' : 'Copy to my routine'}
    </button>
  );
}
