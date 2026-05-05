'use client';

import { useState } from 'react';
import { OptimizerHome } from '@/components/OptimizerHome';

type Goal = 'sleep' | 'energy' | 'longevity' | 'cognition' | 'muscle';

const VALID_GOALS: Goal[] = ['sleep', 'energy', 'longevity', 'cognition', 'muscle'];

export default function OptimizePage() {
  const [goal, setGoal] = useState<Goal | null>(null);
  return (
    <div className="sl-page">
      <OptimizerHome
        mode="optimize"
        goal={goal ?? undefined}
        onGoalChange={(g) => {
          if (g === '') {
            setGoal(null);
            return;
          }
          if (VALID_GOALS.includes(g as Goal)) setGoal(g as Goal);
        }}
      />
    </div>
  );
}
