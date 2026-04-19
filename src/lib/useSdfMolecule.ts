'use client';

/**
 * useSdfMolecule — fetches and parses a real PubChem SDF from /public/molecules/.
 *
 * Returns null while loading or if the SDF is unavailable (caller falls back
 * to hand-authored geometry from data.ts).
 *
 * Strips hydrogen atoms (reduces clutter under bloom) and filters to the
 * known element set in ELEMENT_STYLE. Remaps bond indices after filtering.
 */

import { useEffect, useState } from 'react';
import { parseSdf } from './sdf-parser';
import type { Atom, Bond, Molecule } from '@/components/v2/molecule/types';
import { ELEMENT_STYLE } from '@/components/v2/molecule/types';

type KnownElement = keyof typeof ELEMENT_STYLE;

function isKnown(el: string): el is KnownElement {
  return el in ELEMENT_STYLE;
}

function buildMolecule(slug: string, sdfText: string): Molecule | null {
  try {
    const parsed = parseSdf(sdfText);
    if (parsed.atoms.length === 0) return null;

    // Keep only heavy atoms (no H) with a known element style
    const keptIndices: number[] = [];
    parsed.atoms.forEach((a, i) => {
      if (a.element !== 'H' && isKnown(a.element)) keptIndices.push(i);
    });
    if (keptIndices.length === 0) return null;

    // old atom index → new (compact) index
    const oldToNew = new Map<number, number>();
    keptIndices.forEach((oldIdx, newIdx) => oldToNew.set(oldIdx, newIdx));

    const atoms: Atom[] = keptIndices.map(i => ({
      element: parsed.atoms[i]!.element as KnownElement,
      position: [parsed.atoms[i]!.x, parsed.atoms[i]!.y, parsed.atoms[i]!.z],
    }));

    const bonds: Bond[] = [];
    for (const b of parsed.bonds) {
      const from = oldToNew.get(b.a);
      const to = oldToNew.get(b.b);
      if (from !== undefined && to !== undefined) {
        bonds.push({ from, to, order: b.order });
      }
    }

    // Bounding sphere radius from centroid
    const cx = atoms.reduce((s, a) => s + a.position[0], 0) / atoms.length;
    const cy = atoms.reduce((s, a) => s + a.position[1], 0) / atoms.length;
    const cz = atoms.reduce((s, a) => s + a.position[2], 0) / atoms.length;
    let maxR = 0;
    for (const a of atoms) {
      const r = Math.sqrt(
        (a.position[0] - cx) ** 2 +
        (a.position[1] - cy) ** 2 +
        (a.position[2] - cz) ** 2,
      );
      if (r > maxR) maxR = r;
    }

    return { id: slug, formula: '', atoms, bonds, radius: Math.max(maxR + 1.5, 3) };
  } catch {
    return null;
  }
}

/**
 * Maps DB slugs to SDF filenames when they differ.
 * Add entries here whenever a popular supplement slug doesn't match
 * the filename in /public/molecules/.
 */
const SDF_ALIASES: Record<string, string> = {
  'creatine':            'creatine-monohydrate',
  'caffeine':            'caffeine',          // no SDF — will 404 gracefully
  'fish-oil':            'omega-3-fish-oil',
  'nmn':                 'nicotinamide-mononucleotide-nmn',
  'taurine':             'l-taurine',
  'berberine':           'berberine-hcl',
  'tongkat-ali':         'tongkat-ali',        // no SDF — falls back to hand-authored
  'vitamin-b12':         'vitamin-b12-methylcobalamin',
  'nac':                 'nac',
  'alpha-gpc':           'alpha-gpc',
  'coq10':               'coq10-ubiquinol',
  'vitamin-c':           'vitamin-c',
  'zinc':                'zinc-bisglycinate',
  'iron':                'iron-ferrous-bisglycinate',
};

function sdfFilename(slug: string): string {
  return SDF_ALIASES[slug] ?? slug;
}

export function useSdfMolecule(slug: string): Molecule | null {
  const [molecule, setMolecule] = useState<Molecule | null>(null);

  useEffect(() => {
    setMolecule(null);
    let alive = true;

    fetch(`/molecules/${sdfFilename(slug)}.sdf`)
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(text => { if (alive) setMolecule(buildMolecule(slug, text)); })
      .catch(() => { /* SDF not available — caller stays on hand-authored data */ });

    return () => { alive = false; };
  }, [slug]);

  return molecule;
}
