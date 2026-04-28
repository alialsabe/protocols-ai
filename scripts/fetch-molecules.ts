/**
 * One-off: for every published supplement, fetch its molecular structure
 * from PubChem by name lookup. Save SDF (3D) and PNG (2D) into
 * /public/molecules/{slug}.{sdf,png}. Writes a manifest JSON summarizing
 * which slugs got which formats.
 *
 * Run: npx tsx scripts/fetch-molecules.ts
 * Re-run on catalog changes. No cron; manual.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { db } from '../src/lib/drizzle';
import { supplements } from '../src/lib/schema-postgres';

const PUBCHEM_SDF_3D = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF?record_type=3d`;
const PUBCHEM_SDF_2D = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF`;
const PUBCHEM_PNG = (name: string) =>
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/PNG?record_type=2d&image_size=600x600`;

const OUT_DIR = path.join(process.cwd(), 'public', 'molecules');
const THROTTLE_MS = 500;

type Result =
  | { slug: string; ok: true; sdf3d: boolean; sdf2d: boolean; png: boolean }
  | { slug: string; ok: false; reason: string };

async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.size >= 32;
  } catch {
    return false;
  }
}

async function fetchToFile(url: string, filePath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'materia-molecule-fetcher/1.0' } });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 32) return false; // empty or error response
    await fs.writeFile(filePath, buf);
    return true;
  } catch {
    return false;
  }
}

async function tryFetch(
  searchTerm: string,
  sdfPath: string,
  pngPath: string,
  sdfExists: boolean,
  pngExists: boolean,
): Promise<{ sdf3d: boolean; sdf2d: boolean; png: boolean }> {
  let sdf3d = false;
  let sdf2d = false;
  if (!sdfExists) {
    sdf3d = await fetchToFile(PUBCHEM_SDF_3D(searchTerm), sdfPath);
    sdf2d = sdf3d ? false : await fetchToFile(PUBCHEM_SDF_2D(searchTerm), sdfPath);
  }
  const png = pngExists ? false : await fetchToFile(PUBCHEM_PNG(searchTerm), pngPath);
  return { sdf3d, sdf2d, png };
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const all = await db
    .select({
      slug: supplements.slug,
      name: supplements.name,
      baseCompound: supplements.baseCompound,
    })
    .from(supplements);

  const results: Result[] = [];
  for (let i = 0; i < all.length; i++) {
    const row = all[i];
    if (!row) continue;
    const { slug, name, baseCompound } = row;
    process.stdout.write(`[${i + 1}/${all.length}] ${slug} (${name}) ... `);

    const sdfPath = path.join(OUT_DIR, `${slug}.sdf`);
    const pngPath = path.join(OUT_DIR, `${slug}.png`);

    const sdfExists = await fileExists(sdfPath);
    const pngExists = await fileExists(pngPath);

    // Resume: if both already downloaded, skip the network entirely.
    if (sdfExists && pngExists) {
      results.push({ slug, ok: true, sdf3d: true, sdf2d: false, png: true });
      console.log('cached');
      continue;
    }

    // First attempt: the full display name.
    let hit = await tryFetch(name, sdfPath, pngPath, sdfExists, pngExists);
    let usedFallback = false;
    let hitAny = hit.sdf3d || hit.sdf2d || hit.png || sdfExists || pngExists;
    const aftFirstSdfExists = sdfExists || hit.sdf3d || hit.sdf2d;
    const aftFirstPngExists = pngExists || hit.png;

    // Fallback: if we still have no assets, try the baseCompound (e.g. "Cysteine" for "NAC (...)").
    if (!hitAny && baseCompound && baseCompound.toLowerCase() !== name.toLowerCase()) {
      await new Promise(r => setTimeout(r, THROTTLE_MS));
      process.stdout.write(`fallback→"${baseCompound}" ... `);
      hit = await tryFetch(baseCompound, sdfPath, pngPath, aftFirstSdfExists, aftFirstPngExists);
      usedFallback = hit.sdf3d || hit.sdf2d || hit.png;
      hitAny = aftFirstSdfExists || aftFirstPngExists || usedFallback;
    }

    if (hitAny) {
      results.push({
        slug,
        ok: true,
        sdf3d: hit.sdf3d,
        sdf2d: hit.sdf2d,
        png: hit.png || pngExists,
      });
      console.log(
        `ok (3d=${hit.sdf3d} 2d=${hit.sdf2d} png=${hit.png || pngExists}${usedFallback ? ' via base_compound' : ''})`,
      );
    } else {
      results.push({ slug, ok: false, reason: 'no match' });
      console.log('MISS');
    }

    // Only throttle on real network calls
    if (!sdfExists || !pngExists) {
      await new Promise(r => setTimeout(r, THROTTLE_MS));
    }
  }

  const ok = results.filter(r => r.ok);
  const manifest = {
    generatedAt: new Date().toISOString(),
    total: results.length,
    withSdf3d: results.filter(r => r.ok && (r as { sdf3d?: boolean }).sdf3d).length,
    withSdf2d: results.filter(r => r.ok && (r as { sdf2d?: boolean }).sdf2d).length,
    withPng: results.filter(r => r.ok && (r as { png?: boolean }).png).length,
    misses: results.filter(r => !r.ok).map(r => r.slug),
  };
  await fs.writeFile(
    path.join(OUT_DIR, '_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nDone. ${ok.length}/${results.length} matched.`);
  console.log(`SDF 3D: ${manifest.withSdf3d}, SDF 2D fallback: ${manifest.withSdf2d}, PNG: ${manifest.withPng}`);
  console.log(`Manifest: ${path.join(OUT_DIR, '_manifest.json')}`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
