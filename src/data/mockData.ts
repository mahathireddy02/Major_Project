import type {
  Student,
  Driver,
  Vehicle,
  Ride,
  Booking,
  Notification,
  SafetyEvent,
  AdminUser,
} from '../types'

// ─── Campus Coordinates (approx. based on typical Indian university campus) ───
export const CAMPUS_CENTER: [number, number] = [17.385, 78.486] // Hyderabad coords

// ─── Locations ───────────────────────────────────────────────────────────────
export const LOCATIONS: Record<string, { name: string; lat: number; lng: number }> = {
  'Hostel A':       { name: 'Hostel A',       lat: 17.3980, lng: 78.4790 },
  'Hostel B':       { name: 'Hostel B',       lat: 17.3960, lng: 78.4810 },
  'Hostel C':       { name: 'Hostel C',       lat: 17.3950, lng: 78.4840 },
  'PG Zone':        { name: 'PG Zone',        lat: 17.3940, lng: 78.4760 },
  'Railway Station':{ name: 'Railway Station', lat: 17.4000, lng: 78.4850 },
  'Metro Station':  { name: 'Metro Station',  lat: 17.3970, lng: 78.4900 },
  'Main Gate':      { name: 'Main Gate',      lat: 17.3920, lng: 78.4820 },
  'Main Campus':    { name: 'Main Campus',    lat: 17.3870, lng: 78.4860 },
  'Engineering Block': { name: 'Engineering Block', lat: 17.3860, lng: 78.4870 },
  'Library':        { name: 'Library',        lat: 17.3865, lng: 78.4855 },
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const STUDENTS: Student[] = [
  { id: 's1',  name: 'Uday Kiran',    studentId: 'CSE2021001', department: 'Computer Science', year: 3, phone: '+91 98765 43210', avatar: 'UK', rating: 4.9, totalRides: 38, verified: true, role: 'student' },
  { id: 's2',  name: 'Arjun Rao',     studentId: 'ECE2022015', department: 'Electronics',      year: 2, phone: '+91 87654 32109', avatar: 'AR', rating: 4.7, totalRides: 22, verified: true, role: 'student' },
  { id: 's3',  name: 'Priya Sharma',  studentId: 'ME2021034',  department: 'Mechanical',       year: 3, phone: '+91 76543 21098', avatar: 'PS', rating: 4.8, totalRides: 31, verified: true, role: 'student' },
  { id: 's4',  name: 'Rahul Varma',   studentId: 'CSE2023007', department: 'Computer Science', year: 1, phone: '+91 65432 10987', avatar: 'RV', rating: 4.6, totalRides: 9,  verified: true, role: 'student' },
  { id: 's5',  name: 'Sneha Reddy',   studentId: 'IT2022023',  department: 'Information Tech', year: 2, phone: '+91 54321 09876', avatar: 'SR', rating: 4.9, totalRides: 45, verified: true, role: 'student' },
  { id: 's6',  name: 'Karthik Naidu', studentId: 'EEE2021009', department: 'Electrical',       year: 3, phone: '+91 43210 98765', avatar: 'KN', rating: 4.5, totalRides: 17, verified: true, role: 'student' },
  { id: 's7',  name: 'Ananya Patel',  studentId: 'CSE2020044', department: 'Computer Science', year: 4, phone: '+91 32109 87654', avatar: 'AP', rating: 4.8, totalRides: 56, verified: true, role: 'student' },
  { id: 's8',  name: 'Rohit Kumar',   studentId: 'MBA2022003', department: 'Management',       year: 2, phone: '+91 21098 76543', avatar: 'RK', rating: 4.3, totalRides: 12, verified: true, role: 'student' },
  { id: 's9',  name: 'Meera Singh',   studentId: 'BT2021018',  department: 'Biotechnology',    year: 3, phone: '+91 10987 65432', avatar: 'MS', rating: 4.7, totalRides: 28, verified: true, role: 'student' },
  { id: 's10', name: 'Vivek Reddy',   studentId: 'CE2022031',  department: 'Civil Engg',       year: 2, phone: '+91 09876 54321', avatar: 'VR', rating: 4.6, totalRides: 19, verified: true, role: 'student' },
  { id: 's11', name: 'Divya Nair',    studentId: 'CSE2023055', department: 'Computer Science', year: 1, phone: '+91 98761 23450', avatar: 'DN', rating: 4.4, totalRides: 6,  verified: true, role: 'student' },
  { id: 's12', name: 'Aditya Menon',  studentId: 'ECE2021042', department: 'Electronics',      year: 3, phone: '+91 87652 34561', avatar: 'AM', rating: 4.8, totalRides: 33, verified: true, role: 'student' },
  { id: 's13', name: 'Lakshmi Iyer',  studentId: 'ME2022011',  department: 'Mechanical',       year: 2, phone: '+91 76543 45672', avatar: 'LI', rating: 4.9, totalRides: 41, verified: true, role: 'student' },
  { id: 's14', name: 'Sanjay Gupta',  studentId: 'IT2021067',  department: 'Information Tech', year: 3, phone: '+91 65434 56783', avatar: 'SG', rating: 4.5, totalRides: 24, verified: true, role: 'student' },
  { id: 's15', name: 'Pooja Das',     studentId: 'CSE2020089', department: 'Computer Science', year: 4, phone: '+91 54325 67894', avatar: 'PD', rating: 4.7, totalRides: 52, verified: true, role: 'student' },
  { id: 's16', name: 'Nikhil Sharma', studentId: 'EEE2022004', department: 'Electrical',       year: 2, phone: '+91 43216 78905', avatar: 'NS', rating: 4.3, totalRides: 11, verified: true, role: 'student' },
  { id: 's17', name: 'Shreya Joshi',  studentId: 'BT2021029',  department: 'Biotechnology',    year: 3, phone: '+91 32107 89016', avatar: 'SJ', rating: 4.8, totalRides: 37, verified: true, role: 'student' },
  { id: 's18', name: 'Akash Verma',   studentId: 'CE2023008',  department: 'Civil Engg',       year: 1, phone: '+91 21098 90127', avatar: 'AV', rating: 4.6, totalRides: 8,  verified: true, role: 'student' },
  { id: 's19', name: 'Riya Pillai',   studentId: 'MBA2021015', department: 'Management',       year: 3, phone: '+91 10989 01238', avatar: 'RP', rating: 4.7, totalRides: 29, verified: true, role: 'student' },
  { id: 's20', name: 'Vikram Nair',   studentId: 'CSE2022077', department: 'Computer Science', year: 2, phone: '+91 09870 12349', avatar: 'VN', rating: 4.9, totalRides: 43, verified: true, role: 'student' },
]

// ─── Drivers ──────────────────────────────────────────────────────────────────
export const DRIVERS: Driver[] = [
  { id: 'd1', name: 'Rahul Kumar',    phone: '+91 99887 76655', avatar: 'RK', rating: 4.8, totalTrips: 312, verified: true, licenseNo: 'TS09 2019 0045123', role: 'driver', vehicleId: 'v1' },
  { id: 'd2', name: 'Suresh Babu',    phone: '+91 88776 65544', avatar: 'SB', rating: 4.6, totalTrips: 245, verified: true, licenseNo: 'TS09 2018 0038211', role: 'driver', vehicleId: 'v2' },
  { id: 'd3', name: 'Ravi Kumar',     phone: '+91 77665 54433', avatar: 'RK', rating: 4.9, totalTrips: 428, verified: true, licenseNo: 'TS09 2017 0029874', role: 'driver', vehicleId: 'v3' },
  { id: 'd4', name: 'Mahesh Reddy',   phone: '+91 66554 43322', avatar: 'MR', rating: 4.7, totalTrips: 189, verified: true, licenseNo: 'TS09 2020 0051234', role: 'driver', vehicleId: 'v4' },
  { id: 'd5', name: 'Venkat Rao',     phone: '+91 55443 32211', avatar: 'VR', rating: 4.5, totalTrips: 156, verified: true, licenseNo: 'TS09 2019 0047832', role: 'driver', vehicleId: 'v5' },
  { id: 'd6', name: 'Kiran Babu',     phone: '+91 44332 21100', avatar: 'KB', rating: 4.8, totalTrips: 267, verified: true, licenseNo: 'TS09 2018 0033491', role: 'driver', vehicleId: 'v6' },
  { id: 'd7', name: 'Satish Kumar',   phone: '+91 33221 10099', avatar: 'SK', rating: 4.6, totalTrips: 198, verified: true, licenseNo: 'TS09 2020 0056789', role: 'driver', vehicleId: 'v7' },
  { id: 'd8', name: 'Prasad Naidu',   phone: '+91 22110 09988', avatar: 'PN', rating: 4.4, totalTrips: 134, verified: true, licenseNo: 'TS09 2021 0062341', role: 'driver', vehicleId: 'v8' },
]

// ─── Vehicles ────────────────────────────────────────────────────────────────
export const VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'Campus Van 12', type: 'Mini Van',      registration: 'TS 09 AB 1234', capacity: 6, driverId: 'd1', color: '#0891B2', verified: true, rating: 4.8, totalTrips: 312 },
  { id: 'v2', name: 'Campus Van 07', type: 'Mini Van',      registration: 'TS 09 CD 5678', capacity: 6, driverId: 'd2', color: '#7C3AED', verified: true, rating: 4.6, totalTrips: 245 },
  { id: 'v3', name: 'Campus Bus 03', type: 'Mini Bus',      registration: 'TS 09 EF 9012', capacity: 12, driverId: 'd3', color: '#059669', verified: true, rating: 4.9, totalTrips: 428 },
  { id: 'v4', name: 'Campus Van 15', type: 'Mini Van',      registration: 'TS 09 GH 3456', capacity: 6, driverId: 'd4', color: '#D97706', verified: true, rating: 4.7, totalTrips: 189 },
  { id: 'v5', name: 'Campus Van 09', type: 'Mini Van',      registration: 'TS 09 IJ 7890', capacity: 6, driverId: 'd5', color: '#DC2626', verified: true, rating: 4.5, totalTrips: 156 },
  { id: 'v6', name: 'Campus Van 21', type: 'Mini Van',      registration: 'TS 09 KL 1357', capacity: 6, driverId: 'd6', color: '#0891B2', verified: true, rating: 4.8, totalTrips: 267 },
  { id: 'v7', name: 'Campus Auto 04',type: 'Auto Rickshaw', registration: 'TS 09 MN 2468', capacity: 3, driverId: 'd7', color: '#F59E0B', verified: true, rating: 4.6, totalTrips: 198 },
  { id: 'v8', name: 'Campus Van 18', type: 'Mini Van',      registration: 'TS 09 OP 3691', capacity: 6, driverId: 'd8', color: '#6366F1', verified: true, rating: 4.4, totalTrips: 134 },
]

// ─── Rides ────────────────────────────────────────────────────────────────────
export const INITIAL_RIDES: Ride[] = [
  // Ride #101 — Waiting, 2/6
  // Ride #101 — Waiting
  {
    id: 'ride-101',
    routeName: 'Campus Route #101',
    driverId: 'd2',
    vehicleId: 'v2',
    pickupPoints: [
      { id: 'pp1', name: 'Charminar', lat: 17.3616, lng: 78.4747, estimatedPickupTime: '7:50 AM' },
      { id: 'pp2', name: 'Banjara Hills', lat: 17.4156, lng: 78.4357, estimatedPickupTime: '7:58 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '7:50 AM',
    estimatedArrival: '8:12 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 20,
    routeCoordinates: [[17.3616,78.4747],[17.4156,78.4357],[17.2063,78.6015]],
    currentLat: 17.3616, currentLng: 78.4747,
    distanceKm: 18.5,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #102 — Waiting
  {
    id: 'ride-102',
    routeName: 'Campus Route #102',
    driverId: 'd1',
    vehicleId: 'v1',
    pickupPoints: [
      { id: 'pp3', name: 'Kukatpally', lat: 17.4934, lng: 78.3995, estimatedPickupTime: '8:15 AM' },
      { id: 'pp4', name: 'HITEC City', lat: 17.4435, lng: 78.3772, estimatedPickupTime: '8:22 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '8:15 AM',
    estimatedArrival: '8:38 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 25,
    routeCoordinates: [[17.4934,78.3995],[17.4435,78.3772],[17.2063,78.6015]],
    currentLat: 17.4934, currentLng: 78.3995,
    distanceKm: 24.2,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #103 — Waiting
  {
    id: 'ride-103',
    routeName: 'Campus Route #103',
    driverId: 'd3',
    vehicleId: 'v3',
    pickupPoints: [
      { id: 'pp5', name: 'Secunderabad Junction', lat: 17.4334, lng: 78.5016, estimatedPickupTime: '8:05 AM' },
      { id: 'pp6', name: 'Jubilee Hills', lat: 17.4319, lng: 78.4073, estimatedPickupTime: '8:15 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '8:05 AM',
    estimatedArrival: '8:35 AM',
    capacity: 12, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 30,
    routeCoordinates: [[17.4334,78.5016],[17.4319,78.4073],[17.2063,78.6015]],
    currentLat: 17.4334, currentLng: 78.5016,
    distanceKm: 22.1,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #104 — Waiting
  {
    id: 'ride-104',
    routeName: 'Campus Route #104',
    driverId: 'd4',
    vehicleId: 'v4',
    pickupPoints: [
      { id: 'pp7', name: 'Banjara Hills', lat: 17.4156, lng: 78.4357, estimatedPickupTime: '8:00 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '8:00 AM',
    estimatedArrival: '8:20 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 22,
    routeCoordinates: [[17.4156,78.4357],[17.2063,78.6015]],
    currentLat: 17.4156, currentLng: 78.4357,
    distanceKm: 19.2,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #105 — Waiting
  {
    id: 'ride-105',
    routeName: 'Campus Route #105',
    driverId: 'd5',
    vehicleId: 'v5',
    pickupPoints: [
      { id: 'pp8', name: 'HITEC City', lat: 17.4435, lng: 78.3772, estimatedPickupTime: '7:45 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '7:45 AM',
    estimatedArrival: '8:05 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 18,
    routeCoordinates: [[17.4435,78.3772],[17.2063,78.6015]],
    currentLat: 17.4435, currentLng: 78.3772,
    distanceKm: 25.5,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #106 — Waiting
  {
    id: 'ride-106',
    routeName: 'Campus Route #106',
    driverId: 'd6',
    vehicleId: 'v6',
    pickupPoints: [
      { id: 'pp9', name: 'Kukatpally', lat: 17.4934, lng: 78.3995, estimatedPickupTime: '9:00 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '9:00 AM',
    estimatedArrival: '9:20 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 25,
    routeCoordinates: [[17.4934,78.3995],[17.2063,78.6015]],
    currentLat: 17.4934, currentLng: 78.3995,
    distanceKm: 24.2,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #107 — Waiting
  {
    id: 'ride-107',
    routeName: 'Campus Route #107',
    driverId: 'd7',
    vehicleId: 'v7',
    pickupPoints: [
      { id: 'pp10', name: 'Charminar', lat: 17.3616, lng: 78.4747, estimatedPickupTime: '8:30 AM' },
    ],
    destination: 'SRI INDU College',
    destinationLat: 17.2063, destinationLng: 78.6015,
    departureTime: '8:30 AM',
    estimatedArrival: '8:50 AM',
    capacity: 3, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 20,
    routeCoordinates: [[17.3616,78.4747],[17.2063,78.6015]],
    currentLat: 17.3616, currentLng: 78.4747,
    distanceKm: 18.9,
    hasDeviation: false, hasSosAlert: false,
    date: 'today',
  },

  // Ride #108 — Scheduled for tomorrow
  {
    id: 'ride-108',
    routeName: 'Campus Route #108',
    driverId: 'd8',
    vehicleId: 'v8',
    pickupPoints: [
      { id: 'pp11', name: 'Railway Station', lat: 17.4000, lng: 78.4850, estimatedPickupTime: '7:30 AM' },
      { id: 'pp12', name: 'Hostel A', lat: 17.3980, lng: 78.4790, estimatedPickupTime: '7:42 AM' },
    ],
    destination: 'Main Campus',
    destinationLat: 17.3870, destinationLng: 78.4860,
    departureTime: '7:30 AM',
    estimatedArrival: '8:00 AM',
    capacity: 6, bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 35,
    routeCoordinates: [[17.4000,78.4850],[17.3990,78.4820],[17.3980,78.4790],[17.3930,78.4830],[17.3870,78.4860]],
    currentLat: 17.4000, currentLng: 78.4850,
    distanceKm: 5.8,
    hasDeviation: false, hasSosAlert: false,
    date: 'tomorrow',
  },

  // Completed ride
  {
    id: 'ride-201',
    routeName: 'Campus Route #098',
    driverId: 'd1',
    vehicleId: 'v1',
    pickupPoints: [
      { id: 'pp20', name: 'Railway Station', lat: 17.4000, lng: 78.4850, estimatedPickupTime: '7:00 AM' },
    ],
    destination: 'Main Campus',
    destinationLat: 17.3870, destinationLng: 78.4860,
    departureTime: '7:00 AM',
    estimatedArrival: '7:22 AM',
    capacity: 6, bookedSeats: 6,
    passengers: [],
    status: 'completed',
    fare: 35,
    routeCoordinates: [[17.4000,78.4850],[17.3870,78.4860]],
    currentLat: 17.3870, currentLng: 78.4860,
    distanceKm: 5.1,
    hasDeviation: false, hasSosAlert: false,
    date: 'yesterday',
  },
  {
    id: 'ride-202',
    routeName: 'Campus Route #095',
    driverId: 'd2',
    vehicleId: 'v2',
    pickupPoints: [
      { id: 'pp21', name: 'Hostel A', lat: 17.3980, lng: 78.4790, estimatedPickupTime: '8:20 AM' },
    ],
    destination: 'Library',
    destinationLat: 17.3865, destinationLng: 78.4855,
    departureTime: '8:20 AM',
    estimatedArrival: '8:40 AM',
    capacity: 6, bookedSeats: 4,
    passengers: [],
    status: 'completed',
    fare: 20,
    routeCoordinates: [[17.3980,78.4790],[17.3865,78.4855]],
    currentLat: 17.3865, currentLng: 78.4855,
    distanceKm: 3.5,
    hasDeviation: false, hasSosAlert: false,
    date: 'yesterday',
  },
]

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const INITIAL_BOOKINGS: Booking[] = []

// ─── Notifications ────────────────────────────────────────────────────────────
export const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'n4',  studentId: 's1', type: 'system',   title: 'Welcome to Campus Mobility', message: 'Your account is verified. Start sharing rides and save money!', read: true, createdAt: new Date().toISOString() },
]

// ─── Safety Events ────────────────────────────────────────────────────────────
export const INITIAL_SAFETY_EVENTS: SafetyEvent[] = [
  { id: 'se1', rideId: 'ride-105', type: 'deviation', message: 'Ride #105 deviated from planned route. Vehicle moved to Unplanned Road near Hostel Zone.', createdAt: '2026-09-09T07:52:00', resolved: false },
]

// ─── Admin User ────────────────────────────────────────────────────────────────
export const ADMIN_USER: AdminUser = {
  id: 'admin1',
  name: 'Dispatch Control',
  role: 'admin',
  avatar: 'DC',
}

// ─── Analytics Data ───────────────────────────────────────────────────────────
export const ANALYTICS = {
  totalRequests: 132,
  sharedRides: 38,
  vehiclesUsed: 22,
  vehicleReduction: 31,
  avgOccupancy: 78,
  estimatedSavings: 18420,
  totalStudents: 428,
  demandByHour: [
    { time: '6:30', requests: 8 },
    { time: '7:00', requests: 18 },
    { time: '7:30', requests: 35 },
    { time: '8:00', requests: 62 },
    { time: '8:30', requests: 48 },
    { time: '9:00', requests: 28 },
    { time: '9:30', requests: 14 },
    { time: '10:00', requests: 9 },
    { time: '12:30', requests: 22 },
    { time: '1:00', requests: 38 },
    { time: '1:30', requests: 44 },
    { time: '5:00', requests: 52 },
    { time: '5:30', requests: 67 },
    { time: '6:00', requests: 35 },
    { time: '6:30', requests: 18 },
  ],
  topPickupZones: [
    { zone: 'Hostel A',        count: 42, pct: 100 },
    { zone: 'Hostel B',        count: 38, pct: 90 },
    { zone: 'Railway Station', count: 29, pct: 69 },
    { zone: 'PG Zone',         count: 24, pct: 57 },
    { zone: 'Metro Station',   count: 18, pct: 43 },
    { zone: 'Main Gate',       count: 12, pct: 29 },
  ],
  occupancyTrend: [
    { day: 'Mon', pct: 72 },
    { day: 'Tue', pct: 76 },
    { day: 'Wed', pct: 81 },
    { day: 'Thu', pct: 74 },
    { day: 'Fri', pct: 83 },
    { day: 'Sat', pct: 45 },
    { day: 'Sun', pct: 32 },
  ],
}
