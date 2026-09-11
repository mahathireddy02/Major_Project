-- =============================================================================
-- Campus Mobility: Supabase / PostgreSQL Core DDL Schema
-- Tables: profiles, vehicles, campus_locations, ride_requests, rides, ride_stops,
--         bookings, notifications, emergency_contacts, safety_events, ratings
-- =============================================================================

-- Enable UUID and PostGIS/Geographic extensions if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'FACULTY', 'DRIVER', 'DISPATCHER', 'ADMIN')),
  college_name TEXT DEFAULT 'Campus University',
  department TEXT DEFAULT 'General',
  year INT DEFAULT 1,
  avatar TEXT DEFAULT 'U',
  rating NUMERIC(3, 2) DEFAULT 5.00,
  total_rides INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_status TEXT DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  id_card_photo TEXT,
  profile_photo TEXT,
  license_number TEXT,
  license_photo TEXT,
  rc_photo TEXT,
  vehicle_registration TEXT,
  vehicle_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VEHICLES
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Van',
  registration TEXT NOT NULL UNIQUE,
  capacity INT NOT NULL DEFAULT 6,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ON_TRIP', 'MAINTENANCE', 'OFFLINE')),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_lat DOUBLE PRECISION NOT NULL DEFAULT 17.3850,
  current_lng DOUBLE PRECISION NOT NULL DEFAULT 78.4860,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CAMPUS LOCATIONS
CREATE TABLE IF NOT EXISTS public.campus_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  zone TEXT DEFAULT 'Campus Core',
  is_hub BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RIDE REQUESTS
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pickup_name TEXT NOT NULL,
  pickup_address TEXT,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  destination_address TEXT,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  requested_time TEXT NOT NULL,
  seats INT NOT NULL DEFAULT 1,
  route_type TEXT DEFAULT 'one-way' CHECK (route_type IN ('one-way', 'recurring')),
  recurring_days TEXT,
  status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'matched', 'booked', 'expired', 'cancelled')),
  matched_ride_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RIDES (Shared Vehicles & Trips)
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  route_name TEXT NOT NULL,
  destination TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  departure_time TEXT NOT NULL,
  date TEXT DEFAULT 'today',
  capacity INT NOT NULL DEFAULT 6,
  booked_seats INT NOT NULL DEFAULT 0,
  available_seats INT NOT NULL DEFAULT 6,
  fare NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'driver_accepted', 'boarding', 'active', 'completed', 'cancelled')),
  current_lat DOUBLE PRECISION DEFAULT 17.3850,
  current_lng DOUBLE PRECISION DEFAULT 78.4860,
  route_coordinates JSONB DEFAULT '[]'::jsonb,
  has_deviation BOOLEAN DEFAULT FALSE,
  has_sos_alert BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. RIDE STOPS
CREATE TABLE IF NOT EXISTS public.ride_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  stop_order INT NOT NULL DEFAULT 1,
  estimated_pickup_time TEXT,
  status TEXT NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'ARRIVING', 'ARRIVED', 'BOARDED', 'COMPLETED', 'SKIPPED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BOOKINGS
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  ride_request_id UUID REFERENCES public.ride_requests(id) ON DELETE SET NULL,
  pickup TEXT NOT NULL,
  destination TEXT NOT NULL,
  seats INT NOT NULL DEFAULT 1,
  seat_no INT NOT NULL,
  fare NUMERIC(6, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'boarded', 'completed', 'cancelled')),
  match_score NUMERIC(5, 2),
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_ride UNIQUE (student_id, ride_id)
);

-- 8. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EMERGENCY CONTACTS
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL DEFAULT 'Parent',
  phone TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. SAFETY EVENTS
CREATE TABLE IF NOT EXISTS public.safety_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ROUTE_DEVIATION', 'SOS', 'PANIC', 'DRIVER_DELAY', 'OTHER')),
  severity TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED', 'INVESTIGATING')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. RATINGS
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_rating UNIQUE (booking_id, from_user_id)
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_ride_id ON public.bookings(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(student_id, read);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user ON public.emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_events_ride ON public.safety_events(ride_id, resolved);

-- Realtime Publication Enablement for Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_events;
