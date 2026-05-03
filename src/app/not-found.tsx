import Link from 'next/link';

export const metadata = {
  title: 'Not found — Stack Lab',
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[640px] flex-col items-center justify-center px-5 py-16 text-center md:py-24">
      <span
        className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--accent)' }}
      >
        404
      </span>
      <h1
        className="mt-3 text-[40px] font-extrabold tracking-[-0.5px] md:text-[52px]"
        style={{ color: 'var(--fg)' }}
      >
        Page not found
      </h1>
      <p
        className="mt-4 max-w-[440px] text-[15px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        That URL doesn&apos;t exist on Stack Lab. It may have moved or never existed.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#000' }}
        >
          Browse compounds
        </Link>
        <Link
          href="/routine"
          className="inline-flex min-h-[44px] items-center justify-center px-6 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{ border: '1px solid var(--hair-strong)', color: 'var(--fg)' }}
        >
          My routine
        </Link>
      </div>
    </div>
  );
}
