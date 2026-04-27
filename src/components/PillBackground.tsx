'use client';

import React, { useEffect, useRef, useState } from 'react';

// ── Colour palette ───────────────────────────────────────────────────────────
// Greens — supplement / wellness vibe (visible on light paper bg)
const COLORS = [
  '#A8E6CF', '#69F0AE', '#7DD6B0', '#5CC49A',
  '#B2F2BB', '#4ECDC4', '#26C281', '#88E8C0',
  '#9CCC65', '#66BB6A', '#C5E8A1', '#3DDC97',
];

// Deterministic RNG so layout is stable across renders
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Shape = 'capsule' | 'tablet';

interface PillSpec {
  id: number;
  shape: Shape;
  color: string;
  w: number;
  h: number;
  dy: number;
}

function makePill(seed: number): PillSpec {
  const ci = Math.floor(rand(seed) * COLORS.length);
  const isCap = rand(seed + 1) > 0.3;
  const h = 16 + Math.floor(rand(seed + 2) * 20);
  const w = isCap ? Math.round(h * (1.8 + rand(seed + 3) * 0.8)) : h;
  return {
    id: seed,
    shape: isCap ? 'capsule' : 'tablet',
    color: COLORS[ci],
    w,
    h,
    dy: (rand(seed + 4) - 0.5) * 10,
  };
}

const COUNT = 40;
const SPACING = 100;
const TOTAL_SPAN = COUNT * SPACING;

const LANE1 = Array.from({ length: COUNT }, (_, i) => makePill(i * 7 + 1));
const LANE2 = Array.from({ length: COUNT }, (_, i) => makePill(i * 7 + 400));

// ── Hollow shapes ────────────────────────────────────────────────────────────
const Capsule: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { w, h, color } = p;
  const rx = h / 2;
  const sw = 1.6;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <rect
        x={sw / 2}
        y={sw / 2}
        width={w - sw}
        height={h - sw}
        rx={rx}
        ry={rx}
        fill="none"
        stroke={color}
        strokeWidth={sw}
      />
      <line
        x1={w / 2}
        y1={h * 0.18}
        x2={w / 2}
        y2={h * 0.82}
        stroke={color}
        strokeWidth={0.9}
        opacity={0.4}
      />
    </svg>
  );
};

const Tablet: React.FC<{ p: PillSpec; alpha: number }> = ({ p, alpha }) => {
  const { h, color } = p;
  const r = (h - 1.6) / 2;
  const sw = 1.6;
  return (
    <svg width={h} height={h} style={{ overflow: 'visible' }} opacity={alpha}>
      <circle cx={h / 2} cy={h / 2} r={r} fill="none" stroke={color} strokeWidth={sw} />
      <line
        x1={h / 2}
        y1={h * 0.22}
        x2={h / 2}
        y2={h * 0.78}
        stroke={color}
        strokeWidth={0.9}
        opacity={0.4}
      />
    </svg>
  );
};

// ── Main component ───────────────────────────────────────────────────────────
export const PillBackground: React.FC<{
  /** Frames per second the animation re-renders at. 30 is plenty for a bg. */
  fps?: number;
}> = ({ fps = 30 }) => {
  const [frame, setFrame] = useState(0);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 1920, h: 1080 });
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  // Track viewport size + animation clock
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    onResize();
    window.addEventListener('resize', onResize);

    const interval = 1000 / fps;
    const tick = (t: number) => {
      if (t - lastTickRef.current >= interval) {
        lastTickRef.current = t;
        setFrame((f) => f + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [fps]);

  const { w: width, h: height } = size;

  const speed1 = 5.2;
  const speed2 = 4.4;
  const off1 = (frame * speed1) % TOTAL_SPAN;
  const off2 = (frame * speed2) % TOTAL_SPAN;

  // ── DNA double-helix maths ──────────────────────────────────────────────
  const cy = height / 2;
  const amp = height * 0.21;
  const wavelength = width * 0.72;
  const twistSpeed = 0.024;

  const phase = (x: number) => (2 * Math.PI * x) / wavelength + frame * twistSpeed;
  const l1y = (x: number) => cy + amp * Math.sin(phase(x));
  const l2y = (x: number) => cy + amp * Math.sin(phase(x) + Math.PI);

  const angleOf = (x: number, offsetPi = 0) => {
    const slope = (amp * Math.cos(phase(x) + offsetPi) * (2 * Math.PI)) / wavelength;
    return Math.atan2(slope, 1) * (180 / Math.PI);
  };

  const l1front = (x: number) => Math.sin(phase(x)) >= 0;
  const l2front = (x: number) => Math.sin(phase(x) + Math.PI) >= 0;

  const l1alpha = (x: number) => (l1front(x) ? 0.8 : 0.25);
  const l2alpha = (x: number) => (l2front(x) ? 0.8 : 0.25);

  type PillEl = { key: string; el: React.ReactNode };
  const back: PillEl[] = [];
  const front: PillEl[] = [];

  const buildLane = (
    pills: PillSpec[],
    offset: number,
    yFn: (x: number) => number,
    angleFn: (x: number) => number,
    alphaFn: (x: number) => number,
    frontFn: (x: number) => boolean,
  ) => {
    pills.forEach((p, i) => {
      const xRaw = ((i * SPACING - offset + TOTAL_SPAN * 10) % TOTAL_SPAN) - SPACING;
      if (xRaw < -(p.w + 60) || xRaw > width + 60) return;

      const xc = xRaw + p.w / 2;
      const yc = yFn(xc) + p.dy;
      const rot = angleFn(xc);
      const alpha = alphaFn(xc);

      const el = (
        <div
          style={{
            position: 'absolute',
            left: xRaw,
            top: yc - p.h / 2,
            transform: `rotate(${rot}deg)`,
            willChange: 'transform',
          }}
        >
          {p.shape === 'capsule' ? <Capsule p={p} alpha={alpha} /> : <Tablet p={p} alpha={alpha} />}
        </div>
      );

      (frontFn(xc) ? front : back).push({ key: `${p.id}-${i}`, el });
    });
  };

  buildLane(LANE1, off1, l1y, (x) => angleOf(x, 0), l1alpha, l1front);
  buildLane(LANE2, off2, l2y, (x) => angleOf(x, Math.PI), l2alpha, l2front);

  // ── DNA rungs ────────────────────────────────────────────────────────────
  const RUNG_SPACING = 90;
  const rungOff = (frame * ((speed1 + speed2) / 2)) % RUNG_SPACING;
  const rungs: React.ReactNode[] = [];
  for (let rx = -rungOff; rx < width + RUNG_SPACING; rx += RUNG_SPACING) {
    const y1 = l1y(rx);
    const y2 = l2y(rx);
    const spread = Math.abs(y1 - y2) / (amp * 2);
    const opacity = 0.05 + spread * 0.15;
    rungs.push(
      <line
        key={rx}
        x1={rx}
        y1={y1}
        x2={rx}
        y2={y2}
        stroke="#5CC49A"
        strokeWidth={0.8}
        opacity={opacity}
      />,
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden',
        // Transparent — sits on top of Materia's paper bg
      }}
    >
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {rungs}
      </svg>

      {back.map(({ key, el }) => (
        <React.Fragment key={key}>{el}</React.Fragment>
      ))}
      {front.map(({ key, el }) => (
        <React.Fragment key={key}>{el}</React.Fragment>
      ))}
    </div>
  );
};

export default PillBackground;
