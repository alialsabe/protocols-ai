import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  inserted: [] as unknown[],
  authedUser: { id: 'user-1' } as { id: string } | null,
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({})),
}));

vi.mock('../../../../utils/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: state.authedUser } })),
    },
  })),
}));

vi.mock('drizzle-orm', () => ({
  inArray: vi.fn((column: unknown, values: unknown[]) => ({ column, values })),
}));

vi.mock('@/lib/schema-postgres', () => ({
  auditSessions: { __name: 'audit_sessions' },
  medicineInteractions: { __name: 'medicine_interactions', supplementId: 'supplement_id' },
  supplementConflicts: { __name: 'conflicts' },
  supplementDosage: {
    __name: 'supplement_dosage',
    supplementId: 'supplement_id',
    perKgFactor: 'per_kg_factor',
    unit: 'unit',
    maintenance: 'maintenance',
  },
  supplements: {
    __name: 'supplements',
    id: 'id',
    slug: 'slug',
    name: 'name',
  },
}));

vi.mock('@/lib/drizzle', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn((table: { __name: string }) => ({
        where: vi.fn(() => rowsFor(table.__name)),
        then: (resolve: (value: unknown[]) => void) => Promise.resolve(rowsFor(table.__name)).then(resolve),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async (value: unknown) => {
        state.inserted.push(value);
      }),
    })),
  },
}));

vi.mock('@/lib/scheduler-engine', () => ({
  generateSchedule: vi.fn(async () => ({
    blocks: [],
    warnings: [{
      type: 'food',
      severity: 'info',
      message: 'Iron is best away from coffee.',
      supplements: ['iron'],
    }],
    generatedAt: '2026-04-30T00:00:00.000Z',
  })),
}));

function rowsFor(tableName: string) {
  if (tableName === 'supplements') {
    return [
      { id: 's-5htp', slug: '5-htp', name: '5-HTP' },
      { id: 's-iron', slug: 'iron', name: 'Iron' },
      { id: 's-calcium', slug: 'calcium', name: 'Calcium' },
    ];
  }
  if (tableName === 'medicine_interactions') {
    return [{
      supplementId: 's-5htp',
      medicineName: 'Sertraline',
      medicineClass: 'SSRI',
      severity: 'high',
      mechanism: 'Serotonergic overlap may increase serotonin syndrome risk.',
      recommendation: 'Avoid unless supervised.',
      source: 'curated',
    }];
  }
  if (tableName === 'conflicts') {
    return [{
      supplementAId: 's-iron',
      supplementBId: 's-calcium',
      conflictType: 'spacing_required',
      minSpacingHours: 2,
      mechanism: 'Calcium can reduce iron absorption.',
      severity: 'medium',
    }];
  }
  if (tableName === 'supplement_dosage') {
    return [{
      supplementId: 's-iron',
      perKgFactor: 1,
      unit: 'mg',
      maintenance: '10-20 mg',
    }];
  }
  return [];
}

describe('POST /api/audit', () => {
  beforeEach(() => {
    state.inserted = [];
    state.authedUser = { id: 'user-1' };
  });

  it('returns rule-based findings and persists an authenticated audit session', async () => {
    const { POST } = await import('./route');
    const res = await POST(new Request('http://test.local/api/audit', {
      method: 'POST',
      body: JSON.stringify({
        supplementIds: ['5-htp', 'iron', 'calcium'],
        medications: ['sertraline'],
        biometrics: { weightKg: 80 },
      }),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ category: 'drug_supplement_interactions', severity: 'high' }),
      expect.objectContaining({ category: 'supplement_supplement_conflicts', severity: 'medium' }),
      expect.objectContaining({ category: 'timing_issues', severity: 'info' }),
    ]));
    expect(state.inserted).toHaveLength(1);
    expect(state.inserted[0]).toEqual(expect.objectContaining({
      userId: 'user-1',
      stackSnapshot: expect.objectContaining({ supplements: ['5-htp', 'iron', 'calcium'] }),
    }));
  });

  it('skips audit session persistence for anonymous users', async () => {
    state.authedUser = null;
    const { POST } = await import('./route');
    const res = await POST(new Request('http://test.local/api/audit', {
      method: 'POST',
      body: JSON.stringify({ supplementIds: ['iron'], medications: [] }),
    }));

    expect(res.status).toBe(200);
    expect(state.inserted).toHaveLength(0);
  });
});
