import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Fog, Vector3 } from 'three'

function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

export default function HeroScene({ tier, pointer, onDecline }) {
  const colors = useMemo(() => ({
    deep: cssToken('--c-deep'),
    midnight: cssToken('--c-midnight'),
    navy: cssToken('--c-navy'),
    sky: cssToken('--c-sky'),
    sun: cssToken('--c-sun'),
    pale: cssToken('--c-pale'),
    cream: cssToken('--c-cream'),
  }), [])
  const bays = useMemo(() => {
    const rows = tier === 'full' ? 4 : 2
    const columns = tier === 'full' ? 6 : 4
    return Array.from({ length: rows * columns }, (_, index) => {
      const row = Math.floor(index / columns)
      const column = index % columns
      return {
        key: `${row}-${column}`,
        x: (column - (columns - 1) / 2) * 3.4 + (row % 2 ? 0.65 : 0),
        z: -row * 3.5,
        lit: row === 1 && column === Math.floor(columns / 2),
      }
    })
  }, [tier])

  return (
    <Canvas
      camera={{ position: [16, 8, 22], fov: 34, near: 0.1, far: 100 }}
      dpr={tier === 'full' ? [1, 1.5] : 1}
      gl={{ alpha: true, antialias: tier === 'full', powerPreference: 'low-power' }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor(0x000000, 0)
        scene.fog = new Fog(colors.midnight, 30, 74)
      }}
      fallback={<div className="landing-webgl-fallback" />}
    >
      <PerformanceMonitor onDecline={onDecline} />
      <ambientLight intensity={1.25} />
      <hemisphereLight args={[colors.sky, colors.deep, 0.5]} />
      <directionalLight color={colors.pale} intensity={1.5} position={[-5, 12, 10]} />
      <directionalLight color={colors.sky} intensity={0.7} position={[8, 7, -10]} />
      <CameraSway pointer={pointer} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -2]} receiveShadow>
        <planeGeometry args={[56, 50]} />
        <meshStandardMaterial
          color={colors.navy}
          emissive={colors.navy}
          emissiveIntensity={0.08}
          roughness={1}
          metalness={0}
          transparent
          opacity={0.74}
        />
      </mesh>
      {bays.map((bay) => (
        <Bay key={bay.key} x={bay.x} z={bay.z} lit={bay.lit} colors={colors} />
      ))}
      <Crane colors={colors} />
      <Containers colors={colors} />
    </Canvas>
  )
}

function CameraSway({ pointer }) {
  const target = useRef(new Vector3())
  useFrame(({ camera }, delta) => {
    target.current.set(16 + pointer.x * 0.65, 8 + pointer.y * 0.35, 22)
    camera.position.lerp(target.current, 1 - Math.exp(-delta * 2.2))
    camera.lookAt(0, 1.15, -1.5)
  })
  return null
}

function Bay({ x, z, lit, colors }) {
  const lightRef = useRef()
  useFrame(({ clock }) => {
    if (lightRef.current && lit) lightRef.current.intensity = 1.1 + Math.sin(clock.elapsedTime * 1.15) * 0.14
  })

  return (
    <group position={[x, 0, z]}>
      <mesh position={[-0.08, 0.82, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.35, 1.64, 2.15]} />
        <meshStandardMaterial
          color={lit ? colors.ocean : colors.navy}
          emissive={colors.navy}
          emissiveIntensity={lit ? 0.2 : 0.15}
          roughness={0.92}
        />
      </mesh>
      <mesh position={[-0.08, 1.69, 0]} castShadow>
        <boxGeometry args={[2.55, 0.18, 2.32]} />
        <meshStandardMaterial color={lit ? colors.sun : colors.ocean} emissive={colors.ocean} emissiveIntensity={0.12} roughness={0.8} />
      </mesh>
      <mesh position={[-0.08, 1.25, 1.083]}>
        <boxGeometry args={[0.68, 0.82, 0.04]} />
        <meshStandardMaterial
          color={lit ? colors.sun : colors.midnight}
          emissive={lit ? colors.sun : colors.deep}
          emissiveIntensity={lit ? 0.45 : 0.04}
          roughness={0.55}
        />
      </mesh>
      <mesh position={[-0.72, 1.36, 1.084]}>
        <boxGeometry args={[0.4, 0.14, 0.035]} />
        <meshStandardMaterial color={lit ? colors.pale : colors.navy} emissive={lit ? colors.sun : colors.deep} emissiveIntensity={lit ? 0.5 : 0} />
      </mesh>
      {lit && <pointLight ref={lightRef} color={colors.sun} intensity={1.1} distance={7.5} position={[0, 1.65, 1.4]} />}
    </group>
  )
}

function Crane({ colors }) {
  return (
    <group position={[-0.5, 0, 1.3]}>
      <mesh position={[-5.8, 3.5, -1]} castShadow>
        <boxGeometry args={[0.16, 7, 0.18]} />
        <meshStandardMaterial color={colors.navy} />
      </mesh>
      <mesh position={[5.8, 3.5, -1]} castShadow>
        <boxGeometry args={[0.16, 7, 0.18]} />
        <meshStandardMaterial color={colors.navy} />
      </mesh>
      <mesh position={[0, 6.95, -1]} castShadow>
        <boxGeometry args={[12, 0.2, 0.24]} />
        <meshStandardMaterial color={colors.pale} roughness={0.82} />
      </mesh>
      <mesh position={[1.5, 6.65, -0.85]}>
        <boxGeometry args={[1.1, 0.38, 0.38]} />
        <meshStandardMaterial color={colors.sun} emissive={colors.sun} emissiveIntensity={0.12} />
      </mesh>
      <mesh position={[1.5, 5.25, -0.85]}>
        <boxGeometry args={[0.035, 2.45, 0.035]} />
        <meshStandardMaterial color={colors.pale} />
      </mesh>
      <mesh position={[1.5, 4.1, -0.85]}>
        <boxGeometry args={[0.45, 0.12, 0.12]} />
        <meshStandardMaterial color={colors.sun} />
      </mesh>
    </group>
  )
}

function Containers({ colors }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 8, 0, -4.2]}>
          <mesh position={[0, 0.58, 0]} castShadow>
            <boxGeometry args={[2.4, 1.16, 1.35]} />
            <meshStandardMaterial color={side < 0 ? colors.ocean : colors.navy} emissive={colors.navy} emissiveIntensity={0.12} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.78, 0]} castShadow>
            <boxGeometry args={[2.4, 1.16, 1.35]} />
            <meshStandardMaterial color={colors.midnight} emissive={colors.navy} emissiveIntensity={0.1} roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.17, 0.68]}>
            <boxGeometry args={[2.3, 0.035, 0.035]} />
            <meshStandardMaterial color={colors.pale} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
