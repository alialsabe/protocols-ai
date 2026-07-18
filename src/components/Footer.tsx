import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  const updated = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <footer className="site-footer">
      <div className="site-footer__primary">
        <div className="site-footer__identity">
          <strong>Stack Lab</strong>
          <span>Supplement and peptide stack management.</span>
        </div>
        <nav aria-label="Footer navigation" className="site-footer__links">
          <Link href="/about">About</Link>
          <Link href="/disclaimer">Medical disclaimer</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
        <span className="site-footer__build">Updated {updated} · catalog v2.1</span>
      </div>
      <div className="site-footer__legal">
        <p>
          Educational use only, not medical advice. Some links are affiliate links; commercial relationships never influence compound visibility, evidence grades, audits, or bloodwork analysis.
        </p>
        <span>© {year} Stack Lab</span>
      </div>
    </footer>
  );
}
