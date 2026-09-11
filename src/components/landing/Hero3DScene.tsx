import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sphere, Torus, Line } from '@react-three/drei'
import * as THREE from 'three'

// Inner interactive 3D scene component
function MobilityCore() {
  const groupRef = useRef<THREE.Group>(null)
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // Floating campus hub node coordinates
  const nodes = useMemo(() => [
    { pos: [-2.2, 0.8, 0.6] as [number, number, number], label: 'Hostel Hub', color: '#06b6d4', size: 0.16 },
    { pos: [2.0, 1.2, -0.4] as [number, number, number], label: 'Central Academic', color: '#3b82f6', size: 0.2 },
    { pos: [1.8, -1.2, 0.8] as [number, number, number], label: 'Transit Terminal', color: '#10b981', size: 0.18 },
    { pos: [-1.9, -1.0, -0.7] as [number, number, number], label: 'Engineering Block', color: '#6366f1', size: 0.16 },
    { pos: [0, 2.1, 0.2] as [number, number, number], label: 'Main Campus Gate', color: '#0891b2', size: 0.19 },
    { pos: [0, -2.0, -0.3] as [number, number, number], label: 'Tech Park Corridor', color: '#8b5cf6', size: 0.15 },
  ], [])

  // Floating particle cloud
  const particleCount = 120
  const [positions, particleColors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    const cols = new Float32Array(particleCount * 3)
    const colorChoices = [
      new THREE.Color('#0891b2'),
      new THREE.Color('#3b82f6'),
      new THREE.Color('#10b981'),
      new THREE.Color('#6366f1'),
    ]

    for (let i = 0; i < particleCount; i++) {
      const radius = 2.4 + Math.random() * 2.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = radius * Math.cos(phi)

      const c = colorChoices[Math.floor(Math.random() * colorChoices.length)]
      cols[i * 3] = c.r
      cols[i * 3 + 1] = c.g
      cols[i * 3 + 2] = c.b
    }
    return [pos, cols]
  }, [])

  // Shuttle vehicles orbiting around the core
  const shuttle1Ref = useRef<THREE.Mesh>(null)
  const shuttle2Ref = useRef<THREE.Mesh>(null)
  const shuttle3Ref = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { pointer } = state

    if (groupRef.current) {
      // Gentle mouse parallax & continuous float
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        t * 0.18 + pointer.x * 0.45,
        0.05
      )
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        Math.sin(t * 0.2) * 0.15 - pointer.y * 0.3,
        0.05
      )
    }

    // Rings rotation
    if (ring1Ref.current) ring1Ref.current.rotation.z = t * 0.25
    if (ring2Ref.current) ring2Ref.current.rotation.x = -t * 0.2
    if (ring3Ref.current) ring3Ref.current.rotation.y = t * 0.15

    // Orbiting shuttle vehicles
    if (shuttle1Ref.current) {
      const r = 2.1
      shuttle1Ref.current.position.set(
        Math.cos(t * 0.9) * r,
        Math.sin(t * 0.9) * r * 0.5,
        Math.sin(t * 0.9) * r * 0.7
      )
    }
    if (shuttle2Ref.current) {
      const r = 2.6
      shuttle2Ref.current.position.set(
        Math.cos(-t * 0.7 + 2) * r * 0.8,
        Math.sin(-t * 0.7 + 2) * r,
        Math.cos(-t * 0.7 + 2) * r * 0.5
      )
    }
    if (shuttle3Ref.current) {
      const r = 1.8
      shuttle3Ref.current.position.set(
        Math.sin(t * 1.1 + 4) * r,
        Math.cos(t * 1.1 + 4) * r * 0.4,
        Math.cos(t * 1.1 + 4) * r
      )
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = t * 0.04
    }
  })

  // Connected corridor lines between nodes
  const corridorConnections = useMemo(() => [
    [nodes[0].pos, nodes[1].pos],
    [nodes[1].pos, nodes[2].pos],
    [nodes[2].pos, nodes[3].pos],
    [nodes[3].pos, nodes[0].pos],
    [nodes[4].pos, nodes[1].pos],
    [nodes[4].pos, nodes[0].pos],
    [nodes[5].pos, nodes[2].pos],
    [nodes[5].pos, nodes[3].pos],
    [nodes[0].pos, [0, 0, 0] as [number, number, number]],
    [nodes[1].pos, [0, 0, 0] as [number, number, number]],
    [nodes[2].pos, [0, 0, 0] as [number, number, number]],
    [nodes[3].pos, [0, 0, 0] as [number, number, number]],
  ], [nodes])

  return (
    <group ref={groupRef}>
      {/* Central Holographic Sphere (Campus Central Nexus) */}
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.5}>
        <Sphere args={[0.85, 32, 32]}>
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0369a1"
            emissiveIntensity={0.4}
            roughness={0.2}
            metalness={0.8}
            transparent
            opacity={0.85}
            wireframe={false}
          />
        </Sphere>
        {/* Core Wireframe Glow Shell */}
        <Sphere args={[0.98, 16, 16]}>
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
        </Sphere>
      </Float>

      {/* Outer Gyro Rings */}
      <Torus ref={ring1Ref} args={[2.0, 0.02, 16, 100]} rotation={[Math.PI / 4, 0, 0]}>
        <meshBasicMaterial color="#0891b2" transparent opacity={0.5} />
      </Torus>
      <Torus ref={ring2Ref} args={[2.5, 0.02, 16, 100]} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.45} />
      </Torus>
      <Torus ref={ring3Ref} args={[3.0, 0.015, 16, 100]} rotation={[Math.PI / 6, -Math.PI / 4, 0]}>
        <meshBasicMaterial color="#10b981" transparent opacity={0.4} />
      </Torus>

      {/* Campus Hub Nodes */}
      {nodes.map((node, i) => (
        <group key={i} position={node.pos}>
          <Float speed={2.5 + i * 0.4} rotationIntensity={0.5} floatIntensity={0.6}>
            <Sphere args={[node.size, 24, 24]}>
              <meshStandardMaterial
                color={node.color}
                emissive={node.color}
                emissiveIntensity={0.6}
                roughness={0.3}
                metalness={0.7}
              />
            </Sphere>
            {/* Soft Outer Halo */}
            <Sphere args={[node.size * 1.6, 12, 12]}>
              <meshBasicMaterial color={node.color} wireframe transparent opacity={0.25} />
            </Sphere>
          </Float>
        </group>
      ))}

      {/* Dynamic Corridor Laser Lines */}
      {corridorConnections.map((pair, idx) => (
        <Line
          key={idx}
          points={pair}
          color="#38bdf8"
          lineWidth={1.2}
          transparent
          opacity={0.35}
        />
      ))}

      {/* Orbiting Shuttle Vehicle Glyphs */}
      <Sphere ref={shuttle1Ref} args={[0.09, 16, 16]}>
        <meshBasicMaterial color="#22c55e" />
      </Sphere>
      <Sphere ref={shuttle2Ref} args={[0.08, 16, 16]}>
        <meshBasicMaterial color="#06b6d4" />
      </Sphere>
      <Sphere ref={shuttle3Ref} args={[0.08, 16, 16]}>
        <meshBasicMaterial color="#f59e0b" />
      </Sphere>

      {/* Particle Atmosphere */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleCount}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          vertexColors
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
    </group>
  )
}

// Error Boundary & Fallback Wrapper
class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center p-8 text-slate-400">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 mb-3 shadow-inner">
              <span className="text-2xl font-bold">⚡</span>
            </div>
            <p className="text-xs font-semibold text-slate-600">Autonomous Telemetry Grid</p>
            <p className="text-[11px] text-slate-400 mt-1">Real-time dynamic topological routing</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export const Hero3DScene: React.FC = () => {
  return (
    <div className="w-full h-[420px] sm:h-[480px] lg:h-[560px] relative">
      <SceneErrorBoundary>
        <Canvas
          camera={{ position: [0, 0, 6.2], fov: 45 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
          <pointLight position={[-4, -3, 3]} intensity={0.9} color="#38bdf8" />
          <pointLight position={[3, -4, -2]} intensity={0.6} color="#10b981" />
          <React.Suspense fallback={null}>
            <MobilityCore />
          </React.Suspense>
        </Canvas>
      </SceneErrorBoundary>

      {/* Floating 3D Badge Overlay */}
      <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200/90 shadow-md flex items-center gap-2.5 pointer-events-none">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-600"></span>
        </span>
        <div className="text-left">
          <p className="text-[11px] font-bold text-slate-900 leading-tight">3D Mobility Corridor Grid</p>
          <p className="text-[9px] text-slate-500 font-medium">Interactive WebGL · Drag to Rotate</p>
        </div>
      </div>
    </div>
  )
}

export default Hero3DScene
