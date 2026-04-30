import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BiometricsForm } from './BiometricsForm';

const BIOMETRICS_KEY = 'protocolsai.biometrics.v1';

interface ProfileApiState {
  postCalls: Array<{ weightKg?: number; heightCm?: number }>;
}

function mockProfileApi(state: ProfileApiState) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : (input as URL).toString();
    if (url === '/api/profile' && init?.method === 'PATCH') {
      const body = JSON.parse(init.body as string);
      state.postCalls.push(body);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response('not found', { status: 404 });
  });
}

describe('BiometricsForm', () => {
  let api: ProfileApiState;

  beforeEach(() => {
    api = { postCalls: [] };
    vi.stubGlobal('fetch', mockProfileApi(api));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('6: anonymous user — entering weight updates localStorage, no /api/profile POST', async () => {
    render(
      <BiometricsForm
        initialBiometrics={{}}
        weightDosages={[]}
        isAuthenticated={false}
      />,
    );

    const weightInput = screen.getByPlaceholderText('e.g. 75') as HTMLInputElement;

    fireEvent.change(weightInput, { target: { value: '70' } });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(BIOMETRICS_KEY) ?? '{}');
      expect(stored.weightKg).toBe(70);
    });

    // Give debounced timer plenty of time — no profile POST should ever fire.
    await new Promise((r) => setTimeout(r, 800));
    expect(api.postCalls.length).toBe(0);
  });

  it('7: logged-in user — debounce collapses 5 rapid changes to exactly 1 /api/profile POST', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <BiometricsForm
        initialBiometrics={{}}
        weightDosages={[]}
        isAuthenticated={true}
      />,
    );

    const weightInput = screen.getByPlaceholderText('e.g. 75') as HTMLInputElement;

    // Fire 5 changes rapidly, advancing only 100ms between each (under the
    // 700ms debounce window).
    for (let i = 0; i < 5; i++) {
      act(() => {
        fireEvent.change(weightInput, { target: { value: String(70 + i) } });
        vi.advanceTimersByTime(100);
      });
    }

    // Now flush the debounce — single POST should fire after 700ms idle.
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Allow microtask queue to flush async fetch handler.
    await act(async () => {
      await Promise.resolve();
    });

    expect(api.postCalls.length).toBe(1);
    // The final value (74) is what gets sent.
    expect(api.postCalls[0].weightKg).toBe(74);
  });

  it('8a: anonymous — pre-existing localStorage biometrics pre-fill the form', async () => {
    localStorage.setItem(
      BIOMETRICS_KEY,
      JSON.stringify({ weightKg: 82, heightCm: 180 }),
    );

    render(
      <BiometricsForm
        initialBiometrics={{}}
        weightDosages={[]}
        isAuthenticated={false}
      />,
    );

    await waitFor(() => {
      const weightInput = screen.getByPlaceholderText('e.g. 75') as HTMLInputElement;
      expect(weightInput.value).toBe('82');
    });

    const heightInput = screen.getByPlaceholderText('e.g. 175') as HTMLInputElement;
    expect(heightInput.value).toBe('180');
  });

  it('8b: logged-in — server-supplied initialBiometrics seeds the form (server is authoritative)', async () => {
    // No localStorage biometrics on this device — server value is the seed.
    render(
      <BiometricsForm
        initialBiometrics={{ weightKg: 90, heightCm: 185 }}
        weightDosages={[]}
        isAuthenticated={true}
      />,
    );

    const weightInput = screen.getByPlaceholderText('e.g. 75') as HTMLInputElement;
    expect(weightInput.value).toBe('90');
    const heightInput = screen.getByPlaceholderText('e.g. 175') as HTMLInputElement;
    expect(heightInput.value).toBe('185');

    // After hydration, localStorage gets mirrored from server (per design doc:
    // server is authoritative, localStorage is the mirror).
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(BIOMETRICS_KEY) ?? '{}');
      expect(stored.weightKg).toBe(90);
      expect(stored.heightCm).toBe(185);
    });
  });
});
