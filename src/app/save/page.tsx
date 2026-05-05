import type { Metadata } from 'next';
import { OptimizerHome } from '@/components/OptimizerHome';

export const metadata: Metadata = {
  title: 'Stack Lab, Stop overpaying for your supplements',
  description:
    'Paste, photograph, or link your supplement stack. We tell you what each one is doing and find the same effects for less money.',
};

export const dynamic = 'force-static';

export default function SavePage() {
  return (
    <div className="sl-page">
      <OptimizerHome mode="save" />
    </div>
  );
}
