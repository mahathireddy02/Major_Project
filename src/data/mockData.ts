import type {
  Student,
  Faculty,
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

// ─── Students (10 Institutional Students) ─────────────────────────────────────
export const STUDENTS: Student[] = [
  { id: 's1',  name: 'Demo Student', email: 'demostudent@gmail.com', studentId: '21IND0501', rollNumber: '21IND0501', collegeName: 'Sri Indu College of Engineering & Technology', department: 'Computer Science', year: 3, phone: '+91 98765 43210', avatar: 'DS', rating: 4.9, totalRides: 38, verified: true, role: 'student', gender: 'Male' },
  { id: 's2',  name: 'Arjun Rao',     email: 'arjun.rao@iith.ac.in', studentId: 'IITH2022015', rollNumber: 'EE22BTECH11015', collegeName: 'IIT Hyderabad', department: 'Electrical Engg', year: 2, phone: '+91 87654 32109', avatar: 'AR', rating: 4.7, totalRides: 22, verified: true, role: 'student', gender: 'Male' },
  { id: 's3',  name: 'Priya Sharma',  email: 'priya.sharma@nitw.ac.in', studentId: 'NITW2021034', rollNumber: 'ME21B034', collegeName: 'NIT Warangal', department: 'Mechanical Engg', year: 3, phone: '+91 76543 21098', avatar: 'PS', rating: 4.8, totalRides: 31, verified: true, role: 'student', gender: 'Female' },
  { id: 's4',  name: 'Rahul Varma',   email: 'rahul.varma@cbit.ac.in', studentId: 'CBIT2023007', rollNumber: '160123733007', collegeName: 'Chaitanya Bharathi Institute of Technology', department: 'Computer Science', year: 1, phone: '+91 65432 10987', avatar: 'RV', rating: 4.6, totalRides: 9,  verified: true, role: 'student', gender: 'Male' },
  { id: 's5',  name: 'Sneha Reddy',   email: 'sneha.reddy@osmania.ac.in', studentId: 'OU2022023', rollNumber: '100522737023', collegeName: 'Osmania University', department: 'Information Tech', year: 2, phone: '+91 54321 09876', avatar: 'SR', rating: 4.9, totalRides: 45, verified: true, role: 'student', gender: 'Female' },
  { id: 's6',  name: 'Karthik Naidu', email: 'karthik.naidu@jntuh.ac.in', studentId: 'JNTU2021009', rollNumber: '21011A0409', collegeName: 'JNTU Hyderabad', department: 'Electronics', year: 3, phone: '+91 43210 98765', avatar: 'KN', rating: 4.5, totalRides: 17, verified: true, role: 'student', gender: 'Male' },
  { id: 's7',  name: 'Ananya Patel',  email: 'ananya.patel@iiit.ac.in', studentId: 'IIIT2020044', rollNumber: '2020101044', collegeName: 'IIIT Hyderabad', department: 'AI & Data Science', year: 4, phone: '+91 32109 87654', avatar: 'AP', rating: 4.8, totalRides: 56, verified: true, role: 'student', gender: 'Female' },
  { id: 's8',  name: 'Rohit Kumar',   email: 'rohit.kumar@uohyd.ac.in', studentId: 'UOH2022003', rollNumber: '22MBBA03', collegeName: 'University of Hyderabad', department: 'Management', year: 2, phone: '+91 21098 76543', avatar: 'RK', rating: 4.3, totalRides: 12, verified: true, role: 'student', gender: 'Male' },
  { id: 's9',  name: 'Meera Singh',   email: 'meera.singh@bits-pilani.ac.in', studentId: 'BITS2021018', rollNumber: '2021A1PS0018H', collegeName: 'BITS Pilani Hyderabad', department: 'Biotechnology', year: 3, phone: '+91 10987 65432', avatar: 'MS', rating: 4.7, totalRides: 28, verified: true, role: 'student', gender: 'Female' },
  { id: 's10', name: 'Vivek Reddy',   email: 'vivek.reddy@campusflow.io', studentId: 'CF2022031', rollNumber: 'CF2022CE31', collegeName: 'CampusFlow Academy', department: 'Civil Engg', year: 2, phone: '+91 09876 54321', avatar: 'VR', rating: 4.6, totalRides: 19, verified: true, role: 'student', gender: 'Male' },
]

// ─── Faculty (5 Institutional Faculty Members) ────────────────────────────────
export const FACULTY: Faculty[] = [
  { id: 'f1', name: 'Demo Faculty', email: 'demofaculty@gmail.com', collegeId: 'FAC-2026-001', collegeName: 'Sri Indu College of Engineering & Technology', department: 'Computer Science & Engineering', phone: '+91 91234 56780', avatar: 'DF', rating: 5.0, totalRides: 64, isVerified: true, role: 'faculty', gender: 'Male' },
  { id: 'f2', name: 'Prof. Lakshmi Nair', email: 'prof.lakshmi.nair@iith.ac.in', collegeId: 'FAC-IITH-012', collegeName: 'IIT Hyderabad', department: 'Electrical Engineering', phone: '+91 82345 67891', avatar: 'LN', rating: 4.9, totalRides: 42, isVerified: true, role: 'faculty', gender: 'Female' },
  { id: 'f3', name: 'Dr. Venkat Rao', email: 'dr.venkat.rao@nitw.ac.in', collegeId: 'FAC-NITW-045', collegeName: 'NIT Warangal', department: 'Mechanical Engineering', phone: '+91 73456 78902', avatar: 'VR', rating: 4.8, totalRides: 37, isVerified: true, role: 'faculty', gender: 'Male' },
  { id: 'f4', name: 'Prof. Sunita Gupta', email: 'prof.sunita.gupta@cbit.ac.in', collegeId: 'FAC-CBIT-088', collegeName: 'Chaitanya Bharathi Institute of Technology', department: 'Physics & Nanotech', phone: '+91 64567 89013', avatar: 'SG', rating: 4.9, totalRides: 51, isVerified: true, role: 'faculty', gender: 'Female' },
  { id: 'f5', name: 'Dr. Anil Kumar', email: 'dr.anil.kumar@osmania.ac.in', collegeId: 'FAC-OU-007', collegeName: 'Osmania University', department: 'Dean of Sciences', phone: '+91 55678 90124', avatar: 'AK', rating: 4.7, totalRides: 29, isVerified: true, role: 'faculty', gender: 'Male' },
]

// ─── Drivers (Drivers with personal @gmail.com) ─────────────────────────────
export const DRIVERS: Driver[] = [
  { id: 'd1',  name: 'Demo Driver', email: 'demodriver@gmail.com', phone: '+91 99887 76655', avatar: 'DD', rating: 4.8, totalTrips: 312, verified: true, licenseNo: 'TS-09-2018-004521', role: 'driver', vehicleId: 'v1' },
  { id: 'sd1', name: 'Demo Student Driver', email: 'demostudentdriver@gmail.com', phone: '+91 98765 43299', avatar: 'SD', rating: 4.9, totalTrips: 45, verified: true, licenseNo: 'TS-09-2022-009876', role: 'driver', vehicleId: 'v-sd1' },
  { id: 'd2',  name: 'Suresh Babu',    email: 'suresh.babu.driver@gmail.com', phone: '+91 88776 65544', avatar: 'SB', rating: 4.6, totalTrips: 245, verified: true, licenseNo: 'TS-09-2019-005612', role: 'driver', vehicleId: 'v2' },
  { id: 'd3',  name: 'Ravi Kumar',     email: 'ravi.kumar.cabs@gmail.com', phone: '+91 77665 54433', avatar: 'RK', rating: 4.9, totalTrips: 428, verified: true, licenseNo: 'TS-09-2017-003489', role: 'driver', vehicleId: 'v3' },
  { id: 'd4',  name: 'Mahesh Reddy',   email: 'mahesh.reddy.trans@gmail.com', phone: '+91 66554 43322', avatar: 'MR', rating: 4.7, totalTrips: 189, verified: true, licenseNo: 'TS-09-2020-006734', role: 'driver', vehicleId: 'v4' },
  { id: 'd5',  name: 'Venkat Rao',     email: 'venkat.rao.shuttle@gmail.com', phone: '+91 55443 32211', avatar: 'VR', rating: 4.5, totalTrips: 156, verified: true, licenseNo: 'TS-09-2018-002345', role: 'driver', vehicleId: 'v5' },
  { id: 'd6',  name: 'Kiran Babu',     email: 'kiran.babu.mobility@gmail.com', phone: '+91 44332 21100', avatar: 'KB', rating: 4.8, totalTrips: 267, verified: true, licenseNo: 'TS-09-2019-007890', role: 'driver', vehicleId: 'v6' },
  { id: 'd7',  name: 'Satish Kumar',   email: 'satish.kumar.auto@gmail.com', phone: '+91 33221 10099', avatar: 'SK', rating: 4.6, totalTrips: 198, verified: true, licenseNo: 'TS-09-2021-001278', role: 'driver', vehicleId: 'v7' },
  { id: 'd8',  name: 'Prasad Naidu',   email: 'prasad.naidu.driver@gmail.com', phone: '+91 22110 09988', avatar: 'PN', rating: 4.4, totalTrips: 134, verified: true, licenseNo: 'TS-09-2018-009845', role: 'driver', vehicleId: 'v8' },
  { id: 'd9',  name: 'Gopal Krishna',  email: 'gopal.krishna.cabs@gmail.com', phone: '+91 91122 33445', avatar: 'GK', rating: 4.7, totalTrips: 210, verified: true, licenseNo: 'TS-09-2020-004412', role: 'driver', vehicleId: 'v9' },
  { id: 'd10', name: 'Anil Varma',     email: 'anil.varma.driver@gmail.com', phone: '+91 82233 44556', avatar: 'AV', rating: 4.8, totalTrips: 280, verified: true, licenseNo: 'TS-09-2017-008923', role: 'driver', vehicleId: 'v10' },
  { id: 'd11', name: 'Srinivas Reddy', email: 'srinivas.reddy.van@gmail.com', phone: '+91 73344 55667', avatar: 'SR', rating: 4.5, totalTrips: 172, verified: true, licenseNo: 'TS-09-2019-003319', role: 'driver', vehicleId: 'v11' },
  { id: 'd12', name: 'Mohammed Ali',  email: 'mohammed.ali.driver@gmail.com', phone: '+91 64455 66778', avatar: 'MA', rating: 4.9, totalTrips: 390, verified: true, licenseNo: 'TS-09-2016-006745', role: 'driver', vehicleId: 'v12' },
  { id: 'd13', name: 'Ramesh Yadav',   email: 'ramesh.yadav.auto@gmail.com', phone: '+91 55566 77889', avatar: 'RY', rating: 4.6, totalTrips: 165, verified: true, licenseNo: 'TS-09-2021-005531', role: 'driver', vehicleId: 'v13' },
  { id: 'd14', name: 'Manoj Kumar',    email: 'manoj.kumar.driver@gmail.com', phone: '+91 46677 88990', avatar: 'MK', rating: 4.7, totalTrips: 225, verified: true, licenseNo: 'TS-09-2018-007722', role: 'driver', vehicleId: 'v14' },
  { id: 'd15', name: 'Vijay Sharma',   email: 'vijay.sharma.cabs@gmail.com', phone: '+91 37788 99001', avatar: 'VS', rating: 4.8, totalTrips: 340, verified: true, licenseNo: 'TS-09-2019-008891', role: 'driver', vehicleId: 'v15' },
  { id: 'd16', name: 'Krishna Murthy', email: 'krishna.murthy.shuttle@gmail.com', phone: '+91 28899 00112', avatar: 'KM', rating: 4.5, totalTrips: 195, verified: true, licenseNo: 'TS-09-2017-002244', role: 'driver', vehicleId: 'v16' },
  { id: 'd17', name: 'Baskar Rao',     email: 'baskar.rao.mobility@gmail.com', phone: '+91 19900 11223', avatar: 'BR', rating: 4.6, totalTrips: 180, verified: true, licenseNo: 'TS-09-2020-001188', role: 'driver', vehicleId: 'v17' },
  { id: 'd18', name: 'Jagdish Chandra',email: 'jagdish.chandra.driver@gmail.com', phone: '+91 90011 22334', avatar: 'JC', rating: 4.4, totalTrips: 140, verified: true, licenseNo: 'TS-09-2018-006655', role: 'driver', vehicleId: 'v18' },
  { id: 'd19', name: 'Shankar Naik',   email: 'shankar.naik.van@gmail.com', phone: '+91 81122 33445', avatar: 'SN', rating: 4.8, totalTrips: 305, verified: true, licenseNo: 'TS-09-2016-009933', role: 'driver', vehicleId: 'v19' },
  { id: 'd20', name: 'Praveen Kumar',  email: 'praveen.kumar.driver@gmail.com', phone: '+91 72233 44556', avatar: 'PK', rating: 4.7, totalTrips: 260, verified: true, licenseNo: 'TS-09-2021-004477', role: 'driver', vehicleId: 'v20' },
]

// ─── Vehicles (20 Fleet Vehicles) ────────────────────────────────────────────
export const VEHICLES: Vehicle[] = [
  { id: 'v1',  name: 'Campus Shuttle Bus 01 (V1)', type: 'Campus Shuttle Bus', registration: 'TS 09 AB 1234', capacity: 12, driverId: 'd1',  color: '#0891B2', verified: true, rating: 4.8, totalTrips: 312 },
  { id: 'v2',  name: 'Campus Van 07',              type: 'Mini Van',            registration: 'TS 09 CD 5678', capacity: 6,  driverId: 'd2',  color: '#7C3AED', verified: true, rating: 4.6, totalTrips: 245 },
  { id: 'v3',  name: 'Campus Bus 03',              type: 'Mini Bus',            registration: 'TS 09 EF 9012', capacity: 12, driverId: 'd3',  color: '#059669', verified: true, rating: 4.9, totalTrips: 428 },
  { id: 'v4',  name: 'Campus Van 15',              type: 'Mini Van',            registration: 'TS 09 GH 3456', capacity: 6,  driverId: 'd4',  color: '#D97706', verified: true, rating: 4.7, totalTrips: 189 },
  { id: 'v5',  name: 'Campus Van 09',              type: 'Mini Van',            registration: 'TS 09 IJ 7890', capacity: 6,  driverId: 'd5',  color: '#DC2626', verified: true, rating: 4.5, totalTrips: 156 },
  { id: 'v6',  name: 'Campus Van 21',              type: 'Mini Van',            registration: 'TS 09 KL 1357', capacity: 6,  driverId: 'd6',  color: '#0891B2', verified: true, rating: 4.8, totalTrips: 267 },
  { id: 'v7',  name: 'Campus Auto 04',             type: 'Auto Rickshaw',       registration: 'TS 09 MN 2468', capacity: 3,  driverId: 'd7',  color: '#F59E0B', verified: true, rating: 4.6, totalTrips: 198 },
  { id: 'v8',  name: 'Campus Van 18',              type: 'Mini Van',            registration: 'TS 09 OP 3691', capacity: 6,  driverId: 'd8',  color: '#6366F1', verified: true, rating: 4.4, totalTrips: 134 },
  { id: 'v9',  name: 'Electric Shuttle 02',        type: 'Electric Shuttle',    registration: 'TS 09 QR 4820', capacity: 8,  driverId: 'd9',  color: '#10B981', verified: true, rating: 4.7, totalTrips: 210 },
  { id: 'v10', name: 'Campus Express Bus 05',      type: 'Campus Bus',          registration: 'TS 09 ST 5931', capacity: 16, driverId: 'd10', color: '#3B82F6', verified: true, rating: 4.8, totalTrips: 280 },
  { id: 'v11', name: 'Campus Van 11',              type: 'Mini Van',            registration: 'TS 09 UV 6042', capacity: 6,  driverId: 'd11', color: '#8B5CF6', verified: true, rating: 4.5, totalTrips: 172 },
  { id: 'v12', name: 'Campus Shuttle Bus 06',      type: 'Campus Shuttle Bus',  registration: 'TS 09 WX 7153', capacity: 12, driverId: 'd12', color: '#06B6D4', verified: true, rating: 4.9, totalTrips: 390 },
  { id: 'v13', name: 'Campus Auto 08',             type: 'Auto Rickshaw',       registration: 'TS 09 YZ 8264', capacity: 3,  driverId: 'd13', color: '#F59E0B', verified: true, rating: 4.6, totalTrips: 165 },
  { id: 'v14', name: 'Campus Van 25',              type: 'Campus Van',          registration: 'TS 09 AA 9375', capacity: 6,  driverId: 'd14', color: '#EC4899', verified: true, rating: 4.7, totalTrips: 225 },
  { id: 'v15', name: 'Electric Shuttle 09',        type: 'Electric Shuttle',    registration: 'TS 09 BB 1486', capacity: 8,  driverId: 'd15', color: '#14B8A6', verified: true, rating: 4.8, totalTrips: 340 },
  { id: 'v16', name: 'Campus Bus 14',              type: 'Campus Bus',          registration: 'TS 09 CC 2597', capacity: 14, driverId: 'd16', color: '#6366F1', verified: true, rating: 4.5, totalTrips: 195 },
  { id: 'v17', name: 'Campus Van 30',              type: 'Mini Van',            registration: 'TS 09 DD 3608', capacity: 6,  driverId: 'd17', color: '#F97316', verified: true, rating: 4.6, totalTrips: 180 },
  { id: 'v18', name: 'Campus Van 33',              type: 'Campus Van',          registration: 'TS 09 EE 4719', capacity: 6,  driverId: 'd18', color: '#84CC16', verified: true, rating: 4.4, totalTrips: 140 },
  { id: 'v19', name: 'Campus Shuttle Bus 08',      type: 'Campus Shuttle Bus',  registration: 'TS 09 FF 5820', capacity: 12, driverId: 'd19', color: '#0EA5E9', verified: true, rating: 4.8, totalTrips: 305 },
  { id: 'v20', name: 'Campus Auto 12',             type: 'Auto Rickshaw',       registration: 'TS 09 GG 6931', capacity: 3,  driverId: 'd20', color: '#EAB308', verified: true, rating: 4.7, totalTrips: 260 },
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
