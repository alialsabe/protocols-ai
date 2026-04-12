'use client';

import { useState } from 'react';

export function CommandBar({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState('');
  const tall = size === 'lg';

  return (
    <div
      className={`proto-scan relative flex items-center overflow-hidden ${
        tall ? 'h-20 md:h-24' : 'h-14'
      }`}
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
      <div className="flex flex-shrink-0 items-center gap-2 pl-4 pr-3 md:gap-3 md:pl-6 md:pr-4">
        <span
          className="block h-2 w-2 flex-shrink-0 rounded-full"
          style={{
            background: 'var(--accent)',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
          aria-hidden
        />
        <span
          className="hidden font-mono text-[11px] font-bold uppercase tracking-[1.4px] md:inline"
          style={{ color: 'var(--fg-dim)' }}
        >
          Query
        </span>
      </div>
      <input
        aria-label="Query supplement, condition, or stack"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="search supplement or stack…"
        className={`min-w-0 flex-1 bg-transparent font-mono outline-none ${
          tall ? 'text-[16px] md:text-[20px]' : 'text-[14px] md:text-[15px]'
        }`}
        style={{ color: 'var(--fg)' }}
      />
      <div className="hidden flex-shrink-0 items-center pr-5 md:flex">
        <kbd
          className="rounded-md border px-2 py-1 font-mono text-[11px]"
          style={{ borderColor: 'var(--hair-strong)', color: 'var(--fg-dim)' }}
        >
          ⌘K
        </kbd>
      </div>
    </div>
  );
}
