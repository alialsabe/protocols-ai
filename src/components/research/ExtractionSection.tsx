'use client';

import { useState } from 'react';
import type { ProtocolReport } from '@/lib/protocol-types';
import { SectionHeader } from './OverviewSection';

/**
 * Production / extraction story — collapsible.
 *
 * Category-driven heuristic so we can ship this without a new DB column.
 * When we seed per-supplement extraction copy we swap the switch for a real
 * `report.extraction` field.
 */
const BY_CATEGORY: Record<
  string,
  { source: string; method: string; purity: string }
> = {
  mineral: {
    source: 'Bound to an amino acid or organic carrier (glycinate, citrate, picolinate) to improve absorption.',
    method: 'Chelation: the elemental mineral is reacted with the carrier in aqueous solution, then crystallized and milled to a uniform powder.',
    purity: 'USP/Ph.Eur. grade; commercial suppliers publish heavy-metal and microbial testing (ICP-MS, HPLC).',
  },
  vitamin: {
    source: 'Synthetic or fermented equivalents (most commercial vitamins) are molecularly identical to food-derived forms.',
    method: 'Multi-step organic synthesis or microbial fermentation, purified via crystallization and chromatography.',
    purity: 'Typically >98% active compound by HPLC; stored under inert atmosphere to prevent oxidation.',
  },
  botanical: {
    source: 'Dried plant material (root, bark, leaf, or fruit) selected for the marker compound concentration.',
    method: 'Solvent extraction (ethanol/water), then concentration and standardization to a fixed percentage of the active constituent.',
    purity: 'COA lists marker-compound %, solvent residue, pesticides, heavy metals, and microbial counts.',
  },
  adaptogen: {
    source: 'Root or aerial plant material cultivated for phytochemical profile (withanolides, rosavins, bacosides, etc).',
    method: 'Hydroethanolic extraction then spray-drying. Patented extracts (e.g. KSM-66, Sensoril) use proprietary ratios and solvents.',
    purity: 'Standardized to a named active %; reputable producers publish identity (HPLC) and contaminant panels.',
  },
  mushroom: {
    source: 'Fruiting body or mycelium grown on grain or liquid substrate.',
    method: 'Hot-water extraction to pull polysaccharides and beta-glucans; sometimes dual-extracted with ethanol for triterpenes.',
    purity: 'Quality suppliers disclose beta-glucan % (not just "polysaccharide"), substrate residue, and grain fill-in.',
  },
  amino_acid: {
    source: 'Microbial fermentation (most modern production) or synthetic precursors.',
    method: 'Fermentation broth is filtered, the target amino acid crystallized, dried, and milled. Pharma-grade batches use additional recrystallization.',
    purity: 'Typically ≥99% assay; COA covers heavy metals, residual solvents, and microbial limits.',
  },
  fatty_acid: {
    source: 'Cold-water fish oil, algal oil, or concentrated triglyceride/ethyl ester fractions.',
    method: 'Molecular distillation under vacuum removes heavy metals and concentrates EPA/DHA. Ethyl-ester and re-esterified triglyceride forms use transesterification.',
    purity: 'IFOS/GOED oxidation tests (peroxide, anisidine, TOTOX) separate fresh oil from rancid stock.',
  },
  enzyme: {
    source: 'Microbial fermentation (Aspergillus, Bacillus) or animal/plant tissue.',
    method: 'Fermentation broth filtration, precipitation, and stabilization with excipients; enteric coating for pH-sensitive enzymes.',
    purity: 'Activity is reported in defined units (e.g. FCC, HUT, DU), not milligrams.',
  },
  hormone: {
    source: 'Synthesized chemically (melatonin, DHEA) — identical structure to endogenous form.',
    method: 'Multi-step synthesis followed by recrystallization and optical-purity testing.',
    purity: 'Pharma-grade batches publish enantiomeric excess and residual solvent data.',
  },
  protein: {
    source: 'Hydrolyzed animal (bovine, marine, porcine) or plant (pea, rice, hemp) protein fractions.',
    method: 'Enzymatic hydrolysis reduces molecular weight to ease absorption, followed by filtration and spray-drying.',
    purity: 'Average molecular weight, amino-acid profile, and allergen panel are the key COA items.',
  },
};

const DEFAULT_ENTRY = {
  source: 'Sourcing varies by manufacturer.',
  method: 'Most commercial supplements are produced via standardized extraction, synthesis, or fermentation processes depending on the compound family.',
  purity: 'Reputable brands publish a Certificate of Analysis (COA) disclosing identity, potency, and contaminant testing.',
};

export function ExtractionSection({ report }: { report: ProtocolReport }) {
  const [open, setOpen] = useState(false);

  const cat = (report.supplementTypes?.[0] ?? '').toLowerCase();
  const entry = BY_CATEGORY[cat] ?? DEFAULT_ENTRY;

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-[16px] px-6 py-5 text-left transition-colors"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--hair)',
        }}
        aria-expanded={open}
      >
        <div>
          <span
            className="font-mono text-[11px] font-bold uppercase tracking-[1.4px]"
            style={{ color: 'var(--fg-dim)' }}
          >
            06 / PRODUCTION
          </span>
          <h2
            className="mt-1 text-[20px] font-extrabold tracking-[-0.4px]"
            style={{ color: 'var(--fg)' }}
          >
            How this compound is made
          </h2>
        </div>
        <span
          className="ml-4 font-mono text-[18px] transition-transform"
          style={{
            color: 'var(--accent)',
            transform: open ? 'rotate(45deg)' : 'rotate(0)',
          }}
          aria-hidden
        >
          +
        </span>
      </button>

      {open && (
        <div
          className="mt-2 rounded-[16px] p-7"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hair)',
          }}
        >
          <ExtractionRow label="SOURCE" body={entry.source} />
          <ExtractionRow label="METHOD" body={entry.method} />
          <ExtractionRow label="QUALITY MARKERS" body={entry.purity} last />
          <p
            className="mt-6 text-[11px] leading-[18px]"
            style={{ color: 'var(--fg-faint)' }}
          >
            General production overview by supplement category. Specific
            manufacturing steps vary between brands — consult the product's
            Certificate of Analysis for batch-level detail.
          </p>
        </div>
      )}
    </section>
  );
}

function ExtractionRow({
  label,
  body,
  last,
}: {
  label: string;
  body: string;
  last?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 sm:gap-6 py-4"
      style={{ borderBottom: last ? 'none' : '1px solid var(--hair)' }}
    >
      <span
        className="font-mono text-[10px] font-bold uppercase tracking-[1.4px]"
        style={{ color: 'var(--fg-dim)' }}
      >
        {label}
      </span>
      <p
        className="text-[14px] leading-[22px]"
        style={{ color: 'var(--fg-muted)' }}
      >
        {body}
      </p>
    </div>
  );
}
