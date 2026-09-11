import React, { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sphere, Line, Text, Torus } from '@react-three/drei'
import { motion } from 'framer-motion'
import * as THREE from 'three'
import { Layers, Zap, Route as RouteIcon, ShieldCheck, Leaf, ArrowDown } from 'lucide-react'

// 3D Multi-tier Data Hierarchy Visualization
function EcosystemNodes({ activeTier, onSelectTier }: { activeTier: number; onSelectTier: (idx: number) => void }) {
  const groupRef = useRef<THREE.Group>(null)

  // 4 Horizontal Topological Tier Discs
  const tiers = useMemo(() => [
    { y: 1.8, label: 'Tier 1: Commuter Requests', color: '#06b6d4', ringRadius: 1.8 },
    { y: 0.6, label: 'Tier 2: Topological Graph Engine', color: '#3b82f6', ringRadius: 2.2 },
    { y: -0.6, label: 'Tier 3: Active Fleet Shuttles', color: '#10b981', ringRadius: 2.0 },
    { y: -1.8, label: 'Tier 4: Campus Safety & SOS Grid', color: '#8b5cf6', ringRadius: 1.7 },
  ], [])

  // Nodes on each tier
  const tierNodes = useMemo(() => {
    return [
      // Tier 1: 4 commuter request beacons
      [
        [-1.2, 1.8, 0.4], [1.2, 1.8, -0.4], [0.3, 1.8, 1.3], [-0.5, 1.8, -1.2]
      ],
      // Tier 2: 5 OSRM routing intersections
      [
        [-1.6, 0.6, -0.5], [1.5, 0.6, 0.6], [0, 0.6, 0], [0.8, 0.6, -1.4], [-0.9, 0.6, 1.2]
      ],
      // Tier 3: 3 fleet vehicles
      [
        [-1.3, -0.6, 0.8], [1.4, -0.6, -0.7], [0.1, -0.6, 1.5]
      ],
      // Tier 4: 2 campus command nodes
      [
        [-0.8, -1.8, 0], [0.8, -1.8, 0]
      ],
    ]
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const { pointer } = state
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        t * 0.12 + pointer.x * 0.35,
        0.05
      )
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        pointer.y * 0.15,
        0.05
      )
    }
  })

  return (
    <group ref={groupRef}>
      {/* Central Spinal Laser Flow connecting all 4 tiers */}
      <Line
        points={[[0, 2.2, 0], [0, -2.2, 0]]}
        color="#38bdf8"
        lineWidth={2}
        transparent
        opacity={0.6}
      />

      {tiers.map((tier, idx) => {
        const isSelected = activeTier === idx
        return (
          <group key={idx} position={[0, tier.y, 0]}>
            {/* Horizontal Guide Ring */}
            <Torus args={[tier.ringRadius, 0.015, 16, 64]} rotation={[Math.PI / 2, 0, 0]}>
              <meshBasicMaterial
                color={tier.color}
                transparent
                opacity={isSelected ? 0.85 : 0.3}
              />
            </Torus>

            {/* Central Pillar Core Node */}
            <Sphere args={[0.2, 16, 16]}>
              <meshStandardMaterial
                color={tier.color}
                emissive={tier.color}
                emissiveIntensity={isSelected ? 0.8 : 0.3}
                roughness={0.2}
              />
            </Sphere>

            {/* Satellite Nodes */}
            {tierNodes[idx].map((pt, pIdx) => (
              <group key={pIdx} position={[pt[0], 0, pt[2]]}>
                <Float speed={2} rotationIntensity={0.3} floatIntensity={0.4}>
                  <Sphere args={[0.12, 16, 16]}>
                    <meshStandardMaterial
                      color={tier.color}
                      emissive={tier.color}
                      emissiveIntensity={isSelected ? 0.9 : 0.4}
                    />
                  </Sphere>
                  {/* Connecting line to tier center */}
                  <Line
                    points={[[0, 0, 0], [-pt[0], 0, -pt[2]]]}
                    color={tier.color}
                    lineWidth={1}
                    transparent
                    opacity={isSelected ? 0.6 : 0.25}
                  />
                </Float>
              </group>
            ))}
          </group>
        )
      })}
    </group>
  )
}

export const Ecosystem3DSection: React.FC = () => {
  const [activeTier, setActiveTier] = useState(0)

  const TIER_DETAILS = [
    {
      title: 'Tier 1: Commuter Intent & Demand Ingestion',
      desc: 'Students & faculty submit departure windows and GPS pickup locations. High-frequency websocket streams ingest demand across the academic zone.',
      stat: '0ms Latency',
      statLabel: 'Instant Telemetry Ingestion',
    },
    {
      title: 'Tier 2: Topological Graph Optimization',
      desc: 'Our greedy clustering & genetic route optimizer identifies overlapping corridor corridors and computes detour boundaries strictly under 1.2 minutes.',
      stat: '< 80ms',
      statLabel: 'Matrix Clustering Speed',
    },
    {
      title: 'Tier 3: Dynamic Fleet & Capacity Balancing',
      desc: 'Fleet shuttles are dynamically dispatched with auto-balanced passenger rosters, digital seat token keys, and automated driver waypoints.',
      stat: '3.2x Factor',
      statLabel: 'Fleet Vehicle Utilization',
    },
    {
      title: 'Tier 4: Supervisory Security & Carbon Accounting',
      desc: 'Campus security continuously oversees corridor safety with single-tap SOS protection while calculating daily institutional carbon footprint reduction.',
      stat: '38.2% Save',
      statLabel: 'CO₂ Footprint Reduction',
    },
  ]

  return (
    <section id="ecosystem" className="py-20 lg:py-28 bg-white border-t border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200/80 text-cyan-700 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>3D Mobility Topology Architecture</span>
          </div>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 tracking-tight">
            How CampusFlow coordinates the mobility ecosystem.
          </h2>
          <p className="text-base text-slate-600 font-normal">
            A unified four-tier data architecture bridging commuter intents, road graphs, fleet logistics, and security supervision.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: 3D Visualization */}
          <div className="lg:col-span-6 h-[400px] sm:h-[460px] lg:h-[500px] rounded-3xl bg-slate-50/80 border border-slate-200/90 shadow-md relative overflow-hidden">
            <Canvas
              camera={{ position: [0, 0, 5.8], fov: 45 }}
              dpr={[1, 1.5]}
              gl={{ antialias: true, alpha: true }}
              className="w-full h-full"
            >
              <ambientLight intensity={0.9} />
              <directionalLight position={[4, 6, 4]} intensity={1.2} />
              <pointLight position={[-3, -3, 3]} intensity={0.8} color="#06b6d4" />
              <React.Suspense fallback={null}>
                <EcosystemNodes activeTier={activeTier} onSelectTier={setActiveTier} />
              </React.Suspense>
            </Canvas>

            <div className="absolute bottom-3 left-4 text-left pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-white/90 px-2 py-1 rounded border border-slate-200 shadow-2xs">
                3D Live Topology · Rotate with Cursor
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Tier Cards */}
          <div className="lg:col-span-6 space-y-3 text-left">
            {TIER_DETAILS.map((tier, idx) => {
              const isSelected = activeTier === idx
              return (
                <motion.div
                  key={idx}
                  onClick={() => setActiveTier(idx)}
                  whileHover={{ scale: 1.01 }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-50/80 via-blue-50/50 to-white border-cyan-400 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <h4 className="font-heading font-bold text-sm sm:text-base text-slate-900">
                          {tier.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 pl-7 leading-relaxed">
                        {tier.desc}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-heading font-extrabold text-sm sm:text-base text-cyan-700">
                        {tier.stat}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono">{tier.statLabel}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Ecosystem3DSection
