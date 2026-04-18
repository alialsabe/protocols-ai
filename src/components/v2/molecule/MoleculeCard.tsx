'use client';

/**
 * MoleculeCard — the featured molecule hero on the homepage.
 *
 * Responsibilities:
 *   - Render a <Canvas> with bloom post-processing + scanline overlay.
 *   - Host the MoleculeScene for either a single molecule or constellation.
 *   - Handle drag-to-rotate (pointer events hijack auto-rotation).
 *   - Animate swaps when `render` changes (camera dolly + bloom pulse).
 *   - Pause rendering when the tab is hidden (`document.visibilityState`).
 *   - Fall back to a static card if WebGL is unavailable.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { MoleculeScene } from './MoleculeScene';
import type { SupplementRender } from './types';

type Props = {
  render: SupplementRender;
  deltaWeek?: number;
  /** Render label only (used in mobile full-screen mode). */
  minimalChrome?: boolean;
};

function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

// Camera distance is chosen at the Canvas level from the molecule's
// bounding radius (`bounds` in the component below). No separate rig
// needed for v1 — useFrame-driven auto-rotate lives on the molecule group.

export function MoleculeCard({ render, deltaWeek, minimalChrome = false }: Props) {
  const [hasGL, setHasGL] = useState(true);
  const [swapKey, setSwapKey] = useState(render.slug);
  const [fadeIn, setFadeIn] = useState(1);
  const [visible, setVisible] = useState(true);
  const dragActive = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // WebGL capability check (client-only)
  useEffect(() => {
    setHasGL(hasWebGL());
  }, []);

  // Visibility API — pause Canvas when tab is hidden to save battery.
  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Swap transition: fade out, swap key, fade back in.
  useEffect(() => {
    if (render.slug === swapKey) return;
    setFadeIn(0);
    const t1 = window.setTimeout(() => {
      setSwapKey(render.slug);
      setFadeIn(1);
    }, 180);
    return () => window.clearTimeout(t1);
  }, [render.slug, swapKey]);

  // Pointer handlers for drag-to-rotate. We cheat by parking rotation
  // onto the outer container — the scene's auto-rotate stops via dragActive.
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragActive.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragActive.current || !lastPointer.current) return;
    // Manual rotation would require threading a ref into the scene;
    // for v1 we just pause auto-rotate while the pointer is down,
    // letting the user "hold" the molecule still. That alone is a
    // strong tactile signal — we can add inertial spin in a follow-up.
    void e;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    dragActive.current = false;
    lastPointer.current = null;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const bounds =
    render.kind === 'single'
      ? render.molecule.radius ?? 5
      : Math.max(
          ...render.constellation.members.map((m) => m.radius ?? 2),
          6,
        );

  const deltaLabel =
    deltaWeek === undefined
      ? null
      : deltaWeek >= 0
        ? `+${Math.round(deltaWeek * 100)}% · 7d`
        : `${Math.round(deltaWeek * 100)}% · 7d`;

  const formulaLabel =
    render.kind === 'single' && render.molecule.formula ? render.molecule.formula : 'BLEND';

  return (
    <div
      ref={containerRef}
      className="proto-mol-card"
      data-has-gl={hasGL}
      onPointerDown={hasGL ? onPointerDown : undefined}
      onPointerMove={hasGL ? onPointerMove : undefined}
      onPointerUp={hasGL ? onPointerUp : undefined}
      onPointerCancel={hasGL ? onPointerUp : undefined}
    >
      {/* Canvas */}
      <div className="proto-mol-canvas" style={{ opacity: fadeIn }}>
        {hasGL ? (
          <Canvas
            key={swapKey}
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 0, Math.max(9, bounds * 1.9)], fov: 42 }}
            frameloop={visible ? 'always' : 'never'}
            onCreated={({ gl }) => {
              gl.setClearColor(new THREE.Color('#000000'), 0);
            }}
          >
            {render.kind === 'single' ? (
              <MoleculeScene molecule={render.molecule} dragActive={dragActive} />
            ) : (
              <MoleculeScene constellation={render.constellation} dragActive={dragActive} />
            )}
            <EffectComposer>
              <Bloom
                intensity={1.4}
                luminanceThreshold={0.15}
                luminanceSmoothing={0.4}
                mipmapBlur
              />
            </EffectComposer>
          </Canvas>
        ) : (
          <WebGLFallback render={render} />
        )}
      </div>

      {/* Scanline overlay — pure CSS, no perf cost */}
      <div className="proto-mol-scanlines" aria-hidden />
      {/* Vignette + radial bloom */}
      <div className="proto-mol-glow" aria-hidden />

      {/* Chrome: label + delta */}
      {!minimalChrome && (
        <>
          <div className="proto-mol-topbar">
            <span className="proto-mol-formula">{formulaLabel}</span>
            <span className="proto-mol-kind">
              {render.kind === 'single' ? 'MOLECULE · HOLO-SCAN' : 'CONSTELLATION · BLEND'}
            </span>
          </div>
          <div className="proto-mol-bottombar">
            <h2 className="proto-mol-name">{render.name}</h2>
            {deltaLabel && (
              <span className={`proto-mol-delta ${deltaWeek && deltaWeek < 0 ? 'neg' : ''}`}>
                {deltaLabel}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function WebGLFallback({ render }: { render: SupplementRender }) {
  // Static 2D SVG fallback — projects atoms to the XY plane.
  const atoms =
    render.kind === 'single'
      ? render.molecule.atoms
      : render.constellation.members[0]?.atoms ?? [];
  const bonds =
    render.kind === 'single'
      ? render.molecule.bonds
      : render.constellation.members[0]?.bonds ?? [];

  // Project to viewbox
  const projected = atoms.map((a) => ({
    x: a.position[0] * 20 + 200,
    y: -a.position[1] * 20 + 150,
    element: a.element,
  }));

  return (
    <svg viewBox="0 0 400 300" className="proto-mol-svg-fallback" aria-hidden>
      {bonds.map((b, i) => (
        <line
          key={i}
          x1={projected[b.from]?.x}
          y1={projected[b.from]?.y}
          x2={projected[b.to]?.x}
          y2={projected[b.to]?.y}
          stroke="#06D6A0"
          strokeWidth="1.5"
          opacity="0.6"
        />
      ))}
      {projected.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={p.element === 'H' ? 4 : 8}
          fill={
            p.element === 'C'
              ? '#06D6A0'
              : p.element === 'N'
                ? '#4d9dff'
                : p.element === 'O'
                  ? '#ff4d6d'
                  : '#f5f5f5'
          }
        />
      ))}
    </svg>
  );
}
