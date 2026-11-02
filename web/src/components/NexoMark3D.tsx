import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const INK = '#211E19';
const ACCENT = '#6656C4';

/**
 * The NEXOESTUDIO mark in 3D: a solid node (a studio) linked to an open ring
 * (the platform) — the same shape as the flat logo, rebuilt as real geometry
 * so it can catch light and rotate instead of sitting static.
 */
function Mark() {
  const group = useRef<THREE.Group>(null);

  const { mid, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(-0.95, -0.85, 0);
    const end = new THREE.Vector3(0.95, 0.85, 0);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return { mid: start.clone().lerp(end, 0.5), quaternion: q, length: len };
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    group.current.rotation.y = state.clock.elapsedTime * 0.25;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.08;
  });

  return (
    <group ref={group}>
      {/* The node — a studio */}
      <mesh position={[-0.95, -0.85, 0]} castShadow>
        <sphereGeometry args={[0.46, 48, 48]} />
        <meshStandardMaterial color={INK} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* The connecting link */}
      <mesh position={mid} quaternion={quaternion}>
        <cylinderGeometry args={[0.075, 0.075, length, 20]} />
        <meshStandardMaterial color={INK} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* The ring — the platform */}
      <mesh position={[0.95, 0.85, 0]} rotation={[Math.PI / 2.1, 0.15, 0]} castShadow>
        <torusGeometry args={[0.52, 0.145, 32, 80]} />
        <meshStandardMaterial color={INK} roughness={0.3} metalness={0.2} />
      </mesh>
    </group>
  );
}

export default function NexoMark3D({ className = '' }: { className?: string }) {
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (reducedMotion) {
    return (
      <div className={className} aria-hidden="true">
        <svg viewBox="0 0 160 160" width="100%" height="100%">
          <line x1="46" y1="122" x2="114" y2="46" stroke="#211E19" strokeWidth="9" strokeLinecap="round" />
          <circle cx="46" cy="122" r="17" fill="#211E19" />
          <circle cx="114" cy="46" r="21" fill="none" stroke="#211E19" strokeWidth="9" />
        </svg>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <Canvas camera={{ position: [0, 0, 4.4], fov: 42 }} dpr={[1, 2]}>
        <ambientLight intensity={0.75} />
        <directionalLight position={[3, 4, 5]} intensity={1.3} color="#FBFAFF" />
        <directionalLight position={[-3, -2, -4]} intensity={0.35} color={ACCENT} />
        <Suspense fallback={null}>
          <Mark />
          <Sparkles count={30} scale={5} size={2} speed={0.3} color={ACCENT} opacity={0.35} />
        </Suspense>
      </Canvas>
    </div>
  );
}
