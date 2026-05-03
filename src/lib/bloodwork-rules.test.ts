import { describe, expect, it } from 'vitest';
import {
  mapMarkersToFindings,
  type DeficiencyRule,
  type ExtractedMarker,
} from './bloodwork-rules';
import type { AuditSeverity } from './audit-engine';

const vitDRule: DeficiencyRule = {
  id: 'rule-vitd',
  markerName: 'vitamin_d_25oh',
  markerAliases: ['25-OH Vitamin D', 'Vitamin D, 25-Hydroxy'],
  unit: 'ng/mL',
  thresholdLow: 30,
  thresholdHigh: null,
  severity: 'high',
  supplementSlug: 'vitamin-d3',
  recommendation: 'Start vitamin D3 2000-5000 IU/day.',
  citation: 'PMID: 21646368',
};

const homairRule: DeficiencyRule = {
  id: 'rule-homair',
  markerName: 'homa_ir',
  markerAliases: ['HOMA-IR'],
  unit: 'index',
  thresholdLow: null,
  thresholdHigh: 2.0,
  severity: 'medium',
  supplementSlug: 'berberine-hcl',
  recommendation: 'Berberine 500 mg with meals.',
  citation: null,
};

const ferritinRule: DeficiencyRule = {
  id: 'rule-ferritin',
  markerName: 'ferritin',
  markerAliases: ['Ferritin'],
  unit: 'ng/mL',
  thresholdLow: 30,
  thresholdHigh: null,
  severity: 'low',
  supplementSlug: 'iron-ferrous-bisglycinate',
  recommendation: 'Iron bisglycinate.',
  citation: null,
};

const infoRule: DeficiencyRule = {
  id: 'rule-info',
  markerName: 'info_marker',
  markerAliases: [],
  unit: 'mg/dL',
  thresholdLow: 100,
  thresholdHigh: null,
  severity: 'info',
  supplementSlug: null,
  recommendation: 'Just FYI.',
  citation: null,
};

describe('mapMarkersToFindings', () => {
  it('matches a marker by alias case-insensitively', () => {
    const markers: ExtractedMarker[] = [
      { name: '25-oh vitamin d', value: 18, unit: 'ng/mL' },
    ];
    const findings = mapMarkersToFindings(markers, [vitDRule]);
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('high');
    expect(findings[0].title).toContain('25-oh vitamin d');
    // High severity should append physician disclaimer.
    expect(findings[0].rationale).toMatch(/discuss with your physician/i);
    expect(findings[0].refs).toEqual(['PMID: 21646368']);
  });

  it('fires when a marker is below threshold_low', () => {
    const findings = mapMarkersToFindings(
      [{ name: 'Ferritin', value: 12, unit: 'ng/mL' }],
      [ferritinRule],
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('low');
    expect(findings[0].details).toBe('iron-ferrous-bisglycinate');
  });

  it('does not fire when a marker is within range', () => {
    const findings = mapMarkersToFindings(
      [{ name: 'Ferritin', value: 80, unit: 'ng/mL' }],
      [ferritinRule],
    );
    expect(findings).toEqual([]);
  });

  it('fires when a marker is above threshold_high', () => {
    const findings = mapMarkersToFindings(
      [{ name: 'HOMA-IR', value: 2.7, unit: 'index' }],
      [homairRule],
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].title).toContain('high');
    expect(findings[0].severity).toBe('medium');
    // Medium severity should NOT carry the physician disclaimer.
    expect(findings[0].rationale).not.toMatch(/discuss with your physician/i);
  });

  it('silently skips markers with no matching rule', () => {
    const findings = mapMarkersToFindings(
      [{ name: 'Some Random Marker', value: 1, unit: 'g/dL' }],
      [vitDRule, homairRule],
    );
    expect(findings).toEqual([]);
  });

  it('orders findings high -> medium -> low -> info', () => {
    const markers: ExtractedMarker[] = [
      { name: 'info_marker', value: 50, unit: 'mg/dL' },
      { name: 'HOMA-IR', value: 3.0, unit: 'index' },
      { name: '25-OH Vitamin D', value: 15, unit: 'ng/mL' },
      { name: 'Ferritin', value: 10, unit: 'ng/mL' },
    ];
    const findings = mapMarkersToFindings(markers, [
      infoRule,
      homairRule,
      vitDRule,
      ferritinRule,
    ]);
    const order = findings.map((f) => f.severity) as AuditSeverity[];
    expect(order).toEqual(['high', 'medium', 'low', 'info']);
  });
});
