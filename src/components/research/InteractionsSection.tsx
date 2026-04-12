import type { ProtocolReport, MedicineInteraction } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

const SEVERITY_ORDER: Record<string, number> = {
  contraindicated: 0,
  high: 1,
  moderate: 2,
  low: 3,
};

function stripeColor(severity: string): string {
  if (severity === 'contraindicated' || severity === 'high') return '#fb7185';
  if (severity === 'moderate') return '#fbbf24';
  return '#38bdf8';
}

function pillLabel(severity: string): string {
  if (severity === 'contraindicated') return 'DO NOT COMBINE';
  return severity.toUpperCase();
}

export function InteractionsSection({ report }: { report: ProtocolReport }) {
  const interactions = [...(report.medicineInteractions ?? [])].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9),
  );

  return (
    <section>
      <SectionHeader label="04 / INTERACTIONS" title="Medicine interactions" />

      {interactions.length === 0 ? (
        <div
          className="mt-6 rounded-[16px] p-8 text-center"
          style={{ background: 'var(--surface)', border: '1px dashed var(--hair-strong)' }}
        >
          <p className="text-[13px]" style={{ color: 'var(--fg-muted)' }}>
            No known interactions with common medications. Always consult your physician.
          </p>
        </div>
      ) : (
        <ul
          className="mt-6 overflow-hidden rounded-[16px]"
          style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
        >
          {interactions.map((interaction, i) => (
            <InteractionRow key={i} interaction={interaction} isFirst={i === 0} />
          ))}
        </ul>
      )}
    </section>
  );
}

function InteractionRow({
  interaction,
  isFirst,
}: {
  interaction: MedicineInteraction;
  isFirst: boolean;
}) {
  const color = stripeColor(interaction.severity);

  return (
    <li
      className="relative grid grid-cols-[4px_1fr_auto] gap-5 px-6 py-5"
      style={{
        borderTop: isFirst ? 'none' : '1px solid var(--hair)',
      }}
    >
      <span className="block" style={{ background: color }} aria-hidden />
      <div className="min-w-0">
        <h3
          className="text-[15px] font-semibold tracking-[-0.2px]"
          style={{ color: 'var(--fg)' }}
        >
          {interaction.medicineName}
          {interaction.medicineClass ? (
            <span
              className="ml-2 font-mono text-[10px] uppercase tracking-[1.4px]"
              style={{ color: 'var(--fg-dim)' }}
            >
              · {interaction.medicineClass}
            </span>
          ) : null}
        </h3>
        {interaction.mechanism ? (
          <p
            className="mt-1 text-[13px] leading-[20px]"
            style={{ color: 'var(--fg-muted)' }}
          >
            {interaction.mechanism}
          </p>
        ) : null}
        {interaction.recommendation ? (
          <p
            className="mt-1 text-[13px] leading-[20px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            → {interaction.recommendation}
          </p>
        ) : null}
      </div>
      <span
        className="inline-flex h-7 items-center rounded-full px-3 font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
        style={{
          color,
          border: `1px solid ${color}`,
          background: 'transparent',
          alignSelf: 'start',
        }}
      >
        {pillLabel(interaction.severity)}
      </span>
    </li>
  );
}
