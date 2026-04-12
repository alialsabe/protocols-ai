import type { ProtocolReport } from '@/lib/protocol-types';

/**
 * Compute 5-dimension comparison metrics (0-1 scale) for the radar chart.
 * Deterministic — same inputs always produce the same output.
 *
 * Dimensions:
 *   - evidenceQuality: fraction of findings rated 'high' vs total
 *   - safetyProfile: inverse of side effect severity + medicine interaction count
 *   - researchDepth: log-normalized source count
 *   - affordability: inverse of price bucket (approximate)
 *   - bioavailability: 1 for proven forms, 0.5 for novel, 0 if unknown (heuristic)
 */
export interface ComparisonMetrics {
  evidenceQuality: number;
  safetyProfile: number;
  researchDepth: number;
  affordability: number;
  bioavailability: number;
}

export function computeComparisonMetrics(report: ProtocolReport): ComparisonMetrics {
  // Evidence quality: fraction of findings marked 'high' quality
  const findings = report.science?.findings ?? [];
  const highCount = findings.filter((f) => f.quality === 'high').length;
  const mediumCount = findings.filter((f) => f.quality === 'medium').length;
  const evidenceQuality = findings.length === 0
    ? 0
    : (highCount + mediumCount * 0.5) / findings.length;

  // Safety profile: inversely proportional to (side effects + medicine interactions)
  const sideEffectCount = report.science?.sideEffects?.length ?? 0;
  const medInteractionCount = report.medicineInteractions?.length ?? 0;
  const highSeverityMeds = (report.medicineInteractions ?? [])
    .filter((m) => m.severity === 'high' || m.severity === 'contraindicated').length;
  // Penalty weights: high severity meds hurt more than mild side effects
  const rawPenalty = sideEffectCount * 0.05 + medInteractionCount * 0.08 + highSeverityMeds * 0.15;
  const safetyProfile = Math.max(0, 1 - rawPenalty);

  // Research depth: log-normalized source count (0 sources → 0, 50+ sources → 1)
  const sourceCount = report.science?.sourceCount ?? 0;
  const researchDepth = Math.min(1, Math.log10(sourceCount + 1) / Math.log10(51));

  // Affordability: crude heuristic from price string, default 0.5
  const priceStr = report.commerce?.price ?? '';
  const priceMatch = priceStr.match(/\$(\d+(?:\.\d+)?)/);
  const priceNum = priceMatch ? Number(priceMatch[1]) : null;
  const affordability = priceNum === null
    ? 0.5
    : priceNum <= 15 ? 1
    : priceNum <= 25 ? 0.75
    : priceNum <= 40 ? 0.5
    : priceNum <= 60 ? 0.25
    : 0.1;

  // Bioavailability: default 0.6, boosted if dosage formula mentions absorption cues
  const formula = (report.dosage?.formula ?? '').toLowerCase();
  const bioavailability = report.dosage
    ? (formula.includes('liposomal') || formula.includes('chelate') || formula.includes('fat')
        ? 0.9
        : 0.6)
    : 0.3;

  return {
    evidenceQuality: clamp01(evidenceQuality),
    safetyProfile: clamp01(safetyProfile),
    researchDepth: clamp01(researchDepth),
    affordability: clamp01(affordability),
    bioavailability: clamp01(bioavailability),
  };
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}
