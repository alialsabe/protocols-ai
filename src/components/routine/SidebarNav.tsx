'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Shield, Droplet, LineChart, FlaskConical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  comingSoon?: boolean;
}

const ITEMS: NavItem[] = [
  { href: '/routine', label: 'Stack', icon: Layers, description: 'Build & schedule' },
  { href: '/routine/audit', label: 'Audit', icon: Shield, description: 'Conflicts & redundancies' },
  { href: '/routine/bloodwork', label: 'Bloodwork', icon: Droplet, description: 'Lab markers → actions' },
  { href: '/routine/analysis', label: 'Analysis', icon: LineChart, description: 'Personalised dosing' },
  { href: '/routine/research', label: 'Research', icon: FlaskConical, description: 'N=1 experiments' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrolling tab bar */}
      <nav
        aria-label="Routine sections"
        className="sticky top-[57px] z-30 -mx-5 flex overflow-x-auto border-b md:hidden"
        style={{ background: 'var(--paper)', borderColor: 'var(--hair)' }}
      >
        <ul className="flex min-w-full items-stretch px-5">
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-shrink-0">
                <NavLink item={item} active={active} variant="tab" />
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Desktop: left rail */}
      <aside
        aria-label="Routine sections"
        className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[240px] flex-shrink-0 border-r md:block"
        style={{ background: 'var(--paper)', borderColor: 'var(--hair)' }}
      >
        <div className="px-6 pt-8 pb-4">
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.6px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            Workspace
          </span>
        </div>
        <ul>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <NavLink item={item} active={active} variant="rail" />
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}

function NavLink({
  item,
  active,
  variant,
}: {
  item: NavItem;
  active: boolean;
  variant: 'rail' | 'tab';
}) {
  const { Icon } = { Icon: item.icon };
  const disabled = item.comingSoon;

  const inner = (
    <>
      <Icon
        size={variant === 'rail' ? 18 : 16}
        strokeWidth={active ? 2.4 : 1.8}
        style={{ color: active ? 'var(--accent)' : disabled ? 'var(--fg-faint)' : 'var(--fg-muted)' }}
      />
      <span className="flex flex-1 flex-col">
        <span
          className="text-[14px] font-semibold leading-tight"
          style={{ color: active ? 'var(--fg)' : disabled ? 'var(--fg-faint)' : 'var(--fg-muted)' }}
        >
          {item.label}
        </span>
        {variant === 'rail' && (
          <span
            className="mt-0.5 text-[11px] leading-tight"
            style={{ color: active ? 'var(--fg-muted)' : 'var(--fg-faint)' }}
          >
            {item.comingSoon ? 'Soon' : item.description}
          </span>
        )}
      </span>
    </>
  );

  const railClass =
    'flex w-full items-start gap-3 px-6 py-3 transition-colors';
  const tabClass =
    'flex items-center gap-2 whitespace-nowrap px-4 py-3 transition-colors';
  const className = variant === 'rail' ? railClass : tabClass;

  const activeStyle = active
    ? { background: 'var(--accent-tint)', borderLeft: variant === 'rail' ? '2px solid var(--accent)' : 'none', borderBottom: variant === 'tab' ? '2px solid var(--accent)' : 'none', paddingLeft: variant === 'rail' ? 'calc(1.5rem - 2px)' : undefined }
    : {};

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={className}
        style={{ ...activeStyle, cursor: 'not-allowed', opacity: 0.55 }}
      >
        {inner}
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} style={activeStyle}>
      {inner}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === '/routine') return pathname === '/routine';
  return pathname === href || pathname.startsWith(href + '/');
}
