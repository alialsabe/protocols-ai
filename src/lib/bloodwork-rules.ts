import type { AuditFinding, AuditSeverity } from './audit-engine';

// One marker as extracted from a PDF. range_low/high are the lab's printed
// reference range, not the deficiency threshold (the rule book owns those).
export interface ExtractedMarker {
  name: string;
  value: number;
  unit: string;
  range_low?: number | null;
  range_high?: number | null;
}

// One row from the deficiency_rules table, normalized for in-memory use.
// thresholdLow / thresholdHigh come back as strings from postgres numeric;
// callers should convert before passing in.
export interface DeficiencyRule {
  id: string;
  markerName: string;
  markerAliases: string[];
  unit: string;
  thresholdLow: number | null;
  thresholdHigh: number | null;
  severity: AuditSeverity;
  supplementSlug: string | null;
  recommendation: string;
  citation: string | null;
}

const severityRank: Record<AuditSeverity, number> = { high: 0, medium: 1, low: 2, info: 3 };

export function mapMarkersToFindings(
  markers: ExtractedMarker[],
  rules: DeficiencyRule[],
): AuditFinding[] {
  const findings: AuditFinding[] = [];

  for (const marker of markers) {
    const rule = findMatchingRule(marker, rules);
    if (!rule) continue;

    const triggered = evaluateThreshold(marker.value, rule);
    if (!triggered) continue;

    findings.push(buildFinding(marker, rule));
  }

  return findings.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}

function findMatchingRule(
  marker: ExtractedMarker,
  rules: DeficiencyRule[],
): DeficiencyRule | undefined {
  const needle = normalize(marker.name);
  return rules.find((rule) => {
    if (normalize(rule.markerName) === needle) return true;
    return rule.markerAliases.some((alias) => normalize(alias) === needle);
  });
}

function evaluateThreshold(value: number, rule: DeficiencyRule): boolean {
  if (rule.thresholdLow !== null && value < rule.thresholdLow) return true;
  if (rule.thresholdHigh !== null && value > rule.thresholdHigh) return true;
  return false;
}

function buildFinding(marker: ExtractedMarker, rule: DeficiencyRule): AuditFinding {
  const direction =
    rule.thresholdLow !== null && marker.value < rule.thresholdLow
      ? 'low'
      : 'high';
  const threshold =
    direction === 'low' ? rule.thresholdLow : rule.thresholdHigh;

  const title =
    direction === 'low'
      ? `${marker.name} low (${marker.value} ${marker.unit})`
      : `${marker.name} high (${marker.value} ${marker.unit})`;

  const referenceLine =
    threshold !== null
      ? `Threshold: ${direction === 'low' ? '<' : '>'} ${threshold} ${rule.unit}.`
      : '';

  let rationale = `${rule.recommendation}${referenceLine ? ` ${referenceLine}` : ''}`;
  if (rule.severity === 'high') {
    rationale = `${rationale} Discuss with your physician.`;
  }

  return {
    // Bloodwork findings reuse the existing 'dosing_concerns' bucket so the
    // current 5-card audit UI doesn't need a new section. The card-level UI
    // can re-key these by inspecting `details` if needed.
    category: 'dosing_concerns',
    severity: rule.severity,
    title,
    rationale: rationale.replace(/\s+/g, ' ').trim(),
    refs: rule.citation ? [rule.citation] : undefined,
    details: rule.supplementSlug ?? undefined,
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
