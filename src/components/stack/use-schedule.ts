'use client';

import { useEffect, useState } from 'react';
import type { ScheduleBlock, SchedulerWarning } from '@/lib/protocol-types';

interface SchedulerResponse {
  schedule: {
    blocks: ScheduleBlock[];
    warnings: SchedulerWarning[];
    generatedAt: string;
  };
}

export interface UseScheduleResult {
  blocks: ScheduleBlock[];
  warnings: SchedulerWarning[];
  loading: boolean;
  error: string | null;
}

// Single source of truth for the scheduler fetch so multiple presentations
// of the same data (TimelineView, RoutinePanel, etc) share a single API
// call instead of stampeding /api/scheduler.
export function useSchedule(names: string[]): UseScheduleResult {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [warnings, setWarnings] = useState<SchedulerWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (names.length === 0) {
      setBlocks([]);
      setWarnings([]);
      return;
    }

    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/scheduler', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplements: names }),
        });
        if (!res.ok) {
          if (!cancelled) setError('Schedule temporarily unavailable.');
          return;
        }
        const data: SchedulerResponse = await res.json();
        if (cancelled) return;
        setBlocks(data.schedule.blocks ?? []);
        setWarnings(data.schedule.warnings ?? []);
      } catch {
        if (!cancelled) setError('Schedule temporarily unavailable.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [names]);

  return { blocks, warnings, loading, error };
}
