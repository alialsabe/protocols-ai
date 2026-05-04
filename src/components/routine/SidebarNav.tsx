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
  { href: '/routine',           label: 'Stack',     icon: Layers,        description: 'Your inventory' },
  { href: '/routine/audit',     label: 'Scout',     icon: Shield,        description: 'Audit & redundancies' },
  { href: '/routine/bloodwork', label: 'Bloodwork', icon: Droplet,       description: 'Lab markers → actions' },
  { href: '/routine/analysis',  label: 'Analysis',  icon: LineChart,     description: 'Personalised dosing' },
  { href: '/routine/research',  label: 'Research',  icon: FlaskConical,  description: 'N=1 experiments' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: horizontal scrolling tab bar */}
      <nav
        aria-label="Routine sections"
        className="sticky top-[57px] z-30 -mx-5 flex overflow-x-auto md:hidden"
        style={{
          background: 'rgba(14, 18, 24, 0.92)',
          borderBottom: '1px solid var(--rule)',
          backdropFilter: 'blur(8px)',
        }}
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
        className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-[240px] flex-shrink-0 md:block"
        style={{
          background: 'rgba(14, 18, 24, 0.4)',
          borderRight: '1px solid var(--rule)',
        }}
      >
        <div className="px-6 pt-8 pb-4">
          <span
            style={{
              fontFamily: 'var(--font-cinzel), serif',
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '2px',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--gold)' }} />
            ⚜ Workspace
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
        style={{ color: active ? 'var(--gold)' : disabled ? 'var(--text-5)' : 'var(--text-3)' }}
      />
      <span className="flex flex-1 flex-col">
        <span
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: variant === 'rail' ? 13 : 12,
            fontWeight: 600,
            letterSpacing: '1.4px',
            textTransform: 'uppercase',
            color: active ? 'var(--gold)' : disabled ? 'var(--text-5)' : 'var(--text-2)',
            lineHeight: 1.2,
          }}
        >
          {item.label}
        </span>
        {variant === 'rail' && (
          <span
            style={{
              marginTop: 3,
              fontFamily: 'var(--font-jetbrains-mono), monospace',
              fontSize: 10,
              color: active ? 'var(--text-3)' : 'var(--text-4)',
              letterSpacing: '0.4px',
              lineHeight: 1.3,
            }}
          >
            {item.comingSoon ? 'Soon' : item.description}
          </span>
        )}
      </span>
    </>
  );

  const railClass = 'flex w-full items-start gap-3 px-6 py-3 transition-colors';
  const tabClass  = 'flex items-center gap-2 whitespace-nowrap px-4 py-3 transition-colors';
  const className = variant === 'rail' ? railClass : tabClass;

  const activeStyle = active
    ? {
        background: 'var(--gold-tint)',
        borderLeft: variant === 'rail' ? '2px solid var(--gold)' : 'none',
        borderBottom: variant === 'tab' ? '2px solid var(--gold)' : 'none',
        paddingLeft: variant === 'rail' ? 'calc(1.5rem - 2px)' : undefined,
      }
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
