import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Star,
  Calendar,
  Camera,
  FileText,
  UploadCloud,
  Trash2,
  Shield,
  Sparkles,
  Zap,
  Droplets,
  Wind,
  Tv,
  Hammer,
  Paintbrush,
  Filter,
  HelpCircle,
  Bell,
  ChevronDown,
  Home,
  ClipboardList,
  User as UserIcon,
  Globe,
  ShieldCheck,
  Award,
  X,
  LogIn,
  LogOut,
  AlertTriangle,
  RefreshCw,
  WifiOff,
  Lock,
  Loader2,
  Edit3,
  KeyRound,
  Info,
} from 'lucide-react';
import {
  ServiceCategory,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  TechnicianProfile,
  CustomerReview,
  Language,
  UserRole,
  UserProfile,
  UserPrivateContact,
  VALID_BOOKING_TIME_SLOTS,
  validateCustomerBookingInput,
  validateBookingPhotoFile,
  validateProtectedPhotoPayload,
  validateCustomerReviewInput,
  filterCustomerOwnedBookings,
  extractPermittedTechnicianContact,
} from '../domain/manaRules';
import { translations } from '../domain/i18n';
import { AuthModalMode } from './AuthModal';

interface CustomerViewProps {
  lang: Language;
  onToggleLang: () => void;
  currentRole: UserRole;
  authorizedRoles: UserRole[];
  onSwitchRole: (role: UserRole) => void;
  onOpenAuthModal: (mode?: AuthModalMode) => void;
  onSignOut: () => Promise<void>;
  isAuthenticated: boolean;
  firebaseUserUid: string | null;
  firebaseUserEmail: string | null;
  currentUser: UserProfile | null;
  currentUserContact: UserPrivateContact | null;
  isAuthorizedAdmin: boolean;
  canBootstrapFirstAdmin: boolean;
  onBootstrapFirstAdmin: () => Promise<{ success: boolean; error?: string }>;
  authLoading: boolean;
  catalogLoading: boolean;
  bookingsLoading: boolean;
  backendError: { kind: string; message: string } | null;
  onRetrySync: () => void;
  onSeedDefaultCatalog?: () => Promise<void>;
  selectedArea: string;
  serviceAreas: string[];
  onSelectArea: (area: string) => void;
  services: ServiceCategory[];
  bookings: Booking[];
  privateDetailsMap: Record<string, BookingPrivateDetails>;
  protectedPhotosMap: Record<string, BookingProtectedPhoto>;
  technicians: TechnicianProfile[];
  reviews: CustomerReview[];
  unreadNotifCount: number;
  onOpenNotifications: () => void;
  onUploadBookingPhotoDraft: (
    file: File,
    onProgress?: (percent: number, stage: string) => void
  ) => Promise<{ success: boolean; photo?: BookingProtectedPhoto; error?: string }>;
  onRemoveBookingPhotoDraft: () => Promise<void>;
  onCreateBooking: (input: {
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
  }) => Promise<{ success: boolean; booking?: Booking; error?: string }>;
  onCancelBooking: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onConfirmCompletion: (bookingId: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitReview: (
    bookingId: string,
    technicianId: string,
    rating: number,
    comment: string
  ) => Promise<{ success: boolean; error?: string }>;
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-4 h-4 text-[#087F78]" />,
  Droplets: <Droplets className="w-4 h-4 text-[#087F78]" />,
  Wind: <Wind className="w-4 h-4 text-[#087F78]" />,
  Tv: <Tv className="w-4 h-4 text-[#087F78]" />,
  Hammer: <Hammer className="w-4 h-4 text-[#087F78]" />,
  Sparkles: <Sparkles className="w-4 h-4 text-[#087F78]" />,
  Paintbrush: <Paintbrush className="w-4 h-4 text-[#087F78]" />,
  Filter: <Filter className="w-4 h-4 text-[#087F78]" />,
};

export const CustomerView: React.FC<CustomerViewProps> = ({
  lang,
  onToggleLang,
  currentRole,
  authorizedRoles,
  onSwitchRole,
  onOpenAuthModal,
  onSignOut,
  isAuthenticated,
  firebaseUserUid,
  firebaseUserEmail,
  currentUser,
  currentUserContact,
  isAuthorizedAdmin,
  canBootstrapFirstAdmin,
  onBootstrapFirstAdmin,
  authLoading,
  catalogLoading,
  bookingsLoading,
  backendError,
  onRetrySync,
  onSeedDefaultCatalog,
  selectedArea,
  serviceAreas,
  onSelectArea,
  services,
  bookings,
  privateDetailsMap,
  protectedPhotosMap,
  technicians,
  reviews,
  unreadNotifCount,
  onOpenNotifications,
  onUploadBookingPhotoDraft,
  onRemoveBookingPhotoDraft,
  onCreateBooking,
  onCancelBooking,
  onConfirmCompletion,
  onSubmitReview,
}) => {
  const t = translations[lang];
  const [activeBottomTab, setActiveBottomTab] = useState<'HOME' | 'BOOKINGS' | 'PROFILE'>('HOME');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);

  // Booking Modal State
  const [selectedServiceForBooking, setSelectedServiceForBooking] = useState<ServiceCategory | null>(null);
  const [bookingLocality, setBookingLocality] = useState<string>(selectedArea);
  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [villageOrWard, setVillageOrWard] = useState('Ward 8');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<string>(VALID_BOOKING_TIME_SLOTS[1]);
  const [photoNote, setPhotoNote] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Protected Photo Upload State (Item 5)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [uploadedProtectedPhoto, setUploadedProtectedPhoto] = useState<BookingProtectedPhoto | null>(null);
  const [photoUploadState, setPhotoUploadState] = useState<
    'IDLE' | 'UPLOADING' | 'UPLOADED' | 'ERROR'
  >('IDLE');
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number>(0);
  const [photoUploadError, setPhotoUploadError] = useState<string | null>(null);

  // Server-Acknowledged Booking Confirmation Receipt Modal (Item 4)
  const [acknowledgedBooking, setAcknowledgedBooking] = useState<Booking | null>(null);

  // Synchronous in-flight locks to prevent repeated-tap duplicate submissions
  const bookingSubmitLockRef = useRef<boolean>(false);
  const actionLockRef = useRef<boolean>(false);
  const reviewSubmitLockRef = useRef<boolean>(false);

  // Action loading/error state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [isSeedingCatalog, setIsSeedingCatalog] = useState(false);
  const [isBootstrappingAdmin, setIsBootstrappingAdmin] = useState(false);

  // Rating Modal State (Item 9 — never pre-fills 5 stars or auto-generates a positive review)
  const [ratingBooking, setRatingBooking] = useState<Booking | null>(null);
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [ratingComment, setRatingComment] = useState('');
  const [reviewFormError, setReviewFormError] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (selectedArea) {
      setBookingLocality(selectedArea);
    }
  }, [selectedArea]);

  useEffect(() => {
    if (currentUserContact?.phone) {
      setCustomerPhone(currentUserContact.phone);
    }
    if (currentUserContact?.defaultAddress) {
      setFullAddress(currentUserContact.defaultAddress);
    }
  }, [currentUserContact?.phone, currentUserContact?.defaultAddress]);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Filter services by search query; preserve both active and disabled services so disabled services are shown honestly
  const filteredServices = services
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.nameEn.toLowerCase().includes(q) ||
        s.nameTe.toLowerCase().includes(q) ||
        s.descriptionEn.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Strictly scope bookings to the authenticated customer's Firebase UID (Item 6)
  const ownedBookings = filterCustomerOwnedBookings(bookings, firebaseUserUid);
  const customerBookings = ownedBookings.filter((b) =>
    bookingFilter === 'ACTIVE'
      ? ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(b.status)
      : ['CONFIRMED', 'CANCELLED'].includes(b.status)
  );

  const handleOpenBookingModal = (srv: ServiceCategory) => {
    setFormError('');
    setPhotoUploadError(null);
    setBookingLocality(selectedArea || serviceAreas[0] || '');
    if (currentUserContact?.phone && !customerPhone) {
      setCustomerPhone(currentUserContact.phone);
    }
    if (currentUserContact?.defaultAddress && !fullAddress) {
      setFullAddress(currentUserContact.defaultAddress);
    }
    if (!srv.enabled) {
      setActionErrorMsg(
        `The service "${srv.nameEn}" is currently disabled by Bapatla Admin and cannot accept new bookings.`
      );
      return;
    }
    setSelectedServiceForBooking(srv);
  };

  const executeProtectedPhotoUpload = async (file: File) => {
    setPhotoUploadState('UPLOADING');
    setPhotoUploadError(null);
    setPhotoUploadProgress(10);

    const res = await onUploadBookingPhotoDraft(file, (percent) => {
      setPhotoUploadProgress(percent);
    });
    if (res.success && res.photo) {
      setUploadedProtectedPhoto(res.photo);
      setPhotoUploadProgress(100);
      setPhotoUploadState('UPLOADED');
      setPhotoUploadError(null);
    } else {
      setPhotoUploadState('ERROR');
      setPhotoUploadError(
        res.error || 'Photo upload to protected storage failed. Tap Retry Upload.'
      );
    }
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploadError(null);
    const fileCheck = validateBookingPhotoFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!fileCheck.valid) {
      setPhotoUploadState('ERROR');
      setPhotoUploadProgress(0);
      setPhotoUploadError(fileCheck.error || 'Invalid image file.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setPendingPhotoFile(file);
    await executeProtectedPhotoUpload(file);
  };

  const handleRetryPhotoUpload = async () => {
    if (!pendingPhotoFile) return;
    await executeProtectedPhotoUpload(pendingPhotoFile);
  };

  const handleRemoveSelectedPhoto = async () => {
    setPendingPhotoFile(null);
    setUploadedProtectedPhoto(null);
    setPhotoUploadState('IDLE');
    setPhotoUploadProgress(0);
    setPhotoUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    await onRemoveBookingPhotoDraft();
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForBooking) return;
    if (bookingSubmitLockRef.current || isSubmittingBooking) return;
    setFormError('');

    if (!isAuthenticated || !currentUser || !firebaseUserUid) {
      setFormError('Please sign in and complete your customer profile before booking a service.');
      return;
    }

    if (photoUploadState === 'UPLOADING') {
      setFormError('Please wait for your photo upload to complete before submitting.');
      return;
    }

    if (photoUploadState === 'ERROR') {
      setFormError('Please retry or remove the failed photo upload before submitting your booking.');
      return;
    }

    const effectiveArea = bookingLocality || selectedArea;
    const validation = validateCustomerBookingInput({
      customerUid: firebaseUserUid,
      customerName: currentUser.name,
      service: selectedServiceForBooking,
      catalogServices: services,
      generalArea: effectiveArea,
      activeServiceAreas: serviceAreas,
      fullAddress,
      landmark,
      villageOrWard,
      customerPhone,
      problemDescription,
      preferredDate,
      preferredTimeSlot,
      photoNote,
    });

    if (!validation.valid) {
      setFormError(validation.error || 'Please check your booking details.');
      return;
    }

    bookingSubmitLockRef.current = true;
    setIsSubmittingBooking(true);
    try {
      if (effectiveArea !== selectedArea) {
        onSelectArea(effectiveArea);
      }

      const cleanPhone = customerPhone.replace(/\D/g, '');
      const result = await onCreateBooking({
        service: selectedServiceForBooking,
        generalArea: effectiveArea,
        fullAddress: fullAddress.trim(),
        landmark: landmark.trim() || 'Near Main Road',
        villageOrWard: villageOrWard.trim() || effectiveArea,
        customerPhone: cleanPhone,
        problemDescription: problemDescription.trim(),
        preferredDate,
        preferredTimeSlot,
        photoNote: photoNote.trim(),
        protectedPhoto: uploadedProtectedPhoto,
      });

      // Show confirmation ONLY after the operation is acknowledged by the backend (Item 4)
      if (result.success && result.booking) {
        setSelectedServiceForBooking(null);
        setProblemDescription('');
        setPhotoNote('');
        setPendingPhotoFile(null);
        setUploadedProtectedPhoto(null);
        setPhotoUploadState('IDLE');
        setPhotoUploadProgress(0);
        setPhotoUploadError(null);
        setAcknowledgedBooking(result.booking);
      } else {
        setFormError(result.error || 'Booking could not be saved to Cloud Firestore.');
      }
    } finally {
      setIsSubmittingBooking(false);
      bookingSubmitLockRef.current = false;
    }
  };

  const handleCancelClick = async (bookingId: string) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setActionErrorMsg(null);
    setActionLoadingId(bookingId);
    try {
      const res = await onCancelBooking(bookingId);
      if (!res.success) {
        setActionErrorMsg(res.error || 'Failed to cancel booking.');
      }
    } finally {
      setActionLoadingId(null);
      actionLockRef.current = false;
    }
  };

  const handleConfirmClick = async (bookingId: string) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    setActionErrorMsg(null);
    setActionLoadingId(bookingId);
    try {
      const res = await onConfirmCompletion(bookingId);
      if (!res.success) {
        setActionErrorMsg(res.error || 'Failed to confirm job completion.');
      }
    } finally {
      setActionLoadingId(null);
      actionLockRef.current = false;
    }
  };

  const handleOpenReviewModal = (bk: Booking) => {
    setRatingBooking(bk);
    setRatingStars(0);
    setRatingComment('');
    setReviewFormError(null);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingBooking) return;
    if (reviewSubmitLockRef.current || isSubmittingReview) return;

    setReviewFormError(null);
    const existingReviewIds = new Set(reviews.map((r) => r.id));
    const reviewValidation = validateCustomerReviewInput({
      booking: ratingBooking,
      customerUid: firebaseUserUid || '',
      rating: ratingStars,
      comment: ratingComment,
      existingReviewIds,
    });
    if (!reviewValidation.valid) {
      setReviewFormError(reviewValidation.error || 'Please provide a star rating and review.');
      return;
    }

    reviewSubmitLockRef.current = true;
    setIsSubmittingReview(true);
    setActionErrorMsg(null);
    try {
      const res = await onSubmitReview(
        ratingBooking.id,
        ratingBooking.technicianId,
        ratingStars,
        ratingComment.trim()
      );
      if (res.success) {
        setRatingBooking(null);
        setRatingComment('');
        setRatingStars(0);
        setReviewFormError(null);
      } else {
        setReviewFormError(res.error || 'Failed to submit review.');
      }
    } finally {
      setIsSubmittingReview(false);
      reviewSubmitLockRef.current = false;
    }
  };

  const handleSeedClick = async () => {
    if (!onSeedDefaultCatalog) return;
    setIsSeedingCatalog(true);
    try {
      await onSeedDefaultCatalog();
    } finally {
      setIsSeedingCatalog(false);
    }
  };

  const handleBootstrapAdminClick = async () => {
    setIsBootstrappingAdmin(true);
    setActionErrorMsg(null);
    try {
      const res = await onBootstrapFirstAdmin();
      if (!res.success) {
        setActionErrorMsg(res.error || 'Could not provision Admin record in Firestore.');
      }
    } finally {
      setIsBootstrappingAdmin(false);
    }
  };

  const displayLocationLabel = !selectedArea
    ? catalogLoading
      ? lang === 'en'
        ? 'Loading Bapatla areas...'
        : 'బాపట్ల ప్రాంతాలు లోడ్ అవుతున్నాయి...'
      : lang === 'en'
      ? 'Select Bapatla Area'
      : 'బాపట్ల ప్రాంతాన్ని ఎంచుకోండి'
    : selectedArea === 'Bapatla - Railpet'
    ? lang === 'en'
      ? 'Bapatla'
      : 'బాపట్ల'
    : selectedArea.replace('Bapatla - ', 'Bapatla • ');

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col justify-between pb-24">
      <div className="w-full max-w-md mx-auto">
        {/* Backend Error / Offline / Permission Banner */}
        {backendError && (
          <div className="mx-5 mt-3 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 shadow-xs">
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                {backendError.kind === 'offline' ? (
                  <WifiOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : backendError.kind === 'permission-denied' ? (
                  <Lock className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                    {backendError.kind === 'offline'
                      ? 'Network Offline'
                      : backendError.kind === 'permission-denied'
                      ? 'Access Restricted'
                      : 'Authentication / Sync Notice'}
                  </p>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    {backendError.message}
                  </p>
                </div>
              </div>
              <button
                onClick={onRetrySync}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-[11px] font-bold flex items-center gap-1 hover:bg-rose-100 shrink-0"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          </div>
        )}

        {/* First-time profile completion banner if signed in without a saved profile */}
        {isAuthenticated && !authLoading && !currentUser && (
          <div className="mx-5 mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex items-center justify-between gap-2">
            <div className="text-xs">
              <strong className="block font-extrabold">Complete First-Time Profile</strong>
              <span>Finish setting up your Bapatla name, phone, and locality.</span>
            </div>
            <button
              onClick={() => onOpenAuthModal('REGISTER')}
              className="px-3 py-1.5 rounded-xl bg-[#087F78] text-white text-xs font-bold shrink-0"
            >
              Setup Now
            </button>
          </div>
        )}

        {/* TAB 1: CUSTOMER HOME SCREEN — MATCHING EMERGENT REFERENCE */}
        {activeBottomTab === 'HOME' && (
          <div className="px-5 pt-4 pb-6 space-y-4">
            {/* 1. Header */}
            <header className="flex items-center justify-between py-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#087F78] flex items-center justify-center shadow-sm">
                  <Wrench className="w-5 h-5 text-white stroke-[2.2]" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[22px] font-extrabold tracking-tight text-[#10213A]">
                    {lang === 'en' ? 'Mana' : 'మన'}
                  </span>
                  <span className="text-[22px] font-extrabold tracking-tight text-[#087F78]">
                    {lang === 'en' ? 'Experts' : 'ఎక్స్‌పర్ట్స్'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!authLoading && !isAuthenticated && (
                  <button
                    onClick={() => onOpenAuthModal('SIGN_IN')}
                    className="px-3 py-2 rounded-full bg-[#087F78] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#066660] transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    {lang === 'en' ? 'Sign In' : 'సైన్ ఇన్'}
                  </button>
                )}
                {!authLoading && isAuthenticated && currentUser && (
                  <button
                    onClick={() => setActiveBottomTab('PROFILE')}
                    className="px-2.5 py-1.5 rounded-full bg-[#E8F7F4] border border-[#D0EFEA] text-[#087F78] text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#087F78] text-white text-[11px] flex items-center justify-center">
                      {currentUser.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[80px] truncate">{currentUser.name.split(' ')[0]}</span>
                  </button>
                )}
                <button
                  onClick={onOpenNotifications}
                  aria-label="Notifications"
                  className="relative w-10 h-10 rounded-full flex items-center justify-center text-[#334155] hover:bg-slate-200/60 transition"
                >
                  <Bell className="w-5 h-5 stroke-[2]" />
                  {unreadNotifCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#F97316] ring-2 ring-[#FAF9F6]" />
                  )}
                </button>
              </div>
            </header>

            {/* 2. Location Selector */}
            <button
              type="button"
              onClick={() => setIsLocationSheetOpen(true)}
              className="w-full bg-white rounded-2xl px-4 py-3.5 border border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.03)] flex items-center justify-between hover:border-teal-600/40 transition"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-[#087F78] stroke-[2.2]" />
                <span className="text-[15px] font-semibold text-[#1E293B]">
                  {displayLocationLabel}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* 3. Search Bar */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search for a service...'
                    : 'సేవ కోసం వెతకండి (ఉదా: ఎలక్ట్రీషియన్, ప్లంబర్)...'
                }
                className="w-full pl-12 pr-9 py-3.5 bg-white rounded-full border border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.03)] text-[15px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#087F78]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 4. Promotional Hero Banner */}
            <div className="relative rounded-[24px] overflow-hidden shadow-[0_8px_24px_rgba(8,127,120,0.16)] bg-[#087F78] min-h-[156px] flex items-center">
              <img
                src="/images/services/hero_technician_banner.jpg"
                alt="Mana Experts technician visiting a family home in Bapatla"
                className="absolute inset-0 w-full h-full object-cover object-right"
              />
              <div
                className="
                  relative z-10 w-full h-full py-6 px-5
                  bg-gradient-to-r from-[#066963] via-[#087F78]/92 to-transparent
                  flex flex-col justify-center
                "
              >
                <h2 className="text-white text-[21px] leading-[1.22] font-extrabold max-w-[225px] tracking-tight">
                  {lang === 'en'
                    ? 'Local Experts, At Your Doorstep'
                    : 'మీ ఇంటి వద్దకే మన బాపట్ల నిపుణులు'}
                </h2>
                <p className="text-teal-50/95 text-[13px] leading-[1.4] font-medium max-w-[225px] mt-2">
                  {lang === 'en'
                    ? 'Booking is 100% free. Pay by cash or UPI after work.'
                    : 'బుకింగ్ 100% ఉచితం. పని పూర్తయ్యాక నగదు లేదా UPI ద్వారా చెల్లించండి.'}
                </p>
              </div>
            </div>

            {/* 5. Trust Highlights Row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-[#E8F7F4] rounded-2xl py-2.5 px-2 flex items-center justify-center gap-1.5 border border-[#D0EFEA]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#087F78] shrink-0 stroke-[2.2]" />
                <span className="text-[11px] font-bold text-[#0F2942] whitespace-nowrap">
                  {lang === 'en' ? 'Verified Pros' : 'నిపుణులు'}
                </span>
              </div>
              <div className="bg-[#E8F7F4] rounded-2xl py-2.5 px-2 flex items-center justify-center gap-1.5 border border-[#D0EFEA]">
                <Clock className="w-3.5 h-3.5 text-[#087F78] shrink-0 stroke-[2.2]" />
                <span className="text-[11px] font-bold text-[#0F2942] whitespace-nowrap">
                  {lang === 'en' ? 'Quick Service' : 'వేగవంతమైన సేవ'}
                </span>
              </div>
              <div className="bg-[#E8F7F4] rounded-2xl py-2.5 px-2 flex items-center justify-center gap-1.5 border border-[#D0EFEA]">
                <Award className="w-3.5 h-3.5 text-[#087F78] shrink-0 stroke-[2.2]" />
                <span className="text-[11px] font-bold text-[#0F2942] whitespace-nowrap">
                  {lang === 'en' ? 'Fair Pricing' : 'సరసమైన ధరలు'}
                </span>
              </div>
            </div>

            {actionErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
                <span>{actionErrorMsg}</span>
                <button onClick={() => setActionErrorMsg(null)} className="text-rose-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 6. What do you need help with? — 2-Column Photographic Grid */}
            <section className="pt-2">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[19px] font-extrabold text-[#10213A] tracking-tight">
                  {lang === 'en'
                    ? 'What do you need help with?'
                    : 'మీకు ఏ సేవలో సహాయం కావాలి?'}
                </h2>
                {catalogLoading && (
                  <span className="text-xs font-semibold text-[#087F78] flex items-center gap-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Syncing...
                  </span>
                )}
              </div>

              {catalogLoading && filteredServices.length === 0 ? (
                <div className="grid grid-cols-2 gap-3.5">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-44 rounded-[20px] bg-slate-200/70 animate-pulse border border-slate-200"
                    />
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
                  <p className="text-sm font-bold text-slate-700">
                    {searchQuery.trim()
                      ? lang === 'en'
                        ? `No services matching "${searchQuery}"`
                        : `"${searchQuery}" కు సరిపోయే సేవలు లేవు`
                      : lang === 'en'
                      ? 'No service categories found in the shared Bapatla database.'
                      : 'ప్రస్తుతం సేవలు అందుబాటులో లేవు.'}
                  </p>
                  {searchQuery.trim() ? (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-[#087F78] underline"
                    >
                      {lang === 'en' ? 'Show all services' : 'అన్ని సేవలను చూడండి'}
                    </button>
                  ) : isAuthorizedAdmin && onSeedDefaultCatalog ? (
                    <button
                      onClick={handleSeedClick}
                      disabled={isSeedingCatalog}
                      className="px-4 py-2.5 rounded-xl bg-[#087F78] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm"
                    >
                      {isSeedingCatalog && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Initialize Default Bapatla Service Catalog
                    </button>
                  ) : (
                    <button
                      onClick={onRetrySync}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh Service Catalog
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5">
                  {filteredServices.map((srv) => {
                    const isDisabled = !srv.enabled;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => handleOpenBookingModal(srv)}
                        className={`group bg-white rounded-[20px] overflow-hidden border text-left flex flex-col transition-all duration-200 ${
                          isDisabled
                            ? 'border-slate-200 opacity-65 cursor-not-allowed'
                            : 'border-slate-200/80 shadow-[0_4px_14px_rgba(15,23,42,0.05)] hover:shadow-[0_8px_22px_rgba(8,127,120,0.14)] active:scale-[0.98]'
                        }`}
                      >
                        <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-slate-100">
                          <img
                            src={srv.imageUrl}
                            alt={srv.nameEn}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-300 ${
                              isDisabled ? 'grayscale' : 'group-hover:scale-105'
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                          {isDisabled && (
                            <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-600/95 text-white text-[10px] font-extrabold uppercase tracking-wider">
                              {lang === 'en' ? 'Disabled' : 'నిలిపివేయబడింది'}
                            </span>
                          )}
                          <span className="absolute bottom-2.5 left-3 right-3 text-white font-bold text-[15px] leading-snug drop-shadow-xs">
                            {lang === 'en' ? srv.nameEn : srv.nameTe}
                          </span>
                        </div>
                        <div className="px-3 py-2.5 flex items-center justify-between bg-white">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {lang === 'en'
                              ? `Visit ₹${srv.baseInspectionFee}`
                              : `విజిట్ ₹${srv.baseInspectionFee}`}
                          </span>
                          {isDisabled ? (
                            <span className="text-[11px] font-bold text-rose-600">
                              {lang === 'en' ? 'Unavailable' : 'అందుబాటులో లేదు'}
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold text-[#087F78] flex items-center gap-1">
                              {lang === 'en' ? 'Book Free' : 'ఉచిత బుకింగ్'} →
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: MY BOOKINGS SCREEN */}
        {activeBottomTab === 'BOOKINGS' && (
          <div className="px-5 pt-5 pb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-extrabold text-[#10213A]">
                  {t.myBookings}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {lang === 'en'
                    ? 'Track your doorstep service visits in Bapatla'
                    : 'బాపట్లలో మీ సర్వీస్ బుకింగ్‌ల వివరాలు'}
                </p>
              </div>
              <div className="flex bg-slate-200/80 p-1 rounded-xl">
                <button
                  onClick={() => setBookingFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    bookingFilter === 'ACTIVE'
                      ? 'bg-white text-[#087F78] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {t.activeBookings}
                </button>
                <button
                  onClick={() => setBookingFilter('HISTORY')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    bookingFilter === 'HISTORY'
                      ? 'bg-white text-[#087F78] shadow-xs'
                      : 'text-slate-600'
                  }`}
                >
                  {t.completedHistory}
                </button>
              </div>
            </div>

            {actionErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
                <span>{actionErrorMsg}</span>
                <button onClick={() => setActionErrorMsg(null)} className="text-rose-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {!isAuthenticated ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F7F4] text-[#087F78] flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-slate-800">
                  {lang === 'en'
                    ? 'Sign in to view your Bapatla bookings'
                    : 'మీ బుకింగ్‌లను చూడటానికి సైన్ ఇన్ చేయండి'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {lang === 'en'
                    ? 'Your real-time booking status and assigned technician contact details appear here once you sign in.'
                    : 'మీరు సైన్ ఇన్ చేసిన తర్వాత మీ బుకింగ్ వివరాలు ఇక్కడ కనిపిస్తాయి.'}
                </p>
                <button
                  onClick={() => onOpenAuthModal('SIGN_IN')}
                  className="px-5 py-2.5 bg-[#087F78] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {lang === 'en' ? 'Sign In' : 'సైన్ ఇన్'}
                </button>
              </div>
            ) : bookingsLoading ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
                <Loader2 className="w-7 h-7 text-[#087F78] animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-600">
                  Loading your bookings from Cloud Firestore...
                </p>
              </div>
            ) : customerBookings.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">{t.noBookingsYet}</p>
                <button
                  onClick={() => setActiveBottomTab('HOME')}
                  className="mt-3 px-4 py-2 bg-[#087F78] text-white text-xs font-bold rounded-xl"
                >
                  {lang === 'en' ? 'Browse Services' : 'సేవలను చూడండి'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customerBookings.map((bk) => {
                  const priv = privateDetailsMap[bk.id];
                  const protectedPhoto = protectedPhotosMap[bk.id];
                  const permittedTech = extractPermittedTechnicianContact(bk, technicians);
                  const savedReview = reviews.find(
                    (r) => r.bookingId === bk.id || r.id === `rev_${bk.id}`
                  );
                  const isBusy = actionLoadingId === bk.id;

                  return (
                    <div
                      key={bk.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-[#087F78] uppercase tracking-wider">
                            #{bk.id.slice(-6).toUpperCase()} • {bk.generalArea}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-900">
                            {lang === 'en' ? bk.serviceNameEn : bk.serviceNameTe}
                          </h3>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                            bk.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800'
                              : bk.status === 'ACCEPTED' || bk.status === 'IN_PROGRESS'
                              ? 'bg-teal-100 text-teal-800'
                              : bk.status === 'WORK_COMPLETED'
                              ? 'bg-blue-100 text-blue-800'
                              : bk.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t[`status_${bk.status}` as keyof typeof t] || bk.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        {bk.problemDescription}
                      </p>

                      {bk.photoNote && (
                        <div className="px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-[#087F78] shrink-0" />
                          <span>
                            <strong>Appliance / Equipment Note (Text):</strong> {bk.photoNote}
                          </span>
                        </div>
                      )}

                      {bk.hasUploadedPhoto && (
                        <div className="p-2.5 rounded-xl bg-[#E8F7F4]/60 border border-[#D0EFEA] space-y-1.5">
                          <span className="text-[10px] font-extrabold uppercase text-[#087F78] flex items-center gap-1">
                            <Camera className="w-3 h-3" />
                            Protected Problem Photo Attachment
                          </span>
                          {protectedPhoto ? (
                            <div className="flex items-center gap-2.5">
                              <img
                                src={protectedPhoto.dataUrl}
                                alt={protectedPhoto.fileName}
                                className="w-16 h-16 rounded-lg object-cover border border-teal-200"
                              />
                              <div className="text-[11px] text-slate-600">
                                <p className="font-bold text-slate-800 truncate max-w-[190px]">
                                  {protectedPhoto.fileName}
                                </p>
                                <p>
                                  {Math.round(protectedPhoto.sizeBytes / 1024)} KB •{' '}
                                  {protectedPhoto.width}×{protectedPhoto.height}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-500">
                              Loading protected photo from Firestore...
                            </p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#087F78]" />
                          {bk.preferredDate} • {bk.preferredTimeSlot}
                        </span>
                        {priv && (
                          <span className="flex items-center gap-1 text-slate-600 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-[#087F78]" />
                            {priv.fullAddress}
                          </span>
                        )}
                      </div>

                      {/* Permitted Technician Contact Info (Item 6) */}
                      {permittedTech && (
                        <div className="p-3 rounded-xl bg-[#E8F7F4] border border-[#D0EFEA] flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-[#087F78] block">
                              Assigned Local Expert{permittedTech.area ? ` • ${permittedTech.area}` : ''}
                            </span>
                            <span className="text-sm font-extrabold text-slate-900">
                              {permittedTech.name}
                            </span>
                            <span className="text-xs text-slate-600 block">
                              Phone: +91 {permittedTech.phone}
                              {(permittedTech.experienceYears || 0) > 0 &&
                                ` • ${permittedTech.experienceYears} yrs exp`}
                            </span>
                          </div>
                          {permittedTech.phone && (
                            <a
                              href={`tel:${permittedTech.phone}`}
                              className="px-3 py-2 rounded-xl bg-[#087F78] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-[#066660]"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                              Call
                            </a>
                          )}
                        </div>
                      )}

                      {/* Technician-Submitted Labour Charges & Explicit Separation of Work Confirmed vs Payment Received (Item 8) */}
                      {bk.labourCharges > 0 && (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/90 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-amber-950">
                              Technician Submitted Labour Charges:
                            </span>
                            <span className="text-sm font-extrabold text-amber-950">
                              ₹{bk.labourCharges}
                            </span>
                          </div>
                          <p className="text-[11px] text-amber-900 leading-relaxed flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <span>
                              <strong>Work Confirmation vs Payment:</strong> Confirming work completion records that the repair job is finished. Doorstep payment (₹{bk.labourCharges} by Cash or direct UPI to the technician) is settled directly offline and is <strong>not processed or verified by this app</strong>.
                            </span>
                          </p>
                        </div>
                      )}

                      {/* Saved Customer Review (Item 9) */}
                      {(bk.rated || savedReview) && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-extrabold uppercase text-amber-900">
                              Your Verified Review
                            </span>
                            {savedReview && (
                              <span className="inline-flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((st) => (
                                  <Star
                                    key={st}
                                    className={`w-3 h-3 ${
                                      st <= savedReview.rating
                                        ? 'fill-amber-400 text-amber-500'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </span>
                            )}
                          </div>
                          {savedReview && (
                            <p className="text-xs text-slate-700 italic">"{savedReview.comment}"</p>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        {bk.status === 'PENDING' && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleCancelClick(bk.id)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                          >
                            {isBusy ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {t.cancelBooking}
                          </button>
                        )}

                        {bk.status === 'WORK_COMPLETED' && bk.labourCharges > 0 && (
                          <button
                            disabled={isBusy}
                            onClick={() => handleConfirmClick(bk.id)}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                          >
                            {isBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                            {t.confirmJobDone} (₹{bk.labourCharges})
                          </button>
                        )}

                        {bk.status === 'CONFIRMED' && !bk.rated && !savedReview && (
                          <button
                            onClick={() => handleOpenReviewModal(bk)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1"
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            {t.rateTechnician}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & LANGUAGE / ROLE SETTINGS */}
        {activeBottomTab === 'PROFILE' && (
          <div className="px-5 pt-5 pb-8 space-y-4">
            <h1 className="text-xl font-extrabold text-[#10213A]">
              {lang === 'en' ? 'Account & Preferences' : 'ఖాతా & సెట్టింగ్‌లు'}
            </h1>

            {actionErrorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-between">
                <span>{actionErrorMsg}</span>
                <button onClick={() => setActionErrorMsg(null)} className="text-rose-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* User Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
              {authLoading ? (
                <div className="flex items-center gap-3 py-2">
                  <Loader2 className="w-6 h-6 text-[#087F78] animate-spin" />
                  <span className="text-xs font-bold text-slate-600">
                    Restoring your Mana Experts account...
                  </span>
                </div>
              ) : isAuthenticated && currentUser ? (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#E8F7F4] text-[#087F78] flex items-center justify-center font-extrabold text-lg shrink-0">
                        {currentUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F78] block">
                          Saved {currentUser.role} Profile • UID: {currentUser.uid.slice(0, 10)}...
                        </span>
                        <h2 className="text-base font-extrabold text-[#10213A]">
                          {currentUser.name}
                        </h2>
                        <p className="text-xs text-slate-500">
                          {firebaseUserEmail} • {currentUser.area}
                        </p>
                        {currentUserContact?.phone && (
                          <p className="text-[11px] text-slate-600">
                            Phone: <strong>+91 {currentUserContact.phone}</strong>{' '}
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              {currentUser.phoneVerified ? 'Verified' : 'Unverified (No SMS OTP)'}
                            </span>
                          </p>
                        )}
                        {currentUserContact?.defaultAddress && (
                          <p className="text-[11px] text-slate-500">
                            Address: {currentUserContact.defaultAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                      onClick={() => onOpenAuthModal('EDIT_PROFILE')}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Edit Profile' : 'ప్రొఫైల్ మార్చండి'}
                    </button>
                    <button
                      onClick={onSignOut}
                      className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {lang === 'en' ? 'Sign Out' : 'సైన్ అవుట్'}
                    </button>
                  </div>
                </>
              ) : isAuthenticated && !currentUser ? (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                    Signed in as <strong>{firebaseUserEmail || firebaseUserUid}</strong>. Complete your first-time Bapatla profile registration to book services or register as a Technician.
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => onOpenAuthModal('REGISTER')}
                      className="py-2.5 px-3 rounded-xl bg-[#087F78] text-white font-bold text-xs transition"
                    >
                      Complete Profile
                    </button>
                    <button
                      onClick={onSignOut}
                      className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                      <UserIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-extrabold text-[#10213A]">
                        {lang === 'en' ? 'Not Signed In' : 'సైన్ ఇన్ చేయలేదు'}
                      </h2>
                      <p className="text-xs text-slate-500">
                        {lang === 'en'
                          ? 'Sign in with Email & Password or Google to access your saved Bapatla account.'
                          : 'మీ ఖాతాను తెరవడానికి ఇమెయిల్ లేదా గూగుల్‌తో సైన్ ఇన్ చేయండి.'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenAuthModal('SIGN_IN')}
                    className="w-full py-3 rounded-xl bg-[#087F78] hover:bg-[#066660] text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    {lang === 'en'
                      ? 'Sign In / Create Account'
                      : 'సైన్ ఇన్ / కొత్త ఖాతా'}
                  </button>
                </div>
              )}
            </div>

            {/* First-Admin Server Bootstrap Card */}
            {canBootstrapFirstAdmin && !isAuthorizedAdmin && (
              <div className="bg-amber-50 rounded-3xl p-4 border border-amber-300 shadow-xs space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                      Trusted First-Admin Provisioning Available
                    </h3>
                    <p className="text-xs text-amber-900 mt-0.5">
                      Your verified owner account is eligible to initialize `/admins/{firebaseUserUid}` in Cloud Firestore to unlock server-verified Admin governance.
                    </p>
                  </div>
                </div>
                <button
                  disabled={isBootstrappingAdmin}
                  onClick={handleBootstrapAdminClick}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-2"
                >
                  {isBootstrappingAdmin && <Loader2 className="w-4 h-4 animate-spin" />}
                  Provision My Server Admin Record (/admins/{firebaseUserUid?.slice(0, 8)}...)
                </button>
              </div>
            )}

            {/* Bilingual Language Switcher (English / Telugu) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E8F7F4] text-[#087F78] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#10213A]">
                    {lang === 'en' ? 'App Language / భాష' : 'యాప్ భాష / Language'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {lang === 'en' ? 'English & తెలుగు (Telugu)' : 'తెలుగు & English'}
                  </p>
                </div>
              </div>
              <button
                onClick={onToggleLang}
                className="px-4 py-2 rounded-xl bg-[#087F78] text-white text-xs font-extrabold shadow-xs"
              >
                {lang === 'en' ? 'తెలుగులో చూడండి' : 'Switch to English'}
              </button>
            </div>

            {/* Workspace Navigation Strictly Scoped to Saved Authorized Roles */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#10213A]">
                  {lang === 'en'
                    ? 'Authorized Account Workspaces'
                    : 'మీ ఖాతా విభాగాలు'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'en'
                    ? 'Workspaces are restricted to the saved roles on your authenticated Firebase UID.'
                    : 'మీ ఖాతా పాత్ర ఆధారంగా అనుమతించబడిన విభాగాలు'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSwitchRole('CUSTOMER')}
                  className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition ${
                    currentRole === 'CUSTOMER'
                      ? 'bg-[#087F78] text-white border-[#087F78]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {t.roleCustomer}
                </button>

                {authorizedRoles.includes('TECHNICIAN') ? (
                  <button
                    onClick={() => onSwitchRole('TECHNICIAN')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition ${
                      currentRole === 'TECHNICIAN'
                        ? 'bg-[#087F78] text-white border-[#087F78]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t.roleTechnician}
                  </button>
                ) : (
                  <div className="py-2.5 px-2 rounded-xl text-[11px] font-bold border border-slate-100 bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Tech Role Only
                  </div>
                )}

                {authorizedRoles.includes('ADMIN') ? (
                  <button
                    onClick={() => onSwitchRole('ADMIN')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-extrabold border transition ${
                      currentRole === 'ADMIN'
                        ? 'bg-[#087F78] text-white border-[#087F78]'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t.roleAdmin}
                  </button>
                ) : (
                  <div className="py-2.5 px-2 rounded-xl text-[11px] font-bold border border-slate-100 bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" />
                    Admin Only
                  </div>
                )}
              </div>
            </div>

            {/* Verified Local Experts Directory */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-xs space-y-3">
              <h3 className="text-sm font-extrabold text-[#10213A]">
                {t.topRatedExperts}
              </h3>
              {technicians.filter((tech) => tech.approvalStatus === 'APPROVED').length === 0 ? (
                <p className="text-xs text-slate-500 py-2">
                  {lang === 'en'
                    ? 'Approved Bapatla technicians will appear here once verified by Admin.'
                    : 'అడ్మిన్ ఆమోదించిన బాపట్ల నిపుణులు ఇక్కడ కనిపిస్తారు.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {technicians
                    .filter((tech) => tech.approvalStatus === 'APPROVED')
                    .map((tech) => (
                      <div
                        key={tech.uid}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
                      >
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900">{tech.name}</h4>
                          <p className="text-[11px] text-slate-500">
                            {tech.area} • {tech.experienceYears} yrs exp
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          {tech.ratingAvg > 0 ? tech.ratingAvg.toFixed(1) : 'New'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Bapatla Customer Helpdesk */}
            <div className="bg-[#E8F7F4] rounded-3xl p-4 border border-[#D0EFEA] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-[#087F78]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#10213A]">
                    Bapatla Customer Helpdesk
                  </h4>
                  <p className="text-[11px] text-slate-600">+91 8643-224488 (8 AM – 8 PM)</p>
                </div>
              </div>
              <a
                href="tel:+918643224488"
                className="px-3 py-1.5 rounded-xl bg-[#087F78] text-white text-xs font-bold"
              >
                Call
              </a>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(15,23,42,0.04)]">
        <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-around">
          <button
            type="button"
            onClick={() => setActiveBottomTab('HOME')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition ${
              activeBottomTab === 'HOME'
                ? 'text-[#087F78]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] font-bold">
              {lang === 'en' ? 'Home' : 'హోమ్'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('BOOKINGS')}
            className={`relative flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition ${
              activeBottomTab === 'BOOKINGS'
                ? 'text-[#087F78]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ClipboardList className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] font-bold">
              {lang === 'en' ? 'Bookings' : 'బుకింగ్స్'}
            </span>
            {ownedBookings.filter((b) =>
              ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(b.status)
            ).length > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-[#087F78]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveBottomTab('PROFILE')}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-4 rounded-xl transition ${
              activeBottomTab === 'PROFILE'
                ? 'text-[#087F78]'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <UserIcon className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[11px] font-bold">
              {lang === 'en' ? 'Profile' : 'ప్రొఫైల్'}
            </span>
          </button>
        </div>
      </nav>

      {/* LOCATION SELECTOR BOTTOM SHEET */}
      {isLocationSheetOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#087F78]" />
                <h3 className="text-base font-extrabold text-[#10213A]">
                  {lang === 'en'
                    ? 'Select Bapatla Locality'
                    : 'బాపట్ల ప్రాంతాన్ని ఎంచుకోండి'}
                </h3>
              </div>
              <button
                onClick={() => setIsLocationSheetOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {serviceAreas.length === 0 ? (
              <div className="py-6 text-center space-y-2">
                <p className="text-xs font-bold text-slate-600">
                  {catalogLoading
                    ? 'Loading Bapatla service areas from Cloud Firestore...'
                    : 'No active Bapatla service areas loaded from Cloud Firestore.'}
                </p>
                {!catalogLoading && (
                  <button
                    type="button"
                    onClick={onRetrySync}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Sync
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {serviceAreas.map((area) => {
                  const isSelected = area === selectedArea;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        onSelectArea(area);
                        setIsLocationSheetOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-2xl text-left text-sm font-bold flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-[#E8F7F4] text-[#087F78] border border-[#087F78]/30'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span>{area}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#087F78]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOOKING CREATION MODAL */}
      {selectedServiceForBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="bg-[#087F78] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-white text-[#087F78]">
                  {SERVICE_ICONS[selectedServiceForBooking.iconName] || (
                    <Wrench className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-100 block">
                    {t.freeBookingNotice}
                  </span>
                  <h3 className="text-base font-extrabold">
                    {lang === 'en'
                      ? selectedServiceForBooking.nameEn
                      : selectedServiceForBooking.nameTe}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedServiceForBooking(null)}
                disabled={isSubmittingBooking}
                className="text-xs font-bold bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {!isAuthenticated || !currentUser ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F7F4] text-[#087F78] flex items-center justify-center mx-auto">
                  <LogIn className="w-6 h-6" />
                </div>
                <h4 className="text-base font-extrabold text-[#10213A]">
                  {!isAuthenticated
                    ? lang === 'en'
                      ? 'Sign In Required to Book a Service'
                      : 'సర్వీస్ బుక్ చేయడానికి సైన్ ఇన్ అవసరం'
                    : 'Complete Your Profile to Book'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'en'
                    ? 'To protect customer and technician safety in Bapatla, all bookings are linked to your authenticated Firebase UID and stored in Cloud Firestore.'
                    : 'బాపట్లలో భద్రత కోసం ప్రతి బుకింగ్ మీ ఖాతాతో అనుసంధానించబడుతుంది.'}
                </p>
                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedServiceForBooking(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedServiceForBooking(null);
                      onOpenAuthModal(isAuthenticated ? 'REGISTER' : 'SIGN_IN');
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-[#087F78] text-white text-xs font-extrabold"
                  >
                    {isAuthenticated ? 'Complete Profile' : 'Sign In'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="p-5 overflow-y-auto space-y-3.5">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                    {formError}
                  </div>
                )}

                <div className="p-3 rounded-2xl bg-[#E8F7F4] border border-[#D0EFEA] text-[11px] text-[#0F2942] flex items-start gap-2">
                  <Shield className="w-4 h-4 text-[#087F78] shrink-0 mt-0.5" />
                  <span>
                    <strong>Privacy Protection:</strong> Your exact house door number, mobile number, and problem photo remain locked in private Firestore subcollections until a verified Bapatla technician accepts your job.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Bapatla Area / Locality *
                    </label>
                    <select
                      value={bookingLocality}
                      onChange={(e) => setBookingLocality(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold"
                    >
                      {serviceAreas.map((area) => (
                        <option key={area} value={area}>
                          {area}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.fullAddressLabel} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullAddress}
                    onChange={(e) => setFullAddress(e.target.value)}
                    placeholder="e.g., D.No 7-42, Near Municipal High School, Railpet"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.landmarkLabel}
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g., Opposite SBI ATM"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ward / Village Name
                    </label>
                    <input
                      type="text"
                      value={villageOrWard}
                      onChange={(e) => setVillageOrWard(e.target.value)}
                      placeholder="e.g., Ward 12 / Jammulapalem"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.problemDescLabel} *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder={t.problemDescPlaceholder}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.preferredDateLabel} *
                    </label>
                    <input
                      type="date"
                      min={todayDateStr}
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {t.preferredTimeLabel} *
                    </label>
                    <select
                      value={preferredTimeSlot}
                      onChange={(e) => setPreferredTimeSlot(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      {VALID_BOOKING_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Actual Optional Photo Selection/Upload with Protected Storage, Progress, and Retry (Item 5) */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#087F78]" />
                      {t.photoUploadLabel}
                    </label>
                    <span className="text-[10px] font-semibold text-slate-500">
                      JPEG / PNG / WEBP • Max 5 MB
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoFileChange}
                    className="hidden"
                  />

                  {photoUploadState === 'IDLE' && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#087F78]/50 bg-white hover:bg-[#E8F7F4]/50 text-[#087F78] text-xs font-bold flex items-center justify-center gap-2 transition"
                    >
                      <UploadCloud className="w-4 h-4" />
                      {lang === 'en'
                        ? 'Select & Upload Problem Photo (Optional)'
                        : 'సమస్య ఫోటోను ఎంచుకోండి (ఐచ్ఛికం)'}
                    </button>
                  )}

                  {photoUploadState === 'UPLOADING' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#087F78]">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Uploading to protected Firestore storage...
                        </span>
                        <span>{photoUploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-[#087F78] transition-all duration-200"
                          style={{ width: `${photoUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {photoUploadState === 'UPLOADED' && uploadedProtectedPhoto && (
                    <div className="p-2.5 rounded-xl bg-white border border-teal-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={uploadedProtectedPhoto.dataUrl}
                          alt={uploadedProtectedPhoto.fileName}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">
                            ✓ Saved in Protected Storage
                          </span>
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {uploadedProtectedPhoto.fileName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {Math.round(uploadedProtectedPhoto.sizeBytes / 1024)} KB •{' '}
                            {uploadedProtectedPhoto.width}×{uploadedProtectedPhoto.height}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveSelectedPhoto}
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold flex items-center gap-1 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  )}

                  {photoUploadState === 'ERROR' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                      <p className="text-[11px] font-bold text-rose-700">
                        {photoUploadError || 'Photo upload failed.'}
                      </p>
                      <div className="flex items-center gap-2">
                        {pendingPhotoFile && (
                          <button
                            type="button"
                            onClick={handleRetryPhotoUpload}
                            className="px-2.5 py-1 rounded-lg bg-[#087F78] text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            Retry Upload
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveSelectedPhoto}
                          className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-[11px] font-bold"
                        >
                          Remove / Choose Another
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Text-only appliance/equipment note — never labeled as an uploaded image */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-[#087F78]" />
                    {t.photoNoteLabel}
                  </label>
                  <input
                    type="text"
                    value={photoNote}
                    onChange={(e) => setPhotoNote(e.target.value)}
                    placeholder="e.g., 1.5 Ton LG Split AC indoor unit model number"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingBooking || photoUploadState === 'UPLOADING'}
                  className="w-full py-3.5 bg-[#087F78] hover:bg-[#066660] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {isSubmittingBooking && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmittingBooking ? 'Awaiting Firestore Server Confirmation...' : t.submitFreeBooking}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SERVER-ACKNOWLEDGED BOOKING CONFIRMATION MODAL (Shown ONLY after Firestore transaction succeeds) */}
      {acknowledgedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#087F78] block">
                Cloud Firestore Server Acknowledged
              </span>
              <h3 className="text-lg font-extrabold text-[#10213A] mt-0.5">
                {lang === 'en' ? 'Booking Confirmed!' : 'బుకింగ్ నిర్ధారించబడింది!'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Booking ID:{' '}
                <strong className="text-slate-900">
                  #{acknowledgedBooking.id.slice(-6).toUpperCase()}
                </strong>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Service:</span>
                <span className="font-extrabold text-slate-900">
                  {lang === 'en'
                    ? acknowledgedBooking.serviceNameEn
                    : acknowledgedBooking.serviceNameTe}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Locality:</span>
                <span className="font-bold text-slate-800">{acknowledgedBooking.generalArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-800">
                  {acknowledgedBooking.preferredDate} • {acknowledgedBooking.preferredTimeSlot}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Protected Photo:</span>
                <span className="font-bold text-slate-800">
                  {acknowledgedBooking.hasUploadedPhoto ? 'Attached (Locked)' : 'None'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAcknowledgedBooking(null);
                setActiveBottomTab('BOOKINGS');
                setBookingFilter('ACTIVE');
              }}
              className="w-full py-3 rounded-2xl bg-[#087F78] hover:bg-[#066660] text-white text-xs font-extrabold shadow-sm"
            >
              {lang === 'en' ? 'View in My Bookings' : 'నా బుకింగ్స్‌లో చూడండి'}
            </button>
          </div>
        </div>
      )}

      {/* RATING MODAL (Item 9 — requires explicit star selection & comment; never auto-generates positive review) */}
      {ratingBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleReviewSubmit}
            className="bg-white w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                {t.rateTechnician}: {ratingBooking.technicianName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a star rating (1 to 5) and share your genuine feedback.
              </p>
            </div>

            {reviewFormError && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {reviewFormError}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingStars
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              required
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Write your honest feedback about the technician's work..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={() => setRatingBooking(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#087F78] text-white flex items-center gap-1.5"
              >
                {isSubmittingReview && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Submit Review
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
