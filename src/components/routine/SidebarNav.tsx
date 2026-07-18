'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChartLineUp,
  Flask,
  ShieldCheck,
  StackSimple,
  TestTube as Droplet,
  type Icon,
} from '@phosphor-icons/react';

interface NavItem {
  href: string;
  label: string;
  icon: Icon;
  description: string;
}

const ITEMS: NavItem[] = [
  { href: '/routine', label: 'Stack', icon: StackSimple, description: 'Build and schedule' },
  { href: '/routine/audit', label: 'Audit', icon: ShieldCheck, description: 'Conflicts and overlap' },
  { href: '/routine/bloodwork', label: 'Bloodwork', icon: Droplet, description: 'Markers to actions' },
  { href: '/routine/analysis', label: 'Analysis', icon: ChartLineUp, description: 'Personalised dosing' },
  { href: '/routine/research', label: 'Research', icon: Flask, description: 'N=1 experiments' },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Stack workspace" className="workspace-rail">
      <span className="workspace-rail__label">Workspace</span>
      <ul>
        {ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link href={item.href} data-active={active ? 'true' : undefined} aria-current={active ? 'page' : undefined}>
                <Icon size={17} weight={active ? 'bold' : 'regular'} aria-hidden="true" />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  if (href === '/routine') return pathname === '/routine';
  return pathname === href || pathname.startsWith(`${href}/`);
}
