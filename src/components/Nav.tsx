'use client';

import Link from 'next/link';
import { useState } from 'react';

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="sl-nav">
        <div className="sl-nav-inner">
          <Link href="/" className="sl-brand" onClick={() => setOpen(false)}>
            <span className="sl-dot" />
            <span>Stack Lab</span>
          </Link>
          <button className="sl-menu-btn" onClick={() => setOpen(true)} aria-label="Open menu" type="button">
            Menu
          </button>
        </div>
      </nav>
      {open && (
        <>
          <div className="sl-drawer-backdrop" onClick={() => setOpen(false)} />
          <aside className="sl-drawer" role="dialog" aria-label="Menu">
            <button className="sl-drawer-close" onClick={() => setOpen(false)} type="button">Close</button>
            <Link href="/" onClick={() => setOpen(false)}>Optimizer</Link>
            <Link href="/routine" onClick={() => setOpen(false)}>Today</Link>
            <Link href="/research" onClick={() => setOpen(false)}>Research</Link>
            <Link href="/account" onClick={() => setOpen(false)}>Account</Link>
            <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>
            <Link href="/about" onClick={() => setOpen(false)}>About</Link>
          </aside>
        </>
      )}
    </>
  );
}
