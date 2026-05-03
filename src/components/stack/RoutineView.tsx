'use client';

import { useSchedule } from './use-schedule';
import { TimelineView } from './TimelineView';
import { RoutinePanel } from './RoutinePanel';

interface Props {
  /** Supplement display names or slugs — scheduler resolves both via alias lookup. */
  names: string[];
}

/**
 * Pairs the compact 24-hour TimelineView ribbon with the verbose
 * "Your Routine Today" block list. Single useSchedule() call shared
 * between the two so /api/scheduler isn't fetched twice.
 *
 * Order: Timeline first (at-a-glance day shape), then Routine list
 * (full per-block detail). Clicking a Timeline dot scrolls the matching
 * block into view via #routine-block-N anchors.
 */
export function RoutineView({ names }: Props) {
  const { blocks, warnings, loading, error } = useSchedule(names);

  if (names.length === 0) return null;

  return (
    <>
      <TimelineView blocks={blocks} loading={loading} />
      <RoutinePanel blocks={blocks} warnings={warnings} loading={loading} error={error} />
    </>
  );
}
