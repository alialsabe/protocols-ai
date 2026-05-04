import Link from 'next/link';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="sl-footer">
      <div className="sl-footer-inner">
        <div className="sl-brand">
          <span className="sl-dot" />
          <span>Stack Lab</span>
        </div>
        <div className="sl-disclaim">Educational only, not medical advice.</div>
        <div className="sl-footer-row">
          <Link href="/disclaimer">Disclaimer</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/about">About</Link>
        </div>
        <div className="sl-footer-row">
          <span>&copy; {year} Stack Lab</span>
        </div>
      </div>
    </footer>
  );
}
