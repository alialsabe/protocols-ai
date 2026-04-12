import type { ProtocolReport } from '@/lib/protocol-types';

export function EmptyReport({ report }: { report: ProtocolReport }) {
  return (
    <section
      className="rounded-[16px] p-8"
      style={{ background: 'var(--surface)', border: '1px dashed var(--hair-strong)' }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--accent)' }}
      >
        DATA ASSIST
      </span>
      <h3
        className="mt-3 text-[22px] font-extrabold tracking-[-0.4px]"
        style={{ color: 'var(--fg)' }}
      >
        Some sections are pending for {report.name ?? 'this compound'}.
      </h3>
      <p
        className="mt-3 max-w-[560px] text-[14px] leading-[22px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        Our human-verified dataset covers 40 supplements. For everything else, we run an AI
        research agent on demand and flag the output as unverified. You can trigger it below.
      </p>
      <form action="/api/protocols" method="post" className="mt-6">
        <input type="hidden" name="query" value={report.name ?? ''} />
        <button
          type="submit"
          className="inline-flex items-center rounded-md px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[1.4px] transition-opacity hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#09090b' }}
        >
          Generate AI report →
        </button>
      </form>
    </section>
  );
}
