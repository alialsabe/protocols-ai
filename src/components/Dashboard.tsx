"use client";
import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { Search, FlaskConical, Activity, Calendar, Fingerprint, Plus, Pill, User } from 'lucide-react';
import type { Biometrics, ProtocolReport, SchedulerOutput } from '@/lib/protocol-types';

const Card = ({ className, children }: { className?: string; children: React.ReactNode }) => (
<div className="relative group">
<div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-emerald-500/20 rounded-2xl blur-md opacity-50 group-hover:opacity-100 transition duration-500" />
<div className={cn('relative z-10 rounded-2xl bg-[#0a0a0c] border border-white/5 shadow-2xl overflow-hidden', className)}>{children}</div>
</div>
);
const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
<input
{...props}
className={cn('flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all', props.className)}
/>
);

type ButtonVariant = 'default' | 'primary' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
children: React.ReactNode;
variant?: ButtonVariant;
};

const Button = ({ children, variant = 'default', className, ...props }: ButtonProps) => {
const base = 'inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:pointer-events-none h-12 px-6';
const variants: Record<ButtonVariant, string> = {
default: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20',
primary: 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white border border-white/10',
ghost: 'hover:bg-white/5 text-slate-300 hover:text-white shadow-none h-10 px-4',
};
return <button className={cn(base, variants[variant], className)} {...props}>{children}</button>;
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
children: React.ReactNode;
};

const Badge = ({ children, className, ...props }: BadgeProps) => (
<span className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', className)} {...props}>{children}</span>
);
const SUPPLEMENT_DICTIONARY = [
  // Original 10
  'Magnesium Glycinate', 'Creatine Monohydrate', 'Vitamin D3', 'Vitamin K2 (MK-7)',
  'Omega-3 Fish Oil (EPA/DHA)', 'Zinc Picolinate', 'L-Theanine', 'Ashwagandha KSM-66',
  'CoQ10 (Ubiquinol)', 'Iron (Ferrous Bisglycinate)',
  // Expanded 10
  'Vitamin C (Ascorbic Acid)', 'Vitamin B12 (Methylcobalamin)', 'NAC (N-Acetyl Cysteine)',
  'Berberine HCl', "Lion's Mane Mushroom", 'Melatonin', 'Rhodiola Rosea', 'Collagen Peptides',
  'Boron', 'Turkey Tail Mushroom',
];

type SupplementAutocompleteProps = {
value: string;
onChange: (value: string) => void;
onSelect?: (value: string) => void;
placeholder?: string;
className?: string;
inputClassName?: string;
icon?: React.ReactNode;
};

const SupplementAutocomplete = ({ value, onChange, onSelect, placeholder, className, inputClassName, icon }: SupplementAutocompleteProps) => {
const [show, setShow] = React.useState(false);
const filtered = React.useMemo(() => {
if (!value) return [];
return SUPPLEMENT_DICTIONARY.filter((s) => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
}, [value]);
return (
<div className={cn('relative w-full flex items-center', className)}>
{icon}
<Input
placeholder={placeholder}
className={cn('w-full relative z-10', inputClassName)}
value={value}
onChange={(e) => { onChange(e.target.value); setShow(true); }}
onFocus={() => setShow(true)}
onBlur={() => setTimeout(() => setShow(false), 200)}
onKeyDown={(e) => {
if (e.key === 'Enter') {
e.preventDefault();
setShow(false);
if (onSelect) onSelect(value);
}
}}
/>
{show && filtered.length > 0 && (
<div className="absolute top-full left-0 mt-2 w-full bg-[#121214] border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto">
{filtered.map((suggestion, idx) => (
<div
key={idx}
className="px-4 py-3 hover:bg-white/5 cursor-pointer text-slate-300 text-sm border-b border-white/5 last:border-0"
onMouseDown={(e) => {
e.preventDefault();
onChange(suggestion);
setShow(false);
if (onSelect) onSelect(suggestion);
}}
>
{suggestion}
</div>
))}
</div>
)}
</div>
);
};
export default function Dashboard() {
const [activeView, setActiveView] = React.useState<'research' | 'dosage' | 'scheduler'>('research');
const [searchQuery, setSearchQuery] = React.useState('');
const [hasSearched, setHasSearched] = React.useState(false);
const [report, setReport] = React.useState<ProtocolReport | null>(null);
const [loading, setLoading] = React.useState(false);
const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
const [runtimeMs, setRuntimeMs] = React.useState<number | null>(null);
const [weight, setWeight] = React.useState('');
const [age, setAge] = React.useState('');
const [gender, setGender] = React.useState<Biometrics['sex']>('male');
const [schedulerInput, setSchedulerInput] = React.useState('');
const [schedulerSupplements, setSchedulerSupplements] = React.useState<string[]>(['Vitamin D3', 'Magnesium Glycinate', 'Iron', 'Melatonin', 'Boron']);
const [schedulerResult, setSchedulerResult] = React.useState<SchedulerOutput | null>(null);
const [schedulerLoading, setSchedulerLoading] = React.useState(false);
const [schedulerError, setSchedulerError] = React.useState<string | null>(null);
const [wakeTime, setWakeTime] = React.useState('');
const [breakfastTime, setBreakfastTime] = React.useState('');
const [lunchTime, setLunchTime] = React.useState('');
const [dinnerTime, setDinnerTime] = React.useState('');
const [bedTime, setBedTime] = React.useState('');
const [intermittentFasting, setIntermittentFasting] = React.useState(false);
const [fastingStart, setFastingStart] = React.useState('');
const [fastingEnd, setFastingEnd] = React.useState('');
const triggerAnalysis = async (queryOverride?: string) => {
const q = (queryOverride ?? searchQuery).trim();
if (!q) return setErrorMsg('Enter a supplement to analyze.');
setLoading(true);
setErrorMsg(null);
setReport(null);
setHasSearched(false);
try {
const response = await fetch('/api/protocols', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ query: q, biometrics: { weightKg: weight ? Number(weight) : undefined, age: age ? Number(age) : undefined, sex: gender } }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok) {
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
const triggerScheduler = async () => {
if (!schedulerSupplements.length) return setSchedulerError('Add at least one supplement.');
setSchedulerLoading(true);
setSchedulerError(null);
try {
const hasRoutineInput = [wakeTime, breakfastTime, lunchTime, dinnerTime, bedTime, fastingStart, fastingEnd].some(Boolean) || intermittentFasting;
const routine = hasRoutineInput ? {
wakeTime: wakeTime || '07:00',
sleepTime: bedTime || '23:00',
meals: {
breakfast: breakfastTime || '08:00',
lunch: lunchTime || '12:30',
dinner: dinnerTime || '18:30',
},
intermittentFasting,
fastingWindowStart: intermittentFasting ? (fastingStart || undefined) : undefined,
fastingWindowEnd: intermittentFasting ? (fastingEnd || undefined) : undefined,
} : undefined;
const response = await fetch('/api/scheduler', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ supplements: schedulerSupplements, routine }),
});
const data = await response.json().catch(() => ({}));
if (!response.ok) throw new Error(data?.error ?? 'Unable to generate schedule.');
setSchedulerResult(data.schedule ?? null);
} catch (err) {
setSchedulerError(err instanceof Error ? err.message : 'Failed to generate schedule.');
} finally {
setSchedulerLoading(false);
}
};
return (
<div className="min-h-screen bg-[#050505] text-slate-200 font-sans flex overflow-hidden">
<aside className="w-64 border-r border-white/5 bg-[#0a0a0c] flex flex-col z-20">
<div className="h-20 flex items-center px-6 border-b border-white/5">
<Fingerprint className="w-6 h-6 text-cyan-400 mr-3" />
<h1 className="text-xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">Protocols.ai</h1>
</div>
<nav className="flex-1 p-4 space-y-2">
<button onClick={() => setActiveView('research')} className={cn('w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium', activeView === 'research' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white')}><FlaskConical className="w-4 h-4 mr-3" />Research Core</button>
<button onClick={() => setActiveView('dosage')} className={cn('w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium', activeView === 'dosage' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white')}><Activity className="w-4 h-4 mr-3" />Dosage</button>
<button onClick={() => setActiveView('scheduler')} className={cn('w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium', activeView === 'scheduler' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white')}><Calendar className="w-4 h-4 mr-3" />Scheduler</button>
</nav>
</aside>
<main className="flex-1 overflow-y-auto p-10 max-w-6xl mx-auto w-full">
{activeView === 'research' && (
<div className="space-y-6">
<header><h2 className="text-3xl font-bold text-white">Research Core</h2></header>
<div className="relative flex items-center">
<SupplementAutocomplete value={searchQuery} onChange={setSearchQuery} onSelect={(v: string) => triggerAnalysis(v)} placeholder="Query supplement..." inputClassName="pl-12 h-16 text-lg rounded-2xl bg-[#0a0a0c] border-white/10 pr-32" icon={<Search className="absolute left-4 w-5 h-5 text-cyan-400 z-20 pointer-events-none" />} />
<Button className="absolute right-2 h-12 z-20" variant="primary" onClick={() => triggerAnalysis()} disabled={loading}>{loading ? 'Analyzing...' : 'Analyze'}</Button>
</div>
{errorMsg && <p className="text-sm text-rose-400">{errorMsg}</p>}
{loading && !report && (
<div className="flex items-center justify-center py-20">
<div className="flex flex-col items-center gap-4">
<div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
<p className="text-sm text-slate-400">Analyzing supplement data...</p>
</div>
</div>
)}
{report && runtimeMs !== null && <p className="text-xs text-slate-500">Runtime: {runtimeMs.toFixed(0)} ms</p>}
{hasSearched && report && (
<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
<Card className="p-4 h-fit sticky top-6">
<h3 className="text-sm font-bold text-white mb-2">Common Stack Partners</h3>
<p className="text-[11px] text-slate-400 mb-3">Commonly taken together with this supplement.</p>
<div className="space-y-2">
{(report.companionSuggestions || []).map((item) => (
<button key={item.supplement} onClick={() => triggerAnalysis(item.supplement)} className="w-full text-left p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10">
<p className="text-sm text-white font-semibold">{item.supplement}</p>
<p className="text-[11px] text-slate-400 mt-1">• {item.why}</p>
</button>
))}
{!(report.companionSuggestions || []).length && <p className="text-xs text-slate-500">No pairings mapped yet.</p>}
</div>
</Card>
<TabsPrimitive.Root defaultValue="science" className="flex flex-col w-full">
<TabsPrimitive.List className="flex border-b border-white/10 mb-6">
<TabsPrimitive.Trigger value="science" className="px-6 py-3 text-sm font-semibold text-slate-400 data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400">Science</TabsPrimitive.Trigger>
<TabsPrimitive.Trigger value="sentiment" className="px-6 py-3 text-sm font-semibold text-slate-400 data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400">Sentiment</TabsPrimitive.Trigger>
</TabsPrimitive.List>
<TabsPrimitive.Content value="science" className="space-y-4">
<Card className="p-6">
<h3 className="text-xl font-bold text-white mb-2">{report.name || report.subject}</h3>
<p className="text-slate-400 text-sm mb-4">{report.science?.summary || report.summary}</p>
<div className="space-y-2">
{(report.science?.findings || []).map((f) => (
<div key={f.title || f.claim} className="border border-white/5 rounded-xl p-3 bg-white/5">
<p className="text-sm font-semibold text-white">{f.title || f.claim}</p>
<p className="text-xs text-slate-400">{f.detail || f.context}</p>
{(f.citation || f.publishedDate || f.link) && (
                              <p className="text-[10px] text-slate-500 mt-1">
                                {f.citation ? `${f.citation} • ` : ''}
                                {f.publishedDate ? `Published: ${f.publishedDate} • ` : ''}
                                {f.link ? <a className="text-cyan-400 underline" href={f.link} target="_blank" rel="noreferrer">Study Link</a> : null}
                              </p>
                            )}
</div>
))}
</div>
</Card>
<Card className="p-4 bg-amber-500/5 border-amber-500/20">
<h4 className="flex items-center text-sm font-bold text-amber-300 mb-2"><Pill className="w-4 h-4 mr-2" />Medicine Interactions</h4>
<div className="space-y-2">
{(report.medicineInteractions || []).map((m) => (
<div key={`${m.medicineName}-${m.severity}`} className="text-xs text-slate-300 border border-white/5 rounded-lg p-3 bg-black/30">
<p><strong className="text-white">{m.medicineName}</strong> — <span className="uppercase text-amber-300">{m.severity}</span></p>
<p className="text-slate-400 mt-1">{m.mechanism}</p>
<p className="text-slate-500 mt-1">{m.recommendation}</p>
</div>
))}
</div>
</Card>
</TabsPrimitive.Content>
<TabsPrimitive.Content value="sentiment">
<Card className="p-6">
<p className="text-sm text-slate-400">
<strong className="text-white">Positive:</strong> {Math.round((report.sentiment?.positive || 0) * 100)}% &nbsp;|
<strong className="text-white"> Neutral:</strong> {Math.round((report.sentiment?.neutral || 0) * 100)}% &nbsp;|
<strong className="text-white"> Negative:</strong> {Math.round((report.sentiment?.negative || 0) * 100)}%
</p>
</Card>
</TabsPrimitive.Content>
</TabsPrimitive.Root>
</div>
)}
</div>
)}
{activeView === 'dosage' && (
<div className="space-y-6">
<h2 className="text-3xl font-bold text-white">Dosage</h2>
<Card className="p-6">
<div className="grid grid-cols-2 gap-4">
<Input type="number" placeholder="Weight kg" value={weight} onChange={(e) => setWeight(e.target.value)} />
<Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} />
</div>
<div className="mt-4 flex gap-2">
<button onClick={() => setGender('male')} className={cn('px-3 py-2 rounded', gender === 'male' ? 'bg-cyan-500/20' : 'bg-black/40')}>Male</button>
<button onClick={() => setGender('female')} className={cn('px-3 py-2 rounded', gender === 'female' ? 'bg-cyan-500/20' : 'bg-black/40')}>Female</button>
</div>
</Card>
</div>
)}
{activeView === 'scheduler' && (
<div className="space-y-6">
<h2 className="text-3xl font-bold text-white">Scheduler</h2>
<div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
<Card className="p-6">
<div className="flex gap-2 mb-4">
<SupplementAutocomplete value={schedulerInput} onChange={setSchedulerInput} onSelect={(v: string) => { if (v.trim() && !schedulerSupplements.includes(v.trim())) setSchedulerSupplements((p) => [...p, v.trim()]); setSchedulerInput(''); }} placeholder="Add supplement" />
<Button onClick={() => { if (schedulerInput.trim() && !schedulerSupplements.includes(schedulerInput.trim())) setSchedulerSupplements((p) => [...p, schedulerInput.trim()]); setSchedulerInput(''); }}><Plus className="w-4 h-4" /></Button>
<Button variant="primary" onClick={triggerScheduler} disabled={schedulerLoading}>{schedulerLoading ? 'Generating...' : 'Generate'}</Button>
</div>
{schedulerError && <p className="text-xs text-rose-400 mb-3">{schedulerError}</p>}
<div className="flex flex-wrap gap-2 mb-4">{schedulerSupplements.map((s, i) => <Badge key={i} className="bg-white/10 text-white border-white/20">{s}</Badge>)}</div>
{schedulerResult?.warnings?.length ? (
<div className="space-y-2 mb-4">
{schedulerResult.warnings.map((w, i) => (
<div key={i} className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-slate-300">
<span className="uppercase text-red-300 font-semibold">{w.type} • {w.severity}</span>
<p className="mt-1">{w.message}</p>
</div>
))}
</div>
) : null}
<div className="space-y-3">
{(schedulerResult?.blocks || []).map((b, i) => (
<div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10">
<p className="font-semibold text-white">{b.time} — {b.title}</p>
<p className="text-xs text-slate-400">{b.context}</p>
<p className="text-xs text-slate-300 mt-1">{b.supplements.join(' + ')}</p>
</div>
))}
</div>
</Card>
<Card className="p-6 h-fit">
<div className="flex items-start justify-between gap-4 mb-4">
<div>
<h3 className="text-lg font-bold text-white">Daily Routine (optional)</h3>
<p className="text-xs text-slate-400 mt-1">Use this now for schedule personalization. Later this becomes the basis for mobile reminders and notifications.</p>
</div>
<User className="w-5 h-5 text-cyan-400 shrink-0" />
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
<div>
<label className="block text-xs text-slate-400 mb-2">Wake up</label>
<Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} />
</div>
<div>
<label className="block text-xs text-slate-400 mb-2">Breakfast</label>
<Input type="time" value={breakfastTime} onChange={(e) => setBreakfastTime(e.target.value)} />
</div>
<div>
<label className="block text-xs text-slate-400 mb-2">Lunch</label>
<Input type="time" value={lunchTime} onChange={(e) => setLunchTime(e.target.value)} />
</div>
<div>
<label className="block text-xs text-slate-400 mb-2">Dinner</label>
<Input type="time" value={dinnerTime} onChange={(e) => setDinnerTime(e.target.value)} />
</div>
<div className="sm:col-span-2">
<label className="block text-xs text-slate-400 mb-2">Bedtime</label>
<Input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} />
</div>
</div>
<div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
<label className="flex items-center justify-between gap-3 cursor-pointer">
<div>
<p className="text-sm font-semibold text-white">Intermittent fasting?</p>
<p className="text-xs text-slate-400">Optional eating-window metadata for future reminder logic.</p>
</div>
<input type="checkbox" checked={intermittentFasting} onChange={(e) => setIntermittentFasting(e.target.checked)} className="h-4 w-4 accent-cyan-500" />
</label>
{intermittentFasting && (
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
<div>
<label className="block text-xs text-slate-400 mb-2">Fasting starts</label>
<Input type="time" value={fastingStart} onChange={(e) => setFastingStart(e.target.value)} />
</div>
<div>
<label className="block text-xs text-slate-400 mb-2">Fasting ends</label>
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
);
}
