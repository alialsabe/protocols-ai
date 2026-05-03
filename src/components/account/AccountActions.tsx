'use client';

import { useState } from 'react';

const DISCLAIMER_KEY = 'stacklab.disclaimer.v1';

/**
 * Client-side account actions that need browser APIs (localStorage, sign
 * out form post). The /account page is a server component for the auth
 * check, this lives inside it for the interactive bits.
 */
export function AccountActions() {
  const [resetState, setResetState] = useState<'idle' | 'done'>('idle');

  function resetDisclaimer() {
    try {
      window.localStorage.removeItem(DISCLAIMER_KEY);
      setResetState('done');
    } catch {
      // localStorage blocked — disclaimer modal will show again anyway
      setResetState('done');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Row
        label="Medical disclaimer acknowledgement"
        description="Reset so the first-visit medical disclaimer modal shows again on next page load. Useful if you want to re-read it or share the device."
        action={
          <button
            type="button"
            onClick={resetDisclaimer}
            className="inline-flex min-h-[40px] items-center justify-center px-4 font-mono text-[10px] font-bold uppercase tracking-[1.2px] transition-opacity hover:opacity-90"
            style={{
              border: '1px solid var(--hair-strong)',
              color: 'var(--fg)',
              background: 'var(--paper)',
            }}
          >
            {resetState === 'done' ? 'Reset · refresh page' : 'Reset acknowledgement'}
          </button>
        }
      />

      <Row
        label="Sign out"
        description="End this browser session. Stack and bloodwork data persist server-side."
        action={
          <form action="/api/auth/signout" method="POST" style={{ margin: 0 }}>
            <button
              type="submit"
              className="inline-flex min-h-[40px] items-center justify-center px-4 font-mono text-[10px] font-bold uppercase tracking-[1.2px] transition-opacity hover:opacity-90"
              style={{ background: 'var(--accent)', color: '#000' }}
            >
              Sign out
            </button>
          </form>
        }
      />
    </div>
  );
}

function Row({
  label,
  description,
  action,
}: {
  label: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-3 rounded-[10px] px-4 py-3 md:flex-row md:items-center md:justify-between"
      style={{ border: '1px solid var(--hair)' }}
    >
      <div className="flex min-w-0 flex-col">
        <span className="text-[14px] font-bold" style={{ color: 'var(--fg)' }}>
          {label}
        </span>
        <span className="mt-1 text-[12px]" style={{ color: 'var(--fg-muted)' }}>
          {description}
        </span>
      </div>
      <div className="flex-shrink-0">{action}</div>
    </div>
  );
}
