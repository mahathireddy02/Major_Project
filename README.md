# Campus Mobility 🚐🎓

> **Share the route. Not the wait.**

Campus Mobility is an intelligent campus ride-sharing and pooling platform prototype built for hackathon demonstrations. It demonstrates autonomous route matching and dynamic pooling of student transportation demand with realistic simulated telemetry.

---

## ✨ Features

- **Autonomous Route Matching & Pooling:** Multi-factor compatibility scoring (Destination, Route Overlap, Time Delta, Proximity, Detour).
- **Dynamic Seat Filling:** Real-time seat progression (`2/6` → `5/6` → `6/6`), automatically triggering `RIDE FULL` and closing booking.
- **Explainable AI Recommendations:** Human-readable explanations showing exactly why a route was recommended.
- **3 Dedicated Perspectives:**
  - **Student View:** Search, intelligent match card, live tracking, booking confirmation, safety center with SOS, ride history, and notifications.
  - **Driver View:** Dashboard, digital boarding passenger roster, incoming request acceptance, and vehicle verification profile.
  - **Campus Dispatcher Command Center:** 6 real-time KPIs, live mobility map with vehicle telematics, AI mobility intelligence insights, and an AI fleet copilot assistant.
- **Hackathon Demo Controls:** 8 simulation triggers for judges (fill next seat, trigger route deviation alert, emergency SOS, traffic congestion recalculation, and reset).

---

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (Custom design system based on UI/UX Pro Max)
- **State Management:** Zustand
- **Routing:** React Router v6 (HashRouter for zero-config static hosting)
- **Visuals & Telematics:** HTML5 Canvas Animated Campus Map
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/uday951/campus.git

# Navigate into project directory
cd campus

# Install dependencies
npm install

# Start local development server
npm run dev

# Or build and run preview
npm run build
npm run preview
```

---

## 📱 Quick Role Switcher

Use the persistent floating pill bar anchored in the top-right corner to test all roles with 1-click:
`[ 👤 Student ]` · `[ 🚐 Driver ]` · `[ 🛡️ Dispatcher ]` · `[ ⚡ Demo ]`
