/**
 * Minimal parser for PubChem V2000 SDF files.
 * Extracts atom positions (xyz) + element symbols and bond connectivity.
 * Ignores stereo, charge, radical flags, and all header metadata beyond the formula.
 *
 * SDF V2000 structure (relevant portions):
 *   line 1:   compound name
 *   line 2:   info (ignored)
 *   line 3:   comment (ignored)
 *   line 4:   counts line: "NNNMMM  0  0  0  0  0  0  0  0999 V2000"
 *   lines 5+: atoms (N rows): "  x.xxxx   y.yyyy   z.zzzz ELEM 0  0  0  0  0  0  0  0  0  0  0  0"
 *   next:     bonds (M rows): "a1a2  type  ..." (right-aligned in 3-char fields)
 *   ...
 *   M  END
 */

export interface Atom {
  element: string;
  x: number;
  y: number;
  z: number;
}

export interface Bond {
  a: number; // atom index (0-based)
  b: number;
  order: 1 | 2 | 3;
}

export interface Molecule {
  name: string;
  atoms: Atom[];
  bonds: Bond[];
}

export function parseSdf(text: string): Molecule {
  const lines = text.split(/\r?\n/);
  const name = (lines[0] ?? '').trim();
  const counts = lines[3] ?? '';
  const atomCount = parseInt(counts.slice(0, 3).trim(), 10) || 0;
  const bondCount = parseInt(counts.slice(3, 6).trim(), 10) || 0;

  const atoms: Atom[] = [];
  for (let i = 0; i < atomCount; i++) {
    const line = lines[4 + i] ?? '';
    const x = parseFloat(line.slice(0, 10));
    const y = parseFloat(line.slice(10, 20));
    const z = parseFloat(line.slice(20, 30));
    const element = line.slice(31, 34).trim();
    if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z) || !element) continue;
    atoms.push({ element, x, y, z });
  }

  const bonds: Bond[] = [];
  const bondStart = 4 + atomCount;
  for (let i = 0; i < bondCount; i++) {
    const line = lines[bondStart + i] ?? '';
    const a = parseInt(line.slice(0, 3).trim(), 10) - 1;
    const b = parseInt(line.slice(3, 6).trim(), 10) - 1;
    const order = parseInt(line.slice(6, 9).trim(), 10);
    if (Number.isNaN(a) || Number.isNaN(b) || a < 0 || b < 0) continue;
    const o: 1 | 2 | 3 = order === 2 ? 2 : order === 3 ? 3 : 1;
    bonds.push({ a, b, order: o });
  }

  return { name, atoms, bonds };
}
