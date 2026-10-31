import {
  TechnicianProfile,
  Booking,
  BookingPrivateDetails,
  CoinTransaction,
  CustomerReview,
  NotificationItem,
} from './manaRules';

/**
 * ISOLATED TEST FIXTURES ONLY.
 * Do NOT import this module in production runtime components (App.tsx, CustomerView, TechnicianView, AdminView).
 * Preserved separately for unit tests and architecture verification.
 */

export const DEMO_TECHNICIANS: TechnicianProfile[] = [
  {
    uid: 'demo_tech_ramesh',
    name: 'K. Ramesh Babu',
    phone: '9848234501',
    skills: ['electrician', 'ac_repair', 'appliance'],
    area: 'Bapatla - Railpet',
    experienceYears: 8,
    bio: 'ITI Certified Electrician & AC Specialist serving Bapatla Town and Chirala Road for 8+ years.',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 3,
    totalEarnings: 1450,
    completedJobs: 4,
    ratingAvg: 4.9,
    ratingCount: 4,
    createdAt: '2026-10-20T09:00:00Z',
    updatedAt: '2026-10-28T09:00:00Z',
  },
  {
    uid: 'demo_tech_srinivas',
    name: 'M. Srinivas Rao',
    phone: '9440198234',
    skills: ['plumber', 'water_purifier'],
    area: 'Bapatla - Suryalanka Road',
    experienceYears: 6,
    bio: 'Expert in bathroom pipeline repairs, overhead tank fittings, and RO water purifier filter servicing.',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 2,
    totalEarnings: 980,
    completedJobs: 3,
    ratingAvg: 4.7,
    ratingCount: 3,
    createdAt: '2026-10-21T10:30:00Z',
    updatedAt: '2026-10-28T11:00:00Z',
  },
  {
    uid: 'demo_tech_venkat',
    name: 'P. VenkataSubbaiah',
    phone: '9989123490',
    skills: ['carpenter', 'painter'],
    area: 'Bapatla - GBC Road',
    experienceYears: 11,
    bio: 'Teak wood door repairs, modular kitchen hinges, cupboard locks, and residential wall painting.',
    approvalStatus: 'PENDING',
    isAvailable: false,
    coinBalance: 0,
    totalEarnings: 0,
    completedJobs: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: '2026-10-29T07:15:00Z',
    updatedAt: '2026-10-29T07:15:00Z',
  },
];

export const DEMO_BOOKINGS: Booking[] = [
  {
    id: 'bk_bapatla_1001',
    customerId: 'demo_cust_padma',
    customerName: 'Padmavathi Devi',
    serviceId: 'electrician',
    serviceNameEn: 'Electrician',
    serviceNameTe: 'ఎలక్ట్రీషియన్',
    generalArea: 'Bapatla - Railpet',
    problemDescription: 'Bedroom ceiling fan regulator burned out and main hall tube light flickering.',
    preferredDate: '2026-10-30',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    photoNote: 'Switchboard photo attached (2-module Anchor switch)',
    status: 'PENDING',
    technicianId: '',
    technicianName: '',
    technicianPhone: '',
    labourCharges: 0,
    rated: false,
    createdAt: '2026-10-30T06:30:00Z',
    updatedAt: '2026-10-30T06:30:00Z',
  },
];

export const DEMO_PRIVATE_DETAILS: Record<string, BookingPrivateDetails> = {
  bk_bapatla_1001: {
    bookingId: 'bk_bapatla_1001',
    customerId: 'demo_cust_padma',
    customerPhone: '9849077665',
    fullAddress: 'D.No 4-12/A, 2nd Cross Road, Railpet, Bapatla',
    landmark: 'Near Railway Station East Booking Office',
    villageOrWard: 'Railpet Ward 8',
  },
};

export const DEMO_COIN_TRANSACTIONS: CoinTransaction[] = [
  {
    id: 'ctx_101',
    technicianId: 'demo_tech_ramesh',
    technicianName: 'K. Ramesh Babu',
    delta: 3,
    reason: 'INITIAL_APPROVAL_TRIAL_COINS',
    bookingId: '',
    adminId: 'admin_bapatla',
    createdAt: '2026-10-20T09:05:00Z',
  },
];

export const DEMO_REVIEWS: CustomerReview[] = [
  {
    id: 'rev_101',
    bookingId: 'bk_bapatla_0995',
    customerId: 'demo_cust_padma',
    customerName: 'Padmavathi Devi',
    technicianId: 'demo_tech_ramesh',
    rating: 5,
    comment: 'Came on time to Railpet and fixed the inverter wiring cleanly. Very polite.',
    createdAt: '2026-10-27T14:20:00Z',
  },
];

export const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_1',
    recipientId: 'ALL_TECHNICIANS',
    titleEn: 'New Electrician Job in Railpet',
    titleTe: 'రైల్‌పేటలో కొత్త ఎలక్ట్రీషియన్ పని',
    messageEn: 'Padmavathi Devi requested an Electrician in Bapatla - Railpet.',
    messageTe: 'బాపట్ల - రైల్‌పేటలో పద్మావతి దేవి ఎలక్ట్రీషియన్ సేవ కోరారు.',
    type: 'NEW_BOOKING',
    bookingId: 'bk_bapatla_1001',
    read: false,
    createdAt: '2026-10-30T06:30:00Z',
  },
];
