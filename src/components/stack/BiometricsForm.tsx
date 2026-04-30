'use client';

import { useEffect, useRef, useState } from 'react';

const BIOMETRICS_KEY = 'protocolsai.biometrics.v1';

export interface Biometrics {
  weightKg?: number;
  heightCm?: number;
}

function readLocalBiometrics(): Biometrics {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem(BIOMETRICS_KEY) ?? '{}'); }
  catch { return {}; }
}

function writeLocalBiometrics(b: Biometrics) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(BIOMETRICS_KEY, JSON.stringify(b));
  window.dispatchEvent(new CustomEvent('biometrics:update'));
}

interface DosageEntry {
  supplementId: string;
  name: string;
  slug: string;
  perKgFactor: number;
  unit: string;
  maintenance: string;
}

interface Props {
  initialBiometrics: Biometrics;
  weightDosages: DosageEntry[];
  isAuthenticated: boolean;
}

export function BiometricsForm({ initialBiometrics, weightDosages, isAuthenticated }: Props) {
  const [weightKg, setWeightKg] = useState<string>(
    initialBiometrics.weightKg ? String(initialBiometrics.weightKg) : ''
  );
  const [heightCm, setHeightCm] = useState<string>(
    initialBiometrics.heightCm ? String(initialBiometrics.heightCm) : ''
  );
  const [hydrated, setHydrated] = useState(false);
  const [serverSaveStatus, setServerSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate from localStorage on mount. localStorage wins over server-passed
  // initialBiometrics for anonymous + multi-tab consistency. For logged-in
  // users on a fresh device, initialBiometrics from server is the seed.
  useEffect(() => {
    const local = readLocalBiometrics();
    if (local.weightKg && !weightKg) setWeightKg(String(local.weightKg));
    if (local.heightCm && !heightCm) setHeightCm(String(local.heightCm));

    if (Object.keys(local).length === 0 && (initialBiometrics.weightKg || initialBiometrics.heightCm)) {
      writeLocalBiometrics(initialBiometrics);
    }
    setHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsedWeight = parseFloat(weightKg);
  const validWeight = !isNaN(parsedWeight) && parsedWeight > 0;

  // Persist to localStorage on every change. For logged-in users, also
  // debounce-POST to the server.
  useEffect(() => {
    if (!hydrated) return;
    const w = parseFloat(weightKg);
    const h = parseFloat(heightCm);
    const next: Biometrics = {};
    if (!isNaN(w) && w > 0) next.weightKg = w;
    if (!isNaN(h) && h > 0) next.heightCm = h;
    writeLocalBiometrics(next);

    if (!isAuthenticated) return;
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(next),
        });
        setServerSaveStatus(res.ok ? 'saved' : 'error');
      } catch {
        setServerSaveStatus('error');
      }
    }, 700);
  }, [weightKg, heightCm, isAuthenticated, hydrated]);

  return (
    <section>
      <SectionLabel>Biometrics &amp; Personalised Dosing</SectionLabel>
      <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, marginBottom: 24, lineHeight: '20px' }}>
        Enter your body weight. Where clinical trials used weight-based dosing, we calculate your personal range from the study data.
        {!isAuthenticated && (
          <span style={{ display: 'block', marginTop: 6, color: 'var(--ink-4)', fontSize: 12 }}>
            Saved on this device. Sign in to sync across devices.
          </span>
        )}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 420 }}>
        <Field label="Weight (kg)">
          <NumberInput value={weightKg} onChange={setWeightKg} placeholder="e.g. 75" min={20} max={300} />
        </Field>
        <Field label="Height (cm)">
          <NumberInput value={heightCm} onChange={setHeightCm} placeholder="e.g. 175" min={100} max={250} />
        </Field>
      </div>

      {isAuthenticated && serverSaveStatus !== 'idle' && (
        <div style={{ marginTop: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.8px',
            color: serverSaveStatus === 'saved' ? 'var(--severity-low)' : 'var(--severity-high)',
          }}>
            {serverSaveStatus === 'saved' ? 'SYNCED' : 'SYNC FAILED — kept on device'}
          </span>
        </div>
      )}

      {weightDosages.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 12 }}>
            Personalised dosages{validWeight ? ` · ${parsedWeight} kg` : ' (enter weight to calculate)'}
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
                  <span style={{
                    fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 600,
                    color: personal != null ? 'var(--ink)' : 'var(--ink-5)', whiteSpace: 'nowrap',
                  }}>
                    {personal != null
                      ? `Personal: ${personal % 1 === 0 ? personal : personal.toFixed(1)} ${d.unit}/day`
                      : '— enter weight'}
                  </span>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 10, lineHeight: '17px' }}>
            Personalised dosages derived from weight-based protocols in clinical studies. Always consult a healthcare provider before changing your dosage.
          </p>
        </div>
      )}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
      letterSpacing: '1.4px', textTransform: 'uppercase', color: 'var(--ink-4)', marginBottom: 0,
    }}>
      {children}
    </h2>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 700,
        letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--ink-4)',
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, placeholder, min, max }: {
  value: string; onChange: (v: string) => void; placeholder: string; min: number; max: number;
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
        height: 40, borderRadius: 8, border: '1px solid var(--rule)',
        background: 'var(--paper-2)', color: 'var(--ink)',
        fontFamily: 'var(--font-mono)', fontSize: 14, padding: '0 12px',
        outline: 'none', width: '100%',
      }}
    />
  );
}
