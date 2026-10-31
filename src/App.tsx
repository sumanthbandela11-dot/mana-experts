/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, Wrench, RefreshCw, ShieldCheck, CheckCheck, Check } from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import {
  Language,
  UserRole,
  ServiceCategory,
  TechnicianProfile,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  CoinTransaction,
  BookingCompletionRecord,
  CustomerReview,
  NotificationItem,
  UserProfile,
  UserPrivateContact,
  AdminRecord,
  AdminAuditRecord,
  validateRegistrationInput,
  resolveAuthorizedRolesForUser,
  validateCustomerBookingInput,
  hasDuplicateActiveBookingRequest,
  buildCustomerBookingIdempotencyIdentity,
  filterCustomerOwnedBookings,
} from './domain/manaRules';
import {
  BAPATLA_INITIAL_SETTINGS,
} from './domain/seedData';
import { CustomerView } from './components/CustomerView';
import { TechnicianView } from './components/TechnicianView';
import { AdminView } from './components/AdminView';
import { AuthModal, AuthModalMode } from './components/AuthModal';
import {
  auth,
  db,
  PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
  ensureValidAuthUserSession,
  isCapacitorOrAndroidWebView,
  consumeGoogleRedirectResult,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  signInWithEmailAccount,
  createEmailAccount,
  sendPasswordReset,
  signOutFirebaseUser,
  classifyBackendError,
  verifyServerAdminAccess,
  provisionAdminRecordInFirestore,
  fetchAllAdminsFromFirestore,
  fetchAllUsersForAdmin,
  fetchCustomerPrivateContactForAdmin,
  seedMissingCatalogIfAdmin,
  fetchUserProfile,
  createFirstTimeUserProfileInFirestore,
  updateExistingUserProfileInFirestore,
  updateUserAreaAndLanguageInFirestore,
  uploadCustomerPhotoToProtectedStorage,
  removeCustomerPhotoDraftFromProtectedStorage,
  createBookingInFirestore,
  fetchProtectedBookingDetails,
  fetchProtectedBookingPhoto,
  cancelPendingBookingInFirestore,
  acceptBookingTransactionInFirestore,
  toggleTechnicianAvailabilityInFirestore,
  startBookingWorkInFirestore,
  completeBookingWorkInFirestore,
  confirmWorkCompletionInFirestore,
  submitCustomerReviewInFirestore,
  markNotificationAsReadInFirestore,
  markAllNotificationsAsReadInFirestore,
  adminApproveTechnicianInFirestore,
  adminRejectTechnicianInFirestore,
  adminSuspendTechnicianInFirestore,
  adminAdjustCoinsInFirestore,
  adminToggleServiceCategoryInFirestore,
  adminAddServiceCategoryInFirestore,
  adminUpdateServiceCategoryInFirestore,
  adminReorderServiceCategoryInFirestore,
  adminUpdateServiceAreasInFirestore,
  migrateLegacyIdentityToFirebaseUidInFirestore,
} from './firebase';

export default function App() {
  // Navigation & Language State
  const [lang, setLang] = useState<Language>('en');
  const [activeRole, setActiveRole] = useState<UserRole>('CUSTOMER');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);

  // Real Authentication & Authorization State (starts signed-out while checking Firebase Auth)
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [firebaseAuthUser, setFirebaseAuthUser] = useState<User | null>(null);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false);
  const [canBootstrapFirstAdmin, setCanBootstrapFirstAdmin] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentUserContact, setCurrentUserContact] = useState<UserPrivateContact | null>(null);
  const [currentTechProfile, setCurrentTechProfile] = useState<TechnicianProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);

  // Real Firestore Data State (loaded strictly from shared database — no local service/booking fallbacks)
  const [catalogLoading, setCatalogLoading] = useState<boolean>(true);
  const [areasLoading, setAreasLoading] = useState<boolean>(true);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [services, setServices] = useState<ServiceCategory[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [privateDetailsMap, setPrivateDetailsMap] = useState<Record<string, BookingPrivateDetails>>({});
  const [protectedPhotosMap, setProtectedPhotosMap] = useState<Record<string, BookingProtectedPhoto>>({});
  const [customerContactsMap, setCustomerContactsMap] = useState<Record<string, UserPrivateContact>>({});
  const [coinTransactions, setCoinTransactions] = useState<CoinTransaction[]>([]);
  const [completionRecords, setCompletionRecords] = useState<BookingCompletionRecord[]>([]);
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditRecord[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Active Firestore Listeners Ref (unsubscribed synchronously before logout or account switch)
  const authListenersRef = useRef<Array<() => void>>([]);

  // Backend Error & Retry Counter
  const [backendError, setBackendError] = useState<{ kind: string; message: string } | null>(null);
  const [syncRetryTrigger, setSyncRetryTrigger] = useState<number>(0);
  const [notifActionBusyId, setNotifActionBusyId] = useState<string | null>(null);
  const [notifDrawerError, setNotifDrawerError] = useState<string | null>(null);

  // Modals & Drawers
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('SIGN_IN');
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const handleOpenAuthModal = useCallback((mode?: AuthModalMode) => {
    if (mode) {
      setAuthModalMode(mode);
    } else if (firebaseAuthUser && currentUser) {
      setAuthModalMode('EDIT_PROFILE');
    } else if (firebaseAuthUser && !currentUser) {
      setAuthModalMode('REGISTER');
    } else {
      setAuthModalMode('SIGN_IN');
    }
    setIsAuthModalOpen(true);
  }, [firebaseAuthUser, currentUser]);

  const clearAuthListenersAndState = useCallback(() => {
    authListenersRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch {
        // Ignore cleanup errors
      }
    });
    authListenersRef.current = [];

    setBookings([]);
    setTechnicians([]);
    setPrivateDetailsMap({});
    setProtectedPhotosMap({});
    setCustomerContactsMap({});
    setCoinTransactions([]);
    setCompletionRecords([]);
    setAdminAuditLogs([]);
    setReviews([]);
    setNotifications([]);
    setAllUsers([]);
    setAdminRecords([]);
    setCurrentUser(null);
    setCurrentUserContact(null);
    setCurrentTechProfile(null);
    setIsAuthorizedAdmin(false);
    setCanBootstrapFirstAdmin(false);
  }, []);

  const handleRetrySync = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setBackendError({
        kind: 'offline',
        message:
          'Your device is still offline. Please reconnect to the internet and tap Retry.',
      });
      return;
    }
    setBackendError(null);
    setSyncRetryTrigger((prev) => prev + 1);
  }, []);

  // Browser Online/Offline listener for immediate honest network state reporting
  useEffect(() => {
    const onOffline = () => {
      setBackendError({
        kind: 'offline',
        message:
          'Your device is offline. Changes cannot be acknowledged by Cloud Firestore until your internet connection is restored.',
      });
    };
    const onOnline = () => {
      setBackendError((prev) => (prev?.kind === 'offline' ? null : prev));
      setSyncRetryTrigger((prev) => prev + 1);
    };

    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Consume Google Redirect Result on startup (for Capacitor Android WebView redirect fallback)
  useEffect(() => {
    consumeGoogleRedirectResult().catch(() => {
      // Redirect errors are handled via onAuthStateChanged
    });
  }, []);

  // 1. Firebase Auth State Listener — restores session on app restart & loads saved profile before rendering workspace
  useEffect(() => {
    let isMounted = true;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setAuthLoading(true);
      setBackendError(null);

      clearAuthListenersAndState();

      if (!user) {
        setFirebaseAuthUser(null);
        setActiveRole('CUSTOMER');
        setAuthLoading(false);
        return;
      }

      const sessionValidation = await ensureValidAuthUserSession(user);
      if (!isMounted) return;

      const validUser = sessionValidation.validUser;
      if (!validUser) {
        setFirebaseAuthUser(null);
        setActiveRole('CUSTOMER');
        if (sessionValidation.expiredReason) {
          setBackendError({
            kind: 'unauthenticated',
            message: sessionValidation.expiredReason,
          });
        }
        setAuthLoading(false);
        return;
      }

      setFirebaseAuthUser(validUser);
      try {
        const [adminCheck, userBundle] = await Promise.all([
          verifyServerAdminAccess(validUser),
          fetchUserProfile(validUser.uid),
        ]);

        if (!isMounted) return;
        setIsAuthorizedAdmin(adminCheck.isAdmin);
        setCanBootstrapFirstAdmin(adminCheck.canBootstrapFirstAdmin);

        if (userBundle.profile) {
          setCurrentUser(userBundle.profile);
          setCurrentUserContact(userBundle.contact);
          setCurrentTechProfile(userBundle.techProfile);
          if (userBundle.profile.area) {
            setSelectedArea(userBundle.profile.area);
          }
          if (userBundle.profile.language) {
            setLang(userBundle.profile.language);
          }

          if (adminCheck.isAdmin) {
            setActiveRole('ADMIN');
          } else if (
            userBundle.techProfile ||
            userBundle.profile.role === 'TECHNICIAN'
          ) {
            setActiveRole('TECHNICIAN');
          } else {
            setActiveRole('CUSTOMER');
          }
        } else if (adminCheck.isAdmin) {
          const nowIso = new Date().toISOString();
          setCurrentUser({
            uid: validUser.uid,
            name: validUser.displayName || 'Bapatla Admin',
            email: validUser.email || PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
            role: 'ADMIN',
            area: BAPATLA_INITIAL_SETTINGS.serviceAreas[0],
            language: 'en',
            phoneVerified: false,
            createdAt: nowIso,
            updatedAt: nowIso,
          });
          setActiveRole('ADMIN');
        } else {
          setActiveRole('CUSTOMER');
          setAuthModalMode('REGISTER');
          setIsAuthModalOpen(true);
        }

        if (adminCheck.isAdmin) {
          const [adminsList, usersList] = await Promise.all([
            fetchAllAdminsFromFirestore(),
            fetchAllUsersForAdmin(),
          ]);
          if (isMounted) {
            setAdminRecords(adminsList);
            setAllUsers(usersList);
          }
        }
      } catch (err) {
        if (isMounted) {
          const classified = classifyBackendError(err);
          setBackendError({ kind: classified.kind, message: classified.message });
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubAuth();
    };
  }, [syncRetryTrigger, clearAuthListenersAndState]);

  // 2. Public App Settings & Service Catalog Listeners (loads strictly from shared Firestore database)
  useEffect(() => {
    if (authLoading) return;
    setCatalogLoading(true);
    setAreasLoading(true);
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        doc(db, 'app_settings', 'bapatla_config'),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const areas = Array.isArray(data.serviceAreas)
              ? data.serviceAreas.filter((a: unknown): a is string => typeof a === 'string' && a.trim().length > 0)
              : [];
            setServiceAreas(areas);
            setSelectedArea((prev) => {
              if (prev && areas.includes(prev)) return prev;
              return areas[0] || '';
            });
          } else {
            setServiceAreas([]);
          }
          setAreasLoading(false);
        },
        (err) => {
          setAreasLoading(false);
          const classified = classifyBackendError(err);
          setBackendError({ kind: classified.kind, message: classified.message });
        }
      )
    );

    // Load all services from /services so CustomerView can render active services and honestly mark disabled services
    unsubs.push(
      onSnapshot(
        collection(db, 'services'),
        (snap) => {
          const docs = snap.docs
            .map((d) => d.data() as ServiceCategory)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setServices(docs);
          setCatalogLoading(false);
        },
        (err) => {
          setCatalogLoading(false);
          const classified = classifyBackendError(err);
          setBackendError({ kind: classified.kind, message: classified.message });
        }
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authLoading, isAuthorizedAdmin, syncRetryTrigger]);

  // 3. Authenticated Real-Time Listeners (Saved Profile, Contact, Bookings, Technicians, Coin Ledger, Completions, Reviews, Notifications, Audit Logs)
  useEffect(() => {
    authListenersRef.current.forEach((u) => {
      try {
        u();
      } catch {
        // Ignore
      }
    });
    authListenersRef.current = [];

    if (!firebaseAuthUser || authLoading) {
      setBookings([]);
      setTechnicians([]);
      setCoinTransactions([]);
      setCompletionRecords([]);
      setAdminAuditLogs([]);
      setReviews([]);
      setNotifications([]);
      setBookingsLoading(false);
      return;
    }

    const uid = firebaseAuthUser.uid;
    const isTech = Boolean(currentTechProfile) || currentUser?.role === 'TECHNICIAN';
    const unsubs: Array<() => void> = [];

    setBookingsLoading(true);

    // 3a-0. Live User Profile & Private Contact listeners using Firebase UID
    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid),
        (snap) => {
          if (snap.exists()) {
            const prof = snap.data() as UserProfile;
            setCurrentUser(prof);
            if (prof.area) {
              setSelectedArea((prev) => prev || prof.area);
            }
            if (prof.language) {
              setLang(prof.language);
            }
          }
        },
        (err) => {
          const classified = classifyBackendError(err);
          setBackendError({ kind: classified.kind, message: classified.message });
        }
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'users', uid, 'private', 'contact'),
        (snap) => {
          if (snap.exists()) {
            setCurrentUserContact(snap.data() as UserPrivateContact);
          }
        },
        () => {
          // Ignore if contact subdocument is not created yet
        }
      )
    );

    // 3a. Technicians listener
    const techQuery = isAuthorizedAdmin
      ? collection(db, 'technicians')
      : query(collection(db, 'technicians'), where('approvalStatus', '==', 'APPROVED'));

    let approvedTechs: TechnicianProfile[] = [];
    let ownTechDoc: TechnicianProfile | null = null;

    const syncTechState = () => {
      const merged = new Map<string, TechnicianProfile>();
      approvedTechs.forEach((t) => merged.set(t.uid, t));
      if (ownTechDoc) {
        merged.set(ownTechDoc.uid, ownTechDoc);
        setCurrentTechProfile(ownTechDoc);
      }
      setTechnicians(Array.from(merged.values()));
    };

    unsubs.push(
      onSnapshot(
        techQuery,
        (snap) => {
          approvedTechs = snap.docs.map((d) => d.data() as TechnicianProfile);
          syncTechState();
        },
        (err) => {
          const classified = classifyBackendError(err);
          setBackendError({ kind: classified.kind, message: classified.message });
        }
      )
    );

    if (!isAuthorizedAdmin) {
      unsubs.push(
        onSnapshot(
          doc(db, 'technicians', uid),
          (snap) => {
            ownTechDoc = snap.exists() ? (snap.data() as TechnicianProfile) : null;
            syncTechState();
          },
          () => {
            // Ignore if user is not a technician
          }
        )
      );
    }

    // 3b. Bookings listeners respecting firestore.rules constraints
    if (isAuthorizedAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'bookings'),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as Booking)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setBookings(list);
            setBookingsLoading(false);
          },
          (err) => {
            setBookingsLoading(false);
            const classified = classifyBackendError(err);
            setBackendError({ kind: classified.kind, message: classified.message });
          }
        )
      );
    } else {
      let custBookings: Booking[] = [];
      let pendingBookings: Booking[] = [];
      let assignedTechBookings: Booking[] = [];

      const mergeAndSetBookings = () => {
        const map = new Map<string, Booking>();
        custBookings.forEach((b) => map.set(b.id, b));
        pendingBookings.forEach((b) => map.set(b.id, b));
        assignedTechBookings.forEach((b) => map.set(b.id, b));
        const combined = Array.from(map.values()).sort((a, b) =>
          b.createdAt.localeCompare(a.createdAt)
        );
        setBookings(combined);
        setBookingsLoading(false);
      };

      unsubs.push(
        onSnapshot(
          query(collection(db, 'bookings'), where('customerId', '==', uid)),
          (snap) => {
            custBookings = snap.docs.map((d) => d.data() as Booking);
            mergeAndSetBookings();
          },
          (err) => {
            setBookingsLoading(false);
            const classified = classifyBackendError(err);
            setBackendError({ kind: classified.kind, message: classified.message });
          }
        )
      );

      if (isTech) {
        if (
          currentTechProfile?.approvalStatus === 'APPROVED' &&
          currentTechProfile?.isAvailable === true
        ) {
          unsubs.push(
            onSnapshot(
              query(collection(db, 'bookings'), where('status', '==', 'PENDING')),
              (snap) => {
                pendingBookings = snap.docs.map((d) => d.data() as Booking);
                mergeAndSetBookings();
              },
              (err) => {
                const classified = classifyBackendError(err);
                setBackendError({ kind: classified.kind, message: classified.message });
              }
            )
          );
        } else {
          pendingBookings = [];
          mergeAndSetBookings();
        }

        unsubs.push(
          onSnapshot(
            query(collection(db, 'bookings'), where('technicianId', '==', uid)),
            (snap) => {
              assignedTechBookings = snap.docs.map((d) => d.data() as Booking);
              mergeAndSetBookings();
            },
            (err) => {
              const classified = classifyBackendError(err);
              setBackendError({ kind: classified.kind, message: classified.message });
            }
          )
        );
      }
    }

    // 3c. Coin Transactions listener
    if (isAuthorizedAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'coin_transactions'),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as CoinTransaction)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setCoinTransactions(list);
          },
          (err) => {
            const classified = classifyBackendError(err);
            setBackendError({ kind: classified.kind, message: classified.message });
          }
        )
      );
    } else if (isTech) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'coin_transactions'), where('technicianId', '==', uid)),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as CoinTransaction)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setCoinTransactions(list);
          },
          (err) => {
            const classified = classifyBackendError(err);
            setBackendError({ kind: classified.kind, message: classified.message });
          }
        )
      );
    }

    // 3d. Booking Completion & Earnings Records listener
    if (isAuthorizedAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'booking_completions'),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as BookingCompletionRecord)
              .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
            setCompletionRecords(list);
          },
          () => {
            // Ignore
          }
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'admin_audit_logs'),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as AdminAuditRecord)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setAdminAuditLogs(list);
          },
          () => {
            // Ignore
          }
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'users'),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as UserProfile)
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            setAllUsers(list);
          },
          () => {
            // Ignore
          }
        )
      );
    } else if (isTech) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'booking_completions'), where('technicianId', '==', uid)),
          (snap) => {
            const list = snap.docs
              .map((d) => d.data() as BookingCompletionRecord)
              .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt));
            setCompletionRecords(list);
          },
          () => {
            // Ignore
          }
        )
      );
    }

    // 3e. Reviews listener
    unsubs.push(
      onSnapshot(
        collection(db, 'reviews'),
        (snap) => {
          setReviews(snap.docs.map((d) => d.data() as CustomerReview));
        },
        () => {
          // Ignore if unverified
        }
      )
    );

    // 3f. Notifications listener
    const notifQuery = isAuthorizedAdmin
      ? collection(db, 'notifications')
      : query(
          collection(db, 'notifications'),
          where(
            'recipientId',
            'in',
            isTech ? [uid, 'ALL_TECHNICIANS'] : [uid]
          )
        );

    unsubs.push(
      onSnapshot(
        notifQuery,
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as NotificationItem)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setNotifications(list);
        },
        () => {
          // Ignore notification permission warnings
        }
      )
    );

    authListenersRef.current = unsubs;

    return () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          // Ignore
        }
      });
      authListenersRef.current = [];
    };
  }, [
    firebaseAuthUser,
    authLoading,
    isAuthorizedAdmin,
    currentTechProfile?.uid,
    currentTechProfile?.approvalStatus,
    currentTechProfile?.isAvailable,
    currentUser?.role,
    syncRetryTrigger,
  ]);

  // 4. Load Protected Customer Doorstep Details & Protected Photos for authorized bookings
  useEffect(() => {
    if (!firebaseAuthUser || bookings.length === 0) return;
    const uid = firebaseAuthUser.uid;

    bookings.forEach((bk) => {
      const isOwnerCustomer = bk.customerId === uid;
      const isAssignedTech =
        bk.technicianId === uid &&
        ['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED', 'CONFIRMED'].includes(bk.status);

      if (isOwnerCustomer || isAssignedTech || isAuthorizedAdmin) {
        if (!privateDetailsMap[bk.id]) {
          fetchProtectedBookingDetails(bk.id)
            .then((details) => {
              if (details) {
                setPrivateDetailsMap((prev) => ({ ...prev, [bk.id]: details }));
              }
            })
            .catch(() => {
              // Protected subcollection remains locked if unauthorized
            });
        }

        if (bk.hasUploadedPhoto && !protectedPhotosMap[bk.id]) {
          fetchProtectedBookingPhoto(bk.id)
            .then((photo) => {
              if (photo) {
                setProtectedPhotosMap((prev) => ({ ...prev, [bk.id]: photo }));
              }
            })
            .catch(() => {
              // Protected photo remains locked if unauthorized
            });
        }
      }
    });
  }, [bookings, firebaseAuthUser, isAuthorizedAdmin, privateDetailsMap, protectedPhotosMap]);

  const authorizedRoles = resolveAuthorizedRolesForUser({
    profile: currentUser,
    techProfile: currentTechProfile,
    isServerVerifiedAdmin: isAuthorizedAdmin,
  });

  const handleSwitchRole = (targetRole: UserRole) => {
    if (!authorizedRoles.includes(targetRole)) {
      setBackendError({
        kind: 'PERMISSION_DENIED',
        message: `Access denied: Your account (${firebaseAuthUser?.email || 'signed-out'}) is not authorized for the ${targetRole} workspace.`,
      });
      return;
    }
    setActiveRole(targetRole);
  };

  const handleSignOut = async () => {
    clearAuthListenersAndState();
    setActiveRole('CUSTOMER');
    setIsAuthModalOpen(false);
    await signOutFirebaseUser();
  };

  const handleSelectArea = async (area: string) => {
    setSelectedArea(area);
    if (firebaseAuthUser && currentUser) {
      try {
        await updateUserAreaAndLanguageInFirestore(firebaseAuthUser.uid, { area });
        setCurrentUser((prev) => (prev ? { ...prev, area } : null));
      } catch (err) {
        const classified = classifyBackendError(err);
        setBackendError({ kind: classified.kind, message: classified.message });
      }
    }
  };

  const handleToggleLang = async () => {
    const nextLang: Language = lang === 'en' ? 'te' : 'en';
    setLang(nextLang);
    if (firebaseAuthUser && currentUser) {
      try {
        await updateUserAreaAndLanguageInFirestore(firebaseAuthUser.uid, { language: nextLang });
        setCurrentUser((prev) => (prev ? { ...prev, language: nextLang } : null));
      } catch {
        // Non-blocking language toggle
      }
    }
  };

  const handleRegisterSubmit = async (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    role: 'CUSTOMER' | 'TECHNICIAN';
    skills: string[];
    experienceYears: number;
    bio: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser) {
      return {
        success: false,
        error: 'You must sign in before saving your profile.',
      };
    }

    const validation = validateRegistrationInput({
      name: data.name,
      phone: data.phone,
      area: data.area,
      requestedRole: data.role,
      isAuthorizedAdminEmail: isAuthorizedAdmin,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      const saved = await createFirstTimeUserProfileInFirestore({
        uid: firebaseAuthUser.uid,
        name: data.name,
        email: firebaseAuthUser.email || '',
        phone: data.phone,
        defaultAddress: data.defaultAddress,
        area: data.area,
        role: data.role,
        language: lang,
        skills: data.skills,
        experienceYears: data.experienceYears,
        bio: data.bio,
      });

      setCurrentUser(saved.profile);
      setCurrentUserContact(saved.contact);
      if (saved.techProfile) {
        setCurrentTechProfile(saved.techProfile);
      }
      setSelectedArea(saved.profile.area);
      setActiveRole(
        isAuthorizedAdmin
          ? 'ADMIN'
          : saved.techProfile || saved.profile.role === 'TECHNICIAN'
          ? 'TECHNICIAN'
          : 'CUSTOMER'
      );
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleEditProfileSubmit = async (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills?: string[];
    experienceYears?: number;
    bio?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !currentUser) {
      return {
        success: false,
        error: 'You must be signed in with an existing profile to edit your details.',
      };
    }

    try {
      const updated = await updateExistingUserProfileInFirestore({
        uid: firebaseAuthUser.uid,
        name: data.name,
        phone: data.phone,
        defaultAddress: data.defaultAddress,
        area: data.area,
        skills: data.skills,
        experienceYears: data.experienceYears,
        bio: data.bio,
      });

      setCurrentUser(updated.profile);
      setCurrentUserContact(updated.contact);
      if (updated.techProfile) {
        setCurrentTechProfile(updated.techProfile);
      }
      setSelectedArea(updated.profile.area);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleBootstrapFirstAdmin = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!firebaseAuthUser) {
      return { success: false, error: 'Sign in required.' };
    }
    try {
      const res = await provisionAdminRecordInFirestore({
        targetUid: firebaseAuthUser.uid,
        targetEmail: firebaseAuthUser.email || PROVISIONED_OWNER_BOOTSTRAP_EMAIL,
        actorUid: firebaseAuthUser.uid,
      });
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setIsAuthorizedAdmin(true);
      setCanBootstrapFirstAdmin(false);
      const [adminsList, usersList] = await Promise.all([
        fetchAllAdminsFromFirestore(),
        fetchAllUsersForAdmin(),
      ]);
      setAdminRecords(adminsList);
      setAllUsers(usersList);
      setActiveRole('ADMIN');
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleProvisionAdminRecord = async (
    targetUid: string,
    targetEmail: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Server-verified Admin authorization required.' };
    }
    try {
      const res = await provisionAdminRecordInFirestore({
        targetUid,
        targetEmail,
        actorUid: firebaseAuthUser.uid,
      });
      if (!res.success || !res.adminRecord) {
        return { success: false, error: res.error };
      }
      const addedRecord = res.adminRecord;
      setAdminRecords((prev) => {
        const filtered = prev.filter((a) => a.uid !== addedRecord.uid);
        return [addedRecord, ...filtered];
      });
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      return { success: false, error: classified.message };
    }
  };

  const handleMigrateLegacyIdentity = async (
    legacyId: string,
    targetFirebaseUid: string
  ): Promise<{ success: boolean; summary?: string; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Server-verified Admin authorization required.' };
    }
    try {
      const res = await migrateLegacyIdentityToFirebaseUidInFirestore({
        legacyId,
        targetFirebaseUid,
        adminUid: firebaseAuthUser.uid,
      });
      if (res.success) {
        const usersList = await fetchAllUsersForAdmin();
        setAllUsers(usersList);
      }
      return res;
    } catch (err) {
      const classified = classifyBackendError(err);
      return { success: false, error: classified.message };
    }
  };

  const handleUploadBookingPhotoDraft = async (
    file: File,
    onProgress?: (percent: number, stage: string) => void
  ): Promise<{ success: boolean; photo?: BookingProtectedPhoto; error?: string }> => {
    if (!firebaseAuthUser) {
      return {
        success: false,
        error: 'Please sign in before uploading a photo to protected storage.',
      };
    }
    try {
      const res = await uploadCustomerPhotoToProtectedStorage({
        file,
        customerUid: firebaseAuthUser.uid,
        onProgress,
      });
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true, photo: res.photo };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleRemoveBookingPhotoDraft = async (): Promise<void> => {
    if (!firebaseAuthUser) return;
    await removeCustomerPhotoDraftFromProtectedStorage(firebaseAuthUser.uid);
  };

  const handleCreateBooking = async (input: {
    service: ServiceCategory;
    generalArea: string;
    fullAddress: string;
    landmark: string;
    villageOrWard: string;
    customerPhone: string;
    problemDescription: string;
    preferredDate: string;
    preferredTimeSlot: string;
    photoNote: string;
    protectedPhoto?: BookingProtectedPhoto | null;
  }): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
    if (!firebaseAuthUser || !currentUser) {
      return {
        success: false,
        error: 'Please sign in and complete your profile before creating a booking.',
      };
    }

    // 1. Validate all booking fields against authoritative domain rules
    const validation = validateCustomerBookingInput({
      customerUid: firebaseAuthUser.uid,
      customerName: currentUser.name,
      service: input.service,
      catalogServices: services,
      generalArea: input.generalArea,
      activeServiceAreas: serviceAreas,
      fullAddress: input.fullAddress,
      landmark: input.landmark,
      villageOrWard: input.villageOrWard,
      customerPhone: input.customerPhone,
      problemDescription: input.problemDescription,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      photoNote: input.photoNote,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // 2. Prevent accidental duplicate active requests for the same service, area, date, and slot
    const duplicateCheck = hasDuplicateActiveBookingRequest({
      existingBookings: bookings,
      customerUid: firebaseAuthUser.uid,
      serviceId: input.service.id,
      generalArea: input.generalArea,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      problemDescription: input.problemDescription,
    });

    if (duplicateCheck.duplicate) {
      return {
        success: false,
        error:
          duplicateCheck.reason ||
          `Duplicate booking prevented: You already have an active ${input.service.nameEn} request for ${input.preferredDate} (${input.preferredTimeSlot}).`,
      };
    }

    // 3. Build deterministic idempotent booking identity so repeated taps cannot create duplicate bookings
    const { bookingId, idempotencyKey } = buildCustomerBookingIdempotencyIdentity({
      customerUid: firebaseAuthUser.uid,
      serviceId: input.service.id,
      generalArea: input.generalArea,
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      problemDescription: input.problemDescription,
    });

    const nowIso = new Date().toISOString();
    const cleanPhone = input.customerPhone.replace(/\D/g, '');

    const newBooking: Booking = {
      id: bookingId,
      customerId: firebaseAuthUser.uid,
      customerName: currentUser.name,
      serviceId: input.service.id,
      serviceNameEn: input.service.nameEn,
      serviceNameTe: input.service.nameTe,
      generalArea: input.generalArea,
      problemDescription: input.problemDescription.trim(),
      preferredDate: input.preferredDate,
      preferredTimeSlot: input.preferredTimeSlot,
      photoNote: input.photoNote.trim(),
      hasUploadedPhoto: Boolean(input.protectedPhoto),
      status: 'PENDING',
      technicianId: '',
      technicianName: '',
      technicianPhone: '',
      labourCharges: 0,
      rated: false,
      idempotencyKey,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const newPrivateDetails: BookingPrivateDetails = {
      bookingId,
      customerId: firebaseAuthUser.uid,
      customerPhone: cleanPhone,
      fullAddress: input.fullAddress.trim(),
      landmark: input.landmark.trim() || 'Near Main Road',
      villageOrWard: input.villageOrWard.trim() || input.generalArea,
      createdAt: nowIso,
    };

    const newNotif: NotificationItem = {
      id: `notif_tech_${bookingId}`,
      recipientId: 'ALL_TECHNICIANS',
      titleEn: `New ${input.service.nameEn} Job in ${input.generalArea}`,
      titleTe: `${input.generalArea}లో కొత్త ${input.service.nameTe} పని`,
      messageEn: `${currentUser.name} requested ${input.service.nameEn} for ${input.preferredDate} (${input.preferredTimeSlot}).`,
      messageTe: `${input.preferredDate}న ${input.service.nameTe} సేవ కోసం బుకింగ్ వచ్చింది.`,
      type: 'NEW_BOOKING',
      bookingId,
      read: false,
      createdAt: nowIso,
    };

    const customerNotif: NotificationItem = {
      id: `notif_cust_${bookingId}`,
      recipientId: firebaseAuthUser.uid,
      titleEn: `Booking Confirmed: ${input.service.nameEn}`,
      titleTe: `బుకింగ్ నమోదైంది: ${input.service.nameTe}`,
      messageEn: `Your request (#${bookingId.slice(-6).toUpperCase()}) for ${input.preferredDate} (${input.preferredTimeSlot}) in ${input.generalArea} is saved in Cloud Firestore.`,
      messageTe: `మీ ${input.service.nameTe} అభ్యర్థన (#${bookingId.slice(-6).toUpperCase()}) విజయవంతంగా నమోదు చేయబడింది.`,
      type: 'NEW_BOOKING',
      bookingId,
      read: false,
      createdAt: nowIso,
    };

    try {
      await createBookingInFirestore(
        newBooking,
        newPrivateDetails,
        newNotif,
        input.protectedPhoto || null,
        customerNotif
      );
      setPrivateDetailsMap((prev) => ({ ...prev, [bookingId]: newPrivateDetails }));
      if (input.protectedPhoto) {
        setProtectedPhotosMap((prev) => ({
          ...prev,
          [bookingId]: {
            ...input.protectedPhoto!,
            bookingId,
            customerId: firebaseAuthUser.uid,
          },
        }));
        removeCustomerPhotoDraftFromProtectedStorage(firebaseAuthUser.uid).catch(() => {
          // Ignore draft cleanup error
        });
      }
      setBackendError(null);
      return { success: true, booking: newBooking };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleCancelBooking = async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await cancelPendingBookingInFirestore(
        bookingId,
        firebaseAuthUser?.uid,
        isAuthorizedAdmin
      );
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleConfirmCompletion = async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser) {
      return { success: false, error: 'Sign in required.' };
    }
    try {
      const res = await confirmWorkCompletionInFirestore(bookingId, firebaseAuthUser.uid);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleSubmitReview = async (
    bookingId: string,
    technicianId: string,
    rating: number,
    comment: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !currentUser) {
      return { success: false, error: 'Sign in required to submit a review.' };
    }
    try {
      const res = await submitCustomerReviewInFirestore({
        bookingId,
        customerId: firebaseAuthUser.uid,
        customerName: currentUser.name,
        technicianId,
        rating,
        comment,
      });
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    setNotifDrawerError(null);
    setNotifActionBusyId(notifId);
    try {
      const res = await markNotificationAsReadInFirestore(notifId);
      if (!res.success) {
        setNotifDrawerError(res.error || 'Could not mark notification as read.');
      }
    } finally {
      setNotifActionBusyId(null);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifDrawerError(null);
    setNotifActionBusyId('ALL');
    try {
      const res = await markAllNotificationsAsReadInFirestore(unreadIds);
      if (!res.success) {
        setNotifDrawerError(res.error || 'Could not mark notifications as read.');
      }
    } finally {
      setNotifActionBusyId(null);
    }
  };

  const handleToggleAvailability = async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!firebaseAuthUser || !currentTechProfile || currentTechProfile.uid !== firebaseAuthUser.uid) {
      return {
        success: false,
        error: 'You must be signed in to your own technician profile to change availability.',
      };
    }
    if (currentTechProfile.approvalStatus !== 'APPROVED') {
      return {
        success: false,
        error: `Cannot go online while technician account status is ${currentTechProfile.approvalStatus}. Only APPROVED technicians can receive job requests.`,
      };
    }
    try {
      const nextAvailable = !currentTechProfile.isAvailable;
      await toggleTechnicianAvailabilityInFirestore(firebaseAuthUser.uid, nextAvailable);
      setCurrentTechProfile((prev) =>
        prev ? { ...prev, isAvailable: nextAvailable } : null
      );
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleAcceptJob = async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !currentTechProfile || currentTechProfile.uid !== firebaseAuthUser.uid) {
      return {
        success: false,
        error: 'You must be signed in to your own technician profile to accept jobs.',
      };
    }
    try {
      const res = await acceptBookingTransactionInFirestore(bookingId, firebaseAuthUser.uid);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      const [unlockedDetails, unlockedPhoto] = await Promise.all([
        fetchProtectedBookingDetails(bookingId).catch(() => null),
        fetchProtectedBookingPhoto(bookingId).catch(() => null),
      ]);
      if (unlockedDetails) {
        setPrivateDetailsMap((prev) => ({ ...prev, [bookingId]: unlockedDetails }));
      }
      if (unlockedPhoto) {
        setProtectedPhotosMap((prev) => ({ ...prev, [bookingId]: unlockedPhoto }));
      }
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleRetryUnlockDetails = async (bookingId: string): Promise<void> => {
    if (!firebaseAuthUser) return;
    const [unlockedDetails, unlockedPhoto] = await Promise.all([
      fetchProtectedBookingDetails(bookingId).catch(() => null),
      fetchProtectedBookingPhoto(bookingId).catch(() => null),
    ]);
    if (unlockedDetails) {
      setPrivateDetailsMap((prev) => ({ ...prev, [bookingId]: unlockedDetails }));
    }
    if (unlockedPhoto) {
      setProtectedPhotosMap((prev) => ({ ...prev, [bookingId]: unlockedPhoto }));
    }
  };

  const handleStartWork = async (
    bookingId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !currentTechProfile || currentTechProfile.uid !== firebaseAuthUser.uid) {
      return {
        success: false,
        error: 'You must be signed in to your own technician profile to start work.',
      };
    }
    try {
      await startBookingWorkInFirestore(bookingId, firebaseAuthUser.uid);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleMarkWorkCompleted = async (
    bookingId: string,
    labourCharges: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !currentTechProfile || currentTechProfile.uid !== firebaseAuthUser.uid) {
      return {
        success: false,
        error: 'You must be signed in to your own technician profile to submit labour charges.',
      };
    }
    try {
      await completeBookingWorkInFirestore(bookingId, firebaseAuthUser.uid, labourCharges);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleRegisterTechnicianFromConsole = async (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills: string[];
    experienceYears: number;
    bio: string;
  }): Promise<{ success: boolean; error?: string }> => {
    return handleRegisterSubmit({
      ...data,
      role: 'TECHNICIAN',
    });
  };

  const handleApproveTechnician = async (
    techUid: string
  ): Promise<{ success: boolean; trialCoinsGrantedNow?: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      const res = await adminApproveTechnicianInFirestore(techUid, firebaseAuthUser.uid);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true, trialCoinsGrantedNow: Boolean(res.trialCoinsGrantedNow) };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleRejectTechnician = async (
    techUid: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      const res = await adminRejectTechnicianInFirestore(techUid, firebaseAuthUser.uid);
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleSuspendTechnician = async (
    techUid: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      await adminSuspendTechnicianInFirestore(techUid, firebaseAuthUser.uid);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleAdjustCoins = async (
    techUid: string,
    delta: number,
    reason: 'ADMIN_RECHARGE' | 'ADMIN_DEDUCTION',
    reasonNote?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      const res = await adminAdjustCoinsInFirestore(
        techUid,
        delta,
        reason,
        firebaseAuthUser.uid,
        reasonNote
      );
      if (!res.success) {
        return { success: false, error: res.error };
      }
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleToggleServiceCategory = async (
    serviceId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) {
      return { success: false, error: 'Service category not found.' };
    }
    try {
      await adminToggleServiceCategoryInFirestore(
        serviceId,
        !srv.enabled,
        firebaseAuthUser.uid
      );
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleAddServiceCategory = async (srv: {
    nameEn: string;
    nameTe: string;
    descriptionEn: string;
    baseInspectionFee: number;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    const id = srv.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const newCategory: ServiceCategory = {
      id,
      nameEn: srv.nameEn,
      nameTe: srv.nameTe,
      descriptionEn: srv.descriptionEn,
      descriptionTe: srv.nameTe,
      iconName: 'Wrench',
      imageUrl: '/images/services/electrician.jpg',
      baseInspectionFee: srv.baseInspectionFee,
      enabled: true,
      sortOrder: services.length + 1,
    };
    try {
      await adminAddServiceCategoryInFirestore(newCategory, firebaseAuthUser.uid);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const handleUpdateServiceCategory = async (srv: {
    id: string;
    nameEn: string;
    nameTe: string;
    descriptionEn: string;
    descriptionTe: string;
    baseInspectionFee: number;
    sortOrder: number;
    enabled: boolean;
    iconName: string;
    imageUrl?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    const res = await adminUpdateServiceCategoryInFirestore({
      serviceId: srv.id,
      ...srv,
      adminUid: firebaseAuthUser.uid,
    });
    if (res.success) {
      setBackendError(null);
    }
    return res;
  };

  const handleReorderServiceCategory = async (
    serviceId: string,
    direction: 'UP' | 'DOWN'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    const res = await adminReorderServiceCategoryInFirestore({
      serviceId,
      direction,
      currentServices: services,
      adminUid: firebaseAuthUser.uid,
    });
    if (res.success) {
      setBackendError(null);
    }
    return res;
  };

  const handleUnlockCustomerContactForAdmin = async (
    customerUid: string
  ): Promise<{ success: boolean; contact?: UserPrivateContact; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      const contact = await fetchCustomerPrivateContactForAdmin(customerUid);
      if (!contact) {
        return {
          success: false,
          error: 'No private contact subdocument found for this customer account.',
        };
      }
      setCustomerContactsMap((prev) => ({ ...prev, [customerUid]: contact }));
      return { success: true, contact };
    } catch (err) {
      const classified = classifyBackendError(err);
      return { success: false, error: classified.message };
    }
  };

  const handleUpdateServiceAreas = async (
    areas: string[]
  ): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuthUser || !isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    const res = await adminUpdateServiceAreasInFirestore(areas, firebaseAuthUser.uid);
    if (res.success) {
      setServiceAreas(areas);
    }
    return res;
  };

  const handleSeedDefaultCatalog = async (): Promise<{ success: boolean; error?: string }> => {
    if (!isAuthorizedAdmin) {
      return { success: false, error: 'Admin authorization required.' };
    }
    try {
      await seedMissingCatalogIfAdmin(true);
      setBackendError(null);
      return { success: true };
    } catch (err) {
      const classified = classifyBackendError(err);
      setBackendError({ kind: classified.kind, message: classified.message });
      return { success: false, error: classified.message };
    }
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const isAuthenticated = Boolean(firebaseAuthUser);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#087F78] flex items-center justify-center text-white shadow-lg shadow-teal-900/15 mb-4">
          <Wrench className="w-8 h-8 animate-spin" />
        </div>
        <h1 className="text-xl font-extrabold text-[#0E1E2A]">Mana Experts</h1>
        <p className="text-xs font-semibold text-[#087F78] mt-1 flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          Restoring your authenticated session & saved Bapatla profile...
        </p>
        <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
          Firebase Auth UID & Cloud Firestore Verification
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 font-sans selection:bg-teal-700 selection:text-white">
      <main>
        {activeRole === 'CUSTOMER' && (
          <CustomerView
            lang={lang}
            onToggleLang={handleToggleLang}
            currentRole={activeRole}
            authorizedRoles={authorizedRoles}
            onSwitchRole={handleSwitchRole}
            onOpenAuthModal={handleOpenAuthModal}
            onSignOut={handleSignOut}
            isAuthenticated={isAuthenticated}
            firebaseUserUid={firebaseAuthUser?.uid || null}
            firebaseUserEmail={firebaseAuthUser?.email || null}
            currentUser={currentUser}
            currentUserContact={currentUserContact}
            isAuthorizedAdmin={isAuthorizedAdmin}
            canBootstrapFirstAdmin={canBootstrapFirstAdmin}
            onBootstrapFirstAdmin={handleBootstrapFirstAdmin}
            authLoading={authLoading}
            catalogLoading={catalogLoading || areasLoading}
            bookingsLoading={bookingsLoading}
            backendError={backendError}
            onRetrySync={handleRetrySync}
            onSeedDefaultCatalog={
              isAuthorizedAdmin
                ? async () => {
                    await handleSeedDefaultCatalog();
                  }
                : undefined
            }
            selectedArea={selectedArea}
            serviceAreas={serviceAreas}
            onSelectArea={handleSelectArea}
            services={services}
            bookings={filterCustomerOwnedBookings(bookings, firebaseAuthUser?.uid || null)}
            privateDetailsMap={privateDetailsMap}
            protectedPhotosMap={protectedPhotosMap}
            technicians={technicians}
            reviews={reviews}
            unreadNotifCount={unreadNotifCount}
            onOpenNotifications={() => {
              setNotifDrawerError(null);
              setIsNotifDrawerOpen(true);
            }}
            onUploadBookingPhotoDraft={handleUploadBookingPhotoDraft}
            onRemoveBookingPhotoDraft={handleRemoveBookingPhotoDraft}
            onCreateBooking={handleCreateBooking}
            onCancelBooking={handleCancelBooking}
            onConfirmCompletion={handleConfirmCompletion}
            onSubmitReview={handleSubmitReview}
          />
        )}

        {activeRole === 'TECHNICIAN' && (
          <TechnicianView
            lang={lang}
            isAuthenticated={isAuthenticated}
            firebaseUserUid={firebaseAuthUser?.uid || null}
            firebaseUserEmail={firebaseAuthUser?.email || null}
            currentUser={currentUser}
            currentUserContact={currentUserContact}
            authLoading={authLoading}
            bookingsLoading={bookingsLoading}
            backendError={backendError}
            onRetrySync={handleRetrySync}
            onOpenAuthModal={handleOpenAuthModal}
            onSignOut={handleSignOut}
            onBackToCustomerView={() => handleSwitchRole('CUSTOMER')}
            technician={currentTechProfile}
            bookings={bookings}
            privateDetailsMap={privateDetailsMap}
            protectedPhotosMap={protectedPhotosMap}
            coinTransactions={coinTransactions}
            completionRecords={completionRecords}
            services={services}
            serviceAreas={serviceAreas}
            supportWhatsApp={BAPATLA_INITIAL_SETTINGS.supportWhatsApp}
            onToggleAvailability={handleToggleAvailability}
            onAcceptJob={handleAcceptJob}
            onStartWork={handleStartWork}
            onMarkWorkCompleted={handleMarkWorkCompleted}
            onRetryUnlockDetails={handleRetryUnlockDetails}
            onRegisterTechnicianProfile={handleRegisterTechnicianFromConsole}
            onUpdateTechnicianProfile={handleEditProfileSubmit}
          />
        )}

        {activeRole === 'ADMIN' && (
          <AdminView
            lang={lang}
            isAuthorizedAdmin={isAuthorizedAdmin}
            canBootstrapFirstAdmin={canBootstrapFirstAdmin}
            onBootstrapFirstAdmin={handleBootstrapFirstAdmin}
            authLoading={authLoading}
            backendError={backendError}
            onRetrySync={handleRetrySync}
            onSignOut={handleSignOut}
            onBackToCustomerView={() => handleSwitchRole('CUSTOMER')}
            adminRoster={adminRecords}
            allUsers={allUsers}
            customerContactsMap={customerContactsMap}
            onUnlockCustomerContact={handleUnlockCustomerContactForAdmin}
            technicians={technicians}
            bookings={bookings}
            privateDetailsMap={privateDetailsMap}
            protectedPhotosMap={protectedPhotosMap}
            onUnlockBookingDetails={handleRetryUnlockDetails}
            services={services}
            serviceAreas={serviceAreas}
            coinTransactions={coinTransactions}
            completionRecords={completionRecords}
            adminAuditLogs={adminAuditLogs}
            onApproveTechnician={handleApproveTechnician}
            onRejectTechnician={handleRejectTechnician}
            onSuspendTechnician={handleSuspendTechnician}
            onAdjustCoins={handleAdjustCoins}
            onToggleServiceCategory={handleToggleServiceCategory}
            onAddServiceCategory={handleAddServiceCategory}
            onUpdateServiceCategory={handleUpdateServiceCategory}
            onReorderServiceCategory={handleReorderServiceCategory}
            onUpdateServiceAreas={handleUpdateServiceAreas}
            onSeedDefaultCatalog={handleSeedDefaultCatalog}
            onProvisionAdmin={handleProvisionAdminRecord}
            onMigrateLegacyIdentity={handleMigrateLegacyIdentity}
          />
        )}
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
        serviceAreas={serviceAreas}
        services={services}
        isAuthenticated={isAuthenticated}
        firebaseUserUid={firebaseAuthUser?.uid || null}
        firebaseUserEmail={firebaseAuthUser?.email || null}
        firebaseUserName={firebaseAuthUser?.displayName || null}
        existingProfile={currentUser}
        existingContact={currentUserContact}
        existingTechProfile={currentTechProfile}
        isAndroidWebView={isCapacitorOrAndroidWebView()}
        onGoogleLogin={signInWithGooglePopup}
        onGoogleRedirectLogin={signInWithGoogleRedirect}
        onEmailSignIn={signInWithEmailAccount}
        onEmailSignUp={createEmailAccount}
        onPasswordReset={sendPasswordReset}
        onFirstTimeRegisterSubmit={handleRegisterSubmit}
        onEditProfileSubmit={handleEditProfileSubmit}
        onSignOut={handleSignOut}
      />

      {isNotifDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#087F78]" />
                    Real-Time Job & Account Alerts
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {unreadNotifCount > 0
                      ? `${unreadNotifCount} unread notification${unreadNotifCount > 1 ? 's' : ''}`
                      : 'All notifications read'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {isAuthenticated && unreadNotifCount > 0 && (
                    <button
                      type="button"
                      disabled={notifActionBusyId === 'ALL'}
                      onClick={handleMarkAllNotificationsRead}
                      className="px-2.5 py-1.5 rounded-lg bg-[#E8F7F4] text-[#087F78] hover:bg-[#D0EFEA] disabled:opacity-50 text-[11px] font-extrabold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark All Read
                    </button>
                  )}
                  <button
                    onClick={() => setIsNotifDrawerOpen(false)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {notifDrawerError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {notifDrawerError}
                </div>
              )}

              {!isAuthenticated ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  Sign in to view real-time booking and job notifications.
                </p>
              ) : notifications.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">
                  No notifications yet.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-2xl border space-y-1.5 transition ${
                        n.read
                          ? 'bg-slate-50 border-slate-200/80 opacity-80'
                          : 'bg-[#E8F7F4]/60 border-[#087F78]/30 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold uppercase text-[#087F78] flex items-center gap-1.5">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#F97316] inline-block" />
                          )}
                          {n.type}
                        </span>
                        {!n.read ? (
                          <button
                            type="button"
                            disabled={notifActionBusyId === n.id}
                            onClick={() => handleMarkNotificationRead(n.id)}
                            className="px-2 py-0.5 rounded-md bg-white border border-[#087F78]/30 text-[#087F78] hover:bg-[#E8F7F4] disabled:opacity-50 text-[10px] font-extrabold flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            {notifActionBusyId === n.id ? 'Saving...' : 'Mark Read'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">
                            Read
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {lang === 'en' ? n.titleEn : n.titleTe}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {lang === 'en' ? n.messageEn : n.messageTe}
                      </p>
                      <span className="block text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsNotifDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
