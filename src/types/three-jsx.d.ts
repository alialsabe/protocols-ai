/**
 * React 19 moved JSX.IntrinsicElements into the `React.JSX` namespace.
 * @react-three/fiber v8 still augments the old global `JSX` namespace,
 * so its three-element types (mesh, sphereGeometry, etc.) aren't found
 * under the new React 19 scoping.
 *
 * This file bridges the gap by re-augmenting `React.JSX.IntrinsicElements`
 * with the `ThreeElements` interface exported by fiber.
 *
 * Remove once we upgrade to @react-three/fiber v9+.
 */
import type { ThreeElements } from '@react-three/fiber';

declare module 'react' {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends ThreeElements {}
  }
}
