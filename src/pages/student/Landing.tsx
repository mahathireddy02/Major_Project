import React, { useEffect } from 'react'
import LandingNavbar from '../../components/landing/LandingNavbar'
import HeroSection from '../../components/landing/HeroSection'
import TrustTelemetrySection from '../../components/landing/TrustTelemetrySection'
import FeatureSection from '../../components/landing/FeatureSection'
import ProductShowcase from '../../components/landing/ProductShowcase'
import Ecosystem3DSection from '../../components/landing/Ecosystem3DSection'
import HowItWorks from '../../components/landing/HowItWorks'
import SocialProofSection from '../../components/landing/SocialProofSection'
import FinalCTA from '../../components/landing/FinalCTA'
import LandingFooter from '../../components/landing/LandingFooter'

export default function Landing() {
  useEffect(() => {
    // Set page title for rich presentation
    document.title = 'CampusFlow · AI-Driven Smart Campus Mobility & Pooling'
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-cyan-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* 1. Global Navigation Bar */}
      <LandingNavbar />

      {/* 2. Hero Section with 3D WebGL Mobility Grid */}
      <HeroSection />

      {/* 3. Live Telemetry & Trust Stat Strip */}
      <TrustTelemetrySection />

      {/* 4. Core Features & Value Matrix */}
      <FeatureSection />

      {/* 5. Interactive Product Simulator Showcase */}
      <ProductShowcase />

      {/* 6. 3D Mobility Topology Architecture */}
      <Ecosystem3DSection />

      {/* 7. How It Works Step Progression */}
      <HowItWorks />

      {/* 8. Institutional Trust & Deployment Proof */}
      <SocialProofSection />

      {/* 9. High-Impact Closing CTA */}
      <FinalCTA />

      {/* 10. Footer */}
      <LandingFooter />
    </div>
  )
}
