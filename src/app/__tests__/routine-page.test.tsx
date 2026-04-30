import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

// Mock the data boundary — Drizzle + Supabase shouldn't run in jsdom.
vi.mock('next/headers', () => ({
  cookies: async () => ({}),
}));

vi.mock('../../../utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null } }),
    },
  }),
}));

// Drizzle: build the chainable query objects that .from().where().limit() use.
const emptyArray: unknown[] = [];
const chainable = {
  from: () => chainable,
  where: () => chainable,
  limit: () => emptyArray,
  then: (resolve: (v: unknown[]) => unknown) => Promise.resolve(emptyArray).then(resolve),
};

vi.mock('@/lib/drizzle', () => ({
  db: {
    select: () => chainable,
  },
}));

vi.mock('@/lib/schema-postgres', () => ({
  savedStacks: {},
  supplements: { id: 'id', slug: 'slug', name: 'name', category: 'category' },
  supplementDosage: { supplementId: 'supplementId', perKgFactor: 'perKgFactor', unit: 'unit', maintenance: 'maintenance' },
  supplementConflicts: {},
  userProfiles: { userId: 'userId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: () => ({}),
}));

// StackBuilder makes fetches; stub a no-op to keep render quiet.
vi.stubGlobal(
  'fetch',
  vi.fn(async () => new Response(JSON.stringify({}), { status: 200 })),
);

describe('/routine page', () => {
  it('3: renders without crashing for an anonymous user (no profile, no server stack)', async () => {
    const mod = await import('../routine/page');
    const RoutinePage = mod.default;
    const tree = await RoutinePage();
    // If it returned a React element, jsdom can render it without throwing.
    expect(() => render(tree)).not.toThrow();
  });
});
