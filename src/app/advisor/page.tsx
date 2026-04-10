"use client";
import React from 'react';
import { Plus, User, Clock, AlertTriangle } from 'lucide-react';
import { T } from '@/lib/design-tokens';
import { Card, Button, Input, SectionLabel } from '@/components/shared/Primitives';
import { SupplementAutocomplete, useSupplementDictionary } from '@/components/shared/SupplementAutocomplete';
import type { SchedulerOutput } from '@/lib/protocol-types';

export default function AdvisorPage() {
  const dictionary = useSupplementDictionary();

  // Supplement stack
  const [input, setInput] = React.useState('');
  const [supplements, setSupplements] = React.useState<string[]>([
    'Vitamin D3', 'Magnesium Glycinate', 'Iron', 'Melatonin', 'Boron',
  ]);

  // Routine
  const [wakeTime, setWakeTime] = React.useState('');
  const [breakfastTime, setBreakfastTime] = React.useState('');
  const [lunchTime, setLunchTime] = React.useState('');
  const [dinnerTime, setDinnerTime] = React.useState('');
  const [bedTime, setBedTime] = React.useState('');
  const [intermittentFasting, setIntermittentFasting] = React.useState(false);
  const [fastingStart, setFastingStart] = React.useState('');
  const [fastingEnd, setFastingEnd] = React.useState('');

  // Biometrics
  const [weight, setWeight] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState<'male' | 'female'>('male');

  // Result
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

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12">
      <SectionLabel>Advisor</SectionLabel>
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2" style={{ color: T.text }}>
        Build Your Protocol
      </h1>
      <p className="text-sm mb-8" style={{ color: T.textDim }}>
        Add your supplements, optionally fill in your routine, and we'll build a timed schedule with dosage, food context, and conflict warnings.
      </p>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.9fr] gap-6">
        {/* Left: stack + schedule result */}
        <div className="space-y-6">
          {/* Supplement input */}
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>Your Supplements</h3>
            <div className="flex gap-2 mb-4">
              <SupplementAutocomplete
                value={input}
                onChange={setInput}
                onSelect={(v) => addSupplement(v)}
                placeholder="Add a supplement..."
                dictionary={dictionary}
              />
              <Button onClick={() => addSupplement()} className="shrink-0">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Pills */}
            <div className="flex flex-wrap gap-2">
              {supplements.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.06)', color: T.text, border: `1px solid ${T.border}` }}
                >
                  {s}
                  <button
                    onClick={() => removeSupplement(s)}
                    className="opacity-40 hover:opacity-100 transition-opacity"
                    style={{ color: T.text }}
                  >
                    ×
                  </button>
                </span>
              ))}
              {supplements.length === 0 && (
                <p className="text-xs" style={{ color: T.textDim }}>No supplements added yet.</p>
              )}
            </div>
          </Card>

          {/* Build button */}
          <Button
            variant="primary"
            onClick={buildSchedule}
            disabled={loading || supplements.length === 0}
            className="w-full text-sm"
          >
            {loading ? 'Building schedule...' : 'Build Schedule'}
          </Button>

          {error && (
            <p className="text-sm" style={{ color: T.rose }}>{error}</p>
          )}

          {/* Warnings */}
          {(result?.warnings ?? []).length > 0 && (
            <div className="space-y-2">
              {(result?.warnings ?? []).map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-xl text-xs"
                  style={{
                    border: `1px solid ${w.severity === 'critical' ? 'rgba(251,113,133,0.2)' : 'rgba(251,191,36,0.2)'}`,
                    background: w.severity === 'critical' ? 'rgba(251,113,133,0.05)' : 'rgba(251,191,36,0.05)',
                  }}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: w.severity === 'critical' ? T.rose : T.amber }} />
                  <div>
                    <span className="uppercase font-semibold" style={{ color: w.severity === 'critical' ? T.rose : T.amber }}>
                      {w.type} · {w.severity}
                    </span>
                    <p className="mt-1" style={{ color: T.textMuted }}>{w.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Schedule result */}
          {(result?.blocks ?? []).length > 0 && (
            <Card className="p-5" hover={false}>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-2" style={{ color: T.text }}>
                <Clock className="w-4 h-4" style={{ color: T.accent }} />
                Your Daily Schedule
              </h3>
              <div className="space-y-3">
                {(result?.blocks ?? []).map((b, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-bold" style={{ color: T.accent }}>{b.time}</span>
                      <span className="text-sm font-semibold" style={{ color: T.text }}>{b.title}</span>
                    </div>
                    <p className="text-xs" style={{ color: T.textDim }}>{b.context}</p>
                    <p className="text-xs mt-1" style={{ color: T.textMuted }}>{b.supplements.join(' + ')}</p>
                    {b.caution && (
                      <p className="text-xs mt-1 font-medium" style={{ color: T.amber }}>{b.caution}</p>
                    )}
                  </div>
                ))}
              </div>
              {result?.generatedAt && (
                <p className="text-[10px] mt-3 font-mono" style={{ color: T.textFaint }}>
                  Generated: {new Date(result.generatedAt).toLocaleString()}
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Right: routine + biometrics */}
        <div className="space-y-6">
          {/* Daily routine */}
          <Card className="p-5" hover={false}>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: T.text }}>Daily Routine</h3>
                <p className="text-xs mt-0.5" style={{ color: T.textDim }}>Optional. Used for schedule personalization.</p>
              </div>
              <User className="w-4 h-4 shrink-0" style={{ color: T.accent }} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Wake up', val: wakeTime, set: setWakeTime },
                { label: 'Breakfast', val: breakfastTime, set: setBreakfastTime },
                { label: 'Lunch', val: lunchTime, set: setLunchTime },
                { label: 'Dinner', val: dinnerTime, set: setDinnerTime },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>{label}</label>
                  <Input type="time" value={val} onChange={(e) => set(e.target.value)} className="h-10 text-xs" />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>Bedtime</label>
                <Input type="time" value={bedTime} onChange={(e) => setBedTime(e.target.value)} className="h-10 text-xs" />
              </div>
            </div>

            {/* Fasting toggle */}
            <div className="mt-4 rounded-xl p-3" style={{ border: `1px solid ${T.border}`, background: T.surface }}>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <div>
                  <p className="text-sm font-semibold" style={{ color: T.text }}>Intermittent fasting?</p>
                  <p className="text-[11px] mt-0.5" style={{ color: T.textDim }}>Optional eating-window metadata.</p>
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
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>Fasting starts</label>
                    <Input type="time" value={fastingStart} onChange={(e) => setFastingStart(e.target.value)} className="h-10 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>Fasting ends</label>
                    <Input type="time" value={fastingEnd} onChange={(e) => setFastingEnd(e.target.value)} className="h-10 text-xs" />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Biometrics */}
          <Card className="p-5" hover={false}>
            <h3 className="text-sm font-bold mb-3" style={{ color: T.text }}>Biometrics</h3>
            <p className="text-xs mb-3" style={{ color: T.textDim }}>Optional. Affects dosage calculations.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>Weight (kg)</label>
                <Input type="number" placeholder="75" value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 text-xs" />
              </div>
              <div>
                <label className="block text-[11px] mb-1.5 font-medium" style={{ color: T.textDim }}>Age</label>
                <Input type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} className="h-10 text-xs" />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              {(['male', 'female'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 flex-1"
                  style={{
                    background: gender === g ? T.accentDim : T.surface,
                    border: `1px solid ${gender === g ? T.borderAccent : T.border}`,
                    color: gender === g ? T.accent : T.textDim,
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
