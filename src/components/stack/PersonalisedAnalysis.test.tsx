import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { PersonalisedAnalysis } from './PersonalisedAnalysis';

const ROUTINE_KEY = 'protocolsai.routine.v2';

const SUPP_CREATINE = {
  id: 'sup-1',
  slug: 'creatine-monohydrate',
  name: 'Creatine Monohydrate',
  category: 'performance',
};
const SUPP_CAFFEINE = {
  id: 'sup-2',
  slug: 'caffeine',
  name: 'Caffeine',
  category: 'stimulant',
};
const SUPP_MELATONIN = {
  id: 'sup-3',
  slug: 'melatonin',
  name: 'Melatonin',
  category: 'sleep',
};
const SUPP_OMEGA = {
  id: 'sup-4',
  slug: 'omega-3-fish-oil',
  name: 'Omega-3 Fish Oil',
  category: 'fat',
};

const ALL_SUPPS = [SUPP_CREATINE, SUPP_CAFFEINE, SUPP_MELATONIN, SUPP_OMEGA];

const DOSAGES = [
  {
    supplementId: SUPP_CREATINE.id,
    perKgFactor: 0.07,
    unit: 'g',
    maintenance: '5 g/day',
  },
];

// Conflicts: caffeine+melatonin (in routine), creatine+omega (NOT in routine).
const CONFLICTS = [
  {
    id: 'c-1',
    supplementAId: SUPP_CAFFEINE.id,
    supplementBId: SUPP_MELATONIN.id,
    conflictType: 'antagonism',
    severity: 'high',
    mechanism: 'Stimulant directly opposes the sedative pathway.',
    minSpacingHours: 8,
  },
  {
    id: 'c-2',
    supplementAId: SUPP_CREATINE.id,
    supplementBId: SUPP_OMEGA.id,
    conflictType: 'absorption',
    severity: 'medium',
    mechanism: 'Should not appear — neither is in the routine for test #10.',
    minSpacingHours: 2,
  },
];

function setLocalRoutine(slugs: string[]) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(slugs));
}

describe('PersonalisedAnalysis', () => {
  beforeEach(() => {
    // Stub fetch so any debounced biometrics POSTs don't error.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('9: graceful degradation — failures.biometrics === true → fallback shown, list still renders', async () => {
    setLocalRoutine([SUPP_CAFFEINE.slug, SUPP_MELATONIN.slug]);

    render(
      <PersonalisedAnalysis
        initialBiometrics={{}}
        isAuthenticated={false}
        supplements={ALL_SUPPS}
        dosages={DOSAGES}
        conflicts={CONFLICTS}
        failures={{ biometrics: true }}
      />,
    );

    // Fallback message shows for the personalised dosing subsection.
    await waitFor(() => {
      expect(
        screen.getByText(/Personalised dosing temporarily unavailable/i),
      ).toBeInTheDocument();
    });

    // Conflicts list still renders the in-routine conflict.
    expect(
      screen.getByText(`${SUPP_CAFFEINE.name} + ${SUPP_MELATONIN.name}`),
    ).toBeInTheDocument();
  });

  it('10: conflict cards only render for pairs where BOTH are in current routine', async () => {
    // Routine has caffeine + melatonin. The creatine+omega conflict in CONFLICTS
    // must NOT appear because creatine is in routine but omega is not.
    setLocalRoutine([SUPP_CAFFEINE.slug, SUPP_MELATONIN.slug, SUPP_CREATINE.slug]);

    render(
      <PersonalisedAnalysis
        initialBiometrics={{}}
        isAuthenticated={false}
        supplements={ALL_SUPPS}
        dosages={DOSAGES}
        conflicts={CONFLICTS}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByText(`${SUPP_CAFFEINE.name} + ${SUPP_MELATONIN.name}`),
      ).toBeInTheDocument();
    });

    // The creatine+omega pair is not in the routine — must not render.
    expect(
      screen.queryByText(`${SUPP_CREATINE.name} + ${SUPP_OMEGA.name}`),
    ).not.toBeInTheDocument();
  });

  it('11: routine:update event causes re-derivation against new localStorage', async () => {
    setLocalRoutine([SUPP_CAFFEINE.slug]);

    render(
      <PersonalisedAnalysis
        initialBiometrics={{}}
        isAuthenticated={false}
        supplements={ALL_SUPPS}
        dosages={DOSAGES}
        conflicts={CONFLICTS}
      />,
    );

    // With only caffeine in routine, the caffeine+melatonin conflict can't render.
    await waitFor(() => {
      expect(screen.getByText(/no conflicts detected/i)).toBeInTheDocument();
    });

    // Now externally add melatonin and dispatch routine:update.
    act(() => {
      setLocalRoutine([SUPP_CAFFEINE.slug, SUPP_MELATONIN.slug]);
      window.dispatchEvent(new CustomEvent('routine:update'));
    });

    await waitFor(() => {
      expect(
        screen.getByText(`${SUPP_CAFFEINE.name} + ${SUPP_MELATONIN.name}`),
      ).toBeInTheDocument();
    });
  });
});
