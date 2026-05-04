import { StackBuilder } from '@/components/stack/StackBuilder';

export const metadata = {
  title: 'Stack — Stack Lab',
  description: 'Your supplement stack as an inventory: cards, rarities, and stats.',
};

// Default view of the routine workspace. The StackBuilder component carries
// its own L+ chrome (header, search, inventory) so this page is just a
// thin wrapper.
export default function StackPage() {
  return <StackBuilder />;
}
