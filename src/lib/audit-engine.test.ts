import { describe, expect, it } from 'vitest';
import {
  REDUNDANCY_RULES,
  findDosingConcerns,
  findDrugSupplementInteractions,
  findRedundancies,
  findSupplementSupplementConflicts,
  findTimingIssues,
  runAudit,
  type AuditSupplement,
} from './audit-engine';

const fiveHtp: AuditSupplement = { id: 's-5htp', slug: '5-htp', name: '5-HTP' };
const iron: AuditSupplement = { id: 's-iron', slug: 'iron', name: 'Iron' };
const calcium: AuditSupplement = { id: 's-calcium', slug: 'calcium', name: 'Calcium' };

describe('audit engine category functions', () => {
  it('finds drug-supplement interactions by med name', () => {
    const findings = findDrugSupplementInteractions({
      supplements: [fiveHtp],
      medications: ['sertraline'],
      medicineInteractions: [{
        supplementId: fiveHtp.id,
        medicineName: 'Sertraline',
        medicineClass: 'SSRI',
        severity: 'high',
        mechanism: 'Serotonergic overlap may increase serotonin syndrome risk.',
        recommendation: 'Avoid unless supervised.',
        source: 'curated',
      }],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({
      category: 'drug_supplement_interactions',
      severity: 'high',
      title: '5-HTP + Sertraline',
    });
  });

  it('returns no drug findings without medications', () => {
    expect(findDrugSupplementInteractions({ supplements: [fiveHtp], medications: [] })).toEqual([]);
  });

  it('finds supplement-supplement conflicts', () => {
    const findings = findSupplementSupplementConflicts({
      supplements: [iron, calcium],
      medications: [],
      supplementConflicts: [{
        supplementAId: iron.id,
        supplementBId: calcium.id,
        conflictType: 'spacing_required',
        minSpacingHours: 2,
        mechanism: 'Calcium can reduce iron absorption.',
        severity: 'medium',
      }],
    });

    expect(findings).toHaveLength(1);
    expect(findings[0].rationale).toContain('Space 2h apart');
  });

  it('returns no supplement conflict findings with a single supplement', () => {
    expect(findSupplementSupplementConflicts({ supplements: [iron], medications: [] })).toEqual([]);
  });

  it('converts scheduler warnings into timing findings', () => {
    const findings = findTimingIssues({
      supplements: [iron],
      medications: [],
      schedulerWarnings: [{
        type: 'food',
        severity: 'info',
        message: 'Iron is best away from coffee.',
        supplements: ['iron'],
      }],
    });

    expect(findings).toEqual([expect.objectContaining({
      category: 'timing_issues',
      severity: 'info',
      title: 'Timing with food',
    })]);
  });

  it('returns no timing findings without scheduler warnings', () => {
    expect(findTimingIssues({ supplements: [iron], medications: [] })).toEqual([]);
  });

  it('finds redundancies', () => {
    const findings = findRedundancies({
      supplements: [
        { id: 'a', slug: 'b-complex', name: 'B-Complex' },
        { id: 'b', slug: 'vitamin-b12', name: 'Vitamin B12' },
      ],
      medications: [],
    });

    expect(findings[0]).toMatchObject({
      category: 'redundancies',
      severity: 'medium',
      details: 'b-complex-b12',
    });
  });

  it('returns no redundancy findings without matching pairs', () => {
    expect(findRedundancies({ supplements: [iron], medications: [] })).toEqual([]);
  });

  it('finds weight-based dosing concerns', () => {
    const findings = findDosingConcerns({
      supplements: [{ id: 'ash', slug: 'ashwagandha', name: 'Ashwagandha', currentDoseMg: 300 }],
      medications: [],
      biometrics: { weightKg: 80 },
      dosages: [{ supplementId: 'ash', perKgFactor: 7.5, unit: 'mg', maintenance: '300-600 mg' }],
    });

    expect(findings).toEqual([expect.objectContaining({
      category: 'dosing_concerns',
      severity: 'low',
      title: 'Ashwagandha may be under clinical dose',
    })]);
  });

  it('returns no dosing findings without supplements', () => {
    expect(findDosingConcerns({ supplements: [], medications: [] })).toEqual([]);
  });
});

describe('redundancy rules', () => {
  for (const rule of REDUNDANCY_RULES) {
    it(`fires ${rule.id} on the right slug pair`, () => {
      const findings = findRedundancies({
        supplements: [
          { id: 'a', slug: rule.triggerA[0], name: rule.triggerA[0] },
          { id: 'b', slug: rule.triggerB[0], name: rule.triggerB[0] },
        ],
        medications: [],
      });

      expect(findings.some((finding) => finding.details === rule.id)).toBe(true);
    });
  }
});

describe('runAudit', () => {
  it('sorts findings high before medium before low before info', () => {
    const findings = runAudit({
      supplements: [
        fiveHtp,
        iron,
        calcium,
        { id: 'multi', slug: 'multivitamin', name: 'Multivitamin' },
        { id: 'vitd', slug: 'vitamin-d3', name: 'Vitamin D3' },
      ],
      medications: ['sertraline'],
      medicineInteractions: [{
        supplementId: fiveHtp.id,
        medicineName: 'Sertraline',
        medicineClass: 'SSRI',
        severity: 'high',
        mechanism: 'Serotonergic overlap.',
        recommendation: 'Avoid.',
        source: null,
      }],
      supplementConflicts: [{
        supplementAId: iron.id,
        supplementBId: calcium.id,
        conflictType: 'spacing_required',
        minSpacingHours: 2,
        mechanism: 'Calcium can reduce iron absorption.',
        severity: 'medium',
      }],
      schedulerWarnings: [{
        type: 'food',
        severity: 'info',
        message: 'Iron is best away from coffee.',
        supplements: ['iron'],
      }],
    });

    expect(findings.map((f) => f.severity)).toEqual(['high', 'medium', 'low', 'low', 'info']);
  });

  it('uses label-based dose fallback when biometrics are absent', () => {
    const findings = findDosingConcerns({
      supplements: [{ id: 'cre', slug: 'creatine', name: 'Creatine', currentDoseMg: 1000 }],
      medications: [],
      dosages: [{ supplementId: 'cre', perKgFactor: 0.05, unit: 'mg', maintenance: '3000-5000 mg' }],
    });

    expect(findings[0]).toMatchObject({
      severity: 'low',
      title: 'Creatine may be below typical clinical range',
    });
  });
});
