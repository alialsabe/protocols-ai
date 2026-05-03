import { StackBuilder } from '@/components/stack/StackBuilder';

export const metadata = {
  title: 'Stack — Materia',
  description: 'Build and schedule your daily supplement routine.',
};

// Default view of the routine workspace. Pure client editor — no server
// data needed. Auth-aware sub-features (audit, bloodwork, analysis) live
// at their own routes and are reached via the workspace sidebar.
export default function StackPage() {
  return (
    <div>
      <header className="mb-8">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          Stack
        </span>
        <h1
          className="mt-1 text-[28px] font-extrabold tracking-[-0.5px]"
          style={{ color: 'var(--fg)' }}
        >
          Build & schedule
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Add supplements, set times, and persist your routine. Audit and bloodwork analysis live in the sidebar.
        </p>
      </header>
      <StackBuilder />
    </div>
  );
}
