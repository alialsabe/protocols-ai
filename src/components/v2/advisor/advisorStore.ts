'use client';

import { useEffect, useState } from 'react';

type Listener = (open: boolean) => void;

let currentOpen = false;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(currentOpen);
}

export function openAdvisor() {
  if (currentOpen) return;
  currentOpen = true;
  emit();
}

export function closeAdvisor() {
  if (!currentOpen) return;
  currentOpen = false;
  emit();
}

export function toggleAdvisor() {
  currentOpen = !currentOpen;
  emit();
}

export function useAdvisorOpen(): boolean {
  const [open, setOpen] = useState(currentOpen);
  useEffect(() => {
    const l: Listener = (v) => setOpen(v);
    listeners.add(l);
    setOpen(currentOpen);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return open;
}
