import Image from 'next/image';
import type { ProtocolReport } from '@/lib/protocol-types';
import { computeComparisonMetrics } from '@/components/compare/metrics';
import { getSupplementImage } from '@/lib/supplement-image';

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

export function ScoreStrip({ report, slug }: { report: ProtocolReport; slug?: string }) {
  const metrics = computeComparisonMetrics(report);
  const evidenceGrade = letterGrade(metrics.evidenceQuality);
  const safetyGrade = letterGrade(metrics.safetyProfile);
  const typicalDose = report.dosage?.maintenance ?? '—';
  const timeToFeel =
    report.dosage?.formula?.match(/(\d+[-–]\d+\s*weeks?|\d+\s*weeks?|\d+[-–]\d+\s*days?)/i)?.[0] ?? '4–6 wks';

  const cells = [
    { label: 'EVIDENCE QUALITY', value: evidenceGrade, caption: `${report.science?.sourceCount ?? 0} studies cited`, mono: 'text-[40px]', isEvidence: true },
    { label: 'SAFETY PROFILE', value: safetyGrade, caption: `${report.medicineInteractions?.length ?? 0} med interactions`, mono: 'text-[40px]', isEvidence: false },
    { label: 'TYPICAL DOSE', value: typicalDose, caption: report.dosage?.formula ? '' : 'no dose data', mono: 'text-[18px]', isEvidence: false },
    { label: 'TIME TO FEEL', value: timeToFeel, caption: '', mono: 'text-[18px]', isEvidence: false },
  ];

  const imgSrc = slug ? getSupplementImage(slug) : null;

  return (
    <section
      className="mt-10 grid grid-cols-2 md:grid-cols-4"
      style={{
        position: 'relative',
        border: '1px solid var(--hair)',
        borderLeft: '4px solid var(--accent)',
        borderRadius: 16,
        background: 'linear-gradient(135deg, var(--surface) 0%, rgba(6,214,160,0.03) 100%)',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes proto-scan-line {
          0% { transform: translateX(-100%); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }
        .proto-scorestrip-scan {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent 0%, var(--accent) 50%, transparent 100%);
          animation: proto-scan-line 4s linear infinite;
          pointer-events: none;
        }
      `}</style>

      {imgSrc ? (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 80,
            height: 80,
            borderRadius: 12,
            overflow: 'hidden',
            opacity: 0.7,
            boxShadow: '0 0 24px rgba(6,214,160,0.25)',
            border: '1px solid var(--hair-strong)',
            zIndex: 2,
          }}
        >
          <Image src={imgSrc} alt="" fill sizes="80px" style={{ objectFit: 'cover' }} />
        </div>
      ) : null}

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
          <span
            className={`font-mono font-bold ${cell.mono}`}
            style={{
              color: 'var(--fg)',
              textShadow:
                cell.isEvidence && (cell.value === 'A' || cell.value === 'A+')
                  ? '0 0 20px rgba(6,214,160,0.4)'
                  : undefined,
            }}
          >
            {cell.value}
          </span>
          {cell.caption ? (
            <span className="font-mono text-[11px]" style={{ color: 'var(--fg-faint)' }}>
              {cell.caption}
            </span>
          ) : null}
        </div>
      ))}

      <span aria-hidden className="proto-scorestrip-scan" />
    </section>
  );
}
