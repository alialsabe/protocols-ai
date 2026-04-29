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
  return { id: seed, shape, color: COLORS[ci], w, h };
}

// ── Hollow shapes ─────────────────────────────────────────────────────────────

const Capsule: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { w, h, color } = p;
  const rx = h / 2;
  const sw = 1.4;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw}
        rx={rx} ry={rx} fill="none" stroke={color} strokeWidth={sw} />
      <line x1={w / 2} y1={h * 0.14} x2={w / 2} y2={h * 0.86}
        stroke={color} strokeWidth={0.85} opacity={0.55} strokeLinecap="round" />
    </svg>
  );
};

const Tablet: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { h, color } = p;
  const r = (h - 1.4) / 2;
  const sw = 1.4;
  return (
    <svg width={h} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <circle cx={h / 2} cy={h / 2} r={r}
        fill="none" stroke={color} strokeWidth={sw} />
      <line x1={h * 0.18} y1={h / 2} x2={h * 0.82} y2={h / 2}
        stroke={color} strokeWidth={0.85} opacity={0.55} strokeLinecap="round" />
    </svg>
  );
};

const Scoop: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { h, color } = p;
  const bw = h * 1.1;
  const bh = h * 0.65;
  const handleLen = h * 1.05;
  const sw = 1.4;
  const cx = bw / 2 + sw;
  const cy = bh / 2 + sw;
  const totalW = bw + handleLen + sw * 2 + 2;
  const totalH = bh + sw * 2 + h * 0.35;
  const hx1 = cx + bw / 2 - sw / 2;
  const hy1 = cy + bh * 0.08;
  const hx2 = hx1 + handleLen;
  const hy2 = hy1 + h * 0.3;
  return (
    <svg width={totalW} height={totalH} style={{ overflow: 'visible' }} opacity={alpha}>
      <ellipse cx={cx} cy={cy} rx={bw / 2 - sw / 2} ry={bh / 2 - sw / 2}
        fill="none" stroke={color} strokeWidth={sw} />
      <line x1={hx1} y1={hy1} x2={hx2} y2={hy2}
        stroke={color} strokeWidth={sw * 0.85} strokeLinecap="round" />
    </svg>
  );
};

// ── Layout constants ──────────────────────────────────────────────────────────
const PILL_SPACING = 130;        // px between pill centres along the helix
const ROT_DEG      = 22;         // diagonal tilt of the whole helix axis
const BASE_OPACITY = 0.55;       // strand alpha at full-front
const BACK_FACTOR  = 0.42;       // far-strand dimming for depth
const STRAND_COUNT = 3;          // triple helix

interface StrandState {
  offset: number;     // accumulated x-scroll (px)
  speed: number;      // px per frame, magnitude
  dir: 1 | -1;        // travel direction
  wraps: number;      // # of complete loops finished
}

export const PillBackground: React.FC<{ fps?: number }> = ({ fps = 30 }) => {
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1920, h: 1080 });
  const rafRef        = useRef<number | null>(null);
  const lastRef       = useRef(0);
  const totalSpanRef  = useRef(2000);

  // Three strands, evenly phased around the helix (0, 2π/3, 4π/3).
  // speed + direction get re-randomized whenever a strand finishes a full loop.
  const strandsRef = useRef<StrandState[]>([
    { offset: 0, speed: 1.5, dir:  1, wraps: 0 },
    { offset: 0, speed: 1.8, dir:  1, wraps: 0 },
    { offset: 0, speed: 1.4, dir: -1, wraps: 0 },
  ]);

  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);

    const interval = 1000 / fps;
    const tick = (t: number) => {
      if (t - lastRef.current >= interval) {
        lastRef.current = t;
        const span = totalSpanRef.current;
        const strands = strandsRef.current;
        for (let i = 0; i < strands.length; i++) {
          const s = strands[i];
          s.offset += s.speed * s.dir;
          const wrapsNow = Math.floor(Math.abs(s.offset) / span);
          if (wrapsNow > s.wraps) {
            // New loop — pick a fresh speed and a fresh direction.
            s.wraps = wrapsNow;
            const seed = (i + 1) * 7919 + wrapsNow * 1009 + Date.now() % 1000;
            s.speed = 1.0 + rand(seed) * 1.4;            // 1.0–2.4 px/frame
            s.dir   = rand(seed + 1) > 0.5 ? 1 : -1;     // forward or back
          }
        }
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

  // Oversize the inner container so the rotated div fully covers the viewport.
  const innerW = Math.ceil(sw * 1.65);
  const innerH = Math.ceil(sh * 1.95);
  const offsetX = -Math.round((innerW - sw) / 2);
  const offsetY = -Math.round((innerH - sh) / 2);

  // Helix geometry — all three strands share one horizontal axis through the
  // middle of the rotated container. Phase offsets make them circle each other.
  const wavelength  = innerW * 0.42;                         // px per full wave
  const amp         = Math.min(innerH * 0.13, 140);          // helix radius
  const cy          = innerH / 2;
  const twistSpeed  = 0.020;                                 // rad / frame

  const pillCount = Math.ceil(innerW / PILL_SPACING) + 6;
  const totalSpan = pillCount * PILL_SPACING;
  totalSpanRef.current = totalSpan;

  // Split into back / front layers so DOM order gives correct z-stacking.
  const back: React.ReactNode[] = [];
  const front: React.ReactNode[] = [];

  for (let si = 0; si < STRAND_COUNT; si++) {
    const strand   = strandsRef.current[si];
    const phaseOff = (si * 2 * Math.PI) / STRAND_COUNT;
    const off      = strand.offset;

    for (let pi = 0; pi < pillCount; pi++) {
      const p = makePill(si * 1000 + pi);
      // Wrap into [-PILL_SPACING*2, totalSpan-PILL_SPACING*2)
      const xRaw =
        ((pi * PILL_SPACING - off) % totalSpan + totalSpan * 2) % totalSpan
        - PILL_SPACING * 2;
      if (xRaw < -p.w - 60 || xRaw > innerW + 60) continue;

      const xc    = xRaw + p.w / 2;
      const phase = (2 * Math.PI * xc) / wavelength + phaseOff + frame * twistSpeed;
      const sinP  = Math.sin(phase);
      const cosP  = Math.cos(phase);
      const yc    = cy + amp * sinP;
      // Tangent of the curve gives a natural roll for each pill.
      const slope = amp * cosP * (2 * Math.PI) / wavelength;
      const rotDeg = Math.atan2(slope, 1) * (180 / Math.PI);
      const isFront = sinP >= 0;
      const alpha   = BASE_OPACITY * (isFront ? 1 : BACK_FACTOR);

      const node = (
        <div
          key={`${si}-${pi}`}
          style={{
            position: 'absolute',
            left: xRaw,
            top: yc - p.h / 2,
            transform: `rotate(${rotDeg}deg)`,
            willChange: 'transform',
          }}
        >
          {p.shape === 'capsule' ? <Capsule p={p} alpha={alpha} />
           : p.shape === 'tablet' ? <Tablet p={p} alpha={alpha} />
           : <Scoop p={p} alpha={alpha} />}
        </div>
      );
      (isFront ? front : back).push(node);
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
        // Keep the centre column legible — fade the helix to ~0.45 across the
        // middle 36% of the viewport, full strength at the outer edges.
        WebkitMaskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,1) 100%)',
        maskImage:
          'linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.45) 32%, rgba(0,0,0,0.45) 68%, rgba(0,0,0,1) 100%)',
      }}
    >
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
        {/* Back strand pills first (lower z), then front pills on top. */}
        {back}
        {front}
      </div>
    </div>
  );
};

export default PillBackground;
