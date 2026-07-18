import { StackBuilder } from '@/components/stack/StackBuilder';

export const metadata = {
  title: 'Stack — Stack Lab',
  description: 'Build and schedule your daily supplement routine.',
};

// Default view of the routine workspace. Pure client editor — no server
// data needed. Auth-aware sub-features (audit, bloodwork, analysis) live
// at their own routes and are reached via the workspace sidebar.
export default function StackPage() {
  return (
    <div>
      <header className="mb-8">
        <h1
          className="text-[32px] font-extrabold tracking-[-0.7px]"
          style={{ color: 'var(--fg)' }}
        >
          Your daily protocol
        </h1>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--fg-muted)' }}>
          Manage supplements and peptides, then let Stack Lab resolve timing, conflicts, and the shape of your day.
        </p>
      </header>
      <StackBuilder />
    </div>
  );
}
