import { StackBuilder } from '@/components/stack/StackBuilder';

export const metadata = {
  title: 'My Routine — Protocols.ai',
  description: 'Build and manage your daily supplement routine.',
};

export default function StackPage() {
  return (
    <div style={{ paddingTop: 0 }}>
      <StackBuilder />
    </div>
  );
}
