import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { StackBuilder } from './StackBuilder';

const ROUTINE_KEY = 'protocolsai.routine.v2';

const SUPP_CREATINE  = { id: 'sup-1', name: 'Creatine Monohydrate', slug: 'creatine-monohydrate', popularityScore: 95 };
const SUPP_MAGNESIUM = { id: 'sup-2', name: 'Magnesium Glycinate',  slug: 'magnesium-glycinate',  popularityScore: 90 };
const SUPP_VITD      = { id: 'sup-3', name: 'Vitamin D3',           slug: 'vitamin-d3',           popularityScore: 92 };
const SUPP_OMEGA     = { id: 'sup-4', name: 'Omega-3 Fish Oil',     slug: 'omega-3-fish-oil',     popularityScore: 88 };
const ALL_SUPPS = [SUPP_CREATINE, SUPP_MAGNESIUM, SUPP_VITD, SUPP_OMEGA];

function setLocalRoutine(slugs: string[]) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(slugs));
}
function getLocalRoutine(): string[] {
  return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? '[]');
}

interface MockServerState {
  authenticated: boolean;
  stack: { id: string; name: string; supplementIds: string[]; supplementNames: string[] } | null;
  postCalls: Array<{ name: string; supplementIds: string[] }>;
}

function mockApi(state: MockServerState) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    if (url === '/api/supplements' && (!init || init.method === undefined)) {
      return new Response(JSON.stringify({ supplements: ALL_SUPPS }), { status: 200 });
    }
    if (url === '/api/stack' && (!init || init.method === undefined || init.method === 'GET')) {
      return new Response(
        JSON.stringify({ authenticated: state.authenticated, stack: state.stack }),
        { status: 200 },
      );
    }
    if (url === '/api/stack' && init?.method === 'POST') {
      const body = JSON.parse(init.body as string);
      state.postCalls.push(body);
      return new Response(JSON.stringify({ id: state.stack?.id ?? 'stack-new' }), { status: 200 });
    }
    if (url.startsWith('/api/supplements/suggestions')) {
      return new Response(JSON.stringify({ suggestions: [] }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('StackBuilder localStorage merge logic (regression suite)', () => {
  let server: MockServerState;

  beforeEach(() => {
    server = { authenticated: false, stack: null, postCalls: [] };
    vi.stubGlobal('fetch', mockApi(server));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('R1: empty local + populated server → hydrates from server, mirrors back to local', async () => {
    setLocalRoutine([]);
    server.authenticated = true;
    server.stack = {
      id: 'stack-x',
      name: 'My Stack',
      supplementIds: [SUPP_VITD.id, SUPP_OMEGA.id],
      supplementNames: [SUPP_VITD.name, SUPP_OMEGA.name],
    };

    render(<StackBuilder />);

    await waitFor(() => {
      expect(screen.getByText(SUPP_VITD.name)).toBeInTheDocument();
      expect(screen.getByText(SUPP_OMEGA.name)).toBeInTheDocument();
    });

    expect(getLocalRoutine()).toEqual([SUPP_VITD.slug, SUPP_OMEGA.slug]);
  });

  it('R2: populated local + populated server → unioned by id, local order first', async () => {
    setLocalRoutine([SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug]);
    server.authenticated = true;
    server.stack = {
      id: 'stack-x',
      name: 'My Stack',
      supplementIds: [SUPP_VITD.id, SUPP_CREATINE.id],
      supplementNames: [SUPP_VITD.name, SUPP_CREATINE.name],
    };

    render(<StackBuilder />);

    await waitFor(() => {
      expect(screen.getByText(SUPP_CREATINE.name)).toBeInTheDocument();
      expect(screen.getByText(SUPP_MAGNESIUM.name)).toBeInTheDocument();
      expect(screen.getByText(SUPP_VITD.name)).toBeInTheDocument();
    });

    const merged = getLocalRoutine();
    expect(merged).toEqual([SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug, SUPP_VITD.slug]);
  });

  it('R3: populated local + empty server → renders local, no server overwrite', async () => {
    setLocalRoutine([SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug]);
    server.authenticated = true;
    server.stack = null;

    render(<StackBuilder />);

    await waitFor(() => {
      expect(screen.getByText(SUPP_CREATINE.name)).toBeInTheDocument();
      expect(screen.getByText(SUPP_MAGNESIUM.name)).toBeInTheDocument();
    });

    expect(getLocalRoutine()).toEqual([SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug]);
  });

  it('R4: routine:update event → re-syncs items from current localStorage', async () => {
    setLocalRoutine([SUPP_CREATINE.slug]);
    server.authenticated = false;

    render(<StackBuilder />);

    await waitFor(() => {
      expect(screen.getByText(SUPP_CREATINE.name)).toBeInTheDocument();
    });

    act(() => {
      localStorage.setItem(ROUTINE_KEY, JSON.stringify([SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug]));
      window.dispatchEvent(new CustomEvent('routine:update'));
    });

    await waitFor(() => {
      expect(screen.getByText(SUPP_MAGNESIUM.name)).toBeInTheDocument();
    });
    expect(screen.getByText(SUPP_CREATINE.name)).toBeInTheDocument();
  });

  it('R5: rapid stack changes for logged-in user → exactly 1 debounced POST to /api/stack', async () => {
    setLocalRoutine([SUPP_CREATINE.slug]);
    server.authenticated = true;
    server.stack = {
      id: 'stack-x',
      name: 'My Stack',
      supplementIds: [SUPP_CREATINE.id],
      supplementNames: [SUPP_CREATINE.name],
    };

    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<StackBuilder />);

    await vi.waitFor(() => {
      expect(screen.getByText(SUPP_CREATINE.name)).toBeInTheDocument();
    });

    const baseline = server.postCalls.length;

    for (let i = 0; i < 5; i++) {
      act(() => {
        const next = i % 2 === 0
          ? [SUPP_CREATINE.slug, SUPP_MAGNESIUM.slug]
          : [SUPP_CREATINE.slug];
        localStorage.setItem(ROUTINE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('routine:update'));
        vi.advanceTimersByTime(100);
      });
    }

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    const newPosts = server.postCalls.length - baseline;
    expect(newPosts).toBe(1);
  });
});
