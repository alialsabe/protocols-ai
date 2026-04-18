'use client';

/**
 * MoleculeScene — the actual atoms + bonds rendered inside a <Canvas>.
 *
 * Single-molecule render:
 *   - Each atom is a glowing sphere (emissive color by element).
 *   - Each bond is a thin cylinder. Double bonds = two parallel cylinders.
 *   - Slow Y-axis auto-rotate at 0.08 rad/s unless `drag` ref is active.
 *
 * Constellation render:
 *   - Each member molecule is placed on an orbital ring around the origin.
 *   - Members rotate slowly around the center at staggered speeds,
 *     and each member also self-rotates.
 *
 * Post-processing (Bloom) is applied by the parent <Canvas>.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Atom, Bond, Constellation, Molecule } from './types';
import { ELEMENT_STYLE } from './types';

type SceneProps = {
  molecule?: Molecule;
  constellation?: Constellation;
  /** When true, auto-rotate is paused (user is dragging). */
  dragActive?: React.MutableRefObject<boolean>;
  /** 0..1 — reduces bloom + scale during swap. */
  swapPhase?: React.MutableRefObject<number>;
};

function atomsCentroid(atoms: Atom[]): THREE.Vector3 {
  const c = new THREE.Vector3();
  for (const a of atoms) c.add(new THREE.Vector3(...a.position));
  if (atoms.length > 0) c.divideScalar(atoms.length);
  return c;
}

function Atoms({ atoms }: { atoms: Atom[] }) {
  // Group spheres by element so we only create one material per element.
  const byElement = useMemo(() => {
    const m = new Map<Atom['element'], Atom[]>();
    for (const a of atoms) {
      if (!m.has(a.element)) m.set(a.element, []);
      m.get(a.element)!.push(a);
    }
    return m;
  }, [atoms]);

  return (
    <group>
      {[...byElement.entries()].map(([element, atomList]) => {
        const style = ELEMENT_STYLE[element];
        return (
          <group key={element}>
            {atomList.map((a, i) => (
              <mesh key={i} position={a.position}>
                <sphereGeometry args={[style.radius, 20, 20]} />
                <meshStandardMaterial
                  color={style.color}
                  emissive={style.color}
                  emissiveIntensity={style.emissive}
                  roughness={0.2}
                  metalness={0.3}
                  toneMapped={false}
                />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function Bond({ a, b, order = 1 }: { a: Atom; b: Atom; order?: number }) {
  const ref = useRef<THREE.Group>(null);
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(...a.position);
    const end = new THREE.Vector3(...b.position);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const dir = end.clone().sub(start);
    const len = dir.length();
    dir.normalize();
    // Default cylinder axis is +Y. Rotate +Y to match dir.
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return { position: mid, quaternion: quat, length: len };
  }, [a.position, b.position]);

  // Offset for double bond rendering
  const offsets = order === 2 ? [-0.12, 0.12] : order === 3 ? [-0.18, 0, 0.18] : [0];

  return (
    <group ref={ref} position={position} quaternion={quaternion}>
      {offsets.map((offset, i) => (
        <mesh key={i} position={[offset, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, length, 10, 1, true]} />
          <meshStandardMaterial
            color="#06D6A0"
            emissive="#06D6A0"
            emissiveIntensity={0.6}
            roughness={0.4}
            metalness={0.4}
            transparent
            opacity={0.85}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function Bonds({ atoms, bonds }: { atoms: Atom[]; bonds: Bond[] }) {
  return (
    <group>
      {bonds.map((bnd, i) => (
        <Bond key={i} a={atoms[bnd.from]} b={atoms[bnd.to]} order={bnd.order ?? 1} />
      ))}
    </group>
  );
}

function SingleMolecule({
  molecule,
  dragActive,
}: {
  molecule: Molecule;
  dragActive?: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<THREE.Group>(null);
  const centroid = useMemo(() => atomsCentroid(molecule.atoms), [molecule.atoms]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (dragActive?.current) return;
    ref.current.rotation.y += delta * 0.18;
    ref.current.rotation.x = Math.sin(performance.now() * 0.0002) * 0.08;
  });

  return (
    <group ref={ref} position={[-centroid.x, -centroid.y, -centroid.z]}>
      <Atoms atoms={molecule.atoms} />
      <Bonds atoms={molecule.atoms} bonds={molecule.bonds} />
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
}: {
  molecule: Molecule;
  radius: number;
  baseAngle: number;
  orbitSpeed: number;
  selfSpeed: number;
  scale: number;
}) {
  const orbit = useRef<THREE.Group>(null);
  const self = useRef<THREE.Group>(null);
  const centroid = useMemo(() => atomsCentroid(molecule.atoms), [molecule.atoms]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const angle = baseAngle + t * orbitSpeed;
    if (orbit.current) {
      orbit.current.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 0.35) * (radius * 0.18),
        Math.sin(angle) * radius,
      );
    }
    if (self.current) {
      self.current.rotation.y = t * selfSpeed;
      self.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    }
  });

  return (
    <group ref={orbit}>
      <group ref={self} scale={scale} position={[-centroid.x * scale, -centroid.y * scale, -centroid.z * scale]}>
        <Atoms atoms={molecule.atoms} />
        <Bonds atoms={molecule.atoms} bonds={molecule.bonds} />
      </group>
    </group>
  );
}

function OrbitRing({ radius }: { radius: number }) {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(radius - 0.02, radius + 0.02, 96);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [radius]);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial color="#06D6A0" transparent opacity={0.12} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  );
}

function ConstellationGroup({
  constellation,
  dragActive,
}: {
  constellation: Constellation;
  dragActive?: React.MutableRefObject<boolean>;
}) {
  const ref = useRef<THREE.Group>(null);
  const members = constellation.members;
  const ringRadius = 4.5;

  useFrame((_, delta) => {
    if (!ref.current) return;
    if (dragActive?.current) return;
    ref.current.rotation.y += delta * 0.06;
  });

  const baseAngles = useMemo(
    () => members.map((_, i) => (i / members.length) * Math.PI * 2),
    [members],
  );

  return (
    <group ref={ref}>
      <OrbitRing radius={ringRadius} />
      {/* Central hub — a tiny bright point */}
      <mesh>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fafafa" emissive="#fafafa" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      {members.map((m, i) => (
        <OrbitingMember
          key={m.id + i}
          molecule={m}
          radius={ringRadius}
          baseAngle={baseAngles[i]}
          orbitSpeed={0.22 + i * 0.03}
          selfSpeed={0.6 + i * 0.15}
          scale={0.85}
        />
      ))}
    </group>
  );
}

export function MoleculeScene({ molecule, constellation, dragActive }: SceneProps) {
  return (
    <>
      {/* Soft fill from multiple sides so emissives are legible */}
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -4, 6]} intensity={0.4} color="#06D6A0" />

      {molecule && <SingleMolecule molecule={molecule} dragActive={dragActive} />}
      {constellation && <ConstellationGroup constellation={constellation} dragActive={dragActive} />}
    </>
  );
}
