'use client';

import { useState } from 'react';

const FIELDS: { label: string; options: string[] }[] = [
  { label: 'PRIMARY GOAL',    options: ['Energy', 'Sleep', 'Focus', 'Longevity', 'Strength', 'Recovery'] },
  { label: 'MEDICATIONS',     options: ['None', '1–2', '3+'] },
  { label: 'MORNING ROUTINE', options: ['Fasted', 'Coffee', 'Breakfast', 'Workout'] },
];

export function IntakeStrip() {
  const [picked, setPicked] = useState<Record<string, string>>({});

  return (
    <div
      className="flex flex-col items-stretch gap-6 px-6 py-6 lg:flex-row lg:items-end lg:gap-8 lg:py-5"
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
          <div className="flex flex-wrap" style={{ borderRadius: 10, border: '1px solid var(--hair)' }}>
            {f.options.map((opt, i) => {
              const active = picked[f.label] === opt;
              return (
                <button
                  key={opt}
                  type="button"
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
        className="h-11 whitespace-nowrap rounded-[10px] px-5 text-[14px] font-bold tracking-tight"
        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
      >
        Generate starting protocol  ⏎
      </button>
    </div>
  );
}
