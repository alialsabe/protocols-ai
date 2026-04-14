'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SupplementChip({ slug, name }: { slug: string; name: string }) {
  const router = useRouter();
  const href = `/research/${slug}`;

  return (
    <Link
      href={href}
      className="proto-supp-chip proto-focus inline-block whitespace-nowrap rounded-md px-2 py-1 align-baseline font-mono text-[13px] font-semibold tracking-tight transition-all"
      style={{
        border: '1.5px solid var(--accent)',
        background: 'var(--accent-dim)',
        color: 'var(--accent)',
        lineHeight: '1.15',
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        router.push(href);
      }}
    >
      {name}
    </Link>
  );
}
