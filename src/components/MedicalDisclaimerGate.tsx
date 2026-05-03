'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'stacklab.disclaimer.v1';

/**
 * First-visit medical disclaimer modal. Shows once per browser, persists
 * acceptance to localStorage, and blocks scrolling underneath until the
 * user explicitly acknowledges the educational-use framing. Mounted in
 * the root layout so it covers every entry point.
 *
 * If the user clears storage or visits in a private window, the modal
 * shows again — that's intentional. We need the explicit acceptance on
 * record (in their head, not ours) every time the device is fresh.
 */
export function MedicalDisclaimerGate() {
  // Default `false` so SSR + initial client paint don't flash the modal
  // before we know whether they've already accepted. The effect below
  // flips to true on the client if storage doesn't show acceptance.
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      if (!accepted) setOpen(true);
    } catch {
      // localStorage blocked (private window, etc.) — show the modal
      // anyway so the user sees it at least once per session.
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function accept() {
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore — they'll see it again on next visit, that's fine
    }
    setOpen(false);
  }

  if (!mounted || !open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="stacklab-disclaimer-title"
      className="fixed inset-0 z-[100] flex items-center justify-center px-5 py-8"
      style={{ background: 'rgba(10, 15, 10, 0.55)' }}
    >
      <div
        className="w-full max-w-[560px] overflow-hidden rounded-[20px]"
        style={{
          background: 'var(--paper)',
          border: '1px solid var(--hair-strong)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.25)',
        }}
      >
        <div className="px-8 pt-8 pb-2">
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--accent)' }}
          >
            Before you start
          </span>
          <h2
            id="stacklab-disclaimer-title"
            className="mt-2 text-[24px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            Stack Lab is educational, not medical advice
          </h2>
        </div>

        <ul
          className="flex flex-col gap-3 px-8 py-6 text-[14px] leading-[22px]"
          style={{ color: 'var(--fg-muted)' }}
        >
          <li className="flex gap-3">
            <Bullet />
            <span>
              Information here is for self-education. It does not diagnose, treat, or cure any condition.
            </span>
          </li>
          <li className="flex gap-3">
            <Bullet />
            <span>
              Talk to your physician before starting, stopping, or changing any supplement, especially if you take prescription medication, are pregnant, or have a medical condition.
            </span>
          </li>
          <li className="flex gap-3">
            <Bullet />
            <span>
              Bloodwork analysis flags patterns. It does not replace a clinician&apos;s interpretation of your labs.
            </span>
          </li>
          <li className="flex gap-3">
            <Bullet />
            <span>
              We may earn affiliate commissions from supplement links. This never changes which compounds we surface.
            </span>
          </li>
        </ul>

        <div
          className="flex flex-col gap-3 px-8 py-6 md:flex-row md:items-center md:justify-between"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--hair)' }}
        >
          <p className="text-[12px]" style={{ color: 'var(--fg-dim)' }}>
            Read the full{' '}
            <Link
              href="/disclaimer"
              className="underline"
              style={{ color: 'var(--accent-ink)' }}
              onClick={accept}
            >
              medical disclaimer
            </Link>
            ,{' '}
            <Link
              href="/terms"
              className="underline"
              style={{ color: 'var(--accent-ink)' }}
              onClick={accept}
            >
              terms
            </Link>
            , and{' '}
            <Link
              href="/privacy"
              className="underline"
              style={{ color: 'var(--accent-ink)' }}
              onClick={accept}
            >
              privacy policy
            </Link>
            .
          </p>
          <button
            type="button"
            onClick={accept}
            className="inline-flex min-h-[44px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            I understand
          </button>
        </div>
      </div>
    </div>
  );
}

function Bullet() {
  return (
    <span
      className="mt-[8px] h-[6px] w-[6px] flex-shrink-0 rounded-full"
      style={{ background: 'var(--accent)' }}
      aria-hidden
    />
  );
}
