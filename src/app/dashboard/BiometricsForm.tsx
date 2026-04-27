'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface Biometrics {
  weightKg?: number;
  heightCm?: number;
}

interface DosageEntry {
  supplementId: string;
  name: string;
  slug: string;
  perKgFactor: number;
  unit: string;
  maintenance: string;
}

export function BiometricsForm({
  biometrics,
  weightDosages,
}: {
  biometrics: Biometrics;
  weightDosages: DosageEntry[];
}) {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState<string>(
    biometrics.weightKg ? String(biometrics.weightKg) : ''
  );
  const [heightCm, setHeightCm] = useState<string>(
    biometrics.heightCm ? String(biometrics.heightCm) : ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedWeight = parseFloat(weightKg);
  const validWeight = !isNaN(parsedWeight) && parsedWeight > 0;

  async function handleSave() {
    setError(null);
    setSaving(true);
    setSaved(false);

    const body: Record<string, number> = {};
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    if (!isNaN(w) && w > 0) body.weightKg = w;
    if (!isNaN(h) && h > 0) body.heightCm = h;

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      setError('Failed to save. Please try again.');
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <section>
      <SectionLabel>Biometrics &amp; Personalized Dosage</SectionLabel>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, marginBottom: 24, lineHeight: '20px' }}>
        Enter your body weight and height. Where clinical trials used weight-based dosing, we calculate your personal range from the study data.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 420 }}>
        <Field label="Weight (kg)">
          <NumberInput
            value={weightKg}
            onChange={setWeightKg}
            placeholder="e.g. 75"
            min={20}
            max={300}
          />
        </Field>
        <Field label="Height (cm)">
          <NumberInput
            value={heightCm}
            onChange={setHeightCm}
            placeholder="e.g. 175"
            min={100}
            max={250}
          />
        </Field>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            height: 36,
            paddingInline: 20,
            borderRadius: 6,
            background: 'var(--ink)',
            color: 'var(--paper)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            opacity: saving ? 0.5 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
            border: 'none',
          }}
        >
          {saving ? 'SAVING…' : 'SAVE'}
        </button>
        {saved && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--severity-low)', letterSpacing: '0.8px' }}>
            SAVED
          </span>
        )}
        {error && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--severity-high)', letterSpacing: '0.8px' }}>
            {error}
          </span>
        )}
      </div>

      {weightDosages.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
            Personalized dosages{validWeight ? ` · ${parsedWeight} kg` : ' (enter weight to calculate)'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--rule)', borderRadius: 10, overflow: 'hidden' }}>
            {weightDosages.map((d, i) => {
              const personal = validWeight ? d.perKgFactor * parsedWeight : null;
              return (
                <div
                  key={d.supplementId}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto',
                    gap: 16,
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: i % 2 === 0 ? 'var(--paper)' : 'var(--paper-2)',
                    borderTop: i > 0 ? '1px solid var(--rule-soft)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{d.name}</span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    Standard: {d.maintenance}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      color: personal != null ? 'var(--ink)' : 'var(--ink-5)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {personal != null
                      ? `Personal: ${personal % 1 === 0 ? personal : personal.toFixed(1)} ${d.unit}/day`
                      : '— enter weight'}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 10, lineHeight: '17px' }}>
            Personalized dosages derived from weight-based protocols in clinical studies. Always consult a healthcare provider before changing your dosage.
          </p>
        </div>
      )}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        letterSpacing: '1.4px',
        textTransform: 'uppercase',
        color: 'var(--ink-4)',
        marginBottom: 0,
      }}
    >
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label
        style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          letterSpacing: '1.2px',
          textTransform: 'uppercase',
          color: 'var(--ink-4)',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  min: number;
  max: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      style={{
        height: 40,
        borderRadius: 8,
        border: '1px solid var(--rule)',
        background: 'var(--paper-2)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-mono)',
        fontSize: 14,
        padding: '0 12px',
        outline: 'none',
        width: '100%',
      }}
    />
  );
}
