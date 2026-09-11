-- =============================================================================
-- Campus Mobility: Supabase / PostgreSQL Dynamic Shared-Ride Pricing Schema
-- Tables: pricing_config, ride_fares, pricing_events
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRICING CONFIGURATION
CREATE TABLE IF NOT EXISTS public.pricing_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Standard Campus Policy',
  base_fare NUMERIC(8, 2) NOT NULL DEFAULT 20.00,
  per_km_rate NUMERIC(8, 2) NOT NULL DEFAULT 8.00,
  per_minute_rate NUMERIC(8, 2) NOT NULL DEFAULT 1.00,
  minimum_fare NUMERIC(8, 2) NOT NULL DEFAULT 30.00,
  maximum_fare NUMERIC(8, 2) NOT NULL DEFAULT 500.00,
  shared_discount_cap NUMERIC(4, 2) NOT NULL DEFAULT 0.30, -- max 30% discount
  ai_adjustment_cap NUMERIC(4, 2) NOT NULL DEFAULT 0.10,   -- max +/- 10% AI advisory
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RIDE FARES (One authoritative record per passenger/booking)
CREATE TABLE IF NOT EXISTS public.ride_fares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  passenger_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  base_amount NUMERIC(8, 2) NOT NULL DEFAULT 20.00,
  distance_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  time_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  route_contribution_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  shared_savings_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  demand_adjustment_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  ai_adjustment_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
  final_amount NUMERIC(8, 2) NOT NULL,
  final_amount_paise BIGINT NOT NULL,
  distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  duration_minutes NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  route_overlap_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  additional_distance_km NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  additional_duration_minutes NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
  occupancy_at_calculation INT NOT NULL DEFAULT 1,
  pricing_version TEXT NOT NULL DEFAULT 'v1.0',
  calculation_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (calculation_status IN ('ESTIMATE', 'CONFIRMED', 'RECALCULATED', 'CREDITED', 'LOCKED')),
  calculation_reason TEXT,
  ai_explanation TEXT,
  breakdown JSONB DEFAULT '{}'::jsonb,
  is_locked BOOLEAN NOT NULL DEFAULT TRUE,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_fare UNIQUE (booking_id)
);

-- 3. PRICING EVENTS AUDIT TRAIL
CREATE TABLE IF NOT EXISTS public.pricing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'INITIAL_CALCULATION',
    'PASSENGER_JOINED',
    'PASSENGER_CANCELLED',
    'ROUTE_RECALCULATED',
    'VEHICLE_CHANGED',
    'CAPACITY_CHANGED',
    'DEMAND_UPDATED',
    'MANUAL_DISPATCH_ADJUSTMENT',
    'PRICE_RECALCULATED'
  )),
  old_amount NUMERIC(8, 2),
  new_amount NUMERIC(8, 2) NOT NULL,
  trigger TEXT NOT NULL,
  reason TEXT,
  input_snapshot JSONB DEFAULT '{}'::jsonb,
  calculation_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ride_fares_ride ON public.ride_fares(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_fares_booking ON public.ride_fares(booking_id);
CREATE INDEX IF NOT EXISTS idx_pricing_events_ride ON public.pricing_events(ride_id);
CREATE INDEX IF NOT EXISTS idx_pricing_events_booking ON public.pricing_events(booking_id);

-- Realtime Publication Enablement for Supabase Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_config;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_fares;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pricing_events;
  END IF;
END $$;
