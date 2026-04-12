'use client';

import { useEffect, useState } from 'react';

const FEED = [
  { t: '04:12:07Z', pmid: '38217445', name: 'ASHWAGANDHA', note: 'cortisol reduction, n=58', rel: '+REL 0.92' },
  { t: '04:11:42Z', pmid: '37994821', name: 'CREATINE',    note: 'cognitive endurance, n=124', rel: '+REL 0.88' },
  { t: '04:10:18Z', pmid: '38104772', name: 'OMEGA-3',     note: 'CRP delta, meta-analysis k=18', rel: '+REL 0.81' },
  { t: '04:08:55Z', pmid: '38188211', name: 'BERBERINE',   note: 'fasting glucose, n=92',   rel: '+REL 0.77' },
  { t: '04:07:11Z', pmid: '38211390', name: 'NMN',         note: 'NAD+ levels, n=32',       rel: '+REL 0.69' },
  { t: '04:05:46Z', pmid: '38099812', name: 'MAGNESIUM',   note: 'sleep latency, n=78',     rel: '+REL 0.84' },
];

export function Ticker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % FEED.length), 4200);
    return () => clearInterval(id);
  }, []);
  const item = FEED[idx];

  return (
    <div
      className="flex h-14 items-center gap-4 overflow-hidden px-6"
      style={{
        borderTop: '1px solid var(--hair)',
        borderBottom: '1px solid var(--hair)',
      }}
    >
      <span className="proto-caret" aria-hidden />
      <span className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: 'var(--fg-dim)' }}>
        LIVE FEED
      </span>
      <div className="flex flex-1 items-center gap-3 font-mono text-[13px]" style={{ color: 'var(--fg-muted)' }}>
        <span style={{ color: 'var(--fg-dim)' }}>[{item.t}]</span>
        <span style={{ color: 'var(--fg-dim)' }}>PMID {item.pmid}</span>
        <span style={{ color: 'var(--fg-dim)' }}>·</span>
        <span style={{ color: 'var(--fg)' }}>{item.name}</span>
        <span style={{ color: 'var(--fg-dim)' }}>·</span>
        <span>{item.note}</span>
        <span style={{ color: 'var(--fg-dim)' }}>·</span>
        <span style={{ color: 'var(--accent)' }}>{item.rel}</span>
      </div>
    </div>
  );
}
