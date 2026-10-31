import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  Coins,
  PlusCircle,
  Ban,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Wrench,
  Power,
  IndianRupee,
  ArrowLeft,
  Loader2,
  Lock,
  RefreshCw,
  LogOut,
  KeyRound,
  Database,
  ArrowRight,
  MapPin,
  FileCheck2,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Edit3,
  Phone,
  Eye,
  Calendar,
  Info,
} from 'lucide-react';
import {
  TechnicianProfile,
  Booking,
  BookingPrivateDetails,
  BookingProtectedPhoto,
  ServiceCategory,
  CoinTransaction,
  BookingCompletionRecord,
  AdminAuditRecord,
  Language,
  AdminRecord,
  UserProfile,
  UserPrivateContact,
  BookingStatus,
  ApprovalStatus,
  AdminReportDatePreset,
  detectLegacyNonUidRecords,
  queryAdminCustomerDirectory,
  queryAdminTechnicianDirectory,
  filterAdminBookingsWithPrivateAccess,
  buildAdminPersistentReport,
} from '../domain/manaRules';
import { translations } from '../domain/i18n';

interface AdminViewProps {
  lang: Language;
  isAuthorizedAdmin: boolean;
  canBootstrapFirstAdmin: boolean;
  onBootstrapFirstAdmin: () => Promise<{ success: boolean; error?: string }>;
  authLoading: boolean;
  backendError: { kind: string; message: string } | null;
  onRetrySync: () => void;
  onSignOut: () => Promise<void>;
  onBackToCustomerView: () => void;
  adminRoster: AdminRecord[];
  allUsers: UserProfile[];
  customerContactsMap?: Record<string, UserPrivateContact>;
  onUnlockCustomerContact?: (
    customerUid: string
  ) => Promise<{ success: boolean; contact?: UserPrivateContact; error?: string }>;
  technicians: TechnicianProfile[];
  bookings: Booking[];
  privateDetailsMap?: Record<string, BookingPrivateDetails>;
  protectedPhotosMap?: Record<string, BookingProtectedPhoto>;
  onUnlockBookingDetails?: (bookingId: string) => Promise<void>;
  services: ServiceCategory[];
  serviceAreas: string[];
  coinTransactions: CoinTransaction[];
  completionRecords: BookingCompletionRecord[];
  adminAuditLogs: AdminAuditRecord[];
  onApproveTechnician: (
    techUid: string
  ) => Promise<{ success: boolean; trialCoinsGrantedNow?: boolean; error?: string }>;
  onRejectTechnician?: (techUid: string) => Promise<{ success: boolean; error?: string }>;
  onSuspendTechnician: (techUid: string) => Promise<{ success: boolean; error?: string }>;
  onAdjustCoins: (
    techUid: string,
    delta: number,
    reason: 'ADMIN_RECHARGE' | 'ADMIN_DEDUCTION',
    reasonNote?: string
  ) => Promise<{ success: boolean; error?: string }>;
  onToggleServiceCategory: (serviceId: string) => Promise<{ success: boolean; error?: string }>;
  onAddServiceCategory: (srv: {
    nameEn: string;
    nameTe: string;
    descriptionEn: string;
    baseInspectionFee: number;
  }) => Promise<{ success: boolean; error?: string }>;
  onUpdateServiceCategory?: (srv: {
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
  }) => Promise<{ success: boolean; error?: string }>;
  onReorderServiceCategory?: (
    serviceId: string,
    direction: 'UP' | 'DOWN'
  ) => Promise<{ success: boolean; error?: string }>;
  onUpdateServiceAreas: (areas: string[]) => Promise<{ success: boolean; error?: string }>;
  onSeedDefaultCatalog: () => Promise<{ success: boolean; error?: string }>;
  onProvisionAdmin: (
    targetUid: string,
    targetEmail: string
  ) => Promise<{ success: boolean; error?: string }>;
  onMigrateLegacyIdentity: (
    legacyId: string,
    targetFirebaseUid: string
  ) => Promise<{ success: boolean; summary?: string; error?: string }>;
}

export const AdminView: React.FC<AdminViewProps> = ({
  lang,
  isAuthorizedAdmin,
  canBootstrapFirstAdmin,
  onBootstrapFirstAdmin,
  authLoading,
  backendError,
  onRetrySync,
  onSignOut,
  onBackToCustomerView,
  adminRoster,
  allUsers,
  customerContactsMap = {},
  onUnlockCustomerContact,
  technicians,
  bookings,
  privateDetailsMap = {},
  protectedPhotosMap = {},
  onUnlockBookingDetails,
  services,
  serviceAreas,
  coinTransactions,
  completionRecords,
  adminAuditLogs,
  onApproveTechnician,
  onRejectTechnician,
  onSuspendTechnician,
  onAdjustCoins,
  onToggleServiceCategory,
  onAddServiceCategory,
  onUpdateServiceCategory,
  onReorderServiceCategory,
  onUpdateServiceAreas,
  onSeedDefaultCatalog,
  onProvisionAdmin,
  onMigrateLegacyIdentity,
}) => {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState<
    'TECHNICIANS' | 'BOOKINGS' | 'SERVICES' | 'LEDGER' | 'GOVERNANCE'
  >('TECHNICIANS');

  // Directory Sub-mode, Search, Filters & Pagination
  const [directorySubView, setDirectorySubView] = useState<'TECHNICIANS' | 'CUSTOMERS'>(
    'TECHNICIANS'
  );
  const [techSearchQuery, setTechSearchQuery] = useState('');
  const [techStatusFilter, setTechStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [techAreaFilter, setTechAreaFilter] = useState<string>('ALL');
  const [techPage, setTechPage] = useState(1);

  const [custSearchQuery, setCustSearchQuery] = useState('');
  const [custAreaFilter, setCustAreaFilter] = useState<string>('ALL');
  const [custPage, setCustPage] = useState(1);

  // Coin Adjustment Inputs (Delta & Reason Note)
  const [coinDeltaInputs, setCoinDeltaInputs] = useState<Record<string, string>>({});
  const [coinReasonNoteInputs, setCoinReasonNoteInputs] = useState<Record<string, string>>({});

  // Bookings Filters
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | BookingStatus>('ALL');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');

  // Service Editing State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editSrvNameEn, setEditSrvNameEn] = useState('');
  const [editSrvNameTe, setEditSrvNameTe] = useState('');
  const [editSrvDescEn, setEditSrvDescEn] = useState('');
  const [editSrvFee, setEditSrvFee] = useState(100);
  const [editSrvOrder, setEditSrvOrder] = useState(1);

  // Persistent Report Date Range State
  const [reportRangePreset, setReportRangePreset] =
    useState<AdminReportDatePreset>('ALL_TIME');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [adminToast, setAdminToast] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  // New Service Form
  const [newSrvNameEn, setNewSrvNameEn] = useState('');
  const [newSrvNameTe, setNewSrvNameTe] = useState('');
  const [newSrvDescEn, setNewSrvDescEn] = useState('');
  const [newSrvFee, setNewSrvFee] = useState(100);

  // New Active Service Area Form
  const [newAreaName, setNewAreaName] = useState('');

  // New Admin Provisioning Form
  const [newAdminUid, setNewAdminUid] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  // Explicit Legacy Identity Migration Form
  const [selectedLegacyId, setSelectedLegacyId] = useState('');
  const [targetMigrationUid, setTargetMigrationUid] = useState('');

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-8 h-8 text-teal-700 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">
          Verifying server-side Admin authorization...
        </p>
      </div>
    );
  }

  if (!isAuthorizedAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 space-y-4">
        <button
          onClick={onBackToCustomerView}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Home
        </button>
        <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-base font-extrabold text-slate-900">
            Trusted Server-Side Admin Authorization Required
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Access to the Admin console requires a verified record in{' '}
            <code>/admins/&#123;uid&#125;</code> in Cloud Firestore or a server-signed{' '}
            <code>admin: true</code> custom token claim. Hard-coded email identity alone does not
            grant Admin access.
          </p>
          {canBootstrapFirstAdmin && (
            <button
              disabled={busyId === 'bootstrap_admin'}
              onClick={async () => {
                setBusyId('bootstrap_admin');
                await onBootstrapFirstAdmin();
                setBusyId(null);
              }}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold flex items-center justify-center gap-2"
            >
              {busyId === 'bootstrap_admin' && <Loader2 className="w-4 h-4 animate-spin" />}
              Provision First-Admin Record in Firestore Now
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeAdminUid = adminRoster[0]?.uid || 'verified_admin_session';

  // Persistent Report Summary (All-time & Selected Date Range)
  const persistentReport = buildAdminPersistentReport({
    actorUid: activeAdminUid,
    isServerVerifiedAdmin: isAuthorizedAdmin,
    bookings,
    completionRecords,
    coinTransactions,
    technicians,
    preset: reportRangePreset,
    customStartDate: customStartDate || undefined,
    customEndDate: customEndDate || undefined,
  });

  const pendingTechCount = technicians.filter((tech) => tech.approvalStatus === 'PENDING').length;

  // Paginated Technician Directory
  const techDirectoryPage = queryAdminTechnicianDirectory({
    actorUid: activeAdminUid,
    isServerVerifiedAdmin: isAuthorizedAdmin,
    technicians,
    searchQuery: techSearchQuery,
    statusFilter: techStatusFilter,
    areaFilter: techAreaFilter,
    page: techPage,
    pageSize: 6,
  });

  // Paginated Customer Directory with Admin-gated private contact access
  const custDirectoryPage = queryAdminCustomerDirectory({
    actorUid: activeAdminUid,
    isServerVerifiedAdmin: isAuthorizedAdmin,
    users: allUsers,
    privateContactsMap: customerContactsMap,
    bookings,
    searchQuery: custSearchQuery,
    areaFilter: custAreaFilter,
    roleFilter: 'ALL',
    page: custPage,
    pageSize: 6,
  });

  // Filtered Bookings with Permitted Private Doorstep Details
  const filteredAdminBookingsResult = filterAdminBookingsWithPrivateAccess({
    actorUid: activeAdminUid,
    isServerVerifiedAdmin: isAuthorizedAdmin,
    bookings,
    privateDetailsMap,
    protectedPhotosMap,
    statusFilter: bookingStatusFilter,
    searchQuery: bookingSearchQuery,
  });
  const filteredAdminBookings = filteredAdminBookingsResult.items;

  const legacyCandidates = detectLegacyNonUidRecords({
    users: allUsers,
    technicians,
    bookings,
  });

  const handleApproveClick = async (techUid: string) => {
    setBusyId(techUid);
    setAdminToast(null);
    try {
      const res = await onApproveTechnician(techUid);
      if (res.success) {
        setAdminToast({
          type: 'success',
          text:
            res.trialCoinsGrantedNow === false
              ? 'Technician status updated to APPROVED in Firestore (one-time +3 Trial Coins were already granted previously; 0 duplicate coins added).'
              : 'Technician approved in Firestore (with durable one-time +3 Trial Coins grant marker).',
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Failed to approve technician.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRejectClick = async (techUid: string) => {
    if (!onRejectTechnician) return;
    setBusyId(techUid);
    setAdminToast(null);
    try {
      const res = await onRejectTechnician(techUid);
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: 'Technician status updated to REJECTED in Firestore (availability forced offline).',
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Failed to reject technician.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSuspendClick = async (techUid: string) => {
    setBusyId(techUid);
    setAdminToast(null);
    try {
      const res = await onSuspendTechnician(techUid);
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: 'Technician status updated to SUSPENDED in Firestore (availability forced offline).',
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Failed to suspend technician.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCoinAdjustment = async (
    techUid: string,
    techName: string,
    mode: 'ADD' | 'DEDUCT'
  ) => {
    const raw = coinDeltaInputs[techUid] ?? '5';
    const val = Math.abs(parseInt(raw, 10));
    if (!Number.isFinite(val) || val <= 0) {
      setAdminToast({
        type: 'error',
        text: 'Invalid coin adjustment: enter a positive whole number of coins.',
      });
      return;
    }

    const delta = mode === 'ADD' ? val : -val;
    const reasonNote = (coinReasonNoteInputs[techUid] || '').trim();
    setBusyId(`coin_${techUid}`);
    setAdminToast(null);
    try {
      const res = await onAdjustCoins(
        techUid,
        delta,
        mode === 'ADD' ? 'ADMIN_RECHARGE' : 'ADMIN_DEDUCTION',
        reasonNote || undefined
      );
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: `${mode === 'ADD' ? 'Credited' : 'Deducted'} ${val} coins for ${techName} in Firestore (with immutable ledger & audit record).`,
        });
        setCoinReasonNoteInputs((prev) => ({ ...prev, [techUid]: '' }));
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Failed to adjust coins.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleUnlockCustomerContactClick = async (customerUid: string) => {
    if (!onUnlockCustomerContact) return;
    setBusyId(`contact_${customerUid}`);
    setAdminToast(null);
    try {
      const res = await onUnlockCustomerContact(customerUid);
      if (!res.success) {
        setAdminToast({
          type: 'error',
          text: res.error || 'Could not load private contact record.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleServiceClick = async (serviceId: string) => {
    setBusyId(serviceId);
    setAdminToast(null);
    try {
      const res = await onToggleServiceCategory(serviceId);
      if (!res.success) {
        setAdminToast({ type: 'error', text: res.error || 'Could not update service category.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleStartEditService = (srv: ServiceCategory) => {
    setEditingServiceId(srv.id);
    setEditSrvNameEn(srv.nameEn);
    setEditSrvNameTe(srv.nameTe);
    setEditSrvDescEn(srv.descriptionEn);
    setEditSrvFee(srv.baseInspectionFee);
    setEditSrvOrder(srv.sortOrder);
  };

  const handleSaveEditedService = async (srv: ServiceCategory) => {
    if (!onUpdateServiceCategory) return;
    setBusyId(`edit_${srv.id}`);
    setAdminToast(null);
    try {
      const res = await onUpdateServiceCategory({
        id: srv.id,
        nameEn: editSrvNameEn.trim(),
        nameTe: editSrvNameTe.trim() || editSrvNameEn.trim(),
        descriptionEn: editSrvDescEn.trim(),
        descriptionTe: srv.descriptionTe || editSrvNameTe.trim() || editSrvNameEn.trim(),
        baseInspectionFee: Number(editSrvFee),
        sortOrder: Number(editSrvOrder),
        enabled: srv.enabled,
        iconName: srv.iconName || 'Wrench',
        imageUrl: srv.imageUrl,
      });
      if (res.success) {
        setEditingServiceId(null);
        setAdminToast({
          type: 'success',
          text: `Updated service "${editSrvNameEn.trim()}" in Firestore.`,
        });
      } else {
        setAdminToast({
          type: 'error',
          text: res.error || 'Failed to update service category.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleReorderServiceClick = async (serviceId: string, direction: 'UP' | 'DOWN') => {
    if (!onReorderServiceCategory) return;
    setBusyId(`reorder_${serviceId}`);
    setAdminToast(null);
    try {
      const res = await onReorderServiceCategory(serviceId, direction);
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: `Updated service display order in Firestore.`,
        });
      } else {
        setAdminToast({
          type: 'error',
          text: res.error || 'Could not reorder service.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSrvNameEn.trim()) return;
    setBusyId('add_service');
    setAdminToast(null);
    try {
      const res = await onAddServiceCategory({
        nameEn: newSrvNameEn.trim(),
        nameTe: newSrvNameTe.trim() || newSrvNameEn.trim(),
        descriptionEn:
          newSrvDescEn.trim() ||
          `Verified doorstep ${newSrvNameEn.trim()} service in Bapatla.`,
        baseInspectionFee: Number(newSrvFee) || 100,
      });
      if (res.success) {
        setNewSrvNameEn('');
        setNewSrvNameTe('');
        setNewSrvDescEn('');
        setAdminToast({
          type: 'success',
          text: `Added new service category "${newSrvNameEn.trim()}" to Firestore.`,
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Could not add service category.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAddServiceArea = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newAreaName.trim();
    if (!cleaned || serviceAreas.includes(cleaned)) return;
    setBusyId('update_areas');
    setAdminToast(null);
    try {
      const res = await onUpdateServiceAreas([...serviceAreas, cleaned]);
      if (res.success) {
        setNewAreaName('');
        setAdminToast({
          type: 'success',
          text: `Added active service area "${cleaned}" to Firestore.`,
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Could not update service areas.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleRemoveServiceArea = async (areaToRemove: string) => {
    if (serviceAreas.length <= 1) return;
    setBusyId('update_areas');
    setAdminToast(null);
    try {
      const nextAreas = serviceAreas.filter((a) => a !== areaToRemove);
      const res = await onUpdateServiceAreas(nextAreas);
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: `Removed service area "${areaToRemove}" from active Bapatla areas.`,
        });
      } else {
        setAdminToast({ type: 'error', text: res.error || 'Could not update service areas.' });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSeedMissingServices = async () => {
    setBusyId('seed_services');
    setAdminToast(null);
    try {
      const res = await onSeedDefaultCatalog();
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: 'Non-destructive check completed: all default Bapatla services and localities are present in Firestore.',
        });
      } else {
        setAdminToast({
          type: 'error',
          text: res.error || 'Failed to seed missing default services.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleProvisionAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUid.trim() || !newAdminEmail.trim()) return;
    setBusyId('provision_admin');
    setAdminToast(null);
    try {
      const res = await onProvisionAdmin(newAdminUid.trim(), newAdminEmail.trim());
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: `Provisioned /admins/${newAdminUid.trim()} (${newAdminEmail.trim()}) in Firestore.`,
        });
        setNewAdminUid('');
        setNewAdminEmail('');
      } else {
        setAdminToast({
          type: 'error',
          text: res.error || 'Failed to provision Admin record.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleMigrateLegacySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLegacyId.trim() || !targetMigrationUid.trim()) return;
    setBusyId('migrate_legacy');
    setAdminToast(null);
    try {
      const res = await onMigrateLegacyIdentity(
        selectedLegacyId.trim(),
        targetMigrationUid.trim()
      );
      if (res.success) {
        setAdminToast({
          type: 'success',
          text: res.summary || 'Legacy record migrated to Firebase UID.',
        });
        setSelectedLegacyId('');
        setTargetMigrationUid('');
      } else {
        setAdminToast({
          type: 'error',
          text: res.error || 'Legacy migration failed.',
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-3 pb-24 space-y-5">
      {/* Top Bar */}
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
          className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {backendError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between gap-3">
          <div className="text-xs">
            <strong className="uppercase tracking-wider block text-rose-700">
              {backendError.kind}
            </strong>
            <span>{backendError.message}</span>
          </div>
          <button
            onClick={onRetrySync}
            className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Admin Governance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-teal-800/40">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-400 text-slate-950">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                Server-Verified Governance Console (/admins/&#123;uid&#125;)
              </span>
              <h1 className="text-lg font-extrabold">{t.adminDashboard}</h1>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-300">
            <span className="block font-bold text-teal-300">
              Registered Accounts: {allUsers.length} Users • {technicians.length} Technicians
            </span>
            <span>Direct Customer-to-Technician Settlement Model (₹0 Platform Commission)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 block">Total Technicians</span>
            <span className="text-2xl font-black text-white">{technicians.length}</span>
            <span className="text-[10px] text-amber-300 block">
              {pendingTechCount} Pending Approval
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 block">Total Bookings</span>
            <span className="text-2xl font-black text-white">{bookings.length}</span>
            <span className="text-[10px] text-teal-300 block">
              {bookings.filter((b) => b.status === 'PENDING').length} Pending •{' '}
              {
                bookings.filter((b) =>
                  ['ACCEPTED', 'IN_PROGRESS', 'WORK_COMPLETED'].includes(b.status)
                ).length
              }{' '}
              Assigned
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 block">
              Confirmed Tech Direct Labour
            </span>
            <span className="text-2xl font-black text-emerald-400">
              ₹{persistentReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings}
            </span>
            <span className="text-[10px] text-amber-200 block">
              Direct Customer→Tech (Not Platform Revenue)
            </span>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
            <span className="text-xs text-slate-400 block">Active Services</span>
            <span className="text-2xl font-black text-white">
              {services.filter((s) => s.enabled).length} / {services.length}
            </span>
            <span className="text-[10px] text-slate-400 block">
              {serviceAreas.length} Bapatla Areas
            </span>
          </div>
        </div>
      </div>

      {adminToast && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between ${
            adminToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{adminToast.text}</span>
          <button
            onClick={() => setAdminToast(null)}
            className="underline text-[11px]"
          >
            Close
          </button>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex flex-wrap bg-slate-200/80 p-1 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('TECHNICIANS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'TECHNICIANS'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Directory ({technicians.length} Techs / {allUsers.length} Users)
        </button>
        <button
          onClick={() => setActiveTab('BOOKINGS')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'BOOKINGS'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          Bookings ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('SERVICES')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'SERVICES'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          Services & Areas
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'LEDGER'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <Coins className="w-3.5 h-3.5" />
          Reports & Ledger
        </button>
        <button
          onClick={() => setActiveTab('GOVERNANCE')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
            activeTab === 'GOVERNANCE'
              ? 'bg-white text-teal-950 shadow-xs'
              : 'text-slate-600'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Admins & Audit ({adminAuditLogs.length})
        </button>
      </div>

      {/* TAB 1: TECHNICIAN & CUSTOMER DIRECTORY + COIN WALLET CONTROL */}
      {activeTab === 'TECHNICIANS' && (
        <div className="space-y-4">
          {/* Sub-Toggle: Technicians vs Customers Directory */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDirectorySubView('TECHNICIANS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  directorySubView === 'TECHNICIANS'
                    ? 'bg-teal-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Technicians ({technicians.length})
              </button>
              <button
                type="button"
                onClick={() => setDirectorySubView('CUSTOMERS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
                  directorySubView === 'CUSTOMERS'
                    ? 'bg-teal-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Customers & Users ({allUsers.length})
              </button>
            </div>

            {directorySubView === 'TECHNICIANS' ? (
              <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                <div className="relative min-w-[200px] flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={techSearchQuery}
                    onChange={(e) => {
                      setTechSearchQuery(e.target.value);
                      setTechPage(1);
                    }}
                    placeholder="Search technician name, UID, phone, skill..."
                    aria-label="Search technicians"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <select
                  value={techStatusFilter}
                  onChange={(e) => {
                    setTechStatusFilter(e.target.value as 'ALL' | ApprovalStatus);
                    setTechPage(1);
                  }}
                  aria-label="Filter technicians by approval status"
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                </select>
                <select
                  value={techAreaFilter}
                  onChange={(e) => {
                    setTechAreaFilter(e.target.value);
                    setTechPage(1);
                  }}
                  aria-label="Filter technicians by area"
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">All Bapatla Areas</option>
                  {serviceAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                <div className="relative min-w-[200px] flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={custSearchQuery}
                    onChange={(e) => {
                      setCustSearchQuery(e.target.value);
                      setCustPage(1);
                    }}
                    placeholder="Search customer name, UID, email, phone..."
                    aria-label="Search customers"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <select
                  value={custAreaFilter}
                  onChange={(e) => {
                    setCustAreaFilter(e.target.value);
                    setCustPage(1);
                  }}
                  aria-label="Filter customers by area"
                  className="px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 bg-white"
                >
                  <option value="ALL">All Bapatla Areas</option>
                  {serviceAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {directorySubView === 'TECHNICIANS' ? (
            <div className="space-y-3">
              {techDirectoryPage.items.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-bold text-slate-600">
                    No technician profiles match the current filter.
                  </p>
                </div>
              ) : (
                techDirectoryPage.items.map((tech) => {
                  const isBusy = busyId === tech.uid || busyId === `coin_${tech.uid}`;
                  return (
                    <div
                      key={tech.uid}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            {tech.name}
                          </h3>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              tech.approvalStatus === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tech.approvalStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tech.approvalStatus}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              tech.isAvailable
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {tech.isAvailable ? 'Online' : 'Offline'}
                          </span>
                          {tech.trialCoinsGranted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              +3 Trial Coins Granted Once
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">
                          Phone: <strong>+91 {tech.phone}</strong> • {tech.area} •{' '}
                          {tech.experienceYears} yrs exp
                        </p>
                        <p className="text-[11px] text-slate-500">
                          UID:{' '}
                          <code className="text-[10px] bg-slate-100 px-1 rounded">
                            {tech.uid}
                          </code>{' '}
                          • Skills: {tech.skills.join(', ')} • Confirmed Jobs:{' '}
                          {tech.completedJobs} • Direct Labour Earnings: ₹{tech.totalEarnings}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5">
                        {/* Protected Coin Adjustment Box with Reason Note */}
                        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <div className="px-2">
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">
                              Coins
                            </span>
                            <span className="text-base font-black text-amber-600">
                              {tech.coinBalance}
                            </span>
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            aria-label={`Coin amount for ${tech.name}`}
                            value={coinDeltaInputs[tech.uid] ?? '5'}
                            onChange={(e) =>
                              setCoinDeltaInputs((prev) => ({
                                ...prev,
                                [tech.uid]: e.target.value,
                              }))
                            }
                            className="w-14 px-2 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                          />
                          <input
                            type="text"
                            placeholder="Reason note (optional)"
                            aria-label={`Adjustment reason for ${tech.name}`}
                            value={coinReasonNoteInputs[tech.uid] ?? ''}
                            onChange={(e) =>
                              setCoinReasonNoteInputs((prev) => ({
                                ...prev,
                                [tech.uid]: e.target.value,
                              }))
                            }
                            className="w-36 px-2 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                          />
                          <button
                            disabled={isBusy}
                            onClick={() => handleCoinAdjustment(tech.uid, tech.name, 'ADD')}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold"
                          >
                            + Add
                          </button>
                          <button
                            disabled={isBusy}
                            onClick={() => handleCoinAdjustment(tech.uid, tech.name, 'DEDUCT')}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 text-xs font-bold"
                          >
                            - Deduct
                          </button>
                        </div>

                        {/* Status Governance Actions: Approve / Reject / Suspend */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tech.approvalStatus !== 'APPROVED' && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleApproveClick(tech.uid)}
                              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              {tech.trialCoinsGranted
                                ? 'Re-Approve (0 Extra Trial Coins)'
                                : t.approveWith3Coins}
                            </button>
                          )}

                          {tech.approvalStatus !== 'REJECTED' && onRejectTechnician && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleRejectClick(tech.uid)}
                              className="px-2.5 py-2 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          )}

                          {tech.approvalStatus !== 'SUSPENDED' && (
                            <button
                              disabled={isBusy}
                              onClick={() => handleSuspendClick(tech.uid)}
                              className="px-2.5 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-50 text-xs font-bold flex items-center gap-1"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              {t.suspendAccount}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Technician Pagination Bar */}
              {techDirectoryPage.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-semibold">
                    Page {techDirectoryPage.page} of {techDirectoryPage.totalPages} (
                    {techDirectoryPage.totalItems} total technicians)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!techDirectoryPage.hasPrevPage}
                      onClick={() => setTechPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!techDirectoryPage.hasNextPage}
                      onClick={() => setTechPage((p) => p + 1)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Customers & Users Directory with Protected Contact Access */
            <div className="space-y-3">
              {custDirectoryPage.items.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
                  <p className="text-sm font-bold text-slate-600">
                    No customer/user records match the current search filter.
                  </p>
                </div>
              ) : (
                custDirectoryPage.items.map(({ profile: u, privateContact }) => {
                  const isBusyContact = busyId === `contact_${u.uid}`;
                  return (
                    <div
                      key={u.uid}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{u.name}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700">
                            {u.role}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            {u.phoneVerified ? 'Phone Verified' : 'Phone Unverified'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Area: <strong>{u.area}</strong> • Language: {u.language.toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          UID:{' '}
                          <code className="text-[10px] bg-slate-100 px-1 rounded">{u.uid}</code>
                          {u.email ? ` • ${u.email}` : ''}
                        </p>
                        {privateContact && (
                          <div className="mt-2 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 text-xs text-teal-950 space-y-0.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                              Protected Private Contact (/users/{u.uid.slice(0, 6)}.../private/contact)
                            </span>
                            <p>
                              Phone: <strong>+91 {privateContact.phone}</strong>
                              {privateContact.email ? ` • Email: ${privateContact.email}` : ''}
                            </p>
                            {privateContact.defaultAddress && (
                              <p className="text-[11px] text-slate-700">
                                Saved Address: {privateContact.defaultAddress}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        {!privateContact && onUnlockCustomerContact && (
                          <button
                            type="button"
                            disabled={isBusyContact}
                            onClick={() => handleUnlockCustomerContactClick(u.uid)}
                            className="px-3 py-2 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-extrabold flex items-center gap-1.5"
                          >
                            {isBusyContact ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                            View Private Contact
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Customer Pagination Bar */}
              {custDirectoryPage.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-600 font-semibold">
                    Page {custDirectoryPage.page} of {custDirectoryPage.totalPages} (
                    {custDirectoryPage.totalItems} total accounts)
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={!custDirectoryPage.hasPrevPage}
                      onClick={() => setCustPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold flex items-center gap-1"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <button
                      type="button"
                      disabled={!custDirectoryPage.hasNextPage}
                      onClick={() => setCustPage((p) => p + 1)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 font-bold flex items-center gap-1"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ALL BOOKINGS MONITOR WITH STATUS FILTERS & PERMITTED PRIVATE DETAILS */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-3">
          {/* Status Filter Pills & Search */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1">
              {(
                [
                  'ALL',
                  'PENDING',
                  'ACCEPTED',
                  'IN_PROGRESS',
                  'WORK_COMPLETED',
                  'CONFIRMED',
                  'CANCELLED',
                ] as const
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBookingStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold transition ${
                    bookingStatusFilter === st
                      ? 'bg-teal-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                placeholder="Search booking ID, customer, service..."
                aria-label="Search bookings"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300"
              />
            </div>
          </div>

          {filteredAdminBookings.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200">
              <p className="text-sm font-bold text-slate-600">
                No bookings match the selected status filter.
              </p>
            </div>
          ) : (
            filteredAdminBookings.map(({ booking: bk, privateDetails, protectedPhoto }) => (
              <div
                key={bk.id}
                className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase">
                      #{bk.id.slice(-6).toUpperCase()} • {bk.generalArea} • {bk.preferredDate} (
                      {bk.preferredTimeSlot})
                    </span>
                    <h4 className="text-sm font-extrabold text-slate-900">
                      {bk.serviceNameEn} — Customer: {bk.customerName} (UID:{' '}
                      {bk.customerId.slice(0, 8)}...)
                    </h4>
                    <p className="text-xs text-slate-600">{bk.problemDescription}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-extrabold">
                      {bk.status}
                    </span>
                    {bk.technicianName && (
                      <span className="block text-xs text-slate-500 mt-1">
                        Tech: <strong>{bk.technicianName}</strong>
                      </span>
                    )}
                    {bk.labourCharges > 0 && (
                      <span className="block text-xs font-extrabold text-emerald-700">
                        Direct Tech Labour: ₹{bk.labourCharges}
                      </span>
                    )}
                  </div>
                </div>

                {/* Permitted Private Doorstep Details for Verified Admin */}
                {privateDetails ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                        Permitted Private Doorstep Details (/bookings/{bk.id.slice(-6)}/private/details)
                      </span>
                      <p className="text-slate-700">
                        <strong>Address:</strong> {privateDetails.fullAddress} (Landmark:{' '}
                        {privateDetails.landmark}, {privateDetails.villageOrWard})
                      </p>
                      <p className="text-slate-700 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-teal-700" />
                        <strong>Customer Phone:</strong> +91 {privateDetails.customerPhone}
                      </p>
                    </div>
                    {protectedPhoto && (
                      <img
                        src={protectedPhoto.dataUrl}
                        alt={protectedPhoto.fileName}
                        className="w-14 h-14 rounded-lg object-cover border border-slate-300"
                      />
                    )}
                  </div>
                ) : (
                  onUnlockBookingDetails && (
                    <button
                      type="button"
                      onClick={() => onUnlockBookingDetails(bk.id)}
                      className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Load Private Doorstep Address & Contact
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: SERVICE CATEGORIES (ADD, EDIT, ORDER, FEES, ENABLE/DISABLE) & ACTIVE SERVICE AREAS */}
      {activeTab === 'SERVICES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2.5">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900">
                  Default Bapatla Service Catalog
                </h4>
                <p className="text-[11px] text-slate-500">
                  Safely inserts any missing default categories without overwriting existing records.
                </p>
              </div>
              <button
                disabled={busyId === 'seed_services'}
                onClick={handleSeedMissingServices}
                className="px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
              >
                {busyId === 'seed_services' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sync Default Catalog
              </button>
            </div>

            {services.map((srv, idx) => {
              const isEditing = editingServiceId === srv.id;
              return (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-extrabold">
                          Order #{srv.sortOrder}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {srv.nameEn}{' '}
                          <span className="text-slate-500">({srv.nameTe})</span>
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Base Visit Fee: <strong>₹{srv.baseInspectionFee}</strong> •{' '}
                        {srv.descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onReorderServiceCategory && (
                        <>
                          <button
                            type="button"
                            disabled={idx === 0 || busyId === `reorder_${srv.id}`}
                            onClick={() => handleReorderServiceClick(srv.id, 'UP')}
                            title="Move service up"
                            aria-label={`Move ${srv.nameEn} up`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={
                              idx === services.length - 1 || busyId === `reorder_${srv.id}`
                            }
                            onClick={() => handleReorderServiceClick(srv.id, 'DOWN')}
                            title="Move service down"
                            aria-label={`Move ${srv.nameEn} down`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      {onUpdateServiceCategory && (
                        <button
                          type="button"
                          onClick={() =>
                            isEditing ? setEditingServiceId(null) : handleStartEditService(srv)
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          {isEditing ? 'Cancel' : 'Edit'}
                        </button>
                      )}

                      <button
                        disabled={busyId === srv.id}
                        onClick={() => handleToggleServiceClick(srv.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
                          srv.enabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {busyId === srv.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        {srv.enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-xl">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Name (English)
                        </label>
                        <input
                          type="text"
                          value={editSrvNameEn}
                          onChange={(e) => setEditSrvNameEn(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Name (Telugu)
                        </label>
                        <input
                          type="text"
                          value={editSrvNameTe}
                          onChange={(e) => setEditSrvNameTe(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Base Inspection Fee (₹)
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={10000}
                          value={editSrvFee}
                          onChange={(e) => setEditSrvFee(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Sort Order (#)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={999}
                          value={editSrvOrder}
                          onChange={(e) => setEditSrvOrder(Number(e.target.value))}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                          Description (English)
                        </label>
                        <input
                          type="text"
                          value={editSrvDescEn}
                          onChange={(e) => setEditSrvDescEn(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingServiceId(null)}
                          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 bg-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={busyId === `edit_${srv.id}`}
                          onClick={() => handleSaveEditedService(srv)}
                          className="px-3.5 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-900 text-white text-xs font-extrabold flex items-center gap-1"
                        >
                          {busyId === `edit_${srv.id}` && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          )}
                          Save Changes to Firestore
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <form
              onSubmit={handleCreateService}
              className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 h-fit"
            >
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-teal-700" />
                Add Service Category
              </h3>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Name (English) *
                </label>
                <input
                  type="text"
                  required
                  value={newSrvNameEn}
                  onChange={(e) => setNewSrvNameEn(e.target.value)}
                  placeholder="e.g., CCTV & Solar Technician"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Name (Telugu)
                </label>
                <input
                  type="text"
                  value={newSrvNameTe}
                  onChange={(e) => setNewSrvNameTe(e.target.value)}
                  placeholder="e.g., సీసీటీవీ & సోలార్ రిపేర్"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Base Visit Fee (₹)
                </label>
                <div className="relative">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="number"
                    value={newSrvFee}
                    onChange={(e) => setNewSrvFee(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={busyId === 'add_service'}
                className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                {busyId === 'add_service' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Category
              </button>
            </form>

            {/* Active Bapatla Service Areas Manager */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-700" />
                Active Service Areas ({serviceAreas.length})
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 text-[11px] font-bold"
                  >
                    {area}
                    {serviceAreas.length <= 1 ? null : (
                      <button
                        type="button"
                        disabled={busyId === 'update_areas'}
                        onClick={() => handleRemoveServiceArea(area)}
                        className="text-slate-400 hover:text-rose-600"
                        title="Remove area"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
              <form onSubmit={handleAddServiceArea} className="flex gap-1.5 pt-1">
                <input
                  type="text"
                  value={newAreaName}
                  onChange={(e) => setNewAreaName(e.target.value)}
                  placeholder="Add Bapatla locality..."
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-xl border border-slate-300"
                />
                <button
                  type="submit"
                  disabled={busyId === 'update_areas' || !newAreaName.trim()}
                  className="px-3 py-1.5 rounded-xl bg-teal-800 text-white text-xs font-extrabold disabled:opacity-50"
                >
                  Add
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PERSISTENT REPORTS (WITH DATE RANGES & DEFINITIONS) + COIN LEDGER & COMPLETION RECORDS */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          {/* Date-Range Persistent Report Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-700" />
                  Persistent Marketplace Report & Definitions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Computed directly from persistent Firestore records for{' '}
                  <strong>{persistentReport.dateRange.label}</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'ALL_TIME', label: 'All Time' },
                    { id: 'TODAY', label: 'Today' },
                    { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                    { id: 'LAST_30_DAYS', label: 'Last 30 Days' },
                    { id: 'CUSTOM', label: 'Custom Range' },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setReportRangePreset(preset.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-extrabold transition ${
                      reportRangePreset === preset.id
                        ? 'bg-teal-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {reportRangePreset === 'CUSTOM' && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  Start Date:
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                  />
                </label>
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  End Date:
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white"
                  />
                </label>
              </div>
            )}

            {/* Explicit Accounting Disclosure Banner */}
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-extrabold">
                  Important Financial Definition — Direct Customer-to-Technician Settlement Only:
                </strong>
                <span>
                  Confirmed technician labour earnings (₹
                  {persistentReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings}
                  ) represent{' '}
                  <strong>
                    direct doorstep labour settlements agreed between customer and technician
                  </strong>
                  . They are <strong>NOT platform revenue</strong> (Platform Commission Revenue: ₹
                  {persistentReport.technicianDirectLabourMetrics.platformCommissionRevenue}) and{' '}
                  <strong>NOT confirmed platform payment</strong> (no payment gateway or platform
                  escrow is collected).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Pending Requests
                </span>
                <span className="text-xl font-black text-amber-700">
                  {persistentReport.bookingMetrics.pendingRequestsCount}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Status: PENDING (unassigned)
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Assigned Active Jobs
                </span>
                <span className="text-xl font-black text-teal-800">
                  {persistentReport.bookingMetrics.assignedJobsCount}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  ACCEPTED / IN_PROGRESS / WORK_COMPLETED
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 block">
                  Confirmed Jobs
                </span>
                <span className="text-xl font-black text-emerald-700">
                  {persistentReport.bookingMetrics.confirmedJobsCount}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Customer-confirmed completions
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-900 block">
                  Confirmed Tech Direct Labour
                </span>
                <span className="text-xl font-black text-emerald-800">
                  ₹{persistentReport.technicianDirectLabourMetrics.confirmedTechnicianLabourEarnings}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5">
                  Direct to Tech • ₹0 Platform Revenue
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                <span className="text-[11px] font-bold text-amber-900 block">
                  Coin Activity ({persistentReport.coinActivity.totalTransactionsCount} tx)
                </span>
                <span className="text-xs font-extrabold text-slate-800 block mt-1">
                  +{persistentReport.coinActivity.trialCoinsGrantedTotal} Trial • +
                  {persistentReport.coinActivity.adminCoinsAddedTotal} Rech
                </span>
                <span className="text-[10px] text-rose-700 font-bold block mt-0.5">
                  -{persistentReport.coinActivity.jobAcceptanceCoinsSpentTotal} Job Accept • -
                  {persistentReport.coinActivity.adminCoinsDeductedTotal} Deduct
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                Coin Ledger Entries ({coinTransactions.length})
              </h3>
              {coinTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">
                  No coin audit entries recorded in Firestore yet.
                </p>
              ) : (
                coinTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">
                        {tx.technicianName}
                      </span>{' '}
                      • <span className="text-slate-600">{tx.reason}</span>
                      {tx.reasonNote && (
                        <span className="block text-[11px] text-teal-800 font-semibold">
                          Note: “{tx.reasonNote}”
                        </span>
                      )}
                      <span className="block text-[10px] text-slate-400">
                        {tx.prevBalance !== undefined && tx.balanceAfter !== undefined
                          ? `Balance: ${tx.prevBalance} → ${tx.balanceAfter} • `
                          : ''}
                        Actor: {(tx.actorId || 'system').slice(0, 8)}... •{' '}
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <span
                      className={`font-black ${
                        tx.delta > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {tx.delta > 0 ? `+${tx.delta}` : tx.delta} Coins
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                Customer-Confirmed Direct Labour Records ({completionRecords.length})
              </h3>
              {completionRecords.length === 0 ? (
                <p className="text-xs text-slate-500 p-4 text-center">
                  No customer-confirmed completion records in <code>/booking_completions</code> yet.
                </p>
              ) : (
                completionRecords.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900">
                        {rec.technicianName}
                      </span>{' '}
                      • <span className="text-slate-600">Booking #{rec.bookingId.slice(-6)}</span>
                      <span className="block text-[10px] text-slate-500">
                        Direct Tech Labour Cumulative: ₹{rec.prevTechnicianEarnings} → ₹
                        {rec.newTechnicianEarnings} • {new Date(rec.confirmedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 block">
                        +₹{rec.labourCharges}
                      </span>
                      <span className="text-[10px] text-slate-500">Direct to Tech</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRUSTED ADMIN PROVISIONING, LEGACY MIGRATION & ADMIN AUDIT LOGS */}
      {activeTab === 'GOVERNANCE' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Trusted Admin Roster & Provisioning */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                  Trusted Admin Roster (/admins/&#123;uid&#125;)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only UIDs present in the <code>/admins</code> collection (or with server custom
                  claim <code>admin: true</code>) are authorized for Admin operations. Hard-coded
                  email strings never substitute for server-verified authorization.
                </p>
              </div>

              <div className="space-y-2">
                {adminRoster.length === 0 ? (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                    No explicit <code>/admins/&#123;uid&#125;</code> records found yet.
                  </p>
                ) : (
                  adminRoster.map((adm) => (
                    <div
                      key={adm.uid}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-900 block">{adm.email}</strong>
                        <code className="text-[10px] text-slate-500">UID: {adm.uid}</code>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        Provisioned Admin
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleProvisionAdminSubmit}
                className="space-y-2.5 pt-3 border-t border-slate-200"
              >
                <h4 className="text-xs font-extrabold text-slate-800">
                  Provision Additional Admin by Firebase Auth UID
                </h4>
                <input
                  type="text"
                  required
                  value={newAdminUid}
                  onChange={(e) => setNewAdminUid(e.target.value)}
                  placeholder="Target Firebase Auth UID (e.g., KVvhN2vzcVdSft...)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="Admin Email Address"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
                <button
                  type="submit"
                  disabled={busyId === 'provision_admin'}
                  className="w-full py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  {busyId === 'provision_admin' && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  Save to /admins/&#123;uid&#125;
                </button>
              </form>
            </div>

            {/* Safe Legacy Identity Migration Preview & Explicit Mapping */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-amber-600" />
                  Legacy Identity Migration Preview (cust_... / tech_...)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Safely preview any legacy synthetic IDs and explicitly map them to a real Firebase
                  Authentication UID without silently merging unrelated users.
                </p>
              </div>

              {legacyCandidates.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                  ✓ All current user, technician, and booking records in Firestore use real Firebase
                  Authentication UIDs. Zero legacy <code>cust_...</code> or <code>tech_...</code>{' '}
                  records detected.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {legacyCandidates.map((cand) => (
                    <button
                      key={`${cand.kind}_${cand.legacyId}`}
                      type="button"
                      onClick={() => setSelectedLegacyId(cand.legacyId)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition ${
                        selectedLegacyId === cand.legacyId
                          ? 'bg-amber-50 border-amber-400 text-amber-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between font-extrabold">
                        <span>
                          [{cand.kind}] {cand.displayName}
                        </span>
                        <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border">
                          {cand.legacyId}
                        </code>
                      </div>
                      {cand.kind === 'TECHNICIAN' && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Status: {cand.approvalStatus} • Coins: {cand.coinBalance} • Earnings: ₹
                          {cand.totalEarnings}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <form
                onSubmit={handleMigrateLegacySubmit}
                className="space-y-2.5 pt-3 border-t border-slate-200"
              >
                <h4 className="text-xs font-extrabold text-slate-800">
                  Explicit Legacy ID → Firebase Auth UID Mapping
                </h4>
                <input
                  type="text"
                  required
                  value={selectedLegacyId}
                  onChange={(e) => setSelectedLegacyId(e.target.value)}
                  placeholder="Legacy ID (e.g., tech_17300001 or cust_17300002)"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
                <input
                  type="text"
                  required
                  value={targetMigrationUid}
                  onChange={(e) => setTargetMigrationUid(e.target.value)}
                  placeholder="Target Real Firebase Auth UID"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
                <button
                  type="submit"
                  disabled={busyId === 'migrate_legacy'}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center justify-center gap-1.5"
                >
                  {busyId === 'migrate_legacy' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  Execute Explicit Identity Migration
                </button>
              </form>
            </div>
          </div>

          {/* Immutable Admin Audit Trail (/admin_audit_logs) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              Immutable Admin Audit Records (/admin_audit_logs) ({adminAuditLogs.length})
            </h3>
            {adminAuditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 p-3 text-center">
                No administrative audit entries recorded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {adminAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 text-[10px] font-extrabold mr-2">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800">{log.summary}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Actor UID: {log.actorUid} • Target: {log.targetId} •{' '}
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
