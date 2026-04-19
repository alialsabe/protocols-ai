import type { Molecule, SupplementRender } from './types';

/**
 * Hand-authored molecule geometry for the v1 hero.
 *
 * Positions are simplified — not chemically accurate bond lengths. Each
 * molecule is centered near the origin and sized so its bounding radius
 * is roughly 2.5 units, which plays nicely with the camera rig.
 *
 * Atoms marked only by element + 3D position. Bonds reference atom indices.
 * Hydrogens are omitted on heavy atoms except where they dominate the shape
 * (keeps the render readable under bloom).
 */

// --- Simple molecules (single-render) --- //

const creatine: Molecule = {
  id: 'creatine',
  formula: 'C4H9N3O2',
  atoms: [
    { element: 'N', position: [-1.8,  0.6, 0.0] }, // amine 1
    { element: 'C', position: [-0.9,  0.0, 0.3] }, // central C
    { element: 'N', position: [-1.0, -1.3, 0.0] }, // amine 2
    { element: 'N', position: [ 0.3,  0.4, 0.7] }, // N-methyl
    { element: 'C', position: [ 1.3, -0.3, 0.4] }, // C-methyl
    { element: 'C', position: [ 1.0,  1.7, 0.9] }, // methyl carbon
    { element: 'C', position: [ 2.6,  0.1, 0.0] }, // carboxyl C
    { element: 'O', position: [ 3.3, -0.9, 0.1] }, // =O
    { element: 'O', position: [ 2.9,  1.3, -0.3] }, // -OH
  ],
  bonds: [
    { from: 0, to: 1 }, { from: 1, to: 2, order: 2 }, { from: 1, to: 3 },
    { from: 3, to: 4 }, { from: 3, to: 5 }, { from: 4, to: 6 },
    { from: 6, to: 7, order: 2 }, { from: 6, to: 8 },
  ],
  radius: 3.5,
};

const caffeine: Molecule = {
  id: 'caffeine',
  formula: 'C8H10N4O2',
  atoms: [
    // purine ring (6-ring + 5-ring fused)
    { element: 'N', position: [-1.5,  1.1, 0.0] },
    { element: 'C', position: [-0.3,  1.6, 0.2] },
    { element: 'N', position: [ 0.8,  0.9, 0.0] },
    { element: 'C', position: [ 0.6, -0.5, -0.2] },
    { element: 'C', position: [-0.7, -1.0, -0.1] },
    { element: 'N', position: [-1.8, -0.3, 0.1] },
    // imidazole
    { element: 'N', position: [-0.7, -2.4, -0.3] },
    { element: 'C', position: [ 0.6, -2.5, -0.4] },
    { element: 'N', position: [ 1.3, -1.3, -0.4] },
    // carbonyls
    { element: 'O', position: [-0.3,  2.8, 0.4] },
    { element: 'O', position: [-2.9, -0.8, 0.2] },
    // methyls
    { element: 'C', position: [-2.7,  1.9, -0.1] },
    { element: 'C', position: [ 2.1,  1.5, 0.1] },
    { element: 'C', position: [ 2.7, -1.2, -0.6] },
  ],
  bonds: [
    { from: 0, to: 1 }, { from: 1, to: 2, order: 2 }, { from: 2, to: 3 },
    { from: 3, to: 4, order: 2 }, { from: 4, to: 5 }, { from: 5, to: 0 },
    { from: 4, to: 6 }, { from: 6, to: 7, order: 2 }, { from: 7, to: 8 },
    { from: 8, to: 3 },
    { from: 1, to: 9, order: 2 }, { from: 5, to: 10, order: 2 },
    { from: 0, to: 11 }, { from: 2, to: 12 }, { from: 8, to: 13 },
  ],
  radius: 3.6,
};

const melatonin: Molecule = {
  id: 'melatonin',
  formula: 'C13H16N2O2',
  atoms: [
    // indole (bicyclic)
    { element: 'C', position: [-2.8,  1.0, 0.0] },
    { element: 'C', position: [-1.7,  1.8, 0.2] },
    { element: 'C', position: [-0.5,  1.2, 0.0] },
    { element: 'C', position: [-0.4, -0.3, -0.2] },
    { element: 'C', position: [-1.6, -1.1, -0.3] },
    { element: 'C', position: [-2.8, -0.4, -0.1] },
    { element: 'C', position: [ 0.9, -0.6, -0.3] },
    { element: 'C', position: [ 1.7,  0.6, -0.1] },
    { element: 'N', position: [ 0.7,  1.7,  0.1] },
    // methoxy
    { element: 'O', position: [-4.1,  1.7,  0.2] },
    { element: 'C', position: [-5.1,  0.8,  0.3] },
    // ethylamide chain
    { element: 'C', position: [ 3.1,  0.6, -0.2] },
    { element: 'C', position: [ 3.7,  1.9, -0.0] },
    { element: 'N', position: [ 5.1,  2.0, -0.1] },
    { element: 'C', position: [ 5.9,  0.9, -0.0] },
    { element: 'O', position: [ 5.4, -0.2,  0.2] },
    { element: 'C', position: [ 7.3,  1.1, -0.2] }, // methyl of acetyl
  ],
  bonds: [
    { from: 0, to: 1, order: 2 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 },
    { from: 3, to: 4 }, { from: 4, to: 5, order: 2 }, { from: 5, to: 0 },
    { from: 3, to: 6 }, { from: 6, to: 7, order: 2 }, { from: 7, to: 8 }, { from: 8, to: 2 },
    { from: 0, to: 9 }, { from: 9, to: 10 },
    { from: 7, to: 11 }, { from: 11, to: 12 }, { from: 12, to: 13 },
    { from: 13, to: 14 }, { from: 14, to: 15, order: 2 }, { from: 14, to: 16 },
  ],
  radius: 5.0,
};

const ltheanine: Molecule = {
  id: 'l-theanine',
  formula: 'C7H14N2O3',
  atoms: [
    { element: 'N', position: [-2.8,  0.5, 0.0] }, // amine
    { element: 'C', position: [-1.7, -0.3, 0.2] }, // alpha-C
    { element: 'C', position: [-0.4,  0.5, 0.0] }, // COOH-C
    { element: 'O', position: [ 0.6, -0.1, -0.3] },
    { element: 'O', position: [-0.4,  1.8,  0.1] },
    { element: 'C', position: [-1.7, -1.7, -0.1] }, // beta-C
    { element: 'C', position: [-0.5, -2.5,  0.1] }, // gamma-C
    { element: 'C', position: [-0.4, -3.9, -0.0] }, // C=O (amide)
    { element: 'O', position: [-1.3, -4.6, -0.2] },
    { element: 'N', position: [ 0.8, -4.4,  0.1] }, // N-ethyl
    { element: 'C', position: [ 1.1, -5.8,  0.0] },
    { element: 'C', position: [ 2.4, -6.2,  0.1] },
  ],
  bonds: [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 }, { from: 2, to: 4 },
    { from: 1, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 },
    { from: 7, to: 8, order: 2 }, { from: 7, to: 9 }, { from: 9, to: 10 }, { from: 10, to: 11 },
  ],
  radius: 5.5,
};

const vitaminD3: Molecule = {
  id: 'vitamin-d3',
  formula: 'C27H44O',
  // Simplified: a cyclohexane ring + extended diene bridge + side chain.
  // Not accurate stereochemistry — reads as "a sterol" under bloom.
  atoms: [
    { element: 'O', position: [-4.6,  2.2, 0.0] },
    { element: 'C', position: [-3.4,  1.5, 0.0] },
    { element: 'C', position: [-2.2,  2.3, 0.2] },
    { element: 'C', position: [-1.0,  1.6, 0.1] },
    { element: 'C', position: [-1.1,  0.1, -0.1] },
    { element: 'C', position: [-2.3, -0.7, -0.2] },
    { element: 'C', position: [-3.5,  0.0, -0.1] },
    { element: 'C', position: [ 0.2, -0.6, -0.2] },
    { element: 'C', position: [ 1.4, -0.0,  0.0] },
    { element: 'C', position: [ 2.7, -0.7, -0.0] },
    { element: 'C', position: [ 3.9, -0.1,  0.1] },
    { element: 'C', position: [ 5.2, -0.8,  0.1] },
    { element: 'C', position: [ 6.4, -0.1,  0.3] },
    { element: 'C', position: [ 7.7, -0.8,  0.3] },
    { element: 'C', position: [ 8.9, -0.1,  0.5] },
    { element: 'C', position: [ 10.0, -0.8,  0.5] },
    { element: 'C', position: [ 10.0,  0.7,  1.2] },
  ],
  bonds: [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
    { from: 3, to: 4 }, { from: 4, to: 5, order: 2 }, { from: 5, to: 6 }, { from: 6, to: 1 },
    { from: 4, to: 7, order: 2 }, { from: 7, to: 8 }, { from: 8, to: 9, order: 2 },
    { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
    { from: 12, to: 13 }, { from: 13, to: 14 }, { from: 14, to: 15 }, { from: 14, to: 16 },
  ],
  radius: 9.0,
};

const magnesiumGlycinate: Molecule = {
  id: 'magnesium-glycinate',
  formula: 'C4H8MgN2O4',
  atoms: [
    { element: 'Mg', position: [0.0,  0.0, 0.0] },
    // glycinate 1
    { element: 'O', position: [ 1.6,  0.7, 0.0] },
    { element: 'C', position: [ 2.8,  0.0, 0.0] },
    { element: 'O', position: [ 2.9, -1.3, 0.0] },
    { element: 'C', position: [ 4.0,  0.8, 0.0] },
    { element: 'N', position: [ 5.2,  0.0, 0.0] },
    // glycinate 2
    { element: 'O', position: [-1.6, -0.7, 0.0] },
    { element: 'C', position: [-2.8, -0.0, 0.0] },
    { element: 'O', position: [-2.9,  1.3, 0.0] },
    { element: 'C', position: [-4.0, -0.8, 0.0] },
    { element: 'N', position: [-5.2, -0.0, 0.0] },
  ],
  bonds: [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 },
    { from: 2, to: 4 }, { from: 4, to: 5 },
    { from: 0, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8, order: 2 },
    { from: 7, to: 9 }, { from: 9, to: 10 },
    { from: 0, to: 3 }, { from: 0, to: 8 }, // chelate ring closures
  ],
  radius: 5.8,
};

// --- Small molecule primitives for constellations --- //

function smallMolecule(id: string, atoms: Molecule['atoms'], bonds: Molecule['bonds']): Molecule {
  return { id, formula: '', atoms, bonds, radius: 2.2 };
}

const withanolideA = smallMolecule('withanolide-a', [
  { element: 'O', position: [-1.2,  0.8, 0.0] },
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 1.2,  0.8, 0.0] },
  { element: 'O', position: [ 2.4,  0.0, 0.0] },
  { element: 'C', position: [ 1.2, -1.4, 0.0] },
  { element: 'C', position: [ 0.0, -2.0, 0.0] },
], [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 },
  { from: 2, to: 4 }, { from: 4, to: 5 },
]);

const withaferinA = smallMolecule('withaferin-a', [
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 1.2,  0.6, 0.0] },
  { element: 'O', position: [ 2.4,  0.0, 0.0] },
  { element: 'C', position: [-1.2,  0.6, 0.0] },
  { element: 'O', position: [-2.4,  0.0, 0.0] },
  { element: 'C', position: [ 0.0, -1.4, 0.0] },
], [
  { from: 0, to: 1 }, { from: 1, to: 2, order: 2 },
  { from: 0, to: 3 }, { from: 3, to: 4 }, { from: 0, to: 5 },
]);

const withanosideIV = smallMolecule('withanoside-iv', [
  { element: 'O', position: [-1.4,  0.0, 0.0] },
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'O', position: [ 0.7,  1.2, 0.0] },
  { element: 'C', position: [ 1.4,  0.0, 0.0] },
  { element: 'O', position: [ 0.7, -1.2, 0.0] },
], [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 1, to: 3 }, { from: 3, to: 4 },
]);

const hericenoneB = smallMolecule('hericenone-b', [
  { element: 'C', position: [-1.2,  0.8, 0.0] },
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 1.2,  0.8, 0.0] },
  { element: 'O', position: [ 2.4,  0.0, 0.0] },
  { element: 'C', position: [ 0.0, -1.4, 0.0] },
  { element: 'O', position: [-1.4, -1.8, 0.0] },
], [
  { from: 0, to: 1 }, { from: 1, to: 2, order: 2 }, { from: 2, to: 3 },
  { from: 1, to: 4 }, { from: 4, to: 5, order: 2 },
]);

const erinacineA = smallMolecule('erinacine-a', [
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 1.2,  0.8, 0.0] },
  { element: 'C', position: [ 1.2, -0.8, 0.0] },
  { element: 'O', position: [ 2.4,  0.0, 0.0] },
  { element: 'C', position: [-1.2,  0.0, 0.0] },
], [
  { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 }, { from: 2, to: 3 },
  { from: 0, to: 4 },
]);

const epa = smallMolecule('epa', [
  { element: 'C', position: [-2.0,  0.0, 0.0] },
  { element: 'C', position: [-1.0,  0.7, 0.0] },
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 1.0,  0.7, 0.0] },
  { element: 'C', position: [ 2.0,  0.0, 0.0] },
  { element: 'O', position: [ 3.0,  0.7, 0.0] },
  { element: 'O', position: [ 2.0, -1.4, 0.0] },
], [
  { from: 0, to: 1, order: 2 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 },
  { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 4, to: 6, order: 2 },
]);

const dha = smallMolecule('dha', [
  { element: 'C', position: [-2.4,  0.0, 0.0] },
  { element: 'C', position: [-1.4,  0.7, 0.0] },
  { element: 'C', position: [-0.4,  0.0, 0.0] },
  { element: 'C', position: [ 0.6,  0.7, 0.0] },
  { element: 'C', position: [ 1.6,  0.0, 0.0] },
  { element: 'C', position: [ 2.6,  0.7, 0.0] },
  { element: 'O', position: [ 3.6,  0.0, 0.0] },
], [
  { from: 0, to: 1, order: 2 }, { from: 1, to: 2 }, { from: 2, to: 3, order: 2 },
  { from: 3, to: 4 }, { from: 4, to: 5, order: 2 }, { from: 5, to: 6 },
]);

const salidroside = smallMolecule('salidroside', [
  { element: 'O', position: [-1.4,  0.0, 0.0] },
  { element: 'C', position: [ 0.0,  0.0, 0.0] },
  { element: 'C', position: [ 0.7,  1.2, 0.0] },
  { element: 'C', position: [ 2.1,  1.2, 0.0] },
  { element: 'C', position: [ 2.8,  0.0, 0.0] },
  { element: 'O', position: [ 4.2,  0.0, 0.0] },
], [
  { from: 0, to: 1 }, { from: 1, to: 2, order: 2 }, { from: 2, to: 3 },
  { from: 3, to: 4, order: 2 }, { from: 4, to: 5 },
]);

const rosavin = smallMolecule('rosavin', [
  { element: 'C', position: [-1.0,  0.0, 0.0] },
  { element: 'C', position: [ 0.0,  0.7, 0.0] },
  { element: 'C', position: [ 1.0,  0.0, 0.0] },
  { element: 'O', position: [ 2.0,  0.7, 0.0] },
  { element: 'C', position: [ 0.0, -1.4, 0.0] },
], [
  { from: 0, to: 1, order: 2 }, { from: 1, to: 2 }, { from: 2, to: 3 },
  { from: 1, to: 4 },
]);

// --- Lookup table keyed by slug --- //
// Slugs match the canonical trending slugs in the DB.

export const SUPPLEMENT_RENDERS: Record<string, SupplementRender> = {
  'creatine':              { slug: 'creatine',              name: 'Creatine',              kind: 'single', molecule: creatine },
  'creatine-monohydrate':  { slug: 'creatine-monohydrate',  name: 'Creatine Monohydrate',  kind: 'single', molecule: creatine },
  'caffeine':              { slug: 'caffeine',              name: 'Caffeine',              kind: 'single', molecule: caffeine },
  'melatonin':             { slug: 'melatonin',             name: 'Melatonin',             kind: 'single', molecule: melatonin },
  'l-theanine':            { slug: 'l-theanine',            name: 'L-Theanine',            kind: 'single', molecule: ltheanine },
  'vitamin-d3':            { slug: 'vitamin-d3',            name: 'Vitamin D3',            kind: 'single', molecule: vitaminD3 },
  'magnesium-glycinate':   { slug: 'magnesium-glycinate',   name: 'Magnesium Glycinate',   kind: 'single', molecule: magnesiumGlycinate },

  'ashwagandha': {
    slug: 'ashwagandha', name: 'Ashwagandha', kind: 'constellation',
    constellation: { id: 'ashwagandha-family', members: [withanolideA, withaferinA, withanosideIV] },
  },
  'lions-mane': {
    slug: 'lions-mane', name: "Lion's Mane", kind: 'constellation',
    constellation: { id: 'lions-mane-family', members: [hericenoneB, erinacineA] },
  },
  'lions-mane-mushroom': {
    slug: 'lions-mane-mushroom', name: "Lion's Mane Mushroom", kind: 'constellation',
    constellation: { id: 'lions-mane-family', members: [hericenoneB, erinacineA] },
  },
  'omega-3': {
    slug: 'omega-3', name: 'Omega-3', kind: 'constellation',
    constellation: { id: 'omega-3-family', members: [epa, dha] },
  },
  'omega-3-fish-oil': {
    slug: 'omega-3-fish-oil', name: 'Omega-3 Fish Oil', kind: 'constellation',
    constellation: { id: 'omega-3-family', members: [epa, dha] },
  },
  'rhodiola': {
    slug: 'rhodiola', name: 'Rhodiola', kind: 'constellation',
    constellation: { id: 'rhodiola-family', members: [salidroside, rosavin] },
  },
  'rhodiola-rosea': {
    slug: 'rhodiola-rosea', name: 'Rhodiola Rosea', kind: 'constellation',
    constellation: { id: 'rhodiola-family', members: [salidroside, rosavin] },
  },
};

/**
 * Fallback molecule geometry (creatine) used while the real SDF loads.
 * Exported so SplitDeck can spread-merge real SDF geometry on top.
 */
const _creatineRender = SUPPLEMENT_RENDERS['creatine']!;
export const FALLBACK_MOLECULE: Molecule =
  _creatineRender.kind === 'single' ? _creatineRender.molecule : creatine;

/**
 * Returns the hand-authored render for known slugs. For everything else,
 * returns a stub with the correct slug + name so the card header is right
 * while the SDF fetches in the background.
 *
 * Pass `displayName` when you know the human-readable name (e.g. from the
 * trending list) so it appears in the card before the SDF arrives.
 */
export function getRender(slug: string, displayName?: string): SupplementRender {
  if (SUPPLEMENT_RENDERS[slug]) return SUPPLEMENT_RENDERS[slug]!;
  // Stub: correct identity, creatine geometry as placeholder.
  return {
    slug,
    name: displayName ?? slug,
    kind: 'single',
    molecule: { ...FALLBACK_MOLECULE, id: slug, formula: '' },
  };
}
