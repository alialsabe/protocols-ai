'use client';

/**
 * MoleculeScene — atoms + bonds with cinematic assembly animation.
 *
 * Each mount plays an assembly sequence:
 *   - Atoms fly in from their radial "outside" direction, easeOutCubic,
 *     staggered over the first ~50% of the duration.
 *   - Bonds stay hidden until both endpoint atoms arrive, then "draw in"
 *     by scaling along their axis from the midpoint outward (50-95%).
 *   - On completion, the `onAssemblyComplete` callback fires for the
 *     parent to trigger a CSS bloom pulse.
 *
 * Durations: caller passes `assemblyDuration` — typically 2500ms for hero
 * entrance, 800ms for hover-swap in the trending list.
 *
 * For constellations, the same system applies to each member molecule
 * in parallel; orbit motion begins after assembly is complete.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Atom, Bond, Constellation, Molecule } from './types';
import { ELEMENT_STYLE } from './types';

type SceneProps = {
  molecule?: Molecule;
  constellation?: Constellation;
  /** When true, auto-rotate is paused (user is dragging). */
  dragActive?: React.MutableRefObject<boolean>;
  /** Total assembly duration in milliseconds. */
  assemblyDuration?: number;
  /** Fires once when assembly reaches reveal=1. */
  onAssemblyComplete?: () => void;
};

// ---- easing ----
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// ---- shared assembly state ----
type Assembly = {
  reveal: React.MutableRefObject<number>; // 0 → 1
  duration: number;                       // seconds
  fired: React.MutableRefObject<boolean>;
  onComplete?: () => void;
};

function useAssembly(durationMs: number, onComplete?: () => void): Assembly {
  const reveal = useRef(0);
  const fired = useRef(false);
  const duration = Math.max(0.1, durationMs / 1000);
  return { reveal, duration, fired, onComplete };
}

function atomsCentroid(atoms: Atom[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const a of atoms) c.add(new THREE.Vector3(...a.position));
  if (atoms.length > 0) c.divideScalar(atoms.length);
  return c;
}

/**
 * A single animated atom. Starts offscreen along its radial direction,
 * flies in to its final position with easeOutCubic. Scale + opacity
 * ramp in alongside the position so early frames look like glowing specks.
 */
function AnimatedAtom({
  atom,
  index,
  total,
  centroid,
  assembly,
}: {
  atom: Atom;
  index: number;
  total: number;
  centroid: THREE.Vector3;
  assembly: Assembly;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Starting offset: radial direction from molecule centroid, 18 units out.
  // Falls back to +Y if the atom is at the centroid.
  const startOffset = useMemo(() => {
    const v = new THREE.Vector3(
      atom.position[0] - centroid.x,
      atom.position[1] - centroid.y,
      atom.position[2] - centroid.z,
    );
    if (v.lengthSq() < 0.01) v.set(0, 1, 0);
    return v.normalize().multiplyScalar(26);
  }, [atom.position, centroid.x, centroid.y, centroid.z]);

  // Stagger: atoms finish arriving by ~70% of total duration.
  const delay = useMemo(() => (total > 1 ? (index / total) * 0.65 : 0), [index, total]);

  useFrame(() => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;

    const reveal = assembly.reveal.current;
    const local = clamp01((reveal - delay) / Math.max(0.01, 0.7 - delay));
    const eased = easeOutCubic(local);

    mesh.position.set(
      atom.position[0] + startOffset.x * (1 - eased),
      atom.position[1] + startOffset.y * (1 - eased),
      atom.position[2] + startOffset.z * (1 - eased),
    );
    mesh.scale.setScalar(0.25 + 0.75 * eased);
    mat.opacity = eased;
    // Extra emissive punch during the last moments of arrival — feels like a "snap".
    const snap = local > 0.8 ? (local - 0.8) / 0.2 : 0;
    mat.emissiveIntensity = (ELEMENT_STYLE[atom.element].emissive) * (1 + snap * 0.8);
  });

  const style = ELEMENT_STYLE[atom.element];
  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[style.radius, 20, 20]} />
      <meshStandardMaterial
        ref={matRef}
        color={style.color}
        emissive={style.color}
        emissiveIntensity={style.emissive}
        roughness={0.2}
        metalness={0.3}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/**
 * A bond between two atoms. Hidden until both endpoints arrive (reveal >= 0.6),
 * then "draws in" by scaling along its Y axis (the cylinder axis) from 0 → 1.
 */
function AnimatedBond({
  a,
  b,
  aIndex,
  bIndex,
  total,
  order,
  assembly,
}: {
  a: Atom;
  b: Atom;
  aIndex: number;
  bIndex: number;
  total: number;
  order: number;
  assembly: Assembly;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...a.position);
    const end = new THREE.Vector3(...b.position);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const len = dir.length();
    dir.normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return { position: mid, quaternion: quat, length: len };
  }, [a.position, b.position]);

  // Bond start = after the later of its two atoms has arrived.
  // Formula mirrors AnimatedAtom: atom i fully arrives at delay + (0.7 - delay).
  const bondStart = useMemo(() => {
    const aDone = (aIndex / total) * 0.65 + (0.7 - (aIndex / total) * 0.65);
    const bDone = (bIndex / total) * 0.65 + (0.7 - (bIndex / total) * 0.65);
    return Math.max(aDone, bDone) - 0.06; // slight overlap with atom arrival
  }, [aIndex, bIndex, total]);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const reveal = assembly.reveal.current;
    const window = Math.max(0.01, 1 - bondStart);
    const local = clamp01((reveal - bondStart) / window);
    const eased = easeOutQuart(local);
    g.scale.y = eased;
    g.scale.x = 0.6 + 0.4 * eased;
    g.scale.z = 0.6 + 0.4 * eased;
  });

  const offsets = order === 2 ? [-0.12, 0.12] : order === 3 ? [-0.18, 0, 0.18] : [0];

  return (
    <group ref={groupRef} position={position} quaternion={quaternion} scale={[1, 0, 1]}>
      {offsets.map((offset, i) => (
        <mesh key={i} position={[offset, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, length, 10, 1, true]} />
          <meshStandardMaterial
            color="#06D6A0"
            emissive="#06D6A0"
            emissiveIntensity={0.9}
            roughness={0.4}
            metalness={0.4}
            transparent
            opacity={0.9}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Drives the reveal ref forward on every frame until it reaches 1,
 * then fires onComplete exactly once.
 */
function AssemblyDriver({ assembly }: { assembly: Assembly }) {
  useFrame((_, delta) => {
    if (assembly.reveal.current >= 1) return;
    assembly.reveal.current = Math.min(1, assembly.reveal.current + delta / assembly.duration);
    if (assembly.reveal.current >= 1 && !assembly.fired.current) {
      assembly.fired.current = true;
      assembly.onComplete?.();
    }
  });
  return null;
}

function SingleMolecule({
  molecule,
  dragActive,
  assembly,
}: {
  molecule: Molecule;
  dragActive?: React.MutableRefObject<boolean>;
  assembly: Assembly;
}) {
  const ref = useRef<THREE.Group>(null);
  const centroid = useMemo(() => atomsCentroid(molecule.atoms), [molecule.atoms]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (dragActive?.current) return;
    // Auto-rotate only after assembly is mostly complete — otherwise the
    // fly-in looks chaotic.
    const gate = clamp01((assembly.reveal.current - 0.4) / 0.4);
    ref.current.rotation.y += delta * 0.18 * gate;
    ref.current.rotation.x = Math.sin(performance.now() * 0.0002) * 0.08 * gate;
  });

  return (
    <group ref={ref} position={[-centroid.x, -centroid.y, -centroid.z]}>
      {molecule.atoms.map((atom, i) => (
        <AnimatedAtom
          key={i}
          atom={atom}
          index={i}
          total={molecule.atoms.length}
          centroid={centroid}
          assembly={assembly}
        />
      ))}
      {molecule.bonds.map((bnd, i) => (
        <AnimatedBond
          key={i}
          a={molecule.atoms[bnd.from]!}
          b={molecule.atoms[bnd.to]!}
          aIndex={bnd.from}
          bIndex={bnd.to}
          total={molecule.atoms.length}
          order={bnd.order ?? 1}
          assembly={assembly}
        />
      ))}
    </group>
  );
}

function OrbitingMember({
  molecule,
  radius,
  baseAngle,
  orbitSpeed,
  selfSpeed,
  scale,
  assembly,
}: {
  molecule: Molecule;
  radius: number;
  baseAngle: number;
  orbitSpeed: number;
  selfSpeed: number;
  scale: number;
  assembly: Assembly;
}) {
  const orbit = useRef<THREE.Group>(null);
  const self = useRef<THREE.Group>(null);
  const centroid = useMemo(() => atomsCentroid(molecule.atoms), [molecule.atoms]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Orbit motion gated behind assembly completion
    const gate = clamp01((assembly.reveal.current - 0.5) / 0.5);
    const angle = baseAngle + t * orbitSpeed * gate;
    if (orbit.current) {
      orbit.current.position.set(
        Math.cos(angle) * radius * gate,
        Math.sin(angle * 0.35) * (radius * 0.18) * gate,
        Math.sin(angle) * radius * gate,
      );
    }
    if (self.current) {
      self.current.rotation.y = t * selfSpeed * gate;
      self.current.rotation.x = Math.sin(t * 0.3) * 0.15 * gate;
    }
  });

  return (
    <group ref={orbit}>
      <group
        ref={self}
        scale={scale}
        position={[-centroid.x * scale, -centroid.y * scale, -centroid.z * scale]}
      >
        {molecule.atoms.map((atom, i) => (
          <AnimatedAtom
            key={i}
            atom={atom}
            index={i}
            total={molecule.atoms.length}
            centroid={centroid}
            assembly={assembly}
          />
        ))}
        {molecule.bonds.map((bnd, i) => (
          <AnimatedBond
            key={i}
            a={molecule.atoms[bnd.from]!}
            b={molecule.atoms[bnd.to]!}
            aIndex={bnd.from}
            bIndex={bnd.to}
            total={molecule.atoms.length}
            order={bnd.order ?? 1}
            assembly={assembly}
          />
        ))}
      </group>
    </group>
  );
}

function OrbitRing({ radius, assembly }: { radius: number; assembly: Assembly }) {
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [radius]);
  useFrame(() => {
    if (!matRef.current) return;
    matRef.current.opacity = 0.12 * clamp01((assembly.reveal.current - 0.6) / 0.4);
  });
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial
        ref={matRef}
        color="#06D6A0"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

function ConstellationGroup({
  constellation,
  dragActive,
  assembly,
}: {
  constellation: Constellation;
  dragActive?: React.MutableRefObject<boolean>;
  assembly: Assembly;
}) {
  const ref = useRef<THREE.Group>(null);
  const members = constellation.members;
  const ringRadius = 4.5;

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (dragActive?.current) return;
    const gate = clamp01((assembly.reveal.current - 0.5) / 0.5);
    ref.current.rotation.y += delta * 0.06 * gate;
  });

  const baseAngles = useMemo(
    () => members.map((_, i) => (i / members.length) * Math.PI * 2),
    [members],
  );

  return (
    <group ref={ref}>
      <OrbitRing radius={ringRadius} assembly={assembly} />
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color="#fafafa"
          emissive="#fafafa"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      {members.map((m, i) => (
        <OrbitingMember
          key={m.id + i}
          molecule={m}
          radius={ringRadius}
          baseAngle={baseAngles[i]!}
          orbitSpeed={0.22 + i * 0.03}
          selfSpeed={0.6 + i * 0.15}
          scale={0.85}
          assembly={assembly}
        />
      ))}
    </group>
  );
}

export function MoleculeScene({
  molecule,
  constellation,
  dragActive,
  assemblyDuration = 2500,
  onAssemblyComplete,
}: SceneProps) {
  const assembly = useAssembly(assemblyDuration, onAssemblyComplete);

  // Reset reveal/fired on mount only. The parent re-keys the Canvas on swap,
  // so this runs once per molecule. Never on re-renders — `assembly` has a
  // new object identity every render (from useAssembly), so listing it here
  // would trigger a reset loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    assembly.reveal.current = 0;
    assembly.fired.current = false;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -4, 6]} intensity={0.4} color="#06D6A0" />

      <AssemblyDriver assembly={assembly} />

      {molecule && <SingleMolecule molecule={molecule} dragActive={dragActive} assembly={assembly} />}
      {constellation && (
        <ConstellationGroup
          constellation={constellation}
          dragActive={dragActive}
          assembly={assembly}
        />
      )}
    </>
  );
}
