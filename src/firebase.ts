import { initializeApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  browserPopupRedirectResolver,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  UserProfile,
  UserPrivateContact,
  TechnicianProfile,
  ServiceCategory,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  CoinTransaction,
  BookingCompletionRecord,
  CustomerReview,
  NotificationItem,
  AdminRecord,
  AdminAuditRecord,
  PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
  OWNER_ADMIN_EMAIL,
  INITIAL_TRIAL_COINS,
  MAX_VALID_LABOUR_CHARGE,
  verifyNamedDatabaseConfiguration,
  buildDeterministicCommandKey,
  mergeProfileEditSafely,
  isLegacySyntheticId,
  checkBookingAcceptanceEligibility,
  validateBookingStateTransition,
  startWorkOnBooking,
  submitLabourChargesOnBooking,
  executeAdminCoinAdjustment,
  executeAdminTechnicianStatusDecision,
  validateServiceCategoryMutation,
  executeAdminServiceReorder,
  validateBookingPhotoFile,
  validateProtectedPhotoPayload,
  validateCustomerReviewInput,
  buildInitialTechnicianProfile,
  validateTechnicianProfileInput,
  validateTechnicianAvailabilityUpdate,
} from './domain/manaRules';
import { BAPATLA_INITIAL_SETTINGS, INITIAL_SERVICES } from './domain/seedData';

/**
 * Explicitly verify that the owned Firebase project (`coastal-adapter-5thv3`) and named
 * Firestore database (`ai-studio-manaexperts-9ab98bbd-c1ef-4605-83b4-310be7069b2b`)
 * are configured before initializing Firestore. Never silently switch to `(default)`.
 */
export const DATABASE_VERIFICATION = verifyNamedDatabaseConfiguration(firebaseConfig);
if (!DATABASE_VERIFICATION.valid) {
  throw new Error(DATABASE_VERIFICATION.error);
}

/**
 * Cleans only genuinely expired cached auth entries in Web Storage before boot
 * while preserving valid tokens in IndexedDB/localStorage so authenticated sessions
 * restore reliably across app restarts.
 */
function cleanExpiredWebStorageAuthEntries(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();

  const inspectStorage = (storage: Storage | undefined) => {
    if (!storage) return;
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (!key || !key.startsWith('firebase:authUser:')) continue;
        const raw = storage.getItem(key);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          const exp = Number(parsed?.stsTokenManager?.expirationTime || 0);
          if (exp > 0 && exp <= now) {
            toRemove.push(key);
          }
        } catch {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => storage.removeItem(k));
    } catch {
      // Ignore storage access errors
    }
  };

  inspectStorage(window.localStorage);
  inspectStorage(window.sessionStorage);
}

cleanExpiredWebStorageAuthEntries();

const app = initializeApp(firebaseConfig);

function createConfiguredAuth() {
  if (typeof window === 'undefined') {
    return getAuth(app);
  }
  try {
    return initializeAuth(app, {
      persistence: [
        indexedDBLocalPersistence,
        browserLocalPersistence,
        browserSessionPersistence,
      ],
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createConfiguredAuth();
export const db = getFirestore(app, DATABASE_VERIFICATION.databaseId);

export { OWNER_ADMIN_EMAIL, onAuthStateChanged };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export type BackendErrorKind =
  | 'permission-denied'
  | 'offline'
  | 'unauthenticated'
  | 'quota-exceeded'
  | 'validation'
  | 'unknown';

export interface ParsedBackendError {
  kind: BackendErrorKind;
  message: string;
  raw: string;
  path?: string | null;
}

export function classifyBackendError(err: unknown): ParsedBackendError {
  const raw = err instanceof Error ? err.message : String(err);
  let extractedMessage = raw;
  let path: string | null | undefined = null;

  try {
    const parsed = JSON.parse(raw) as Partial<FirestoreErrorInfo>;
    if (parsed && typeof parsed.error === 'string') {
      extractedMessage = parsed.error;
      path = parsed.path;
    }
  } catch {
    // Plain error message
  }

  const lower = extractedMessage.toLowerCase();

  if (
    lower.includes('token-service-api-has-not-been-used') ||
    lower.includes('securetoken.googleapis.com')
  ) {
    return {
      kind: 'unauthenticated',
      message:
        'Your saved login token expired and Google Cloud Token Service API (securetoken.googleapis.com) is disabled in project 1077034400988. Please sign in again, or enable Token Service API in Google Cloud Console so sessions auto-refresh after 1 hour.',
      raw: extractedMessage,
      path,
    };
  }

  if (
    lower.includes('missing or insufficient permissions') ||
    lower.includes('permission-denied') ||
    lower.includes('permission_denied')
  ) {
    return {
      kind: 'permission-denied',
      message: `Permission denied by Firestore Security Rules${path ? ` on ${path}` : ''}. Verify that your account is signed in and authorized for this role.`,
      raw: extractedMessage,
      path,
    };
  }
  if (
    lower.includes('client is offline') ||
    lower.includes('unavailable') ||
    lower.includes('network-request-failed') ||
    lower.includes('failed to fetch')
  ) {
    return {
      kind: 'offline',
      message:
        'Cloud Firestore connection was interrupted or is temporarily offline. Click Retry to reconnect.',
      raw: extractedMessage,
      path,
    };
  }
  if (lower.includes('quota exceeded') || lower.includes('resource-exhausted')) {
    return {
      kind: 'quota-exceeded',
      message:
        'Firestore free-tier daily quota has been reached. Quota resets automatically the next day.',
      raw: extractedMessage,
      path,
    };
  }
  if (lower.includes('not signed in') || lower.includes('unauthenticated')) {
    return {
      kind: 'unauthenticated',
      message: 'Please sign in to perform this action.',
      raw: extractedMessage,
      path,
    };
  }

  return {
    kind: 'unknown',
    message: extractedMessage,
    raw: extractedMessage,
    path,
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.warn('Firestore operation notice:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates that a restored User session has a usable ID token.
 * If the token is valid, keeps the session active so app restarts stay signed in.
 * If the token expired and `securetoken.googleapis.com` is disabled, cleanly signs out
 * so Firestore does not get locked in offline mode.
 */
export async function ensureValidAuthUserSession(user: User | null): Promise<{
  validUser: User | null;
  expiredReason?: string;
}> {
  if (!user) return { validUser: null };
  try {
    await user.getIdToken(false);
    return { validUser: user };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    console.warn('Restored auth session token could not be refreshed; signing out stale session:', raw);
    try {
      await fbSignOut(auth);
      window.indexedDB?.deleteDatabase('firebaseLocalStorageDb');
    } catch {
      // Ignore signout cleanup errors
    }
    cleanExpiredWebStorageAuthEntries();
    return {
      validUser: null,
      expiredReason: raw.includes('token-service-api-has-not-been-used')
        ? 'Your previous 1-hour login session expired (Token Service API is not yet enabled in Cloud Console). Please sign in again.'
        : 'Your previous login session expired. Please sign in again.',
    };
  }
}

export async function testFirestoreConnection(): Promise<{
  online: boolean;
  error?: string;
}> {
  try {
    if (auth.currentUser) {
      await ensureValidAuthUserSession(auth.currentUser);
    }
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { online: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (
      msg.includes('token-service-api-has-not-been-used') ||
      msg.includes('Fetching auth token failed')
    ) {
      await ensureValidAuthUserSession(auth.currentUser);
      return {
        online: false,
        error: 'Previous login token expired. Cleared stale session.',
      };
    }
    if (msg.includes('the client is offline')) {
      console.warn('Firestore connection check: client is currently offline.');
      return { online: false, error: 'Firestore client is offline.' };
    }
    return { online: true };
  }
}

testFirestoreConnection();

export function isCapacitorOrAndroidWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } };
  if (win.Capacitor?.isNativePlatform?.()) return true;
  const ua = navigator.userAgent || '';
  return /;\s*wv\)|Capacitor/i.test(ua);
}

export async function consumeGoogleRedirectResult(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth, browserPopupRedirectResolver);
    return res?.user || null;
  } catch (err) {
    console.warn('Redirect sign-in check notice:', err);
    return null;
  }
}

export async function signInWithGooglePopup(): Promise<{
  success: boolean;
  user: User | null;
  cancelled?: boolean;
  popupBlocked?: boolean;
  error?: string;
}> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const result = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
    return { success: true, user: result.user };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);

    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      msg.includes('popup-closed-by-user')
    ) {
      return {
        success: false,
        user: null,
        cancelled: true,
        error: 'Google Sign-In was cancelled before completion. You can try again or sign in with Email & Password.',
      };
    }

    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment' ||
      msg.includes('disallowed_useragent')
    ) {
      return {
        success: false,
        user: null,
        popupBlocked: true,
        error:
          'Google popup sign-in is blocked inside this Android WebView/browser. Please use Email & Password Sign-In below (fully supported on Android) or Redirect Sign-In.',
      };
    }

    return {
      success: false,
      user: null,
      error: msg,
    };
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  await signInWithRedirect(auth, provider, browserPopupRedirectResolver);
}

export async function signInWithEmailAccount(
  email: string,
  password: string
): Promise<{ success: boolean; user: User | null; error?: string }> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password'
    ) {
      return {
        success: false,
        user: null,
        error: 'Invalid email or password. If you do not have an account yet, switch to "Create New Account".',
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        user: null,
        error:
          'Email/Password Sign-In is not yet enabled in Firebase Console. Enable it under Authentication -> Sign-in method -> Email/Password.',
      };
    }
    return { success: false, user: null, error: msg };
  }
}

export async function createEmailAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<{ success: boolean; user: User | null; error?: string }> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName && displayName.trim().length >= 2) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
    return { success: true, user: cred.user };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    const msg = err instanceof Error ? err.message : String(err);
    if (code === 'auth/email-already-in-use') {
      return {
        success: false,
        user: null,
        error: 'An account with this email already exists. Please use "Sign In with Existing Account" instead.',
      };
    }
    if (code === 'auth/weak-password') {
      return {
        success: false,
        user: null,
        error: 'Password must be at least 6 characters long.',
      };
    }
    if (code === 'auth/operation-not-allowed') {
      return {
        success: false,
        user: null,
        error:
          'Email/Password Sign-In is not yet enabled in Firebase Console. Enable it under Authentication -> Sign-in method -> Email/Password.',
      };
    }
    return { success: false, user: null, error: msg };
  }
}

export async function sendPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function signOutFirebaseUser(): Promise<void> {
  cleanExpiredWebStorageAuthEntries();
  await fbSignOut(auth);
}

/**
 * Trusted Server-Verified Admin Authorization.
 * Verifies against:
 * 1. Server-signed Firebase ID token custom claim (`token.claims.admin === true`), OR
 * 2. Confirmed `/admins/{uid}` document in Cloud Firestore.
 */
export async function verifyServerAdminAccess(user: User | null): Promise<{
  isAdmin: boolean;
  canBootstrapFirstAdmin: boolean;
  adminRecord: AdminRecord | null;
}> {
  if (!user) {
    return { isAdmin: false, canBootstrapFirstAdmin: false, adminRecord: null };
  }

  let hasCustomAdminClaim = false;
  let tokenEmailVerified = false;
  let tokenEmail = '';

  try {
    const tokenResult = await user.getIdTokenResult(false);
    hasCustomAdminClaim = tokenResult.claims.admin === true;
    tokenEmailVerified = tokenResult.claims.email_verified === true;
    tokenEmail = String(tokenResult.claims.email || '');
  } catch {
    // Fallback to user properties if getIdTokenResult fails
  }

  try {
    const adminSnap = await getDoc(doc(db, 'admins', user.uid));
    if (adminSnap.exists()) {
      return {
        isAdmin: true,
        canBootstrapFirstAdmin: false,
        adminRecord: adminSnap.data() as AdminRecord,
      };
    }
  } catch {
    // If read fails, do not assume admin unless custom claim is present
  }

  if (hasCustomAdminClaim) {
    return {
      isAdmin: true,
      canBootstrapFirstAdmin: false,
      adminRecord: {
        uid: user.uid,
        email: tokenEmail || user.email || '',
        provisionedBy: 'CUSTOM_CLAIM',
        addedAt: new Date().toISOString(),
      },
    };
  }

  const canBootstrapFirstAdmin =
    tokenEmailVerified &&
    tokenEmail.trim().toLowerCase() === PROVISIONED_OWNER_BOOTSTRAP_EMAIL.toLowerCase();

  return {
    isAdmin: false,
    canBootstrapFirstAdmin,
    adminRecord: null,
  };
}

/**
 * Enforces that the currently signed-in Firebase user is a server-verified Admin
 * (`/admins/{uid}` document in Firestore or `token.claims.admin === true`).
 * Denies any non-admin account even if they bypass the UI screen and invoke an admin
 * operation directly.
 */
export async function requireVerifiedServerAdmin(expectedAdminUid?: string): Promise<string> {
  const user = auth.currentUser;
  if (!user || !user.uid || isLegacySyntheticId(user.uid)) {
    throw new Error(
      'PERMISSION_DENIED: You must be signed in with a real Firebase Authentication account to perform Admin operations.'
    );
  }
  if (expectedAdminUid && expectedAdminUid.trim() && expectedAdminUid.trim() !== user.uid) {
    throw new Error(
      'PERMISSION_DENIED: Admin actor UID mismatch with the active authenticated Firebase session.'
    );
  }
  const check = await verifyServerAdminAccess(user);
  if (!check.isAdmin) {
    throw new Error(
      `PERMISSION_DENIED: Account (${user.email || user.uid}) is not an authorized Admin in /admins/{uid}.`
    );
  }
  return user.uid;
}

export async function provisionAdminRecordInFirestore(params: {
  targetUid: string;
  targetEmail: string;
  actorUid: string;
}): Promise<{ success: boolean; adminRecord?: AdminRecord; error?: string }> {
  const user = auth.currentUser;
  if (!user || user.uid !== params.actorUid) {
    return {
      success: false,
      error: 'PERMISSION_DENIED: Active Firebase Authentication session required to provision Admin.',
    };
  }
  const adminCheck = await verifyServerAdminAccess(user);
  const isSelfBootstrap =
    adminCheck.canBootstrapFirstAdmin && params.targetUid.trim() === user.uid;

  if (!adminCheck.isAdmin && !isSelfBootstrap) {
    return {
      success: false,
      error:
        'PERMISSION_DENIED: Only an existing server-verified Admin (or the verified bootstrap owner account provisioning its own UID) can create /admins/{uid} records.',
    };
  }

  const nowIso = new Date().toISOString();
  const record: AdminRecord = {
    uid: params.targetUid.trim(),
    email: params.targetEmail.trim(),
    provisionedBy: params.actorUid,
    addedAt: nowIso,
  };
  const auditId = `audit_admin_${record.uid}_${Date.now()}`;
  const auditRecord: AdminAuditRecord = {
    id: auditId,
    action: 'ADMIN_PROVISIONED',
    actorUid: params.actorUid,
    targetId: record.uid,
    summary: `Provisioned Admin access for ${record.email} (UID: ${record.uid}).`,
    idempotencyKey: `provision_admin:${record.uid}:${nowIso}`,
    createdAt: nowIso,
  };

  try {
    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'admins', record.uid), {
        ...record,
        serverCreatedAt: serverTimestamp(),
      });
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...auditRecord,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, `admins/${record.uid}`);
    return { success: true, adminRecord: record };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export async function fetchAllAdminsFromFirestore(): Promise<AdminRecord[]> {
  try {
    await requireVerifiedServerAdmin();
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => d.data() as AdminRecord);
  } catch {
    return [];
  }
}

/**
 * Explicit Admin-triggered catalog initialization: Only creates initial Bapatla app_settings
 * or initial service categories if the document does not already exist in Firestore.
 * Never seeds fake users or fake bookings.
 */
export async function seedMissingCatalogIfAdmin(isCurrentUserAdmin: boolean): Promise<number> {
  if (!isCurrentUserAdmin) {
    return 0;
  }
  let createdCount = 0;
  try {
    const settingsRef = doc(db, 'app_settings', 'bapatla_config');
    const settingsSnap = await getDoc(settingsRef);
    if (!settingsSnap.exists()) {
      await setDoc(settingsRef, {
        ...BAPATLA_INITIAL_SETTINGS,
        serverUpdatedAt: serverTimestamp(),
      });
    }

    const existingServicesSnap = await getDocs(collection(db, 'services'));
    const existingIds = new Set(existingServicesSnap.docs.map((d) => d.id));

    const batch = writeBatch(db);
    for (const svc of INITIAL_SERVICES) {
      if (!existingIds.has(svc.id)) {
        batch.set(doc(db, 'services', svc.id), {
          ...svc,
          serverUpdatedAt: serverTimestamp(),
        });
        createdCount++;
      }
    }
    if (createdCount > 0) {
      await batch.commit();
    }
    return createdCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'services');
  }
}

export async function fetchUserProfile(uid: string): Promise<{
  profile: UserProfile | null;
  contact: UserPrivateContact | null;
  techProfile: TechnicianProfile | null;
}> {
  let profile: UserProfile | null = null;
  let contact: UserPrivateContact | null = null;
  let techProfile: TechnicianProfile | null = null;

  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      profile = userDoc.data() as UserProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }

  if (profile) {
    try {
      const contactDoc = await getDoc(doc(db, 'users', uid, 'private', 'contact'));
      if (contactDoc.exists()) {
        contact = contactDoc.data() as UserPrivateContact;
      }
    } catch {
      // Ignore if private contact doc not yet created
    }
  }

  try {
    const techDoc = await getDoc(doc(db, 'technicians', uid));
    if (techDoc.exists()) {
      techProfile = techDoc.data() as TechnicianProfile;
    }
  } catch {
    // Ignore if user is not a technician
  }

  return { profile, contact, techProfile };
}

/**
 * First-Time Profile Registration ONLY.
 * Uses a Firestore transaction to verify whether `/users/{uid}` or `/technicians/{uid}`
 * already exists. If the user already has a saved profile, it NEVER re-creates them or resets
 * their `coinBalance`, `approvalStatus`, `trialCoinsGranted`, `totalEarnings`, or `completedJobs`.
 */
export async function createFirstTimeUserProfileInFirestore(params: {
  uid: string;
  name: string;
  email: string;
  phone: string;
  defaultAddress: string;
  area: string;
  role: 'CUSTOMER' | 'TECHNICIAN';
  language: 'en' | 'te';
  skills?: string[];
  experienceYears?: number;
  bio?: string;
}): Promise<{
  profile: UserProfile;
  contact: UserPrivateContact;
  techProfile?: TechnicianProfile;
  alreadyExisted: boolean;
}> {
  const userRef = doc(db, 'users', params.uid);
  const contactRef = doc(db, 'users', params.uid, 'private', 'contact');
  const techRef = doc(db, 'technicians', params.uid);

  try {
    return await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const existingUserSnap = await transaction.get(userRef);
          const existingContactSnap = await transaction.get(contactRef);
          const existingTechSnap = await transaction.get(techRef);

          const nowIso = new Date().toISOString();

          if (existingUserSnap.exists()) {
            const existingProfile = existingUserSnap.data() as UserProfile;
            const existingContact: UserPrivateContact = existingContactSnap.exists()
              ? (existingContactSnap.data() as UserPrivateContact)
              : {
                  uid: params.uid,
                  email: params.email.trim().slice(0, 120),
                  phone: params.phone.replace(/\D/g, '').slice(0, 20),
                  defaultAddress: (params.defaultAddress || params.area).trim().slice(0, 300),
                  updatedAt: nowIso,
                };

            if (!existingContactSnap.exists()) {
              transaction.set(contactRef, {
                ...existingContact,
                serverUpdatedAt: serverTimestamp(),
              });
            }

            if (existingTechSnap.exists()) {
              const existingTech = existingTechSnap.data() as TechnicianProfile;
              return {
                profile: existingProfile,
                contact: existingContact,
                techProfile: existingTech,
                alreadyExisted: true,
              };
            }

            // If an existing CUSTOMER is registering their first-time TECHNICIAN profile under their UID:
            if (params.role === 'TECHNICIAN') {
              const techCheck = validateTechnicianProfileInput({
                uid: params.uid,
                name: params.name || existingProfile.name,
                phone: params.phone || existingContact.phone,
                area: params.area || existingProfile.area,
                defaultAddress: params.defaultAddress || existingContact.defaultAddress,
                skills:
                  params.skills && params.skills.length > 0 ? params.skills : ['electrician'],
                experienceYears: Number(params.experienceYears ?? 1),
                bio: params.bio || '',
              });
              if (!techCheck.valid || !techCheck.sanitized) {
                throw new Error(techCheck.error || 'Invalid technician registration details.');
              }

              const newTechProfile = buildInitialTechnicianProfile({
                uid: params.uid,
                name: techCheck.sanitized.name,
                phone: techCheck.sanitized.cleanPhone,
                area: techCheck.sanitized.area,
                skills: techCheck.sanitized.skills,
                experienceYears: techCheck.sanitized.experienceYears,
                bio: techCheck.sanitized.bio,
                nowIso,
              });

              const upgradedProfile: UserProfile = {
                ...existingProfile,
                name: techCheck.sanitized.name,
                area: techCheck.sanitized.area,
                role: existingProfile.role === 'ADMIN' ? 'ADMIN' : 'TECHNICIAN',
                updatedAt: nowIso,
              };

              const updatedContact: UserPrivateContact = {
                ...existingContact,
                phone: techCheck.sanitized.cleanPhone,
                defaultAddress: techCheck.sanitized.defaultAddress,
                updatedAt: nowIso,
              };

              transaction.update(userRef, {
                name: upgradedProfile.name,
                area: upgradedProfile.area,
                role: upgradedProfile.role,
                updatedAt: nowIso,
                serverUpdatedAt: serverTimestamp(),
              });
              transaction.set(contactRef, {
                ...updatedContact,
                serverUpdatedAt: serverTimestamp(),
              });
              transaction.set(techRef, {
                ...newTechProfile,
                serverCreatedAt: serverTimestamp(),
                serverUpdatedAt: serverTimestamp(),
              });

              return {
                profile: upgradedProfile,
                contact: updatedContact,
                techProfile: newTechProfile,
                alreadyExisted: false,
              };
            }

            return {
              profile: existingProfile,
              contact: existingContact,
              techProfile: undefined,
              alreadyExisted: true,
            };
          }

          const cleanPhone = params.phone.replace(/\D/g, '').slice(0, 20);
          const profile: UserProfile = {
            uid: params.uid,
            name: params.name.trim().slice(0, 80),
            email: params.email.trim().slice(0, 120),
            role: params.role,
            area: params.area.trim().slice(0, 80),
            language: params.language,
            phoneVerified: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          };

          const contact: UserPrivateContact = {
            uid: params.uid,
            email: params.email.trim().slice(0, 120),
            phone: cleanPhone,
            defaultAddress: (params.defaultAddress || params.area).trim().slice(0, 300),
            updatedAt: nowIso,
          };

          transaction.set(userRef, {
            ...profile,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          });
          transaction.set(contactRef, {
            ...contact,
            serverUpdatedAt: serverTimestamp(),
          });

          let techProfile: TechnicianProfile | undefined;
          if (params.role === 'TECHNICIAN') {
            if (existingTechSnap.exists()) {
              techProfile = existingTechSnap.data() as TechnicianProfile;
            } else {
              const techCheck = validateTechnicianProfileInput({
                uid: params.uid,
                name: params.name,
                phone: cleanPhone,
                area: params.area,
                defaultAddress: params.defaultAddress,
                skills:
                  params.skills && params.skills.length > 0 ? params.skills : ['electrician'],
                experienceYears: Number(params.experienceYears ?? 1),
                bio: params.bio || '',
              });
              if (!techCheck.valid || !techCheck.sanitized) {
                throw new Error(techCheck.error || 'Invalid technician registration details.');
              }
              techProfile = buildInitialTechnicianProfile({
                uid: params.uid,
                name: techCheck.sanitized.name,
                phone: techCheck.sanitized.cleanPhone,
                area: techCheck.sanitized.area,
                skills: techCheck.sanitized.skills,
                experienceYears: techCheck.sanitized.experienceYears,
                bio: techCheck.sanitized.bio,
                nowIso,
              });
              transaction.set(techRef, {
                ...techProfile,
                serverCreatedAt: serverTimestamp(),
                serverUpdatedAt: serverTimestamp(),
              });
            }
          }

          return {
            profile,
            contact,
            techProfile,
            alreadyExisted: false,
          };
        }),
      `users/${params.uid}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.WRITE, `users/${params.uid}`);
    }
    throw error;
  }
}

/**
 * Safe Profile Editing for Existing Users & Technicians.
 */
export async function updateExistingUserProfileInFirestore(params: {
  uid: string;
  name: string;
  phone: string;
  defaultAddress: string;
  area: string;
  skills?: string[];
  experienceYears?: number;
  bio?: string;
}): Promise<{
  profile: UserProfile;
  contact: UserPrivateContact;
  techProfile: TechnicianProfile | null;
}> {
  const userRef = doc(db, 'users', params.uid);
  const contactRef = doc(db, 'users', params.uid, 'private', 'contact');
  const techRef = doc(db, 'technicians', params.uid);

  try {
    return await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(userRef);
          const contactSnap = await transaction.get(contactRef);
          const techSnap = await transaction.get(techRef);

          if (!userSnap.exists()) {
            throw new Error(
              'User profile does not exist yet. Please complete first-time registration.'
            );
          }

          const existingUser = userSnap.data() as UserProfile;
          const existingContact = contactSnap.exists()
            ? (contactSnap.data() as UserPrivateContact)
            : null;
          const existingTech = techSnap.exists()
            ? (techSnap.data() as TechnicianProfile)
            : null;

          if (existingTech) {
            const techCheck = validateTechnicianProfileInput({
              uid: params.uid,
              name: params.name,
              phone: params.phone,
              area: params.area,
              defaultAddress: params.defaultAddress,
              skills:
                params.skills && params.skills.length > 0
                  ? params.skills
                  : existingTech.skills,
              experienceYears:
                typeof params.experienceYears === 'number'
                  ? params.experienceYears
                  : existingTech.experienceYears,
              bio: typeof params.bio === 'string' ? params.bio : existingTech.bio,
            });
            if (!techCheck.valid) {
              throw new Error(techCheck.error || 'Invalid technician profile edit details.');
            }
          }

          const nowIso = new Date().toISOString();
          const merged = mergeProfileEditSafely({
            existingUser,
            existingContact,
            existingTech,
            edits: {
              name: params.name,
              phone: params.phone.replace(/\D/g, ''),
              defaultAddress: params.defaultAddress,
              area: params.area,
              skills: params.skills,
              experienceYears: params.experienceYears,
              bio: params.bio,
            },
            nowIso,
          });

          transaction.update(userRef, {
            name: merged.updatedUser.name,
            area: merged.updatedUser.area,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.set(contactRef, {
            ...merged.updatedContact,
            serverUpdatedAt: serverTimestamp(),
          });

          if (merged.updatedTech) {
            transaction.update(techRef, {
              name: merged.updatedTech.name,
              phone: merged.updatedTech.phone,
              area: merged.updatedTech.area,
              skills: merged.updatedTech.skills,
              experienceYears: merged.updatedTech.experienceYears,
              bio: merged.updatedTech.bio,
              updatedAt: nowIso,
              serverUpdatedAt: serverTimestamp(),
            });
          }

          return {
            profile: merged.updatedUser,
            contact: merged.updatedContact,
            techProfile: merged.updatedTech,
          };
        }),
      `users/${params.uid}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${params.uid}`);
    }
    throw error;
  }
}

/**
 * Ensures the browser is online and wraps a Firestore server operation with a bounded timeout
 * so offline writes never hang indefinitely or falsely report local-only success.
 */
export async function runWithServerAcknowledgment<T>(
  operation: () => Promise<T>,
  path: string,
  timeoutMs = 9000
): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new Error(
      `Client is offline: Cannot reach Cloud Firestore to save ${path}. Please reconnect and retry.`
    );
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(
            new Error(
              `Client is offline or connection timed out while waiting for Cloud Firestore acknowledgment on ${path}.`
            )
          );
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function updateUserAreaAndLanguageInFirestore(
  uid: string,
  updates: { area?: string; language?: 'en' | 'te' }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const payload: Record<string, unknown> = {
    updatedAt: nowIso,
    serverUpdatedAt: serverTimestamp(),
  };
  if (updates.area) payload.area = updates.area.trim().slice(0, 80);
  if (updates.language) payload.language = updates.language;

  try {
    await runWithServerAcknowledgment(
      () => updateDoc(doc(db, 'users', uid), payload),
      `users/${uid}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

/**
 * Compresses & encodes a validated image File into a Firestore-safe base64 Data URL
 * while reporting step-by-step progress, then uploads to protected Firestore storage
 * (`/users/{customerUid}/private/photo_draft`) so upload errors / offline states
 * can be retried before or during booking submission.
 */
export async function uploadCustomerPhotoToProtectedStorage(params: {
  file: File;
  customerUid: string;
  draftBookingId?: string;
  onProgress?: (percent: number, stage: string) => void;
}): Promise<{
  success: boolean;
  photo?: BookingProtectedPhoto;
  error?: string;
}> {
  const { file, customerUid, draftBookingId, onProgress } = params;
  onProgress?.(10, 'Validating file type & size...');

  const fileValidation = validateBookingPhotoFile({
    name: file.name,
    type: file.type,
    size: file.size,
  });
  if (!fileValidation.valid) {
    return { success: false, error: fileValidation.error };
  }

  if (!customerUid || isLegacySyntheticId(customerUid)) {
    return {
      success: false,
      error: 'Please sign in with your Firebase account before uploading a photo.',
    };
  }

  try {
    onProgress?.(35, 'Reading and optimizing image...');
    const processed = await new Promise<{
      dataUrl: string;
      width: number;
      height: number;
      mimeType: string;
    }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Could not read the selected image file.'));
      reader.onload = () => {
        const rawDataUrl = String(reader.result || '');
        if (!rawDataUrl.startsWith('data:image/')) {
          reject(new Error('Selected file is not a valid image.'));
          return;
        }
        const img = new Image();
        img.onerror = () => reject(new Error('Selected image file is corrupted or unreadable.'));
        img.onload = () => {
          const maxDim = 960;
          let targetW = img.naturalWidth || img.width || 640;
          let targetH = img.naturalHeight || img.height || 480;
          if (targetW > maxDim || targetH > maxDim) {
            const ratio = Math.min(maxDim / targetW, maxDim / targetH);
            targetW = Math.max(1, Math.round(targetW * ratio));
            targetH = Math.max(1, Math.round(targetH * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve({
              dataUrl: rawDataUrl,
              width: targetW,
              height: targetH,
              mimeType: file.type,
            });
            return;
          }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          const outMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          let compressedUrl = canvas.toDataURL(outMime, 0.78);
          if (compressedUrl.length > 650000) {
            compressedUrl = canvas.toDataURL('image/jpeg', 0.6);
          }
          resolve({
            dataUrl: compressedUrl,
            width: targetW,
            height: targetH,
            mimeType: compressedUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
          });
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });

    onProgress?.(70, 'Uploading to protected Firestore storage...');
    const nowIso = new Date().toISOString();
    const photoRecord: BookingProtectedPhoto = {
      bookingId: draftBookingId || `draft_${customerUid.slice(0, 10)}`,
      customerId: customerUid,
      fileName: file.name.trim().slice(0, 120),
      mimeType: processed.mimeType,
      sizeBytes: Math.trunc(file.size),
      width: Math.trunc(processed.width),
      height: Math.trunc(processed.height),
      dataUrl: processed.dataUrl,
      createdAt: nowIso,
    };

    const payloadCheck = validateProtectedPhotoPayload(photoRecord);
    if (!payloadCheck.valid) {
      return { success: false, error: payloadCheck.error };
    }

    const draftRef = doc(db, 'users', customerUid, 'private', 'photo_draft');
    await runWithServerAcknowledgment(
      () =>
        setDoc(draftRef, {
          ...photoRecord,
          serverCreatedAt: serverTimestamp(),
        }),
      `users/${customerUid}/private/photo_draft`
    );

    onProgress?.(100, 'Photo uploaded to protected storage.');
    return { success: true, photo: photoRecord };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export async function removeCustomerPhotoDraftFromProtectedStorage(
  customerUid: string
): Promise<void> {
  if (!customerUid) return;
  try {
    await deleteDoc(doc(db, 'users', customerUid, 'private', 'photo_draft'));
  } catch {
    // Ignore cleanup notice
  }
}

export async function fetchProtectedBookingPhoto(
  bookingId: string
): Promise<BookingProtectedPhoto | null> {
  try {
    const snap = await getDoc(doc(db, 'bookings', bookingId, 'private', 'photo'));
    if (snap.exists()) {
      return snap.data() as BookingProtectedPhoto;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Protected Operation 1: Customer creates a booking in PENDING state with separately protected
 * address and phone details in `/bookings/{bookingId}/private/details` and optional
 * protected photo in `/bookings/{bookingId}/private/photo`.
 * Uses a server-acknowledged Firestore transaction (`runTransaction`) so:
 * - Duplicate booking IDs / repeated taps are rejected atomically.
 * - Disabled or missing services in `/services/{serviceId}` are rejected on the server.
 * - Offline clients fail honestly instead of showing premature local confirmation.
 */
export async function createBookingInFirestore(
  booking: Booking,
  privateDetails: BookingPrivateDetails,
  notification: NotificationItem,
  protectedPhoto?: BookingProtectedPhoto | null,
  customerNotification?: NotificationItem | null
): Promise<void> {
  const bookingRef = doc(db, 'bookings', booking.id);
  const detailsRef = doc(db, 'bookings', booking.id, 'private', 'details');
  const photoRef = doc(db, 'bookings', booking.id, 'private', 'photo');
  const serviceRef = doc(db, 'services', booking.serviceId);
  const notifRef = doc(db, 'notifications', notification.id);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const [existingBookingSnap, serviceSnap] = await Promise.all([
            transaction.get(bookingRef),
            transaction.get(serviceRef),
          ]);

          if (existingBookingSnap.exists()) {
            const existingBk = existingBookingSnap.data() as Booking;
            if (existingBk.status !== 'CANCELLED' && existingBk.status !== 'CONFIRMED') {
              throw new Error(
                `Duplicate booking prevented: Your request (#${booking.id.slice(-6).toUpperCase()}) is already active in Cloud Firestore.`
              );
            }
            throw new Error(
              `Duplicate booking request (#${booking.id.slice(-6).toUpperCase()}) was already processed.`
            );
          }

          if (!serviceSnap.exists()) {
            throw new Error(
              `Service "${booking.serviceNameEn}" does not exist in the shared Firestore catalogue.`
            );
          }

          const serverService = serviceSnap.data() as ServiceCategory;
          if (!serverService.enabled) {
            throw new Error(
              `Service "${serverService.nameEn}" is currently disabled and cannot accept new bookings.`
            );
          }

          const hasPhoto = Boolean(protectedPhoto && protectedPhoto.dataUrl);
          transaction.set(bookingRef, {
            ...booking,
            hasUploadedPhoto: hasPhoto,
            idempotencyKey:
              booking.idempotencyKey || `create:${booking.id}:${booking.customerId}`,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.set(detailsRef, {
            ...privateDetails,
            bookingId: booking.id,
            createdAt: booking.createdAt,
            serverCreatedAt: serverTimestamp(),
          });

          if (hasPhoto && protectedPhoto) {
            const attachedPhoto: BookingProtectedPhoto = {
              ...protectedPhoto,
              bookingId: booking.id,
              customerId: booking.customerId,
              createdAt: booking.createdAt,
            };
            const photoCheck = validateProtectedPhotoPayload(attachedPhoto);
            if (!photoCheck.valid) {
              throw new Error(photoCheck.error || 'Invalid protected photo attachment.');
            }
            transaction.set(photoRef, {
              ...attachedPhoto,
              serverCreatedAt: serverTimestamp(),
            });
          }

          transaction.set(notifRef, {
            ...notification,
            serverCreatedAt: serverTimestamp(),
          });

          if (customerNotification) {
            transaction.set(doc(db, 'notifications', customerNotification.id), {
              ...customerNotification,
              serverCreatedAt: serverTimestamp(),
            });
          }
        }),
      `bookings/${booking.id}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.CREATE, `bookings/${booking.id}`);
    }
    throw error;
  }
}

export async function fetchProtectedBookingDetails(
  bookingId: string
): Promise<BookingPrivateDetails | null> {
  try {
    const snap = await getDoc(doc(db, 'bookings', bookingId, 'private', 'details'));
    if (snap.exists()) {
      return snap.data() as BookingPrivateDetails;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Protected Operation 2: Customer cancels a PENDING booking.
 * Enforces in a Firestore transaction that only the booking customer (or Admin) can cancel
 * and only while the booking is still in PENDING state.
 */
export async function cancelPendingBookingInFirestore(
  bookingId: string,
  actorUid?: string,
  isAdmin?: boolean
): Promise<void> {
  const bookingRef = doc(db, 'bookings', bookingId);
  const callerUid = actorUid || auth.currentUser?.uid || '';

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const bookingSnap = await transaction.get(bookingRef);
          if (!bookingSnap.exists()) {
            throw new Error('Booking not found.');
          }
          const booking = bookingSnap.data() as Booking;

          const check = validateBookingStateTransition({
            currentStatus: booking.status,
            nextStatus: 'CANCELLED',
            actorUid: callerUid,
            bookingCustomerId: booking.customerId,
            bookingTechnicianId: booking.technicianId,
            isAdmin,
          });

          if (!check.valid) {
            throw new Error(check.error);
          }

          const nowIso = new Date().toISOString();
          transaction.update(bookingRef, {
            status: 'CANCELLED',
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });
        }),
      `bookings/${bookingId}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
    throw error;
  }
}

/**
 * Protected Operation 3: Eligible, Approved, Available Technician Atomically Accepts a Matching
 * PENDING Booking.
 * - Assigns 1 technician and deducts 1 coin atomically.
 * - Uses deterministic ledger document ID `ctx_accept_${bookingId}_${technicianUid}` so losing
 *   or repeated acceptance requests NEVER deduct another coin.
 */
export async function acceptBookingTransactionInFirestore(
  bookingId: string,
  technicianUid: string
): Promise<{ success: boolean; error?: string }> {
  const callerUid = auth.currentUser?.uid || '';
  if (!callerUid || callerUid !== technicianUid) {
    return {
      success: false,
      error: 'Security Violation: You can only accept jobs using your own signed-in Firebase UID.',
    };
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const techRef = doc(db, 'technicians', technicianUid);
  const deterministic = buildDeterministicCommandKey(
    'ACCEPT_BOOKING',
    bookingId,
    technicianUid
  );
  const txRef = doc(db, 'coin_transactions', deterministic.docId);
  const notifId = `notif_accept_${bookingId}_${technicianUid}`;
  const notifRef = doc(db, 'notifications', notifId);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const [bookingSnap, techSnap, existingTxSnap] = await Promise.all([
            transaction.get(bookingRef),
            transaction.get(techRef),
            transaction.get(txRef),
          ]);

          if (!bookingSnap.exists()) {
            throw new Error('Booking does not exist.');
          }
          if (!techSnap.exists()) {
            throw new Error('Technician profile not found in Firestore.');
          }
          if (existingTxSnap.exists()) {
            throw new Error(
              'Duplicate acceptance request detected (idempotency guard). No extra coin was deducted.'
            );
          }

          const booking = bookingSnap.data() as Booking;
          const tech = techSnap.data() as TechnicianProfile;

          const eligibility = checkBookingAcceptanceEligibility(tech, booking);
          if (!eligibility.eligible) {
            throw new Error(eligibility.reason || 'Not eligible to accept this booking.');
          }

          const nowIso = new Date().toISOString();
          const prevBalance = Math.trunc(Number(tech.coinBalance));
          const newBalance = prevBalance - 1;
          if (newBalance < 0) {
            throw new Error('Insufficient coin balance (coin balances cannot become negative).');
          }

          transaction.update(techRef, {
            coinBalance: newBalance,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.update(bookingRef, {
            status: 'ACCEPTED',
            technicianId: tech.uid,
            technicianName: tech.name,
            technicianPhone: tech.phone,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          const coinTx: CoinTransaction = {
            id: deterministic.docId,
            technicianId: tech.uid,
            technicianName: tech.name,
            delta: -1,
            prevBalance,
            balanceAfter: newBalance,
            reason: 'JOB_ACCEPTANCE_DEDUCTION',
            bookingId: booking.id,
            actorId: tech.uid,
            idempotencyKey: deterministic.idempotencyKey,
            createdAt: nowIso,
          };
          transaction.set(txRef, {
            ...coinTx,
            serverCreatedAt: serverTimestamp(),
          });

          const notif: NotificationItem = {
            id: notifId,
            recipientId: booking.customerId,
            titleEn: 'Technician Accepted Your Booking',
            titleTe: 'టెక్నీషియన్ మీ బుకింగ్ అంగీకరించారు',
            messageEn: `${tech.name} (+91 ${tech.phone}) accepted your ${booking.serviceNameEn} request in ${booking.generalArea}.`,
            messageTe: `${tech.name} (+91 ${tech.phone}) మీ ${booking.serviceNameTe} అభ్యర్థనను అంగీకరించారు.`,
            type: 'BOOKING_ACCEPTED',
            bookingId: booking.id,
            read: false,
            createdAt: nowIso,
          };
          transaction.set(notifRef, {
            ...notif,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `bookings/${bookingId}`
    );
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Protected Operation 4: Approved Technician toggles availability.
 */
export async function toggleTechnicianAvailabilityInFirestore(
  technicianUid: string,
  nextAvailable: boolean
): Promise<void> {
  const callerUid = auth.currentUser?.uid || '';
  if (!callerUid || callerUid !== technicianUid) {
    throw new Error(
      'Security Violation: You can only update availability for your own signed-in technician account.'
    );
  }

  const techRef = doc(db, 'technicians', technicianUid);
  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const techSnap = await transaction.get(techRef);
          if (!techSnap.exists()) {
            throw new Error('Technician profile not found.');
          }
          const tech = techSnap.data() as TechnicianProfile;
          const nowIso = new Date().toISOString();
          const check = validateTechnicianAvailabilityUpdate({
            technician: tech,
            actorUid: callerUid,
            nextAvailable,
            nowIso,
          });
          if (!check.valid) {
            throw new Error(check.error || 'Only APPROVED technicians can turn online availability ON.');
          }

          transaction.update(techRef, {
            isAvailable: nextAvailable,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });
        }),
      `technicians/${technicianUid}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `technicians/${technicianUid}`);
    }
    throw error;
  }
}

/**
 * Protected Operation 5: Assigned Technician Starts Work (ACCEPTED -> IN_PROGRESS).
 */
export async function startBookingWorkInFirestore(
  bookingId: string,
  technicianUid: string
): Promise<void> {
  const callerUid = auth.currentUser?.uid || '';
  if (!callerUid || callerUid !== technicianUid) {
    throw new Error(
      'Security Violation: You can only start work using your own signed-in technician UID.'
    );
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const notifId = `notif_start_${bookingId}_${technicianUid}`;
  const notifRef = doc(db, 'notifications', notifId);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const bookingSnap = await transaction.get(bookingRef);
          if (!bookingSnap.exists()) {
            throw new Error('Booking not found.');
          }
          const booking = bookingSnap.data() as Booking;
          const nowIso = new Date().toISOString();

          const started = startWorkOnBooking({
            booking,
            technicianUid,
            nowIso,
          });
          if (!started.success) {
            throw new Error(started.error || 'Invalid state transition for starting work.');
          }

          transaction.update(bookingRef, {
            status: 'IN_PROGRESS',
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          const notif: NotificationItem = {
            id: notifId,
            recipientId: booking.customerId,
            titleEn: `Work Started: ${booking.serviceNameEn}`,
            titleTe: `పని ప్రారంభమైంది: ${booking.serviceNameTe}`,
            messageEn: `${booking.technicianName || 'Your technician'} has arrived and started work on booking #${booking.id.slice(-6).toUpperCase()}.`,
            messageTe: `${booking.technicianName || 'టెక్నీషియన్'} పని ప్రారంభించారు (#${booking.id.slice(-6).toUpperCase()}).`,
            type: 'WORK_STARTED',
            bookingId: booking.id,
            read: false,
            createdAt: nowIso,
          };
          transaction.set(notifRef, {
            ...notif,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `bookings/${bookingId}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
    throw error;
  }
}

/**
 * Protected Operation 6: Assigned Technician Submits Validated Labour Charges (IN_PROGRESS -> WORK_COMPLETED).
 */
export async function completeBookingWorkInFirestore(
  bookingId: string,
  technicianUid: string,
  labourCharges: number
): Promise<void> {
  const callerUid = auth.currentUser?.uid || '';
  if (!callerUid || callerUid !== technicianUid) {
    throw new Error(
      'Security Violation: You can only complete work using your own signed-in technician UID.'
    );
  }

  const roundedAmount = Math.round(Number(labourCharges));
  if (
    !Number.isFinite(roundedAmount) ||
    roundedAmount <= 0 ||
    roundedAmount > MAX_VALID_LABOUR_CHARGE
  ) {
    throw new Error(
      `Please enter a valid final labour charge between ₹1 and ₹${MAX_VALID_LABOUR_CHARGE}.`
    );
  }

  const bookingRef = doc(db, 'bookings', bookingId);
  const notifId = `notif_complete_${bookingId}_${technicianUid}`;
  const notifRef = doc(db, 'notifications', notifId);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const bookingSnap = await transaction.get(bookingRef);
          if (!bookingSnap.exists()) {
            throw new Error('Booking not found.');
          }
          const booking = bookingSnap.data() as Booking;
          const nowIso = new Date().toISOString();

          const submitted = submitLabourChargesOnBooking({
            booking,
            technicianUid,
            labourCharges: roundedAmount,
            nowIso,
          });
          if (!submitted.success) {
            throw new Error(submitted.error || 'Invalid state transition for completing work.');
          }

          transaction.update(bookingRef, {
            status: 'WORK_COMPLETED',
            labourCharges: roundedAmount,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          const notif: NotificationItem = {
            id: notifId,
            recipientId: booking.customerId,
            titleEn: `Confirm Work Completion (₹${roundedAmount})`,
            titleTe: `పని పూర్తయింది — నిర్ధారించండి (₹${roundedAmount})`,
            messageEn: `${booking.technicianName || 'Technician'} marked your ${booking.serviceNameEn} job completed with ₹${roundedAmount} labour charges. Please confirm completion in My Bookings.`,
            messageTe: `${booking.serviceNameTe} పని ₹${roundedAmount} ఛార్జీలతో పూర్తయింది. దయచేసి నిర్ధారించండి.`,
            type: 'WORK_COMPLETED',
            bookingId: booking.id,
            read: false,
            createdAt: nowIso,
          };
          transaction.set(notifRef, {
            ...notif,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `bookings/${bookingId}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
    throw error;
  }
}

/**
 * Protected Operation 7: Booking Customer Confirms Work Completion (WORK_COMPLETED -> CONFIRMED).
 * Records completion and technician earnings EXACTLY ONCE using the deterministic
 * `/booking_completions/{bookingId}` document.
 */
export async function confirmWorkCompletionInFirestore(
  bookingId: string,
  customerUid: string
): Promise<{ success: boolean; error?: string }> {
  const bookingRef = doc(db, 'bookings', bookingId);
  const completionRef = doc(db, 'booking_completions', bookingId);
  const deterministic = buildDeterministicCommandKey(
    'CONFIRM_COMPLETION',
    bookingId,
    customerUid
  );

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const [bookingSnap, existingCompletionSnap] = await Promise.all([
            transaction.get(bookingRef),
            transaction.get(completionRef),
          ]);

          if (!bookingSnap.exists()) {
            throw new Error('Booking document not found.');
          }
          if (existingCompletionSnap.exists()) {
            throw new Error(
              'Work completion and technician earnings were already recorded for this booking.'
            );
          }

          const booking = bookingSnap.data() as Booking;
          if (booking.customerId !== customerUid) {
            throw new Error('Only the customer who created the booking can confirm completion.');
          }
          if (booking.status !== 'WORK_COMPLETED') {
            throw new Error(
              'Booking must be marked WORK_COMPLETED before customer confirmation.'
            );
          }
          const validatedCharge = Math.round(Number(booking.labourCharges));
          if (validatedCharge <= 0 || validatedCharge > MAX_VALID_LABOUR_CHARGE) {
            throw new Error(
              'Valid labour charges greater than ₹0 must be recorded before confirmation.'
            );
          }

          const techRef = doc(db, 'technicians', booking.technicianId);
          const techSnap = await transaction.get(techRef);
          if (!techSnap.exists()) {
            throw new Error('Assigned technician profile not found.');
          }

          const tech = techSnap.data() as TechnicianProfile;
          const prevEarnings = Number(tech.totalEarnings || 0);
          const newEarnings = prevEarnings + validatedCharge;
          const prevJobs = Math.trunc(Number(tech.completedJobs || 0));
          const newJobs = prevJobs + 1;
          const nowIso = new Date().toISOString();

          const completionRecord: BookingCompletionRecord = {
            id: bookingId,
            bookingId,
            customerId: booking.customerId,
            technicianId: tech.uid,
            technicianName: tech.name,
            serviceId: booking.serviceId,
            labourCharges: validatedCharge,
            prevTechnicianEarnings: prevEarnings,
            newTechnicianEarnings: newEarnings,
            prevCompletedJobs: prevJobs,
            newCompletedJobs: newJobs,
            idempotencyKey: deterministic.idempotencyKey,
            confirmedAt: nowIso,
          };

          transaction.update(bookingRef, {
            status: 'CONFIRMED',
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.update(techRef, {
            totalEarnings: newEarnings,
            completedJobs: newJobs,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.set(completionRef, {
            ...completionRecord,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `booking_completions/${bookingId}`
    );
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Customer submits a review for a CONFIRMED booking using deterministic ID `rev_${bookingId}`
 * so each confirmed booking can be reviewed at most once.
 * Never auto-generates a positive review.
 */
export async function submitCustomerReviewInFirestore(params: {
  bookingId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  rating: number;
  comment: string;
}): Promise<{ success: boolean; error?: string }> {
  const deterministic = buildDeterministicCommandKey(
    'REVIEW_BOOKING',
    params.bookingId,
    params.customerId
  );
  const reviewId = deterministic.docId;
  const bookingRef = doc(db, 'bookings', params.bookingId);
  const techRef = doc(db, 'technicians', params.technicianId);
  const reviewRef = doc(db, 'reviews', reviewId);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const [bookingSnap, techSnap, existingReviewSnap] = await Promise.all([
            transaction.get(bookingRef),
            transaction.get(techRef),
            transaction.get(reviewRef),
          ]);

          if (!bookingSnap.exists()) {
            throw new Error('Booking not found.');
          }
          if (!techSnap.exists()) {
            throw new Error('Technician not found.');
          }

          const booking = bookingSnap.data() as Booking;
          const tech = techSnap.data() as TechnicianProfile;
          const existingIds = new Set<string>();
          if (existingReviewSnap.exists()) {
            existingIds.add(reviewId);
          }

          const reviewCheck = validateCustomerReviewInput({
            booking,
            customerUid: params.customerId,
            rating: params.rating,
            comment: params.comment,
            existingReviewIds: existingIds,
          });
          if (!reviewCheck.valid || !reviewCheck.clampedRating || !reviewCheck.sanitizedComment) {
            throw new Error(reviewCheck.error || 'Invalid review submission.');
          }

          const nowIso = new Date().toISOString();
          const clampedRating = reviewCheck.clampedRating;
          const totalScore = (tech.ratingAvg || 0) * (tech.ratingCount || 0) + clampedRating;
          const nextCount = Math.trunc(Number(tech.ratingCount || 0)) + 1;
          const nextAvg = Number((totalScore / nextCount).toFixed(1));

          const reviewDoc: CustomerReview = {
            id: reviewId,
            bookingId: params.bookingId,
            customerId: params.customerId,
            customerName: params.customerName.trim().slice(0, 80),
            technicianId: params.technicianId,
            serviceId: booking.serviceId,
            rating: clampedRating,
            comment: reviewCheck.sanitizedComment,
            createdAt: nowIso,
          };

          transaction.set(reviewRef, {
            ...reviewDoc,
            serverCreatedAt: serverTimestamp(),
          });
          transaction.update(bookingRef, {
            rated: true,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });
          transaction.update(techRef, {
            ratingAvg: nextAvg,
            ratingCount: nextCount,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });
        }),
      `reviews/${reviewId}`
    );
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.WRITE, `reviews/${reviewId}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Marks a single in-app notification as read (`read: true`) in Cloud Firestore.
 */
export async function markNotificationAsReadInFirestore(
  notifId: string
): Promise<{ success: boolean; error?: string }> {
  if (!notifId) return { success: false, error: 'Invalid notification ID.' };
  try {
    await runWithServerAcknowledgment(
      () =>
        updateDoc(doc(db, 'notifications', notifId), {
          read: true,
        }),
      `notifications/${notifId}`
    );
    return { success: true };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

/**
 * Marks multiple unread notifications as read (`read: true`) in Cloud Firestore.
 */
export async function markAllNotificationsAsReadInFirestore(
  notifIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const validIds = notifIds.filter(Boolean);
  if (validIds.length === 0) return { success: true };
  try {
    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      validIds.forEach((id) => {
        batch.update(doc(db, 'notifications', id), { read: true });
      });
      await batch.commit();
    }, 'notifications');
    return { success: true };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

/**
 * Protected Operation 8: Admin Approves Technician and Grants 3 Trial Coins ONCE EVER
 * using durable `trialCoinsGranted: true` marker and deterministic ledger ID `ctx_trial_${techUid}`.
 * Safe under duplicate and concurrent approval requests via Firestore `runTransaction`.
 */
export async function adminApproveTechnicianInFirestore(
  techUid: string,
  adminUid: string
): Promise<{ success: boolean; trialCoinsGrantedNow?: number; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
    const techRef = doc(db, 'technicians', techUid);
    const deterministic = buildDeterministicCommandKey('TRIAL_GRANT', techUid, verifiedAdminUid);
    const txRef = doc(db, 'coin_transactions', deterministic.docId);

    const trialCoinsGrantedNow = await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const [techSnap, deterministicTxSnap] = await Promise.all([
            transaction.get(techRef),
            transaction.get(txRef),
          ]);
          if (!techSnap.exists()) {
            throw new Error('Technician document not found.');
          }
          const tech = techSnap.data() as TechnicianProfile;
          const nowIso = new Date().toISOString();

          const existingIds = new Set<string>();
          if (deterministicTxSnap.exists()) {
            existingIds.add(deterministic.docId);
          }

          const decisionOutcome = executeAdminTechnicianStatusDecision({
            technician: tech,
            decision: 'APPROVED',
            adminUid: verifiedAdminUid,
            isAdminAuthorized: true,
            nowIso,
            existingLedgerIds: existingIds,
            alreadyReceivedTrialCoins:
              tech.trialCoinsGranted === true || deterministicTxSnap.exists(),
          });

          if (!decisionOutcome.success || !decisionOutcome.auditRecord) {
            throw new Error(decisionOutcome.error || 'Could not approve technician.');
          }

          transaction.update(techRef, {
            approvalStatus: 'APPROVED',
            isAvailable: true,
            trialCoinsGranted: true,
            coinBalance: decisionOutcome.updatedTechnician.coinBalance,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          if (decisionOutcome.coinTransaction) {
            transaction.set(txRef, {
              ...decisionOutcome.coinTransaction,
              serverCreatedAt: serverTimestamp(),
            });
          }

          const auditId = `audit_approve_${tech.uid}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 6)}`;
          transaction.set(doc(db, 'admin_audit_logs', auditId), {
            ...decisionOutcome.auditRecord,
            id: auditId,
            serverCreatedAt: serverTimestamp(),
          });

          return decisionOutcome.trialCoinsGrantedNow;
        }),
      `technicians/${techUid}`
    );

    return { success: true, trialCoinsGrantedNow };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `technicians/${techUid}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Protected Operation 8b: Admin Rejects Technician Application and writes immutable AdminAuditRecord.
 */
export async function adminRejectTechnicianInFirestore(
  technicianUid: string,
  adminUid?: string,
  reasonNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
    const techRef = doc(db, 'technicians', technicianUid);

    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const techSnap = await transaction.get(techRef);
          if (!techSnap.exists()) {
            throw new Error('Technician document not found.');
          }
          const tech = techSnap.data() as TechnicianProfile;
          const nowIso = new Date().toISOString();

          const decisionOutcome = executeAdminTechnicianStatusDecision({
            technician: tech,
            decision: 'REJECTED',
            adminUid: verifiedAdminUid,
            isAdminAuthorized: true,
            nowIso,
            reasonNote,
          });

          if (!decisionOutcome.success || !decisionOutcome.auditRecord) {
            throw new Error(decisionOutcome.error || 'Could not reject technician.');
          }

          transaction.update(techRef, {
            approvalStatus: 'REJECTED',
            isAvailable: false,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          const auditId = `audit_reject_${technicianUid}_${Date.now()}`;
          transaction.set(doc(db, 'admin_audit_logs', auditId), {
            ...decisionOutcome.auditRecord,
            id: auditId,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `technicians/${technicianUid}`
    );
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `technicians/${technicianUid}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Protected Operation 9: Admin Suspends Technician, forces `isAvailable: false`, and writes AdminAuditRecord.
 */
export async function adminSuspendTechnicianInFirestore(
  technicianUid: string,
  adminUid?: string,
  reasonNote?: string
): Promise<void> {
  const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
  const techRef = doc(db, 'technicians', technicianUid);

  try {
    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const techSnap = await transaction.get(techRef);
          if (!techSnap.exists()) {
            throw new Error('Technician document not found.');
          }
          const tech = techSnap.data() as TechnicianProfile;
          const nowIso = new Date().toISOString();

          const decisionOutcome = executeAdminTechnicianStatusDecision({
            technician: tech,
            decision: 'SUSPENDED',
            adminUid: verifiedAdminUid,
            isAdminAuthorized: true,
            nowIso,
            reasonNote,
          });

          if (!decisionOutcome.success || !decisionOutcome.auditRecord) {
            throw new Error(decisionOutcome.error || 'Could not suspend technician.');
          }

          transaction.update(techRef, {
            approvalStatus: 'SUSPENDED',
            isAvailable: false,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          const auditId = `audit_suspend_${technicianUid}_${Date.now()}`;
          transaction.set(doc(db, 'admin_audit_logs', auditId), {
            ...decisionOutcome.auditRecord,
            id: auditId,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `technicians/${technicianUid}`
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `technicians/${technicianUid}`);
    }
    throw error;
  }
}

/**
 * Protected Operation 10: Admin Coin Adjustment through a protected transaction with reason,
 * actual applied delta, resulting balance, admin identity, server time, and immutable audit record.
 * Rejects invalid adjustments instead of recording a misleading ledger entry.
 */
export async function adminAdjustCoinsInFirestore(
  techUid: string,
  delta: number,
  reason: 'ADMIN_RECHARGE' | 'ADMIN_DEDUCTION',
  adminUid: string,
  reasonNote?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
    const techRef = doc(db, 'technicians', techUid);
    const txId = `ctx_adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const txRef = doc(db, 'coin_transactions', txId);

    await runWithServerAcknowledgment(
      () =>
        runTransaction(db, async (transaction) => {
          const techSnap = await transaction.get(techRef);
          if (!techSnap.exists()) {
            throw new Error('Technician document not found.');
          }
          const tech = techSnap.data() as TechnicianProfile;
          const nowIso = new Date().toISOString();

          const adjustment = executeAdminCoinAdjustment({
            technician: tech,
            delta,
            reason,
            reasonNote,
            adminUid: verifiedAdminUid,
            isAdminAuthorized: true,
            nowIso,
            txId,
          });

          if (!adjustment.success || !adjustment.coinTransaction || !adjustment.auditRecord) {
            throw new Error(adjustment.error || 'Invalid coin adjustment.');
          }

          transaction.update(techRef, {
            coinBalance: adjustment.updatedTechnician.coinBalance,
            updatedAt: nowIso,
            serverUpdatedAt: serverTimestamp(),
          });

          transaction.set(txRef, {
            ...adjustment.coinTransaction,
            serverCreatedAt: serverTimestamp(),
          });

          transaction.set(doc(db, 'admin_audit_logs', adjustment.auditRecord.id), {
            ...adjustment.auditRecord,
            serverCreatedAt: serverTimestamp(),
          });
        }),
      `technicians/${techUid}`
    );
    return { success: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Missing or insufficient permissions')
    ) {
      handleFirestoreError(error, OperationType.UPDATE, `technicians/${techUid}`);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Protected Operation 11: Service & Service Area Management (Add, Edit, Reorder, Toggle, Areas)
 * with server-verified Admin check and immutable Admin Audit Logging.
 */
export async function adminToggleServiceCategoryInFirestore(
  serviceId: string,
  nextEnabled: boolean,
  adminUid?: string
): Promise<void> {
  const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
  const nowIso = new Date().toISOString();

  try {
    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      batch.update(doc(db, 'services', serviceId), {
        enabled: nextEnabled,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });

      const auditId = `audit_srv_toggle_${serviceId}_${Date.now()}`;
      const auditRecord: AdminAuditRecord = {
        id: auditId,
        action: 'SERVICE_TOGGLED',
        actorUid: verifiedAdminUid,
        targetId: serviceId,
        summary: `${nextEnabled ? 'Enabled' : 'Disabled'} service category "${serviceId}".`,
        idempotencyKey: `srv_toggle:${serviceId}:${nowIso}`,
        createdAt: nowIso,
      };
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...auditRecord,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, `services/${serviceId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `services/${serviceId}`);
  }
}

export async function adminAddServiceCategoryInFirestore(
  category: ServiceCategory,
  adminUid?: string
): Promise<void> {
  const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
  const check = validateServiceCategoryMutation(category);
  if (!check.valid || !check.sanitized) {
    throw new Error(check.error || 'Invalid service category details.');
  }

  const nowIso = new Date().toISOString();
  const sanitized = check.sanitized;

  try {
    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'services', sanitized.id), {
        ...sanitized,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });

      const auditId = `audit_srv_add_${sanitized.id}_${Date.now()}`;
      const auditRecord: AdminAuditRecord = {
        id: auditId,
        action: 'SERVICE_CREATED',
        actorUid: verifiedAdminUid,
        targetId: sanitized.id,
        summary: `Created service category "${sanitized.nameEn}" (₹${sanitized.baseInspectionFee} visit fee, sortOrder #${sanitized.sortOrder}).`,
        idempotencyKey: `srv_create:${sanitized.id}:${nowIso}`,
        createdAt: nowIso,
      };
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...auditRecord,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, `services/${sanitized.id}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `services/${sanitized.id}`);
  }
}

export async function adminUpdateServiceCategoryInFirestore(params: {
  serviceId: string;
  nameEn: string;
  nameTe: string;
  descriptionEn: string;
  descriptionTe?: string;
  baseInspectionFee: number;
  sortOrder: number;
  enabled: boolean;
  iconName?: string;
  imageUrl?: string;
  adminUid?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(params.adminUid);
    const check = validateServiceCategoryMutation({
      id: params.serviceId,
      nameEn: params.nameEn,
      nameTe: params.nameTe,
      descriptionEn: params.descriptionEn,
      descriptionTe: params.descriptionTe,
      baseInspectionFee: params.baseInspectionFee,
      sortOrder: params.sortOrder,
      enabled: params.enabled,
      iconName: params.iconName,
      imageUrl: params.imageUrl,
    });
    if (!check.valid || !check.sanitized) {
      return { success: false, error: check.error };
    }

    const nowIso = new Date().toISOString();
    const sanitized = check.sanitized;

    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'services', sanitized.id), {
        ...sanitized,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });

      const auditId = `audit_srv_edit_${sanitized.id}_${Date.now()}`;
      const auditRecord: AdminAuditRecord = {
        id: auditId,
        action: 'SERVICE_UPDATED',
        actorUid: verifiedAdminUid,
        targetId: sanitized.id,
        summary: `Updated service "${sanitized.nameEn}" (fee: ₹${sanitized.baseInspectionFee}, order: #${sanitized.sortOrder}, enabled: ${sanitized.enabled}).`,
        idempotencyKey: `srv_edit:${sanitized.id}:${nowIso}`,
        createdAt: nowIso,
      };
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...auditRecord,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, `services/${sanitized.id}`);

    return { success: true };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export async function adminReorderServiceCategoryInFirestore(params: {
  serviceId: string;
  direction: 'UP' | 'DOWN';
  currentServices: ServiceCategory[];
  adminUid?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(params.adminUid);
    const nowIso = new Date().toISOString();
    const reorderRes = executeAdminServiceReorder({
      services: params.currentServices,
      serviceId: params.serviceId,
      direction: params.direction,
      adminUid: verifiedAdminUid,
      isAdminAuthorized: true,
      nowIso,
    });

    if (!reorderRes.success || !reorderRes.auditRecord) {
      return { success: false, error: reorderRes.error };
    }

    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      for (const srv of reorderRes.updatedServices) {
        batch.update(doc(db, 'services', srv.id), {
          sortOrder: srv.sortOrder,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
      }
      const auditId = `audit_srv_order_${params.serviceId}_${Date.now()}`;
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...reorderRes.auditRecord,
        id: auditId,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, `services/${params.serviceId}`);

    return { success: true };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export async function adminUpdateServiceAreasInFirestore(
  serviceAreas: string[],
  adminUid?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(adminUid);
    const cleaned = Array.from(
      new Set(serviceAreas.map((a) => a.trim()).filter((a) => a.length >= 2 && a.length <= 80))
    ).slice(0, 25);

    if (cleaned.length === 0) {
      return { success: false, error: 'At least one active Bapatla service area is required.' };
    }

    const nowIso = new Date().toISOString();
    await runWithServerAcknowledgment(async () => {
      const batch = writeBatch(db);
      batch.set(
        doc(db, 'app_settings', 'bapatla_config'),
        {
          ...BAPATLA_INITIAL_SETTINGS,
          serviceAreas: cleaned,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const auditId = `audit_areas_${Date.now()}`;
      const auditRecord: AdminAuditRecord = {
        id: auditId,
        action: 'SERVICE_AREAS_UPDATED',
        actorUid: verifiedAdminUid,
        targetId: 'bapatla_config',
        summary: `Updated active Bapatla service areas (${cleaned.length} localities).`,
        idempotencyKey: `areas_update:${nowIso}`,
        createdAt: nowIso,
      };
      batch.set(doc(db, 'admin_audit_logs', auditId), {
        ...auditRecord,
        serverCreatedAt: serverTimestamp(),
      });
      await batch.commit();
    }, 'app_settings/bapatla_config');
    return { success: true };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export async function fetchAllUsersForAdmin(): Promise<UserProfile[]> {
  try {
    await requireVerifiedServerAdmin();
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => d.data() as UserProfile);
  } catch {
    return [];
  }
}

export async function fetchCustomerPrivateContactForAdmin(
  customerUid: string
): Promise<UserPrivateContact | null> {
  try {
    await requireVerifiedServerAdmin();
    const snap = await getDoc(doc(db, 'users', customerUid, 'private', 'contact'));
    if (snap.exists()) {
      return snap.data() as UserPrivateContact;
    }
    return null;
  } catch {
    return null;
  }
}

export async function migrateLegacyIdentityToFirebaseUidInFirestore(params: {
  legacyId: string;
  targetFirebaseUid: string;
  adminUid: string;
}): Promise<{ success: boolean; summary?: string; error?: string }> {
  const legacyId = params.legacyId.trim();
  const targetUid = params.targetFirebaseUid.trim();

  if (!isLegacySyntheticId(legacyId)) {
    return {
      success: false,
      error: `ID "${legacyId}" is not a legacy synthetic ID (cust_..., tech_..., demo_...).`,
    };
  }
  if (!targetUid || targetUid.length < 10 || isLegacySyntheticId(targetUid)) {
    return {
      success: false,
      error: 'Please enter a valid target Firebase Authentication UID (at least 10 characters, not starting with cust_ or tech_).',
    };
  }

  try {
    const verifiedAdminUid = await requireVerifiedServerAdmin(params.adminUid);
    const nowIso = new Date().toISOString();
    const batch = writeBatch(db);
    const actions: string[] = [];

    const legacyUserSnap = await getDoc(doc(db, 'users', legacyId));
    const targetUserSnap = await getDoc(doc(db, 'users', targetUid));
    if (legacyUserSnap.exists() && !targetUserSnap.exists()) {
      const legacyUser = legacyUserSnap.data() as UserProfile;
      batch.set(doc(db, 'users', targetUid), {
        ...legacyUser,
        uid: targetUid,
        updatedAt: nowIso,
        serverUpdatedAt: serverTimestamp(),
      });
      actions.push(`Copied user profile "${legacyUser.name}" to /users/${targetUid}`);
    }

    const legacyTechSnap = await getDoc(doc(db, 'technicians', legacyId));
    const targetTechSnap = await getDoc(doc(db, 'technicians', targetUid));
    if (legacyTechSnap.exists()) {
      const legacyTech = legacyTechSnap.data() as TechnicianProfile;
      if (!targetTechSnap.exists()) {
        batch.set(doc(db, 'technicians', targetUid), {
          ...legacyTech,
          uid: targetUid,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
        actions.push(
          `Migrated technician "${legacyTech.name}" (${legacyTech.coinBalance} coins, ₹${legacyTech.totalEarnings} earnings) to /technicians/${targetUid}`
        );
      } else {
        const existingTargetTech = targetTechSnap.data() as TechnicianProfile;
        batch.update(doc(db, 'technicians', targetUid), {
          coinBalance: Math.max(existingTargetTech.coinBalance, legacyTech.coinBalance),
          totalEarnings: Math.max(existingTargetTech.totalEarnings, legacyTech.totalEarnings),
          completedJobs: Math.max(existingTargetTech.completedJobs, legacyTech.completedJobs),
          trialCoinsGranted:
            existingTargetTech.trialCoinsGranted === true ||
            legacyTech.trialCoinsGranted === true,
          approvalStatus:
            existingTargetTech.approvalStatus === 'APPROVED' ||
            legacyTech.approvalStatus === 'APPROVED'
              ? 'APPROVED'
              : existingTargetTech.approvalStatus,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
        actions.push(`Preserved higher balances/earnings on existing /technicians/${targetUid}`);
      }
      batch.delete(doc(db, 'technicians', legacyId));
    }

    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    let updatedBookingsCount = 0;
    bookingsSnap.docs.forEach((d) => {
      const bk = d.data() as Booking;
      if (bk.customerId === legacyId) {
        batch.update(doc(db, 'bookings', bk.id), {
          customerId: targetUid,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
        updatedBookingsCount++;
      } else if (bk.technicianId === legacyId) {
        batch.update(doc(db, 'bookings', bk.id), {
          technicianId: targetUid,
          updatedAt: nowIso,
          serverUpdatedAt: serverTimestamp(),
        });
        updatedBookingsCount++;
      }
    });
    if (updatedBookingsCount > 0) {
      actions.push(`Re-linked ${updatedBookingsCount} booking(s) to UID ${targetUid}`);
    }

    if (actions.length === 0) {
      return {
        success: false,
        error: `No legacy records found matching "${legacyId}".`,
      };
    }

    const summaryText = actions.join(' • ');
    const auditId = `audit_migrate_${legacyId}_${Date.now()}`;
    const auditRecord: AdminAuditRecord = {
      id: auditId,
      action: 'LEGACY_IDENTITY_MIGRATED',
      actorUid: verifiedAdminUid,
      targetId: targetUid,
      summary: `Migrated ${legacyId} -> ${targetUid}: ${summaryText}`.slice(0, 400),
      idempotencyKey: `migrate:${legacyId}:${targetUid}`,
      createdAt: nowIso,
    };
    batch.set(doc(db, 'admin_audit_logs', auditId), {
      ...auditRecord,
      serverCreatedAt: serverTimestamp(),
    });

    await batch.commit();
    return {
      success: true,
      summary: summaryText,
    };
  } catch (error) {
    const classified = classifyBackendError(error);
    return { success: false, error: classified.message };
  }
}

export { deleteDoc, PROVISIONED_OWNER_BOOTSTRAP_EMAIL };
