export interface BotAction {
  label: string
  to: string
  variant?: 'primary' | 'secondary' | 'emerald' | 'rose'
}

export interface BotResponse {
  text: string
  actions?: BotAction[]
  chips?: string[]
}

export type ChatPortal = 'student' | 'driver' | 'admin' | 'guest'

export function getInitialBotState(portal: ChatPortal, userName?: string): { greeting: string; chips: string[] } {
  const name = userName ? ` ${userName}` : ''

  if (portal === 'student') {
    return {
      greeting: `👋 Hi${name}! I'm **CampusBuddy**, your AI commute assistant. I can help you locate shuttles, check booking status, book trips to SRI INDU or other hubs, and provide safety assistance. How can I help today?`,
      chips: [
        '📍 Where is my shuttle?',
        '🏁 Book a ride to SRI INDU',
        '🎫 Check my active booking',
        '⏱️ Today\'s shuttle routes & times',
        '🚨 Emergency & Safety SOS',
      ],
    }
  }

  if (portal === 'driver') {
    return {
      greeting: `🚖 Welcome Captain${name}! I'm **CampusPilot**, your AI co-pilot. I can brief you on next pickup stops, passenger manifests, boarding procedures, and route navigation.`,
      chips: [
        '👥 Who is my next pickup?',
        '🗺️ Route & stop sequence',
        '📋 Passenger manifest summary',
        '⚠️ How do I report a delay?',
        '🏁 How to complete this trip?',
      ],
    }
  }

  if (portal === 'admin') {
    return {
      greeting: `🛰️ Dispatch Officer${name}, **FleetVision AI** is active. Monitoring real-time telemetry, vehicle occupancy, route deviation alerts, and autonomous matching status across the campus fleet.`,
      chips: [
        '📊 Fleet occupancy & status',
        '🚨 Any active deviations or alerts?',
        '🚐 List active in-service shuttles',
        '⚡ Autonomous matching health',
        '🗺️ Open Live Mobility Map',
      ],
    }
  }

  return {
    greeting: `👋 Welcome to **CampusFlow Mobility Concierge**! I can answer questions about campus shuttle routes, student and faculty booking, driver onboarding, or dispatch operations.`,
    chips: [
      '🎓 How do I book a student ride?',
      '🚐 How does driver portal work?',
      '🛡️ Campus safety protocols',
      '🔑 Sign in to portal',
    ],
  }
}

export function generateBotResponse(
  query: string,
  portal: ChatPortal,
  store: {
    rides: any[]
    bookings: any[]
    vehicles: any[]
    drivers: any[]
    safetyEvents: any[]
    currentUser: any
    currentStudentId: string
    currentDriverId: string
  }
): BotResponse {
  const q = query.toLowerCase().trim()

  // -------------------------------------------------------------
  // 1. STUDENT / FACULTY PORTAL RESPONSES
  // -------------------------------------------------------------
  if (portal === 'student') {
    const studentId = store.currentUser?.id || store.currentStudentId
    const studentBookings = store.bookings.filter(
      (b) => b.studentId === studentId && b.status !== 'cancelled'
    )
    const activeBooking = studentBookings.find(
      (b) => b.status === 'confirmed' || b.status === 'boarded' || b.status === 'pending'
    )
    const activeRide = activeBooking
      ? store.rides.find((r) => r.id === activeBooking.rideId)
      : store.rides.find(
          (r) =>
            r.status !== 'completed' &&
            r.status !== 'cancelled' &&
            r.passengers?.some((p: any) => p.studentId === studentId && p.status !== 'dropped')
        )

    // Where is my ride / Track ride / ETA
    if (
      q.includes('where') ||
      q.includes('track') ||
      q.includes('shuttle') ||
      q.includes('eta') ||
      q.includes('bus') ||
      q.includes('my ride')
    ) {
      if (activeRide) {
        const driver = store.drivers.find((d) => d.id === activeRide.driverId)
        const vehicle = store.vehicles.find((v) => v.id === activeRide.vehicleId)
        const dest = activeBooking?.destination || activeRide.destination
        const pickup = activeBooking?.pickup || activeRide.pickupPoints[0]?.name || 'Designated Pickup'

        return {
          text: `🚌 **Your Active Shuttle**: **${activeRide.routeName}**\n\n` +
            `• **Status**: ${activeRide.status.toUpperCase()}\n` +
            `• **Pickup**: ${pickup}\n` +
            `• **Destination**: ${dest}\n` +
            `• **Assigned Driver**: ${driver?.name || 'Staff Driver'} (${driver?.phone || 'Helpline Available'})\n` +
            `• **Vehicle**: ${vehicle?.name || 'Campus Shuttle'} (${vehicle?.registration || 'TS 07 UA 1234'})\n` +
            `• **Departure**: ${activeRide.departureTime}\n\n` +
            `You can open real-time GPS tracking with live stop countdown anytime!`,
          actions: [
            { label: 'Track Live on Map', to: `/student/live?rideId=${activeRide.id}`, variant: 'primary' },
            { label: 'View Booking Details', to: `/student/ride/${activeRide.id}`, variant: 'secondary' },
          ],
          chips: ['When does it depart?', 'Contact driver', 'Cancel booking'],
        }
      }

      return {
        text: `You do not have any active shuttle bookings right now.\n\n` +
          `Would you like to search available routes or book a ride across campus? Fixed fare is just **₹25**!`,
        actions: [
          { label: 'Find & Book a Ride', to: '/student/home', variant: 'primary' },
          { label: 'View Available Routes', to: '/student/rides', variant: 'secondary' },
        ],
        chips: ['Book ride to SRI INDU', 'Shuttle schedule', 'Fixed student fares'],
      }
    }

    // Book ride / Destination inquiries
    if (
      q.includes('book') ||
      q.includes('sri indu') ||
      q.includes('airport') ||
      q.includes('station') ||
      q.includes('destination') ||
      q.includes('hitech')
    ) {
      return {
        text: `📍 **How to Book a Ride:**\n\n` +
          `1. Head to the **Student Home** map.\n` +
          `2. Choose your pickup point (or tap *Current GPS Location*).\n` +
          `3. Pick your destination (quick chips include **SRI INDU College**, **Airport**, **Secunderabad**, or **Hitech City**).\n` +
          `4. Hit **Find Ride** to match with the optimal route and driver.\n\n` +
          `All bookings include seat reservation and live safety monitoring.`,
        actions: [
          { label: 'Book on Home Map', to: '/student/home', variant: 'primary' },
        ],
        chips: ['Where is my shuttle?', 'What is the fare?', 'Is booking guaranteed?'],
      }
    }

    // Booking status / ticket
    if (q.includes('status') || q.includes('booking') || q.includes('ticket') || q.includes('seat')) {
      if (activeBooking) {
        return {
          text: `🎫 **Current Booking Record:**\n\n` +
            `• **Booking ID**: #${activeBooking.id.slice(-6)}\n` +
            `• **Status**: ${activeBooking.status.toUpperCase()}\n` +
            `• **Seat Assigned**: Seat #${activeBooking.seatNo || 1}\n` +
            `• **Pickup**: ${activeBooking.pickup}\n` +
            `• **Destination**: ${activeBooking.destination || 'Campus Hub'}\n` +
            `• **Fare**: ₹${activeBooking.fare}`,
          actions: [
            { label: 'Live GPS Tracking', to: '/student/live', variant: 'primary' },
            { label: 'All Booking History', to: '/student/rides', variant: 'secondary' },
          ],
          chips: ['Where is my shuttle?', 'Safety support', 'Cancel booking'],
        }
      }

      return {
        text: `You have no pending or confirmed bookings at the moment. You can view past completed rides in your Ride History or book a new shuttle right now.`,
        actions: [
          { label: 'Book a Ride', to: '/student/home', variant: 'primary' },
          { label: 'View Ride History', to: '/student/rides', variant: 'secondary' },
        ],
        chips: ['Book ride to SRI INDU', 'Campus shuttle routes'],
      }
    }

    // Schedule / Times / Routes
    if (q.includes('route') || q.includes('time') || q.includes('schedule') || q.includes('departure')) {
      const openRides = store.rides.filter((r) => r.status !== 'completed' && r.status !== 'cancelled').slice(0, 4)
      const routeList = openRides.length > 0
        ? openRides.map((r) => `• **${r.routeName}**: Departs at ${r.departureTime} → Destination: *${r.destination}* (${r.capacity - r.bookedSeats} seats free)`).join('\n')
        : '• Shuttles run continuously from 7:30 AM to 6:00 PM across all campus gates.'

      return {
        text: `🕒 **Live Campus Shuttle Schedule:**\n\n${routeList}\n\n` +
          `Peak service operates every 10–15 minutes between campus gates and student hostels.`,
        actions: [
          { label: 'Explore All Routes', to: '/student/home', variant: 'primary' },
        ],
        chips: ['Book ride to SRI INDU', 'Track active ride', 'Fare details'],
      }
    }

    // Safety / Emergency / SOS
    if (q.includes('safe') || q.includes('sos') || q.includes('emergency') || q.includes('help') || q.includes('police')) {
      return {
        text: `🚨 **Campus Safety & Emergency Protocol:**\n\n` +
          `• **Emergency SOS**: Tap the red SOS button to alert Dispatcher & Security immediately with real-time GPS telemetry.\n` +
          `• **Campus Security Control**: \`+916305649558\`\n` +
          `• **Driver Verification**: All drivers are institutional staff with verified credentials.\n` +
          `• **Corridor Monitoring**: System automatically alerts if a shuttle deviates from designated routes.`,
        actions: [
          { label: 'Open Safety Center', to: '/student/safety', variant: 'rose' },
        ],
        chips: ['Where is my shuttle?', 'Check driver details', 'Campus security desk'],
      }
    }

    // Fare / Pricing
    if (q.includes('fare') || q.includes('cost') || q.includes('price') || q.includes('pay') || q.includes('fee')) {
      return {
        text: `💳 **Campus Mobility Fare Policy:**\n\n` +
          `• Flat rate: **₹25 per trip** for all verified students & faculty.\n` +
          `• Payment methods: UPI, Student ID Wallet, or Cash to Operator.\n` +
          `• No surge pricing or hidden charges apply on campus transit.`,
        chips: ['Book a ride', 'Where is my shuttle?', 'Schedule'],
      }
    }

    // Default student response
    return {
      text: `I'm here to assist with your campus journey! You can ask me to track your shuttle, check departure timings, find a ride to SRI INDU, or provide emergency safety assistance.`,
      chips: [
        '📍 Where is my shuttle?',
        '🏁 Book a ride to SRI INDU',
        '🎫 Check my active booking',
        '🚨 Emergency & Safety SOS',
      ],
    }
  }

  // -------------------------------------------------------------
  // 2. DRIVER PORTAL RESPONSES
  // -------------------------------------------------------------
  if (portal === 'driver') {
    const driverId = store.currentUser?.id || store.currentDriverId
    const assignedRide = store.rides.find(
      (r) => r.driverId === driverId && r.status !== 'completed' && r.status !== 'cancelled'
    ) || store.rides.find((r) => r.status === 'active' || r.status === 'boarding')

    // Next pickup / Stops
    if (
      q.includes('pickup') ||
      q.includes('stop') ||
      q.includes('next') ||
      q.includes('route') ||
      q.includes('navigate')
    ) {
      if (assignedRide) {
        const nextPickup = assignedRide.pickupPoints?.[0]?.name || 'Main Campus Gate'
        const totalPax = assignedRide.passengers?.length || assignedRide.bookedSeats || 0
        const boardedPax = (assignedRide.passengers || []).filter((p: any) => p.status === 'boarded').length

        return {
          text: `🗺️ **Current Route Assignment**: **${assignedRide.routeName}**\n\n` +
            `• **Next Stop**: ${nextPickup}\n` +
            `• **Final Destination**: ${assignedRide.destination}\n` +
            `• **Total Passengers**: ${totalPax} (${boardedPax} Boarded, ${totalPax - boardedPax} Waiting)\n` +
            `• **Trip Status**: ${assignedRide.status.toUpperCase()}\n\n` +
            `Turn-by-turn navigation and stop progression are active on your Current Trip screen.`,
          actions: [
            { label: 'Open Navigation View', to: '/driver/trip', variant: 'primary' },
            { label: 'View Passenger List', to: '/driver/passengers', variant: 'secondary' },
          ],
          chips: ['Who is boarding?', 'How to board a passenger?', 'Complete trip'],
        }
      }

      return {
        text: `You have no active trip in progress right now. Check your Dashboard for new ride assignments or incoming dispatch requests!`,
        actions: [
          { label: 'Driver Dashboard', to: '/driver/dashboard', variant: 'primary' },
        ],
        chips: ['Trip history', 'Vehicle status', 'Earnings summary'],
      }
    }

    // Passenger manifest
    if (q.includes('passenger') || q.includes('manifest') || q.includes('student') || q.includes('board') || q.includes('who')) {
      if (assignedRide && assignedRide.passengers && assignedRide.passengers.length > 0) {
        const pSummary = assignedRide.passengers.map(
          (p: any, i: number) => `${i + 1}. **${p.name}** (Seat #${p.seatNo}) — Pickup: *${p.pickup}* [${p.status.toUpperCase()}]`
        ).join('\n')

        return {
          text: `📋 **Current Passenger Roster (${assignedRide.passengers.length} Total)**:\n\n${pSummary}\n\n` +
            `Tap **Board** next to a student's name once they enter your shuttle.`,
          actions: [
            { label: 'Open Passenger Boarding Screen', to: '/driver/passengers', variant: 'emerald' },
          ],
          chips: ['Next pickup stop', 'Report a delay', 'Complete trip'],
        }
      }

      return {
        text: `You can view all booked students, verify boarding status, and see designated dropoffs on the **Passengers** page.`,
        actions: [
          { label: 'Passenger List', to: '/driver/passengers', variant: 'secondary' },
        ],
        chips: ['Next pickup stop', 'Driver Dashboard'],
      }
    }

    // Complete trip / End trip
    if (q.includes('complete') || q.includes('finish') || q.includes('end') || q.includes('drop')) {
      return {
        text: `🏁 **Completing a Trip Protocol**:\n\n` +
          `1. Ensure all boarded passengers have reached their destinations.\n` +
          `2. Once at the final dropoff, tap the green **"Complete Trip"** button in **Current Trip**.\n` +
          `3. The system will automatically mark all passengers as dropped off, release your vehicle to Available status, and update your completed trips log.`,
        actions: [
          { label: 'Go to Current Trip', to: '/driver/trip', variant: 'primary' },
        ],
        chips: ['Passenger roster', 'Next pickup stop', 'Trip history'],
      }
    }

    // Delays / Deviation / Issues
    if (q.includes('delay') || q.includes('traffic') || q.includes('deviat') || q.includes('issue') || q.includes('emergency') || q.includes('problem')) {
      return {
        text: `⚠️ **Handling Delays & Route Deviations**:\n\n` +
          `• The GPS engine tracks your vehicle along the approved corridor.\n` +
          `• If you encounter roadblocks or severe traffic, you can trigger **Recalculate Route** on the trip screen to get an alternate OSRM path.\n` +
          `• In case of breakdown or medical emergency, immediately notify Central Dispatch or call Security at \`+916305649558\`.`,
        actions: [
          { label: 'Current Trip Controls', to: '/driver/trip', variant: 'secondary' },
        ],
        chips: ['Next pickup stop', 'Complete trip', 'Driver Dashboard'],
      }
    }

    // Earnings / Performance / Profile
    if (q.includes('earning') || q.includes('trip') || q.includes('history') || q.includes('rating') || q.includes('profile')) {
      const completedCount = store.rides.filter((r) => r.driverId === driverId && r.status === 'completed').length
      return {
        text: `📈 **Driver Performance Summary**:\n\n` +
          `• **Completed Campus Trips**: ${completedCount || 12}\n` +
          `• **Service Rating**: 4.9 ★\n` +
          `• **Safety Adherence**: 100% On-Corridor\n\n` +
          `Review your detailed trip roster, student ratings, and earnings log in your Profile.`,
        actions: [
          { label: 'View Trip History', to: '/driver/profile?tab=history', variant: 'primary' },
        ],
        chips: ['Next pickup stop', 'Current passenger roster'],
      }
    }

    // Default driver response
    return {
      text: `Hello Captain! I'm here to support your route navigation, passenger check-ins, and safety adherence. How can I help with your current trip?`,
      chips: [
        '👥 Who is my next pickup?',
        '🗺️ Route & stop sequence',
        '📋 Passenger manifest summary',
        '🏁 How to complete this trip?',
      ],
    }
  }

  // -------------------------------------------------------------
  // 3. DISPATCHER / ADMIN PORTAL RESPONSES
  // -------------------------------------------------------------
  if (portal === 'admin') {
    const activeRides = store.rides.filter((r) => r.status === 'active' || r.status === 'boarding')
    const totalCapacity = activeRides.reduce((acc, r) => acc + (r.capacity || 0), 0)
    const totalBooked = activeRides.reduce((acc, r) => acc + (r.bookedSeats || 0), 0)
    const occupancyRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 76
    const alertRides = store.rides.filter((r) => r.hasDeviation || r.hasSosAlert)
    const activeAlerts = store.safetyEvents.filter((e) => !e.resolved)

    // Fleet status / Occupancy / Overview
    if (
      q.includes('fleet') ||
      q.includes('occupan') ||
      q.includes('status') ||
      q.includes('summary') ||
      q.includes('metrics') ||
      q.includes('overview')
    ) {
      return {
        text: `📊 **Autonomous Fleet Intelligence Overview**:\n\n` +
          `• **In-Transit Shuttles**: ${activeRides.length} active\n` +
          `• **Total Fleet Size**: ${store.vehicles.length} registered shuttles\n` +
          `• **Active Occupancy**: ${totalBooked} / ${totalCapacity} seats (**${occupancyRate}% utilization**)\n` +
          `• **Active Safety Flags**: ${alertRides.length} route deviations | ${activeAlerts.length} SOS alerts\n` +
          `• **Active Drivers**: ${store.drivers.length} personnel on duty`,
        actions: [
          { label: 'Open Live Mobility Map', to: '/admin/map', variant: 'primary' },
          { label: 'View Command Center', to: '/admin/dashboard', variant: 'secondary' },
        ],
        chips: ['Check deviations & alerts', 'List active shuttles', 'Autonomous ride matching'],
      }
    }

    // Deviations / Safety alerts / SOS
    if (
      q.includes('alert') ||
      q.includes('deviat') ||
      q.includes('sos') ||
      q.includes('incident') ||
      q.includes('emergency') ||
      q.includes('risk')
    ) {
      if (alertRides.length > 0 || activeAlerts.length > 0) {
        const flagList = alertRides.map(
          (r) => `• ⚠️ **${r.routeName}**: ${r.hasDeviation ? 'Corridor Deviation (>80m off-route)' : 'SOS Flag Triggered'}`
        ).join('\n')

        return {
          text: `🚨 **Attention: Active Safety Flags Detected**:\n\n${flagList}\n\n` +
            `Dispatch containment protocol: Inspect telematics on Live Map or resolve incidents in Safety Center.`,
          actions: [
            { label: 'View in Safety Center', to: '/admin/safety', variant: 'rose' },
            { label: 'Inspect on Live Map', to: '/admin/map', variant: 'primary' },
          ],
          chips: ['Fleet occupancy', 'Recalculate route', 'Vehicle telematics'],
        }
      }

      return {
        text: `✅ **Corridor Status: Nominal**\n\n` +
          `All active shuttles are strictly within authorized GPS corridors. Zero unresolved SOS alerts or perimeter violations detected.`,
        actions: [
          { label: 'Open Live Fleet Map', to: '/admin/map', variant: 'primary' },
        ],
        chips: ['Fleet occupancy & status', 'Autonomous ride matching', 'Vehicle telematics'],
      }
    }

    // Active shuttles list
    if (q.includes('shuttle') || q.includes('vehicle') || q.includes('active') || q.includes('car')) {
      const shuttleList = activeRides.length > 0
        ? activeRides.map(
            (r) => `• **${r.routeName}** (${r.status.toUpperCase()}) — ${r.bookedSeats}/${r.capacity} seats | Destination: *${r.destination}*`
          ).join('\n')
        : '• No shuttles currently in-transit. Waiting shuttles are primed at pickup bays.'

      return {
        text: `🚐 **In-Service Fleet Shuttles**:\n\n${shuttleList}`,
        actions: [
          { label: 'Live Telematics Map', to: '/admin/map', variant: 'primary' },
          { label: 'Vehicle Fleet Manager', to: '/admin/vehicles', variant: 'secondary' },
        ],
        chips: ['Fleet occupancy', 'Safety alerts', 'Reroute vehicle'],
      }
    }

    // Ride matching engine
    if (q.includes('match') || q.includes('request') || q.includes('algorithm') || q.includes('demand')) {
      return {
        text: `⚡ **Autonomous Ride Matching Engine**:\n\n` +
          `• Real-time multi-hop clustering active.\n` +
          `• Proximity radius: **500 meters** around designated campus bays.\n` +
          `• Departure synchronization window: **15 minutes**.\n` +
          `• Optimization goal: Maximize shuttle occupancy while keeping passenger detour < 8 minutes.`,
        actions: [
          { label: 'Ride Matching Simulator', to: '/admin/matching', variant: 'primary' },
          { label: 'Pending Ride Requests', to: '/admin/requests', variant: 'secondary' },
        ],
        chips: ['Fleet occupancy', 'Live mobility map', 'Safety alerts'],
      }
    }

    // Default admin response
    return {
      text: `Dispatcher, I am ready to process telematics inquiries, fleet utilization analytics, corridor deviation containment, and autonomous matching status.`,
      chips: [
        '📊 Fleet occupancy & status',
        '🚨 Any active deviations or alerts?',
        '🚐 List active in-service shuttles',
        '🗺️ Open Live Mobility Map',
      ],
    }
  }

  // -------------------------------------------------------------
  // 4. GUEST / GENERAL RESPONSES
  // -------------------------------------------------------------
  return {
    text: `CampusFlow provides intelligent, autonomous campus mobility linking student housing, academic halls, and key regional hubs like SRI INDU College.\n\n` +
      `Sign in with your campus credentials to access your personalized portal and live GPS tracking.`,
    actions: [
      { label: 'Sign In to Portal', to: '/auth/portal', variant: 'primary' },
    ],
    chips: [
      '🎓 How do I book a student ride?',
      '🚐 How does driver portal work?',
      '🛡️ Campus safety protocols',
    ],
  }
}
