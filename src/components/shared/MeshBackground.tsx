"use client";
import React from 'react';
import { T } from '@/lib/design-tokens';

export const MeshBackground = React.memo(function MeshBackground() {
  return (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div
          className="absolute rounded-full"
          style={{
            width: 600, height: 600,
            background: T.accent,
            top: '-15%', left: '-10%',
            filter: 'blur(130px)',
            opacity: 0.10,
            animation: 'proto-mesh-1 26s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 500, height: 500,
            background: T.sky,
            bottom: '-10%', right: '-8%',
            filter: 'blur(120px)',
            opacity: 0.09,
            animation: 'proto-mesh-2 32s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: 380, height: 380,
            background: T.accent,
            top: '40%', left: '50%',
            filter: 'blur(110px)',
            opacity: 0.05,
            animation: 'proto-mesh-3 20s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
      </div>
      {/* Grain texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0.032,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />
    </>
  );
});
