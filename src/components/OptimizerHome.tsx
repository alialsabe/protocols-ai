'use client';

import { useEffect, useRef, useState } from 'react';

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  form: string;
  brand: string;
  servings: number | null;
  estimated_monthly_cost_usd: number | null;
  confidence?: number;
}

export interface OptimizerReason {
  marker: 'minus' | 'up';
  headline: string;
  detail: string;
}

export interface OptimizerResult {
  monthly_savings_usd: number;
  annual_savings_usd: number;
  leaner_pct: number;
  drop: Array<{ name: string; reason: string }>;
  upgrade: Array<{ from: string; to: string; reason: string }>;
  keep: Array<{ name: string }>;
  optimized_stack: Supplement[];
  reasons: OptimizerReason[];
}

type Mode = 'photo' | 'paste' | 'url';

type State =
  | { kind: 'empty'; mode: Mode }
  | { kind: 'scanning'; mode: Mode }
  | { kind: 'confirming'; detected: Supplement }
  | { kind: 'optimizing' }
  | { kind: 'results'; original: Supplement[]; result: OptimizerResult };

const DRAFT_KEY = 'stacklab.optimizer.draft.v1';

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function totalMonthly(stack: Supplement[]): number {
  return stack.reduce((s, x) => s + (x.estimated_monthly_cost_usd ?? 0), 0);
}

function fmtMoney(n: number): string {
  return `$${Math.round(n)}`;
}

function fmtMoneyComma(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`;
}

export function OptimizerHome() {
  const [mode, setMode] = useState<Mode>('photo');
  const [state, setState] = useState<State>({ kind: 'empty', mode: 'photo' });
  const [stack, setStack] = useState<Supplement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [urlText, setUrlText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Load draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Supplement[];
        if (Array.isArray(parsed)) setStack(parsed);
      }
    } catch {}
  }, []);

  // Persist draft on change
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(stack));
    } catch {}
  }, [stack]);

  function setModeAndSync(m: Mode) {
    setMode(m);
    setState((prev) => (prev.kind === 'empty' ? { kind: 'empty', mode: m } : prev));
    setError(null);
  }

  function openCamera() {
    setError(null);
    fileInputRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    setState({ kind: 'scanning', mode: 'photo' });
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await fetch('/api/scan', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Scan failed (${res.status})`);
      }
      const data = (await res.json()) as Supplement;
      setState({ kind: 'confirming', detected: { ...data, id: uid() } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setState({ kind: 'empty', mode });
    }
  }

  async function submitPaste() {
    if (!pasteText.trim()) return;
    setError(null);
    setState({ kind: 'scanning', mode: 'paste' });
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: pasteText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Parse failed (${res.status})`);
      }
      const data = (await res.json()) as Supplement;
      setState({ kind: 'confirming', detected: { ...data, id: uid() } });
      setPasteText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Parse failed');
      setState({ kind: 'empty', mode });
    }
  }

  async function submitUrl() {
    if (!urlText.trim()) return;
    setError(null);
    setState({ kind: 'scanning', mode: 'url' });
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Lookup failed (${res.status})`);
      }
      const data = (await res.json()) as Supplement;
      setState({ kind: 'confirming', detected: { ...data, id: uid() } });
      setUrlText('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lookup failed');
      setState({ kind: 'empty', mode });
    }
  }

  function addToStack() {
    if (state.kind !== 'confirming') return;
    setStack((s) => [...s, state.detected]);
    setState({ kind: 'empty', mode });
  }

  function retry() {
    setState({ kind: 'empty', mode });
  }

  function removeItem(id: string) {
    setStack((s) => s.filter((x) => x.id !== id));
  }

  function updateDetected(patch: Partial<Supplement>) {
    if (state.kind !== 'confirming') return;
    setState({ kind: 'confirming', detected: { ...state.detected, ...patch } });
  }

  async function runOptimizer() {
    if (stack.length === 0) return;
    setError(null);
    setState({ kind: 'optimizing' });
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stack }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Optimize failed (${res.status})`);
      }
      const result = (await res.json()) as OptimizerResult;
      setState({ kind: 'results', original: stack, result });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Optimize failed');
      setState({ kind: 'empty', mode });
    }
  }

  function startOver() {
    setStack([]);
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setState({ kind: 'empty', mode });
  }

  // ──────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────
  const stackTotal = totalMonthly(stack);

  return (
    <div className="sl-container">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sl-file-input"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = '';
        }}
      />

      <div className="sl-brand-row">
        <div className="sl-brand"><span className="sl-dot" /><span>Stack Lab</span></div>
        <div className="sl-meta">
          {state.kind === 'results'
            ? <button className="sl-meta" onClick={startOver}>Re-run</button>
            : stack.length > 0
              ? `${stack.length} in stack`
              : 'v.001'}
        </div>
      </div>

      {error && <div className="sl-error">{error}</div>}

      {state.kind === 'optimizing' && (
        <div className="sl-loading">Running optimizer</div>
      )}

      {state.kind === 'scanning' && (
        <div className="sl-loading">
          {state.mode === 'photo' ? 'Reading label' : state.mode === 'paste' ? 'Parsing text' : 'Looking up product'}
        </div>
      )}

      {state.kind === 'empty' && (
        <>
          <div className="sl-empty-label">{`// Optimize your stack`}</div>
          <h1 className="sl-empty-headline">Scan your stack.</h1>

          {mode === 'photo' && (
            <>
              <div className="sl-viewfinder" onClick={openCamera} role="button" aria-label="Open camera">
                <span className="sl-vf-bracket sl-vf-tl" />
                <span className="sl-vf-bracket sl-vf-tr" />
                <span className="sl-vf-bracket sl-vf-bl" />
                <span className="sl-vf-bracket sl-vf-br" />
                <div className="sl-vf-rec"><span className="sl-rec-dot" />READY</div>
                <div className="sl-vf-bottle"><div className="sl-vf-bottle-text">{'MAG\nGLYCINATE\n400 mg'}</div></div>
                <div className="sl-vf-tip">Point at a bottle label</div>
              </div>
            </>
          )}

          {mode === 'paste' && (
            <textarea
              className="sl-textarea"
              placeholder="Paste an ingredient label, supplement name, or your stack as plain text..."
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
            />
          )}

          {mode === 'url' && (
            <input
              className="sl-input"
              type="url"
              inputMode="url"
              placeholder="https://www.amazon.com/..."
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
            />
          )}

          <div className="sl-modes" role="tablist">
            <button
              className={`sl-mode ${mode === 'photo' ? 'active' : ''}`}
              onClick={() => setModeAndSync('photo')}
              type="button"
            >Photo</button>
            <button
              className={`sl-mode ${mode === 'paste' ? 'active' : ''}`}
              onClick={() => setModeAndSync('paste')}
              type="button"
            >Paste</button>
            <button
              className={`sl-mode ${mode === 'url' ? 'active' : ''}`}
              onClick={() => setModeAndSync('url')}
              type="button"
            >URL</button>
          </div>

          {mode === 'photo' && (
            <button className="sl-cta" onClick={openCamera} type="button">Open Camera</button>
          )}
          {mode === 'paste' && (
            <button className="sl-cta" onClick={submitPaste} disabled={!pasteText.trim()} type="button">Parse Text</button>
          )}
          {mode === 'url' && (
            <button className="sl-cta" onClick={submitUrl} disabled={!urlText.trim()} type="button">Look Up Product</button>
          )}

          {stack.length > 0 && (
            <div style={{ marginTop: 22 }} className="sl-stack-so-far">
              <div className="sl-ssf-head">
                <div className="sl-ssf-title">Stack so far</div>
                <div className="sl-ssf-count">{stack.length} items, {fmtMoney(stackTotal)}/mo</div>
              </div>
              {stack.map((s) => (
                <div key={s.id} className="sl-ssf-row">
                  <span>{s.name}{s.dose ? <span className="sl-dose">{s.dose}</span> : null}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
                    <span className="sl-amt">{fmtMoney(s.estimated_monthly_cost_usd ?? 0)}</span>
                    <button className="sl-x" onClick={() => removeItem(s.id)} aria-label={`Remove ${s.name}`}>×</button>
                  </span>
                </div>
              ))}
              <button
                className="sl-cta"
                style={{ marginTop: 12 }}
                onClick={runOptimizer}
                type="button"
              >Done, Run Optimizer</button>
            </div>
          )}

          <div className="sl-foot">
            Avg stack we see: <strong>$210/mo</strong>.<br />
            Avg waste detected: <span className="sl-green">$87/mo</span>.<br />
            Educational only, not medical advice.
          </div>
        </>
      )}

      {state.kind === 'confirming' && (
        <>
          <div className="sl-progress-row">
            <span>{`// Detected`}</span>
            <span><strong>{stack.length} in stack</strong></span>
          </div>

          <div className="sl-detected">
            <div className="sl-detected-label">Detected, edit if needed</div>
            <input
              className="sl-detected-name"
              value={state.detected.name}
              onChange={(e) => updateDetected({ name: e.target.value })}
              placeholder="Name"
            />
            <div className="sl-detected-grid">
              <div>
                <span className="sl-k">Dose</span>
                <input className="sl-v" value={state.detected.dose} onChange={(e) => updateDetected({ dose: e.target.value })} placeholder="400 mg" />
              </div>
              <div>
                <span className="sl-k">Form</span>
                <input className="sl-v" value={state.detected.form} onChange={(e) => updateDetected({ form: e.target.value })} placeholder="Capsule" />
              </div>
              <div>
                <span className="sl-k">Brand</span>
                <input className="sl-v" value={state.detected.brand} onChange={(e) => updateDetected({ brand: e.target.value })} placeholder="NOW Foods" />
              </div>
              <div>
                <span className="sl-k">Servings</span>
                <input
                  className="sl-v"
                  type="number"
                  value={state.detected.servings ?? ''}
                  onChange={(e) => updateDetected({ servings: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="180"
                />
              </div>
              <div>
                <span className="sl-k">Est $/mo</span>
                <input
                  className="sl-v"
                  type="number"
                  value={state.detected.estimated_monthly_cost_usd ?? ''}
                  onChange={(e) => updateDetected({ estimated_monthly_cost_usd: e.target.value === '' ? null : Number(e.target.value) })}
                  placeholder="14"
                />
              </div>
            </div>
            <div className="sl-detected-actions">
              <button className="sl-da-add" onClick={addToStack} type="button">Add to Stack</button>
              <button className="sl-da-retry" onClick={retry} type="button">Retry</button>
            </div>
          </div>

          {stack.length > 0 && (
            <div className="sl-stack-so-far">
              <div className="sl-ssf-head">
                <div className="sl-ssf-title">Stack so far</div>
                <div className="sl-ssf-count">{stack.length} items, {fmtMoney(stackTotal)}/mo</div>
              </div>
              {stack.map((s) => (
                <div key={s.id} className="sl-ssf-row">
                  <span>{s.name}{s.dose ? <span className="sl-dose">{s.dose}</span> : null}</span>
                  <span className="sl-amt">{fmtMoney(s.estimated_monthly_cost_usd ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {state.kind === 'results' && (
        <ResultsView
          original={state.original}
          result={state.result}
          onStartOver={startOver}
        />
      )}
    </div>
  );
}

function ResultsView({
  original,
  result,
  onStartOver,
}: {
  original: Supplement[];
  result: OptimizerResult;
  onStartOver: () => void;
}) {
  const dropNames = new Set(result.drop.map((d) => d.name.toLowerCase()));
  const upgradeFromNames = new Set(result.upgrade.map((u) => u.from.toLowerCase()));
  const originalTotal = totalMonthly(original);
  const optimizedTotal = totalMonthly(result.optimized_stack);

  return (
    <>
      <div className="sl-results-banner">
        <div className="sl-banner-label">{`// Optimization complete`}</div>
        <div className="sl-banner-amount">
          <sup>$</sup>{Math.round(result.monthly_savings_usd)}
          <span className="sl-banner-period">/mo saved</span>
        </div>
        <div className="sl-banner-year">
          {fmtMoneyComma(result.annual_savings_usd)}/year, {Math.round(result.leaner_pct)}% leaner stack
        </div>
      </div>

      <div className="sl-section">
        <div className="sl-section-head">
          <div className="sl-section-title">Your stack [{original.length}]</div>
          <div className="sl-section-total">{fmtMoney(originalTotal)}</div>
        </div>
        {original.map((s) => {
          const isDrop = dropNames.has(s.name.toLowerCase());
          const isUpgrade = upgradeFromNames.has(s.name.toLowerCase());
          const cls = isDrop ? 'sl-row sl-dropped' : isUpgrade ? 'sl-row sl-upgraded' : 'sl-row';
          return (
            <div key={s.id} className={cls}>
              <span className="sl-name">{s.name}{s.dose ? <span className="sl-dose">{s.dose}</span> : null}</span>
              <span className="sl-amt">{fmtMoney(s.estimated_monthly_cost_usd ?? 0)}</span>
            </div>
          );
        })}
        <div className="sl-section-foot">
          <span>Subtotal</span><span>{fmtMoney(originalTotal)}/mo</span>
        </div>
      </div>

      <div className="sl-section">
        <div className="sl-section-head">
          <div className="sl-section-title sl-green-title">Optimized [{result.optimized_stack.length}]</div>
          <div className="sl-section-total sl-green-total">{fmtMoney(optimizedTotal)}</div>
        </div>
        {result.optimized_stack.map((s, i) => (
          <div key={`opt-${i}`} className="sl-row">
            <span className="sl-name">{s.name}{s.dose ? <span className="sl-dose">{s.dose}</span> : null}</span>
            <span className="sl-amt">{fmtMoney(s.estimated_monthly_cost_usd ?? 0)}</span>
          </div>
        ))}
        <div className="sl-section-foot sl-green-foot">
          <span>Subtotal</span><span>{fmtMoney(optimizedTotal)}/mo</span>
        </div>
      </div>

      {result.reasons.length > 0 && (
        <div className="sl-section">
          <div className="sl-why-title">Why [{result.reasons.length} change{result.reasons.length === 1 ? '' : 's'}]</div>
          {result.reasons.map((r, i) => (
            <div key={i} className="sl-why-item">
              <span className={`sl-mk ${r.marker === 'minus' ? 'sl-minus' : 'sl-up'}`}>
                {r.marker === 'minus' ? '−' : '↑'}
              </span>
              <span><strong>{r.headline}</strong> {r.detail}</span>
            </div>
          ))}
        </div>
      )}

      <div className="sl-actions">
        <button className="sl-cta" onClick={onStartOver} type="button">Start a new stack</button>
      </div>
    </>
  );
}
