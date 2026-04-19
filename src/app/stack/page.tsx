import { TopBar } from '@/components/v2/TopBar';
import { BottomTabBar } from '@/components/v2/BottomTabBar';
import { StackBuilder } from '@/components/stack/StackBuilder';

export const metadata = {
  title: 'My Stack — Protocols.AI',
  description: 'Build and manage your personal supplement stack.',
};

export default function StackPage() {
  return (
    <main className="proto-grid relative min-h-screen overflow-x-hidden pb-20 md:pb-0">
      <TopBar />

      {/* Page header */}
      <section
        className="mx-auto max-w-[1200px] px-5 py-5 md:px-10 lg:px-16"
        style={{ borderBottom: '1px solid var(--hair)' }}
      >
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--accent)' }}
        >
          My Routine
        </span>
        <h1
          className="mt-2 text-[28px] font-extrabold leading-[1.1] tracking-[-0.6px] md:text-[36px]"
          style={{ color: 'var(--fg)' }}
        >
          Your daily supplement routine.
        </h1>
      </section>

      <StackBuilder />

      <BottomTabBar />
    </main>
  );
}
