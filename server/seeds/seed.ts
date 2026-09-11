import bcrypt from 'bcryptjs'
import { UserModel } from '../models/User.js'
import { VehicleModel } from '../models/Vehicle.js'
import { RideModel } from '../models/Ride.js'
import { BookingModel } from '../models/Booking.js'
import { SafetyEventModel } from '../models/SafetyEvent.js'
import { NotificationModel } from '../models/Notification.js'
import { connectDatabase } from '../config/database.js'

// 20 Students Seed Data
const STUDENTS_SEED = [
  { id: 's1', name: 'Uday Kiran', email: 'uday@campus.edu', studentId: 'CSE2021001', department: 'Computer Science', year: 3, phone: '+91 98765 43210', avatar: 'UK', rating: 4.9, totalRides: 38, isVerified: true, role: 'STUDENT' },
  { id: 's2', name: 'Arjun Rao', email: 'arjun@campus.edu', studentId: 'ECE2022015', department: 'Electronics', year: 2, phone: '+91 87654 32109', avatar: 'AR', rating: 4.7, totalRides: 22, isVerified: true, role: 'STUDENT' },
  { id: 's3', name: 'Priya Sharma', email: 'priya@campus.edu', studentId: 'ME2021034', department: 'Mechanical', year: 3, phone: '+91 76543 21098', avatar: 'PS', rating: 4.8, totalRides: 31, isVerified: true, role: 'STUDENT' },
  { id: 's4', name: 'Rahul Varma', email: 'rahul.v@campus.edu', studentId: 'CSE2023007', department: 'Computer Science', year: 1, phone: '+91 65432 10987', avatar: 'RV', rating: 4.6, totalRides: 9, isVerified: true, role: 'STUDENT' },
  { id: 's5', name: 'Sneha Reddy', email: 'sneha@campus.edu', studentId: 'IT2022023', department: 'Information Tech', year: 2, phone: '+91 54321 09876', avatar: 'SR', rating: 4.9, totalRides: 45, isVerified: true, role: 'STUDENT' },
  { id: 's6', name: 'Karthik Naidu', email: 'karthik@campus.edu', studentId: 'EEE2021009', department: 'Electrical', year: 3, phone: '+91 43210 98765', avatar: 'KN', rating: 4.5, totalRides: 17, isVerified: true, role: 'STUDENT' },
  { id: 's7', name: 'Ananya Patel', email: 'ananya@campus.edu', studentId: 'CSE2020044', department: 'Computer Science', year: 4, phone: '+91 32109 87654', avatar: 'AP', rating: 4.8, totalRides: 56, isVerified: true, role: 'STUDENT' },
  { id: 's8', name: 'Rohit Kumar', email: 'rohit@campus.edu', studentId: 'MBA2022003', department: 'Management', year: 2, phone: '+91 21098 76543', avatar: 'RK', rating: 4.3, totalRides: 12, isVerified: true, role: 'STUDENT' },
  { id: 's9', name: 'Meera Singh', email: 'meera@campus.edu', studentId: 'BT2021018', department: 'Biotechnology', year: 3, phone: '+91 10987 65432', avatar: 'MS', rating: 4.7, totalRides: 28, isVerified: true, role: 'STUDENT' },
  { id: 's10', name: 'Vivek Reddy', email: 'vivek@campus.edu', studentId: 'CE2022031', department: 'Civil Engg', year: 2, phone: '+91 09876 54321', avatar: 'VR', rating: 4.6, totalRides: 19, isVerified: true, role: 'STUDENT' },
  { id: 's11', name: 'Divya Nair', email: 'divya@campus.edu', studentId: 'CSE2023055', department: 'Computer Science', year: 1, phone: '+91 98761 23450', avatar: 'DN', rating: 4.4, totalRides: 6, isVerified: true, role: 'STUDENT' },
  { id: 's12', name: 'Aditya Menon', email: 'aditya@campus.edu', studentId: 'ECE2021042', department: 'Electronics', year: 3, phone: '+91 87652 34561', avatar: 'AM', rating: 4.8, totalRides: 33, isVerified: true, role: 'STUDENT' },
  { id: 's13', name: 'Lakshmi Iyer', email: 'lakshmi@campus.edu', studentId: 'ME2022011', department: 'Mechanical', year: 2, phone: '+91 76543 45672', avatar: 'LI', rating: 4.9, totalRides: 41, isVerified: true, role: 'STUDENT' },
  { id: 's14', name: 'Sanjay Gupta', email: 'sanjay@campus.edu', studentId: 'IT2021067', department: 'Information Tech', year: 3, phone: '+91 65434 56783', avatar: 'SG', rating: 4.5, totalRides: 24, isVerified: true, role: 'STUDENT' },
  { id: 's15', name: 'Pooja Das', email: 'pooja@campus.edu', studentId: 'CSE2020089', department: 'Computer Science', year: 4, phone: '+91 54325 67894', avatar: 'PD', rating: 4.7, totalRides: 52, isVerified: true, role: 'STUDENT' },
  { id: 's16', name: 'Nikhil Sharma', email: 'nikhil@campus.edu', studentId: 'EEE2022004', department: 'Electrical', year: 2, phone: '+91 43216 78905', avatar: 'NS', rating: 4.3, totalRides: 11, isVerified: true, role: 'STUDENT' },
  { id: 's17', name: 'Shreya Joshi', email: 'shreya@campus.edu', studentId: 'BT2021029', department: 'Biotechnology', year: 3, phone: '+91 32107 89016', avatar: 'SJ', rating: 4.8, totalRides: 37, isVerified: true, role: 'STUDENT' },
  { id: 's18', name: 'Akash Verma', email: 'akash@campus.edu', studentId: 'CE2023008', department: 'Civil Engg', year: 1, phone: '+91 21098 90127', avatar: 'AV', rating: 4.6, totalRides: 8, isVerified: true, role: 'STUDENT' },
  { id: 's19', name: 'Riya Pillai', email: 'riya@campus.edu', studentId: 'MBA2021015', department: 'Management', year: 3, phone: '+91 10989 01238', avatar: 'RP', rating: 4.7, totalRides: 29, isVerified: true, role: 'STUDENT' },
  { id: 's20', name: 'Vikram Nair', email: 'vikram@campus.edu', studentId: 'CSE2022077', department: 'Computer Science', year: 2, phone: '+91 09870 12349', avatar: 'VN', rating: 4.9, totalRides: 43, isVerified: true, role: 'STUDENT' },
]

// 8 Drivers Seed Data
const DRIVERS_SEED = [
  { id: 'd1', name: 'Rahul Kumar', email: 'rahul.driver@campus.edu', phone: '+91 99887 76655', avatar: 'RK', rating: 4.8, totalTrips: 312, isVerified: true, role: 'DRIVER' },
  { id: 'd2', name: 'Suresh Babu', email: 'suresh@campus.edu', phone: '+91 88776 65544', avatar: 'SB', rating: 4.6, totalTrips: 245, isVerified: true, role: 'DRIVER' },
  { id: 'd3', name: 'Ravi Kumar', email: 'ravi@campus.edu', phone: '+91 77665 54433', avatar: 'RK', rating: 4.9, totalTrips: 428, isVerified: true, role: 'DRIVER' },
  { id: 'd4', name: 'Mahesh Reddy', email: 'mahesh@campus.edu', phone: '+91 66554 43322', avatar: 'MR', rating: 4.7, totalTrips: 189, isVerified: true, role: 'DRIVER' },
  { id: 'd5', name: 'Venkat Rao', email: 'venkat@campus.edu', phone: '+91 55443 32211', avatar: 'VR', rating: 4.5, totalTrips: 156, isVerified: true, role: 'DRIVER' },
  { id: 'd6', name: 'Kiran Babu', email: 'kiran@campus.edu', phone: '+91 44332 21100', avatar: 'KB', rating: 4.8, totalTrips: 267, isVerified: true, role: 'DRIVER' },
  { id: 'd7', name: 'Satish Kumar', email: 'satish@campus.edu', phone: '+91 33221 10099', avatar: 'SK', rating: 4.6, totalTrips: 198, isVerified: true, role: 'DRIVER' },
  { id: 'd8', name: 'Prasad Naidu', email: 'prasad@campus.edu', phone: '+91 22110 09988', avatar: 'PN', rating: 4.4, totalTrips: 134, isVerified: true, role: 'DRIVER' },
  { id: 'admin1', name: 'Dispatch Control', email: 'admin@campus.edu', phone: '+91 90000 00000', avatar: 'DC', rating: 5.0, totalTrips: 0, isVerified: true, role: 'ADMIN' },
]

// 8 Vehicles Seed Data
const VEHICLES_SEED = [
  { id: 'v1', name: 'Campus Van 12', driverId: 'd1', vehicleType: 'Mini Van', registrationNumber: 'TS 09 AB 1234', capacity: 6, status: 'ON_TRIP', color: '#0891B2', rating: 4.8, totalTrips: 312 },
  { id: 'v2', name: 'Campus Van 07', driverId: 'd2', vehicleType: 'Mini Van', registrationNumber: 'TS 09 CD 5678', capacity: 6, status: 'AVAILABLE', color: '#7C3AED', rating: 4.6, totalTrips: 245 },
  { id: 'v3', name: 'Campus Bus 03', driverId: 'd3', vehicleType: 'Mini Bus', registrationNumber: 'TS 09 EF 9012', capacity: 12, status: 'ON_TRIP', color: '#059669', rating: 4.9, totalTrips: 428 },
  { id: 'v4', name: 'Campus Van 15', driverId: 'd4', vehicleType: 'Mini Van', registrationNumber: 'TS 09 GH 3456', capacity: 6, status: 'AVAILABLE', color: '#D97706', rating: 4.7, totalTrips: 189 },
  { id: 'v5', name: 'Campus Van 09', driverId: 'd5', vehicleType: 'Mini Van', registrationNumber: 'TS 09 IJ 7890', capacity: 6, status: 'ON_TRIP', color: '#DC2626', rating: 4.5, totalTrips: 156 },
  { id: 'v6', name: 'Campus Van 21', driverId: 'd6', vehicleType: 'Mini Van', registrationNumber: 'TS 09 KL 1357', capacity: 6, status: 'AVAILABLE', color: '#0891B2', rating: 4.8, totalTrips: 267 },
  { id: 'v7', name: 'Campus Auto 04', driverId: 'd7', vehicleType: 'Auto Rickshaw', registrationNumber: 'TS 09 MN 2468', capacity: 3, status: 'ON_TRIP', color: '#F59E0B', rating: 4.6, totalTrips: 198 },
  { id: 'v8', name: 'Campus Van 18', driverId: 'd8', vehicleType: 'Mini Van', registrationNumber: 'TS 09 OP 3691', capacity: 6, status: 'AVAILABLE', color: '#6366F1', rating: 4.4, totalTrips: 134 },
]

// 10 Rides Seed Data (including 5/6, 2/6, 6/6, 1/6, active, deviation)
const RIDES_SEED = [
  // Ride #101: Waiting
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
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '7:50 AM',
    estimatedArrival: '8:12 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 20,
    routeCoordinates: [
      [17.3616, 78.4747],
      [17.4156, 78.4357],
      [17.2063, 78.6015],
    ],
    currentLat: 17.3616,
    currentLng: 78.4747,
    distanceKm: 18.5,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #102: Available
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
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '8:15 AM',
    estimatedArrival: '8:38 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 25,
    routeCoordinates: [
      [17.4934, 78.3995],
      [17.4435, 78.3772],
      [17.2063, 78.6015],
    ],
    currentLat: 17.4934,
    currentLng: 78.3995,
    distanceKm: 24.2,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #103: Waiting
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
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '8:05 AM',
    estimatedArrival: '8:35 AM',
    capacity: 12,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 30,
    routeCoordinates: [
      [17.4334, 78.5016],
      [17.4319, 78.4073],
      [17.2063, 78.6015],
    ],
    currentLat: 17.4334,
    currentLng: 78.5016,
    distanceKm: 22.1,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #104: Waiting
  {
    id: 'ride-104',
    routeName: 'Campus Route #104',
    driverId: 'd4',
    vehicleId: 'v4',
    pickupPoints: [{ id: 'pp7', name: 'Banjara Hills', lat: 17.4156, lng: 78.4357, estimatedPickupTime: '8:00 AM' }],
    destination: 'SRI INDU College',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '8:00 AM',
    estimatedArrival: '8:20 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 22,
    routeCoordinates: [
      [17.4156, 78.4357],
      [17.2063, 78.6015],
    ],
    currentLat: 17.4156,
    currentLng: 78.4357,
    distanceKm: 19.2,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #105: Waiting
  {
    id: 'ride-105',
    routeName: 'Campus Route #105',
    driverId: 'd5',
    vehicleId: 'v5',
    pickupPoints: [{ id: 'pp8', name: 'HITEC City', lat: 17.4435, lng: 78.3772, estimatedPickupTime: '7:45 AM' }],
    destination: 'SRI INDU College',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '7:45 AM',
    estimatedArrival: '8:05 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 18,
    routeCoordinates: [
      [17.4435, 78.3772],
      [17.2063, 78.6015],
    ],
    currentLat: 17.4435,
    currentLng: 78.3772,
    distanceKm: 25.5,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #106: Waiting
  {
    id: 'ride-106',
    routeName: 'Campus Route #106',
    driverId: 'd6',
    vehicleId: 'v6',
    pickupPoints: [{ id: 'pp9', name: 'Kukatpally', lat: 17.4934, lng: 78.3995, estimatedPickupTime: '9:00 AM' }],
    destination: 'SRI INDU College',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '9:00 AM',
    estimatedArrival: '9:20 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 25,
    routeCoordinates: [
      [17.4934, 78.3995],
      [17.2063, 78.6015],
    ],
    currentLat: 17.4934,
    currentLng: 78.3995,
    distanceKm: 24.2,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #107: Waiting
  {
    id: 'ride-107',
    routeName: 'Campus Route #107',
    driverId: 'd7',
    vehicleId: 'v7',
    pickupPoints: [{ id: 'pp10', name: 'Charminar', lat: 17.3616, lng: 78.4747, estimatedPickupTime: '8:30 AM' }],
    destination: 'SRI INDU College',
    destinationLat: 17.2063,
    destinationLng: 78.6015,
    departureTime: '8:30 AM',
    estimatedArrival: '8:50 AM',
    capacity: 3,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 20,
    routeCoordinates: [
      [17.3616, 78.4747],
      [17.2063, 78.6015],
    ],
    currentLat: 17.3616,
    currentLng: 78.4747,
    distanceKm: 18.9,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'today',
  },

  // Ride #108: Scheduled tomorrow
  {
    id: 'ride-108',
    routeName: 'Campus Route #108',
    driverId: 'd8',
    vehicleId: 'v8',
    pickupPoints: [
      { id: 'pp11', name: 'Railway Station', lat: 17.4, lng: 78.485, estimatedPickupTime: '7:30 AM' },
      { id: 'pp12', name: 'Hostel A', lat: 17.398, lng: 78.479, estimatedPickupTime: '7:42 AM' },
    ],
    destination: 'Main Campus',
    destinationLat: 17.387,
    destinationLng: 78.486,
    departureTime: '7:30 AM',
    estimatedArrival: '8:00 AM',
    capacity: 6,
    bookedSeats: 0,
    passengers: [],
    status: 'waiting',
    fare: 35,
    routeCoordinates: [
      [17.4, 78.485],
      [17.399, 78.482],
      [17.398, 78.479],
      [17.393, 78.483],
      [17.387, 78.486],
    ],
    currentLat: 17.4,
    currentLng: 78.485,
    distanceKm: 5.8,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'tomorrow',
  },

  // Completed rides for history
  {
    id: 'ride-201',
    routeName: 'Campus Route #098',
    driverId: 'd1',
    vehicleId: 'v1',
    pickupPoints: [{ id: 'pp20', name: 'Railway Station', lat: 17.4, lng: 78.485, estimatedPickupTime: '7:00 AM' }],
    destination: 'Main Campus',
    destinationLat: 17.387,
    destinationLng: 78.486,
    departureTime: '7:00 AM',
    estimatedArrival: '7:22 AM',
    capacity: 6,
    bookedSeats: 6,
    passengers: [],
    status: 'completed',
    fare: 35,
    routeCoordinates: [[17.4, 78.485], [17.387, 78.486]],
    currentLat: 17.387,
    currentLng: 78.486,
    distanceKm: 5.1,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'yesterday',
  },
  {
    id: 'ride-202',
    routeName: 'Campus Route #095',
    driverId: 'd2',
    vehicleId: 'v2',
    pickupPoints: [{ id: 'pp21', name: 'Hostel A', lat: 17.398, lng: 78.479, estimatedPickupTime: '8:20 AM' }],
    destination: 'Library',
    destinationLat: 17.3865,
    destinationLng: 78.4855,
    departureTime: '8:20 AM',
    estimatedArrival: '8:40 AM',
    capacity: 6,
    bookedSeats: 4,
    passengers: [],
    status: 'completed',
    fare: 20,
    routeCoordinates: [[17.398, 78.479], [17.3865, 78.4855]],
    currentLat: 17.3865,
    currentLng: 78.4855,
    distanceKm: 3.5,
    hasDeviation: false,
    hasSosAlert: false,
    date: 'yesterday',
  },
]

export async function seedDatabase() {
  console.log('[Seed] Starting MongoDB database seeding...')
  await connectDatabase()

  // Clean collections
  await Promise.all([
    UserModel.deleteMany({}),
    VehicleModel.deleteMany({}),
    RideModel.deleteMany({}),
    BookingModel.deleteMany({}),
    SafetyEventModel.deleteMany({}),
    NotificationModel.deleteMany({}),
  ])

  // Insert Users with standard default password ('campus2026')
  const defaultPasswordHash = await bcrypt.hash('campus2026', 10)
  const seededUsers = [...STUDENTS_SEED, ...DRIVERS_SEED].map((u) => ({
    ...u,
    isVerified: true,
    verificationStatus: 'VERIFIED',
    passwordHash: defaultPasswordHash,
  }))
  await UserModel.insertMany(seededUsers)
  console.log(`[Seed] Inserted ${STUDENTS_SEED.length} students and ${DRIVERS_SEED.length} staff/drivers with verified password hashes.`)

  // Insert Vehicles
  await VehicleModel.insertMany(VEHICLES_SEED)
  console.log(`[Seed] Inserted ${VEHICLES_SEED.length} campus vehicles.`)

  // Insert Rides
  await RideModel.insertMany(RIDES_SEED)
  console.log(`[Seed] Inserted ${RIDES_SEED.length} rides across various lifecycle states.`)

  // Insert initial Bookings (starts empty until students book)
  const initialBookings: any[] = []
  await BookingModel.insertMany(initialBookings)
  console.log(`[Seed] Inserted ${initialBookings.length} initial bookings.`)

  // Insert Safety Event (Ride #105 historical deviation)
  await SafetyEventModel.create({
    id: 'se1',
    rideId: 'ride-105',
    vehicleId: 'v5',
    eventType: 'ROUTE_DEVIATION',
    severity: 'HIGH',
    lat: 17.3825,
    lng: 78.4715,
    message: 'Ride #105 deviated from planned route. Vehicle moved to Unplanned Road near Hostel Zone.',
    status: 'ACTIVE',
    resolved: false,
  })

  // Insert Notifications
  const initialNotifications = [
    { id: 'n1', userId: 's1', type: 'match', title: 'Smart Match Found', message: 'You were matched to Campus Route #102. Departure at 8:15 AM.', read: false, rideId: 'ride-102' },
    { id: 'n2', userId: 's1', type: 'arriving', title: 'Driver Arriving Soon', message: 'Rahul Kumar is 3 minutes away from Hostel A.', read: false, rideId: 'ride-102' },
    { id: 'n3', userId: 's1', type: 'safety', title: 'Route Deviation Detected', message: 'Ride #105 has moved away from the planned route. Our team is checking.', read: true, rideId: 'ride-105' },
    { id: 'n4', userId: 's1', type: 'system', title: 'Welcome to Campus Mobility', message: 'Your account is verified. Start sharing rides and save money!', read: true },
    { id: 'n5', userId: 's1', type: 'full', title: 'Ride Now Full', message: 'Campus Route #104 is now full. Your booking is confirmed — Seat #4.', read: true, rideId: 'ride-104' },
  ]
  await NotificationModel.insertMany(initialNotifications)

  console.log('[Seed] Database seeding finished successfully.')
}

// If invoked directly from command line
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Seeding error:', err)
      process.exit(1)
    })
}
