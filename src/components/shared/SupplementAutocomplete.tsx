"use client";
import React from 'react';
import { cn } from '@/lib/utils';
import { T } from '@/lib/design-tokens';

const FALLBACK_DICTIONARY = [
  'Magnesium Glycinate', 'Creatine Monohydrate', 'Vitamin D3', 'Vitamin K2 (MK-7)',
  'Omega-3 Fish Oil (EPA/DHA)', 'Zinc Picolinate', 'L-Theanine', 'Ashwagandha KSM-66',
  'CoQ10 (Ubiquinol)', 'Iron (Ferrous Bisglycinate)', 'Vitamin C (Ascorbic Acid)',
  'Vitamin B12 (Methylcobalamin)', 'NAC (N-Acetyl Cysteine)', 'Berberine HCl',
  "Lion's Mane Mushroom", 'Melatonin', 'Rhodiola Rosea', 'Collagen Peptides',
  'Boron', 'Turkey Tail Mushroom',
];

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  dictionary?: string[];
};

export function SupplementAutocomplete({
  value, onChange, onSelect, placeholder, className, inputClassName, icon, dictionary,
}: Props) {
  const dict = dictionary && dictionary.length > 0 ? dictionary : FALLBACK_DICTIONARY;
  const [show, setShow] = React.useState(false);
  const filtered = React.useMemo(() => {
    if (!value) return [];
    return dict
      .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
      .slice(0, 20);
  }, [value, dict]);

  return (
    <div className={cn('relative w-full flex items-center', className)}>
      {icon}
      <input
        placeholder={placeholder}
        className={cn(
          'w-full relative z-10 h-12 px-4 py-2 text-sm transition-all duration-200',
          'focus:outline-none placeholder:text-[#64748b]',
          inputClassName,
        )}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${T.border}`,
          color: T.text,
          borderRadius: 4,
        }}
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setShow(false); onSelect?.(value); } }}
      />
      {show && filtered.length > 0 && (
        <div
          className="absolute top-full left-0 mt-1 w-full shadow-2xl z-50 max-h-64 overflow-y-auto"
          style={{
            background: '#131b2e',
            border: `1px solid ${T.border}`,
            backdropFilter: 'blur(24px)',
            borderRadius: 4,
          }}
        >
          {filtered.map((s, i) => (
            <div
              key={i}
              className="px-4 py-3 cursor-pointer text-sm transition-colors duration-150 hover:bg-white/[0.04]"
              style={{ color: T.textMuted, borderBottom: `1px solid ${T.border}` }}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setShow(false); onSelect?.(s); }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hook: load supplement dictionary from API */
export function useSupplementDictionary() {
  const [names, setNames] = React.useState<string[]>([]);
  React.useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data) => setNames(((data.supplements ?? []) as { name: string }[]).map((s) => s.name).sort()))
      .catch(() => {});
  }, []);
  return names;
}
