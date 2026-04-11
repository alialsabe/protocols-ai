"use client";
import React from 'react';
import { createPortal } from 'react-dom';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import {
  Search, FlaskConical, Activity, Calendar, Plus, Pill, User, LayoutGrid,
} from 'lucide-react';
import type {
  Biometrics, ProtocolReport, SchedulerOutput,
} from '@/lib/protocol-types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type ActiveView = 'research' | 'dosage' | 'scheduler' | 'catalog';

type CatalogItem = {
  slug: string;
  name: string;
  baseCompound?: string;
  specificForm?: string;
  tags: { tag: string; tagType: string }[];
  supplementTypes: string[];
  studyCount: number;
};

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (inline — keeps component self-contained)
// ─────────────────────────────────────────────────────────────────────────────

const T = {
  bg:          '#09090b',
  card:        '#111113',
  elevated:    '#18181b',
  accent:      '#06d6a0',
  accentDim:   'rgba(6,214,160,0.08)',
  accentMid:   'rgba(6,214,160,0.15)',
  accentGlow:  'rgba(6,214,160,0.25)',
  border:      'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  sky:         '#38bdf8',
  amber:       '#fbbf24',
  rose:        '#fb7185',
  zinc:        '#71717a',
};

// ─────────────────────────────────────────────────────────────────────────────
// Supplement image map
// ─────────────────────────────────────────────────────────────────────────────

const SUPPLEMENT_IMAGE_MAP: [string, string][] = [
  ['ashwagandha',  '/images/supplements/v3/ashwagandha.webp'],
  ['berberine',    '/images/supplements/v3/berberine.webp'],
  ['boron',        '/images/supplements/v3/boron.webp'],
  ['theanine',     '/images/supplements/v3/l-theanine.webp'],
  ['lion',         '/images/supplements/v3/lions-mane.webp'],
  ['melatonin',    '/images/supplements/v3/melatonin.webp'],
  ['omega',        '/images/supplements/v3/omega-3.webp'],
  ['rhodiola',     '/images/supplements/v3/rhodiola.webp'],
  ['turkey',       '/images/supplements/v3/turkey-tail.webp'],
  ['b12',          '/images/supplements/v3/vitamin-b12.webp'],
];

function getSupplementImage(name: string): string | null {
  const lower = name.toLowerCase();
  for (const [key, path] of SUPPLEMENT_IMAGE_MAP) {
    if (lower.includes(key)) return path;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag color helper
// ─────────────────────────────────────────────────────────────────────────────

function tagStyle(tag: string, tagType: string) {
  const t = tag.toLowerCase();
  if (tagType === 'category') {
    if (t.includes('sleep'))                         return { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  color: T.amber };
    if (t.includes('heart') || t.includes('cardio')) return { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', color: T.rose  };
    if (t.includes('immun'))                         return { bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.2)',  color: T.sky   };
    return { bg: T.accentDim, border: 'rgba(6,214,160,0.18)', color: T.accent };
  }
  // benefit tags
  if (t.includes('sleep') || t.includes('relax'))   return { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.2)',  color: T.amber };
  if (t.includes('heart') || t.includes('blood'))   return { bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.2)', color: T.rose  };
  return { bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.18)', color: T.sky };
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitive UI components
// ─────────────────────────────────────────────────────────────────────────────

const Card = ({ className, style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) => (
  <div className="relative group">
    <div className="absolute -inset-[1px] bg-gradient-to-r from-[#06d6a0]/15 via-[#38bdf8]/10 to-[#06d6a0]/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div
      className={cn('relative z-10 rounded-2xl overflow-hidden', className)}
      style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', ...(style ?? {}) }}
    >
      {children}
    </div>
  </div>
);

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => (
  <input
    ref={ref}
    {...props}
    className={cn(
      'flex h-12 w-full rounded-xl px-4 py-2 text-sm text-white placeholder:text-zinc-600',
      'focus:outline-none focus:ring-1 transition-all duration-200',
      props.className,
    )}
    style={{ background: T.elevated, border: `1px solid ${T.border}`, ...(props.style ?? {}) }}
    onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = 'rgba(6,214,160,0.4)'; props.onFocus?.(e); }}
    onBlur={(e)  => { (e.target as HTMLInputElement).style.borderColor = T.border; props.onBlur?.(e); }}
  />
));
Input.displayName = 'Input';

type BtnVariant = 'default' | 'primary' | 'ghost';
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant };
const Button = ({ variant = 'default', className, children, ...props }: ButtonProps) => {
  const styles: Record<BtnVariant, React.CSSProperties> = {
    default: { background: T.accentDim, color: T.accent, border: `1px solid rgba(6,214,160,0.2)` },
    primary: { background: `linear-gradient(135deg, ${T.accent}, #0ea5e9)`, color: T.bg, border: 'none' },
    ghost:   { background: 'transparent', color: '#a1a1aa', border: 'none' },
  };
  return (
    <button
      className={cn('inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 h-12 px-6 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97]', className)}
      style={styles[variant]}
      {...props}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn('inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold', className)}
    style={{ border: `1px solid ${T.border}` }}
    {...props}
  >
    {children}
  </span>
);

// ─────────────────────────────────────────────────────────────────────────────
// Supplement autocomplete
// ─────────────────────────────────────────────────────────────────────────────

const SUPPLEMENT_DICTIONARY_FALLBACK = [
  'Magnesium Glycinate', 'Creatine Monohydrate', 'Vitamin D3', 'Vitamin K2 (MK-7)',
  'Omega-3 Fish Oil (EPA/DHA)', 'Zinc Picolinate', 'L-Theanine', 'Ashwagandha KSM-66',
  'CoQ10 (Ubiquinol)', 'Iron (Ferrous Bisglycinate)', 'Vitamin C (Ascorbic Acid)',
  'Vitamin B12 (Methylcobalamin)', 'NAC (N-Acetyl Cysteine)', 'Berberine HCl',
  "Lion's Mane Mushroom", 'Melatonin', 'Rhodiola Rosea', 'Collagen Peptides',
  'Boron', 'Turkey Tail Mushroom',
];

type AutocompleteProps = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  icon?: React.ReactNode;
  dictionary?: string[];
};

const SupplementAutocomplete = ({
  value, onChange, onSelect, placeholder, className, inputClassName, icon, dictionary,
}: AutocompleteProps) => {
  const dict = dictionary && dictionary.length > 0 ? dictionary : SUPPLEMENT_DICTIONARY_FALLBACK;
  const [show, setShow] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dropdownRect, setDropdownRect] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const filtered = React.useMemo(() => {
    if (!value) return [];
    return dict
      .filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase())
      .slice(0, 20);
  }, [value, dict]);

  React.useEffect(() => {
    if (show && filtered.length > 0 && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropdownRect({ top: r.bottom + window.scrollY + 8, left: r.left + window.scrollX, width: r.width });
    }
  }, [show, filtered.length]);

  const dropdown = show && filtered.length > 0 && dropdownRect
    ? createPortal(
        <div
          style={{
            position: 'absolute',
            top: dropdownRect.top,
            left: dropdownRect.left,
            width: dropdownRect.width,
            background: '#18181b',
            border: `1px solid ${T.border}`,
            zIndex: 9999,
          }}
          className="rounded-xl shadow-2xl max-h-64 overflow-y-auto"
        >
          {filtered.map((s, i) => (
            <div
              key={i}
              className="px-4 py-3 cursor-pointer text-sm transition-colors duration-150"
              style={{ color: '#a1a1aa', borderBottom: `1px solid ${T.border}` }}
              onMouseOver={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseOut={(e)  => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
              onMouseDown={(e) => { e.preventDefault(); onChange(s); setShow(false); onSelect?.(s); }}
            >
              {s}
            </div>
          ))}
        </div>,
        document.body
      )
    : null;

  return (
    <div className={cn('relative w-full flex items-center', className)}>
      {icon}
      <Input
        ref={inputRef}
        placeholder={placeholder}
        className={cn('w-full relative z-10', inputClassName)}
        value={value}
        onChange={(e) => { onChange(e.target.value); setShow(true); }}
        onFocus={() => setShow(true)}
        onBlur={() => setTimeout(() => setShow(false), 200)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setShow(false); onSelect?.(value); } }}
      />
      {dropdown}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

function useSupplementDictionary() {
  const [names, setNames] = React.useState<string[]>([]);
  React.useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data) => setNames(((data.supplements ?? []) as { name: string }[]).map((s) => s.name).sort()))
      .catch(() => {});
  }, []);
  return names;
}

function useCatalogData() {
  const [items, setItems] = React.useState<CatalogItem[]>([]);
  React.useEffect(() => {
    fetch('/api/supplements')
      .then((r) => r.json())
      .then((data) => {
        const list: CatalogItem[] = (data.supplements ?? []).map((s: CatalogItem) => ({
          slug: s.slug,
          name: s.name,
          baseCompound: s.baseCompound,
          specificForm: s.specificForm,
          tags: s.tags ?? [],
          supplementTypes: s.supplementTypes ?? [],
          studyCount: s.studyCount ?? 0,
        }));
        setItems(list);
      })
      .catch(() => {});
  }, []);
  return items;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mesh gradient background (fixed, pointer-events-none)
// ─────────────────────────────────────────────────────────────────────────────

const MeshBackground = React.memo(function MeshBackground() {
  return (
    <>
      {/* Animated mesh blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            background: T.accent,
            top: '-15%', left: '-10%',
            filter: 'blur(130px)',
            opacity: 0.10,
            animation: 'proto-mesh-1 26s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            background: '#0ea5e9',
            bottom: '-10%', right: '-8%',
            filter: 'blur(120px)',
            opacity: 0.09,
            animation: 'proto-mesh-2 32s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380, height: 380,
            background: T.accent,
            top: '40%', left: '50%',
            filter: 'blur(110px)',
            opacity: 0.05,
            animation: 'proto-mesh-3 20s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>
      {/* Grain texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0.032,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />
    </>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Catalog card (spotlight hover effect)
// ─────────────────────────────────────────────────────────────────────────────

const CatalogCard = React.memo(function CatalogCard({
  item,
  index,
  onAnalyze,
}: {
  item: CatalogItem;
  index: number;
  onAnalyze: (name: string) => void;
}) {
  const imgSrc = getSupplementImage(item.name);
  const topTags = item.tags.slice(0, 2);
  const evidenceWidth = Math.min(Math.round((item.studyCount / 50) * 100), 100);
  const delay = `${100 + index * 60}ms`;

  return (
    <div
      className="group relative cursor-pointer"
      style={{ opacity: 0, animation: `proto-fade-up 480ms var(--ease-out-expo, cubic-bezier(0.16,1,0.3,1)) ${delay} forwards` }}
      onClick={() => onAnalyze(item.name)}
    >
      {/* Spotlight border */}
      <div
        className="absolute -inset-px rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(135deg, ${T.accentGlow}, transparent 60%)` }}
      />
      {/* Card body */}
      <div
        className="relative rounded-[20px] p-5 transition-transform duration-300 group-hover:-translate-y-1"
        style={{
          background: T.card,
          border: `1px solid ${T.border}`,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
        }}
      >
        {/* Image */}
        <div
          className="mb-4 flex items-center justify-center rounded-[14px] transition-all duration-300 group-hover:scale-[1.04]"
          style={{ width: 56, height: 56, background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, overflow: 'hidden' }}
        >
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: 'saturate(0.85) brightness(0.9)' }}
              loading="lazy"
            />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} style={{ width: 24, height: 24, opacity: 0.1 }}>
              <circle cx={12} cy={12} r={9} />
            </svg>
          )}
        </div>

        {/* Name */}
        <p className="text-sm font-bold leading-snug mb-2" style={{ color: '#f4f4f5', letterSpacing: '-0.2px' }}>
          {item.name}
        </p>

        {/* Tags */}
        <div className="flex gap-1 flex-wrap mb-3">
          {topTags.map((t, i) => {
            const s = tagStyle(t.tag, t.tagType);
            return (
              <span
                key={i}
                className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px]"
                style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}
              >
                {t.tag}
              </span>
            );
          })}
        </div>

        {/* Evidence score */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, color: T.zinc }}>Evidence</span>
            <span style={{ fontFamily: 'var(--font-geist-mono), monospace', fontSize: 10, color: T.accent, fontWeight: 600 }}>
              {item.studyCount > 0 ? `${item.studyCount} studies` : 'No studies indexed'}
            </span>
          </div>
          <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            {item.studyCount > 0 && (
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{ width: `${evidenceWidth}%`, background: `linear-gradient(90deg, ${T.accent}, #0ea5e9)` }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
                    animation: 'proto-shimmer 2.5s ease-in-out infinite',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const supplementDictionary  = useSupplementDictionary();
  const catalogData           = useCatalogData();

  // ── View state ──
  const [activeView, setActiveView]       = React.useState<ActiveView>('research');
  const [catalogFilter, setCatalogFilter] = React.useState<string>('All');

  // ── Research state ──
  const [searchQuery, setSearchQuery] = React.useState('');
  const [hasSearched, setHasSearched] = React.useState(false);
  const [report, setReport]           = React.useState<ProtocolReport | null>(null);
  const [loading, setLoading]         = React.useState(false);
  const [errorMsg, setErrorMsg]       = React.useState<string | null>(null);
  const [runtimeMs, setRuntimeMs]     = React.useState<number | null>(null);

  // ── Dosage state ──
  const [weight, setWeight]   = React.useState('');
  const [age, setAge]         = React.useState('');
  const [gender, setGender]   = React.useState<Biometrics['sex']>('male');

  // ── Scheduler state ──
  const [schedulerInput, setSchedulerInput]         = React.useState('');
  const [schedulerSupplements, setSchedulerSupplements] = React.useState<string[]>(['Vitamin D3', 'Magnesium Glycinate', 'Iron', 'Melatonin', 'Boron']);
  const [schedulerResult, setSchedulerResult]       = React.useState<SchedulerOutput | null>(null);
  const [schedulerLoading, setSchedulerLoading]     = React.useState(false);
  const [schedulerError, setSchedulerError]         = React.useState<string | null>(null);
  const [wakeTime, setWakeTime]         = React.useState('');
  const [breakfastTime, setBreakfastTime] = React.useState('');
  const [lunchTime, setLunchTime]       = React.useState('');
  const [dinnerTime, setDinnerTime]     = React.useState('');
  const [bedTime, setBedTime]           = React.useState('');
  const [intermittentFasting, setIntermittentFasting] = React.useState(false);
  const [fastingStart, setFastingStart] = React.useState('');
  const [fastingEnd, setFastingEnd]     = React.useState('');

  // ── Catalog filter pills ──
  const catalogTags = React.useMemo(() => {
    const seen = new Set<string>();
    for (const item of catalogData) {
      for (const t of item.tags) seen.add(t.tag);
    }
    return ['All', ...Array.from(seen).sort()];
  }, [catalogData]);

  const filteredCatalog = React.useMemo(() => {
    if (catalogFilter === 'All') return catalogData;
    return catalogData.filter((item) => item.tags.some((t) => t.tag === catalogFilter));
  }, [catalogData, catalogFilter]);

  // ── Research handler ──
  const triggerAnalysis = async (queryOverride?: string) => {
    const q = (queryOverride ?? searchQuery).trim();
    if (!q) return setErrorMsg('Enter a supplement to analyze.');
    setLoading(true);
    setErrorMsg(null);
    setReport(null);
    setHasSearched(false);
    try {
      const res = await fetch('/api/protocols', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          biometrics: { weightKg: weight ? Number(weight) : undefined, age: age ? Number(age) : undefined, sex: gender },
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.status === 'not_found' && data?.suggestions?.length) {
          setErrorMsg(`No data found for "${q}". Did you mean: ${data.suggestions.slice(0, 3).join(', ')}?`);
          return;
        }
        throw new Error(data?.message ?? data?.error ?? 'Unable to analyze right now.');
      }
      setReport(data.report);
      setRuntimeMs(data.runtimeMs ?? null);
      setHasSearched(true);
      setSearchQuery(q);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to analyze.');
    } finally {
      setLoading(false);
    }
  };

  // ── Catalog → Research handler ──
  const analyzeFromCatalog = (name: string) => {
    setSearchQuery(name);
    setActiveView('research');
    setTimeout(() => triggerAnalysis(name), 50);
  };

  // ── Scheduler handler ──
  const triggerScheduler = async () => {
    if (!schedulerSupplements.length) return setSchedulerError('Add at least one supplement.');
    setSchedulerLoading(true);
    setSchedulerError(null);
    try {
      const hasRoutineInput = [wakeTime, breakfastTime, lunchTime, dinnerTime, bedTime, fastingStart, fastingEnd].some(Boolean) || intermittentFasting;
      const routine = hasRoutineInput ? {
        wakeTime: wakeTime || '07:00',
        sleepTime: bedTime || '23:00',
        meals: { breakfast: breakfastTime || '08:00', lunch: lunchTime || '12:30', dinner: dinnerTime || '18:30' },
        intermittentFasting,
        fastingWindowStart: intermittentFasting ? (fastingStart || undefined) : undefined,
        fastingWindowEnd:   intermittentFasting ? (fastingEnd   || undefined) : undefined,
      } : undefined;
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplements: schedulerSupplements, routine }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Unable to generate schedule.');
      setSchedulerResult(data.schedule ?? null);
    } catch (err) {
      setSchedulerError(err instanceof Error ? err.message : 'Failed to generate schedule.');
    } finally {
      setSchedulerLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-[100dvh]" style={{ background: T.bg, color: '#a1a1aa', fontFamily: "var(--font-outfit), system-ui, sans-serif" }}>
      <MeshBackground />

      <div className="relative flex min-h-[100dvh]" style={{ zIndex: 2 }}>

        {/* ── Sidebar (hidden on mobile, icon-only on tablet, full on desktop) ── */}
        <aside
          className="hidden md:flex md:w-[60px] lg:w-[260px] flex-shrink-0 flex-col sticky top-0 h-[100dvh]"
          style={{ background: 'rgba(17,17,19,0.85)', borderRight: `1px solid ${T.border}`, backdropFilter: 'blur(40px) saturate(1.2)', WebkitBackdropFilter: 'blur(40px) saturate(1.2)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center lg:justify-start gap-3 lg:px-7 h-20 flex-shrink-0" style={{ borderBottom: `1px solid ${T.border}` }}>
            <div
              className="flex items-center justify-center rounded-[10px] flex-shrink-0"
              style={{ width: 32, height: 32, background: `linear-gradient(135deg, ${T.accent}, #0ea5e9)`, boxShadow: `0 0 18px ${T.accentGlow}` }}
            >
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={T.bg} strokeWidth={2.5}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="hidden lg:block text-xl font-extrabold tracking-[-0.5px]" style={{ color: '#fafafa' }}>Protocols.ai</span>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-2 lg:p-4 flex flex-col gap-1">
            {([
              { id: 'research',   label: 'Research Core', icon: <FlaskConical className="w-4 h-4" /> },
              { id: 'catalog',    label: 'Catalog',       icon: <LayoutGrid className="w-4 h-4" />, badge: 'New' },
              { id: 'dosage',     label: 'Dosage',        icon: <Activity className="w-4 h-4" /> },
              { id: 'scheduler',  label: 'Scheduler',     icon: <Calendar className="w-4 h-4" /> },
            ] as const).map((item) => {
              const active = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={item.label}
                  className="w-full flex items-center justify-center lg:justify-start gap-3 lg:px-4 py-[11px] rounded-[12px] text-[13px] font-semibold text-left transition-all duration-200"
                  style={{
                    background: active ? T.accentDim : 'transparent',
                    border: `1px solid ${active ? 'rgba(6,214,160,0.18)' : 'transparent'}`,
                    color: active ? T.accent : T.zinc,
                  }}
                  onMouseOver={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = '#d4d4d8'; }}
                  onMouseOut={(e)  => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = T.zinc; }}
                >
                  {item.icon}
                  <span className="hidden lg:block">{item.label}</span>
                  {'badge' in item && item.badge && (
                    <span
                      className="hidden lg:block ml-auto text-[9px] font-bold px-[6px] py-[2px] rounded-[4px] uppercase tracking-[0.8px]"
                      style={{ background: T.accent, color: T.bg }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-10 lg:px-14 lg:py-12 max-w-6xl pb-24 md:pb-12">

          {/* ════════════════════════════════════════════════
              CATALOG VIEW
          ════════════════════════════════════════════════ */}
          {activeView === 'catalog' && (
            <div>
              {/* Header */}
              <div className="mb-9" style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) both' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: T.accent, boxShadow: `0 0 8px ${T.accentGlow}`, animation: 'proto-breathe 3s ease-in-out infinite' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: T.accent }}>Catalog</span>
                </div>
                <h2 className="text-[28px] font-extrabold tracking-[-0.6px] mb-2" style={{ color: '#fafafa' }}>Supplement Catalog</h2>
                <p className="text-sm font-medium" style={{ color: T.zinc }}>
                  {catalogData.length > 0 ? `${catalogData.length} supplements` : 'Loading...'} &middot; Filter by type or benefit &middot; Click to analyze
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex gap-2 flex-wrap mb-8" style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) 80ms both' }}>
                {catalogTags.slice(0, 16).map((tag) => {
                  const active = catalogFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setCatalogFilter(tag)}
                      className="px-4 py-[7px] rounded-full text-[12px] font-semibold transition-all duration-200 active:scale-95"
                      style={{
                        background: active ? T.accentDim : 'transparent',
                        border: `1px solid ${active ? 'rgba(6,214,160,0.28)' : T.border}`,
                        color: active ? T.accent : T.zinc,
                        boxShadow: active ? `0 0 14px rgba(6,214,160,0.08)` : 'none',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Grid */}
              {catalogData.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-[20px] h-[176px]" style={{ background: T.card, border: `1px solid ${T.border}`, animation: 'proto-shimmer 1.5s ease-in-out infinite', backgroundImage: `linear-gradient(90deg, ${T.card}, ${T.elevated}, ${T.card})` }} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredCatalog.slice(0, 48).map((item, i) => (
                    <CatalogCard key={item.slug} item={item} index={i} onAnalyze={analyzeFromCatalog} />
                  ))}
                </div>
              )}
              {filteredCatalog.length === 0 && catalogData.length > 0 && (
                <p className="text-sm mt-8" style={{ color: T.zinc }}>No supplements found for &ldquo;{catalogFilter}&rdquo;.</p>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              RESEARCH CORE VIEW
          ════════════════════════════════════════════════ */}
          {activeView === 'research' && (
            <div className="space-y-6">
              {/* Header */}
              <div style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) both' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-[6px] h-[6px] rounded-full" style={{ background: T.accent, boxShadow: `0 0 8px ${T.accentGlow}`, animation: 'proto-breathe 3s ease-in-out infinite' }} />
                  <span className="text-[11px] font-bold uppercase tracking-[1.4px]" style={{ color: T.accent }}>Research Core</span>
                </div>
                <h2 className="text-[28px] font-extrabold tracking-[-0.6px]" style={{ color: '#fafafa' }}>Research Core</h2>
              </div>

              {/* Search bar */}
              <div className="relative rounded-[18px] overflow-hidden" style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) 80ms both' }}>
                {/* Rotating conic glow */}
                <div
                  className="absolute -inset-[2px] rounded-[18px]"
                  style={{
                    background: `conic-gradient(from 180deg at 50% 50%, transparent 0deg, ${T.accentGlow} 120deg, rgba(14,165,233,0.2) 200deg, transparent 360deg)`,
                    animation: 'proto-search-rotate 6s linear infinite',
                    opacity: 0.75,
                  }}
                />
                <div
                  className="relative flex items-center rounded-[18px] p-1"
                  style={{ background: T.card, zIndex: 1 }}
                >
                  <Search className="absolute left-5 w-5 h-5 pointer-events-none" style={{ color: T.zinc }} />
                  <SupplementAutocomplete
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSelect={(v) => triggerAnalysis(v)}
                    placeholder="Query supplement..."
                    inputClassName="pl-12 h-16 text-[15px] rounded-[14px] bg-transparent border-transparent font-medium"
                    dictionary={supplementDictionary}
                  />
                  <Button
                    className="h-12 flex-shrink-0 mr-1 text-[13px] font-bold px-7"
                    variant="primary"
                    onClick={() => triggerAnalysis()}
                    disabled={loading}
                    style={{ borderRadius: 14 }}
                  >
                    {loading ? 'Analyzing...' : 'Analyze'}
                  </Button>
                </div>
              </div>

              {/* Error */}
              {errorMsg && (
                <p className="text-sm" style={{ color: '#fb7185', animation: 'proto-fade-up 300ms cubic-bezier(0.16,1,0.3,1) both' }}>
                  {errorMsg}
                </p>
              )}

              {/* Loading */}
              {loading && !report && (
                <div className="flex flex-col items-center justify-center py-24 gap-4" style={{ animation: 'proto-fade-up 400ms cubic-bezier(0.16,1,0.3,1) both' }}>
                  <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${T.accent} transparent transparent transparent` }} />
                  <p className="text-sm" style={{ color: T.zinc }}>Analyzing supplement data...</p>
                </div>
              )}

              {/* Runtime badge */}
              {report && runtimeMs !== null && (
                <p className="text-[11px]" style={{ color: T.zinc, fontFamily: 'var(--font-geist-mono), monospace' }}>Runtime: {runtimeMs.toFixed(0)} ms</p>
              )}

              {/* Hero empty state — shown before any search */}
              {!hasSearched && !loading && !errorMsg && (
                <div
                  className="flex flex-col items-center justify-center py-20 gap-6 text-center"
                  style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) both' }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center rounded-2xl"
                    style={{ width: 64, height: 64, background: T.accentDim, border: `1px solid rgba(6,214,160,0.18)`, boxShadow: `0 0 32px ${T.accentGlow}` }}
                  >
                    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18" />
                    </svg>
                  </div>

                  {/* Headline */}
                  <div>
                    <h2 className="text-[22px] font-extrabold tracking-[-0.4px] mb-2" style={{ color: '#fafafa' }}>
                      What are you researching today?
                    </h2>
                    <p className="text-sm font-medium" style={{ color: T.zinc }}>
                      Search 279 supplements — science, dosage, interactions and more.
                    </p>
                  </div>

                  {/* Popular chips */}
                  <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                    {['Magnesium', 'Creatine', 'Vitamin D3', 'Omega-3', 'Ashwagandha'].map((name) => (
                      <button
                        key={name}
                        onClick={() => { setSearchQuery(name); triggerAnalysis(name); }}
                        className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95"
                        style={{
                          background: T.accentDim,
                          border: `1px solid rgba(6,214,160,0.18)`,
                          color: T.accent,
                        }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,214,160,0.4)'; }}
                        onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,214,160,0.18)'; }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {hasSearched && report && (
                <div className="relative overflow-hidden" style={{ animation: 'proto-fade-up 500ms cubic-bezier(0.16,1,0.3,1) both' }}>
                  {/* Blended product image */}
                  {(() => {
                    const imgSrc = getSupplementImage(report.name ?? report.subject ?? '');
                    return imgSrc ? (
                      <div
                        className="absolute pointer-events-none select-none"
                        style={{
                          right: -30, top: -10, width: 400, height: 400, zIndex: 0,
                          WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 60% 45%, black 15%, transparent 70%)',
                          maskImage:       'radial-gradient(ellipse 65% 65% at 60% 45%, black 15%, transparent 70%)',
                          animation: 'proto-float 10s ease-in-out infinite',
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imgSrc}
                          alt=""
                          className="w-full h-full object-contain"
                          style={{ opacity: 0.22, mixBlendMode: 'luminosity', filter: 'saturate(0.4) brightness(0.65)' }}
                          draggable={false}
                        />
                      </div>
                    ) : null;
                  })()}

                  <div className="relative" style={{ zIndex: 1 }}>
                    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

                      {/* Companion stack sidebar */}
                      <Card className="p-5 h-fit sticky top-6">
                        <h3 className="text-sm font-bold mb-1" style={{ color: '#fafafa' }}>Common Stack Partners</h3>
                        <p className="text-[11px] mb-4" style={{ color: T.zinc }}>Commonly taken together.</p>
                        <div className="space-y-2">
                          {(report.companionSuggestions ?? []).map((item) => (
                            <button
                              key={item.supplement}
                              onClick={() => triggerAnalysis(item.supplement)}
                              className="w-full text-left p-3 rounded-xl transition-all duration-200"
                              style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.03)' }}
                              onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(6,214,160,0.2)'; }}
                              onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.borderColor = T.border; }}
                            >
                              <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>{item.supplement}</p>
                              <p className="text-[11px] mt-1" style={{ color: T.zinc }}>&bull; {item.why}</p>
                            </button>
                          ))}
                          {!(report.companionSuggestions ?? []).length && (
                            <p className="text-xs" style={{ color: T.zinc }}>No pairings mapped yet.</p>
                          )}
                        </div>
                      </Card>

                      {/* Main result tabs */}
                      <TabsPrimitive.Root defaultValue="science" className="flex flex-col w-full">
                        {/* Result card header */}
                        <div
                          className="rounded-2xl p-7 mb-1 relative overflow-hidden"
                          style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
                        >
                          <h3 className="text-[22px] font-extrabold tracking-[-0.4px] mb-1" style={{ color: '#fafafa' }}>
                            {report.name ?? report.subject}
                          </h3>
                          {report.baseCompound && (
                            <p className="text-[11px] mb-3" style={{ color: T.zinc }}>
                              Base compound: <span style={{ color: '#a1a1aa' }}>{report.baseCompound}</span>
                              {report.specificForm ? <> &middot; Form: <span style={{ color: '#a1a1aa' }}>{report.specificForm}</span></> : null}
                            </p>
                          )}
                          {/* Type + tag badges */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(report.supplementTypes ?? []).map((t) => (
                              <span
                                key={t}
                                className="text-[10px] font-bold px-[10px] py-[4px] rounded-[8px]"
                                style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: '#a1a1aa' }}
                              >
                                {t}
                              </span>
                            ))}
                            {/* Clickable category / benefit tags → Catalog */}
                            {(report.tags ?? []).filter((t) => t.tagType === 'category').slice(0, 2).map((t) => (
                              <button
                                key={t.tag}
                                onClick={() => { setCatalogFilter(t.tag); setActiveView('catalog'); }}
                                className="text-[10px] font-bold px-[10px] py-[4px] rounded-[8px] flex items-center gap-1 transition-all duration-150 active:scale-95"
                                style={{ background: T.accentDim, border: `1px solid rgba(6,214,160,0.18)`, color: T.accent }}
                              >
                                {t.tag} <span style={{ opacity: 0.6, fontSize: 10 }}>&#8599;</span>
                              </button>
                            ))}
                            {(report.tags ?? []).filter((t) => t.tagType === 'benefit').slice(0, 2).map((t) => (
                              <button
                                key={t.tag}
                                onClick={() => { setCatalogFilter(t.tag); setActiveView('catalog'); }}
                                className="text-[10px] font-bold px-[10px] py-[4px] rounded-[8px] flex items-center gap-1 transition-all duration-150 active:scale-95"
                                style={{ background: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.18)', color: T.sky }}
                              >
                                {t.tag} <span style={{ opacity: 0.6, fontSize: 10 }}>&#8599;</span>
                              </button>
                            ))}
                          </div>
                          {/* Tab bar */}
                          <TabsPrimitive.List className="flex border-b" style={{ borderColor: T.border }}>
                            {[
                              { value: 'science',  label: 'Science',  color: T.accent },
                              { value: 'clinical', label: 'Clinical Studies', color: '#a78bfa' },
                              { value: 'sentiment',label: 'Sentiment', color: '#34d399' },
                            ].map((tab) => (
                              <TabsPrimitive.Trigger
                                key={tab.value}
                                value={tab.value}
                                className="px-6 py-3 text-sm font-semibold transition-colors duration-200"
                                style={{ color: T.zinc }}
                                onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#d4d4d8'; }}
                                onMouseOut={(e)  => { (e.currentTarget as HTMLButtonElement).style.color = T.zinc; }}
                              >
                                {tab.label}
                              </TabsPrimitive.Trigger>
                            ))}
                          </TabsPrimitive.List>
                        </div>

                        {/* Science tab */}
                        <TabsPrimitive.Content value="science" className="space-y-4 mt-4">
                          <Card className="p-6">
                            <p className="text-sm leading-relaxed" style={{ color: '#a1a1aa' }}>
                              {report.science?.summary ?? report.summary}
                            </p>
                            <div className="mt-4 space-y-3">
                              {(report.science?.findings ?? []).map((f) => (
                                <div key={f.title ?? f.claim} className="p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                                  <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>{f.title ?? f.claim}</p>
                                  <p className="text-xs mt-1" style={{ color: T.zinc }}>{f.detail ?? f.context}</p>
                                  {(f.citation ?? f.publishedDate ?? f.link) && (
                                    <p className="text-[10px] mt-1" style={{ color: '#52525b' }}>
                                      {f.citation ? `${f.citation} · ` : ''}
                                      {f.publishedDate ? `Published: ${f.publishedDate} · ` : ''}
                                      {f.link ? <a className="underline" href={f.link} target="_blank" rel="noreferrer" style={{ color: T.accent }}>Study Link</a> : null}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Card>
                          <Card className="p-5" style={{ borderColor: 'rgba(251,191,36,0.15)', background: 'rgba(251,191,36,0.03)' }}>
                            <h4 className="flex items-center gap-2 text-sm font-bold mb-3" style={{ color: T.amber }}>
                              <Pill className="w-4 h-4" /> Medicine Interactions
                            </h4>
                            <div className="space-y-2">
                              {(report.medicineInteractions ?? []).map((m) => (
                                <div key={`${m.medicineName}-${m.severity}`} className="text-xs p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(0,0,0,0.2)', color: '#a1a1aa' }}>
                                  <p><strong style={{ color: '#fafafa' }}>{m.medicineName}</strong> — <span className="uppercase" style={{ color: T.amber }}>{m.severity}</span></p>
                                  <p className="mt-1" style={{ color: T.zinc }}>{m.mechanism}</p>
                                  <p className="mt-1" style={{ color: '#52525b' }}>{m.recommendation}</p>
                                </div>
                              ))}
                              {!(report.medicineInteractions ?? []).length && (
                                <p className="text-xs" style={{ color: T.zinc }}>No interactions indexed.</p>
                              )}
                            </div>
                          </Card>
                        </TabsPrimitive.Content>

                        {/* Clinical studies tab */}
                        <TabsPrimitive.Content value="clinical" className="space-y-4 mt-4">
                          {(report.clinicalStudies ?? []).length > 0 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">
                              <div className="space-y-3">
                                {(report.clinicalStudies ?? []).map((study) => (
                                  <Card key={study.id} className="p-4">
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>{study.title}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                          <span className="text-[10px] font-semibold px-2 py-[3px] rounded-[6px]" style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>{study.category}</span>
                                          {study.subcategory && <span className="text-[10px] px-2 py-[3px] rounded-[6px]" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${T.border}`, color: T.zinc }}>{study.subcategory}</span>}
                                          {study.studyType && <span className="text-[10px]" style={{ color: T.zinc }}>{study.studyType}</span>}
                                          {study.year && <span className="text-[10px]" style={{ color: T.zinc }}>{study.year}</span>}
                                          {study.sampleSize && <span className="text-[10px]" style={{ color: T.zinc }}>n={study.sampleSize}</span>}
                                        </div>
                                        {study.outcome && <p className="text-xs mt-2" style={{ color: T.zinc }}>{study.outcome}</p>}
                                      </div>
                                      {(study.url ?? study.pmid) && (
                                        <a href={study.url ?? `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`} target="_blank" rel="noreferrer" className="text-xs underline shrink-0" style={{ color: T.accent }}>
                                          {study.pmid ? `PMID: ${study.pmid}` : 'Link'}
                                        </a>
                                      )}
                                    </div>
                                  </Card>
                                ))}
                              </div>
                              <Card className="p-4 h-fit sticky top-6">
                                <h4 className="text-sm font-bold mb-3" style={{ color: '#fafafa' }}>Studies by Category</h4>
                                <div className="space-y-2">
                                  {(report.clinicalStudyCategoryCounts ?? [])
                                    .sort((a, b) => b.count - a.count)
                                    .map((cat) => (
                                      <div key={cat.category} className="flex items-center justify-between">
                                        <span className="text-xs" style={{ color: T.zinc }}>{cat.category}</span>
                                        <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>{cat.count}</span>
                                      </div>
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.border}` }}>
                                  <span className="text-xs font-semibold" style={{ color: T.zinc }}>Total</span>
                                  <span className="text-xs font-bold" style={{ color: '#fafafa' }}>{(report.clinicalStudies ?? []).length}</span>
                                </div>
                              </Card>
                            </div>
                          ) : (
                            <Card className="p-6">
                              <p className="text-sm" style={{ color: T.zinc }}>No clinical studies indexed yet for this supplement.</p>
                            </Card>
                          )}
                        </TabsPrimitive.Content>

                        {/* Sentiment tab */}
                        <TabsPrimitive.Content value="sentiment" className="mt-4">
                          <Card className="p-6">
                            <p className="text-sm" style={{ color: '#a1a1aa' }}>
                              <strong style={{ color: '#fafafa' }}>Positive:</strong> {Math.round((report.sentiment?.positive ?? 0) * 100)}%&nbsp;&nbsp;
                              <strong style={{ color: '#fafafa' }}>Neutral:</strong> {Math.round((report.sentiment?.neutral ?? 0) * 100)}%&nbsp;&nbsp;
                              <strong style={{ color: '#fafafa' }}>Negative:</strong> {Math.round((report.sentiment?.negative ?? 0) * 100)}%
                            </p>
                          </Card>
                        </TabsPrimitive.Content>
                      </TabsPrimitive.Root>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              DOSAGE VIEW
          ════════════════════════════════════════════════ */}
          {activeView === 'dosage' && (
            <div className="space-y-6">
              <h2 className="text-[28px] font-extrabold tracking-[-0.6px]" style={{ color: '#fafafa' }}>Dosage</h2>
              <Card className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input type="number" placeholder="Weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
                </div>
                <div className="mt-4 flex gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                      style={{
                        background: gender === g ? T.accentDim : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${gender === g ? 'rgba(6,214,160,0.25)' : T.border}`,
                        color: gender === g ? T.accent : T.zinc,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </Card>
              {!report && (
                <Card className="p-6">
                  <p className="text-sm" style={{ color: T.zinc }}>
                    Analyze a supplement in{' '}
                    <button onClick={() => setActiveView('research')} className="underline underline-offset-2" style={{ color: T.accent }}>
                      Research Core
                    </button>{' '}
                    first to see personalized dosage data.
                  </p>
                </Card>
              )}
              {report && (
                <>
                  {report.dosage && (
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#fafafa' }}>Dosage — {report.name ?? report.subject}</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                          <span className="text-sm" style={{ color: T.zinc }}>Maintenance</span>
                          <span className="text-sm font-medium text-right max-w-[60%]" style={{ color: '#fafafa' }}>{report.dosage.maintenance}</span>
                        </div>
                        {report.dosage.loading && (
                          <div className="flex justify-between items-start pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                            <span className="text-sm" style={{ color: T.zinc }}>Loading phase</span>
                            <span className="text-sm font-medium text-right max-w-[60%]" style={{ color: '#fafafa' }}>{report.dosage.loading}</span>
                          </div>
                        )}
                        {report.dosage.formula && (
                          <div className="flex justify-between items-start pb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
                            <span className="text-sm" style={{ color: T.zinc }}>Formula</span>
                            <span className="text-sm text-right max-w-[60%]" style={{ color: T.accent, fontFamily: 'var(--font-geist-mono), monospace' }}>{report.dosage.formula}</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                  {(report.schedule ?? []).length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#fafafa' }}>Schedule</h3>
                      <div className="space-y-3">
                        {(report.schedule ?? []).map((block, i) => (
                          <div key={i} className="p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                            <p className="font-semibold" style={{ color: '#fafafa' }}>{block.time} — {block.title}</p>
                            <p className="text-xs mt-1" style={{ color: T.zinc }}>{block.context}</p>
                            {block.caution && <p className="text-xs mt-1" style={{ color: T.amber }}>{block.caution}</p>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {(report.topBrands ?? []).length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#fafafa' }}>Top Brands</h3>
                      <div className="space-y-3">
                        {(report.topBrands ?? []).map((brand, i) => (
                          <div key={i} className="flex items-start justify-between p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                            <div>
                              <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>{brand.name}</p>
                              <p className="text-xs mt-1" style={{ color: T.zinc }}>{brand.why}</p>
                            </div>
                            {brand.link && <a href={brand.link} target="_blank" rel="noreferrer" className="text-xs underline shrink-0 ml-4" style={{ color: T.accent }}>Source</a>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {(report.conflicts ?? []).length > 0 && (
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4" style={{ color: T.amber }}>Conflicts</h3>
                      <div className="space-y-3">
                        {(report.conflicts ?? []).map((c, i) => (
                          <div key={i} className="p-3 rounded-xl" style={{ border: `1px solid rgba(251,191,36,0.15)`, background: 'rgba(251,191,36,0.04)' }}>
                            <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>
                              {c.supplementA} + {c.supplementB}{' '}
                              <Badge className="ml-2" style={{ background: 'rgba(251,191,36,0.15)', color: T.amber, borderColor: 'rgba(251,191,36,0.25)' }}>{c.severity}</Badge>
                            </p>
                            <p className="text-xs mt-1" style={{ color: T.zinc }}>{c.mechanism}</p>
                            {c.minSpacingHours && <p className="text-xs mt-1" style={{ color: T.amber }}>Space by {c.minSpacingHours}h+</p>}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                  {report.commerce && (
                    <Card className="p-6">
                      <h3 className="text-lg font-bold mb-4" style={{ color: '#fafafa' }}>Where to Buy</h3>
                      <div className="flex items-center justify-between p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>{report.commerce.product}</p>
                          <p className="text-xs mt-1" style={{ color: T.zinc }}>{report.commerce.retailer}{report.commerce.price ? ` — ${report.commerce.price}` : ''}</p>
                        </div>
                        <a href={report.commerce.affiliateLink} target="_blank" rel="noreferrer" className="text-sm px-4 py-2 rounded-xl transition-all duration-200" style={{ color: T.accent, border: `1px solid rgba(6,214,160,0.2)` }}>View</a>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════════════
              SCHEDULER VIEW
          ════════════════════════════════════════════════ */}
          {activeView === 'scheduler' && (
            <div className="space-y-6">
              <h2 className="text-[28px] font-extrabold tracking-[-0.6px]" style={{ color: '#fafafa' }}>Scheduler</h2>
              <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
                <Card className="p-6">
                  <div className="flex gap-2 mb-4">
                    <SupplementAutocomplete
                      value={schedulerInput}
                      onChange={setSchedulerInput}
                      onSelect={(v) => {
                        if (v.trim() && !schedulerSupplements.includes(v.trim())) setSchedulerSupplements((p) => [...p, v.trim()]);
                        setSchedulerInput('');
                      }}
                      placeholder="Add supplement"
                      dictionary={supplementDictionary}
                    />
                    <Button
                      onClick={() => {
                        if (schedulerInput.trim() && !schedulerSupplements.includes(schedulerInput.trim())) setSchedulerSupplements((p) => [...p, schedulerInput.trim()]);
                        setSchedulerInput('');
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button variant="primary" onClick={triggerScheduler} disabled={schedulerLoading}>
                      {schedulerLoading ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                  {schedulerError && <p className="text-xs mb-3" style={{ color: T.rose }}>{schedulerError}</p>}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {schedulerSupplements.map((s, i) => (
                      <Badge key={i} style={{ background: 'rgba(255,255,255,0.06)', color: '#fafafa', borderColor: T.border }}>
                        {s}
                      </Badge>
                    ))}
                  </div>
                  {(schedulerResult?.warnings ?? []).length > 0 && (
                    <div className="space-y-2 mb-4">
                      {(schedulerResult?.warnings ?? []).map((w, i) => (
                        <div key={i} className="p-3 rounded-xl text-xs" style={{ border: '1px solid rgba(251,113,133,0.2)', background: 'rgba(251,113,133,0.07)', color: '#a1a1aa' }}>
                          <span className="uppercase font-semibold" style={{ color: T.rose }}>{w.type} &bull; {w.severity}</span>
                          <p className="mt-1">{w.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="space-y-3">
                    {(schedulerResult?.blocks ?? []).map((b, i) => (
                      <div key={i} className="p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                        <p className="font-semibold" style={{ color: '#fafafa' }}>{b.time} — {b.title}</p>
                        <p className="text-xs" style={{ color: T.zinc }}>{b.context}</p>
                        <p className="text-xs mt-1" style={{ color: '#a1a1aa' }}>{b.supplements.join(' + ')}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 h-fit">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-lg font-bold" style={{ color: '#fafafa' }}>Daily Routine</h3>
                      <p className="text-xs mt-1" style={{ color: T.zinc }}>Optional — used for schedule personalization.</p>
                    </div>
                    <User className="w-5 h-5 flex-shrink-0" style={{ color: T.accent }} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Wake up',   val: wakeTime,      set: setWakeTime },
                      { label: 'Breakfast', val: breakfastTime, set: setBreakfastTime },
                      { label: 'Lunch',     val: lunchTime,     set: setLunchTime },
                      { label: 'Dinner',    val: dinnerTime,    set: setDinnerTime },
                    ].map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="block text-xs mb-2" style={{ color: T.zinc }}>{label}</label>
                        <Input type="time" value={val} onChange={(e) => set(e.target.value)} />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="block text-xs mb-2" style={{ color: T.zinc }}>Bedtime</label>
                      <Input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl p-4" style={{ border: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: '#fafafa' }}>Intermittent fasting?</p>
                        <p className="text-xs mt-0.5" style={{ color: T.zinc }}>Optional eating-window metadata.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={intermittentFasting}
                        onChange={(e) => setIntermittentFasting(e.target.checked)}
                        className="h-4 w-4"
                        style={{ accentColor: T.accent }}
                      />
                    </label>
                    {intermittentFasting && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div>
                          <label className="block text-xs mb-2" style={{ color: T.zinc }}>Fasting starts</label>
                          <Input type="time" value={fastingStart} onChange={(e) => setFastingStart(e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs mb-2" style={{ color: T.zinc }}>Fasting ends</label>
                          <Input type="time" value={fastingEnd} onChange={(e) => setFastingEnd(e.target.value)} />
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Bottom Tab Bar (mobile only, <768px) ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 flex md:hidden z-50"
        style={{
          background: 'rgba(17,17,19,0.92)',
          borderTop: `1px solid ${T.border}`,
          backdropFilter: 'blur(40px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(40px) saturate(1.2)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {([
          { id: 'research',  label: 'Research', icon: <FlaskConical className="w-5 h-5" /> },
          { id: 'catalog',   label: 'Catalog',  icon: <LayoutGrid className="w-5 h-5" /> },
          { id: 'dosage',    label: 'Dosage',   icon: <Activity className="w-5 h-5" /> },
          { id: 'scheduler', label: 'Schedule', icon: <Calendar className="w-5 h-5" /> },
        ] as const).map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200"
              style={{ color: active ? T.accent : T.zinc, minHeight: 56 }}
            >
              {item.icon}
              <span className="text-[10px] font-semibold tracking-[0.2px]">{item.label}</span>
              {active && (
                <span
                  className="absolute top-0 block h-[2px] w-8 rounded-full"
                  style={{ background: T.accent, boxShadow: `0 0 8px ${T.accentGlow}` }}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
