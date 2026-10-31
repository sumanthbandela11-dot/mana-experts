import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  User,
  Wrench,
  MapPin,
  Phone,
  LogIn,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Home,
  LogOut,
  Smartphone,
} from 'lucide-react';
import {
  ServiceCategory,
  UserProfile,
  UserPrivateContact,
  TechnicianProfile,
} from '../domain/manaRules';

export type AuthModalMode = 'SIGN_IN' | 'REGISTER' | 'EDIT_PROFILE';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthModalMode;
  onClose: () => void;
  serviceAreas: string[];
  services: ServiceCategory[];
  isAuthenticated: boolean;
  firebaseUserUid: string | null;
  firebaseUserEmail: string | null;
  firebaseUserName?: string | null;
  existingProfile: UserProfile | null;
  existingContact: UserPrivateContact | null;
  existingTechProfile: TechnicianProfile | null;
  isAndroidWebView: boolean;
  onGoogleLogin: () => Promise<{
    success: boolean;
    cancelled?: boolean;
    popupBlocked?: boolean;
    error?: string;
  }>;
  onGoogleRedirectLogin: () => Promise<void>;
  onEmailSignIn: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onEmailSignUp: (email: string, password: string, displayName: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onPasswordReset: (email: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  onFirstTimeRegisterSubmit: (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    role: 'CUSTOMER' | 'TECHNICIAN';
    skills: string[];
    experienceYears: number;
    bio: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onEditProfileSubmit: (data: {
    name: string;
    phone: string;
    defaultAddress: string;
    area: string;
    skills?: string[];
    experienceYears?: number;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onSignOut: () => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode,
  onClose,
  serviceAreas,
  services,
  isAuthenticated,
  firebaseUserUid,
  firebaseUserEmail,
  firebaseUserName,
  existingProfile,
  existingContact,
  existingTechProfile,
  isAndroidWebView,
  onGoogleLogin,
  onGoogleRedirectLogin,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onFirstTimeRegisterSubmit,
  onEditProfileSubmit,
  onSignOut,
}) => {
  // Email/Password Auth State
  const [emailAuthTab, setEmailAuthTab] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [signupNameInput, setSignupNameInput] = useState('');
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);

  // Profile / Registration Form State
  const [role, setRole] = useState<'CUSTOMER' | 'TECHNICIAN'>('CUSTOMER');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');
  const [area, setArea] = useState(serviceAreas[0] || 'Bapatla - Railpet');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['electrician']);
  const [experienceYears, setExperienceYears] = useState(3);
  const [bio, setBio] = useState('');

  const [error, setError] = useState('');
  const [infoNotice, setInfoNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sync form state whenever modal opens or existing profile changes
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setInfoNotice('');

    if (existingProfile) {
      setName(existingProfile.name || firebaseUserName || '');
      setArea(existingProfile.area || serviceAreas[0] || 'Bapatla - Railpet');
      if (existingProfile.role === 'TECHNICIAN') {
        setRole('TECHNICIAN');
      } else {
        setRole('CUSTOMER');
      }
    } else if (firebaseUserName) {
      setName(firebaseUserName);
    }

    if (existingContact) {
      setPhone(existingContact.phone || '');
      setDefaultAddress(existingContact.defaultAddress || '');
    }

    if (existingTechProfile) {
      setSelectedSkills(
        existingTechProfile.skills.length > 0
          ? existingTechProfile.skills
          : ['electrician']
      );
      setExperienceYears(existingTechProfile.experienceYears);
      setBio(existingTechProfile.bio || '');
    }
  }, [
    isOpen,
    existingProfile,
    existingContact,
    existingTechProfile,
    firebaseUserName,
    serviceAreas,
  ]);

  if (!isOpen) return null;

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    );
  };

  const handleGoogleClick = async () => {
    setIsLoading(true);
    setError('');
    setInfoNotice('');
    try {
      const res = await onGoogleLogin();
      if (!res.success) {
        if (res.popupBlocked) {
          setShowRedirectFallback(true);
        }
        setError(res.error || 'Google Sign-In did not complete.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoNotice('');

    if (!emailInput.trim() || !emailInput.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (passwordInput.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (emailAuthTab === 'LOGIN') {
        const res = await onEmailSignIn(emailInput.trim(), passwordInput);
        if (!res.success) {
          setError(res.error || 'Could not sign in with Email & Password.');
        }
      } else {
        if (signupNameInput.trim().length < 2) {
          setError('Please enter your full name (at least 2 characters).');
          setIsLoading(false);
          return;
        }
        const res = await onEmailSignUp(
          emailInput.trim(),
          passwordInput,
          signupNameInput.trim()
        );
        if (!res.success) {
          setError(res.error || 'Could not create account.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPasswordClick = async () => {
    setError('');
    setInfoNotice('');
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setError('Enter your email address above first, then click Forgot Password.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await onPasswordReset(emailInput.trim());
      if (res.success) {
        setInfoNotice(`Password reset link sent to ${emailInput.trim()}. Check your inbox.`);
      } else {
        setError(res.error || 'Could not send password reset email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoNotice('');

    if (!isAuthenticated || !firebaseUserUid) {
      setError('Please sign in first so your profile is linked to your Firebase UID.');
      return;
    }

    if (name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 characters).');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Enter a valid 10-digit Indian mobile number starting with 6-9.');
      return;
    }
    if (defaultAddress.trim().length < 4) {
      setError('Please enter your house/door number or street in Bapatla.');
      return;
    }

    const isTechRole =
      mode === 'EDIT_PROFILE'
        ? existingProfile?.role === 'TECHNICIAN' || Boolean(existingTechProfile)
        : role === 'TECHNICIAN';

    if (isTechRole && selectedSkills.length === 0) {
      setError('Please select at least one trade skill.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'EDIT_PROFILE' && existingProfile) {
        const res = await onEditProfileSubmit({
          name: name.trim(),
          phone: cleanPhone,
          defaultAddress: defaultAddress.trim(),
          area,
          skills: isTechRole ? selectedSkills : undefined,
          experienceYears: isTechRole ? experienceYears : undefined,
          bio: isTechRole
            ? bio.trim() || `Experienced local service technician in ${area}, Bapatla.`
            : undefined,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Failed to update profile in Firestore.');
        }
      } else {
        const res = await onFirstTimeRegisterSubmit({
          name: name.trim(),
          phone: cleanPhone,
          defaultAddress: defaultAddress.trim(),
          area,
          role,
          skills: selectedSkills,
          experienceYears,
          bio:
            bio.trim() ||
            `Experienced local service technician in ${area}, Bapatla.`,
        });
        if (res.success) {
          onClose();
        } else {
          setError(res.error || 'Could not save your profile to Firestore.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Determine active view inside modal:
  // If not authenticated -> always show SIGN_IN view.
  // If authenticated and existingProfile exists -> show EDIT_PROFILE view.
  // If authenticated and no existingProfile -> show REGISTER (First-time setup) view.
  const effectiveView: AuthModalMode = !isAuthenticated
    ? 'SIGN_IN'
    : existingProfile
    ? 'EDIT_PROFILE'
    : 'REGISTER';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#087F78] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-100 block">
              Mana Experts • Bapatla
            </span>
            <h3 className="text-base font-extrabold">
              {effectiveView === 'SIGN_IN'
                ? 'Sign In to Your Account'
                : effectiveView === 'EDIT_PROFILE'
                ? 'Edit Your Saved Profile'
                : 'Complete First-Time Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {infoNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoNotice}</span>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW 1: SIGN IN (Email/Password for Android WebView + Google)   */}
          {/* =============================================================== */}
          {effectiveView === 'SIGN_IN' && (
            <div className="space-y-4">
              {isAndroidWebView && (
                <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900 flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-[#087F78] shrink-0 mt-0.5" />
                  <span>
                    <strong>Android App Mode:</strong> Email & Password sign-in works directly inside the Android app without external browser popups.
                  </span>
                </div>
              )}

              {/* Email & Password Sign-In / Sign-Up Card (Primary for Android WebView & Web) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthTab('LOGIN');
                      setError('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition ${
                      emailAuthTab === 'LOGIN'
                        ? 'bg-white text-[#087F78] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Sign In (Existing User)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthTab('SIGNUP');
                      setError('');
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-extrabold transition ${
                      emailAuthTab === 'SIGNUP'
                        ? 'bg-white text-[#087F78] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Create New Account
                  </button>
                </div>

                <form onSubmit={handleEmailAuthSubmit} className="space-y-2.5">
                  {emailAuthTab === 'SIGNUP' && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Your Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          required
                          value={signupNameInput}
                          onChange={(e) => setSignupNameInput(e.target.value)}
                          placeholder="e.g., K. Venkata Rao"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#087F78] focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#087F78] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Password *
                      </label>
                      {emailAuthTab === 'LOGIN' && (
                        <button
                          type="button"
                          onClick={handleResetPasswordClick}
                          className="text-[10px] font-bold text-[#087F78] hover:underline"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#087F78] focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 bg-[#087F78] hover:bg-[#066660] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    {emailAuthTab === 'LOGIN'
                      ? 'Sign In & Load Saved Profile'
                      : 'Create Account & Continue'}
                  </button>
                </form>
              </div>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-bold text-slate-400 uppercase">
                  Or Sign In with Google
                </span>
                <div className="grow border-t border-slate-200" />
              </div>

              {/* Google Sign-In Button */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#087F78]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#087F78]" />
                  )}
                  Continue with Google Sign-In
                </button>

                {(showRedirectFallback || isAndroidWebView) && (
                  <button
                    type="button"
                    onClick={onGoogleRedirectLogin}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-xl transition"
                  >
                    Use Full-Page Google Redirect (If Popup Is Blocked)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* VIEW 2 & 3: FIRST-TIME REGISTRATION OR EDIT EXISTING PROFILE    */}
          {/* =============================================================== */}
          {(effectiveView === 'REGISTER' || effectiveView === 'EDIT_PROFILE') && (
            <form onSubmit={handleProfileFormSubmit} className="space-y-3.5">
              {/* Authenticated Identity Badge */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#087F78] block">
                    Firebase Auth Identity Verified
                  </span>
                  <strong className="text-slate-900 block truncate max-w-[220px]">
                    {firebaseUserEmail || firebaseUserUid}
                  </strong>
                  <span className="text-[10px] text-slate-500 font-mono">
                    UID: {firebaseUserUid?.slice(0, 14)}...
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onSignOut();
                    onClose();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold flex items-center gap-1 shrink-0"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>

              {/* Role selection is ONLY shown during FIRST-TIME registration */}
              {effectiveView === 'REGISTER' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Choose Your Account Role (Cannot Self-Assign Admin)
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                        role === 'CUSTOMER'
                          ? 'border-[#087F78] bg-[#E8F7F4]/70 text-teal-950 ring-2 ring-[#087F78]/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <User className="w-4 h-4 text-[#087F78]" />
                        {role === 'CUSTOMER' && (
                          <CheckCircle2 className="w-4 h-4 text-[#087F78]" />
                        )}
                      </div>
                      <span className="text-xs font-extrabold">Customer</span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        Book Bapatla home services free
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('TECHNICIAN')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 ${
                        role === 'TECHNICIAN'
                          ? 'border-amber-600 bg-amber-50/70 text-amber-950 ring-2 ring-amber-600/20'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Wrench className="w-4 h-4 text-amber-600" />
                        {role === 'TECHNICIAN' && (
                          <CheckCircle2 className="w-4 h-4 text-amber-600" />
                        )}
                      </div>
                      <span className="text-xs font-extrabold">Technician</span>
                      <span className="text-[10px] text-slate-500 leading-tight">
                        Get 3 free coins after approval
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-[#E8F7F4] border border-[#D0EFEA] text-xs text-[#0F2942]">
                  <span className="font-extrabold">
                    Saved Account Role: {existingProfile?.role}
                  </span>
                  {existingTechProfile && (
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Status: <strong>{existingTechProfile.approvalStatus}</strong> • Balance:{' '}
                      <strong>{existingTechProfile.coinBalance} Coins</strong> • Earnings:{' '}
                      <strong>₹{existingTechProfile.totalEarnings}</strong> (Protected during edits)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., K. Venkata Rao"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#087F78] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Phone Number (10-digit) *</span>
                  <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Unverified (No Paid SMS OTP)
                  </span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9848012345"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#087F78] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bapatla Locality / Village *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-[#087F78] absolute left-3 top-3" />
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#087F78] focus:outline-none"
                  >
                    {serviceAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Default Door No. / Street Address *
                </label>
                <div className="relative">
                  <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={defaultAddress}
                    onChange={(e) => setDefaultAddress(e.target.value)}
                    placeholder="e.g., D.No 4-12/A, 2nd Cross Road, Railpet"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#087F78] focus:outline-none"
                  />
                </div>
              </div>

              {/* Technician Fields */}
              {((effectiveView === 'REGISTER' && role === 'TECHNICIAN') ||
                (effectiveView === 'EDIT_PROFILE' &&
                  (existingProfile?.role === 'TECHNICIAN' || Boolean(existingTechProfile)))) && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Select Trade Skills *
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {services.map((srv) => {
                        const active = selectedSkills.includes(srv.id);
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => toggleSkill(srv.id)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition ${
                              active
                                ? 'bg-[#087F78] text-white border-[#087F78]'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {srv.nameEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Experience (Years)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={50}
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                      />
                    </div>
                    {effectiveView === 'REGISTER' && (
                      <div className="flex flex-col justify-end">
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-medium">
                          Starts in <strong>PENDING</strong> status until Admin approves (+3 Free Coins).
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Work Summary / Bio
                    </label>
                    <textarea
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Describe your tools, training, and localities covered in Bapatla..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#087F78] hover:bg-[#066660] disabled:bg-slate-300 text-white font-extrabold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving to Cloud Firestore...
                  </>
                ) : effectiveView === 'EDIT_PROFILE' ? (
                  'Save Profile Changes'
                ) : (
                  `Complete ${role === 'CUSTOMER' ? 'Customer' : 'Technician'} Registration`
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
