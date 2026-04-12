'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const STACK_KEY = 'protocols_stack';

type StackEntry = { name: string };

function readStack(): StackEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STACK_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeStack(entries: StackEntry[]) {
  localStorage.setItem(STACK_KEY, JSON.stringify(entries));
}

export function ReportActions({ name }: { name: string }) {
  const [inStack, setInStack] = useState(false);
  const [addLabel, setAddLabel] = useState('+ Add to stack');
  const [shareLabel, setShareLabel] = useState('Share report ⌘S');

  useEffect(() => {
    const stack = readStack();
    setInStack(stack.some((e) => e.name === name));
  }, [name]);

  function handleAddToStack() {
    const stack = readStack();
    if (stack.some((e) => e.name === name)) {
      // Remove
      writeStack(stack.filter((e) => e.name !== name));
      setInStack(false);
      setAddLabel('+ Add to stack');
    } else {
      writeStack([...stack, { name }]);
      setInStack(true);
      setAddLabel('✓ In stack');
      setTimeout(() => setAddLabel('✓ In stack'), 1500);
    }
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareLabel('Link copied!');
      setTimeout(() => setShareLabel('Share report ⌘S'), 2000);
    }).catch(() => {
      // Fallback: select the URL bar
      setShareLabel('Copy URL above');
      setTimeout(() => setShareLabel('Share report ⌘S'), 2000);
    });
  }

  return (
    <div className="flex flex-shrink-0 flex-col items-start gap-3 md:items-end">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleAddToStack}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{
            background: inStack ? 'var(--accent-dim)' : 'var(--accent)',
            color: inStack ? 'var(--accent)' : '#09090b',
            border: inStack ? '1px solid var(--accent)' : 'none',
          }}
        >
          {addLabel}
        </button>
        <Link
          href={`/compare?add=${encodeURIComponent(name)}`}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors hover:text-white"
          style={{
            border: '1px solid var(--hair-strong)',
            color: 'var(--fg-muted)',
          }}
        >
          Compare
        </Link>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="font-mono text-[11px] uppercase tracking-[1.4px] transition-colors hover:text-white"
        style={{ color: shareLabel === 'Link copied!' ? 'var(--accent)' : 'var(--fg-dim)' }}
      >
        {shareLabel}
      </button>
    </div>
  );
}
