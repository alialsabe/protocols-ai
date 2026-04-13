'use client';

import Link from 'next/link';

export function SupplementChip({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/research/${slug}`}
      className="proto-supp-chip proto-focus inline-block whitespace-nowrap rounded-md px-2 py-1 align-baseline font-mono text-[13px] font-semibold tracking-tight transition-all"
      style={{
        border: '1.5px solid var(--accent)',
        background: '#ffffff',
        color: 'var(--accent)',
        lineHeight: '1.15',
      }}
    >
      {name}
    </Link>
  );
}
