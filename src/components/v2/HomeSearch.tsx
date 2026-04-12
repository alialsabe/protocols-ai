'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CommandBar } from './CommandBar';

const SUGGESTIONS = [
  'ashwagandha',
  'magnesium glycinate',
  'creatine',
  'omega-3',
  'berberine',
  'nmn',
];

export function HomeSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const submit = (q: string) => {
    router.push(`/research/${encodeURIComponent(q.toLowerCase())}`);
  };

  return (
    <>
      <div className="mt-8 md:mt-10">
        <CommandBar size="lg" value={value} onChange={setValue} onSubmit={submit} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              submit(s);
            }}
            className="inline-flex min-h-[44px] items-center rounded-md px-4 font-mono text-[12px] transition-colors hover:text-white"
            style={{
              border: '1px solid var(--hair)',
              color: 'var(--fg-muted)',
              background: 'transparent',
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </>
  );
}
