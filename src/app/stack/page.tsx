import { redirect } from 'next/navigation';

// /stack collapsed into /routine on 2026-04-29 per /plan-eng-review.
// Kept as a redirect so external links (Twitter shares, Reddit posts, search
// indexes) keep resolving to the right destination.
export default function StackPage() {
  redirect('/routine');
}
