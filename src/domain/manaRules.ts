export type UserRole = 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type BookingStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'WORK_COMPLETED'
  | 'CONFIRMED'
  | 'CANCELLED';

export type AppLanguage = 'en' | 'te';
export type Language = AppLanguage;

export const EXPECTED_PROJECT_ID = 'coastal-adapter-5thv3';
export const EXPECTED_NAMED_DATABASE_ID =
  'ai-studio-manaexperts-9ab98bbd-c1ef-4605-83b4-310be7069b2b';

export const INITIAL_TRIAL_COINS = 3;
export const ACCEPT_BOOKING_COIN_COST = 1;
export const MAX_VALID_LABOUR_CHARGE = 500000;
/**
 * Intended owner account email used ONLY for server-verified initial `/admins/{uid}` bootstrap
 * when authenticated with a verified Firebase Auth token. Never used as an authentication
 * or client-side authorization substitute.
 */
export const PROVISIONED_OWNER_BOOTSTRAP_EMAIL = 'sumanth.bandela11@gmail.com';
export const OWNER_ADMIN_EMAIL = PROVISIONED_OWNER_BOOTSTRAP_EMAIL;

export const VALID_BOOKING_TIME_SLOTS = [
  '08:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 03:00 PM',
  '03:00 PM - 06:00 PM',
  '06:00 PM - 08:00 PM (Emergency)',
] as const;

export const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_RAW_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PROTECTED_PHOTO_DATA_URL_LENGTH = 700000;

export interface UserProfile {
  uid: string;
  name: string;
  email?: string;
  role: UserRole;
  area: string;
  language: AppLanguage;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPrivateContact {
  uid: string;
  email: string;
  phone: string;
  defaultAddress: string;
  updatedAt: string;
}

export interface TechnicianProfile {
  uid: string;
  name: string;
  phone: string;
  skills: string[]; // service category IDs
  area: string;
  experienceYears: number;
  bio: string;
  approvalStatus: ApprovalStatus;
  isAvailable: boolean;
  trialCoinsGranted?: boolean; // Durable marker: 3 trial coins granted at most once ever
  coinBalance: number;
  totalEarnings: number;
  completedJobs: number;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  nameEn: string;
  nameTe: string;
  descriptionEn: string;
  descriptionTe: string;
  baseInspectionFee: number;
  iconName: string;
  imageUrl?: string;
  enabled: boolean;
  sortOrder: number;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  serviceId: string;
  serviceNameEn: string;
  serviceNameTe: string;
  generalArea: string;
  problemDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  photoNote: string;
  hasUploadedPhoto?: boolean;
  status: BookingStatus;
  technicianId: string;
  technicianName: string;
  technicianPhone: string;
  labourCharges: number;
  rated: boolean;
  idempotencyKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingPrivateDetails {
  bookingId: string;
  customerId: string;
  customerPhone: string;
  fullAddress: string;
  landmark: string;
  villageOrWard?: string;
  createdAt?: string;
}

export interface BookingProtectedPhoto {
  bookingId: string;
  customerId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  dataUrl: string;
  createdAt: string;
}

export interface PermittedTechnicianContact {
  uid: string;
  name: string;
  phone: string;
  area?: string;
  experienceYears?: number;
  ratingAvg?: number;
  ratingCount?: number;
}

export interface CoinTransaction {
  id: string;
  technicianId: string;
  technicianName: string;
  delta: number;
  prevBalance?: number;
  balanceAfter?: number;
  reason: string;
  reasonNote?: string;
  bookingId: string;
  actorId?: string;
  adminId?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface BookingCompletionRecord {
  id: string; // Deterministic ID = bookingId (ensures completion & earnings recorded once ever)
  bookingId: string;
  customerId: string;
  technicianId: string;
  technicianName: string;
  serviceId: string;
  labourCharges: number;
  prevTechnicianEarnings: number;
  newTechnicianEarnings: number;
  prevCompletedJobs: number;
  newCompletedJobs: number;
  idempotencyKey: string;
  confirmedAt: string;
}

export interface ServiceReview {
  id: string; // Deterministic ID = rev_${bookingId}
  bookingId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  serviceId?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type CustomerReview = ServiceReview;

export interface AppNotification {
  id: string;
  recipientId: string;
  titleEn: string;
  titleTe: string;
  messageEn: string;
  messageTe: string;
  type: string;
  bookingId: string;
  read: boolean;
  createdAt: string;
}

export type NotificationItem = AppNotification;

export interface AppSettings {
  id?: string;
  city: string;
  state?: string;
  serviceAreas: string[];
  activeAreas?: string[];
  trialCoinsForNewTech: number;
  trialCoinsDefault?: number;
  coinCostPerLead: number;
  supportPhone: string;
  supportWhatsApp: string;
  updatedAt?: string;
}

export interface AdminRecord {
  uid: string;
  email: string;
  provisionedBy?: string;
  addedAt: string;
}

export type AdminAuditAction =
  | 'TECHNICIAN_APPROVED'
  | 'TECHNICIAN_REJECTED'
  | 'TECHNICIAN_SUSPENDED'
  | 'COIN_ADJUSTMENT'
  | 'SERVICE_CREATED'
  | 'SERVICE_UPDATED'
  | 'SERVICE_REORDERED'
  | 'SERVICE_TOGGLED'
  | 'SERVICE_AREAS_UPDATED'
  | 'ADMIN_PROVISIONED'
  | 'LEGACY_IDENTITY_MIGRATED';

export interface AdminAuditRecord {
  id: string;
  action: AdminAuditAction;
  actorUid: string;
  targetId: string;
  summary: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface LegacyIdentityCandidate {
  kind: 'USER' | 'TECHNICIAN' | 'BOOKING';
  legacyId: string;
  displayName: string;
  phone?: string;
  area?: string;
  coinBalance?: number;
  totalEarnings?: number;
  approvalStatus?: string;
}

/**
 * Verifies that the Firebase configuration explicitly targets the owned project and named
 * Firestore database (`ai-studio-manaexperts-9ab98bbd-c1ef-4605-83b4-310be7069b2b`)
 * rather than silently falling back to the `(default)` database.
 */
export function verifyNamedDatabaseConfiguration(config: {
  projectId?: string;
  firestoreDatabaseId?: string;
}): {
  valid: boolean;
  projectId: string;
  databaseId: string;
  error?: string;
} {
  const projectId = (config.projectId || '').trim();
  const databaseId = (config.firestoreDatabaseId || '').trim();

  if (!projectId || projectId !== EXPECTED_PROJECT_ID) {
    return {
      valid: false,
      projectId,
      databaseId,
      error: `Invalid Firebase projectId "${projectId}". Expected owned project "${EXPECTED_PROJECT_ID}".`,
    };
  }

  if (!databaseId || databaseId === '(default)' || databaseId !== EXPECTED_NAMED_DATABASE_ID) {
    return {
      valid: false,
      projectId,
      databaseId,
      error: `Refusing to silently switch to default database. Expected named database "${EXPECTED_NAMED_DATABASE_ID}", got "${databaseId || '(default)'}".`,
    };
  }

  return {
    valid: true,
    projectId,
    databaseId,
  };
}

/**
 * Generates a deterministic idempotency key and document ID for repeatable commands.
 */
export function buildDeterministicCommandKey(
  command: 'ACCEPT_BOOKING' | 'TRIAL_GRANT' | 'CONFIRM_COMPLETION' | 'REVIEW_BOOKING',
  primaryId: string,
  actorUid?: string
): { docId: string; idempotencyKey: string } {
  const cleanPrimary = primaryId.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanActor = (actorUid || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_');

  switch (command) {
    case 'ACCEPT_BOOKING':
      return {
        docId: `ctx_accept_${cleanPrimary}_${cleanActor}`,
        idempotencyKey: `accept:${cleanPrimary}:${cleanActor}`,
      };
    case 'TRIAL_GRANT':
      return {
        docId: `ctx_trial_${cleanPrimary}`,
        idempotencyKey: `trial_grant:${cleanPrimary}`,
      };
    case 'CONFIRM_COMPLETION':
      return {
        docId: cleanPrimary,
        idempotencyKey: `confirm:${cleanPrimary}`,
      };
    case 'REVIEW_BOOKING':
      return {
        docId: `rev_${cleanPrimary}`,
        idempotencyKey: `review:${cleanPrimary}`,
      };
  }
}

/**
 * Checks whether an ID is a legacy synthetic/demo ID rather than a Firebase Auth UID.
 */
export function isLegacySyntheticId(id: string): boolean {
  if (!id) return false;
  return (
    id.startsWith('cust_') ||
    id.startsWith('tech_') ||
    id.startsWith('demo_') ||
    id.startsWith('admin_')
  );
}

/**
 * Validates and sanitizes first-time user registration inputs.
 * Ordinary registration can NEVER self-assign ADMIN.
 */
export function validateRegistrationInput(input: {
  name: string;
  phone: string;
  area: string;
  requestedRole: string;
  isServerVerifiedAdmin?: boolean;
  isAuthorizedAdminEmail?: boolean;
}): { valid: boolean; error?: string; resolvedRole?: UserRole } {
  const name = input.name.trim();
  const phone = input.phone.trim();
  const area = input.area.trim();

  if (name.length < 2 || name.length > 80) {
    return { valid: false, error: 'Full name must be between 2 and 80 characters.' };
  }
  if (!/^[0-9+\-\s]{10,15}$/.test(phone)) {
    return { valid: false, error: 'Enter a valid 10-digit Indian mobile number.' };
  }
  if (area.length < 2 || area.length > 80) {
    return { valid: false, error: 'Please select a valid service area in Bapatla.' };
  }
  if (input.requestedRole === 'ADMIN') {
    const isVerifiedAdmin = Boolean(input.isServerVerifiedAdmin ?? input.isAuthorizedAdminEmail);
    if (!isVerifiedAdmin) {
      return {
        valid: false,
        error: 'Security Violation: Users cannot self-select the Admin role.',
      };
    }
    return { valid: true, resolvedRole: 'ADMIN' };
  }
  if (input.requestedRole !== 'CUSTOMER' && input.requestedRole !== 'TECHNICIAN') {
    return { valid: false, error: 'Please select either Customer or Technician role.' };
  }
  return { valid: true, resolvedRole: input.requestedRole };
}

/**
 * Safely merges profile edits for an existing user/technician without ever resetting
 * role, phoneVerified, createdAt, approvalStatus, trialCoinsGranted, coinBalance,
 * totalEarnings, completedJobs, ratingAvg, or ratingCount.
 */
export function mergeProfileEditSafely(params: {
  existingUser: UserProfile;
  existingContact: UserPrivateContact | null;
  existingTech: TechnicianProfile | null;
  edits: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills?: string[];
    experienceYears?: number;
    bio?: string;
  };
  nowIso: string;
}): {
  updatedUser: UserProfile;
  updatedContact: UserPrivateContact;
  updatedTech: TechnicianProfile | null;
} {
  const { existingUser, existingContact, existingTech, edits, nowIso } = params;

  const updatedUser: UserProfile = {
    ...existingUser,
    uid: existingUser.uid, // immutable
    role: existingUser.role, // immutable via profile edit
    phoneVerified: existingUser.phoneVerified, // immutable (stays false unless verified provider)
    createdAt: existingUser.createdAt, // immutable
    name: edits.name.trim().slice(0, 80),
    area: edits.area.trim().slice(0, 80),
    updatedAt: nowIso,
  };

  const updatedContact: UserPrivateContact = {
    uid: existingUser.uid,
    email: existingContact?.email || existingUser.email || '',
    phone: edits.phone.trim().slice(0, 20),
    defaultAddress: edits.defaultAddress.trim().slice(0, 300),
    updatedAt: nowIso,
  };

  let updatedTech: TechnicianProfile | null = null;
  if (existingTech) {
    updatedTech = {
      ...existingTech,
      uid: existingTech.uid, // immutable
      approvalStatus: existingTech.approvalStatus, // immutable: never reset approval status!
      trialCoinsGranted: existingTech.trialCoinsGranted === true, // immutable: preserve durable grant marker!
      coinBalance: existingTech.coinBalance, // immutable: never reset coin balance!
      totalEarnings: existingTech.totalEarnings, // immutable: never reset earnings!
      completedJobs: existingTech.completedJobs, // immutable: never reset job count!
      ratingAvg: existingTech.ratingAvg, // immutable
      ratingCount: existingTech.ratingCount, // immutable
      createdAt: existingTech.createdAt, // immutable
      name: edits.name.trim().slice(0, 80),
      phone: edits.phone.trim().slice(0, 20),
      area: edits.area.trim().slice(0, 80),
      skills:
        edits.skills && edits.skills.length > 0
          ? edits.skills.slice(0, 10)
          : existingTech.skills,
      experienceYears:
        typeof edits.experienceYears === 'number'
          ? Math.max(0, Math.min(60, edits.experienceYears))
          : existingTech.experienceYears,
      bio:
        typeof edits.bio === 'string' && edits.bio.trim().length > 0
          ? edits.bio.trim().slice(0, 300)
          : existingTech.bio,
      updatedAt: nowIso,
    };
  }

  return { updatedUser, updatedContact, updatedTech };
}

/**
 * Determines which workspaces a user is genuinely authorized to access based on
 * saved Firestore profile records and server-verified Admin status.
 * Client-side email string comparison is NEVER used here.
 */
export function resolveAuthorizedRolesForUser(params: {
  profile?: UserProfile | null;
  userProfile?: UserProfile | null;
  techProfile: TechnicianProfile | null;
  isServerVerifiedAdmin: boolean;
}): UserRole[] {
  const resolvedProfile = params.profile !== undefined ? params.profile : params.userProfile;
  const { techProfile, isServerVerifiedAdmin } = params;
  if (isServerVerifiedAdmin) {
    return ['CUSTOMER', 'TECHNICIAN', 'ADMIN'];
  }
  if (!resolvedProfile) {
    return ['CUSTOMER'];
  }
  if (resolvedProfile.role === 'TECHNICIAN' || Boolean(techProfile)) {
    return ['CUSTOMER', 'TECHNICIAN'];
  }
  return ['CUSTOMER'];
}

/**
 * Scans loaded documents for any legacy synthetic IDs (cust_..., tech_..., demo_...)
 * so an Admin can preview them and explicitly map them to a real Firebase Auth UID
 * without silently merging unrelated users.
 */
export function detectLegacyNonUidRecords(params: {
  users: UserProfile[];
  technicians: TechnicianProfile[];
  bookings: Booking[];
}): LegacyIdentityCandidate[] {
  const candidates: LegacyIdentityCandidate[] = [];
  const seen = new Set<string>();

  for (const u of params.users) {
    if (isLegacySyntheticId(u.uid) && !seen.has(`USER:${u.uid}`)) {
      seen.add(`USER:${u.uid}`);
      candidates.push({
        kind: 'USER',
        legacyId: u.uid,
        displayName: u.name,
        area: u.area,
      });
    }
  }

  for (const t of params.technicians) {
    if (isLegacySyntheticId(t.uid) && !seen.has(`TECH:${t.uid}`)) {
      seen.add(`TECH:${t.uid}`);
      candidates.push({
        kind: 'TECHNICIAN',
        legacyId: t.uid,
        displayName: t.name,
        phone: t.phone,
        area: t.area,
        coinBalance: t.coinBalance,
        totalEarnings: t.totalEarnings,
        approvalStatus: t.approvalStatus,
      });
    }
  }

  for (const b of params.bookings) {
    if (isLegacySyntheticId(b.customerId) && !seen.has(`BOOKING_CUST:${b.customerId}`)) {
      seen.add(`BOOKING_CUST:${b.customerId}`);
      candidates.push({
        kind: 'BOOKING',
        legacyId: b.customerId,
        displayName: `${b.customerName} (Booking #${b.id.slice(-6)})`,
        area: b.generalArea,
      });
    }
  }

  return candidates;
}

/**
 * Explicit Booking State Machine Validator:
 * - Forward lifecycle: PENDING -> ACCEPTED -> IN_PROGRESS -> WORK_COMPLETED -> CONFIRMED
 * - Cancellation policy:
 *   1. Customer can cancel ONLY from PENDING (before any technician has accepted or spent a coin).
 *   2. Once ACCEPTED, customer self-cancellation is disallowed so a technician's deducted coin is protected;
 *      no automatic coin refund is silently invented.
 */
export function validateBookingStateTransition(params: {
  currentStatus: BookingStatus;
  nextStatus: BookingStatus;
  actorUid: string;
  bookingCustomerId: string;
  bookingTechnicianId: string;
  isAdmin?: boolean;
}): { valid: boolean; error?: string } {
  const {
    currentStatus,
    nextStatus,
    actorUid,
    bookingCustomerId,
    bookingTechnicianId,
    isAdmin,
  } = params;

  if (currentStatus === nextStatus) {
    return {
      valid: false,
      error: `Booking is already in ${currentStatus} state.`,
    };
  }

  if (nextStatus === 'CANCELLED') {
    if (currentStatus !== 'PENDING' && !isAdmin) {
      return {
        valid: false,
        error:
          'Customer cancellation is only allowed while the booking is PENDING (before a technician accepts and spends 1 coin).',
      };
    }
    if (actorUid !== bookingCustomerId && !isAdmin) {
      return {
        valid: false,
        error: 'Only the booking customer can cancel their pending booking.',
      };
    }
    return { valid: true };
  }

  if (currentStatus === 'PENDING' && nextStatus === 'ACCEPTED') {
    if (bookingTechnicianId !== '') {
      return {
        valid: false,
        error: 'Booking already has a technician assigned.',
      };
    }
    return { valid: true };
  }

  if (currentStatus === 'ACCEPTED' && nextStatus === 'IN_PROGRESS') {
    if (actorUid !== bookingTechnicianId && !isAdmin) {
      return {
        valid: false,
        error: 'Only the assigned technician can start work on an ACCEPTED booking.',
      };
    }
    return { valid: true };
  }

  if (currentStatus === 'IN_PROGRESS' && nextStatus === 'WORK_COMPLETED') {
    if (actorUid !== bookingTechnicianId && !isAdmin) {
      return {
        valid: false,
        error: 'Only the assigned technician can submit labour charges and mark work completed.',
      };
    }
    return { valid: true };
  }

  if (currentStatus === 'WORK_COMPLETED' && nextStatus === 'CONFIRMED') {
    if (actorUid !== bookingCustomerId && !isAdmin) {
      return {
        valid: false,
        error: 'Only the booking customer can confirm work completion.',
      };
    }
    return { valid: true };
  }

  return {
    valid: false,
    error: `Invalid booking status transition: ${currentStatus} -> ${nextStatus}. Allowed flow is PENDING -> ACCEPTED -> IN_PROGRESS -> WORK_COMPLETED -> CONFIRMED (or PENDING -> CANCELLED).`,
  };
}

/**
 * Determines whether a technician is eligible to accept a specific booking.
 * Checks approval status (PENDING/REJECTED/SUSPENDED vs APPROVED), online availability,
 * PENDING state, matching service skill, matching Bapatla area, non-self-booking, and coin balance >= 1.
 */
export function checkBookingAcceptanceEligibility(
  technician: TechnicianProfile,
  booking: Booking,
  options?: { enforceExactAreaMatch?: boolean }
): { eligible: boolean; reason?: string } {
  if (technician.approvalStatus !== 'APPROVED') {
    if (technician.approvalStatus === 'SUSPENDED') {
      return {
        eligible: false,
        reason: 'Your technician account is Suspended by Bapatla Admin and cannot accept jobs.',
      };
    }
    if (technician.approvalStatus === 'REJECTED') {
      return {
        eligible: false,
        reason: 'Your technician application was Rejected by Bapatla Admin and cannot accept jobs.',
      };
    }
    return {
      eligible: false,
      reason:
        'Your technician account is Pending Approval by Bapatla Admin. New technicians start with 0 coins and cannot accept jobs before approval.',
    };
  }
  if (!technician.isAvailable) {
    return {
      eligible: false,
      reason: 'Turn ON your availability toggle before accepting jobs.',
    };
  }
  if (booking.status !== 'PENDING' || booking.technicianId !== '') {
    return {
      eligible: false,
      reason: 'This booking has already been accepted by another technician or is no longer pending.',
    };
  }
  if (booking.customerId === technician.uid) {
    return {
      eligible: false,
      reason: 'Technicians cannot accept their own customer booking request.',
    };
  }
  if (!technician.skills.includes(booking.serviceId)) {
    return {
      eligible: false,
      reason: 'This booking requires a skill category not assigned to your profile.',
    };
  }
  if (
    options?.enforceExactAreaMatch !== false &&
    booking.generalArea &&
    technician.area &&
    technician.area.trim().toLowerCase() !== booking.generalArea.trim().toLowerCase()
  ) {
    return {
      eligible: false,
      reason: `This booking is for ${booking.generalArea}, which does not match your active area (${technician.area}).`,
    };
  }
  if (technician.coinBalance < ACCEPT_BOOKING_COIN_COST) {
    return {
      eligible: false,
      reason:
        'Insufficient coin balance (1 coin required to accept a booking). Contact Admin for coin adjustment.',
    };
  }
  return { eligible: true };
}

/**
 * Executes an atomic booking acceptance transition in memory (mirroring Firestore runTransaction).
 * Ensures:
 * - Only an eligible, approved, available technician can accept a matching pending request.
 * - Assigns exactly 1 technician and deducts 1 coin atomically.
 * - Losing or repeated acceptance requests do not deduct another coin.
 */
export function executeAtomicBookingAcceptance(params: {
  booking: Booking;
  technician: TechnicianProfile;
  nowIso: string;
  txId?: string;
  existingLedgerIds?: Set<string>;
}): {
  success: boolean;
  error?: string;
  updatedBooking: Booking;
  updatedTechnician: TechnicianProfile;
  coinTransaction?: CoinTransaction;
} {
  const { booking, technician, nowIso, existingLedgerIds } = params;
  const deterministic = buildDeterministicCommandKey(
    'ACCEPT_BOOKING',
    booking.id,
    technician.uid
  );
  const resolvedTxId = params.txId || deterministic.docId;

  if (existingLedgerIds?.has(resolvedTxId)) {
    return {
      success: false,
      error: 'Duplicate acceptance request detected (idempotency guard). No extra coin deducted.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }

  const check = checkBookingAcceptanceEligibility(technician, booking);
  if (!check.eligible) {
    return {
      success: false,
      error: check.reason,
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }

  const prevBalance = technician.coinBalance;
  const newBalance = prevBalance - ACCEPT_BOOKING_COIN_COST;
  if (newBalance < 0) {
    return {
      success: false,
      error: 'Coin balance cannot become negative.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }

  const updatedTechnician: TechnicianProfile = {
    ...technician,
    coinBalance: newBalance,
    updatedAt: nowIso,
  };

  const updatedBooking: Booking = {
    ...booking,
    status: 'ACCEPTED',
    technicianId: technician.uid,
    technicianName: technician.name,
    technicianPhone: technician.phone,
    updatedAt: nowIso,
  };

  const coinTransaction: CoinTransaction = {
    id: resolvedTxId,
    technicianId: technician.uid,
    technicianName: technician.name,
    delta: -ACCEPT_BOOKING_COIN_COST,
    prevBalance,
    balanceAfter: newBalance,
    reason: 'JOB_ACCEPTANCE_DEDUCTION',
    bookingId: booking.id,
    actorId: technician.uid,
    idempotencyKey: deterministic.idempotencyKey,
    createdAt: nowIso,
  };

  return {
    success: true,
    updatedBooking,
    updatedTechnician,
    coinTransaction,
  };
}

/**
 * Assigned technician progresses booking from ACCEPTED -> IN_PROGRESS.
 */
export function startWorkOnBooking(params: {
  booking: Booking;
  technicianUid: string;
  nowIso: string;
}): {
  success: boolean;
  error?: string;
  updatedBooking: Booking;
} {
  const { booking, technicianUid, nowIso } = params;
  const transition = validateBookingStateTransition({
    currentStatus: booking.status,
    nextStatus: 'IN_PROGRESS',
    actorUid: technicianUid,
    bookingCustomerId: booking.customerId,
    bookingTechnicianId: booking.technicianId,
  });

  if (!transition.valid) {
    return {
      success: false,
      error: transition.error,
      updatedBooking: booking,
    };
  }

  return {
    success: true,
    updatedBooking: {
      ...booking,
      status: 'IN_PROGRESS',
      updatedAt: nowIso,
    },
  };
}

/**
 * Assigned technician submits validated final labour charges and transitions
 * IN_PROGRESS -> WORK_COMPLETED.
 */
export function submitLabourChargesOnBooking(params: {
  booking: Booking;
  technicianUid: string;
  labourCharges: number;
  nowIso: string;
}): {
  success: boolean;
  error?: string;
  updatedBooking: Booking;
} {
  const { booking, technicianUid, labourCharges, nowIso } = params;
  const transition = validateBookingStateTransition({
    currentStatus: booking.status,
    nextStatus: 'WORK_COMPLETED',
    actorUid: technicianUid,
    bookingCustomerId: booking.customerId,
    bookingTechnicianId: booking.technicianId,
  });

  if (!transition.valid) {
    return {
      success: false,
      error: transition.error,
      updatedBooking: booking,
    };
  }

  const roundedAmount = Math.round(Number(labourCharges));
  if (
    !Number.isFinite(roundedAmount) ||
    roundedAmount <= 0 ||
    roundedAmount > MAX_VALID_LABOUR_CHARGE
  ) {
    return {
      success: false,
      error: `Labour charges must be a valid positive amount between ₹1 and ₹${MAX_VALID_LABOUR_CHARGE}.`,
      updatedBooking: booking,
    };
  }

  return {
    success: true,
    updatedBooking: {
      ...booking,
      status: 'WORK_COMPLETED',
      labourCharges: roundedAmount,
      updatedAt: nowIso,
    },
  };
}

/**
 * Admin approves a technician and grants 3 free trial coins ONCE EVER using
 * the durable `trialCoinsGranted` marker and deterministic ledger ID `ctx_trial_${uid}`.
 */
export function approveTechnicianWithTrialCoins(params: {
  technician: TechnicianProfile;
  adminUid: string;
  nowIso: string;
  txId?: string;
  alreadyReceivedTrialCoins?: boolean;
}): {
  updatedTechnician: TechnicianProfile;
  coinTransaction?: CoinTransaction;
  auditRecord: AdminAuditRecord;
} {
  const { technician, adminUid, nowIso } = params;
  const deterministic = buildDeterministicCommandKey('TRIAL_GRANT', technician.uid, adminUid);
  const resolvedTxId = params.txId || deterministic.docId;

  const hasDurableGrantMarker =
    technician.trialCoinsGranted === true || params.alreadyReceivedTrialCoins === true;
  const grantCoins = hasDurableGrantMarker ? 0 : INITIAL_TRIAL_COINS;
  const prevBalance = technician.coinBalance;
  const newBalance = prevBalance + grantCoins;

  const updatedTechnician: TechnicianProfile = {
    ...technician,
    approvalStatus: 'APPROVED',
    isAvailable: true,
    trialCoinsGranted: true, // Durable one-time marker persisted on technician profile
    coinBalance: newBalance,
    updatedAt: nowIso,
  };

  const auditRecord: AdminAuditRecord = {
    id: `audit_approve_${technician.uid}_${Date.parse(nowIso) || Date.now()}`,
    action: 'TECHNICIAN_APPROVED',
    actorUid: adminUid,
    targetId: technician.uid,
    summary:
      grantCoins > 0
        ? `Approved technician ${technician.name} and granted ${grantCoins} trial coins (balance: ${prevBalance} -> ${newBalance}).`
        : `Re-approved technician ${technician.name} without duplicate trial coin grant (trialCoinsGranted=true, balance: ${newBalance}).`,
    idempotencyKey: `audit_approve:${technician.uid}:${nowIso}`,
    createdAt: nowIso,
  };

  if (grantCoins > 0) {
    return {
      updatedTechnician,
      coinTransaction: {
        id: resolvedTxId,
        technicianId: technician.uid,
        technicianName: technician.name,
        delta: grantCoins,
        prevBalance,
        balanceAfter: newBalance,
        reason: 'INITIAL_APPROVAL_TRIAL_COINS',
        bookingId: '',
        actorId: adminUid,
        idempotencyKey: deterministic.idempotencyKey,
        createdAt: nowIso,
      },
      auditRecord,
    };
  }

  return { updatedTechnician, auditRecord };
}

/**
 * Admin manually adjusts technician coins with strict server-verified admin authorization,
 * non-negative balance invariant, direction validation, and accurate ledger + audit records
 * matching the exact applied delta (`balanceAfter === prevBalance + delta`).
 * Rejects invalid adjustments instead of clamping or recording a misleading ledger entry.
 */
export function executeAdminCoinAdjustment(params: {
  technician: TechnicianProfile;
  delta: number;
  reason: 'ADMIN_RECHARGE' | 'ADMIN_DEDUCTION';
  reasonNote?: string;
  adminUid: string;
  isAdminAuthorized?: boolean;
  nowIso: string;
  txId: string;
  idempotencyKey?: string;
}): {
  success: boolean;
  error?: string;
  updatedTechnician: TechnicianProfile;
  coinTransaction?: CoinTransaction;
  auditRecord?: AdminAuditRecord;
} {
  const {
    technician,
    delta,
    reason,
    reasonNote,
    adminUid,
    isAdminAuthorized = true,
    nowIso,
    txId,
    idempotencyKey,
  } = params;

  const cleanAdminUid = (adminUid || '').trim();
  if (!isAdminAuthorized || !cleanAdminUid || isLegacySyntheticId(cleanAdminUid)) {
    return {
      success: false,
      error:
        'PERMISSION_DENIED: Trusted server-verified Admin authorization is required to adjust technician coins.',
      updatedTechnician: technician,
    };
  }

  if (reason !== 'ADMIN_RECHARGE' && reason !== 'ADMIN_DEDUCTION') {
    return {
      success: false,
      error: 'Invalid coin adjustment reason. Must be ADMIN_RECHARGE or ADMIN_DEDUCTION.',
      updatedTechnician: technician,
    };
  }

  const numDelta = Number(delta);
  if (
    !Number.isFinite(numDelta) ||
    !Number.isInteger(numDelta) ||
    numDelta === 0 ||
    Math.abs(numDelta) > 10000
  ) {
    return {
      success: false,
      error: 'Coin adjustment delta must be a non-zero whole integer between -10000 and +10000.',
      updatedTechnician: technician,
    };
  }

  if (reason === 'ADMIN_RECHARGE' && numDelta <= 0) {
    return {
      success: false,
      error: 'ADMIN_RECHARGE requires a positive coin delta greater than 0.',
      updatedTechnician: technician,
    };
  }
  if (reason === 'ADMIN_DEDUCTION' && numDelta >= 0) {
    return {
      success: false,
      error: 'ADMIN_DEDUCTION requires a negative coin delta less than 0.',
      updatedTechnician: technician,
    };
  }

  const intDelta = numDelta;
  const prevBalance = Math.trunc(Number(technician.coinBalance || 0));
  const newBalance = prevBalance + intDelta;

  if (newBalance < 0) {
    return {
      success: false,
      error: `Cannot deduct ${Math.abs(intDelta)} coins: technician only has ${prevBalance} coin(s), and coin balances cannot become negative.`,
      updatedTechnician: technician,
    };
  }

  const sanitizedNote = (reasonNote || '').trim().slice(0, 240);
  if (sanitizedNote && sanitizedNote.length < 3) {
    return {
      success: false,
      error: 'If provided, coin adjustment reason note must be at least 3 characters.',
      updatedTechnician: technician,
    };
  }

  const updatedTechnician: TechnicianProfile = {
    ...technician,
    coinBalance: newBalance,
    updatedAt: nowIso,
  };

  const resolvedKey = idempotencyKey || `coin_adj:${technician.uid}:${txId}`;
  const noteSuffix = sanitizedNote ? ` — Note: ${sanitizedNote}` : '';

  const coinTransaction: CoinTransaction = {
    id: txId,
    technicianId: technician.uid,
    technicianName: technician.name,
    delta: intDelta,
    prevBalance,
    balanceAfter: newBalance,
    reason,
    ...(sanitizedNote ? { reasonNote: sanitizedNote } : {}),
    bookingId: '',
    actorId: cleanAdminUid,
    adminId: cleanAdminUid,
    idempotencyKey: resolvedKey,
    createdAt: nowIso,
  };

  const auditRecord: AdminAuditRecord = {
    id: `audit_${txId}`,
    action: 'COIN_ADJUSTMENT',
    actorUid: cleanAdminUid,
    targetId: technician.uid,
    summary: `${reason}: ${intDelta > 0 ? `+${intDelta}` : intDelta} coins for ${technician.name} (${prevBalance} -> ${newBalance}) by Admin ${cleanAdminUid}${noteSuffix}.`.slice(
      0,
      400
    ),
    idempotencyKey: resolvedKey,
    createdAt: nowIso,
  };

  return {
    success: true,
    updatedTechnician,
    coinTransaction,
    auditRecord,
  };
}

/**
 * Determines whether sensitive customer contact & full address details can be revealed
 * to the viewer. Protects customer PII before booking acceptance.
 */
export function canViewProtectedCustomerDetails(params: {
  viewerUid: string;
  viewerRole: UserRole;
  booking: Booking;
}): boolean {
  const { viewerUid, viewerRole, booking } = params;
  if (viewerRole === 'ADMIN') return true;
  if (booking.customerId === viewerUid) return true;
  if (
    booking.technicianId === viewerUid &&
    ['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'CONFIRMED'].includes(booking.status)
  ) {
    return true;
  }
  return false;
}

/**
 * Calculates verified technician earnings strictly from confirmed bookings.
 */
export function calculateVerifiedTechnicianEarnings(
  technicianUid: string,
  bookings: Booking[]
): { totalEarnings: number; completedJobs: number } {
  const confirmed = bookings.filter(
    (b) => b.technicianId === technicianUid && b.status === 'CONFIRMED' && b.labourCharges > 0
  );
  const totalEarnings = confirmed.reduce((sum, b) => sum + b.labourCharges, 0);
  return {
    totalEarnings,
    completedJobs: confirmed.length,
  };
}

/**
 * Customer confirms work completion and records technician's verified earnings
 * and a deterministic BookingCompletionRecord (`/booking_completions/{bookingId}`)
 * so completion and earnings can only be recorded ONCE ever for a booking.
 */
export function confirmWorkCompletion(params: {
  booking: Booking;
  technician: TechnicianProfile;
  customerUid: string;
  nowIso: string;
  existingCompletionIds?: Set<string>;
}): {
  success: boolean;
  error?: string;
  updatedBooking: Booking;
  updatedTechnician: TechnicianProfile;
  completionRecord?: BookingCompletionRecord;
} {
  const { booking, technician, customerUid, nowIso, existingCompletionIds } = params;

  if (existingCompletionIds?.has(booking.id) || booking.status === 'CONFIRMED') {
    return {
      success: false,
      error: 'Completion and earnings have already been recorded for this booking.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }

  if (booking.customerId !== customerUid) {
    return {
      success: false,
      error: 'Only the customer who created the booking can confirm completion.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }
  if (booking.status !== 'WORK_COMPLETED') {
    return {
      success: false,
      error: 'Work must be marked as finished with final labour charges before confirmation.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }
  if (booking.labourCharges <= 0 || booking.labourCharges > MAX_VALID_LABOUR_CHARGE) {
    return {
      success: false,
      error: 'Valid labour charges must be recorded before confirming completion.',
      updatedBooking: booking,
      updatedTechnician: technician,
    };
  }

  const deterministic = buildDeterministicCommandKey(
    'CONFIRM_COMPLETION',
    booking.id,
    customerUid
  );

  const prevEarnings = technician.totalEarnings || 0;
  const newEarnings = prevEarnings + booking.labourCharges;
  const prevJobs = technician.completedJobs || 0;
  const newJobs = prevJobs + 1;

  const updatedBooking: Booking = {
    ...booking,
    status: 'CONFIRMED',
    updatedAt: nowIso,
  };

  const updatedTechnician: TechnicianProfile = {
    ...technician,
    totalEarnings: newEarnings,
    completedJobs: newJobs,
    updatedAt: nowIso,
  };

  const completionRecord: BookingCompletionRecord = {
    id: deterministic.docId,
    bookingId: booking.id,
    customerId: booking.customerId,
    technicianId: technician.uid,
    technicianName: technician.name,
    serviceId: booking.serviceId,
    labourCharges: booking.labourCharges,
    prevTechnicianEarnings: prevEarnings,
    newTechnicianEarnings: newEarnings,
    prevCompletedJobs: prevJobs,
    newCompletedJobs: newJobs,
    idempotencyKey: deterministic.idempotencyKey,
    confirmedAt: nowIso,
  };

  return {
    success: true,
    updatedBooking,
    updatedTechnician,
    completionRecord,
  };
}

/**
 * Computes a short, deterministic alphanumeric hash for idempotency keys.
 */
function computeShortHash(text: string): string {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ');
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Generates a deterministic booking ID and idempotency key for a customer booking request
 * so repeated taps or accidental re-submissions of the same request resolve to the same ID
 * and are rejected as duplicates rather than creating multiple bookings.
 */
export function buildCustomerBookingIdempotencyIdentity(params: {
  customerUid: string;
  serviceId: string;
  generalArea: string;
  preferredDate: string;
  preferredTimeSlot: string;
  problemDescription: string;
}): { bookingId: string; idempotencyKey: string; fingerprint: string } {
  const cleanUid = params.customerUid.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanService = params.serviceId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanDate = params.preferredDate.trim().replace(/[^0-9]/g, '');
  const fingerprintPayload = [
    cleanUid,
    cleanService,
    params.generalArea.trim().toLowerCase(),
    params.preferredDate.trim(),
    params.preferredTimeSlot.trim(),
    params.problemDescription.trim().toLowerCase().replace(/\s+/g, ' '),
  ].join('|');
  const hash = computeShortHash(fingerprintPayload);
  const uidPart = cleanUid.slice(0, 10) || 'cust';
  const srvPart = cleanService.slice(0, 12) || 'srv';
  const bookingId = `bk_${uidPart}_${srvPart}_${cleanDate || 'date'}_${hash}`;
  const idempotencyKey = `create:${bookingId}:${cleanUid}`;
  return {
    bookingId,
    idempotencyKey,
    fingerprint: hash,
  };
}

/**
 * Checks whether the customer already has an active (non-cancelled, non-confirmed) booking
 * matching the same service, locality, date, time slot, and problem description (or deterministic ID).
 */
export function hasDuplicateActiveBookingRequest(params: {
  existingBookings: Booking[];
  customerUid: string;
  serviceId: string;
  generalArea: string;
  preferredDate: string;
  preferredTimeSlot: string;
  problemDescription: string;
}): { duplicate: boolean; existingBookingId?: string; reason?: string } {
  const identity = buildCustomerBookingIdempotencyIdentity(params);
  const normalizedDesc = params.problemDescription.trim().toLowerCase().replace(/\s+/g, ' ');

  for (const bk of params.existingBookings) {
    if (bk.customerId !== params.customerUid) continue;
    const isActive = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(bk.status);
    if (!isActive) continue;

    if (bk.id === identity.bookingId || bk.idempotencyKey === identity.idempotencyKey) {
      return {
        duplicate: true,
        existingBookingId: bk.id,
        reason: `Duplicate booking prevented: Your request (#${bk.id.slice(-6).toUpperCase()}) is already active.`,
      };
    }

    const bkDesc = (bk.problemDescription || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (
      bk.serviceId === params.serviceId &&
      bk.generalArea === params.generalArea.trim() &&
      bk.preferredDate === params.preferredDate.trim() &&
      bk.preferredTimeSlot === params.preferredTimeSlot.trim() &&
      bkDesc === normalizedDesc
    ) {
      return {
        duplicate: true,
        existingBookingId: bk.id,
        reason: `Duplicate booking prevented: You already have an active ${bk.serviceNameEn} request (#${bk.id.slice(-6).toUpperCase()}) for ${bk.preferredDate} (${bk.preferredTimeSlot}).`,
      };
    }
  }

  return { duplicate: false };
}

/**
 * Strictly validates all customer booking inputs before any Firestore write:
 * - Authenticated non-synthetic customer UID
 * - Active service from shared catalogue (rejects missing or disabled services)
 * - Active Bapatla locality from shared serviceAreas
 * - Full address (5..300 chars), landmark (<= 120 chars), villageOrWard (<= 120 chars)
 * - 10-digit Indian mobile number starting with 6-9
 * - Problem description (8..500 chars)
 * - Valid preferred date (YYYY-MM-DD, not in the past)
 * - Valid preferred time slot from allowed slots
 * - Optional text appliance/equipment note (<= 200 chars, never treated as an uploaded image)
 */
export function validateCustomerBookingInput(params: {
  customerUid: string;
  customerName: string;
  service: ServiceCategory | null | undefined;
  catalogServices: ServiceCategory[];
  generalArea: string;
  activeServiceAreas: string[];
  fullAddress: string;
  landmark?: string;
  villageOrWard?: string;
  customerPhone: string;
  problemDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  photoNote?: string;
  todayIsoDate?: string;
}): {
  valid: boolean;
  error?: string;
  sanitized?: {
    cleanPhone: string;
    fullAddress: string;
    landmark: string;
    villageOrWard: string;
    problemDescription: string;
    preferredDate: string;
    preferredTimeSlot: string;
    photoNote: string;
    generalArea: string;
  };
} {
  const uid = (params.customerUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return {
      valid: false,
      error: 'You must be signed in with a valid Firebase account before booking a service.',
    };
  }

  const customerName = (params.customerName || '').trim();
  if (customerName.length < 2 || customerName.length > 80) {
    return {
      valid: false,
      error: 'Please complete your customer profile name (2–80 characters) before booking.',
    };
  }

  if (!params.service || !params.service.id) {
    return {
      valid: false,
      error: 'Please select a service category to book.',
    };
  }

  const catalogMatch = params.catalogServices.find((s) => s.id === params.service!.id);
  if (!catalogMatch) {
    return {
      valid: false,
      error: 'Selected service was not found in the active Bapatla service catalogue.',
    };
  }

  if (!catalogMatch.enabled || !params.service.enabled) {
    return {
      valid: false,
      error: `"${catalogMatch.nameEn}" is currently disabled by Admin and unavailable for new bookings.`,
    };
  }

  const generalArea = (params.generalArea || '').trim();
  if (!generalArea || generalArea.length < 2 || generalArea.length > 80) {
    return {
      valid: false,
      error: 'Please select your locality in Bapatla.',
    };
  }

  if (
    params.activeServiceAreas.length === 0 ||
    !params.activeServiceAreas.includes(generalArea)
  ) {
    return {
      valid: false,
      error: `Selected locality "${generalArea}" is not in the active Bapatla service areas.`,
    };
  }

  const cleanPhone = (params.customerPhone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }

  const fullAddress = (params.fullAddress || '').trim();
  if (fullAddress.length < 5 || fullAddress.length > 300) {
    return {
      valid: false,
      error: 'Please enter your complete house/door number and street address (5–300 characters).',
    };
  }

  const landmark = ((params.landmark || '').trim() || 'Near Main Road').slice(0, 120);
  const villageOrWard = ((params.villageOrWard || '').trim() || generalArea).slice(0, 120);

  const problemDescription = (params.problemDescription || '').trim();
  if (problemDescription.length < 8 || problemDescription.length > 500) {
    return {
      valid: false,
      error: 'Please describe the problem or repair needed (between 8 and 500 characters).',
    };
  }

  const preferredDate = (params.preferredDate || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return {
      valid: false,
      error: 'Please select a valid preferred service date (YYYY-MM-DD).',
    };
  }

  const parsedDate = new Date(`${preferredDate}T00:00:00Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== preferredDate) {
    return {
      valid: false,
      error: 'Please select a valid calendar date for your booking.',
    };
  }

  const todayStr =
    params.todayIsoDate ||
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  if (preferredDate < todayStr) {
    return {
      valid: false,
      error: `Preferred service date (${preferredDate}) cannot be in the past.`,
    };
  }

  const preferredTimeSlot = (params.preferredTimeSlot || '').trim();
  if (
    !preferredTimeSlot ||
    !(VALID_BOOKING_TIME_SLOTS as readonly string[]).includes(preferredTimeSlot)
  ) {
    return {
      valid: false,
      error: 'Please select a valid preferred time slot from the Bapatla schedule.',
    };
  }

  const photoNote = (params.photoNote || '').trim();
  if (photoNote.length > 200) {
    return {
      valid: false,
      error: 'Optional equipment/appliance note must be 200 characters or fewer.',
    };
  }

  return {
    valid: true,
    sanitized: {
      cleanPhone,
      fullAddress,
      landmark,
      villageOrWard,
      problemDescription,
      preferredDate,
      preferredTimeSlot,
      photoNote,
      generalArea,
    },
  };
}

/**
 * Validates an optional customer problem photo file before upload.
 * Enforces allowed image MIME types (JPEG, PNG, WebP) and file size limits (1 byte .. 5 MB).
 */
export function validateBookingPhotoFile(fileMeta: {
  name: string;
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  const fileName = (fileMeta.name || '').trim();
  if (!fileName) {
    return { valid: false, error: 'Selected photo file is missing a file name.' };
  }
  if (!(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(fileMeta.type)) {
    return {
      valid: false,
      error: `Unsupported file type "${fileMeta.type || 'unknown'}". Please select a JPG, PNG, or WebP image.`,
    };
  }
  if (!Number.isFinite(fileMeta.size) || fileMeta.size <= 0) {
    return {
      valid: false,
      error: 'Selected image file is empty (0 bytes). Please choose a valid photo.',
    };
  }
  if (fileMeta.size > MAX_RAW_PHOTO_SIZE_BYTES) {
    const sizeMb = (fileMeta.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Photo is too large (${sizeMb} MB). Maximum allowed file size is 5 MB.`,
    };
  }
  return { valid: true };
}

/**
 * Validates the encoded protected photo payload before storing in Firestore `/private/photo`.
 */
export function validateProtectedPhotoPayload(photo: BookingProtectedPhoto): {
  valid: boolean;
  error?: string;
} {
  const fileCheck = validateBookingPhotoFile({
    name: photo.fileName,
    type: photo.mimeType,
    size: photo.sizeBytes,
  });
  if (!fileCheck.valid) {
    return fileCheck;
  }
  if (
    !photo.dataUrl ||
    photo.dataUrl.length < 30 ||
    photo.dataUrl.length > MAX_PROTECTED_PHOTO_DATA_URL_LENGTH ||
    !/^data:image\/(jpeg|png|webp);base64,/.test(photo.dataUrl)
  ) {
    return {
      valid: false,
      error: 'Processed image payload is invalid or exceeds protected storage limits.',
    };
  }
  return { valid: true };
}

/**
 * Validates a customer review submission.
 * Enforces:
 * 1. Only the customer who created the booking can review it.
 * 2. Booking must be in CONFIRMED state.
 * 3. Only ONE review is allowed per completed booking (`!booking.rated` and `!existingReviewIds.has(rev_${booking.id})`).
 * 4. Explicit star rating 1..5 is required (0 / unselected is rejected).
 * 5. Genuine customer comment is validated (no automatic positive review generation).
 */
export function validateCustomerReviewInput(params: {
  booking: Booking;
  customerUid: string;
  rating: number;
  comment: string;
  existingReviewIds?: Set<string>;
}): {
  valid: boolean;
  error?: string;
  reviewId?: string;
  clampedRating?: number;
  sanitizedComment?: string;
} {
  const { booking, customerUid, rating, comment, existingReviewIds } = params;
  const deterministic = buildDeterministicCommandKey('REVIEW_BOOKING', booking.id, customerUid);

  if (!customerUid || booking.customerId !== customerUid) {
    return {
      valid: false,
      error: 'Only the customer who created this booking is authorized to submit a review.',
    };
  }

  if (booking.status !== 'CONFIRMED') {
    return {
      valid: false,
      error: 'You can only submit a review after confirming work completion.',
    };
  }

  if (booking.rated || existingReviewIds?.has(deterministic.docId)) {
    return {
      valid: false,
      error: 'A review has already been submitted for this completed booking.',
    };
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return {
      valid: false,
      error: 'Please select a star rating between 1 and 5 before submitting your review.',
    };
  }

  const trimmedComment = (comment || '').trim();
  if (trimmedComment.length < 3) {
    return {
      valid: false,
      error: 'Please write a short review comment (at least 3 characters) describing your experience.',
    };
  }
  if (trimmedComment.length > 400) {
    return {
      valid: false,
      error: 'Review comment cannot exceed 400 characters.',
    };
  }

  return {
    valid: true,
    reviewId: deterministic.docId,
    clampedRating: rating,
    sanitizedComment: trimmedComment,
  };
}

/**
 * Filters a list of bookings to strictly those owned by the authenticated customer UID,
 * sorted newest first.
 */
export function filterCustomerOwnedBookings(
  bookings: Booking[],
  customerUid: string | null | undefined
): Booking[] {
  const uid = (customerUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) return [];
  return bookings
    .filter((b) => b.customerId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Extracts ONLY the permitted contact & public profile information for the technician
 * assigned to a customer's booking (never exposing coinBalance or totalEarnings).
 */
export function extractPermittedTechnicianContact(
  booking: Booking,
  technicians: TechnicianProfile[]
): PermittedTechnicianContact | null {
  if (
    !booking.technicianId ||
    !['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'CONFIRMED'].includes(booking.status)
  ) {
    return null;
  }
  const matched = technicians.find((t) => t.uid === booking.technicianId);
  return {
    uid: booking.technicianId,
    name: booking.technicianName || matched?.name || 'Assigned Technician',
    phone: booking.technicianPhone || matched?.phone || '',
    area: matched?.area,
    experienceYears: matched?.experienceYears,
    ratingAvg: matched?.ratingAvg,
    ratingCount: matched?.ratingCount,
  };
}

// ============================================================================
// Technician Experience Domain Operations & Concurrent Transaction Engine
// ============================================================================

/**
 * Validates technician registration and profile edit inputs under the authenticated UID.
 * Enforces non-synthetic UID, full name, 10-digit Indian mobile number, valid Bapatla area,
 * at least 1 authorized service skill (max 10), experience years (0..60), and bio (<= 300 chars).
 */
export function validateTechnicianProfileInput(params: {
  uid: string;
  name: string;
  phone: string;
  area: string;
  defaultAddress?: string;
  skills: string[];
  experienceYears: number;
  bio: string;
  activeServiceAreas?: string[];
  availableServiceIds?: string[];
}): {
  valid: boolean;
  error?: string;
  sanitized?: {
    uid: string;
    name: string;
    cleanPhone: string;
    area: string;
    defaultAddress: string;
    skills: string[];
    experienceYears: number;
    bio: string;
  };
} {
  const uid = (params.uid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return {
      valid: false,
      error: 'You must be signed in with a real Firebase Auth UID to save a technician profile.',
    };
  }

  const name = (params.name || '').trim();
  if (name.length < 2 || name.length > 80) {
    return {
      valid: false,
      error: 'Technician full name must be between 2 and 80 characters.',
    };
  }

  const cleanPhone = (params.phone || '').replace(/\D/g, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }

  const area = (params.area || '').trim();
  if (area.length < 2 || area.length > 80) {
    return {
      valid: false,
      error: 'Please select a valid Bapatla service area.',
    };
  }
  if (
    params.activeServiceAreas &&
    params.activeServiceAreas.length > 0 &&
    !params.activeServiceAreas.includes(area)
  ) {
    return {
      valid: false,
      error: `Selected area "${area}" is not in the active Bapatla service areas.`,
    };
  }

  const defaultAddress = ((params.defaultAddress || '').trim() || area).slice(0, 300);
  if (params.defaultAddress !== undefined && params.defaultAddress.trim().length < 4) {
    return {
      valid: false,
      error: 'Please enter your house/door number or street address in Bapatla (at least 4 characters).',
    };
  }

  const uniqueSkills = Array.from(
    new Set((params.skills || []).map((s) => s.trim()).filter(Boolean))
  ).slice(0, 10);
  if (uniqueSkills.length === 0) {
    return {
      valid: false,
      error: 'Please select at least one trade skill category.',
    };
  }
  if (params.availableServiceIds && params.availableServiceIds.length > 0) {
    const invalidSkill = uniqueSkills.find((s) => !params.availableServiceIds!.includes(s));
    if (invalidSkill) {
      return {
        valid: false,
        error: `Skill "${invalidSkill}" is not a recognized service category.`,
      };
    }
  }

  const expNum = Number(params.experienceYears);
  if (!Number.isFinite(expNum) || expNum < 0 || expNum > 60) {
    return {
      valid: false,
      error: 'Experience must be between 0 and 60 years.',
    };
  }
  const experienceYears = Math.round(expNum);

  const rawBio = (params.bio || '').trim();
  if (rawBio.length > 300) {
    return {
      valid: false,
      error: 'Technician bio must be 300 characters or fewer.',
    };
  }
  const bio = rawBio || `Experienced local service technician in ${area}, Bapatla.`;

  return {
    valid: true,
    sanitized: {
      uid,
      name,
      cleanPhone,
      area,
      defaultAddress,
      skills: uniqueSkills,
      experienceYears,
      bio,
    },
  };
}

/**
 * Builds a new first-time TechnicianProfile under the authenticated UID.
 * Always starts in PENDING approvalStatus with 0 coins, isAvailable = false, and trialCoinsGranted = false.
 */
export function buildInitialTechnicianProfile(params: {
  uid: string;
  name: string;
  phone: string;
  area: string;
  skills: string[];
  experienceYears: number;
  bio: string;
  nowIso: string;
}): TechnicianProfile {
  return {
    uid: params.uid.trim(),
    name: params.name.trim().slice(0, 80),
    phone: params.phone.replace(/\D/g, '').slice(0, 20),
    skills: Array.from(new Set(params.skills.map((s) => s.trim()).filter(Boolean))).slice(0, 10),
    area: params.area.trim().slice(0, 80),
    experienceYears: Math.max(0, Math.min(60, Math.round(Number(params.experienceYears) || 0))),
    bio: (params.bio.trim() || `Experienced local service technician in ${params.area.trim()}, Bapatla.`).slice(0, 300),
    approvalStatus: 'PENDING',
    isAvailable: false,
    trialCoinsGranted: false,
    coinBalance: 0,
    totalEarnings: 0,
    completedJobs: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: params.nowIso,
    updatedAt: params.nowIso,
  };
}

/**
 * Validates and applies a technician availability toggle.
 * Prevents impersonation (`actorUid !== technician.uid`) and blocks PENDING, REJECTED, or
 * SUSPENDED technicians from turning online availability ON.
 */
export function validateTechnicianAvailabilityUpdate(params: {
  technician: TechnicianProfile | null;
  actorUid: string;
  nextAvailable: boolean;
  nowIso: string;
}): {
  valid: boolean;
  error?: string;
  updatedTechnician?: TechnicianProfile;
} {
  const { technician, actorUid, nextAvailable, nowIso } = params;
  if (!technician) {
    return { valid: false, error: 'Technician profile not found.' };
  }
  if (!actorUid || technician.uid !== actorUid) {
    return {
      valid: false,
      error: 'Security Violation: You can only update availability for your own authenticated UID.',
    };
  }
  if (nextAvailable && technician.approvalStatus !== 'APPROVED') {
    if (technician.approvalStatus === 'SUSPENDED') {
      return {
        valid: false,
        error: 'Your technician account is Suspended and cannot go online for job requests.',
      };
    }
    if (technician.approvalStatus === 'REJECTED') {
      return {
        valid: false,
        error: 'Your technician application was Rejected and cannot go online for job requests.',
      };
    }
    return {
      valid: false,
      error: 'Your technician account is Pending Admin Approval and cannot go online yet.',
    };
  }

  return {
    valid: true,
    updatedTechnician: {
      ...technician,
      isAvailable: nextAvailable,
      updatedAt: nowIso,
    },
  };
}

/**
 * Filters open customer requests to ONLY actionable requests for the signed-in technician:
 * 1. If technician is missing, legacy synthetic ID, PENDING, REJECTED, SUSPENDED, or unavailable (`!isAvailable`),
 *    returns `[]` immediately (removing all actionable requests from the screen).
 * 2. Otherwise returns only PENDING unassigned requests matching BOTH the technician's authorized
 *    service skills (`skills.includes(serviceId)`) AND authorized Bapatla area (`area === generalArea`),
 *    excluding self-created bookings.
 */
export function filterActionableTechnicianRequests(params: {
  technician: TechnicianProfile | null | undefined;
  bookings: Booking[];
}): Booking[] {
  const { technician, bookings } = params;
  if (!technician || !technician.uid || isLegacySyntheticId(technician.uid)) {
    return [];
  }
  if (technician.approvalStatus !== 'APPROVED' || !technician.isAvailable) {
    return [];
  }

  const normalizedTechArea = (technician.area || '').trim().toLowerCase();

  return bookings
    .filter((b) => {
      if (b.status !== 'PENDING' || b.technicianId !== '') return false;
      if (b.customerId === technician.uid) return false;
      if (!technician.skills.includes(b.serviceId)) return false;
      const normalizedBookingArea = (b.generalArea || '').trim().toLowerCase();
      if (!normalizedTechArea || normalizedBookingArea !== normalizedTechArea) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Filters bookings to strictly those assigned to the authenticated technician UID.
 */
export function filterAssignedTechnicianJobs(params: {
  technicianUid: string | null | undefined;
  bookings: Booking[];
}): Booking[] {
  const uid = (params.technicianUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) return [];
  return params.bookings
    .filter(
      (b) =>
        b.technicianId === uid &&
        ['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'CONFIRMED'].includes(b.status)
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/**
 * Filters immutable coin ledger transactions strictly to the authenticated technician UID.
 */
export function filterTechnicianCoinHistory(params: {
  technicianUid: string | null | undefined;
  coinTransactions: CoinTransaction[];
}): CoinTransaction[] {
  const uid = (params.technicianUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) return [];
  return params.coinTransactions
    .filter((tx) => tx.technicianId === uid)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Extracts private customer address/phone and optional problem photo ONLY when the booking is
 * assigned to `technicianUid` and in an accepted/active/completed state.
 */
export function extractPermittedCustomerDetailsForTechnician(params: {
  technicianUid: string | null | undefined;
  booking: Booking;
  privateDetailsMap: Record<string, BookingPrivateDetails>;
  protectedPhotosMap?: Record<string, BookingProtectedPhoto>;
}): {
  unlocked: boolean;
  details: BookingPrivateDetails | null;
  photo: BookingProtectedPhoto | null;
} {
  const uid = (params.technicianUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return { unlocked: false, details: null, photo: null };
  }
  const permitted = canViewProtectedCustomerDetails({
    viewerUid: uid,
    viewerRole: 'TECHNICIAN',
    booking: params.booking,
  });
  if (!permitted || params.booking.technicianId !== uid) {
    return { unlocked: false, details: null, photo: null };
  }
  return {
    unlocked: true,
    details: params.privateDetailsMap[params.booking.id] || null,
    photo: params.protectedPhotosMap?.[params.booking.id] || null,
  };
}

/**
 * Computes the technician's earnings breakdown according to the agreed accounting rule:
 * - `confirmedEarnings` and `confirmedJobsCount`: counted ONLY after customer confirmation (`CONFIRMED` / `BookingCompletionRecord`).
 * - `awaitingConfirmationAmount` and `awaitingConfirmationCount`: jobs in `WORK_COMPLETED` where labour charges were submitted
 *   by the technician and are currently awaiting customer confirmation.
 */
export function calculateTechnicianEarningsBreakdown(params: {
  technician: TechnicianProfile | null | undefined;
  bookings: Booking[];
  completionRecords?: BookingCompletionRecord[];
}): {
  confirmedEarnings: number;
  confirmedJobsCount: number;
  awaitingConfirmationAmount: number;
  awaitingConfirmationCount: number;
} {
  const tech = params.technician;
  if (!tech || !tech.uid) {
    return {
      confirmedEarnings: 0,
      confirmedJobsCount: 0,
      awaitingConfirmationAmount: 0,
      awaitingConfirmationCount: 0,
    };
  }

  const fromBookings = calculateVerifiedTechnicianEarnings(tech.uid, params.bookings);
  const myCompletions = (params.completionRecords || []).filter(
    (c) => c.technicianId === tech.uid && c.labourCharges > 0
  );
  const completionSum = myCompletions.reduce((sum, c) => sum + c.labourCharges, 0);

  const confirmedEarnings = Math.max(
    tech.totalEarnings || 0,
    fromBookings.totalEarnings,
    completionSum
  );
  const confirmedJobsCount = Math.max(
    tech.completedJobs || 0,
    fromBookings.completedJobs,
    myCompletions.length
  );

  const awaitingConfirmationJobs = params.bookings.filter(
    (b) => b.technicianId === tech.uid && b.status === 'WORK_COMPLETED' && b.labourCharges > 0
  );
  const awaitingConfirmationAmount = awaitingConfirmationJobs.reduce(
    (sum, b) => sum + b.labourCharges,
    0
  );

  return {
    confirmedEarnings,
    confirmedJobsCount,
    awaitingConfirmationAmount,
    awaitingConfirmationCount: awaitingConfirmationJobs.length,
  };
}

/**
 * Synchronous in-flight command lock for preventing duplicate taps before an async backend
 * transaction resolves.
 */
export function createDuplicateTapLock(): {
  tryAcquire: (key: string) => boolean;
  release: (key: string) => void;
  isLocked: (key: string) => boolean;
} {
  const activeKeys = new Set<string>();
  return {
    tryAcquire(key: string): boolean {
      const normalized = key.trim();
      if (!normalized || activeKeys.has(normalized)) {
        return false;
      }
      activeKeys.add(normalized);
      return true;
    },
    release(key: string): void {
      activeKeys.delete(key.trim());
    },
    isLocked(key: string): boolean {
      return activeKeys.has(key.trim());
    },
  };
}

/**
 * Rehydrates the complete technician workspace state on app restart strictly from persistent
 * backend records keyed by the authenticated Firebase UID.
 */
export function rehydrateTechnicianWorkspaceOnRestart(params: {
  authUid: string | null | undefined;
  users: UserProfile[];
  contacts: UserPrivateContact[];
  technicians: TechnicianProfile[];
  bookings: Booking[];
  privateDetailsMap: Record<string, BookingPrivateDetails>;
  protectedPhotosMap?: Record<string, BookingProtectedPhoto>;
  coinTransactions: CoinTransaction[];
  completionRecords?: BookingCompletionRecord[];
}): {
  authenticated: boolean;
  userProfile: UserProfile | null;
  contact: UserPrivateContact | null;
  technicianProfile: TechnicianProfile | null;
  actionableRequests: Booking[];
  assignedJobs: Booking[];
  unlockedDetailsByBookingId: Record<string, BookingPrivateDetails>;
  coinLedger: CoinTransaction[];
  earningsBreakdown: {
    confirmedEarnings: number;
    confirmedJobsCount: number;
    awaitingConfirmationAmount: number;
    awaitingConfirmationCount: number;
  };
} {
  const uid = (params.authUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return {
      authenticated: false,
      userProfile: null,
      contact: null,
      technicianProfile: null,
      actionableRequests: [],
      assignedJobs: [],
      unlockedDetailsByBookingId: {},
      coinLedger: [],
      earningsBreakdown: {
        confirmedEarnings: 0,
        confirmedJobsCount: 0,
        awaitingConfirmationAmount: 0,
        awaitingConfirmationCount: 0,
      },
    };
  }

  const userProfile = params.users.find((u) => u.uid === uid) || null;
  const contact = params.contacts.find((c) => c.uid === uid) || null;
  const technicianProfile = params.technicians.find((t) => t.uid === uid) || null;

  const actionableRequests = filterActionableTechnicianRequests({
    technician: technicianProfile,
    bookings: params.bookings,
  });

  const assignedJobs = filterAssignedTechnicianJobs({
    technicianUid: uid,
    bookings: params.bookings,
  });

  const unlockedDetailsByBookingId: Record<string, BookingPrivateDetails> = {};
  for (const job of assignedJobs) {
    const extracted = extractPermittedCustomerDetailsForTechnician({
      technicianUid: uid,
      booking: job,
      privateDetailsMap: params.privateDetailsMap,
      protectedPhotosMap: params.protectedPhotosMap,
    });
    if (extracted.unlocked && extracted.details) {
      unlockedDetailsByBookingId[job.id] = extracted.details;
    }
  }

  const coinLedger = filterTechnicianCoinHistory({
    technicianUid: uid,
    coinTransactions: params.coinTransactions,
  });

  const earningsBreakdown = calculateTechnicianEarningsBreakdown({
    technician: technicianProfile,
    bookings: params.bookings,
    completionRecords: params.completionRecords,
  });

  return {
    authenticated: true,
    userProfile,
    contact,
    technicianProfile,
    actionableRequests,
    assignedJobs,
    unlockedDetailsByBookingId,
    coinLedger,
    earningsBreakdown,
  };
}

/**
 * Genuine Concurrent Transactional Acceptance Store (Optimistic Concurrency Control / CAS).
 * Models Cloud Firestore's `runTransaction` with per-document revision numbers, asynchronous
 * microtask interleaving between read and commit phases (`await Promise.resolve()`), commit-time
 * version conflict detection, and automatic transaction retry on contention.
 *
 * Used to execute genuinely concurrent acceptance requests (`await Promise.all([reqA, reqB])`)
 * where both transactions read the same PENDING booking simultaneously before either commits.
 */
export class ConcurrentAcceptanceTransactionStore {
  private bookings = new Map<string, { data: Booking; version: number }>();
  private technicians = new Map<string, { data: TechnicianProfile; version: number }>();
  private coinLedger = new Map<string, { data: CoinTransaction; version: number }>();
  private privateDetails = new Map<string, BookingPrivateDetails>();
  private duplicateTapLock = createDuplicateTapLock();

  constructor(initial: {
    bookings: Booking[];
    technicians: TechnicianProfile[];
    privateDetails?: BookingPrivateDetails[];
    coinTransactions?: CoinTransaction[];
  }) {
    for (const b of initial.bookings) {
      this.bookings.set(b.id, { data: { ...b }, version: 1 });
    }
    for (const t of initial.technicians) {
      this.technicians.set(t.uid, { data: { ...t, skills: [...t.skills] }, version: 1 });
    }
    for (const d of initial.privateDetails || []) {
      this.privateDetails.set(d.bookingId, { ...d });
    }
    for (const tx of initial.coinTransactions || []) {
      this.coinLedger.set(tx.id, { data: { ...tx }, version: 1 });
    }
  }

  getBooking(bookingId: string): Booking | undefined {
    const entry = this.bookings.get(bookingId);
    return entry ? { ...entry.data } : undefined;
  }

  getTechnician(techUid: string): TechnicianProfile | undefined {
    const entry = this.technicians.get(techUid);
    return entry ? { ...entry.data, skills: [...entry.data.skills] } : undefined;
  }

  getCoinTransactions(): CoinTransaction[] {
    return Array.from(this.coinLedger.values()).map((e) => ({ ...e.data }));
  }

  /**
   * Simulates a UI tap on "Accept Job (1 Coin)" with synchronous duplicate-tap lock
   * plus transactional backend execution.
   */
  async tapAcceptJobWithGuard(
    bookingId: string,
    technicianUid: string,
    nowIso = new Date().toISOString()
  ): Promise<{
    success: boolean;
    error?: string;
    unlockedDetails?: BookingPrivateDetails | null;
    attempts: number;
  }> {
    const tapKey = `tap:${bookingId}:${technicianUid}`;
    if (!this.duplicateTapLock.tryAcquire(tapKey)) {
      return {
        success: false,
        error: 'Duplicate tap ignored: Your acceptance request for this booking is already in progress.',
        attempts: 0,
      };
    }
    try {
      return await this.acceptBookingTransaction(bookingId, technicianUid, nowIso);
    } finally {
      this.duplicateTapLock.release(tapKey);
    }
  }

  /**
   * Executes an optimistic-concurrency transaction with CAS conflict detection and automatic retry,
   * yielding across the async microtask queue between read and commit so concurrent `Promise.all`
   * callers genuinely overlap on the read snapshot.
   */
  async acceptBookingTransaction(
    bookingId: string,
    technicianUid: string,
    nowIso = new Date().toISOString(),
    maxRetries = 5
  ): Promise<{
    success: boolean;
    error?: string;
    unlockedDetails?: BookingPrivateDetails | null;
    attempts: number;
  }> {
    const deterministic = buildDeterministicCommandKey('ACCEPT_BOOKING', bookingId, technicianUid);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      // Phase 1: Snapshot reads with current document versions
      const bookingEntry = this.bookings.get(bookingId);
      const techEntry = this.technicians.get(technicianUid);
      const txEntry = this.coinLedger.get(deterministic.docId);

      const readBookingVersion = bookingEntry?.version ?? 0;
      const readTechVersion = techEntry?.version ?? 0;
      const readTxVersion = txEntry?.version ?? 0;

      // Yield across microtask queue so concurrent transactions read the same PENDING state simultaneously
      await Promise.resolve();

      if (!bookingEntry) {
        return { success: false, error: 'Booking does not exist.', attempts: attempt };
      }
      if (!techEntry) {
        return { success: false, error: 'Technician profile not found.', attempts: attempt };
      }
      if (txEntry) {
        return {
          success: false,
          error: 'Duplicate acceptance request detected (idempotency guard). No extra coin was deducted.',
          attempts: attempt,
        };
      }

      const existingIds = new Set<string>(this.coinLedger.keys());
      const outcome = executeAtomicBookingAcceptance({
        booking: bookingEntry.data,
        technician: techEntry.data,
        nowIso,
        existingLedgerIds: existingIds,
      });

      if (!outcome.success || !outcome.coinTransaction) {
        return {
          success: false,
          error: outcome.error || 'Not eligible to accept this booking.',
          attempts: attempt,
        };
      }

      // Phase 2: Atomic compare-and-swap (CAS) commit verification
      const currentBookingVersion = this.bookings.get(bookingId)?.version ?? 0;
      const currentTechVersion = this.technicians.get(technicianUid)?.version ?? 0;
      const currentTxVersion = this.coinLedger.get(deterministic.docId)?.version ?? 0;

      if (
        currentBookingVersion !== readBookingVersion ||
        currentTechVersion !== readTechVersion ||
        currentTxVersion !== readTxVersion
      ) {
        // Optimistic concurrency conflict detected: another transaction committed while we were in-flight.
        // Retry transaction against latest committed state (just like Firestore runTransaction).
        continue;
      }

      // Commit all writes atomically
      this.bookings.set(bookingId, {
        data: outcome.updatedBooking,
        version: currentBookingVersion + 1,
      });
      this.technicians.set(technicianUid, {
        data: outcome.updatedTechnician,
        version: currentTechVersion + 1,
      });
      this.coinLedger.set(deterministic.docId, {
        data: outcome.coinTransaction,
        version: 1,
      });

      const unlockedDetails = this.privateDetails.get(bookingId) || null;
      return {
        success: true,
        unlockedDetails,
        attempts: attempt,
      };
    }

    return {
      success: false,
      error: 'Transaction aborted due to high contention after maximum retries.',
      attempts: maxRetries,
    };
  }
}

// ============================================================================
// Admin Governance, Directory, Service Catalog, & Persistent Reporting Engine
// ============================================================================

/**
 * Evaluates trusted Admin authorization strictly from server-verified claims and
 * provisioned `/admins/{uid}` records.
 *
 * CRITICAL SECURITY INVARIANT:
 * - Hard-coded owner email (`sumanth.bandela11@gmail.com`) is NEVER an authentication
 *   or authorization substitute: having that email without a provisioned `/admins/{uid}`
 *   record or server-signed `admin: true` claim returns `isAdmin: false`.
 * - A verified Firebase Auth session for `PROVISIONED_OWNER_BOOTSTRAP_EMAIL` only sets
 *   `canBootstrapFirstAdmin: true` so the owner can execute the server-verified `/admins/{uid}`
 *   provisioning transaction.
 */
export function evaluateProvisionedAdminAuthorization(params: {
  authUid: string | null | undefined;
  tokenEmail?: string | null;
  tokenEmailVerified?: boolean;
  hasCustomAdminClaim?: boolean;
  provisionedAdmins: AdminRecord[];
}): {
  isAdmin: boolean;
  canBootstrapFirstAdmin: boolean;
  matchedAdminRecord: AdminRecord | null;
} {
  const uid = (params.authUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return {
      isAdmin: false,
      canBootstrapFirstAdmin: false,
      matchedAdminRecord: null,
    };
  }

  const matchedRecord = params.provisionedAdmins.find((a) => a.uid === uid) || null;
  if (matchedRecord) {
    return {
      isAdmin: true,
      canBootstrapFirstAdmin: false,
      matchedAdminRecord: matchedRecord,
    };
  }

  if (params.hasCustomAdminClaim === true) {
    return {
      isAdmin: true,
      canBootstrapFirstAdmin: false,
      matchedAdminRecord: {
        uid,
        email: (params.tokenEmail || '').trim(),
        provisionedBy: 'CUSTOM_CLAIM',
        addedAt: new Date(0).toISOString(),
      },
    };
  }

  const normalizedEmail = (params.tokenEmail || '').trim().toLowerCase();
  const canBootstrapFirstAdmin =
    params.tokenEmailVerified === true &&
    normalizedEmail === PROVISIONED_OWNER_BOOTSTRAP_EMAIL.toLowerCase();

  return {
    isAdmin: false,
    canBootstrapFirstAdmin,
    matchedAdminRecord: null,
  };
}

/**
 * Enforces that an operation caller has authenticated, server-verified Admin authorization.
 * Denies unauthenticated callers, legacy synthetic IDs, and non-admin accounts even if they
 * bypass the UI screen and invoke the underlying operation directly.
 */
export function assertServerVerifiedAdmin(params: {
  actorUid: string | null | undefined;
  isServerVerifiedAdmin?: boolean;
  provisionedAdmins?: AdminRecord[];
  hasCustomAdminClaim?: boolean;
}): { authorized: boolean; adminUid: string; error?: string } {
  const uid = (params.actorUid || '').trim();
  if (!uid || isLegacySyntheticId(uid)) {
    return {
      authorized: false,
      adminUid: '',
      error:
        'PERMISSION_DENIED: You must be signed in with a real Firebase Authentication UID to perform Admin operations.',
    };
  }

  const inRoster = Boolean(params.provisionedAdmins?.some((a) => a.uid === uid));
  const verified =
    params.isServerVerifiedAdmin === true ||
    params.hasCustomAdminClaim === true ||
    inRoster;

  if (!verified) {
    return {
      authorized: false,
      adminUid: uid,
      error: `PERMISSION_DENIED: Account "${uid}" is not an authorized Admin in /admins/{uid}. Non-admin accounts cannot access protected data or execute admin operations.`,
    };
  }

  return { authorized: true, adminUid: uid };
}

export interface AdminCustomerDirectoryItem {
  profile: UserProfile;
  privateContact: UserPrivateContact | null;
  bookingsCount: number;
  confirmedBookingsCount: number;
}

export interface PaginatedDirectoryResult<T> {
  authorized: boolean;
  error?: string;
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}

/**
 * Loads and paginates customer records from the shared database with search and
 * appropriate private-data access (`/users/{uid}/private/contact` exposed ONLY to verified Admins).
 */
export function queryAdminCustomerDirectory(params: {
  actorUid: string | null | undefined;
  isServerVerifiedAdmin: boolean;
  users: UserProfile[];
  privateContactsMap?: Record<string, UserPrivateContact>;
  bookings?: Booking[];
  searchQuery?: string;
  roleFilter?: 'ALL' | 'CUSTOMER' | 'TECHNICIAN' | 'ADMIN';
  areaFilter?: string;
  page?: number;
  pageSize?: number;
}): PaginatedDirectoryResult<AdminCustomerDirectoryItem> {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.actorUid,
    isServerVerifiedAdmin: params.isServerVerifiedAdmin,
  });
  const pageSize = Math.max(1, Math.min(50, Math.trunc(Number(params.pageSize) || 10)));

  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
      items: [],
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };
  }

  const q = (params.searchQuery || '').trim().toLowerCase();
  const roleFilter = params.roleFilter || 'ALL';
  const areaFilter = (params.areaFilter || 'ALL').trim();
  const bookingsList = params.bookings || [];
  const contactsMap = params.privateContactsMap || {};

  const enriched: AdminCustomerDirectoryItem[] = params.users
    .filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (areaFilter !== 'ALL' && u.area !== areaFilter) return false;
      if (!q) return true;
      const contact = contactsMap[u.uid];
      const haystack = [
        u.uid,
        u.name,
        u.email || '',
        u.area,
        u.role,
        contact?.phone || '',
        contact?.email || '',
        contact?.defaultAddress || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map((u) => {
      const userBookings = bookingsList.filter((b) => b.customerId === u.uid);
      const confirmedCount = userBookings.filter((b) => b.status === 'CONFIRMED').length;
      return {
        profile: u,
        privateContact: contactsMap[u.uid] || null,
        bookingsCount: userBookings.length,
        confirmedBookingsCount: confirmedCount,
      };
    });

  const totalItems = enriched.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(totalPages, Math.trunc(Number(params.page) || 1)));
  const startIdx = (safePage - 1) * pageSize;
  const items = enriched.slice(startIdx, startIdx + pageSize);

  return {
    authorized: true,
    items,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

/**
 * Loads and paginates technician records from the shared database with search,
 * approval status filtering, and locality filtering, gated on verified Admin authorization.
 */
export function queryAdminTechnicianDirectory(params: {
  actorUid: string | null | undefined;
  isServerVerifiedAdmin: boolean;
  technicians: TechnicianProfile[];
  searchQuery?: string;
  statusFilter?: 'ALL' | ApprovalStatus;
  areaFilter?: string;
  page?: number;
  pageSize?: number;
}): PaginatedDirectoryResult<TechnicianProfile> {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.actorUid,
    isServerVerifiedAdmin: params.isServerVerifiedAdmin,
  });
  const pageSize = Math.max(1, Math.min(50, Math.trunc(Number(params.pageSize) || 10)));

  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
      items: [],
      page: 1,
      pageSize,
      totalItems: 0,
      totalPages: 1,
      hasPrevPage: false,
      hasNextPage: false,
    };
  }

  const q = (params.searchQuery || '').trim().toLowerCase();
  const statusFilter = params.statusFilter || 'ALL';
  const areaFilter = (params.areaFilter || 'ALL').trim();

  const filtered = params.technicians
    .filter((tech) => {
      if (statusFilter !== 'ALL' && tech.approvalStatus !== statusFilter) return false;
      if (areaFilter !== 'ALL' && tech.area !== areaFilter) return false;
      if (!q) return true;
      const haystack = [
        tech.uid,
        tech.name,
        tech.phone,
        tech.area,
        tech.approvalStatus,
        tech.skills.join(' '),
        tech.bio,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => {
      // Prioritize PENDING first so Admin sees actionable approvals at the top
      if (a.approvalStatus === 'PENDING' && b.approvalStatus !== 'PENDING') return -1;
      if (b.approvalStatus === 'PENDING' && a.approvalStatus !== 'PENDING') return 1;
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    });

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.max(1, Math.min(totalPages, Math.trunc(Number(params.page) || 1)));
  const startIdx = (safePage - 1) * pageSize;
  const items = filtered.slice(startIdx, startIdx + pageSize);

  return {
    authorized: true,
    items,
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    hasPrevPage: safePage > 1,
    hasNextPage: safePage < totalPages,
  };
}

/**
 * Executes an authorized Admin technician status transition (`APPROVED`, `REJECTED`, or `SUSPENDED`):
 * - Requires server-verified Admin authorization.
 * - For `APPROVED`: grants `INITIAL_TRIAL_COINS = 3` at most ONCE ever (`trialCoinsGranted: true`
 *   and deterministic ledger entry `ctx_trial_${uid}`).
 * - For `REJECTED` or `SUSPENDED`: forces `isAvailable: false`, preserves `trialCoinsGranted`
 *   and `coinBalance`, and records an immutable `AdminAuditRecord`.
 */
export function executeAdminTechnicianStatusDecision(params: {
  technician: TechnicianProfile;
  decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  adminUid: string;
  isAdminAuthorized: boolean;
  nowIso: string;
  reasonNote?: string;
  existingLedgerIds?: Set<string>;
  alreadyReceivedTrialCoins?: boolean;
}): {
  success: boolean;
  error?: string;
  updatedTechnician: TechnicianProfile;
  coinTransaction?: CoinTransaction;
  auditRecord?: AdminAuditRecord;
  trialCoinsGrantedNow: number;
} {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.adminUid,
    isServerVerifiedAdmin: params.isAdminAuthorized,
  });

  if (!authCheck.authorized) {
    return {
      success: false,
      error: authCheck.error,
      updatedTechnician: params.technician,
      trialCoinsGrantedNow: 0,
    };
  }

  const { technician, decision, nowIso } = params;
  const noteText = (params.reasonNote || '').trim().slice(0, 200);
  const noteSuffix = noteText ? ` (Note: ${noteText})` : '';

  if (decision === 'APPROVED') {
    const deterministic = buildDeterministicCommandKey(
      'TRIAL_GRANT',
      technician.uid,
      authCheck.adminUid
    );
    const alreadyInLedger = Boolean(params.existingLedgerIds?.has(deterministic.docId));
    const approvalResult = approveTechnicianWithTrialCoins({
      technician,
      adminUid: authCheck.adminUid,
      nowIso,
      alreadyReceivedTrialCoins:
        technician.trialCoinsGranted === true ||
        params.alreadyReceivedTrialCoins === true ||
        alreadyInLedger,
    });

    return {
      success: true,
      updatedTechnician: approvalResult.updatedTechnician,
      coinTransaction: approvalResult.coinTransaction,
      auditRecord: approvalResult.auditRecord,
      trialCoinsGrantedNow: approvalResult.coinTransaction ? approvalResult.coinTransaction.delta : 0,
    };
  }

  if (decision === 'REJECTED') {
    const updatedTechnician: TechnicianProfile = {
      ...technician,
      approvalStatus: 'REJECTED',
      isAvailable: false,
      trialCoinsGranted: technician.trialCoinsGranted === true,
      updatedAt: nowIso,
    };
    const auditRecord: AdminAuditRecord = {
      id: `audit_reject_${technician.uid}_${Date.parse(nowIso) || Date.now()}`,
      action: 'TECHNICIAN_REJECTED',
      actorUid: authCheck.adminUid,
      targetId: technician.uid,
      summary: `Rejected technician application for ${technician.name} and disabled availability${noteSuffix}.`.slice(
        0,
        400
      ),
      idempotencyKey: `audit_reject:${technician.uid}:${nowIso}`,
      createdAt: nowIso,
    };
    return {
      success: true,
      updatedTechnician,
      auditRecord,
      trialCoinsGrantedNow: 0,
    };
  }

  if (decision === 'SUSPENDED') {
    const updatedTechnician: TechnicianProfile = {
      ...technician,
      approvalStatus: 'SUSPENDED',
      isAvailable: false,
      trialCoinsGranted: technician.trialCoinsGranted === true,
      updatedAt: nowIso,
    };
    const auditRecord: AdminAuditRecord = {
      id: `audit_suspend_${technician.uid}_${Date.parse(nowIso) || Date.now()}`,
      action: 'TECHNICIAN_SUSPENDED',
      actorUid: authCheck.adminUid,
      targetId: technician.uid,
      summary: `Suspended technician ${technician.name} and forced online availability OFF${noteSuffix}.`.slice(
        0,
        400
      ),
      idempotencyKey: `audit_suspend:${technician.uid}:${nowIso}`,
      createdAt: nowIso,
    };
    return {
      success: true,
      updatedTechnician,
      auditRecord,
      trialCoinsGrantedNow: 0,
    };
  }

  return {
    success: false,
    error: `Unsupported technician status decision: ${String(decision)}`,
    updatedTechnician: technician,
    trialCoinsGrantedNow: 0,
  };
}

/**
 * Validates service category creation or editing inputs (names, descriptions, fee, sortOrder).
 */
export function validateServiceCategoryMutation(params: {
  id?: string;
  nameEn: string;
  nameTe?: string;
  descriptionEn?: string;
  descriptionTe?: string;
  baseInspectionFee: number;
  sortOrder?: number;
  iconName?: string;
  imageUrl?: string;
  enabled?: boolean;
}): {
  valid: boolean;
  error?: string;
  sanitized?: ServiceCategory;
} {
  const nameEn = (params.nameEn || '').trim();
  if (nameEn.length < 2 || nameEn.length > 60) {
    return {
      valid: false,
      error: 'Service name (English) must be between 2 and 60 characters.',
    };
  }

  const rawId = (params.id || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(
    /^_+|_+$/g,
    ''
  );
  if (!rawId || rawId.length < 2 || rawId.length > 60 || !/^[a-zA-Z0-9_-]+$/.test(rawId)) {
    return {
      valid: false,
      error: 'Service ID must contain valid alphanumeric characters.',
    };
  }

  const nameTe = ((params.nameTe || '').trim() || nameEn).slice(0, 80);
  const descriptionEn = (
    (params.descriptionEn || '').trim() || `Verified doorstep ${nameEn} service in Bapatla.`
  ).slice(0, 200);
  const descriptionTe = ((params.descriptionTe || '').trim() || nameTe).slice(0, 200);

  const fee = Number(params.baseInspectionFee);
  if (!Number.isFinite(fee) || !Number.isInteger(fee) || fee < 0 || fee > 50000) {
    return {
      valid: false,
      error: 'Base inspection/visit fee must be a whole integer between ₹0 and ₹50,000.',
    };
  }

  const sortOrder =
    params.sortOrder !== undefined ? Math.trunc(Number(params.sortOrder)) : 1;
  if (!Number.isFinite(sortOrder) || sortOrder < 1 || sortOrder > 999) {
    return {
      valid: false,
      error: 'Service sortOrder must be an integer between 1 and 999.',
    };
  }

  return {
    valid: true,
    sanitized: {
      id: rawId,
      nameEn,
      nameTe,
      descriptionEn,
      descriptionTe,
      baseInspectionFee: fee,
      iconName: (params.iconName || 'Wrench').trim().slice(0, 40),
      imageUrl: params.imageUrl || '/images/services/electrician.jpg',
      enabled: params.enabled !== undefined ? Boolean(params.enabled) : true,
      sortOrder,
    },
  };
}

/**
 * Computes deterministic reordered `ServiceCategory[]` when an Admin moves a service UP or DOWN
 * (or assigns a new sortOrder) and returns the affected services + immutable `AdminAuditRecord`.
 */
export function executeAdminServiceReorder(params: {
  services: ServiceCategory[];
  serviceId: string;
  direction: 'UP' | 'DOWN';
  adminUid: string;
  isAdminAuthorized: boolean;
  nowIso: string;
}): {
  success: boolean;
  error?: string;
  updatedServices: ServiceCategory[];
  changedServices: ServiceCategory[];
  auditRecord?: AdminAuditRecord;
} {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.adminUid,
    isServerVerifiedAdmin: params.isAdminAuthorized,
  });
  if (!authCheck.authorized) {
    return {
      success: false,
      error: authCheck.error,
      updatedServices: params.services,
      changedServices: [],
    };
  }

  const sorted = [...params.services].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
  );
  const idx = sorted.findIndex((s) => s.id === params.serviceId);
  if (idx === -1) {
    return {
      success: false,
      error: `Service "${params.serviceId}" not found.`,
      updatedServices: params.services,
      changedServices: [],
    };
  }

  const swapIdx = params.direction === 'UP' ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= sorted.length) {
    return {
      success: false,
      error: `Service "${sorted[idx].nameEn}" is already at the ${params.direction === 'UP' ? 'top' : 'bottom'} of the catalogue.`,
      updatedServices: sorted,
      changedServices: [],
    };
  }

  // Normalize sequential sortOrder 1..N and swap the two adjacent items
  const reordered = sorted.map((s, i) => ({ ...s, sortOrder: i + 1 }));
  const temp = reordered[idx];
  reordered[idx] = {
    ...reordered[swapIdx],
    sortOrder: idx + 1,
    updatedAt: params.nowIso,
  };
  reordered[swapIdx] = {
    ...temp,
    sortOrder: swapIdx + 1,
    updatedAt: params.nowIso,
  };

  const changedServices = [reordered[idx], reordered[swapIdx]];
  const auditRecord: AdminAuditRecord = {
    id: `audit_srv_order_${params.serviceId}_${Date.parse(params.nowIso) || Date.now()}`,
    action: 'SERVICE_REORDERED',
    actorUid: authCheck.adminUid,
    targetId: params.serviceId,
    summary: `Reordered service "${temp.nameEn}" ${params.direction} to position #${swapIdx + 1}.`,
    idempotencyKey: `srv_reorder:${params.serviceId}:${params.direction}:${params.nowIso}`,
    createdAt: params.nowIso,
  };

  return {
    success: true,
    updatedServices: reordered,
    changedServices,
    auditRecord,
  };
}

/**
 * Filters bookings for the Admin console with status filtering, search, and
 * permitted private details (`/bookings/{bookingId}/private/details` & `photo`).
 */
export function filterAdminBookingsWithPrivateAccess(params: {
  actorUid: string | null | undefined;
  isServerVerifiedAdmin: boolean;
  bookings: Booking[];
  privateDetailsMap: Record<string, BookingPrivateDetails>;
  protectedPhotosMap?: Record<string, BookingProtectedPhoto>;
  statusFilter?: 'ALL' | BookingStatus;
  searchQuery?: string;
}): {
  authorized: boolean;
  error?: string;
  items: Array<{
    booking: Booking;
    privateDetails: BookingPrivateDetails | null;
    protectedPhoto: BookingProtectedPhoto | null;
  }>;
} {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.actorUid,
    isServerVerifiedAdmin: params.isServerVerifiedAdmin,
  });
  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
      items: [],
    };
  }

  const statusFilter = params.statusFilter || 'ALL';
  const q = (params.searchQuery || '').trim().toLowerCase();

  const items = params.bookings
    .filter((bk) => {
      if (statusFilter !== 'ALL' && bk.status !== statusFilter) return false;
      if (!q) return true;
      const details = params.privateDetailsMap[bk.id];
      const haystack = [
        bk.id,
        bk.customerName,
        bk.customerId,
        bk.technicianName,
        bk.technicianId,
        bk.serviceNameEn,
        bk.serviceNameTe,
        bk.generalArea,
        bk.problemDescription,
        bk.preferredDate,
        bk.status,
        details?.customerPhone || '',
        details?.fullAddress || '',
        details?.landmark || '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .map((bk) => ({
      booking: bk,
      privateDetails: params.privateDetailsMap[bk.id] || null,
      protectedPhoto: params.protectedPhotosMap?.[bk.id] || null,
    }));

  return {
    authorized: true,
    items,
  };
}

export type AdminReportDatePreset =
  | 'ALL_TIME'
  | 'TODAY'
  | 'LAST_7_DAYS'
  | 'LAST_30_DAYS'
  | 'CUSTOM';

export interface AdminPersistentReport {
  authorized: boolean;
  error?: string;
  dateRange: {
    preset: AdminReportDatePreset;
    startDateIso: string | null;
    endDateIso: string | null;
    label: string;
  };
  bookingMetrics: {
    totalBookingsInRange: number;
    pendingRequestsCount: number;
    assignedJobsCount: number;
    assignedBreakdown: {
      acceptedCount: number;
      inProgressCount: number;
      workCompletedAwaitingConfirmationCount: number;
    };
    confirmedJobsCount: number;
    cancelledRequestsCount: number;
  };
  technicianDirectLabourMetrics: {
    /**
     * Sum of customer-confirmed technician labour charges (`CONFIRMED` bookings / `/booking_completions`).
     * IMPORTANT: Settled directly between customer and technician. NOT platform revenue or confirmed platform payment.
     */
    confirmedTechnicianLabourEarnings: number;
    awaitingCustomerConfirmationLabourAmount: number;
    isPlatformRevenue: false;
    isConfirmedPlatformPayment: false;
    platformCommissionRevenue: 0;
    settlementModel: 'DIRECT_CUSTOMER_TO_TECHNICIAN';
    accountingDisclaimer: string;
  };
  coinActivity: {
    totalTransactionsCount: number;
    trialCoinsGrantedCount: number;
    trialCoinsGrantedTotal: number;
    adminRechargeCount: number;
    adminCoinsAddedTotal: number;
    adminDeductionCount: number;
    adminCoinsDeductedTotal: number;
    jobAcceptanceCount: number;
    jobAcceptanceCoinsSpentTotal: number;
    netCoinDelta: number;
    currentActiveWalletBalanceTotal: number;
  };
}

/**
 * Builds an authoritative Admin report strictly from persistent records (`bookings`,
 * `completionRecords`, `coinTransactions`, `technicians`) filtered by the selected date range.
 *
 * CRITICAL ACCOUNTING RULE:
 * - Never presents technician labour earnings as platform revenue or confirmed platform payment.
 * - Explicitly sets `isPlatformRevenue: false`, `isConfirmedPlatformPayment: false`, and
 *   `platformCommissionRevenue: 0`.
 */
export function buildAdminPersistentReport(params: {
  actorUid: string | null | undefined;
  isServerVerifiedAdmin: boolean;
  bookings: Booking[];
  completionRecords: BookingCompletionRecord[];
  coinTransactions: CoinTransaction[];
  technicians: TechnicianProfile[];
  preset?: AdminReportDatePreset;
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
  referenceNowIso?: string;
}): AdminPersistentReport {
  const authCheck = assertServerVerifiedAdmin({
    actorUid: params.actorUid,
    isServerVerifiedAdmin: params.isServerVerifiedAdmin,
  });

  const preset = params.preset || 'ALL_TIME';
  const refDate = params.referenceNowIso ? new Date(params.referenceNowIso) : new Date();
  const refValid = !Number.isNaN(refDate.getTime()) ? refDate : new Date();

  let startMs: number | null = null;
  let endMs: number | null = null;
  let startDateIso: string | null = null;
  let endDateIso: string | null = null;
  let label = 'All Time (Complete Persistent History)';

  const toStartOfDayUtcMs = (ymd: string): number | null => {
    const trimmed = (ymd || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const ms = Date.parse(`${trimmed}T00:00:00.000Z`);
    return Number.isNaN(ms) ? null : ms;
  };

  const toEndOfDayUtcMs = (ymd: string): number | null => {
    const trimmed = (ymd || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
    const ms = Date.parse(`${trimmed}T23:59:59.999Z`);
    return Number.isNaN(ms) ? null : ms;
  };

  const refYmd = refValid.toISOString().slice(0, 10);

  if (preset === 'TODAY') {
    startMs = toStartOfDayUtcMs(refYmd);
    endMs = toEndOfDayUtcMs(refYmd);
    startDateIso = refYmd;
    endDateIso = refYmd;
    label = `Today (${refYmd})`;
  } else if (preset === 'LAST_7_DAYS') {
    const startObj = new Date(refValid.getTime() - 6 * 24 * 60 * 60 * 1000);
    const startYmd = startObj.toISOString().slice(0, 10);
    startMs = toStartOfDayUtcMs(startYmd);
    endMs = toEndOfDayUtcMs(refYmd);
    startDateIso = startYmd;
    endDateIso = refYmd;
    label = `Last 7 Days (${startYmd} to ${refYmd})`;
  } else if (preset === 'LAST_30_DAYS') {
    const startObj = new Date(refValid.getTime() - 29 * 24 * 60 * 60 * 1000);
    const startYmd = startObj.toISOString().slice(0, 10);
    startMs = toStartOfDayUtcMs(startYmd);
    endMs = toEndOfDayUtcMs(refYmd);
    startDateIso = startYmd;
    endDateIso = refYmd;
    label = `Last 30 Days (${startYmd} to ${refYmd})`;
  } else if (preset === 'CUSTOM') {
    startMs = params.customStartDate ? toStartOfDayUtcMs(params.customStartDate) : null;
    endMs = params.customEndDate ? toEndOfDayUtcMs(params.customEndDate) : null;
    startDateIso = params.customStartDate || null;
    endDateIso = params.customEndDate || null;
    label = `Custom Range (${startDateIso || 'Start'} to ${endDateIso || 'Now'})`;
  }

  const isWithinRange = (isoStr: string | undefined): boolean => {
    if (startMs === null && endMs === null) return true;
    if (!isoStr) return false;
    let ms = Date.parse(isoStr);
    if (Number.isNaN(ms) && /^\d{4}-\d{2}-\d{2}$/.test(isoStr.trim())) {
      ms = Date.parse(`${isoStr.trim()}T12:00:00.000Z`);
    }
    if (Number.isNaN(ms)) return false;
    if (startMs !== null && ms < startMs) return false;
    if (endMs !== null && ms > endMs) return false;
    return true;
  };

  if (!authCheck.authorized) {
    return {
      authorized: false,
      error: authCheck.error,
      dateRange: { preset, startDateIso, endDateIso, label },
      bookingMetrics: {
        totalBookingsInRange: 0,
        pendingRequestsCount: 0,
        assignedJobsCount: 0,
        assignedBreakdown: {
          acceptedCount: 0,
          inProgressCount: 0,
          workCompletedAwaitingConfirmationCount: 0,
        },
        confirmedJobsCount: 0,
        cancelledRequestsCount: 0,
      },
      technicianDirectLabourMetrics: {
        confirmedTechnicianLabourEarnings: 0,
        awaitingCustomerConfirmationLabourAmount: 0,
        isPlatformRevenue: false,
        isConfirmedPlatformPayment: false,
        platformCommissionRevenue: 0,
        settlementModel: 'DIRECT_CUSTOMER_TO_TECHNICIAN',
        accountingDisclaimer:
          'Technician labour earnings are direct customer-to-technician offline/UPI settlements. They are NOT Mana Experts platform revenue and NOT confirmed platform payment.',
      },
      coinActivity: {
        totalTransactionsCount: 0,
        trialCoinsGrantedCount: 0,
        trialCoinsGrantedTotal: 0,
        adminRechargeCount: 0,
        adminCoinsAddedTotal: 0,
        adminDeductionCount: 0,
        adminCoinsDeductedTotal: 0,
        jobAcceptanceCount: 0,
        jobAcceptanceCoinsSpentTotal: 0,
        netCoinDelta: 0,
        currentActiveWalletBalanceTotal: 0,
      },
    };
  }

  const bookingsInRange = params.bookings.filter((b) =>
    isWithinRange(b.createdAt || b.updatedAt || b.preferredDate)
  );

  const pendingRequestsCount = bookingsInRange.filter((b) => b.status === 'PENDING').length;
  const acceptedCount = bookingsInRange.filter((b) => b.status === 'ACCEPTED').length;
  const inProgressCount = bookingsInRange.filter((b) => b.status === 'IN_PROGRESS').length;
  const workCompletedBookings = bookingsInRange.filter((b) => b.status === 'WORK_COMPLETED');
  const workCompletedAwaitingConfirmationCount = workCompletedBookings.length;
  const assignedJobsCount =
    acceptedCount + inProgressCount + workCompletedAwaitingConfirmationCount;
  const confirmedBookingsInRange = bookingsInRange.filter((b) => b.status === 'CONFIRMED');
  const cancelledRequestsCount = bookingsInRange.filter((b) => b.status === 'CANCELLED').length;

  const completionsInRange = params.completionRecords.filter((c) =>
    isWithinRange(c.confirmedAt)
  );

  // Merge confirmed bookings & completion records by bookingId so each confirmed job is counted once
  const confirmedLabourByBookingId = new Map<string, number>();
  for (const bk of confirmedBookingsInRange) {
    if (bk.labourCharges > 0) {
      confirmedLabourByBookingId.set(bk.id, bk.labourCharges);
    }
  }
  for (const comp of completionsInRange) {
    if (comp.labourCharges > 0) {
      confirmedLabourByBookingId.set(comp.bookingId, comp.labourCharges);
    }
  }

  const confirmedJobsCount = Math.max(
    confirmedBookingsInRange.length,
    confirmedLabourByBookingId.size
  );
  let confirmedTechnicianLabourEarnings = 0;
  confirmedLabourByBookingId.forEach((amt) => {
    confirmedTechnicianLabourEarnings += amt;
  });

  const awaitingCustomerConfirmationLabourAmount = workCompletedBookings.reduce(
    (sum, b) => sum + (Number(b.labourCharges) || 0),
    0
  );

  const txInRange = params.coinTransactions.filter((tx) => isWithinRange(tx.createdAt));

  let trialCoinsGrantedCount = 0;
  let trialCoinsGrantedTotal = 0;
  let adminRechargeCount = 0;
  let adminCoinsAddedTotal = 0;
  let adminDeductionCount = 0;
  let adminCoinsDeductedTotal = 0;
  let jobAcceptanceCount = 0;
  let jobAcceptanceCoinsSpentTotal = 0;
  let netCoinDelta = 0;

  for (const tx of txInRange) {
    const d = Math.trunc(Number(tx.delta) || 0);
    netCoinDelta += d;
    if (tx.reason === 'INITIAL_APPROVAL_TRIAL_COINS' && d > 0) {
      trialCoinsGrantedCount++;
      trialCoinsGrantedTotal += d;
    } else if (tx.reason === 'ADMIN_RECHARGE' && d > 0) {
      adminRechargeCount++;
      adminCoinsAddedTotal += d;
    } else if (tx.reason === 'ADMIN_DEDUCTION' && d < 0) {
      adminDeductionCount++;
      adminCoinsDeductedTotal += Math.abs(d);
    } else if (tx.reason === 'JOB_ACCEPTANCE_DEDUCTION' && d < 0) {
      jobAcceptanceCount++;
      jobAcceptanceCoinsSpentTotal += Math.abs(d);
    }
  }

  const currentActiveWalletBalanceTotal = params.technicians.reduce(
    (sum, t) => sum + Math.max(0, Math.trunc(Number(t.coinBalance) || 0)),
    0
  );

  return {
    authorized: true,
    dateRange: {
      preset,
      startDateIso,
      endDateIso,
      label,
    },
    bookingMetrics: {
      totalBookingsInRange: bookingsInRange.length,
      pendingRequestsCount,
      assignedJobsCount,
      assignedBreakdown: {
        acceptedCount,
        inProgressCount,
        workCompletedAwaitingConfirmationCount,
      },
      confirmedJobsCount,
      cancelledRequestsCount,
    },
    technicianDirectLabourMetrics: {
      confirmedTechnicianLabourEarnings,
      awaitingCustomerConfirmationLabourAmount,
      isPlatformRevenue: false,
      isConfirmedPlatformPayment: false,
      platformCommissionRevenue: 0,
      settlementModel: 'DIRECT_CUSTOMER_TO_TECHNICIAN',
      accountingDisclaimer:
        'Technician labour earnings reflect customer-confirmed doorstep work settled directly between customer and technician (Cash/UPI). They are NOT platform revenue and NOT confirmed platform payment.',
    },
    coinActivity: {
      totalTransactionsCount: txInRange.length,
      trialCoinsGrantedCount,
      trialCoinsGrantedTotal,
      adminRechargeCount,
      adminCoinsAddedTotal,
      adminDeductionCount,
      adminCoinsDeductedTotal,
      jobAcceptanceCount,
      jobAcceptanceCoinsSpentTotal,
      netCoinDelta,
      currentActiveWalletBalanceTotal,
    },
  };
}

/**
 * Genuine Concurrent Transactional Admin Workflow Store (Optimistic Concurrency Control / CAS).
 * Models Cloud Firestore's `runTransaction` with per-document revision numbers, asynchronous
 * microtask interleaving (`await Promise.resolve()`), commit-time CAS conflict detection, and
 * automatic retry on contention.
 *
 * Used to verify:
 * 1. Approving a technician twice sequentially (grants +3 trial coins once ever).
 * 2. Simultaneous approvals (`await Promise.all([approveA, approveB])`) — both read `trialCoinsGranted: false`
 *    simultaneously, winner commits +3 trial coins and `ctx_trial_${uid}`, loser retries on CAS conflict
 *    and sees `trialCoinsGranted: true`, granting 0 duplicate coins!
 * 3. Technician suspension & rejection (forces `isAvailable: false`, blocks job acceptance, writes audit log).
 * 4. Unauthorized coin changes & invalid coin adjustments (rejected with 0 ledger entries).
 * 5. Service additions, edits, ordering, fees, and disabled services (preventing customer bookings).
 * 6. Rehydrating reports on a fresh session with date ranges and strict accounting separation.
 */
export class ConcurrentAdminWorkflowStore {
  private admins = new Map<string, AdminRecord>();
  private users = new Map<string, { data: UserProfile; version: number }>();
  private contacts = new Map<string, UserPrivateContact>();
  private technicians = new Map<string, { data: TechnicianProfile; version: number }>();
  private services = new Map<string, { data: ServiceCategory; version: number }>();
  private bookings = new Map<string, { data: Booking; version: number }>();
  private privateDetails = new Map<string, BookingPrivateDetails>();
  private completions = new Map<string, { data: BookingCompletionRecord; version: number }>();
  private coinLedger = new Map<string, { data: CoinTransaction; version: number }>();
  private auditLogs = new Map<string, { data: AdminAuditRecord; version: number }>();
  private serviceAreas: string[] = [];

  constructor(initial: {
    admins?: AdminRecord[];
    users?: UserProfile[];
    contacts?: UserPrivateContact[];
    technicians?: TechnicianProfile[];
    services?: ServiceCategory[];
    bookings?: Booking[];
    privateDetails?: BookingPrivateDetails[];
    completions?: BookingCompletionRecord[];
    coinTransactions?: CoinTransaction[];
    auditLogs?: AdminAuditRecord[];
    serviceAreas?: string[];
  }) {
    for (const a of initial.admins || []) {
      this.admins.set(a.uid, { ...a });
    }
    for (const u of initial.users || []) {
      this.users.set(u.uid, { data: { ...u }, version: 1 });
    }
    for (const c of initial.contacts || []) {
      this.contacts.set(c.uid, { ...c });
    }
    for (const t of initial.technicians || []) {
      this.technicians.set(t.uid, { data: { ...t, skills: [...t.skills] }, version: 1 });
    }
    for (const s of initial.services || []) {
      this.services.set(s.id, { data: { ...s }, version: 1 });
    }
    for (const b of initial.bookings || []) {
      this.bookings.set(b.id, { data: { ...b }, version: 1 });
    }
    for (const d of initial.privateDetails || []) {
      this.privateDetails.set(d.bookingId, { ...d });
    }
    for (const c of initial.completions || []) {
      this.completions.set(c.id, { data: { ...c }, version: 1 });
    }
    for (const tx of initial.coinTransactions || []) {
      this.coinLedger.set(tx.id, { data: { ...tx }, version: 1 });
    }
    for (const log of initial.auditLogs || []) {
      this.auditLogs.set(log.id, { data: { ...log }, version: 1 });
    }
    this.serviceAreas = [...(initial.serviceAreas || ['Bapatla - Railpet'])];
  }

  isAuthorizedAdmin(actorUid: string | null | undefined): boolean {
    const check = assertServerVerifiedAdmin({
      actorUid,
      provisionedAdmins: Array.from(this.admins.values()),
    });
    return check.authorized;
  }

  getTechnician(techUid: string): TechnicianProfile | undefined {
    const entry = this.technicians.get(techUid);
    return entry ? { ...entry.data, skills: [...entry.data.skills] } : undefined;
  }

  getService(serviceId: string): ServiceCategory | undefined {
    const entry = this.services.get(serviceId);
    return entry ? { ...entry.data } : undefined;
  }

  getServicesSorted(): ServiceCategory[] {
    return Array.from(this.services.values())
      .map((e) => ({ ...e.data }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  }

  getCoinTransactions(): CoinTransaction[] {
    return Array.from(this.coinLedger.values())
      .map((e) => ({ ...e.data }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getAuditLogs(): AdminAuditRecord[] {
    return Array.from(this.auditLogs.values())
      .map((e) => ({ ...e.data }))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /**
   * Executes a concurrent-safe Admin technician status decision transaction (`APPROVED`, `REJECTED`, `SUSPENDED`)
   * with microtask interleaving (`await Promise.resolve()`) and CAS conflict retry.
   */
  async decideTechnicianStatusTransaction(params: {
    techUid: string;
    decision: 'APPROVED' | 'REJECTED' | 'SUSPENDED';
    actorUid: string;
    reasonNote?: string;
    nowIso?: string;
    maxRetries?: number;
  }): Promise<{
    success: boolean;
    error?: string;
    trialCoinsGrantedNow: number;
    updatedTechnician?: TechnicianProfile;
    attempts: number;
  }> {
    const maxRetries = params.maxRetries ?? 5;
    const nowIso = params.nowIso || new Date().toISOString();
    const isAdmin = this.isAuthorizedAdmin(params.actorUid);

    if (!isAdmin) {
      return {
        success: false,
        error: `PERMISSION_DENIED: Account "${params.actorUid}" is not an authorized Admin.`,
        trialCoinsGrantedNow: 0,
        attempts: 1,
      };
    }

    const deterministic = buildDeterministicCommandKey(
      'TRIAL_GRANT',
      params.techUid,
      params.actorUid
    );

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const techEntry = this.technicians.get(params.techUid);
      const trialTxEntry = this.coinLedger.get(deterministic.docId);

      const readTechVersion = techEntry?.version ?? 0;
      const readTrialTxVersion = trialTxEntry?.version ?? 0;

      // Yield across microtask queue so concurrent approvals read the initial PENDING snapshot simultaneously
      await Promise.resolve();

      if (!techEntry) {
        return {
          success: false,
          error: 'Technician profile not found.',
          trialCoinsGrantedNow: 0,
          attempts: attempt,
        };
      }

      const existingLedgerIds = new Set<string>(this.coinLedger.keys());
      const outcome = executeAdminTechnicianStatusDecision({
        technician: techEntry.data,
        decision: params.decision,
        adminUid: params.actorUid,
        isAdminAuthorized: true,
        nowIso,
        reasonNote: params.reasonNote,
        existingLedgerIds,
        alreadyReceivedTrialCoins: Boolean(trialTxEntry),
      });

      if (!outcome.success || !outcome.auditRecord) {
        return {
          success: false,
          error: outcome.error || 'Technician status decision failed.',
          trialCoinsGrantedNow: 0,
          attempts: attempt,
        };
      }

      // CAS Commit Verification
      const currentTechVersion = this.technicians.get(params.techUid)?.version ?? 0;
      const currentTrialTxVersion = this.coinLedger.get(deterministic.docId)?.version ?? 0;

      if (
        currentTechVersion !== readTechVersion ||
        currentTrialTxVersion !== readTrialTxVersion
      ) {
        // Concurrent transaction committed first; retry against latest committed state
        continue;
      }

      this.technicians.set(params.techUid, {
        data: outcome.updatedTechnician,
        version: currentTechVersion + 1,
      });

      if (outcome.coinTransaction) {
        this.coinLedger.set(outcome.coinTransaction.id, {
          data: outcome.coinTransaction,
          version: currentTrialTxVersion + 1,
        });
      }

      const uniqueAuditId = `${outcome.auditRecord.id}_att${attempt}_${this.auditLogs.size + 1}`;
      const committedAudit: AdminAuditRecord = {
        ...outcome.auditRecord,
        id: uniqueAuditId,
      };
      this.auditLogs.set(uniqueAuditId, {
        data: committedAudit,
        version: 1,
      });

      return {
        success: true,
        trialCoinsGrantedNow: outcome.trialCoinsGrantedNow,
        updatedTechnician: outcome.updatedTechnician,
        attempts: attempt,
      };
    }

    return {
      success: false,
      error: 'Transaction aborted due to high contention after maximum retries.',
      trialCoinsGrantedNow: 0,
      attempts: maxRetries,
    };
  }

  /**
   * Executes a protected coin adjustment transaction.
   * Denies non-admin callers and rejects invalid/negative adjustments without writing any misleading ledger entry.
   */
  async adjustCoinsTransaction(params: {
    techUid: string;
    delta: number;
    reason: 'ADMIN_RECHARGE' | 'ADMIN_DEDUCTION';
    reasonNote?: string;
    actorUid: string;
    nowIso?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    updatedTechnician?: TechnicianProfile;
    coinTransaction?: CoinTransaction;
    auditRecord?: AdminAuditRecord;
  }> {
    const nowIso = params.nowIso || new Date().toISOString();
    const isAdmin = this.isAuthorizedAdmin(params.actorUid);
    const techEntry = this.technicians.get(params.techUid);

    if (!techEntry) {
      return { success: false, error: 'Technician profile not found.' };
    }

    const txId = `ctx_adj_${params.techUid}_${this.coinLedger.size + 1}`;
    const outcome = executeAdminCoinAdjustment({
      technician: techEntry.data,
      delta: params.delta,
      reason: params.reason,
      reasonNote: params.reasonNote,
      adminUid: params.actorUid,
      isAdminAuthorized: isAdmin,
      nowIso,
      txId,
    });

    if (!outcome.success || !outcome.coinTransaction || !outcome.auditRecord) {
      return {
        success: false,
        error: outcome.error,
      };
    }

    this.technicians.set(params.techUid, {
      data: outcome.updatedTechnician,
      version: techEntry.version + 1,
    });
    this.coinLedger.set(outcome.coinTransaction.id, {
      data: outcome.coinTransaction,
      version: 1,
    });
    this.auditLogs.set(outcome.auditRecord.id, {
      data: outcome.auditRecord,
      version: 1,
    });

    return {
      success: true,
      updatedTechnician: outcome.updatedTechnician,
      coinTransaction: outcome.coinTransaction,
      auditRecord: outcome.auditRecord,
    };
  }

  /**
   * Persists service additions, edits, fees, ordering, and enable/disable changes with audit logging.
   */
  async mutateServiceCatalog(params: {
    actorUid: string;
    action: 'ADD' | 'EDIT' | 'TOGGLE' | 'REORDER';
    serviceId?: string;
    serviceInput?: {
      id?: string;
      nameEn: string;
      nameTe?: string;
      descriptionEn?: string;
      descriptionTe?: string;
      baseInspectionFee: number;
      sortOrder?: number;
      enabled?: boolean;
    };
    reorderDirection?: 'UP' | 'DOWN';
    nowIso?: string;
  }): Promise<{
    success: boolean;
    error?: string;
    updatedService?: ServiceCategory;
    services?: ServiceCategory[];
  }> {
    const nowIso = params.nowIso || new Date().toISOString();
    const isAdmin = this.isAuthorizedAdmin(params.actorUid);
    if (!isAdmin) {
      return {
        success: false,
        error: `PERMISSION_DENIED: Account "${params.actorUid}" is not an authorized Admin.`,
      };
    }

    if (params.action === 'ADD') {
      if (!params.serviceInput) {
        return { success: false, error: 'Missing service input.' };
      }
      const nextSortOrder = params.serviceInput.sortOrder ?? this.services.size + 1;
      const check = validateServiceCategoryMutation({
        ...params.serviceInput,
        sortOrder: nextSortOrder,
      });
      if (!check.valid || !check.sanitized) {
        return { success: false, error: check.error };
      }
      const created: ServiceCategory = {
        ...check.sanitized,
        updatedAt: nowIso,
      };
      this.services.set(created.id, { data: created, version: 1 });
      const auditId = `audit_srv_create_${created.id}_${this.auditLogs.size + 1}`;
      this.auditLogs.set(auditId, {
        data: {
          id: auditId,
          action: 'SERVICE_CREATED',
          actorUid: params.actorUid,
          targetId: created.id,
          summary: `Created service "${created.nameEn}" (₹${created.baseInspectionFee} visit fee, sort #${created.sortOrder}).`,
          idempotencyKey: `srv_create:${created.id}:${nowIso}`,
          createdAt: nowIso,
        },
        version: 1,
      });
      return {
        success: true,
        updatedService: created,
        services: this.getServicesSorted(),
      };
    }

    if (params.action === 'EDIT') {
      const targetId = params.serviceId || params.serviceInput?.id || '';
      const existingEntry = this.services.get(targetId);
      if (!existingEntry || !params.serviceInput) {
        return { success: false, error: 'Service category to edit was not found.' };
      }
      const check = validateServiceCategoryMutation({
        id: targetId,
        nameEn: params.serviceInput.nameEn,
        nameTe: params.serviceInput.nameTe ?? existingEntry.data.nameTe,
        descriptionEn: params.serviceInput.descriptionEn ?? existingEntry.data.descriptionEn,
        descriptionTe: params.serviceInput.descriptionTe ?? existingEntry.data.descriptionTe,
        baseInspectionFee: params.serviceInput.baseInspectionFee,
        sortOrder: params.serviceInput.sortOrder ?? existingEntry.data.sortOrder,
        iconName: existingEntry.data.iconName,
        imageUrl: existingEntry.data.imageUrl,
        enabled: params.serviceInput.enabled ?? existingEntry.data.enabled,
      });
      if (!check.valid || !check.sanitized) {
        return { success: false, error: check.error };
      }
      const updated: ServiceCategory = {
        ...check.sanitized,
        updatedAt: nowIso,
      };
      this.services.set(targetId, { data: updated, version: existingEntry.version + 1 });
      const auditId = `audit_srv_edit_${targetId}_${this.auditLogs.size + 1}`;
      this.auditLogs.set(auditId, {
        data: {
          id: auditId,
          action: 'SERVICE_UPDATED',
          actorUid: params.actorUid,
          targetId,
          summary: `Updated service "${updated.nameEn}" (fee: ₹${updated.baseInspectionFee}, order: #${updated.sortOrder}, enabled: ${updated.enabled}).`,
          idempotencyKey: `srv_edit:${targetId}:${nowIso}`,
          createdAt: nowIso,
        },
        version: 1,
      });
      return {
        success: true,
        updatedService: updated,
        services: this.getServicesSorted(),
      };
    }

    if (params.action === 'TOGGLE') {
      const targetId = params.serviceId || '';
      const existingEntry = this.services.get(targetId);
      if (!existingEntry) {
        return { success: false, error: 'Service category not found.' };
      }
      const updated: ServiceCategory = {
        ...existingEntry.data,
        enabled: !existingEntry.data.enabled,
        updatedAt: nowIso,
      };
      this.services.set(targetId, { data: updated, version: existingEntry.version + 1 });
      const auditId = `audit_srv_toggle_${targetId}_${this.auditLogs.size + 1}`;
      this.auditLogs.set(auditId, {
        data: {
          id: auditId,
          action: 'SERVICE_TOGGLED',
          actorUid: params.actorUid,
          targetId,
          summary: `${updated.enabled ? 'Enabled' : 'Disabled'} service "${updated.nameEn}".`,
          idempotencyKey: `srv_toggle:${targetId}:${nowIso}`,
          createdAt: nowIso,
        },
        version: 1,
      });
      return {
        success: true,
        updatedService: updated,
        services: this.getServicesSorted(),
      };
    }

    if (params.action === 'REORDER') {
      const targetId = params.serviceId || '';
      const direction = params.reorderDirection || 'UP';
      const reorderRes = executeAdminServiceReorder({
        services: this.getServicesSorted(),
        serviceId: targetId,
        direction,
        adminUid: params.actorUid,
        isAdminAuthorized: true,
        nowIso,
      });
      if (!reorderRes.success || !reorderRes.auditRecord) {
        return { success: false, error: reorderRes.error };
      }
      for (const s of reorderRes.updatedServices) {
        const prevVer = this.services.get(s.id)?.version ?? 0;
        this.services.set(s.id, { data: s, version: prevVer + 1 });
      }
      const auditId = `${reorderRes.auditRecord.id}_${this.auditLogs.size + 1}`;
      this.auditLogs.set(auditId, {
        data: { ...reorderRes.auditRecord, id: auditId },
        version: 1,
      });
      return {
        success: true,
        updatedService: this.getService(targetId),
        services: this.getServicesSorted(),
      };
    }

    return { success: false, error: 'Invalid service catalog action.' };
  }

  /**
   * Simulates a fresh Admin session rehydrating persistent records from the store
   * and building a date-filtered report.
   */
  buildReportOnFreshSession(params: {
    actorUid: string | null | undefined;
    preset?: AdminReportDatePreset;
    customStartDate?: string;
    customEndDate?: string;
    referenceNowIso?: string;
  }): AdminPersistentReport {
    const isAdmin = this.isAuthorizedAdmin(params.actorUid);
    return buildAdminPersistentReport({
      actorUid: params.actorUid,
      isServerVerifiedAdmin: isAdmin,
      bookings: Array.from(this.bookings.values()).map((e) => ({ ...e.data })),
      completionRecords: Array.from(this.completions.values()).map((e) => ({ ...e.data })),
      coinTransactions: this.getCoinTransactions(),
      technicians: Array.from(this.technicians.values()).map((e) => ({ ...e.data })),
      preset: params.preset,
      customStartDate: params.customStartDate,
      customEndDate: params.customEndDate,
      referenceNowIso: params.referenceNowIso,
    });
  }
}



