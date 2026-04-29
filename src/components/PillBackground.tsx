'use client';

import React, { useEffect, useRef, useState } from 'react';

// ── Colour palette ────────────────────────────────────────────────────────────
const COLORS = [
  '#A8E6CF', '#69F0AE', '#7DD6B0', '#5CC49A',
  '#B2F2BB', '#4ECDC4', '#26C281', '#88E8C0',
  '#9CCC65', '#66BB6A', '#C5E8A1', '#3DDC97',
];

function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Shape = 'capsule' | 'tablet' | 'scoop';

interface PillSpec {
  id: number;
  shape: Shape;
  color: string;
  w: number;
  h: number;
  dy: number;
  rot: number;
}

function makePill(seed: number): PillSpec {
  const ci = Math.floor(rand(seed) * COLORS.length);
  const r = rand(seed + 1);
  const shape: Shape = r < 0.14 ? 'scoop' : r < 0.42 ? 'tablet' : 'capsule';
  const h = 15 + Math.floor(rand(seed + 2) * 18); // 15–33 px
  const w =
    shape === 'capsule' ? Math.round(h * (1.8 + rand(seed + 3) * 0.8))
    : shape === 'scoop'  ? Math.round(h * 2.2)
    : h;
  return {
    id: seed,
    shape,
    color: COLORS[ci],
    w,
    h,
    dy: (rand(seed + 4) - 0.5) * 10,
    rot: (rand(seed + 5) - 0.5) * 28,
  };
}

// ── Hollow shapes ─────────────────────────────────────────────────────────────

// Capsule — outline with vertical seam at the join between the two halves
const Capsule: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { w, h, color } = p;
  const rx = h / 2;
  const sw = 1.4;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw}
        rx={rx} ry={rx} fill="none" stroke={color} strokeWidth={sw} />
      {/* Fine seam line at the midpoint — where the two capsule halves join */}
      <line x1={w / 2} y1={h * 0.14} x2={w / 2} y2={h * 0.86}
        stroke={color} strokeWidth={0.85} opacity={0.55} strokeLinecap="round" />
    </svg>
  );
};

// Tablet — outline circle with a horizontal score line across the diameter
const Tablet: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { h, color } = p;
  const r = (h - 1.4) / 2;
  const sw = 1.4;
  return (
    <svg width={h} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <circle cx={h / 2} cy={h / 2} r={r}
        fill="none" stroke={color} strokeWidth={sw} />
      {/* Horizontal score line (real tablets are split this way) */}
      <line x1={h * 0.18} y1={h / 2} x2={h * 0.82} y2={h / 2}
        stroke={color} strokeWidth={0.85} opacity={0.55} strokeLinecap="round" />
    </svg>
  );
};

// Scoop — hollow measuring spoon: ellipse bowl + angled handle
const Scoop: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { h, color } = p;
  const bw = h * 1.1;          // bowl width
  const bh = h * 0.65;         // bowl height
  const handleLen = h * 1.05;  // handle length
  const sw = 1.4;
  const cx = bw / 2 + sw;
  const cy = bh / 2 + sw;
  const totalW = bw + handleLen + sw * 2 + 2;
  const totalH = bh + sw * 2 + h * 0.35; // extra room for handle droop
  // Handle starts at right rim of bowl, droops slightly downward
  const hx1 = cx + bw / 2 - sw / 2;
  const hy1 = cy + bh * 0.08;
  const hx2 = hx1 + handleLen;
  const hy2 = hy1 + h * 0.3;
  return (
    <svg width={totalW} height={totalH} style={{ overflow: 'visible' }} opacity={alpha}>
      {/* Bowl */}
      <ellipse cx={cx} cy={cy} rx={bw / 2 - sw / 2} ry={bh / 2 - sw / 2}
        fill="none" stroke={color} strokeWidth={sw} />
      {/* Handle */}
      <line x1={hx1} y1={hy1} x2={hx2} y2={hy2}
        stroke={color} strokeWidth={sw * 0.85} strokeLinecap="round" />
    </svg>
  );
};

// ── Layout constants ──────────────────────────────────────────────────────────
const LANE_SPACING = 195; // px between lanes (in rotated space)
const SPACING      = 145; // px between pill centres in a lane
const ROT_DEG      = 28;  // rotation that makes the lanes appear diagonal
const OPACITY      = 0.45; // base opacity — fades further in the centre via mask

export const PillBackground: React.FC<{ fps?: number }> = ({ fps = 30 }) => {
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1920, h: 1080 });
  const rafRef     = useRef<number | null>(null);
  const lastRef    = useRef(0);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);
    const interval = 1000 / fps;
    const tick = (t: number) => {
      if (t - lastRef.current >= interval) {
        lastRef.current = t;
        setFrame(f => f + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fps]);

  const { w: sw, h: sh } = size;

  // Inner container is oversized so the rotated div fully covers the viewport.
  // At 28° rotation the required oversize is ≈ 60% w × 90% h.
  const innerW = Math.ceil(sw * 1.65);
  const innerH = Math.ceil(sh * 1.95);
  const offsetX = -Math.round((innerW - sw) / 2);
  const offsetY = -Math.round((innerH - sh) / 2);

  const laneCount = Math.ceil(innerH / LANE_SPACING) + 1;
  const pillCount = Math.ceil(innerW / SPACING)      + 2;

  const elements: React.ReactNode[] = [];

  for (let li = 0; li < laneCount; li++) {
    // Each lane scrolls at a slightly different speed (1.2–2.0 px/frame)
    const speed     = 1.2 + rand(li * 13 + 7) * 0.8;
    const totalSpan = pillCount * SPACING;
    const offset    = (frame * speed) % totalSpan;
    const laneY     = li * LANE_SPACING;

    for (let pi = 0; pi < pillCount; pi++) {
      const p    = makePill(li * 200 + pi);
      const xRaw = ((pi * SPACING - offset + totalSpan * 10) % totalSpan) - SPACING;
      if (xRaw < -(p.w + 50) || xRaw > innerW + 50) continue;

      elements.push(
        <div
          key={`${li}-${pi}`}
          style={{
            position: 'absolute',
            left: xRaw,
            top: laneY + p.dy - p.h / 2,
            transform: `rotate(${p.rot}deg)`,
            willChange: 'transform',
          }}
        >
          {p.shape === 'capsule' ? <Capsule p={p} alpha={OPACITY} />
           : p.shape === 'tablet' ? <Tablet p={p} alpha={OPACITY} />
           : <Scoop p={p} alpha={OPACITY} />}
        </div>,
      );
    }
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Fade pills in the central content column so they don't fight with text.
        // Full opacity at far left/right, ~20% in the middle band.
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 32%, rgba(0,0,0,0.2) 68%, rgba(0,0,0,1) 100%)',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.2) 32%, rgba(0,0,0,0.2) 68%, rgba(0,0,0,1) 100%)',
      }}
    >
      {/* Rotated wrapper — horizontal lanes become diagonal bands */}
      <div
        style={{
          position: 'absolute',
          width:  innerW,
          height: innerH,
          left:   offsetX,
          top:    offsetY,
          transform: `rotate(${ROT_DEG}deg)`,
          transformOrigin: 'center',
        }}
      >
        {elements}
      </div>
    </div>
  );
};

export default PillBackground;
