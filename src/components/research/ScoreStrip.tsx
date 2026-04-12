import type { ProtocolReport } from '@/lib/protocol-types';
import { computeComparisonMetrics } from '@/components/compare/metrics';

function letterGrade(score0to1: number): string {
  if (score0to1 >= 0.92) return 'A+';
  if (score0to1 >= 0.85) return 'A';
  if (score0to1 >= 0.78) return 'A−';
  if (score0to1 >= 0.72) return 'B+';
  if (score0to1 >= 0.65) return 'B';
  if (score0to1 >= 0.58) return 'B−';
  if (score0to1 >= 0.5) return 'C+';
  if (score0to1 >= 0.42) return 'C';
  if (score0to1 >= 0.35) return 'C−';
  if (score0to1 >= 0.25) return 'D';
  return '—';
}

export function ScoreStrip({ report }: { report: ProtocolReport }) {
  const metrics = computeComparisonMetrics(report);
  const evidenceGrade = letterGrade(metrics.evidenceQuality);
  const safetyGrade = letterGrade(metrics.safetyProfile);
  const typicalDose = report.dosage?.maintenance ?? '—';
  const timeToFeel =
    report.dosage?.formula?.match(/(\d+[-–]\d+\s*weeks?|\d+\s*weeks?|\d+[-–]\d+\s*days?)/i)?.[0] ?? '4–6 wks';

  const cells = [
    { label: 'EVIDENCE QUALITY', value: evidenceGrade, caption: `${report.science?.sourceCount ?? 0} studies cited`, mono: 'text-[32px]' },
    { label: 'SAFETY PROFILE', value: safetyGrade, caption: `${report.medicineInteractions?.length ?? 0} med interactions`, mono: 'text-[32px]' },
    { label: 'TYPICAL DOSE', value: typicalDose, caption: report.dosage?.formula ? '' : 'no dose data', mono: 'text-[18px]' },
    { label: 'TIME TO FEEL', value: timeToFeel, caption: '', mono: 'text-[18px]' },
  ];

  return (
    <section
      className="mt-10 grid grid-cols-2 md:grid-cols-4"
      style={{
        border: '1px solid var(--hair)',
        borderRadius: 16,
        background: 'var(--surface)',
        overflow: 'hidden',
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.label}
          className="flex flex-col justify-center gap-2 px-6 py-5"
          style={{
            borderLeft: i > 0 && i % 4 !== 0 ? '1px solid var(--hair)' : undefined,
            borderTop: i >= 2 ? '1px solid var(--hair)' : undefined,
            minHeight: 96,
          }}
        >
          <span
            className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            {cell.label}
          </span>
          <span className={`font-mono font-bold ${cell.mono}`} style={{ color: 'var(--fg)' }}>
            {cell.value}
          </span>
          {cell.caption ? (
            <span className="font-mono text-[11px]" style={{ color: 'var(--fg-faint)' }}>
              {cell.caption}
            </span>
          ) : null}
        </div>
      ))}
    </section>
  );
}
