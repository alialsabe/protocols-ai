/**
 * Types for the molecular hero renderer.
 *
 * We represent every supplement as either one `Molecule` (simple compounds
 * like creatine, caffeine) or a `Constellation` — multiple molecules orbiting
 * a shared center, for plant extracts and blends (ashwagandha, omega-3).
 *
 * Atom positions are hand-authored, simplified geometry. Not chemically
 * accurate bond lengths — tuned to read well under bloom.
 */

export type Element = 'C' | 'H' | 'N' | 'O' | 'P' | 'S' | 'Mg' | 'Fe';

export type Atom = {
  element: Element;
  position: [number, number, number];
};

export type Bond = {
  from: number; // index into atoms[]
  to: number;
  order?: 1 | 2 | 3; // default 1
};

export type Molecule = {
  id: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
  /** Bounding sphere radius used to frame the camera. */
  radius?: number;
};

export type Constellation = {
  id: string;
  /** 2-4 small molecules orbiting a shared center. */
  members: Molecule[];
};

export type SupplementRender =
  | { slug: string; name: string; kind: 'single'; molecule: Molecule }
  | { slug: string; name: string; kind: 'constellation'; constellation: Constellation };

/** Color + radius per element, tuned for the holographic render. */
export const ELEMENT_STYLE: Record<Element, { color: string; radius: number; emissive: number }> = {
  C:  { color: '#06D6A0', radius: 0.42, emissive: 0.9 },
  H:  { color: '#f5f5f5', radius: 0.22, emissive: 0.6 },
  N:  { color: '#4d9dff', radius: 0.40, emissive: 1.1 },
  O:  { color: '#ff4d6d', radius: 0.38, emissive: 1.0 },
  P:  { color: '#f2c14e', radius: 0.48, emissive: 0.9 },
  S:  { color: '#ffd166', radius: 0.46, emissive: 0.9 },
  Mg: { color: '#c4b5fd', radius: 0.56, emissive: 1.2 },
  Fe: { color: '#e07a5f', radius: 0.52, emissive: 1.0 },
};
