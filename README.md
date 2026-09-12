# CampusFlow — Autonomous Campus Mobility & Fleet Intelligence Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)]()
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)]()
[![Fastify](https://img.shields.io/badge/Fastify-5.12-black.svg)]()
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248.svg)]()
[![OSRM](https://img.shields.io/badge/Routing-OSRM-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

> **"Share the route. Not the wait."**  
> An enterprise-grade, intelligent campus ride-pooling, dynamic routing, and autonomous fleet-dispatching platform designed for modern university ecosystems.

---

## 📌 Executive Summary

**CampusFlow** solves the critical last-mile and inter-campus transit crisis faced by students, faculty, and institutional administrators. Traditional campus transportation suffers from static bus routes, empty return trips, irregular schedules, safety concerns for night travelers, and fragmented communication.

CampusFlow introduces an **autonomous multi-passenger ride-matching and dynamic corridor-pooling engine**:
- **Intelligent Route Merging**: Groups students traveling along compatible spatial corridors into a single trip using **vector cosine trajectory alignment**.
- **Automated Separation**: Automatically splits incompatible requests or opposite-direction travelers into separate physical trips assigned to distinct available fleet drivers and vehicles.
- **Strict Female-Only Safety**: Enforces isolated, verified female-only pooling options with strict gender validation.
- **Fair Dynamic Pricing**: Calculates individual, transparent fares based on base cost, road distance, travel duration, pooled route overlap discounts, and detour penalties.
- **Enterprise Safety & SOS**: One-touch hardware/software SOS with live GPS telemetry, Twilio SMS broadcast to campus security, and automated emergency contact email dispatch.

---

## 🏛️ System Architecture

```
                               ┌────────────────────────────────────────┐
                               │       React 18 + Vite Frontend         │
                               │  (Tailwind CSS + Zustand + Leaflet)    │
                               └──────────────────┬─────────────────────┘
                                                  │ HTTP REST / WS /realtime
                                                  ▼
                               ┌────────────────────────────────────────┐
                               │         Fastify Backend Server         │
                               │           (Port 5000 / API)            │
                               └───────┬──────────────┬───────────────┬─┘
                                       │              │               │
            ┌──────────────────────────┴──┐           │               └──────────────────────────┐
            ▼                             ▼           ▼                                          ▼
┌──────────────────────┐     ┌────────────────────────┐     ┌─────────────────────┐    ┌────────────────────┐
│ TripGroupingService  │     │    Matching Service    │     │   Pricing Engine    │    │   Safety Service   │
│ - Corridor Alignment │     │ - Cosine Trajectory    │     │ - Overlap Discount  │    │ - GPS Telemetry    │
│ - Driver Allocation  │     │ - Max 40% Detour       │     │ - Detour Surcharge  │    │ - Twilio SMS Alert │
│ - Capacity Control   │     │ - Max 12 Min Delay     │     │ - Clamped (₹30-500) │    │ - Security Email   │
└──────────┬───────────┘     └────────────┬───────────┘     └──────────┬──────────┘    └─────────┬──────────┘
           │                              │                            │                         │
           └──────────────────────────────┼────────────────────────────┴─────────────────────────┘
                                          ▼
                               ┌──────────────────────┐
                               │   MongoDB Database   │
                               │  - Users & Drivers   │
                               │  - Rides & Vehicles  │
                               │  - Bookings & Stops  │
                               │  - Safety & Alerts   │
                               └──────────────────────┘
```

---

## ✨ Key Features & Capabilities

### 1. Decoupled Booking vs. Physical Trip Model
- **`Booking`**: Belongs to an individual passenger. Tracks origin, destination, seat requirement, fare breakdown, and personal status (`confirmed` → `boarded` → `dropped` / `completed`).
- **`Trip / Ride`**: Represents the physical vehicle operated by an assigned driver. Manages capacity, sequenced OSRM pickup/dropoff waypoints, geometry, and live GPS coordinates.

### 2. Autonomous Multi-Trip Grouping & Driver Assignment
- **Vector Cosine Direction Alignment**: Measures the cosine angle $\cos(\theta)$ between passenger routes:
  $$\cos(\theta) = \frac{\vec{A} \cdot \vec{B}}{\|\vec{A}\| \|\vec{B}\|}$$
  - $\cos(\theta) \ge 0.4$: Aligned corridor $\rightarrow$ Eligible for shared pooling.
  - $\cos(\theta) < -0.2$: Opposite trajectory $\rightarrow$ Hard rejection; automatically spins up a new trip.
- **Strict Detour Budget**: Merges are rejected if the resulting route incurs $> 40\%$ detour or $> 12$ minutes delay.
- **Zero-Driver-Reuse Invariant**: Concurrent active trips are strictly allocated to **distinct verified drivers and vehicles** from the 20-vehicle institutional fleet.

### 3. Dynamic Shared-Ride Pricing Engine
- Individual locked fares calculated using dynamic pricing formulas:
  $$\text{Fare} = \text{Base} + (\text{Dist} \times \text{Rate}_{\text{km}}) + (\text{Time} \times \text{Rate}_{\text{min}}) - \text{Discount}_{\text{overlap}} + \text{Surcharge}_{\text{detour}}$$
- High route overlap grants up to $30\%$ discount.
- Fares are strictly clamped between **₹30** and **₹500**.

### 4. Comprehensive Safety & SOS Protocol
- **Spam-Resistant SOS**: Triggers immediate high-priority dispatch event.
- **Emergency Telemetry**: Captures real-time GPS coordinates, vehicle plate number, driver details, and student roll number.
- **Multi-Channel Dispatch**: Sends automated Twilio SMS and SMTP emergency emails to designated parent/guardian and campus security desks.
- **Route Deviation Alarm**: Detects when vehicle veers $> 500\text{m}$ off the planned OSRM polyline and triggers alerts.

---

## 👥 Portals & Perspectives

### 🎓 Student Portal (`/student`)
- **Smart Booking (`/student/book`)**: Search pickup and destination across campus hostels, academic blocks, and transit hubs.
- **AI Matching Results (`/student/matches`)**: View match scores, explainable pooling rationale, locked fare estimates, and carbon savings.
- **My Rides (`/student/rides`)**: Filter across **Active**, **Upcoming**, **Completed**, **Cancelled**, and **All** trips with real-time status badges, driver ratings, and trip tracking.
- **Live Trip Tracking (`/student/live`)**: Real-time Leaflet map displaying driver vehicle location, route path, pickup ETA, and driver chat.
- **Safety Center (`/student/safety`)**: Configure emergency contacts, view campus emergency numbers, and trigger one-tap SOS.

### 🚐 Institutional Driver Portal (`/driver`)
- **Current Active Trip (`/driver/trip`)**: Complete stop-by-stop navigation manifest with ordered pickup and dropoff points.
- **Digital Passenger Roster**: Instant boarding controls (`Confirm Boarding`, `Mark Dropped`) updating student statuses in real-time.
- **Driver Dashboard (`/driver/dashboard`)**: Duty toggle (Online/Offline), earnings summary, completed trip log, and driver rating.
- **Turn-by-Turn GPS Simulator**: Test simulated vehicle progress along real OSRM coordinates.

### 🛡️ Dispatcher & Admin Command Center (`/admin`)
- **Fleet Overview (`/admin/dashboard`)**: 6 live operational KPIs (Active Fleet, Total Passengers Moved, Vehicle Utilization, On-Time Rate, Fuel/Carbon Saved, Active SOS Alerts).
- **Live Campus Radar (`/admin/live-map`)**: Interactive map with real-time telemetry markers for all shuttles, active routes, and incident locations.
- **Active Trips Monitor (`/admin/active-rides`)**: Inspect passenger manifests, vehicle loads, and reassignment controls.
- **SOS Incident Room (`/admin/safety-center`)**: Dedicated emergency response console with audible alarms, telemetry logs, and one-click incident acknowledgment/resolution.

---

## 🛠️ Tech Stack & Dependencies

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | High-performance SPA with strict type safety |
| **Styling** | Tailwind CSS, Lucide React | Modern responsive design with micro-interactions |
| **State** | Zustand | Lightweight, high-speed reactive state management |
| **Routing** | React Router v6 | Client-side routing with deep-link state preservation |
| **Maps & Routing** | Leaflet, React-Leaflet, OSRM API | Campus map visualization and real road path generation |
| **Backend** | Fastify 5, TypeScript, TSX | High-throughput asynchronous REST & WebSocket API |
| **Database** | MongoDB, Mongoose 9 | Document storage for rides, bookings, users, and safety logs |
| **Realtime** | Fastify WebSocket | Instant event streaming for trip updates, boarding, and SOS |
| **Testing** | Vitest | Unit, integration, and end-to-end lifecycle testing |
| **External APIs** | Twilio, Nodemailer, OSRM | SMS dispatch, emergency email alerts, road geometry |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js** v18.0 or higher
- **npm** v9.0 or higher
- **MongoDB** running locally on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection URI)

### 1. Clone & Install
```bash
git clone https://github.com/uday951/HackSankalp2k26.git
cd HackSankalp2k26
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory (or use `.env.example`):
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campusflow
JWT_SECRET=campusflow-super-secret-key-2026
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_BASE_URL=ws://localhost:5000/realtime

# Optional Third-Party Emergency Integrations
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
SOS_ALERT_PHONE_NUMBER=+919988776655
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Seed Institutional Data
Seed the database with 20 verified campus drivers, electric shuttle vehicles, and test students:
```bash
npx tsx server/seeds/seed.ts
```

### 4. Run Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev:all
```
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`
- **WebSocket Gateway**: `ws://localhost:5000/realtime`

---

## 🧪 Testing & Verification

CampusFlow includes a comprehensive automated test suite covering all critical services:

```bash
# Run all server test suites
npx vitest run server/tests/
```

### Key Test Suites:
- **`multiTripMatching.test.ts`**: Verifies vector cosine alignment, automatic corridor grouping, dynamic route separation, capacity limits, and female-only safety isolation.
- **`pricingEngine.test.ts`**: Tests multi-factor passenger fare calculations, overlap discounts, detour surcharges, and ₹30-500 boundary clamps.
- **`sosEmergencyWorkflow.test.ts`**: End-to-end emergency SOS dispatch, telemetry capture, SMS formatting, and spam prevention.
- **`notificationLifecycle.test.ts`**: Verifies real-time notifications across Student, Driver, and Dispatcher for the entire 14-step ride lifecycle.
- **`rideWorkflowLifecycle.test.ts`**: Full integration test from ride request to passenger dropoff and completion.

---

## 📱 Quick Role Switcher (For Judges & Evaluators)

A persistent role switcher is available in the top bar to easily switch perspectives:
- **`[ 🎓 Student ]`**: Test search, booking, fare breakdown, live tracking, and ride history.
- **`[ 🚐 Driver ]`**: View active trip manifest, test passenger boarding, dropoffs, and completion.
- **`[ 🛡️ Dispatcher ]`**: View live campus map, monitor fleet KPIs, and resolve SOS alerts.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
