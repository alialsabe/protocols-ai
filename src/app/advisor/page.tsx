"use client";
import React from 'react';
import { Plus, Clock, AlertTriangle, Zap, Trash2 } from 'lucide-react';
import { T } from '@/lib/design-tokens';
import { Button, Input } from '@/components/shared/Primitives';
import { SupplementAutocomplete, useSupplementDictionary } from '@/components/shared/SupplementAutocomplete';
import type { SchedulerOutput } from '@/lib/protocol-types';

export default function AdvisorPage() {
  const dictionary = useSupplementDictionary();

  const [input, setInput] = React.useState('');
  const [supplements, setSupplements] = React.useState<string[]>([
    'Vitamin D3', 'Magnesium Glycinate', 'Iron', 'Melatonin', 'Boron',
  ]);

  const [wakeTime, setWakeTime] = React.useState('');
  const [breakfastTime, setBreakfastTime] = React.useState('');
  const [lunchTime, setLunchTime] = React.useState('');
  const [dinnerTime, setDinnerTime] = React.useState('');
  const [bedTime, setBedTime] = React.useState('');
  const [intermittentFasting, setIntermittentFasting] = React.useState(false);
  const [fastingStart, setFastingStart] = React.useState('');
  const [fastingEnd, setFastingEnd] = React.useState('');

  const [weight, setWeight] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');

  const [result, setResult] = React.useState<SchedulerOutput | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addSupplement = (name?: string) => {
    const val = (name ?? input).trim();
    if (val && !supplements.includes(val)) {
      setSupplements((p) => [...p, val]);
    }
    setInput('');
  };

  const removeSupplement = (name: string) => {
    setSupplements((p) => p.filter((s) => s !== name));
  };

  const buildSchedule = async () => {
    if (!supplements.length) return setError('Add at least one supplement.');
    setLoading(true);
    setError(null);
    try {
      const hasRoutine = [wakeTime, breakfastTime, lunchTime, dinnerTime, bedTime, fastingStart, fastingEnd].some(Boolean) || intermittentFasting;
      const routine = hasRoutine ? {
        wakeTime: wakeTime || '07:00',
        sleepTime: bedTime || '23:00',
        meals: { breakfast: breakfastTime || '08:00', lunch: lunchTime || '12:30', dinner: dinnerTime || '18:30' },
        intermittentFasting,
        fastingWindowStart: intermittentFasting ? (fastingStart || undefined) : undefined,
        fastingWindowEnd: intermittentFasting ? (fastingEnd || undefined) : undefined,
      } : undefined;

      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplements, routine }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? 'Unable to generate schedule.');
      setResult(data.schedule ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule.');
    } finally {
      setLoading(false);
    }
  };

  const blockColors = ['#adc6ff', '#c0c1ff', '#ffb786', '#ddc39d'];

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-8 py-8 md:py-12 pt-20 md:pt-24">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1
            className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
            style={{ color: T.text, letterSpacing: '-0.02em' }}
          >
            Advisor Dashboard
          </h1>
          <p className="text-sm max-w-xl" style={{ color: T.textDim }}>
            Configure your supplementation protocol and daily routine to generate an optimized clinical timeline.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={buildSchedule}
          disabled={loading || supplements.length === 0}
          className="shrink-0 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {loading ? 'Generating...' : 'Generate Schedule'}
        </Button>
      </div>

      {error && (
        <p className="text-sm mb-6" style={{ color: T.error }}>{error}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main input area */}
        <div className="lg:col-span-8 space-y-6">
          {/* Supplement Protocol */}
          <div className="glass-panel p-8" style={{ borderRadius: 4 }}>
            <h2 className="text-base font-bold mb-6 flex items-center gap-2" style={{ color: T.text }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.textDim }}>
                Supplement Protocol
              </span>
            </h2>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <SupplementAutocomplete
                value={input}
                onChange={setInput}
                onSelect={(v) => addSupplement(v)}
                placeholder="Add supplement (e.g. Rhodiola Rosea, L-Theanine)..."
                dictionary={dictionary}
              />
              <Button onClick={() => addSupplement()} className="shrink-0 h-12 w-12 px-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Supplement list */}
            <div className="space-y-2">
              {supplements.map((s) => (
                <div
                  key={s}
                  className="flex items-center justify-between p-4 transition-colors duration-150"
                  style={{ background: T.surface, borderRadius: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.primary }} />
                    <span className="text-sm font-bold" style={{ color: T.text }}>{s}</span>
                  </div>
                  <button
                    onClick={() => removeSupplement(s)}
                    className="p-1 transition-colors hover:opacity-80"
                    style={{ color: T.textDim }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {supplements.length === 0 && (
                <p className="text-xs py-4" style={{ color: T.textDim }}>No supplements added yet.</p>
              )}
            </div>
          </div>

          {/* Circadian Rhythm */}
          <div className="glass-panel p-8" style={{ borderRadius: 4 }}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-6" style={{ color: T.textDim }}>
              Circadian Rhythm & Daily Routine
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Wake Cycle', val: wakeTime, set: setWakeTime },
                { label: 'Breakfast', val: breakfastTime, set: setBreakfastTime },
                { label: 'Lunch', val: lunchTime, set: setLunchTime },
                { label: 'Dinner', val: dinnerTime, set: setDinnerTime },
                { label: 'Rest Cycle', val: bedTime, set: setBedTime },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label
                    className="block text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: T.outline }}
                  >
                    {label}
                  </label>
                  <Input type="time" value={val} onChange={(e) => set(e.target.value)} className="h-11 text-sm" />
                </div>
              ))}
            </div>

            {/* Fasting toggle */}
            <div className="mt-6 p-4" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 4 }}>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Intermittent Fasting</p>
                  <p className="text-[10px] mt-0.5 tracking-wide" style={{ color: T.textDim }}>Configure eating window for timing optimization.</p>
                </div>
                <input
                  type="checkbox"
                  checked={intermittentFasting}
                  onChange={(e) => setIntermittentFasting(e.target.checked)}
                  className="h-4 w-4"
                  style={{ accentColor: T.primary }}
                />
              </label>
              {intermittentFasting && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.outline }}>Fast Starts</label>
                    <Input type="time" value={fastingStart} onChange={(e) => setFastingStart(e.target.value)} className="h-10 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.outline }}>Fast Ends</label>
                    <Input type="time" value={fastingEnd} onChange={(e) => setFastingEnd(e.target.value)} className="h-10 text-xs" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar — biometrics */}
        <div className="lg:col-span-4 space-y-6">
          <div
            className="glass-panel p-8 h-full"
            style={{ borderRadius: 4 }}
          >
            <h2 className="text-[10px] font-bold uppercase tracking-widest mb-8" style={{ color: T.textDim }}>
              Biometrics
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.outline }}>
                  Weight (kg)
                </label>
                <Input type="number" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-11 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.outline }}>
                  Age
                </label>
                <Input type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} className="h-11 text-sm" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: T.outline }}>
                  Biological Sex
                </label>
                <div className="flex gap-2">
                  {(['male', 'female'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGender(g)}
                      className="px-4 py-2.5 text-xs font-semibold capitalize transition-all duration-200 flex-1"
                      style={{
                        background: gender === g ? T.primaryDim : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${gender === g ? T.borderAccent : T.border}`,
                        color: gender === g ? T.primary : T.textDim,
                        borderRadius: 4,
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {(result?.warnings ?? []).length > 0 && (
        <div className="mt-8 space-y-2">
          {(result?.warnings ?? []).map((w, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-4 text-xs"
              style={{
                border: `1px solid ${w.severity === 'critical' ? 'rgba(255,180,171,0.2)' : 'rgba(255,183,134,0.2)'}`,
                background: w.severity === 'critical' ? 'rgba(255,180,171,0.05)' : 'rgba(255,183,134,0.05)',
                borderRadius: 4,
              }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: w.severity === 'critical' ? T.error : T.tertiary }} />
              <div>
                <span className="uppercase font-bold" style={{ color: w.severity === 'critical' ? T.error : T.tertiary }}>
                  {w.type} · {w.severity}
                </span>
                <p className="mt-1" style={{ color: T.textMuted }}>{w.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule output — timeline blocks */}
      {(result?.blocks ?? []).length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-black tracking-tight mb-6" style={{ color: T.text }}>
            Optimized Chrono-Protocol
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(result?.blocks ?? []).map((b, i) => {
              const accent = blockColors[i % blockColors.length];
              return (
                <div
                  key={i}
                  className="p-6 relative overflow-hidden group"
                  style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    borderLeft: `4px solid ${accent}`,
                    borderRadius: 4,
                  }}
                >
                  <span className="font-mono text-xs mb-2 block" style={{ color: accent }}>
                    {b.time}
                  </span>
                  <h3 className="font-bold text-base mb-3" style={{ color: T.text }}>{b.title}</h3>
                  <p className="text-xs mb-3" style={{ color: T.textDim }}>{b.context}</p>
                  <div className="space-y-2">
                    {b.supplements.map((s, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full" style={{ background: accent }} />
                        <span className="text-sm" style={{ color: T.text }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  {b.caution && (
                    <div
                      className="mt-4 p-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        background: 'rgba(255,180,171,0.08)',
                        border: `1px solid rgba(255,180,171,0.15)`,
                        color: T.error,
                        borderRadius: 2,
                      }}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {b.caution}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {result?.generatedAt && (
            <p className="text-[10px] mt-4 font-mono tracking-wide" style={{ color: T.outline }}>
              Generated: {new Date(result.generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
