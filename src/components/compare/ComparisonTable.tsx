'use client';

import type { ProtocolReport } from '@/lib/protocol-types';
import { computeComparisonMetrics } from './metrics';

type ComparisonResult = {
  query: string;
  report: ProtocolReport | null;
  status: 'ok' | 'generating' | 'not_found';
};

const ROWS: Array<{ key: keyof RowData; label: string; renderer?: (value: string | number) => React.ReactNode }> = [
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
  if (value === '—' || value === 'Data pending') return 'text-[#52525b]';
  if (rowKey === 'evidenceLabel') {
    if (value === 'High evidence') return 'text-[#06d6a0]';
    if (value === 'Moderate evidence') return 'text-[#fbbf24]';
    if (value === 'Limited evidence') return 'text-[#fb7185]';
  }
  return 'text-white';
}

export function ComparisonTable({ results }: { results: ComparisonResult[] }) {
  const rowData = results.map(buildRowData);
  const cols = results.length;

  return (
    <div className="bg-[#111113] border border-white/[0.06] rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h3 className="text-sm font-semibold text-white">Side-by-side comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="sticky left-0 z-10 bg-[#111113] text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a]">
                Metric
              </th>
              {rowData.map((row, i) => (
                <th
                  key={i}
                  className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#71717a] min-w-[180px]"
                >
                  {row.name}
                  {results[i].status === 'generating' ? (
                    <span className="ml-2 inline-block text-[9px] font-medium text-[#fbbf24] bg-[#fbbf24]/10 px-1.5 py-0.5 rounded-full normal-case tracking-normal">
                      generating
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.slice(1).map((rowDef) => (
              <tr key={rowDef.key} className="border-b border-white/[0.04] last:border-b-0">
                <td className="sticky left-0 z-10 bg-[#111113] px-5 py-3 text-xs text-[#a1a1aa] font-medium whitespace-nowrap">
                  {rowDef.label}
                </td>
                {rowData.map((row, i) => {
                  const value = String(row[rowDef.key]);
                  return (
                    <td key={i} className={`px-5 py-3 text-sm ${cellTint(rowDef.key, value)}`}>
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
        <div className="px-5 py-3 border-t border-white/[0.06] bg-[#fbbf24]/[0.04]">
          <p className="text-xs text-[#fbbf24]">
            Some supplements are still being analyzed. Data will fill in on refresh.
          </p>
        </div>
      ) : null}
    </div>
  );
}
