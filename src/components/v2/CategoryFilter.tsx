'use client';

import { useEffect, useState } from 'react';

interface CategoryFilterProps {
  categories: string[];
  selected: string | null;
  onSelect: (category: string | null) => void;
}

export function CategoryFilter({ categories, selected, onSelect }: CategoryFilterProps) {
  const all = [null, ...categories];

  return (
    <div
      className="flex gap-2 overflow-x-auto py-1"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      {all.map((cat) => {
        const isSelected = cat === selected;
        const label = cat ?? 'All';
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(cat)}
            className="inline-flex flex-shrink-0 min-h-[36px] items-center rounded-md px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-colors"
            style={
              isSelected
                ? { background: 'var(--accent)', color: '#09090b', border: '1px solid transparent' }
                : { background: 'transparent', border: '1px solid var(--hair)', color: 'var(--fg-muted)' }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
