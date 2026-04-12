import Link from 'next/link';
import { Search, Layers, MessageSquare, User } from 'lucide-react';

const TABS = [
  { label: 'Search',  href: '/',        icon: Search },
  { label: 'Stack',   href: '/stack',   icon: Layers },
  { label: 'Advisor', href: '/advisor', icon: MessageSquare },
  { label: 'Account', href: '/signin',  icon: User },
] as const;

export function BottomTabBar() {
  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 flex h-16 md:hidden"
      style={{
        background: 'rgba(9,9,11,0.92)',
        borderTop: '1px solid var(--hair)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          <Icon size={20} strokeWidth={1.75} aria-hidden color="var(--accent)" />
          <span className="font-mono">{label}</span>
        </Link>
      ))}
    </nav>
  );
}
