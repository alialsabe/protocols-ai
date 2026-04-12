'use client';

import type { ProtocolReport } from '@/lib/protocol-types';
import { computeComparisonMetrics } from './metrics';

type ComparisonResult = {
  query: string;
  report: ProtocolReport | null;
  status: 'ok' | 'generating' | 'not_found';
};

const ROWS: Array<{ key: keyof RowData; label: string }> = [
  { key: 'name', label: 'Supplement' },
  { key: 'category', label: 'Category' },
  { key: 'evidenceLabel', label: 'Evidence' },
  { key: 'sourceCount', label: 'Studies cited' },
  { key: 'dosage', label: 'Maintenance dose' },
  { key: 'schedule', label: 'Best time' },
  { key: 'medicineInteractions', label: 'Medicine interactions' },
  { key: 'sideEffects', label: 'Side effects' },
  { key: 'topBrand', label: 'Top brand' },
  { key: 'price', label: 'Price' },
];

type RowData = {
  name: string;
  category: string;
  evidenceLabel: string;
  sourceCount: string;
  dosage: string;
  schedule: string;
  medicineInteractions: string;
  sideEffects: string;
  topBrand: string;
  price: string;
};

function buildRowData(result: ComparisonResult): RowData {
  const { report, status, query } = result;

  if (status === 'not_found' || !report) {
    return {
      name: query,
      category: '—',
      evidenceLabel: '—',
      sourceCount: '—',
      dosage: '—',
      schedule: '—',
      medicineInteractions: '—',
      sideEffects: '—',
      topBrand: '—',
      price: '—',
    };
  }

  const metrics = computeComparisonMetrics(report);
  const evidenceBucket =
    metrics.evidenceQuality >= 0.75 ? 'High evidence' :
    metrics.evidenceQuality >= 0.4  ? 'Moderate evidence' :
                                      'Limited evidence';

  return {
    name: report.name ?? query,
    category: report.supplementTypes?.join(', ') || report.baseCompound || '—',
    evidenceLabel: status === 'generating' ? 'Data pending' : evidenceBucket,
    sourceCount: report.science?.sourceCount ? String(report.science.sourceCount) : '—',
    dosage: report.dosage?.maintenance ?? '—',
    schedule: report.schedule?.[0]?.context ?? '—',
    medicineInteractions: report.medicineInteractions
      ? `${report.medicineInteractions.length} known`
      : 'None known',
    sideEffects: report.science?.sideEffects?.length
      ? `${report.science.sideEffects.length} documented`
      : '—',
    topBrand: report.topBrands?.[0]?.name ?? '—',
    price: report.commerce?.price ?? '—',
  };
}

function cellTint(rowKey: keyof RowData, value: string): string {
  if (value === '—' || value === 'Data pending') return 'var(--fg-faint)';
  if (rowKey === 'evidenceLabel') {
    if (value === 'High evidence') return 'var(--accent)';
    if (value === 'Moderate evidence') return '#fbbf24';
    if (value === 'Limited evidence') return '#fb7185';
  }
  return 'var(--fg)';
}

export function ComparisonTable({ results }: { results: ComparisonResult[] }) {
  const rowData = results.map(buildRowData);

  return (
    <div
      className="overflow-hidden rounded-[16px]"
      style={{ background: 'var(--surface)', border: '1px solid var(--hair)' }}
    >
      <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--hair)' }}>
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
          style={{ color: 'var(--fg-dim)' }}
        >
          SIDE-BY-SIDE
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hair)' }}>
              <th
                className="sticky left-0 z-10 px-6 py-4 text-left font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                style={{ background: 'var(--surface)', color: 'var(--fg-dim)' }}
              >
                Metric
              </th>
              {rowData.map((row, i) => (
                <th
                  key={i}
                  className="min-w-[180px] px-6 py-4 text-left font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
                  style={{ color: 'var(--fg-dim)' }}
                >
                  {row.name}
                  {results[i].status === 'generating' ? (
                    <span
                      className="ml-2 inline-block rounded-full px-1.5 py-0.5 font-mono text-[9px] normal-case tracking-normal"
                      style={{
                        background: 'rgba(251, 191, 36, 0.12)',
                        color: '#fbbf24',
                      }}
                    >
                      generating
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.slice(1).map((rowDef, rowIdx) => (
              <tr key={rowDef.key} style={{ borderTop: rowIdx === 0 ? 'none' : '1px solid var(--hair)' }}>
                <td
                  className="sticky left-0 z-10 whitespace-nowrap px-6 py-4 font-mono text-[11px] uppercase tracking-[1.4px]"
                  style={{ background: 'var(--surface)', color: 'var(--fg-dim)' }}
                >
                  {rowDef.label}
                </td>
                {rowData.map((row, i) => {
                  const value = String(row[rowDef.key]);
                  return (
                    <td key={i} className="px-6 py-4 font-mono text-[13px]" style={{ color: cellTint(rowDef.key, value) }}>
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.some((r) => r.status === 'generating') ? (
        <div
          className="px-6 py-3 font-mono text-[11px] uppercase tracking-[1.4px]"
          style={{
            borderTop: '1px solid var(--hair)',
            background: 'rgba(251, 191, 36, 0.04)',
            color: '#fbbf24',
          }}
        >
          Some supplements are still being analyzed. Data will fill in on refresh.
        </div>
      ) : null}
    </div>
  );
}
