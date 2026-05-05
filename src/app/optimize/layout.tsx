import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Stack Lab, Build the right stack for your goal',
  description:
    'Pick a goal (sleep, energy, longevity, cognition, muscle) and we tune your supplement stack to it. Drop redundancies, swap weak forms, add what is missing.',
};

export default function OptimizeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
