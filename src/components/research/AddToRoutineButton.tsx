'use client';

import { useState, useEffect } from 'react';

const ROUTINE_KEY = 'materia.routine.v2';

function readRoutine(): string[] {
  try { return JSON.parse(localStorage.getItem(ROUTINE_KEY) ?? '[]'); }
  catch { return []; }
}
function writeRoutine(ids: string[]) {
  localStorage.setItem(ROUTINE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('routine:update'));
}

export function AddToRoutineButton({ slug }: { slug: string }) {
  const [inRoutine, setInRoutine] = useState(false);

  useEffect(() => {
    setInRoutine(readRoutine().includes(slug));
    const on = () => setInRoutine(readRoutine().includes(slug));
    window.addEventListener('routine:update', on);
    return () => window.removeEventListener('routine:update', on);
  }, [slug]);

  const toggle = () => {
    const cur = readRoutine();
    writeRoutine(
      inRoutine ? cur.filter((x) => x !== slug) : [...cur, slug],
    );
  };

  return (
    <button
      className={inRoutine ? 'btn btn--ghost' : 'btn'}
      onClick={toggle}
      style={{ fontSize: 13 }}
    >
      {inRoutine ? '✓ In your routine' : '+ Add to routine'}
    </button>
  );
}
