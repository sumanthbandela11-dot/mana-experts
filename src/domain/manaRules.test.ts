import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EXPECTED_PROJECT_ID,
  EXPECTED_NAMED_DATABASE_ID,
  verifyNamedDatabaseConfiguration,
  buildDeterministicCommandKey,
  validateRegistrationInput,
  validateBookingStateTransition,
  checkBookingAcceptanceEligibility,
  executeAtomicBookingAcceptance,
  startWorkOnBooking,
  submitLabourChargesOnBooking,
  approveTechnicianWithTrialCoins,
  executeAdminCoinAdjustment,
  canViewProtectedCustomerDetails,
  calculateVerifiedTechnicianEarnings,
  confirmWorkCompletion,
  mergeProfileEditSafely,
  resolveAuthorizedRolesForUser,
  detectLegacyNonUidRecords,
  buildCustomerBookingIdempotencyIdentity,
  hasDuplicateActiveBookingRequest,
  validateCustomerBookingInput,
  validateBookingPhotoFile,
  validateProtectedPhotoPayload,
  validateCustomerReviewInput,
  filterCustomerOwnedBookings,
  extractPermittedTechnicianContact,
  validateTechnicianProfileInput,
  buildInitialTechnicianProfile,
  validateTechnicianAvailabilityUpdate,
  filterActionableTechnicianRequests,
  filterAssignedTechnicianJobs,
  filterTechnicianCoinHistory,
  extractPermittedCustomerDetailsForTechnician,
  calculateTechnicianEarningsBreakdown,
  createDuplicateTapLock,
  rehydrateTechnicianWorkspaceOnRestart,
  ConcurrentAcceptanceTransactionStore,
  PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
  evaluateProvisionedAdminAuthorization,
  assertServerVerifiedAdmin,
  queryAdminCustomerDirectory,
  queryAdminTechnicianDirectory,
  executeAdminTechnicianStatusDecision,
  validateServiceCategoryMutation,
  executeAdminServiceReorder,
  filterAdminBookingsWithPrivateAccess,
  buildAdminPersistentReport,
  ConcurrentAdminWorkflowStore,
  TechnicianProfile,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  BookingCompletionRecord,
  CoinTransaction,
  UserProfile,
  UserPrivateContact,
  ServiceCategory,
} from './manaRules';

function makeTech(overrides: Partial<TechnicianProfile> = {}): TechnicianProfile {
  return {
    uid: 'firebase_uid_tech_1',
    name: 'Ramesh Babu',
    phone: '9848011223',
    skills: ['electrician', 'ac_repair'],
    area: 'Bapatla - Railpet',
    experienceYears: 6,
    bio: 'Licensed residential electrician in Bapatla',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    trialCoinsGranted: true,
    coinBalance: 3,
    totalEarnings: 0,
    completedJobs: 0,
    ratingAvg: 4.8,
    ratingCount: 5,
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z',
    ...overrides,
  };
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'booking_101',
    customerId: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    serviceId: 'electrician',
    serviceNameEn: 'Electrician',
    serviceNameTe: 'ఎలక్ట్రీషియన్',
    generalArea: 'Bapatla - Railpet',
    problemDescription: 'Main MCB tripping repeatedly when geyser is turned on.',
    preferredDate: '2026-10-29',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    photoNote: 'Distribution board near entrance',
    status: 'PENDING',
    technicianId: '',
    technicianName: '',
    technicianPhone: '',
    labourCharges: 0,
    rated: false,
    createdAt: '2026-10-28T01:00:00Z',
    updatedAt: '2026-10-28T01:00:00Z',
    ...overrides,
  };
}

test('Named database verification accepts owned named database and rejects (default) or missing databaseId', () => {
  const valid = verifyNamedDatabaseConfiguration({
    projectId: EXPECTED_PROJECT_ID,
    firestoreDatabaseId: EXPECTED_NAMED_DATABASE_ID,
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.databaseId, EXPECTED_NAMED_DATABASE_ID);

  const defaultDbAttempt = verifyNamedDatabaseConfiguration({
    projectId: EXPECTED_PROJECT_ID,
    firestoreDatabaseId: '(default)',
  });
  assert.equal(defaultDbAttempt.valid, false);
  assert.match(defaultDbAttempt.error || '', /Refusing to silently switch to default database/);

  const emptyDbAttempt = verifyNamedDatabaseConfiguration({
    projectId: EXPECTED_PROJECT_ID,
    firestoreDatabaseId: '',
  });
  assert.equal(emptyDbAttempt.valid, false);
});

test('Registration blocks self-assigned ADMIN role for non-owner users', () => {
  const attempt = validateRegistrationInput({
    name: 'Intruder User',
    phone: '9876543210',
    area: 'Bapatla - Old Town',
    requestedRole: 'ADMIN',
    isAuthorizedAdminEmail: false,
  });
  assert.equal(attempt.valid, false);
  assert.match(attempt.error || '', /cannot self-select the Admin role/);

  const validCustomer = validateRegistrationInput({
    name: 'Sita Devi',
    phone: '9876543210',
    area: 'Bapatla - Railpet',
    requestedRole: 'CUSTOMER',
  });
  assert.equal(validCustomer.valid, true);
  assert.equal(validCustomer.resolvedRole, 'CUSTOMER');
});

test('Editing an existing technician profile preserves coinBalance, approvalStatus, trialCoinsGranted, totalEarnings, and createdAt', () => {
  const existingUser: UserProfile = {
    uid: 'firebase_uid_tech_1',
    name: 'Ramesh Babu',
    email: 'ramesh@example.com',
    role: 'TECHNICIAN',
    area: 'Bapatla - Railpet',
    language: 'en',
    phoneVerified: false,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };
  const existingTech = makeTech({
    uid: 'firebase_uid_tech_1',
    approvalStatus: 'APPROVED',
    trialCoinsGranted: true,
    coinBalance: 7,
    totalEarnings: 3400,
    completedJobs: 9,
    ratingAvg: 4.9,
    ratingCount: 8,
    createdAt: '2026-10-01T00:00:00Z',
  });

  const merged = mergeProfileEditSafely({
    existingUser,
    existingContact: null,
    existingTech,
    edits: {
      name: 'K. Ramesh Babu',
      phone: '9848099887',
      defaultAddress: 'D.No 5-11, Suryalanka Road, Bapatla',
      area: 'Bapatla - Suryalanka Road',
      skills: ['electrician', 'plumber'],
      experienceYears: 9,
      bio: 'Updated bio for Bapatla',
    },
    nowIso: '2026-10-30T10:00:00Z',
  });

  assert.equal(merged.updatedUser.name, 'K. Ramesh Babu');
  assert.equal(merged.updatedUser.area, 'Bapatla - Suryalanka Road');
  assert.equal(merged.updatedUser.createdAt, '2026-10-01T00:00:00Z');
  assert.equal(merged.updatedUser.phoneVerified, false);

  assert.ok(merged.updatedTech);
  assert.equal(merged.updatedTech.approvalStatus, 'APPROVED');
  assert.equal(merged.updatedTech.trialCoinsGranted, true);
  assert.equal(merged.updatedTech.coinBalance, 7);
  assert.equal(merged.updatedTech.totalEarnings, 3400);
  assert.equal(merged.updatedTech.completedJobs, 9);
  assert.equal(merged.updatedTech.ratingAvg, 4.9);
  assert.equal(merged.updatedTech.createdAt, '2026-10-01T00:00:00Z');
});

test('Role authorization strictly enforces saved roles and server-verified Admin flag', () => {
  const custProfile: UserProfile = {
    uid: 'uid_cust_1',
    name: 'Padma',
    role: 'CUSTOMER',
    area: 'Bapatla - Railpet',
    language: 'en',
    phoneVerified: false,
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  assert.deepEqual(
    resolveAuthorizedRolesForUser({
      profile: custProfile,
      techProfile: null,
      isServerVerifiedAdmin: false,
    }),
    ['CUSTOMER']
  );

  const techProfile = makeTech({ uid: 'uid_tech_1' });
  assert.deepEqual(
    resolveAuthorizedRolesForUser({
      profile: { ...custProfile, uid: 'uid_tech_1', role: 'TECHNICIAN' },
      techProfile,
      isServerVerifiedAdmin: false,
    }),
    ['CUSTOMER', 'TECHNICIAN']
  );

  assert.deepEqual(
    resolveAuthorizedRolesForUser({
      profile: custProfile,
      techProfile: null,
      isServerVerifiedAdmin: true,
    }),
    ['CUSTOMER', 'TECHNICIAN', 'ADMIN']
  );
});

test('Legacy synthetic IDs (cust_..., tech_..., demo_...) are detected for safe migration preview', () => {
  const candidates = detectLegacyNonUidRecords({
    users: [
      {
        uid: 'cust_17300001',
        name: 'Legacy Customer',
        role: 'CUSTOMER',
        area: 'Bapatla - Railpet',
        language: 'en',
        phoneVerified: false,
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
      },
      {
        uid: 'KVvhN2vzcVdSft7n8ZlGvDDD9ol1',
        name: 'Real User',
        role: 'CUSTOMER',
        area: 'Bapatla - Railpet',
        language: 'en',
        phoneVerified: false,
        createdAt: '2026-10-29T00:00:00Z',
        updatedAt: '2026-10-29T00:00:00Z',
      },
    ],
    technicians: [makeTech({ uid: 'tech_17300002', name: 'Legacy Tech' })],
    bookings: [],
  });

  assert.equal(candidates.length, 2);
  assert.equal(candidates[0].legacyId, 'cust_17300001');
  assert.equal(candidates[1].legacyId, 'tech_17300002');
});

test('Approval grants 3 trial coins once ever using durable trialCoinsGranted marker', () => {
  const pendingTech = makeTech({
    approvalStatus: 'PENDING',
    coinBalance: 0,
    isAvailable: false,
    trialCoinsGranted: false,
  });

  const firstApproval = approveTechnicianWithTrialCoins({
    technician: pendingTech,
    adminUid: 'admin_1',
    nowIso: '2026-10-28T02:00:00Z',
  });

  assert.equal(firstApproval.updatedTechnician.approvalStatus, 'APPROVED');
  assert.equal(firstApproval.updatedTechnician.trialCoinsGranted, true);
  assert.equal(firstApproval.updatedTechnician.coinBalance, 3);
  assert.equal(firstApproval.coinTransaction?.delta, 3);
  assert.equal(firstApproval.coinTransaction?.prevBalance, 0);
  assert.equal(firstApproval.coinTransaction?.balanceAfter, 3);
  assert.equal(firstApproval.coinTransaction?.id, 'ctx_trial_firebase_uid_tech_1');

  // Simulate suspension and re-approval: durable trialCoinsGranted=true prevents any second grant
  const suspendedTech: TechnicianProfile = {
    ...firstApproval.updatedTechnician,
    approvalStatus: 'SUSPENDED',
    isAvailable: false,
    coinBalance: 1,
  };

  const reApproval = approveTechnicianWithTrialCoins({
    technician: suspendedTech,
    adminUid: 'admin_1',
    nowIso: '2026-10-28T03:00:00Z',
  });
  assert.equal(reApproval.updatedTechnician.approvalStatus, 'APPROVED');
  assert.equal(reApproval.updatedTechnician.trialCoinsGranted, true);
  assert.equal(reApproval.updatedTechnician.coinBalance, 1);
  assert.equal(reApproval.coinTransaction, undefined);
});

test('Simultaneous or repeated booking acceptance assigns 1 technician, deducts 1 coin atomically, and never deducts from loser or repeat', () => {
  const tech1 = makeTech({ uid: 'tech_1', name: 'Ramesh Babu', coinBalance: 3 });
  const tech2 = makeTech({ uid: 'tech_2', name: 'Srinivas Rao', coinBalance: 3 });
  const booking = makeBooking();
  const ledgerIds = new Set<string>();

  const res1 = executeAtomicBookingAcceptance({
    booking,
    technician: tech1,
    nowIso: '2026-10-28T04:00:00Z',
    existingLedgerIds: ledgerIds,
  });
  assert.equal(res1.success, true);
  assert.equal(res1.updatedBooking.status, 'ACCEPTED');
  assert.equal(res1.updatedBooking.technicianId, 'tech_1');
  assert.equal(res1.updatedTechnician.coinBalance, 2);
  assert.equal(res1.coinTransaction?.delta, -1);
  assert.equal(res1.coinTransaction?.prevBalance, 3);
  assert.equal(res1.coinTransaction?.balanceAfter, 2);
  assert.equal(res1.coinTransaction?.id, 'ctx_accept_booking_101_tech_1');
  ledgerIds.add(res1.coinTransaction!.id);

  // Repeated request by same technician with same idempotency key -> rejected, 0 extra coin deducted
  const repeatAttempt = executeAtomicBookingAcceptance({
    booking,
    technician: res1.updatedTechnician,
    nowIso: '2026-10-28T04:00:01Z',
    existingLedgerIds: ledgerIds,
  });
  assert.equal(repeatAttempt.success, false);
  assert.equal(repeatAttempt.updatedTechnician.coinBalance, 2);
  assert.equal(repeatAttempt.coinTransaction, undefined);

  // Losing concurrent request by tech2 on already-accepted booking -> rejected, 0 coins deducted
  const res2 = executeAtomicBookingAcceptance({
    booking: res1.updatedBooking,
    technician: tech2,
    nowIso: '2026-10-28T04:00:02Z',
    existingLedgerIds: ledgerIds,
  });
  assert.equal(res2.success, false);
  assert.equal(res2.updatedTechnician.coinBalance, 3);
  assert.equal(res2.coinTransaction, undefined);
});

test('Pending, unavailable, non-matching skill, self-booking, or zero-coin technicians cannot accept bookings', () => {
  const unapprovedTech = makeTech({ approvalStatus: 'PENDING', coinBalance: 3 });
  const unavailableTech = makeTech({ approvalStatus: 'APPROVED', isAvailable: false, coinBalance: 3 });
  const wrongSkillTech = makeTech({ skills: ['plumber'], coinBalance: 3 });
  const zeroCoinTech = makeTech({ approvalStatus: 'APPROVED', coinBalance: 0 });
  const booking = makeBooking();

  assert.equal(checkBookingAcceptanceEligibility(unapprovedTech, booking).eligible, false);
  assert.equal(checkBookingAcceptanceEligibility(unavailableTech, booking).eligible, false);
  assert.equal(checkBookingAcceptanceEligibility(wrongSkillTech, booking).eligible, false);
  assert.equal(checkBookingAcceptanceEligibility(zeroCoinTech, booking).eligible, false);

  const selfBooking = makeBooking({ customerId: 'firebase_uid_tech_1' });
  assert.equal(checkBookingAcceptanceEligibility(makeTech(), selfBooking).eligible, false);
});

test('Coin balances cannot become negative during Admin coin adjustments and ledger matches exact delta', () => {
  const tech = makeTech({ coinBalance: 2 });

  const overDeduct = executeAdminCoinAdjustment({
    technician: tech,
    delta: -5,
    reason: 'ADMIN_DEDUCTION',
    adminUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T10:00:00Z',
    txId: 'ctx_adj_1',
  });
  assert.equal(overDeduct.success, false);
  assert.equal(overDeduct.updatedTechnician.coinBalance, 2);
  assert.equal(overDeduct.coinTransaction, undefined);

  const validDeduct = executeAdminCoinAdjustment({
    technician: tech,
    delta: -2,
    reason: 'ADMIN_DEDUCTION',
    adminUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T10:01:00Z',
    txId: 'ctx_adj_2',
  });
  assert.equal(validDeduct.success, true);
  assert.equal(validDeduct.updatedTechnician.coinBalance, 0);
  assert.equal(validDeduct.coinTransaction?.prevBalance, 2);
  assert.equal(validDeduct.coinTransaction?.balanceAfter, 0);
  assert.equal(validDeduct.coinTransaction?.delta, -2);
});

test('Explicit booking state machine enforces PENDING -> ACCEPTED -> IN_PROGRESS -> WORK_COMPLETED -> CONFIRMED and PENDING-only customer cancellation', () => {
  const pending = makeBooking({ status: 'PENDING' });

  // Customer can cancel from PENDING
  const cancelPending = validateBookingStateTransition({
    currentStatus: 'PENDING',
    nextStatus: 'CANCELLED',
    actorUid: pending.customerId,
    bookingCustomerId: pending.customerId,
    bookingTechnicianId: '',
  });
  assert.equal(cancelPending.valid, true);

  // Unrelated user cannot cancel
  const strangerCancel = validateBookingStateTransition({
    currentStatus: 'PENDING',
    nextStatus: 'CANCELLED',
    actorUid: 'stranger_uid',
    bookingCustomerId: pending.customerId,
    bookingTechnicianId: '',
  });
  assert.equal(strangerCancel.valid, false);

  // Customer cannot self-cancel after ACCEPTED
  const cancelAfterAccept = validateBookingStateTransition({
    currentStatus: 'ACCEPTED',
    nextStatus: 'CANCELLED',
    actorUid: pending.customerId,
    bookingCustomerId: pending.customerId,
    bookingTechnicianId: 'tech_1',
  });
  assert.equal(cancelAfterAccept.valid, false);

  // Technician cannot skip IN_PROGRESS and jump straight from ACCEPTED to WORK_COMPLETED
  const acceptedBooking = makeBooking({ status: 'ACCEPTED', technicianId: 'tech_1' });
  const skipStepAttempt = submitLabourChargesOnBooking({
    booking: acceptedBooking,
    technicianUid: 'tech_1',
    labourCharges: 350,
    nowIso: '2026-10-30T11:00:00Z',
  });
  assert.equal(skipStepAttempt.success, false);

  // Assigned technician starts work (ACCEPTED -> IN_PROGRESS)
  const started = startWorkOnBooking({
    booking: acceptedBooking,
    technicianUid: 'tech_1',
    nowIso: '2026-10-30T11:05:00Z',
  });
  assert.equal(started.success, true);
  assert.equal(started.updatedBooking.status, 'IN_PROGRESS');

  // Unassigned technician cannot submit labour charges
  const wrongTechSubmit = submitLabourChargesOnBooking({
    booking: started.updatedBooking,
    technicianUid: 'tech_2',
    labourCharges: 350,
    nowIso: '2026-10-30T11:10:00Z',
  });
  assert.equal(wrongTechSubmit.success, false);

  // Assigned technician submits valid labour charges (IN_PROGRESS -> WORK_COMPLETED)
  const completed = submitLabourChargesOnBooking({
    booking: started.updatedBooking,
    technicianUid: 'tech_1',
    labourCharges: 450,
    nowIso: '2026-10-30T11:15:00Z',
  });
  assert.equal(completed.success, true);
  assert.equal(completed.updatedBooking.status, 'WORK_COMPLETED');
  assert.equal(completed.updatedBooking.labourCharges, 450);
});

test('Customer confirmation records completion and earnings exactly once via deterministic BookingCompletionRecord', () => {
  const tech = makeTech({ uid: 'tech_1', totalEarnings: 500, completedJobs: 2 });
  const completedWorkBooking = makeBooking({
    id: 'booking_101',
    status: 'WORK_COMPLETED',
    technicianId: 'tech_1',
    labourCharges: 450,
  });
  const completionIds = new Set<string>();

  const confirmation = confirmWorkCompletion({
    booking: completedWorkBooking,
    technician: tech,
    customerUid: 'firebase_uid_cust_1',
    nowIso: '2026-10-28T06:00:00Z',
    existingCompletionIds: completionIds,
  });

  assert.equal(confirmation.success, true);
  assert.equal(confirmation.updatedBooking.status, 'CONFIRMED');
  assert.equal(confirmation.updatedTechnician.totalEarnings, 950);
  assert.equal(confirmation.updatedTechnician.completedJobs, 3);
  assert.ok(confirmation.completionRecord);
  assert.equal(confirmation.completionRecord.id, 'booking_101');
  assert.equal(confirmation.completionRecord.prevTechnicianEarnings, 500);
  assert.equal(confirmation.completionRecord.newTechnicianEarnings, 950);
  completionIds.add(confirmation.completionRecord.id);

  // Second confirmation attempt is rejected -> earnings are never double-counted
  const duplicateConfirm = confirmWorkCompletion({
    booking: completedWorkBooking,
    technician: confirmation.updatedTechnician,
    customerUid: 'firebase_uid_cust_1',
    nowIso: '2026-10-28T06:01:00Z',
    existingCompletionIds: completionIds,
  });
  assert.equal(duplicateConfirm.success, false);
  assert.equal(duplicateConfirm.updatedTechnician.totalEarnings, 950);
  assert.equal(duplicateConfirm.completionRecord, undefined);

  const totals = calculateVerifiedTechnicianEarnings('tech_1', [
    confirmation.updatedBooking,
    makeBooking({ id: 'b2', technicianId: 'tech_1', status: 'WORK_COMPLETED', labourCharges: 300 }),
  ]);
  assert.equal(totals.totalEarnings, 450);
  assert.equal(totals.completedJobs, 1);
});

test('Customer PII (phone and full address) is hidden until booking is accepted by that technician', () => {
  const pendingBooking = makeBooking({ status: 'PENDING', technicianId: '' });

  assert.equal(
    canViewProtectedCustomerDetails({
      viewerUid: 'tech_1',
      viewerRole: 'TECHNICIAN',
      booking: pendingBooking,
    }),
    false
  );

  assert.equal(
    canViewProtectedCustomerDetails({
      viewerUid: 'firebase_uid_cust_1',
      viewerRole: 'CUSTOMER',
      booking: pendingBooking,
    }),
    true
  );

  const acceptedBooking = makeBooking({ status: 'ACCEPTED', technicianId: 'tech_1' });
  assert.equal(
    canViewProtectedCustomerDetails({
      viewerUid: 'tech_1',
      viewerRole: 'TECHNICIAN',
      booking: acceptedBooking,
    }),
    true
  );
  assert.equal(
    canViewProtectedCustomerDetails({
      viewerUid: 'tech_2',
      viewerRole: 'TECHNICIAN',
      booking: acceptedBooking,
    }),
    false
  );
});

test('Firestore security rules and deployment config enforce cross-document invariants and named database', () => {
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesText = fs.readFileSync(rulesPath, 'utf8');

  // Verify global default-deny and key collections
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;/);
  assert.match(rulesText, /match \/booking_completions\/\{completionId\}/);
  assert.match(rulesText, /match \/admin_audit_logs\/\{auditId\}/);
  assert.match(rulesText, /ctx_accept_/);
  assert.match(rulesText, /trialCoinsGranted/);

  const fbJsonPath = path.resolve(process.cwd(), 'firebase.json');
  const fbJson = JSON.parse(fs.readFileSync(fbJsonPath, 'utf8'));
  assert.equal(fbJson.firestore.database, EXPECTED_NAMED_DATABASE_ID);
  assert.equal(fbJson.firestore.rules, 'firestore.rules');
  assert.equal(fbJson.firestore.indexes, 'firestore.indexes.json');

  const buildKeys = buildDeterministicCommandKey('ACCEPT_BOOKING', 'bk_1', 'tech_9');
  assert.equal(buildKeys.docId, 'ctx_accept_bk_1_tech_9');
  assert.equal(buildKeys.idempotencyKey, 'accept:bk_1:tech_9');
});

test('Customer booking validation enforces active service, locality, full address, phone, problem description, date, and time slot', () => {
  const activeElec: ServiceCategory = {
    id: 'electrician',
    nameEn: 'Electrician',
    nameTe: 'ఎలక్ట్రీషియన్',
    descriptionEn: 'Switchboard and fan repair',
    descriptionTe: 'స్విచ్ బోర్డు రిపేర్',
    baseInspectionFee: 100,
    iconName: 'Zap',
    enabled: true,
    sortOrder: 1,
  };
  const disabledPlumber: ServiceCategory = {
    ...activeElec,
    id: 'plumber',
    nameEn: 'Plumber',
    enabled: false,
  };
  const activeAreas = ['Bapatla - Railpet', 'Bapatla - Suryalanka Road'];

  const validRes = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    service: activeElec,
    catalogServices: [activeElec, disabledPlumber],
    generalArea: 'Bapatla - Railpet',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 7-42, Near Municipal High School, Railpet',
    landmark: 'Opposite SBI ATM',
    villageOrWard: 'Ward 8',
    customerPhone: '98480 11223',
    problemDescription: 'Ceiling fan capacitor failed and switchboard sparking',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    photoNote: 'Crompton 48-inch ceiling fan',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(validRes.valid, true);
  assert.equal(validRes.sanitized?.cleanPhone, '9848011223');

  // Reject disabled service
  const disabledRes = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    service: disabledPlumber,
    catalogServices: [activeElec, disabledPlumber],
    generalArea: 'Bapatla - Railpet',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 7-42, Near Municipal High School, Railpet',
    customerPhone: '9848011223',
    problemDescription: 'Kitchen tap leaking continuously',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(disabledRes.valid, false);
  assert.match(disabledRes.error || '', /disabled/);

  // Reject invalid locality not in active areas
  const badLocality = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    service: activeElec,
    catalogServices: [activeElec],
    generalArea: 'Unknown City Area',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 7-42, Near Municipal High School, Railpet',
    customerPhone: '9848011223',
    problemDescription: 'Ceiling fan capacitor failed and switchboard sparking',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(badLocality.valid, false);
  assert.match(badLocality.error || '', /active Bapatla service areas/);

  // Reject past date
  const pastDateRes = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    service: activeElec,
    catalogServices: [activeElec],
    generalArea: 'Bapatla - Railpet',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 7-42, Near Municipal High School, Railpet',
    customerPhone: '9848011223',
    problemDescription: 'Ceiling fan capacitor failed and switchboard sparking',
    preferredDate: '2026-10-15',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(pastDateRes.valid, false);
  assert.match(pastDateRes.error || '', /cannot be in the past/);

  // Reject invalid time slot
  const badSlotRes = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Lakshmi Narayana',
    service: activeElec,
    catalogServices: [activeElec],
    generalArea: 'Bapatla - Railpet',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 7-42, Near Municipal High School, Railpet',
    customerPhone: '9848011223',
    problemDescription: 'Ceiling fan capacitor failed and switchboard sparking',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '02:00 AM - 04:00 AM',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(badSlotRes.valid, false);
  assert.match(badSlotRes.error || '', /time slot/);
});

test('Deterministic booking idempotency identity prevents repeated-tap and duplicate active requests', () => {
  const identity1 = buildCustomerBookingIdempotencyIdentity({
    customerUid: 'firebase_uid_cust_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    problemDescription: 'Main MCB tripping repeatedly when geyser is turned on.',
  });
  const identity2 = buildCustomerBookingIdempotencyIdentity({
    customerUid: 'firebase_uid_cust_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    problemDescription: '  main mcb tripping repeatedly when geyser is turned on. ',
  });
  assert.equal(identity1.bookingId, identity2.bookingId);
  assert.equal(identity1.idempotencyKey, identity2.idempotencyKey);

  const activeBooking = makeBooking({
    id: identity1.bookingId,
    customerId: 'firebase_uid_cust_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    problemDescription: 'Main MCB tripping repeatedly when geyser is turned on.',
    status: 'PENDING',
    idempotencyKey: identity1.idempotencyKey,
  });

  const dupCheck = hasDuplicateActiveBookingRequest({
    existingBookings: [activeBooking],
    customerUid: 'firebase_uid_cust_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    preferredDate: '2026-11-05',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    problemDescription: 'Main MCB tripping repeatedly when geyser is turned on.',
  });
  assert.equal(dupCheck.duplicate, true);
  assert.equal(dupCheck.existingBookingId, identity1.bookingId);
});

test('Photo upload validation enforces image MIME types, size limits, and valid base64 dataUrl payload', () => {
  assert.equal(
    validateBookingPhotoFile({ name: 'switchboard.jpg', type: 'image/jpeg', size: 245000 }).valid,
    true
  );
  assert.equal(
    validateBookingPhotoFile({ name: 'notes.txt', type: 'text/plain', size: 1200 }).valid,
    false
  );
  assert.equal(
    validateBookingPhotoFile({ name: 'empty.png', type: 'image/png', size: 0 }).valid,
    false
  );
  assert.equal(
    validateBookingPhotoFile({
      name: 'huge.webp',
      type: 'image/webp',
      size: 6 * 1024 * 1024,
    }).valid,
    false
  );

  const validPayload = validateProtectedPhotoPayload({
    bookingId: 'bk_101',
    customerId: 'firebase_uid_cust_1',
    fileName: 'fault.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 120400,
    width: 800,
    height: 600,
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/',
    createdAt: '2026-10-30T12:00:00Z',
  });
  assert.equal(validPayload.valid, true);
});

test('Customer review validation enforces 1 review per CONFIRMED booking and rejects unselected/auto-generated reviews', () => {
  const confirmedBk = makeBooking({
    id: 'bk_500',
    customerId: 'firebase_uid_cust_1',
    technicianId: 'tech_1',
    status: 'CONFIRMED',
    rated: false,
  });

  // Reject rating 0 (unselected stars)
  const unselectedStars = validateCustomerReviewInput({
    booking: confirmedBk,
    customerUid: 'firebase_uid_cust_1',
    rating: 0,
    comment: 'Technician arrived on time and fixed the fan.',
  });
  assert.equal(unselectedStars.valid, false);
  assert.match(unselectedStars.error || '', /between 1 and 5/);

  // Reject empty comment (no auto-generated positive review)
  const emptyComment = validateCustomerReviewInput({
    booking: confirmedBk,
    customerUid: 'firebase_uid_cust_1',
    rating: 4,
    comment: '   ',
  });
  assert.equal(emptyComment.valid, false);
  assert.match(emptyComment.error || '', /at least 3 characters/);

  // Accept valid customer review
  const validRev = validateCustomerReviewInput({
    booking: confirmedBk,
    customerUid: 'firebase_uid_cust_1',
    rating: 4,
    comment: 'Replaced the fan capacitor neatly and explained the issue.',
  });
  assert.equal(validRev.valid, true);
  assert.equal(validRev.reviewId, 'rev_bk_500');

  // Reject duplicate review when rev_bk_500 already exists
  const dupRev = validateCustomerReviewInput({
    booking: confirmedBk,
    customerUid: 'firebase_uid_cust_1',
    rating: 5,
    comment: 'Trying to review a second time.',
    existingReviewIds: new Set(['rev_bk_500']),
  });
  assert.equal(dupRev.valid, false);
  assert.match(dupRev.error || '', /already been submitted/);
});

test('Customer booking scoping displays only the authenticated customer bookings and permitted technician contact info', () => {
  const b1 = makeBooking({ id: 'b1', customerId: 'uid_cust_A', status: 'ACCEPTED', technicianId: 'tech_1', technicianName: 'Ramesh Babu', technicianPhone: '9848011223' });
  const b2 = makeBooking({ id: 'b2', customerId: 'uid_cust_B', status: 'PENDING' });

  const filtered = filterCustomerOwnedBookings([b1, b2], 'uid_cust_A');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 'b1');

  const contact = extractPermittedTechnicianContact(b1, [makeTech({ uid: 'tech_1', coinBalance: 9, totalEarnings: 5000 })]);
  assert.ok(contact);
  assert.equal(contact.name, 'Ramesh Babu');
  assert.equal(contact.phone, '9848011223');
  assert.equal('coinBalance' in contact, false);
  assert.equal('totalEarnings' in contact, false);
});

test('Technician registration saves under authenticated UID, starts PENDING with 0 coins, and cannot accept jobs before approval', () => {
  const validInput = validateTechnicianProfileInput({
    uid: 'firebase_uid_tech_new',
    name: 'Venkateswarlu K',
    phone: '94401 22334',
    area: 'Bapatla - Suryalanka Road',
    defaultAddress: 'D.No 12-4, Suryalanka Road, Bapatla',
    skills: ['electrician', 'plumber'],
    experienceYears: 8,
    bio: 'Experienced residential electrician and plumber in Bapatla',
    activeServiceAreas: ['Bapatla - Railpet', 'Bapatla - Suryalanka Road'],
    availableServiceIds: ['electrician', 'plumber', 'ac_repair'],
  });
  assert.equal(validInput.valid, true);
  assert.equal(validInput.sanitized?.cleanPhone, '9440122334');

  // Reject synthetic tech_... ID
  const syntheticAttempt = validateTechnicianProfileInput({
    uid: 'tech_999123',
    name: 'Fake ID Tech',
    phone: '9440122334',
    area: 'Bapatla - Railpet',
    skills: ['electrician'],
    experienceYears: 3,
    bio: 'Test',
  });
  assert.equal(syntheticAttempt.valid, false);

  const initialTechProfile = buildInitialTechnicianProfile({
    uid: 'firebase_uid_tech_new',
    name: 'Venkateswarlu K',
    phone: '9440122334',
    area: 'Bapatla - Suryalanka Road',
    skills: ['electrician', 'plumber'],
    experienceYears: 8,
    bio: 'Experienced residential electrician and plumber in Bapatla',
    nowIso: '2026-10-30T10:00:00Z',
  });

  assert.equal(initialTechProfile.uid, 'firebase_uid_tech_new');
  assert.equal(initialTechProfile.approvalStatus, 'PENDING');
  assert.equal(initialTechProfile.isAvailable, false);
  assert.equal(initialTechProfile.coinBalance, 0);
  assert.equal(initialTechProfile.trialCoinsGranted, false);
  assert.equal(initialTechProfile.totalEarnings, 0);
  assert.equal(initialTechProfile.completedJobs, 0);

  // New PENDING technician cannot accept jobs before approval
  const pendingBooking = makeBooking({
    id: 'bk_new_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Suryalanka Road',
  });
  const eligibility = checkBookingAcceptanceEligibility(
    initialTechProfile,
    pendingBooking
  );
  assert.equal(eligibility.eligible, false);
  assert.match(eligibility.reason || '', /Pending Approval.*0 coins/i);
});

test('Technician eligibility & filtering cover insufficient coins, unavailable status, suspension/rejection, and mismatched service/area', () => {
  const matchingBooking = makeBooking({
    id: 'bk_match',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });
  const wrongSkillBooking = makeBooking({
    id: 'bk_wrong_skill',
    serviceId: 'carpenter',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });
  const wrongAreaBooking = makeBooking({
    id: 'bk_wrong_area',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Stuartpuram',
    status: 'PENDING',
  });

  // 1. Insufficient coins (coinBalance === 0)
  const zeroCoinTech = makeTech({
    uid: 'firebase_uid_tech_1',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 0,
    skills: ['electrician'],
    area: 'Bapatla - Railpet',
  });
  const zeroCoinAttempt = executeAtomicBookingAcceptance({
    booking: matchingBooking,
    technician: zeroCoinTech,
    nowIso: '2026-10-30T11:00:00Z',
  });
  assert.equal(zeroCoinAttempt.success, false);
  assert.match(zeroCoinAttempt.error || '', /Insufficient coin balance/);
  assert.equal(zeroCoinAttempt.updatedBooking.status, 'PENDING');
  assert.equal(zeroCoinAttempt.updatedTechnician.coinBalance, 0);
  assert.equal(zeroCoinAttempt.coinTransaction, undefined);

  // 2. Unavailable status (isAvailable === false) removes all actionable requests and blocks acceptance
  const offlineTech = makeTech({
    uid: 'firebase_uid_tech_1',
    approvalStatus: 'APPROVED',
    isAvailable: false,
    coinBalance: 3,
    skills: ['electrician'],
    area: 'Bapatla - Railpet',
  });
  assert.deepEqual(
    filterActionableTechnicianRequests({
      technician: offlineTech,
      bookings: [matchingBooking, wrongSkillBooking, wrongAreaBooking],
    }),
    []
  );
  const offlineAttempt = executeAtomicBookingAcceptance({
    booking: matchingBooking,
    technician: offlineTech,
    nowIso: '2026-10-30T11:00:00Z',
  });
  assert.equal(offlineAttempt.success, false);
  assert.match(offlineAttempt.error || '', /availability toggle/i);
  assert.equal(offlineAttempt.updatedTechnician.coinBalance, 3);

  // 3. Suspension, Pending, and Rejected block availability toggle, remove actionable requests, and reject acceptance
  const suspendedTech = makeTech({
    approvalStatus: 'SUSPENDED',
    isAvailable: true,
    coinBalance: 3,
  });
  const rejectedTech = makeTech({
    approvalStatus: 'REJECTED',
    isAvailable: true,
    coinBalance: 3,
  });
  const pendingTech = makeTech({
    approvalStatus: 'PENDING',
    isAvailable: true,
    coinBalance: 0,
  });

  assert.equal(
    validateTechnicianAvailabilityUpdate({
      technician: suspendedTech,
      actorUid: suspendedTech.uid,
      nextAvailable: true,
      nowIso: '2026-10-30T11:00:00Z',
    }).valid,
    false
  );
  assert.equal(
    validateTechnicianAvailabilityUpdate({
      technician: rejectedTech,
      actorUid: rejectedTech.uid,
      nextAvailable: true,
      nowIso: '2026-10-30T11:00:00Z',
    }).valid,
    false
  );
  assert.equal(
    validateTechnicianAvailabilityUpdate({
      technician: pendingTech,
      actorUid: pendingTech.uid,
      nextAvailable: true,
      nowIso: '2026-10-30T11:00:00Z',
    }).valid,
    false
  );

  assert.deepEqual(
    filterActionableTechnicianRequests({ technician: suspendedTech, bookings: [matchingBooking] }),
    []
  );
  assert.deepEqual(
    filterActionableTechnicianRequests({ technician: rejectedTech, bookings: [matchingBooking] }),
    []
  );
  assert.deepEqual(
    filterActionableTechnicianRequests({ technician: pendingTech, bookings: [matchingBooking] }),
    []
  );

  assert.match(
    checkBookingAcceptanceEligibility(suspendedTech, matchingBooking).reason || '',
    /Suspended/i
  );
  assert.match(
    checkBookingAcceptanceEligibility(rejectedTech, matchingBooking).reason || '',
    /Rejected/i
  );
  assert.match(
    checkBookingAcceptanceEligibility(pendingTech, matchingBooking).reason || '',
    /Pending Approval/i
  );

  // 4. Mismatched service/area filtered out and rejected on acceptance
  const onlineApprovedTech = makeTech({
    uid: 'firebase_uid_tech_1',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 3,
    skills: ['electrician'],
    area: 'Bapatla - Railpet',
  });
  const visibleRequests = filterActionableTechnicianRequests({
    technician: onlineApprovedTech,
    bookings: [matchingBooking, wrongSkillBooking, wrongAreaBooking],
  });
  assert.equal(visibleRequests.length, 1);
  assert.equal(visibleRequests[0].id, 'bk_match');

  const skillMismatchAttempt = executeAtomicBookingAcceptance({
    booking: wrongSkillBooking,
    technician: onlineApprovedTech,
    nowIso: '2026-10-30T11:05:00Z',
  });
  assert.equal(skillMismatchAttempt.success, false);
  assert.match(skillMismatchAttempt.error || '', /skill category/i);
  assert.equal(skillMismatchAttempt.updatedTechnician.coinBalance, 3);

  const areaMismatchAttempt = executeAtomicBookingAcceptance({
    booking: wrongAreaBooking,
    technician: onlineApprovedTech,
    nowIso: '2026-10-30T11:06:00Z',
  });
  assert.equal(areaMismatchAttempt.success, false);
  assert.match(areaMismatchAttempt.error || '', /does not match your active area/i);
  assert.equal(areaMismatchAttempt.updatedTechnician.coinBalance, 3);
});

test('Duplicate tap lock prevents rapid double-taps from triggering duplicate acceptance calls', async () => {
  const lock = createDuplicateTapLock();
  assert.equal(lock.tryAcquire('accept:bk_101:tech_A'), true);
  assert.equal(lock.isLocked('accept:bk_101:tech_A'), true);
  // Second rapid tap while in-flight is synchronously rejected
  assert.equal(lock.tryAcquire('accept:bk_101:tech_A'), false);
  lock.release('accept:bk_101:tech_A');
  assert.equal(lock.isLocked('accept:bk_101:tech_A'), false);

  // Also verify end-to-end tapAcceptJobWithGuard on ConcurrentAcceptanceTransactionStore
  const tech = makeTech({
    uid: 'firebase_uid_tech_A',
    name: 'Ramesh Babu',
    area: 'Bapatla - Railpet',
    skills: ['electrician'],
    coinBalance: 3,
    approvalStatus: 'APPROVED',
    isAvailable: true,
  });
  const booking = makeBooking({
    id: 'bk_double_tap_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });
  const store = new ConcurrentAcceptanceTransactionStore({
    bookings: [booking],
    technicians: [tech],
  });

  const [tap1, tap2] = await Promise.all([
    store.tapAcceptJobWithGuard('bk_double_tap_1', 'firebase_uid_tech_A', '2026-10-30T12:00:00Z'),
    store.tapAcceptJobWithGuard('bk_double_tap_1', 'firebase_uid_tech_A', '2026-10-30T12:00:00Z'),
  ]);

  assert.equal(tap1.success, true);
  assert.equal(tap1.attempts, 1);
  assert.equal(tap2.success, false);
  assert.equal(tap2.attempts, 0);
  assert.match(tap2.error || '', /Duplicate tap ignored/);
  assert.equal(store.getTechnician('firebase_uid_tech_A')?.coinBalance, 2);
  assert.equal(store.getCoinTransactions().length, 1);
});

test('Two genuinely concurrent acceptance requests via Promise.all resolve with exactly 1 winner and 1 loser without double coin deduction', async () => {
  const tech1 = makeTech({
    uid: 'firebase_uid_tech_A',
    name: 'Ramesh Babu',
    area: 'Bapatla - Railpet',
    skills: ['electrician'],
    coinBalance: 3,
    approvalStatus: 'APPROVED',
    isAvailable: true,
  });
  const tech2 = makeTech({
    uid: 'firebase_uid_tech_B',
    name: 'Srinivas Rao',
    area: 'Bapatla - Railpet',
    skills: ['electrician'],
    coinBalance: 3,
    approvalStatus: 'APPROVED',
    isAvailable: true,
  });
  const contestedBooking = makeBooking({
    id: 'bk_concurrent_1',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });

  const store = new ConcurrentAcceptanceTransactionStore({
    bookings: [contestedBooking],
    technicians: [tech1, tech2],
    privateDetails: [
      {
        bookingId: 'bk_concurrent_1',
        customerId: 'firebase_uid_cust_1',
        customerPhone: '9848055667',
        fullAddress: 'D.No 8-12, Railpet Main Road, Bapatla',
        landmark: 'Near Clock Tower',
        villageOrWard: 'Ward 8',
        createdAt: '2026-10-30T11:50:00Z',
      },
    ],
  });

  // Launch TWO genuinely concurrent async transactions via Promise.all
  const [resA, resB] = await Promise.all([
    store.acceptBookingTransaction('bk_concurrent_1', 'firebase_uid_tech_A', '2026-10-30T12:00:00Z'),
    store.acceptBookingTransaction('bk_concurrent_1', 'firebase_uid_tech_B', '2026-10-30T12:00:00Z'),
  ]);

  const successes = [resA, resB].filter((r) => r.success);
  const failures = [resA, resB].filter((r) => !r.success);
  assert.equal(successes.length, 1, 'Exactly one concurrent technician must succeed');
  assert.equal(failures.length, 1, 'Exactly one concurrent technician must fail');

  // Prove genuine concurrency: both read PENDING on attempt 1, winner committed on attempt 1,
  // and loser encountered CAS version conflict on attempt 1 and failed cleanly on attempt 2!
  assert.equal(successes[0].attempts, 1);
  assert.equal(failures[0].attempts, 2);
  assert.ok(successes[0].unlockedDetails, 'Winner unlocks private doorstep details');
  assert.equal(failures[0].unlockedDetails, undefined, 'Loser never unlocks private doorstep details');
  assert.match(failures[0].error || '', /no longer PENDING/i);

  const finalBooking = store.getBooking('bk_concurrent_1')!;
  const finalTechA = store.getTechnician('firebase_uid_tech_A')!;
  const finalTechB = store.getTechnician('firebase_uid_tech_B')!;
  const ledger = store.getCoinTransactions();

  assert.equal(finalBooking.status, 'ACCEPTED');
  assert.equal(finalBooking.technicianId, 'firebase_uid_tech_A');
  assert.equal(finalTechA.coinBalance, 2, 'Winner loses exactly 1 coin');
  assert.equal(finalTechB.coinBalance, 3, 'Loser loses 0 coins');
  assert.equal(ledger.length, 1, 'Exactly 1 immutable coin ledger entry created');
  assert.equal(ledger[0].id, 'ctx_accept_bk_concurrent_1_firebase_uid_tech_A');
  assert.equal(ledger[0].delta, -1);
  assert.equal(ledger[0].prevBalance, 3);
  assert.equal(ledger[0].balanceAfter, 2);

  // Also verify two genuinely concurrent requests from the SAME technician (e.g. parallel network retry)
  const contestedBooking2 = makeBooking({
    id: 'bk_concurrent_same_tech',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });
  const storeSameTech = new ConcurrentAcceptanceTransactionStore({
    bookings: [contestedBooking2],
    technicians: [tech2],
  });

  const [same1, same2] = await Promise.all([
    storeSameTech.acceptBookingTransaction('bk_concurrent_same_tech', 'firebase_uid_tech_B'),
    storeSameTech.acceptBookingTransaction('bk_concurrent_same_tech', 'firebase_uid_tech_B'),
  ]);
  const sameSuccesses = [same1, same2].filter((r) => r.success);
  assert.equal(sameSuccesses.length, 1);
  assert.equal(storeSameTech.getTechnician('firebase_uid_tech_B')?.coinBalance, 2);
  assert.equal(storeSameTech.getCoinTransactions().length, 1);
});

test('App restart rehydrates technician profile, unlocked details only for assigned jobs, coin history, and awaiting-confirmation vs confirmed earnings', () => {
  const techUid = 'firebase_uid_tech_restart';
  const savedUser: UserProfile = {
    uid: techUid,
    name: 'Koteswara Rao',
    role: 'TECHNICIAN',
    area: 'Bapatla - Railpet',
    language: 'en',
    phoneVerified: false,
    createdAt: '2026-10-28T00:00:00Z',
    updatedAt: '2026-10-28T00:00:00Z',
  };
  const savedTech = makeTech({
    uid: techUid,
    name: 'Koteswara Rao',
    area: 'Bapatla - Railpet',
    skills: ['electrician', 'ac_repair'],
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 2,
    trialCoinsGranted: true,
    totalEarnings: 650,
    completedJobs: 1,
  });

  const pendingMatching = makeBooking({
    id: 'bk_pending_match',
    serviceId: 'ac_repair',
    generalArea: 'Bapatla - Railpet',
    status: 'PENDING',
  });
  const pendingOtherArea = makeBooking({
    id: 'bk_pending_other_area',
    serviceId: 'ac_repair',
    generalArea: 'Bapatla - Vedullapalli',
    status: 'PENDING',
  });
  const assignedInProgress = makeBooking({
    id: 'bk_assigned_in_progress',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'IN_PROGRESS',
    technicianId: techUid,
    technicianName: savedTech.name,
  });
  const assignedWorkCompleted = makeBooking({
    id: 'bk_assigned_awaiting_confirm',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'WORK_COMPLETED',
    technicianId: techUid,
    technicianName: savedTech.name,
    labourCharges: 400,
  });
  const assignedConfirmed = makeBooking({
    id: 'bk_assigned_confirmed',
    serviceId: 'ac_repair',
    generalArea: 'Bapatla - Railpet',
    status: 'CONFIRMED',
    technicianId: techUid,
    technicianName: savedTech.name,
    labourCharges: 650,
  });
  const otherTechBooking = makeBooking({
    id: 'bk_other_tech',
    serviceId: 'electrician',
    generalArea: 'Bapatla - Railpet',
    status: 'ACCEPTED',
    technicianId: 'firebase_uid_other_tech',
  });

  const privateDetailsMap: Record<string, BookingPrivateDetails> = {
    bk_pending_match: {
      bookingId: 'bk_pending_match',
      customerId: 'cust_1',
      customerPhone: '9000011111',
      fullAddress: 'Hidden Pending Address',
      landmark: 'Landmark 1',
      villageOrWard: 'Ward 1',
      createdAt: '2026-10-30T10:00:00Z',
    },
    bk_assigned_in_progress: {
      bookingId: 'bk_assigned_in_progress',
      customerId: 'cust_2',
      customerPhone: '9848022334',
      fullAddress: 'D.No 4-11, Near Clock Tower, Railpet',
      landmark: 'Beside Post Office',
      villageOrWard: 'Ward 8',
      createdAt: '2026-10-30T10:00:00Z',
    },
    bk_other_tech: {
      bookingId: 'bk_other_tech',
      customerId: 'cust_3',
      customerPhone: '9000099999',
      fullAddress: 'Other Tech Customer Address',
      landmark: 'Landmark 3',
      villageOrWard: 'Ward 3',
      createdAt: '2026-10-30T10:00:00Z',
    },
  };

  const coinTransactions: CoinTransaction[] = [
    {
      id: `ctx_trial_${techUid}`,
      technicianId: techUid,
      technicianName: savedTech.name,
      delta: 3,
      prevBalance: 0,
      balanceAfter: 3,
      reason: 'INITIAL_APPROVAL_TRIAL_COINS',
      bookingId: '',
      actorId: 'admin_1',
      createdAt: '2026-10-29T09:00:00Z',
    },
    {
      id: `ctx_accept_bk_assigned_in_progress_${techUid}`,
      technicianId: techUid,
      technicianName: savedTech.name,
      delta: -1,
      prevBalance: 3,
      balanceAfter: 2,
      reason: 'JOB_ACCEPTANCE_DEDUCTION',
      bookingId: 'bk_assigned_in_progress',
      actorId: techUid,
      createdAt: '2026-10-30T09:30:00Z',
    },
    {
      id: 'ctx_other_tech_tx',
      technicianId: 'firebase_uid_other_tech',
      technicianName: 'Other Tech',
      delta: 3,
      prevBalance: 0,
      balanceAfter: 3,
      reason: 'INITIAL_APPROVAL_TRIAL_COINS',
      bookingId: '',
      actorId: 'admin_1',
      createdAt: '2026-10-30T10:00:00Z',
    },
  ];

  const rehydrated = rehydrateTechnicianWorkspaceOnRestart({
    authUid: techUid,
    users: [savedUser],
    contacts: [
      {
        uid: techUid,
        email: 'koteswara@example.com',
        phone: savedTech.phone,
        defaultAddress: 'D.No 1-2, Railpet',
        updatedAt: '2026-10-28T00:00:00Z',
      },
    ],
    technicians: [savedTech],
    bookings: [
      pendingMatching,
      pendingOtherArea,
      assignedInProgress,
      assignedWorkCompleted,
      assignedConfirmed,
      otherTechBooking,
    ],
    privateDetailsMap,
    coinTransactions,
  });

  assert.equal(rehydrated.authenticated, true);
  assert.equal(rehydrated.technicianProfile?.approvalStatus, 'APPROVED');
  assert.equal(rehydrated.technicianProfile?.isAvailable, true);
  assert.equal(rehydrated.technicianProfile?.coinBalance, 2);
  assert.equal(rehydrated.actionableRequests.length, 1);
  assert.equal(rehydrated.actionableRequests[0].id, 'bk_pending_match');
  assert.equal(rehydrated.assignedJobs.length, 3);

  // Private details unlocked ONLY for the technician's own assigned bookings, never for pending or other technicians' bookings
  assert.ok(rehydrated.unlockedDetailsByBookingId['bk_assigned_in_progress']);
  assert.equal(
    rehydrated.unlockedDetailsByBookingId['bk_assigned_in_progress'].customerPhone,
    '9848022334'
  );
  assert.equal(rehydrated.unlockedDetailsByBookingId['bk_pending_match'], undefined);
  assert.equal(rehydrated.unlockedDetailsByBookingId['bk_other_tech'], undefined);

  // Coin ledger scoped strictly to the signed-in technician, newest first
  assert.equal(rehydrated.coinLedger.length, 2);
  assert.equal(rehydrated.coinLedger[0].id, `ctx_accept_bk_assigned_in_progress_${techUid}`);

  // Earnings breakdown separates WORK_COMPLETED (awaiting customer confirmation) from CONFIRMED earnings
  assert.equal(rehydrated.earningsBreakdown.confirmedEarnings, 650);
  assert.equal(rehydrated.earningsBreakdown.confirmedJobsCount, 1);
  assert.equal(rehydrated.earningsBreakdown.awaitingConfirmationAmount, 400);
  assert.equal(rehydrated.earningsBreakdown.awaitingConfirmationCount, 1);

  // Profile edit preserves approvalStatus, coinBalance, trialCoinsGranted, and confirmed earnings
  const edited = mergeProfileEditSafely({
    existingUser: savedUser,
    existingContact: {
      uid: techUid,
      email: 'koteswara@example.com',
      phone: savedTech.phone,
      defaultAddress: 'Old Address',
      updatedAt: '2026-10-28T00:00:00Z',
    },
    existingTech: savedTech,
    edits: {
      name: 'Koteswara Rao B',
      phone: '9848099887',
      defaultAddress: 'New Door No 9-12, Suryalanka Road',
      area: 'Bapatla - Suryalanka Road',
      skills: ['electrician', 'ac_repair', 'plumber'],
      experienceYears: 9,
      bio: 'Updated bio with plumbing certification',
    },
    nowIso: '2026-10-30T14:00:00Z',
  });
  assert.equal(edited.updatedTech?.name, 'Koteswara Rao B');
  assert.equal(edited.updatedTech?.area, 'Bapatla - Suryalanka Road');
  assert.deepEqual(edited.updatedTech?.skills, ['electrician', 'ac_repair', 'plumber']);
  assert.equal(edited.updatedTech?.approvalStatus, 'APPROVED');
  assert.equal(edited.updatedTech?.coinBalance, 2);
  assert.equal(edited.updatedTech?.trialCoinsGranted, true);
  assert.equal(edited.updatedTech?.totalEarnings, 650);
  assert.equal(edited.updatedTech?.completedJobs, 1);
});

test('Admin Authorization: Hard-coded owner email never substitutes for provisioned /admins/{uid} or custom claim authorization', () => {
  // 1. Owner email signed in WITHOUT /admins/{uid} document or custom claim -> isAdmin MUST be false
  const unprovisionedOwner = evaluateProvisionedAdminAuthorization({
    authUid: 'firebase_uid_owner_1',
    tokenEmail: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
    tokenEmailVerified: true,
    hasCustomAdminClaim: false,
    provisionedAdmins: [],
  });
  assert.equal(unprovisionedOwner.isAdmin, false);
  assert.equal(unprovisionedOwner.canBootstrapFirstAdmin, true);
  assert.equal(unprovisionedOwner.matchedAdminRecord, null);

  // 2. Spoofed unverified owner email -> cannot even bootstrap
  const unverifiedSpoof = evaluateProvisionedAdminAuthorization({
    authUid: 'firebase_uid_spoof',
    tokenEmail: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
    tokenEmailVerified: false,
    hasCustomAdminClaim: false,
    provisionedAdmins: [],
  });
  assert.equal(unverifiedSpoof.isAdmin, false);
  assert.equal(unverifiedSpoof.canBootstrapFirstAdmin, false);

  // 3. Provisioned /admins/{uid} record in Firestore -> isAdmin is true
  const provisionedOwner = evaluateProvisionedAdminAuthorization({
    authUid: 'firebase_uid_owner_1',
    tokenEmail: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
    tokenEmailVerified: true,
    hasCustomAdminClaim: false,
    provisionedAdmins: [
      {
        uid: 'firebase_uid_owner_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_owner_1',
        addedAt: '2026-10-30T10:00:00Z',
      },
    ],
  });
  assert.equal(provisionedOwner.isAdmin, true);
  assert.equal(provisionedOwner.matchedAdminRecord?.uid, 'firebase_uid_owner_1');

  // 4. Non-admin direct operation check fails
  const nonAdminGuard = assertServerVerifiedAdmin({
    actorUid: 'firebase_uid_regular_user',
    isServerVerifiedAdmin: false,
    provisionedAdmins: [],
  });
  assert.equal(nonAdminGuard.authorized, false);
  assert.match(nonAdminGuard.error || '', /PERMISSION_DENIED/);

  // 5. Verify firestore.rules does not grant isAdmin() via hard-coded email
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesText = fs.readFileSync(rulesPath, 'utf8');
  const isAdminFnMatch = rulesText.match(/function isAdmin\(\)\s*\{[\s\S]*?\}/);
  assert.ok(isAdminFnMatch, 'isAdmin() helper must exist in firestore.rules');
  assert.equal(
    isAdminFnMatch[0].includes('sumanth.bandela11@gmail.com'),
    false,
    'isAdmin() in firestore.rules must NOT contain hard-coded email bypass'
  );
});

test('Admin Directory: Search, pagination, and protected customer private contact access require verified Admin authorization', () => {
  const users: UserProfile[] = [
    {
      uid: 'uid_cust_1',
      name: 'Anitha Devi',
      email: 'anitha@example.com',
      role: 'CUSTOMER',
      area: 'Bapatla - Railpet',
      language: 'te',
      phoneVerified: false,
      createdAt: '2026-10-25T10:00:00Z',
      updatedAt: '2026-10-25T10:00:00Z',
    },
    {
      uid: 'uid_cust_2',
      name: 'Bhaskar Rao',
      email: 'bhaskar@example.com',
      role: 'CUSTOMER',
      area: 'Bapatla - Suryalanka Road',
      language: 'en',
      phoneVerified: false,
      createdAt: '2026-10-26T10:00:00Z',
      updatedAt: '2026-10-26T10:00:00Z',
    },
    {
      uid: 'uid_cust_3',
      name: 'Chandra Sekhar',
      email: 'chandra@example.com',
      role: 'CUSTOMER',
      area: 'Bapatla - Railpet',
      language: 'en',
      phoneVerified: false,
      createdAt: '2026-10-27T10:00:00Z',
      updatedAt: '2026-10-27T10:00:00Z',
    },
  ];
  const contactsMap: Record<string, UserPrivateContact> = {
    uid_cust_1: {
      uid: 'uid_cust_1',
      email: 'anitha@example.com',
      phone: '9848012345',
      defaultAddress: 'D.No 3-11, Railpet',
      updatedAt: '2026-10-25T10:00:00Z',
    },
  };

  // Pagination: pageSize 2 -> page 1 has 2 items, totalPages = 2, hasNextPage = true
  const page1 = queryAdminCustomerDirectory({
    actorUid: 'firebase_uid_admin_1',
    isServerVerifiedAdmin: true,
    users,
    privateContactsMap: contactsMap,
    page: 1,
    pageSize: 2,
  });
  assert.equal(page1.authorized, true);
  assert.equal(page1.totalItems, 3);
  assert.equal(page1.totalPages, 2);
  assert.equal(page1.items.length, 2);
  assert.equal(page1.hasNextPage, true);
  assert.equal(page1.hasPrevPage, false);

  // Search by private phone number for authorized admin
  const searchByPhone = queryAdminCustomerDirectory({
    actorUid: 'firebase_uid_admin_1',
    isServerVerifiedAdmin: true,
    users,
    privateContactsMap: contactsMap,
    searchQuery: '9848012345',
    page: 1,
    pageSize: 5,
  });
  assert.equal(searchByPhone.totalItems, 1);
  assert.equal(searchByPhone.items[0].profile.uid, 'uid_cust_1');
  assert.equal(searchByPhone.items[0].privateContact?.phone, '9848012345');

  // Non-admin caller is denied directory access and never receives privateContact
  const unauthorizedView = queryAdminCustomerDirectory({
    actorUid: 'firebase_uid_non_admin',
    isServerVerifiedAdmin: false,
    users,
    privateContactsMap: contactsMap,
    page: 1,
    pageSize: 5,
  });
  assert.equal(unauthorizedView.authorized, false);
  assert.equal(unauthorizedView.items.length, 0);

  // Technician directory search & status filter
  const techs = [
    makeTech({ uid: 'uid_t1', name: 'Ramesh', approvalStatus: 'PENDING', area: 'Bapatla - Railpet' }),
    makeTech({ uid: 'uid_t2', name: 'Suresh', approvalStatus: 'APPROVED', area: 'Bapatla - Suryalanka Road' }),
    makeTech({ uid: 'uid_t3', name: 'Mahesh', approvalStatus: 'SUSPENDED', area: 'Bapatla - Railpet' }),
  ];
  const pendingOnly = queryAdminTechnicianDirectory({
    actorUid: 'firebase_uid_admin_1',
    isServerVerifiedAdmin: true,
    technicians: techs,
    statusFilter: 'PENDING',
    page: 1,
    pageSize: 10,
  });
  assert.equal(pendingOnly.authorized, true);
  assert.equal(pendingOnly.totalItems, 1);
  assert.equal(pendingOnly.items[0].uid, 'uid_t1');
});

test('Admin Test (a) & (b): Approving a technician twice sequentially OR simultaneously grants +3 initial trial coins EXACTLY ONCE', async () => {
  const newTech = makeTech({
    uid: 'firebase_uid_tech_new_1',
    name: 'Subba Rao',
    approvalStatus: 'PENDING',
    isAvailable: false,
    coinBalance: 0,
    trialCoinsGranted: false,
  });

  const store = new ConcurrentAdminWorkflowStore({
    admins: [
      {
        uid: 'firebase_uid_admin_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_admin_1',
        addedAt: '2026-10-30T10:00:00Z',
      },
    ],
    technicians: [newTech],
  });

  // (b) Launch TWO genuinely simultaneous approval transactions via Promise.all
  const [sim1, sim2] = await Promise.all([
    store.decideTechnicianStatusTransaction({
      techUid: 'firebase_uid_tech_new_1',
      decision: 'APPROVED',
      actorUid: 'firebase_uid_admin_1',
      nowIso: '2026-10-30T12:00:00Z',
    }),
    store.decideTechnicianStatusTransaction({
      techUid: 'firebase_uid_tech_new_1',
      decision: 'APPROVED',
      actorUid: 'firebase_uid_admin_1',
      nowIso: '2026-10-30T12:00:01Z',
    }),
  ]);

  assert.equal(sim1.success, true);
  assert.equal(sim2.success, true);

  // Exactly one of the two concurrent calls granted the +3 trial coins; the second saw trialCoinsGranted/ctx_trial_ on CAS retry
  const grantedCalls = [sim1, sim2].filter((r) => r.trialCoinsGrantedNow > 0);
  assert.equal(grantedCalls.length, 1, 'Trial coins must be granted by at most 1 concurrent call');
  assert.equal(grantedCalls[0].trialCoinsGrantedNow, 3);
  assert.equal(sim1.attempts, 1);
  assert.equal(sim2.attempts, 2, 'Second concurrent call retried after CAS conflict');

  // Verify technician state after simultaneous approvals
  const techAfterSimultaneous = store.getTechnician('firebase_uid_tech_new_1')!;
  assert.equal(techAfterSimultaneous.approvalStatus, 'APPROVED');
  assert.equal(techAfterSimultaneous.coinBalance, 3, 'Balance must be 3, never 6');
  assert.equal(techAfterSimultaneous.trialCoinsGranted, true);

  // Verify coin ledger has exactly 1 trial coin transaction
  const trialLedgerEntries = store
    .getCoinTransactions()
    .filter((tx) => tx.reason === 'INITIAL_APPROVAL_TRIAL_COINS');
  assert.equal(trialLedgerEntries.length, 1);
  assert.equal(trialLedgerEntries[0].id, 'ctx_trial_firebase_uid_tech_new_1');
  assert.equal(trialLedgerEntries[0].delta, 3);
  assert.equal(trialLedgerEntries[0].prevBalance, 0);
  assert.equal(trialLedgerEntries[0].balanceAfter, 3);

  // (a) Now approve the same technician AGAIN sequentially (e.g. repeated click or re-approval after suspension)
  const thirdApprove = await store.decideTechnicianStatusTransaction({
    techUid: 'firebase_uid_tech_new_1',
    decision: 'APPROVED',
    actorUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T12:05:00Z',
  });
  assert.equal(thirdApprove.success, true);
  assert.equal(thirdApprove.trialCoinsGrantedNow, 0);
  assert.equal(store.getTechnician('firebase_uid_tech_new_1')?.coinBalance, 3);
  assert.equal(
    store.getCoinTransactions().filter((tx) => tx.reason === 'INITIAL_APPROVAL_TRIAL_COINS')
      .length,
    1
  );
});

test('Admin Test (c): Technician suspension and rejection persist status, force offline availability, block jobs, and record audit logs', async () => {
  const approvedOnlineTech = makeTech({
    uid: 'firebase_uid_tech_active',
    name: 'Narasimha Rao',
    approvalStatus: 'APPROVED',
    isAvailable: true,
    coinBalance: 3,
    trialCoinsGranted: true,
  });

  const store = new ConcurrentAdminWorkflowStore({
    admins: [
      {
        uid: 'firebase_uid_admin_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_admin_1',
        addedAt: '2026-10-30T10:00:00Z',
      },
    ],
    technicians: [approvedOnlineTech],
  });

  // 1. Suspend technician
  const suspendRes = await store.decideTechnicianStatusTransaction({
    techUid: 'firebase_uid_tech_active',
    decision: 'SUSPENDED',
    actorUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T13:00:00Z',
  });
  assert.equal(suspendRes.success, true);

  const suspendedTech = store.getTechnician('firebase_uid_tech_active')!;
  assert.equal(suspendedTech.approvalStatus, 'SUSPENDED');
  assert.equal(suspendedTech.isAvailable, false, 'Suspension must force technician offline');
  assert.equal(suspendedTech.coinBalance, 3, 'Suspension preserves existing coin balance');

  // Suspended technician cannot toggle availability online or accept a booking
  assert.equal(
    validateTechnicianAvailabilityUpdate({
      technician: suspendedTech,
      actorUid: suspendedTech.uid,
      nextAvailable: true,
      nowIso: '2026-10-30T13:01:00Z',
    }).valid,
    false
  );
  assert.equal(
    checkBookingAcceptanceEligibility(
      suspendedTech,
      makeBooking({ status: 'PENDING', serviceId: 'electrician', generalArea: 'Bapatla - Railpet' })
    ).eligible,
    false
  );

  // 2. Reject technician
  const rejectRes = await store.decideTechnicianStatusTransaction({
    techUid: 'firebase_uid_tech_active',
    decision: 'REJECTED',
    actorUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T13:05:00Z',
  });
  assert.equal(rejectRes.success, true);
  assert.equal(store.getTechnician('firebase_uid_tech_active')?.approvalStatus, 'REJECTED');
  assert.equal(store.getTechnician('firebase_uid_tech_active')?.isAvailable, false);

  // 3. Re-approve technician -> status becomes APPROVED, 0 extra trial coins granted
  const reapproveRes = await store.decideTechnicianStatusTransaction({
    techUid: 'firebase_uid_tech_active',
    decision: 'APPROVED',
    actorUid: 'firebase_uid_admin_1',
    nowIso: '2026-10-30T13:10:00Z',
  });
  assert.equal(reapproveRes.success, true);
  assert.equal(reapproveRes.trialCoinsGrantedNow, 0);
  assert.equal(store.getTechnician('firebase_uid_tech_active')?.approvalStatus, 'APPROVED');
  assert.equal(store.getTechnician('firebase_uid_tech_active')?.coinBalance, 3);

  // Audit logs recorded for suspension, rejection, and re-approval
  const auditActions = new Set(store.getAuditLogs().map((a) => a.action));
  assert.equal(auditActions.has('TECHNICIAN_SUSPENDED'), true);
  assert.equal(auditActions.has('TECHNICIAN_REJECTED'), true);
  assert.equal(auditActions.has('TECHNICIAN_APPROVED'), true);
});

test('Admin Test (d): Unauthorized coin changes and invalid adjustments are rejected without recording misleading ledger entries', async () => {
  const tech = makeTech({
    uid: 'firebase_uid_tech_wallet',
    name: 'Prasad Babu',
    coinBalance: 4,
    approvalStatus: 'APPROVED',
  });

  const store = new ConcurrentAdminWorkflowStore({
    admins: [
      {
        uid: 'firebase_uid_admin_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_admin_1',
        addedAt: '2026-10-30T10:00:00Z',
      },
    ],
    technicians: [tech],
  });

  // 1. Non-admin account attempting direct coin adjustment is denied
  const unauthorizedAttempt = await store.adjustCoinsTransaction({
    techUid: 'firebase_uid_tech_wallet',
    actorUid: 'firebase_uid_attacker_non_admin',
    delta: 50,
    reason: 'ADMIN_RECHARGE',
    reasonNote: 'Unauthorized self-recharge',
    nowIso: '2026-10-30T14:00:00Z',
  });
  assert.equal(unauthorizedAttempt.success, false);
  assert.match(unauthorizedAttempt.error || '', /PERMISSION_DENIED/);
  assert.equal(store.getTechnician('firebase_uid_tech_wallet')?.coinBalance, 4);
  assert.equal(store.getCoinTransactions().length, 0);

  // 2. Invalid deduction exceeding current balance (4 - 10 = -6) is rejected with 0 ledger entries
  const overdraftAttempt = await store.adjustCoinsTransaction({
    techUid: 'firebase_uid_tech_wallet',
    actorUid: 'firebase_uid_admin_1',
    delta: -10,
    reason: 'ADMIN_DEDUCTION',
    reasonNote: 'Penalty deduction',
    nowIso: '2026-10-30T14:01:00Z',
  });
  assert.equal(overdraftAttempt.success, false);
  assert.match(overdraftAttempt.error || '', /cannot become negative/i);
  assert.equal(store.getTechnician('firebase_uid_tech_wallet')?.coinBalance, 4);
  assert.equal(store.getCoinTransactions().length, 0);

  // 3. Mismatched reason and delta sign (negative delta with ADMIN_RECHARGE) is rejected
  const mismatchedSignAttempt = await store.adjustCoinsTransaction({
    techUid: 'firebase_uid_tech_wallet',
    actorUid: 'firebase_uid_admin_1',
    delta: -2,
    reason: 'ADMIN_RECHARGE',
    nowIso: '2026-10-30T14:02:00Z',
  });
  assert.equal(mismatchedSignAttempt.success, false);
  assert.equal(store.getCoinTransactions().length, 0);

  // 4. Zero delta is rejected
  const zeroDeltaAttempt = await store.adjustCoinsTransaction({
    techUid: 'firebase_uid_tech_wallet',
    actorUid: 'firebase_uid_admin_1',
    delta: 0,
    reason: 'ADMIN_RECHARGE',
    nowIso: '2026-10-30T14:03:00Z',
  });
  assert.equal(zeroDeltaAttempt.success, false);
  assert.equal(store.getCoinTransactions().length, 0);

  // 5. Valid Admin Recharge (+5) records exact delta, resulting balance (9), admin UID, reasonNote, and audit log
  const validRecharge = await store.adjustCoinsTransaction({
    techUid: 'firebase_uid_tech_wallet',
    actorUid: 'firebase_uid_admin_1',
    delta: 5,
    reason: 'ADMIN_RECHARGE',
    reasonNote: 'UPI recharge verified by Bapatla desk',
    nowIso: '2026-10-30T14:05:00Z',
  });
  assert.equal(validRecharge.success, true);
  assert.equal(store.getTechnician('firebase_uid_tech_wallet')?.coinBalance, 9);

  const ledger = store.getCoinTransactions();
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].delta, 5);
  assert.equal(ledger[0].prevBalance, 4);
  assert.equal(ledger[0].balanceAfter, 9);
  assert.equal(ledger[0].actorId, 'firebase_uid_admin_1');
  assert.equal(ledger[0].reason, 'ADMIN_RECHARGE');
  assert.equal(ledger[0].reasonNote, 'UPI recharge verified by Bapatla desk');
  assert.equal(store.getAuditLogs().length, 1);
  assert.equal(store.getAuditLogs()[0].action, 'COIN_ADJUSTMENT');
});

test('Admin Test (e): Service additions, edits, ordering, fees, and disabled services persist and block customer bookings when disabled', async () => {
  const initialServices: ServiceCategory[] = [
    {
      id: 'electrician',
      nameEn: 'Electrician',
      nameTe: 'ఎలక్ట్రీషియన్',
      descriptionEn: 'Wiring and fan repair',
      descriptionTe: 'వైరింగ్ రిపేర్',
      baseInspectionFee: 100,
      iconName: 'Zap',
      enabled: true,
      sortOrder: 1,
    },
    {
      id: 'plumber',
      nameEn: 'Plumber',
      nameTe: 'ప్లంబర్',
      descriptionEn: 'Pipe and tap repair',
      descriptionTe: 'పైపు రిపేర్',
      baseInspectionFee: 100,
      iconName: 'Droplets',
      enabled: true,
      sortOrder: 2,
    },
  ];

  const activeAreas = ['Bapatla - Railpet', 'Bapatla - Suryalanka Road'];
  const store = new ConcurrentAdminWorkflowStore({
    admins: [
      {
        uid: 'firebase_uid_admin_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_admin_1',
        addedAt: '2026-10-30T10:00:00Z',
      },
    ],
    services: initialServices,
    serviceAreas: activeAreas,
  });

  // Non-admin cannot mutate services
  const nonAdminServiceAttempt = await store.mutateServiceCatalog({
    actorUid: 'non_admin_user',
    action: 'TOGGLE',
    serviceId: 'electrician',
  });
  assert.equal(nonAdminServiceAttempt.success, false);

  // 1. Add a new service category
  const addRes = await store.mutateServiceCatalog({
    actorUid: 'firebase_uid_admin_1',
    action: 'ADD',
    serviceInput: {
      id: 'solar_inverter',
      nameEn: 'Solar & Inverter Repair',
      nameTe: 'సోలార్ & ఇన్వర్టర్ రిపేర్',
      descriptionEn: 'Doorstep inverter battery and solar panel servicing',
      descriptionTe: 'సోలార్ & ఇన్వర్టర్ రిపేర్',
      baseInspectionFee: 150,
      sortOrder: 3,
      enabled: true,
    },
  });
  assert.equal(addRes.success, true);
  assert.equal(store.getServicesSorted().length, 3);

  // 2. Edit fee and description of Electrician
  const editRes = await store.mutateServiceCatalog({
    actorUid: 'firebase_uid_admin_1',
    action: 'EDIT',
    serviceId: 'electrician',
    serviceInput: {
      nameEn: 'Electrician',
      baseInspectionFee: 120,
      descriptionEn: 'Updated residential wiring, MCB, and ceiling fan servicing',
    },
  });
  assert.equal(editRes.success, true);
  assert.equal(store.getService('electrician')?.baseInspectionFee, 120);

  // 3. Reorder Plumber UP to position #1
  const reorderRes = await store.mutateServiceCatalog({
    actorUid: 'firebase_uid_admin_1',
    action: 'REORDER',
    serviceId: 'plumber',
    reorderDirection: 'UP',
  });
  assert.equal(reorderRes.success, true);
  assert.equal(store.getServicesSorted()[0].id, 'plumber');
  assert.equal(store.getServicesSorted()[1].id, 'electrician');

  // 4. Disable Plumber service and verify customer booking validation immediately rejects it
  const disableRes = await store.mutateServiceCatalog({
    actorUid: 'firebase_uid_admin_1',
    action: 'TOGGLE',
    serviceId: 'plumber',
  });
  assert.equal(disableRes.success, true);

  const disabledPlumberDoc = store.getService('plumber')!;
  assert.equal(disabledPlumberDoc.enabled, false);

  const customerBookingAttemptOnDisabled = validateCustomerBookingInput({
    customerUid: 'firebase_uid_cust_1',
    customerName: 'Rama Rao',
    service: disabledPlumberDoc,
    catalogServices: store.getServicesSorted(),
    generalArea: 'Bapatla - Railpet',
    activeServiceAreas: activeAreas,
    fullAddress: 'D.No 5-10, Railpet Main Road, Bapatla',
    customerPhone: '9848011223',
    problemDescription: 'Water tank overflow pipe leaking badly',
    preferredDate: '2026-11-10',
    preferredTimeSlot: '10:00 AM - 12:00 PM',
    todayIsoDate: '2026-10-30',
  });
  assert.equal(customerBookingAttemptOnDisabled.valid, false);
  assert.match(customerBookingAttemptOnDisabled.error || '', /disabled/i);
});

test('Admin Test (f): Reports after a fresh session accurately compute date-ranged metrics and never present labour earnings as platform revenue', () => {
  const bookings: Booking[] = [
    makeBooking({
      id: 'bk_old_confirmed',
      status: 'CONFIRMED',
      technicianId: 'tech_1',
      labourCharges: 500,
      createdAt: '2026-09-15T10:00:00.000Z',
      updatedAt: '2026-09-15T15:00:00.000Z',
    }),
    makeBooking({
      id: 'bk_recent_pending',
      status: 'PENDING',
      createdAt: '2026-10-29T08:00:00.000Z',
      updatedAt: '2026-10-29T08:00:00.000Z',
    }),
    makeBooking({
      id: 'bk_recent_assigned',
      status: 'IN_PROGRESS',
      technicianId: 'tech_1',
      createdAt: '2026-10-29T09:00:00.000Z',
      updatedAt: '2026-10-29T10:00:00.000Z',
    }),
    makeBooking({
      id: 'bk_recent_work_completed',
      status: 'WORK_COMPLETED',
      technicianId: 'tech_1',
      labourCharges: 350,
      createdAt: '2026-10-29T11:00:00.000Z',
      updatedAt: '2026-10-29T14:00:00.000Z',
    }),
    makeBooking({
      id: 'bk_recent_confirmed',
      status: 'CONFIRMED',
      technicianId: 'tech_1',
      labourCharges: 800,
      createdAt: '2026-10-30T09:00:00.000Z',
      updatedAt: '2026-10-30T12:00:00.000Z',
    }),
  ];

  const completionRecords: BookingCompletionRecord[] = [
    {
      id: 'bk_old_confirmed',
      bookingId: 'bk_old_confirmed',
      customerId: 'cust_1',
      technicianId: 'tech_1',
      technicianName: 'Ramesh Babu',
      serviceId: 'electrician',
      labourCharges: 500,
      prevTechnicianEarnings: 0,
      newTechnicianEarnings: 500,
      prevCompletedJobs: 0,
      newCompletedJobs: 1,
      idempotencyKey: 'confirm:bk_old_confirmed',
      confirmedAt: '2026-09-15T15:00:00.000Z',
    },
    {
      id: 'bk_recent_confirmed',
      bookingId: 'bk_recent_confirmed',
      customerId: 'cust_1',
      technicianId: 'tech_1',
      technicianName: 'Ramesh Babu',
      serviceId: 'electrician',
      labourCharges: 800,
      prevTechnicianEarnings: 500,
      newTechnicianEarnings: 1300,
      prevCompletedJobs: 1,
      newCompletedJobs: 2,
      idempotencyKey: 'confirm:bk_recent_confirmed',
      confirmedAt: '2026-10-30T12:00:00.000Z',
    },
  ];

  const coinTransactions: CoinTransaction[] = [
    {
      id: 'ctx_trial_tech_1',
      technicianId: 'tech_1',
      technicianName: 'Ramesh Babu',
      delta: 3,
      prevBalance: 0,
      balanceAfter: 3,
      reason: 'INITIAL_APPROVAL_TRIAL_COINS',
      bookingId: '',
      actorId: 'admin_1',
      createdAt: '2026-09-10T10:00:00.000Z',
    },
    {
      id: 'ctx_accept_bk_recent_confirmed_tech_1',
      technicianId: 'tech_1',
      technicianName: 'Ramesh Babu',
      delta: -1,
      prevBalance: 3,
      balanceAfter: 2,
      reason: 'JOB_ACCEPTANCE_DEDUCTION',
      bookingId: 'bk_recent_confirmed',
      actorId: 'tech_1',
      createdAt: '2026-10-30T09:15:00.000Z',
    },
    {
      id: 'ctx_admin_recharge_1',
      technicianId: 'tech_1',
      technicianName: 'Ramesh Babu',
      delta: 5,
      prevBalance: 2,
      balanceAfter: 7,
      reason: 'ADMIN_RECHARGE',
      reasonNote: 'Weekly top-up',
      bookingId: '',
      actorId: 'admin_1',
      createdAt: '2026-10-30T10:00:00.000Z',
    },
  ];

  const store = new ConcurrentAdminWorkflowStore({
    admins: [
      {
        uid: 'firebase_uid_admin_1',
        email: PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        provisionedBy: 'firebase_uid_admin_1',
        addedAt: '2026-09-01T00:00:00.000Z',
      },
    ],
    technicians: [
      makeTech({ uid: 'firebase_uid_tech_1', coinBalance: 7, totalEarnings: 1300, completedJobs: 2 }),
    ],
    bookings,
    completions: completionRecords,
    coinTransactions,
  });

  // 1. All-Time Report after a fresh session
  const allTimeReport = store.buildReportOnFreshSession({
    actorUid: 'firebase_uid_admin_1',
    preset: 'ALL_TIME',
    referenceNowIso: '2026-10-30T18:00:00.000Z',
  });
  assert.equal(allTimeReport.authorized, true);
  assert.equal(allTimeReport.bookingMetrics.pendingRequestsCount, 1);
  assert.equal(allTimeReport.bookingMetrics.assignedJobsCount, 2); // IN_PROGRESS + WORK_COMPLETED
  assert.equal(allTimeReport.bookingMetrics.confirmedJobsCount, 2);
  assert.equal(
    allTimeReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings,
    1300
  ); // 500 + 800
  assert.equal(
    allTimeReport.technicianDirectLabourMetrics.awaitingCustomerConfirmationLabourAmount,
    350
  );
  assert.equal(allTimeReport.technicianDirectLabourMetrics.isPlatformRevenue, false);
  assert.equal(allTimeReport.technicianDirectLabourMetrics.isConfirmedPlatformPayment, false);
  assert.equal(allTimeReport.technicianDirectLabourMetrics.platformCommissionRevenue, 0);
  assert.equal(
    allTimeReport.technicianDirectLabourMetrics.settlementModel,
    'DIRECT_CUSTOMER_TO_TECHNICIAN'
  );
  assert.equal(allTimeReport.coinActivity.trialCoinsGrantedTotal, 3);
  assert.equal(allTimeReport.coinActivity.adminCoinsAddedTotal, 5);
  assert.equal(allTimeReport.coinActivity.jobAcceptanceCoinsSpentTotal, 1);
  assert.equal(allTimeReport.coinActivity.currentActiveWalletBalanceTotal, 7);

  // 2. Last 7 Days Report (excludes September 2026 records)
  const last7DaysReport = store.buildReportOnFreshSession({
    actorUid: 'firebase_uid_admin_1',
    preset: 'LAST_7_DAYS',
    referenceNowIso: '2026-10-30T18:00:00.000Z',
  });
  assert.equal(last7DaysReport.bookingMetrics.pendingRequestsCount, 1);
  assert.equal(last7DaysReport.bookingMetrics.assignedJobsCount, 2);
  assert.equal(last7DaysReport.bookingMetrics.confirmedJobsCount, 1); // Only Oct 30 confirmed job
  assert.equal(
    last7DaysReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings,
    800
  );
  assert.equal(last7DaysReport.coinActivity.trialCoinsGrantedTotal, 0); // Sept 10 excluded
  assert.equal(last7DaysReport.coinActivity.adminCoinsAddedTotal, 5);
  assert.equal(last7DaysReport.coinActivity.jobAcceptanceCoinsSpentTotal, 1);

  // 3. Unauthorized non-admin report request is denied
  const unauthorizedReport = store.buildReportOnFreshSession({
    actorUid: 'non_admin_user',
    preset: 'ALL_TIME',
  });
  assert.equal(unauthorizedReport.authorized, false);
  assert.equal(
    unauthorizedReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings,
    0
  );
});




