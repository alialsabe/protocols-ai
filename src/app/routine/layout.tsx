import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/routine/SidebarNav';

export const metadata = {
  title: 'My Routine — Stack Lab',
  description: 'Build, schedule, and personalise your daily supplement routine.',
};

// All /routine/* sub-routes share the horizontal workbench rail.
// Each sub-page renders its own focused view (Stack, Audit, Bloodwork,
// Analysis, Research) so users navigate via the sidebar instead of
// scrolling one giant page.
export default function RoutineLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col px-5 md:px-8">
      <SidebarNav />
      <main className="min-w-0 flex-1 px-0 py-8 md:py-10">
        {children}
      </main>
    </div>
  );
}
