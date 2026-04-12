'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CommandBar } from '@/components/v2/CommandBar';
import { CategoryFilter } from '@/components/v2/CategoryFilter';

interface Supplement {
  name: string;
  category: string;
  popularityScore: number;
  tags: { tag: string; tagType: string }[];
  supplementTypes: string[];
}

export function HomeSearch() {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data: { supplements: Supplement[] }) => {
        const all: Supplement[] = data.supplements ?? [];
        // Derive unique categories preserving insertion order
        const catSet = new Set<string>();
        for (const s of all) {
          if (s.category) catSet.add(s.category);
        }
        setCategories(Array.from(catSet));
        // Top 8 by popularityScore
        const top8 = [...all]
          .sort((a, b) => (b.popularityScore ?? 0) - (a.popularityScore ?? 0))
          .slice(0, 8);
        setSupplements(top8);
      })
      .catch(() => {});
  }, []);

  const visibleSupplements =
    selectedCategory === null
      ? supplements
      : supplements.filter((s) => s.category === selectedCategory);

  return (
    <>
      <div className="mt-8 md:mt-10">
        <CommandBar size="lg" />
      </div>

      {categories.length > 0 && (
        <div className="mt-4">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {visibleSupplements.length > 0
          ? visibleSupplements.map((s) => (
              <Link
                key={s.name}
                href={`/research/${encodeURIComponent(s.name)}`}
                className="inline-flex min-h-[44px] items-center rounded-md px-4 font-mono text-[12px] transition-colors hover:text-white"
                style={{
                  border: '1px solid var(--hair)',
                  color: 'var(--fg-muted)',
                  background: 'transparent',
                }}
              >
                {s.name}
              </Link>
            ))
          : // Fallback static pills while loading or no match
            ['ashwagandha', 'magnesium glycinate', 'creatine', 'omega-3', 'berberine', 'nmn'].map(
              (s) => (
                <Link
                  key={s}
                  href={`/research/${encodeURIComponent(s)}`}
                  className="inline-flex min-h-[44px] items-center rounded-md px-4 font-mono text-[12px] transition-colors hover:text-white"
                  style={{
                    border: '1px solid var(--hair)',
                    color: 'var(--fg-muted)',
                    background: 'transparent',
                  }}
                >
                  {s}
                </Link>
              )
            )}
      </div>
    </>
  );
}
