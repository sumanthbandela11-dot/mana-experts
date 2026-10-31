import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  MapPin,
  PhoneCall,
  AlertTriangle,
  IndianRupee,
  Play,
  Briefcase,
  History,
  MessageCircle,
  ShieldAlert,
  ArrowLeft,
  Loader2,
  RefreshCw,
  LogIn,
  LogOut,
  Edit3,
  Wrench,
  User,
  Phone,
  Home,
  X,
  Image as ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import {
  TechnicianProfile,
  UserProfile,
  UserPrivateContact,
  ServiceCategory,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  CoinTransaction,
  BookingCompletionRecord,
  Language,
  MAX_VALID_LABOUR_CHARGE,
  checkBookingAcceptanceEligibility,
  filterActionableTechnicianRequests,
  filterAssignedTechnicianJobs,
  filterTechnicianCoinHistory,
  extractPermittedCustomerDetailsForTechnician,
  calculateTechnicianEarningsBreakdown,
  validateTechnicianProfileInput,
} from '../domain/manaRules';
import { translations } from '../domain/i18n';
import { AuthModalMode } from './AuthModal';

interface TechnicianViewProps {
  lang: Language;
  isAuthenticated: boolean;
  firebaseUserUid: string | null;
  firebaseUserEmail: string | null;
  currentUser: UserProfile | null;
  currentUserContact: UserPrivateContact | null;
  services: ServiceCategory[];
  serviceAreas: string[];
  authLoading: boolean;
  bookingsLoading: boolean;
  backendError: { kind: string; message: string } | null;
  onRetrySync: () => void;
  onOpenAuthModal: (mode?: AuthModalMode) => void;
  onSignOut: () => Promise<void>;
  onBackToCustomerView: () => void;
  technician: TechnicianProfile | null;
  bookings: Booking[];
  privateDetailsMap: Record<string, BookingPrivateDetails>;
  protectedPhotosMap: Record<string, BookingProtectedPhoto>;
  coinTransactions: CoinTransaction[];
  completionRecords: BookingCompletionRecord[];
  supportWhatsApp: string;
  onRegisterTechnicianProfile: (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills: string[];
    experienceYears: number;
    bio: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onUpdateTechnicianProfile: (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills: string[];
    experienceYears: number;
    bio: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onToggleAvailability: () => Promise<{ success: boolean; error?: string }>;
  onAcceptJob: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onStartWork: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onMarkWorkCompleted: (
    bookingId: string,
    labourCharges: number
  ) => Promise<{ success: boolean; error?: string }>;
  onRetryUnlockDetails: (bookingId: string) => Promise<void>;
}

export const TechnicianView: React.FC<TechnicianViewProps> = ({
  lang,
  isAuthenticated,
  firebaseUserUid,
  firebaseUserEmail,
  currentUser,
  currentUserContact,
  services,
  serviceAreas,
  authLoading,
  bookingsLoading,
  backendError,
  onRetrySync,
  onOpenAuthModal,
  onSignOut,
  onBackToCustomerView,
  technician,
  bookings,
  privateDetailsMap,
  protectedPhotosMap,
  coinTransactions,
  completionRecords,
  supportWhatsApp,
  onRegisterTechnicianProfile,
  onUpdateTechnicianProfile,
  onToggleAvailability,
  onAcceptJob,
  onStartWork,
  onMarkWorkCompleted,
  onRetryUnlockDetails,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<'REQUESTS' | 'ACTIVE_JOBS' | 'LEDGER'>('REQUESTS');
  const [labourChargeInputs, setLabourChargeInputs] = useState<Record<string, string>>({});
  const [failedCompleteBookingId, setFailedCompleteBookingId] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    null
  );
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [unlockingBookingId, setUnlockingBookingId] = useState<string | null>(null);

  // Synchronous duplicate-tap lock for job acceptance & state transitions
  const inFlightLockRef = useRef<Set<string>>(new Set());

  // Inline Technician Profile Editor / First-Time Registration Form State
  // Preserves entered values across errors and retries without losing information
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [profileArea, setProfileArea] = useState('');
  const [profileSkills, setProfileSkills] = useState<string[]>(['electrician']);
  const [profileExperience, setProfileExperience] = useState<string>('3');
  const [profileBio, setProfileBio] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileDirty, setProfileDirty] = useState(false);

  const availableAreas =
    serviceAreas.length > 0
      ? serviceAreas
      : [
          'Bapatla - Railpet',
          'Bapatla - Suryalanka Road',
          'Bapatla - Old Town',
          'Bapatla - Jammulapalem',
          'Bapatla - Karlapalem',
        ];

  // Hydrate profile form when technician or user profile loads, only if the user is not actively editing unsaved changes
  useEffect(() => {
    if (profileDirty) return;
    if (technician) {
      setProfileName(technician.name || currentUser?.name || '');
      setProfilePhone(technician.phone || currentUserContact?.phone || '');
      setProfileAddress(currentUserContact?.defaultAddress || technician.area || '');
      setProfileArea(technician.area || availableAreas[0] || 'Bapatla - Railpet');
      setProfileSkills(
        technician.skills && technician.skills.length > 0 ? technician.skills : ['electrician']
      );
      setProfileExperience(String(technician.experienceYears ?? 3));
      setProfileBio(technician.bio || '');
    } else if (currentUser) {
      setProfileName(currentUser.name || '');
      setProfilePhone(currentUserContact?.phone || '');
      setProfileAddress(currentUserContact?.defaultAddress || '');
      setProfileArea(currentUser.area || availableAreas[0] || 'Bapatla - Railpet');
    }
  }, [technician, currentUser, currentUserContact, availableAreas, profileDirty]);

  const toggleSkillSelection = (skillId: string) => {
    setProfileDirty(true);
    setProfileSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId]
    );
  };

  const handleOpenProfileEditor = () => {
    if (technician) {
      setProfileName(technician.name || currentUser?.name || '');
      setProfilePhone(technician.phone || currentUserContact?.phone || '');
      setProfileAddress(currentUserContact?.defaultAddress || technician.area || '');
      setProfileArea(technician.area || availableAreas[0] || 'Bapatla - Railpet');
      setProfileSkills(
        technician.skills && technician.skills.length > 0 ? technician.skills : ['electrician']
      );
      setProfileExperience(String(technician.experienceYears ?? 3));
      setProfileBio(technician.bio || '');
    }
    setProfileDirty(false);
    setProfileError(null);
    setProfileSuccessMsg(null);
    setIsEditingProfile(true);
  };

  const handleSaveTechnicianProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setProfileError(null);
    setProfileSuccessMsg(null);

    if (!firebaseUserUid) {
      setProfileError('Please sign in first so your profile is saved under your Firebase UID.');
      return;
    }

    const validation = validateTechnicianProfileInput({
      uid: firebaseUserUid,
      name: profileName,
      phone: profilePhone,
      area: profileArea || availableAreas[0],
      defaultAddress: profileAddress,
      skills: profileSkills,
      experienceYears: Number(profileExperience),
      bio: profileBio,
      activeServiceAreas: serviceAreas.length > 0 ? serviceAreas : undefined,
      availableServiceIds: services.length > 0 ? services.map((s) => s.id) : undefined,
    });

    if (!validation.valid || !validation.sanitized) {
      setProfileError(validation.error || 'Please check your technician profile fields.');
      return;
    }

    setProfileSaving(true);
    try {
      const payload = {
        name: validation.sanitized.name,
        phone: validation.sanitized.cleanPhone,
        defaultAddress: validation.sanitized.defaultAddress,
        area: validation.sanitized.area,
        skills: validation.sanitized.skills,
        experienceYears: validation.sanitized.experienceYears,
        bio: validation.sanitized.bio,
      };

      const res = technician
        ? await onUpdateTechnicianProfile(payload)
        : await onRegisterTechnicianProfile(payload);

      if (res.success) {
        setProfileDirty(false);
        setProfileError(null);
        setProfileSuccessMsg(
          technician
            ? 'Technician profile, skills, experience, and Bapatla service area saved to Cloud Firestore.'
            : 'Technician registration saved under your Firebase UID in PENDING status (0 initial coins).'
        );
        if (technician) {
          setIsEditingProfile(false);
          setActionAlert({
            type: 'success',
            msg: 'Saved your updated technician profile, skills, and service area to Firestore.',
          });
        }
      } else {
        // Keep all entered values intact so the technician can retry without re-typing
        setProfileError(
          res.error || 'Could not save technician profile to Firestore. Your entered details are preserved—tap Retry Save.'
        );
      }
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">
          Restoring technician account from Firebase...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-4">
        <button
          onClick={onBackToCustomerView}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Home
        </button>
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Briefcase className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Technician Sign-In Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please sign in with your authenticated account to access your saved Bapatla Technician Partner Dashboard or register as a new technician under your Firebase UID.
          </p>
          <button
            onClick={() => onOpenAuthModal('SIGN_IN')}
            className="w-full py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn className="w-4 h-4" />
            Sign In to Technician Console
          </button>
        </div>
      </div>
    );
  }

  // Authenticated user who does not yet have a /technicians/{uid} profile:
  // Allow them to register their Technician Partner profile under their authenticated Firebase UID.
  if (!technician) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBackToCustomerView}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer Home
          </button>
          <button
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#087F78] text-white flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#087F78] block">
                Mana Experts • Bapatla Partner Registration
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                Register Technician Profile Under Your UID
              </h2>
              <p className="text-xs text-slate-500">
                Account: {firebaseUserEmail || firebaseUserUid} (UID: {firebaseUserUid?.slice(0, 12)}...)
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <strong className="block font-extrabold">
              New Technician Onboarding Policy:
            </strong>
            <p className="text-[11px] leading-relaxed">
              Your technician profile is saved under your authenticated Firebase UID in <strong>PENDING</strong> status with <strong>0 Coins</strong>. You cannot accept customer jobs until Bapatla Admin approves your profile (which grants your one-time 3 Free Trial Coins).
            </p>
          </div>

          {profileError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-2">
              <div className="font-bold">{profileError}</div>
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => handleSaveTechnicianProfile()}
                className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-extrabold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Save Registration
              </button>
            </div>
          )}

          <form onSubmit={handleSaveTechnicianProfile} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => {
                      setProfileDirty(true);
                      setProfileName(e.target.value);
                    }}
                    placeholder="e.g., K. Ramesh Babu"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  10-Digit Mobile Number (Unverified) *
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={profilePhone}
                    onChange={(e) => {
                      setProfileDirty(true);
                      setProfilePhone(e.target.value);
                    }}
                    placeholder="9848011223"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Bapatla Service Area *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#087F78] absolute left-3 top-3" />
                  <select
                    aria-label="Authorized Bapatla Service Area"
                    value={profileArea}
                    onChange={(e) => {
                      setProfileDirty(true);
                      setProfileArea(e.target.value);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    {availableAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  required
                  value={profileExperience}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfileExperience(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Base Door No. & Street in Bapatla *
              </label>
              <div className="relative">
                <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={profileAddress}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfileAddress(e.target.value);
                  }}
                  placeholder="e.g., D.No 4-12, Near Old Bus Stand, Bapatla"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Authorized Trade Skills (At least 1) *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {services.map((srv) => {
                  const selected = profileSkills.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleSkillSelection(srv.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selected
                          ? 'bg-[#087F78] text-white border-[#087F78]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'en' ? srv.nameEn : srv.nameTe}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Summary / Bio
              </label>
              <textarea
                rows={2}
                value={profileBio}
                onChange={(e) => {
                  setProfileDirty(true);
                  setProfileBio(e.target.value);
                }}
                placeholder="Describe your tools, trade experience, and Bapatla service coverage..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-3 rounded-2xl bg-[#087F78] hover:bg-[#066660] disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm"
            >
              {profileSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Technician Registration Under My UID
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Strictly scoped to the authenticated technician's own profile (no technician impersonation selector)
  const actionableRequests = filterActionableTechnicianRequests({
    technician,
    bookings,
  });
  const myAssignedJobs = filterAssignedTechnicianJobs({
    technicianUid: technician.uid,
    bookings,
  });
  const myLedger = filterTechnicianCoinHistory({
    technicianUid: technician.uid,
    coinTransactions,
  });
  const earningsBreakdown = calculateTechnicianEarningsBreakdown({
    technician,
    bookings,
    completionRecords,
  });

  const skillDisplayNames = technician.skills.map((skillId) => {
    const found = services.find((s) => s.id === skillId);
    if (!found) return skillId;
    return lang === 'en' ? found.nameEn : found.nameTe;
  });

  const handleToggleOnline = async () => {
    const lockKey = `avail:${technician.uid}`;
    if (inFlightLockRef.current.has(lockKey)) return;
    inFlightLockRef.current.add(lockKey);
    setBusyActionId('toggle_online');
    setActionAlert(null);
    try {
      const res = await onToggleAvailability();
      if (!res.success) {
        setActionAlert({ type: 'error', msg: res.error || 'Could not update availability.' });
      }
    } finally {
      inFlightLockRef.current.delete(lockKey);
      setBusyActionId(null);
    }
  };

  const handleAcceptClick = async (bookingId: string) => {
    const lockKey = `accept:${bookingId}:${technician.uid}`;
    if (inFlightLockRef.current.has(lockKey)) {
      setActionAlert({
        type: 'error',
        msg: 'Acceptance request is already in progress. Duplicate tap ignored.',
      });
      return;
    }
    inFlightLockRef.current.add(lockKey);
    setBusyActionId(bookingId);
    setActionAlert(null);
    try {
      const res = await onAcceptJob(bookingId);
      if (res.success) {
        setActionAlert({
          type: 'success',
          msg: 'Booking accepted in Cloud Firestore! 1 Coin deducted atomically and customer doorstep address & phone unlocked.',
        });
        setActiveTab('ACTIVE_JOBS');
      } else {
        setActionAlert({
          type: 'error',
          msg: res.error || 'Backend rejected booking acceptance. No local acceptance was applied.',
        });
      }
    } finally {
      inFlightLockRef.current.delete(lockKey);
      setBusyActionId(null);
    }
  };

  const handleStartClick = async (bookingId: string) => {
    const lockKey = `start:${bookingId}:${technician.uid}`;
    if (inFlightLockRef.current.has(lockKey)) return;
    inFlightLockRef.current.add(lockKey);
    setBusyActionId(bookingId);
    setActionAlert(null);
    try {
      const res = await onStartWork(bookingId);
      if (res.success) {
        setActionAlert({
          type: 'success',
          msg: 'Job status updated to IN_PROGRESS in Cloud Firestore.',
        });
      } else {
        setActionAlert({ type: 'error', msg: res.error || 'Failed to mark work started.' });
      }
    } finally {
      inFlightLockRef.current.delete(lockKey);
      setBusyActionId(null);
    }
  };

  const handleCompleteSubmit = async (bookingId: string) => {
    const raw = (labourChargeInputs[bookingId] || '').trim();
    const amount = Math.round(Number(raw));
    if (!raw || !Number.isFinite(amount) || amount <= 0 || amount > MAX_VALID_LABOUR_CHARGE) {
      setFailedCompleteBookingId(bookingId);
      setActionAlert({
        type: 'error',
        msg: `Please enter valid final labour charges between ₹1 and ₹${MAX_VALID_LABOUR_CHARGE} before marking work completed.`,
      });
      return;
    }

    const lockKey = `complete:${bookingId}:${technician.uid}`;
    if (inFlightLockRef.current.has(lockKey)) return;
    inFlightLockRef.current.add(lockKey);
    setBusyActionId(bookingId);
    setActionAlert(null);
    try {
      const res = await onMarkWorkCompleted(bookingId, amount);
      if (res.success) {
        setFailedCompleteBookingId(null);
        setActionAlert({
          type: 'success',
          msg: `Submitted ₹${amount} labour charges and marked WORK_COMPLETED. Awaiting customer confirmation before adding to Verified Earnings.`,
        });
      } else {
        // Preserve labourChargeInputs[bookingId] so the technician can retry without re-entering
        setFailedCompleteBookingId(bookingId);
        setActionAlert({
          type: 'error',
          msg:
            res.error ||
            'Failed to submit work completion to Firestore. Your entered labour charge is preserved—tap Retry.',
        });
      }
    } finally {
      inFlightLockRef.current.delete(lockKey);
      setBusyActionId(null);
    }
  };

  const handleManualUnlockRetry = async (bookingId: string) => {
    setUnlockingBookingId(bookingId);
    try {
      await onRetryUnlockDetails(bookingId);
    } finally {
      setUnlockingBookingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pt-3 pb-24 space-y-5">
      {/* Top Navigation & Profile/Logout Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBackToCustomerView}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Customer Home
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            Authenticated UID: {technician.uid.slice(0, 10)}...
          </span>
          <button
            type="button"
            onClick={handleOpenProfileEditor}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <Edit3 className="w-3.5 h-3.5 text-teal-700" />
            Edit Profile & Skills
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Backend Error Banner */}
      {backendError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3">
          <div className="text-xs">
            <strong className="uppercase tracking-wider block text-rose-700">
              {backendError.kind}
            </strong>
            <span>{backendError.message}</span>
          </div>
          <button
            type="button"
            onClick={onRetrySync}
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Inline Persistent Technician Profile & Skills Editor (Preserves State on Error/Retry) */}
      {isEditingProfile && (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#087F78]/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F78] block">
                Persistent Technician Profile • UID: {technician.uid}
              </span>
              <h2 className="text-sm font-extrabold text-slate-900">
                Edit Skills, Experience, Service Area & Profile Details
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              aria-label="Close profile editor"
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {profileError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold">{profileError}</span>
              <button
                type="button"
                disabled={profileSaving}
                onClick={() => handleSaveTechnicianProfile()}
                className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-extrabold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry Save
              </button>
            </div>
          )}

          {profileSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
              {profileSuccessMsg}
            </div>
          )}

          <form onSubmit={handleSaveTechnicianProfile} className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfileName(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number (10-digit, Unverified) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={profilePhone}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfilePhone(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Authorized Bapatla Service Area *
                </label>
                <select
                  aria-label="Edit Authorized Bapatla Service Area"
                  value={profileArea}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfileArea(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {availableAreas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Experience (Years) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  required
                  value={profileExperience}
                  onChange={(e) => {
                    setProfileDirty(true);
                    setProfileExperience(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Default Door No. & Street Address *
              </label>
              <input
                type="text"
                required
                value={profileAddress}
                onChange={(e) => {
                  setProfileDirty(true);
                  setProfileAddress(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Authorized Trade Skills (Controls Request Eligibility) *
              </label>
              <div className="flex flex-wrap gap-1.5">
                {services.map((srv) => {
                  const active = profileSkills.includes(srv.id);
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => toggleSkillSelection(srv.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                        active
                          ? 'bg-[#087F78] text-white border-[#087F78]'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {lang === 'en' ? srv.nameEn : srv.nameTe}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Summary / Bio
              </label>
              <textarea
                rows={2}
                value={profileBio}
                onChange={(e) => {
                  setProfileDirty(true);
                  setProfileBio(e.target.value);
                }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-slate-500">
                Status (<strong>{technician.approvalStatus}</strong>), Coins (<strong>{technician.coinBalance}</strong>), & Verified Earnings (<strong>₹{earningsBreakdown.confirmedEarnings}</strong>) are protected during profile edits.
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="px-4 py-2 rounded-xl bg-[#087F78] hover:bg-[#066660] disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5"
                >
                  {profileSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Profile Changes
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Partner Header Card */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Mana Experts • {t.techDashboard}
            </span>
            <h1 className="text-lg font-extrabold">{technician.name}</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Area: <strong>{technician.area}</strong> • Experience:{' '}
              <strong>{technician.experienceYears} yrs</strong> • Phone: +91 {technician.phone}{' '}
              <span className="text-amber-300/90">(Unverified)</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Authorized Skills: <strong className="text-teal-300">{skillDisplayNames.join(', ')}</strong>
              {technician.bio ? ` • "${technician.bio}"` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                technician.approvalStatus === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : technician.approvalStatus === 'PENDING'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {technician.approvalStatus}
            </span>
          </div>
        </div>

        {/* Backend Approval Status Banner for PENDING / REJECTED / SUSPENDED */}
        {technician.approvalStatus === 'PENDING' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="block text-amber-300 font-extrabold">
                {t.pendingApprovalBanner} (Status: PENDING • Starting Coins: 0)
              </strong>
              <p className="leading-relaxed">
                New technicians start with <strong>0 coins</strong> and cannot go online or accept customer job requests before Bapatla Admin approval. Once approved for the first time, you receive <strong>3 Free Trial Coins</strong>.
              </p>
            </div>
          </div>
        )}

        {technician.approvalStatus === 'REJECTED' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="block text-rose-300 font-extrabold">
                Technician Application Rejected (Status: REJECTED)
              </strong>
              <p className="leading-relaxed">
                Your technician registration was marked <strong>REJECTED</strong> by Bapatla Admin. Rejected accounts cannot go online or receive actionable customer job requests. You may update your skills/experience via <strong>Edit Profile & Skills</strong> and contact Admin.
              </p>
            </div>
          </div>
        )}

        {technician.approvalStatus === 'SUSPENDED' && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-400/30 text-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <strong className="block text-rose-300 font-extrabold">
                Technician Account Suspended (Status: SUSPENDED)
              </strong>
              <p className="leading-relaxed">
                Your technician account is currently <strong>SUSPENDED</strong> by Bapatla Admin. Availability is locked offline and actionable job requests are blocked until Admin re-approves your account.
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{t.coinBalance}</span>
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">
              {technician.coinBalance}
            </div>
            <span className="text-[10px] text-slate-400">1 Coin = 1 Accepted Lead</span>
          </div>

          <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{t.totalEarnings}</span>
              <IndianRupee className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              ₹{earningsBreakdown.confirmedEarnings}
            </div>
            {earningsBreakdown.awaitingConfirmationCount > 0 ? (
              <span className="text-[10px] font-bold text-amber-300 block">
                + ₹{earningsBreakdown.awaitingConfirmationAmount} awaiting customer confirmation
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Confirmed by Customer</span>
            )}
          </div>

          <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>{t.completedJobsCount}</span>
              <CheckCircle2 className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {earningsBreakdown.confirmedJobsCount}
            </div>
            <span className="text-[10px] text-slate-400">
              Rating: ★ {technician.ratingAvg > 0 ? technician.ratingAvg.toFixed(1) : 'New'} ({technician.ratingCount})
            </span>
          </div>

          <div className="bg-slate-800/90 rounded-2xl p-3.5 border border-slate-700 flex flex-col justify-between">
            <span className="text-xs text-slate-400">Duty Status</span>
            <button
              type="button"
              disabled={technician.approvalStatus !== 'APPROVED' || busyActionId === 'toggle_online'}
              onClick={handleToggleOnline}
              className={`mt-1 py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                technician.isAvailable && technician.approvalStatus === 'APPROVED'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-700 text-slate-300 disabled:opacity-50'
              }`}
            >
              {busyActionId === 'toggle_online' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span
                  className={`w-2 h-2 rounded-full ${
                    technician.isAvailable && technician.approvalStatus === 'APPROVED'
                      ? 'bg-slate-950'
                      : 'bg-slate-400'
                  }`}
                />
              )}
              {technician.isAvailable && technician.approvalStatus === 'APPROVED'
                ? t.availableForJobs
                : t.offlineMode}
            </button>
          </div>
        </div>

        {/* Low Coin Recharge Prompt */}
        {technician.approvalStatus === 'APPROVED' && technician.coinBalance <= 1 && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {technician.coinBalance === 0
                  ? t.zeroCoinsWarning
                  : 'Low coin balance (1 coin left). Contact Bapatla Admin for offline coin top-up.'}
              </span>
            </div>
            <a
              href={`https://wa.me/${supportWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent(
                `Namaste Mana Experts Admin, I am technician ${technician.name} (${technician.phone}, UID: ${technician.uid}) in Bapatla. Please recharge my lead coins.`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              {t.contactAdminForCoins}
            </a>
          </div>
        )}
      </div>

      {/* Action Feedback Toast */}
      {actionAlert && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{actionAlert.msg}</span>
          <button
            type="button"
            onClick={() => setActionAlert(null)}
            className="text-[11px] underline ml-3"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('REQUESTS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'REQUESTS'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {t.incomingRequests} ({actionableRequests.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ACTIVE_JOBS')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'ACTIVE_JOBS'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          My Accepted Jobs ({myAssignedJobs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('LEDGER')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'LEDGER'
              ? 'bg-white text-teal-900 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          Coin Ledger ({myLedger.length})
        </button>
      </div>

      {/* TAB 1: INCOMING REQUESTS (Strictly Scoped by Approval, Availability, Skill & Area) */}
      {activeTab === 'REQUESTS' && (
        <div className="space-y-3">
          {technician.approvalStatus !== 'APPROVED' ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-amber-200 space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Actionable Job Requests Locked ({technician.approvalStatus})
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                {technician.approvalStatus === 'PENDING'
                  ? 'Pending technicians start with 0 coins and cannot receive or accept customer requests until Bapatla Admin approves your profile.'
                  : technician.approvalStatus === 'REJECTED'
                  ? 'Rejected technician accounts cannot receive or accept customer requests.'
                  : 'Suspended technician accounts cannot receive or accept customer requests.'}
              </p>
            </div>
          ) : !technician.isAvailable ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-900">
                You Are Currently Offline ({t.offlineMode})
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Actionable customer job requests are removed from your screen while your availability is set to Offline. Turn your availability ON to view open requests for{' '}
                <strong>{skillDisplayNames.join(', ')}</strong> in{' '}
                <strong>{technician.area}</strong>.
              </p>
              <button
                type="button"
                disabled={busyActionId === 'toggle_online'}
                onClick={handleToggleOnline}
                className="px-4 py-2.5 rounded-xl bg-[#087F78] hover:bg-[#066660] text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-xs"
              >
                {busyActionId === 'toggle_online' && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                Go Online to Receive Requests
              </button>
            </div>
          ) : bookingsLoading ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <Loader2 className="w-6 h-6 text-teal-700 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                Loading eligible customer requests in {technician.area}...
              </p>
            </div>
          ) : (
            <>
              <div className="px-3.5 py-2.5 rounded-2xl bg-[#E8F7F4] border border-[#087F78]/20 flex flex-wrap items-center justify-between gap-2 text-xs text-[#0F2942]">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#087F78]" />
                  Eligibility Filter Active: Showing only requests for{' '}
                  <strong>{skillDisplayNames.join(', ')}</strong> in{' '}
                  <strong>{technician.area}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleOpenProfileEditor}
                  className="text-[11px] font-extrabold text-[#087F78] underline"
                >
                  Change Area / Skills
                </button>
              </div>

              {actionableRequests.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-1.5">
                  <p className="text-sm font-bold text-slate-700">
                    No open requests matching your skills & area right now.
                  </p>
                  <p className="text-xs text-slate-500">
                    Watching real-time Firestore requests for{' '}
                    <strong>{skillDisplayNames.join(', ')}</strong> in{' '}
                    <strong>{technician.area}</strong>.
                  </p>
                </div>
              ) : (
                actionableRequests.map((bk) => {
                  const eligibility = checkBookingAcceptanceEligibility(technician, bk);
                  const isBusy = busyActionId === bk.id;
                  return (
                    <div
                      key={bk.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold text-teal-700 uppercase">
                            Eligible Lead • {bk.generalArea}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900">
                            {lang === 'en' ? bk.serviceNameEn : bk.serviceNameTe} — {bk.customerName}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold">
                          1 Coin to Accept
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <strong>Problem:</strong> {bk.problemDescription}
                        {bk.photoNote ? (
                          <span className="block text-[11px] text-slate-500 mt-1">
                            <strong>Appliance/Note:</strong> {bk.photoNote}
                          </span>
                        ) : null}
                      </p>

                      {/* PII Protection Notice */}
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          {t.protectedAddressHidden}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {bk.preferredDate} • {bk.preferredTimeSlot}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {!eligibility.eligible ? (
                          <span className="text-xs font-bold text-rose-600">
                            Cannot Accept: {eligibility.reason}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-700">
                            ✓ Eligible to accept ({technician.coinBalance} coins available)
                          </span>
                        )}

                        <button
                          type="button"
                          disabled={!eligibility.eligible || isBusy}
                          onClick={() => handleAcceptClick(bk.id)}
                          className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-extrabold transition shadow-xs flex items-center gap-1.5"
                        >
                          {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {t.acceptWithOneCoin}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: MY ACCEPTED JOBS */}
      {activeTab === 'ACTIVE_JOBS' && (
        <div className="space-y-3">
          {myAssignedJobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <p className="text-sm font-bold text-slate-600">
                You haven&apos;t accepted any jobs yet.
              </p>
            </div>
          ) : (
            myAssignedJobs.map((bk) => {
              const permittedCustomer = extractPermittedCustomerDetailsForTechnician({
                technicianUid: technician.uid,
                booking: bk,
                privateDetailsMap,
                protectedPhotosMap,
              });
              const priv = permittedCustomer.details;
              const protectedPhoto = permittedCustomer.photo;
              const isBusy = busyActionId === bk.id;

              return (
                <div
                  key={bk.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-teal-700 uppercase">
                        Job #{bk.id.slice(-6).toUpperCase()} • {bk.generalArea} • {bk.preferredDate} ({bk.preferredTimeSlot})
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {lang === 'en' ? bk.serviceNameEn : bk.serviceNameTe} — {bk.customerName}
                      </h3>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${
                        bk.status === 'WORK_COMPLETED'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : bk.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-teal-100 text-teal-900'
                      }`}
                    >
                      {bk.status === 'WORK_COMPLETED'
                        ? 'AWAITING CUSTOMER CONFIRMATION'
                        : bk.status}
                    </span>
                  </div>

                  {/* Unlocked Protected Customer PII Box (Only for Assigned Technician) */}
                  {permittedCustomer.unlocked && priv ? (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5" />
                          Unlocked Customer Doorstep Address & Contact
                        </span>
                        <a
                          href={`tel:${priv.customerPhone}`}
                          className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          +91 {priv.customerPhone}
                        </a>
                      </div>
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        {priv.fullAddress} ({priv.landmark}
                        {priv.villageOrWard ? `, ${priv.villageOrWard}` : ''})
                      </p>

                      {protectedPhoto && protectedPhoto.dataUrl && (
                        <div className="pt-2 border-t border-emerald-200/70 space-y-1.5">
                          <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            Customer Uploaded Problem Photo ({protectedPhoto.fileName})
                          </span>
                          <img
                            src={protectedPhoto.dataUrl}
                            alt={`Problem uploaded for booking ${bk.id}`}
                            className="w-36 h-28 object-cover rounded-xl border border-emerald-300"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-600">
                      <span>Loading protected customer doorstep address from Firestore...</span>
                      <button
                        type="button"
                        disabled={unlockingBookingId === bk.id}
                        onClick={() => handleManualUnlockRetry(bk.id)}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center gap-1"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${unlockingBookingId === bk.id ? 'animate-spin' : ''}`}
                        />
                        Retry Load Details
                      </button>
                    </div>
                  )}

                  <p className="text-xs text-slate-600">
                    <strong>Reported Fault:</strong> {bk.problemDescription}
                    {bk.photoNote ? ` • Note: ${bk.photoNote}` : ''}
                  </p>

                  {/* Workflow Controls: ACCEPTED -> IN_PROGRESS */}
                  {bk.status === 'ACCEPTED' && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleStartClick(bk.id)}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5"
                      >
                        {isBusy ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Play className="w-3.5 h-3.5" />
                        )}
                        {t.startWorkBtn}
                      </button>
                    </div>
                  )}

                  {/* Workflow Controls: IN_PROGRESS -> WORK_COMPLETED */}
                  {bk.status === 'IN_PROGRESS' && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-amber-950">
                          <IndianRupee className="w-4 h-4 text-amber-800" />
                          <span>Final Labour Charges (₹):</span>
                          <input
                            type="number"
                            min={1}
                            max={MAX_VALID_LABOUR_CHARGE}
                            step={1}
                            aria-label={`Final Labour Charges for booking ${bk.id}`}
                            placeholder={t.enterLabourCharges}
                            value={labourChargeInputs[bk.id] || ''}
                            onChange={(e) =>
                              setLabourChargeInputs((prev) => ({
                                ...prev,
                                [bk.id]: e.target.value,
                              }))
                            }
                            className="px-3 py-1.5 text-xs rounded-xl border border-amber-300 bg-white w-44 font-bold"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleCompleteSubmit(bk.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {failedCompleteBookingId === bk.id
                            ? 'Retry Mark Work Completed'
                            : t.markWorkCompletedBtn}
                        </button>
                      </div>
                      <p className="text-[11px] text-amber-900">
                        Submitting labour charges transitions this job to <strong>Awaiting Customer Confirmation</strong>. Earnings are added to your Verified Earnings once the customer confirms completion.
                      </p>
                    </div>
                  )}

                  {/* WORK_COMPLETED: Awaiting Customer Confirmation */}
                  {bk.status === 'WORK_COMPLETED' && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                      <strong className="block font-extrabold text-amber-900">
                        ⏳ Awaiting Customer Confirmation (₹{bk.labourCharges} Labour Charges Submitted)
                      </strong>
                      <p className="text-[11px] text-amber-800">
                        Work is marked completed. According to the platform accounting rule, ₹{bk.labourCharges} will be counted in your Verified Earnings as soon as {bk.customerName} confirms completion.
                      </p>
                    </div>
                  )}

                  {/* CONFIRMED: Customer Confirmed -> Counted in Verified Earnings */}
                  {bk.status === 'CONFIRMED' && (
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2.5 rounded-xl border border-emerald-200">
                      ✓ Confirmed by customer • ₹{bk.labourCharges} counted in your Verified Earnings.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: IMMUTABLE COIN LEDGER */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-extrabold text-slate-900">
              Immutable Lead Coin History (UID: {technician.uid.slice(0, 10)}...)
            </h3>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              Current Balance: {technician.coinBalance} Coins
            </span>
          </div>
          {myLedger.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 text-center">
              No coin transactions recorded yet for your account.
            </p>
          ) : (
            myLedger.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-extrabold text-slate-800 block">
                    {tx.reason.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(tx.createdAt).toLocaleString()}
                    {tx.bookingId ? ` • Booking #${tx.bookingId.slice(-6).toUpperCase()}` : ''}
                    {typeof tx.prevBalance === 'number' && typeof tx.balanceAfter === 'number'
                      ? ` • Balance: ${tx.prevBalance} → ${tx.balanceAfter}`
                      : ''}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Tx ID: {tx.id}
                  </span>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg font-black text-sm shrink-0 ${
                    tx.delta > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {tx.delta > 0 ? `+${tx.delta}` : tx.delta} Coins
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
