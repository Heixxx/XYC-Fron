import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 250;
const COLORS = ['#F0B90B', '#F0B90B', '#F0B90B', '#F0B90B', '#F0B90B', '#F0B90B', '#06B6D4', '#06B6D4', '#06B6D4'];

function ParticleField() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const displacementRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const { viewport } = useThree();

  const [, colors, originalPositions] = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const orig = new Float32Array(PARTICLE_COUNT * 3);
    const colorObj = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 12;
      const z = (Math.random() - 0.5) * 8;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      colorObj.set(COLORS[Math.floor(Math.random() * COLORS.length)]);
      col[i * 3] = colorObj.r;
      col[i * 3 + 1] = colorObj.g;
      col[i * 3 + 2] = colorObj.b;
    }
    return [pos, col, orig];
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const scales = useMemo(() => {
    const s = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      s[i] = 0.02 + Math.random() * 0.04;
    }
    return s;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;

    const mr = mouseRef.current;
    mr.x += (mr.targetX - mr.x) * 0.05;
    mr.y += (mr.targetY - mr.y) * 0.05;

    const time = performance.now() * 0.0001;
    const disp = displacementRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      // Orbital drift
      const driftX = Math.sin(time + oy * 0.3) * 0.3;
      const driftY = Math.cos(time + ox * 0.3) * 0.2;

      // Mouse parallax
      const parallaxX = mr.x * 0.3;
      const parallaxY = mr.y * 0.2;

      // Mouse repulsion
      const mouseWorldX = mr.x * viewport.width * 0.5;
      const mouseWorldY = mr.y * viewport.height * 0.5;
      const dx = ox + driftX - mouseWorldX;
      const dy = oy + driftY - mouseWorldY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 2;
      if (dist < repelRadius && dist > 0.01) {
        const force = (1 - dist / repelRadius) * 0.05;
        disp[i3] += (dx / dist) * force;
        disp[i3 + 1] += (dy / dist) * force;
      }

      // Decay displacement
      disp[i3] *= 0.95;
      disp[i3 + 1] *= 0.95;
      disp[i3 + 2] *= 0.95;

      dummy.position.set(
        ox + driftX + parallaxX + disp[i3],
        oy + driftY + parallaxY + disp[i3 + 1],
        oz + disp[i3 + 2]
      );

      dummy.rotation.x = time * (0.5 + (i % 3) * 0.3);
      dummy.rotation.y = time * (0.3 + (i % 5) * 0.2);
      dummy.scale.setScalar(scales[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
      />
      <instancedBufferAttribute
        attach="geometry-attributes-color"
        args={[colors, 3]}
      />
    </instancedMesh>
  );
}

// CSS fallback for mobile
function CSSParticleFallback() {
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 4 + Math.random() * 8,
      duration: 8 + Math.random() * 12,
      delay: Math.random() * -10,
      color: Math.random() > 0.3 ? 'var(--accent-gold)' : 'var(--accent-cyan)',
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm animate-float"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: 0.3,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

export default function ParticleCanvas() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return <CSSParticleFallback />;
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, 1.5]}
        frameloop="always"
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <ParticleField />
      </Canvas>
    </div>
  );
}
