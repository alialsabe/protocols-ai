import { redirect } from 'next/navigation';

// /dashboard collapsed into /routine on 2026-04-29 per /plan-eng-review.
// The personalised analysis (biometrics, per-kg dose, conflict grade) now
// lives inline on /routine via the PersonalisedAnalysis component.
// Kept as a redirect so external links keep resolving.
export default function DashboardPage() {
  redirect('/routine');
}
