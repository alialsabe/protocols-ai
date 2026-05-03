import type { ReactNode } from 'react';
import { SidebarNav } from '@/components/routine/SidebarNav';

export const metadata = {
  title: 'My Routine — Materia',
  description: 'Build, schedule, and personalise your daily supplement routine.',
};

// All /routine/* sub-routes share the sidebar workspace chrome.
// Each sub-page renders its own focused view (Stack, Audit, Bloodwork,
// Analysis, Research) so users navigate via the sidebar instead of
// scrolling one giant page.
export default function RoutineLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-0 px-5 md:flex-row md:px-0">
      <SidebarNav />
      <main className="min-w-0 flex-1 px-0 py-8 md:px-10 md:py-10 lg:px-14">
        {children}
      </main>
    </div>
  );
}
