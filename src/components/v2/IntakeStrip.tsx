'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const FIELDS: { label: string; key: 'goal' | 'meds' | 'routine'; options: string[] }[] = [
  { label: 'PRIMARY GOAL',    key: 'goal',    options: ['Energy', 'Sleep', 'Focus', 'Longevity', 'Strength', 'Recovery'] },
  { label: 'MEDICATIONS',     key: 'meds',    options: ['None', '1–2', '3+'] },
  { label: 'MORNING ROUTINE', key: 'routine', options: ['Fasted', 'Coffee', 'Breakfast', 'Workout'] },
];

export function IntakeStrip() {
  const router = useRouter();
  const [picked, setPicked] = useState<Record<string, string>>({});

  const handleGenerate = () => {
    const params = new URLSearchParams();
    for (const f of FIELDS) {
      const v = picked[f.label];
      if (v) params.set(f.key, v.toLowerCase());
    }
    router.push(`/research?${params.toString()}`);
  };

  return (
    <div
      className="flex flex-col items-stretch gap-5 px-5 py-6 md:gap-6 md:px-6 lg:flex-row lg:items-end lg:gap-8 lg:py-5"
      style={{
        borderTop: '1px solid var(--hair)',
        borderBottom: '1px solid var(--hair)',
      }}
    >
      {FIELDS.map((f) => (
        <div key={f.label} className="flex flex-1 flex-col gap-2">
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            {f.label}
          </span>
          <div
            className="flex flex-wrap"
            style={{ borderRadius: 10, border: '1px solid var(--hair)' }}
            role="radiogroup"
            aria-label={f.label}
          >
            {f.options.map((opt, i) => {
              const active = picked[f.label] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPicked((p) => ({ ...p, [f.label]: opt }))}
                  className="relative h-11 flex-1 px-3 text-[13px] font-semibold transition-colors"
                  style={{
                    color: active ? 'var(--fg)' : 'var(--fg-muted)',
                    background: active ? 'var(--surface-raise)' : 'transparent',
                    borderLeft: i === 0 ? 'none' : '1px solid var(--hair)',
                  }}
                >
                  {opt}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 block h-[2px]"
                      style={{ background: 'var(--accent)' }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleGenerate}
        className="h-12 w-full whitespace-nowrap rounded-[10px] px-5 text-[14px] font-bold tracking-tight lg:h-11 lg:w-auto"
        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
      >
        Generate starting protocol  ⏎
      </button>
    </div>
  );
}
