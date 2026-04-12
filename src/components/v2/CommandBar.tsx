'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function CommandBar({
  size = 'lg',
  defaultValue = '',
  autoFocus = false,
}: {
  size?: 'lg' | 'sm';
  defaultValue?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const tall = size === 'lg';

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const query = value.trim();
    if (!query) return;
    track(ANALYTICS_EVENTS.SUPPLEMENT_SEARCHED, { query_length: query.length });
    router.push(`/research/${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className={`proto-scan relative flex items-center overflow-hidden ${tall ? 'h-24' : 'h-14'}`}
        style={{
          background: 'var(--surface)',
          border: `1px solid ${focused ? 'var(--accent)' : 'var(--hair)'}`,
          borderRadius: 16,
          boxShadow: focused
            ? '0 0 0 4px var(--accent-dim), inset 0 1px 0 rgba(255,255,255,0.04)'
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'border-color 200ms var(--ease), box-shadow 200ms var(--ease)',
        }}
      >
        <div className="flex items-center gap-3 pl-6 pr-4">
          <span
            className="block h-2 w-2 rounded-full"
            style={{
              background: 'var(--accent)',
              boxShadow: '0 0 12px var(--accent-glow)',
            }}
            aria-hidden
          />
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            Query
          </span>
        </div>
        <input
          ref={inputRef}
          aria-label="Query supplement, condition, or stack"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="query supplement, condition, or stack..."
          className={`flex-1 bg-transparent font-mono outline-none ${tall ? 'text-[20px]' : 'text-[15px]'}`}
          style={{ color: 'var(--fg)' }}
        />
        <div className="flex items-center gap-2 pr-5">
          {value.trim() ? (
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors"
              style={{
                background: 'var(--accent)',
                color: '#09090b',
              }}
            >
              Analyze →
            </button>
          ) : (
            <kbd
              className="rounded-md border px-2 py-1 font-mono text-[11px]"
              style={{ borderColor: 'var(--hair-strong)', color: 'var(--fg-dim)' }}
            >
              ⌘K
            </kbd>
          )}
        </div>
      </div>
    </form>
  );
}
