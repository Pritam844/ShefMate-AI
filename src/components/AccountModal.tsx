import React, { useState } from 'react';
import { ChefMateLogo } from './ChefMateLogo';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Sparkles,
  Heart,
  Clock,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { UserAccount } from '../types/snackhack';
import { validateEmail, validatePassword } from '../services/userService';
import {
  loginWithEmail,
  signUpWithEmail,
  sendPasswordReset,
  logoutUser,
  getFirebaseErrorMessage,
} from '../services/firebaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
  savedCount: number;
  recentCount: number;
}

export const AccountModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
  savedCount,
  recentCount,
}) => {
  const [viewMode, setViewMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Strict: Only email and password inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetErrors = () => {
    setEmailError(null);
    setPasswordError(null);
    setGeneralError(null);
    setSuccessNotice(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Invalid email address');
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setPasswordError(passCheck.error || 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await loginWithEmail(email, password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setGeneralError(getFirebaseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Invalid email address');
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.isValid) {
      setPasswordError(passCheck.error || 'Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signUpWithEmail(email, password);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setGeneralError(getFirebaseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetErrors();

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setEmailError(emailCheck.error || 'Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSuccessNotice(`Password recovery email sent to ${email.trim()}. Please check your inbox.`);
    } catch (err: any) {
      setGeneralError(getFirebaseErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOutClick = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Firebase signout warning:', err);
    }
    onLogout();
    setViewMode('login');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200 select-none">
      {/* Backdrop tap to close */}
      <div className="flex-1" onClick={onClose} />

      {/* Claymorphic Modal / Bottom Sheet */}
      <div className="w-full bg-[#FAF7F2] rounded-t-[32px] p-5 pt-4 pb-7 shadow-2xl border-t border-white/90 max-h-[92%] flex flex-col overflow-y-auto mobile-scrollbar animate-in slide-in-from-bottom-4 duration-300">
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECE5DC]">
          <div className="flex items-center gap-2">
            <ChefMateLogo size={22} />
            <span className="font-syne font-extrabold text-base text-[#181B22] tracking-tight">
              ChefMate <span className="text-[#FF5500]">AI</span> Account
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full clay-chip-default flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            aria-label="Close Account Sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CASE A: User is already logged in -> Profile View */}
        {currentUser ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-2xl clay-card-elevated border border-white/90 flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6A00] to-[#FF4400] text-white flex items-center justify-center text-xl font-syne font-bold shadow-md shadow-[#FF5500]/30 shrink-0">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-syne font-bold text-[#181B22] truncate">
                    {currentUser.name || currentUser.email.split('@')[0]}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Firebase
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{currentUser.email}</p>
                <span className="text-[10px] font-medium text-slate-400 mt-0.5 block truncate">
                  UID: {currentUser.id.slice(0, 12)}...
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl clay-card-porcelain border border-white/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Heart className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Saved Recipes</span>
                </div>
                <div className="text-lg font-syne font-extrabold text-[#181B22]">
                  {savedCount}
                </div>
              </div>

              <div className="p-3 rounded-2xl clay-card-porcelain border border-white/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#FF5500]" />
                  <span>Recently Viewed</span>
                </div>
                <div className="text-lg font-syne font-extrabold text-[#181B22]">
                  {recentCount}
                </div>
              </div>
            </div>

            {/* Sync Notice */}
            <div className="p-3 rounded-2xl bg-[#FFF6EE] border border-[#FFDFC6] text-xs text-[#993300] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FF5500] shrink-0" />
              <span>Your recipes are securely synchronized to your Firebase account.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="clay-btn-orange w-full py-3 px-4 rounded-full font-syne font-bold text-xs tracking-wide shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Return to Pantry</span>
              </button>

              <button
                type="button"
                onClick={handleSignOutClick}
                className="clay-chip-default w-full py-2.5 px-4 rounded-full font-syne font-bold text-xs text-slate-600 hover:text-red-600 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* CASE B: User is NOT logged in -> Firebase Login / Registration */
          <div className="mt-3">
            {/* Sub-header Branding */}
            <div className="mb-4">
              <h2 className="text-lg font-syne font-extrabold text-[#181B22]">
                {viewMode === 'login' && 'Log In with Email'}
                {viewMode === 'register' && 'Register Account'}
                {viewMode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {viewMode === 'login' && 'Enter your email & password to access your recipes.'}
                {viewMode === 'register' && 'Create your account using email & password.'}
                {viewMode === 'forgot' && 'Enter your email to receive Firebase reset instructions.'}
              </p>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="leading-snug">{generalError}</span>
              </div>
            )}

            {/* Success Notice Banner */}
            {successNotice && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="leading-snug">{successNotice}</span>
              </div>
            )}

            {/* 1. LOGIN FORM */}
            {viewMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-white/95 border border-[#E9E4DC] p-2.5 focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all shadow-xs">
                    <Mail className="w-4 h-4 text-slate-400 ml-1 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                        if (generalError) setGeneralError(null);
                      }}
                      placeholder="name@example.com"
                      className="w-full bg-transparent text-xs font-medium text-[#1E293B] placeholder-slate-400 outline-none"
                    />
                  </div>
                  {emailError && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">
                      {emailError}
                    </span>
                  )}
                </div>

                {/* Password Field with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        resetErrors();
                        setViewMode('forgot');
                      }}
                      className="text-[11px] font-bold text-[#FF5500] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative flex items-center rounded-2xl bg-white/95 border border-[#E9E4DC] p-2.5 focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all shadow-xs">
                    <Lock className="w-4 h-4 text-slate-400 ml-1 mr-2 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="current-password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                        if (generalError) setGeneralError(null);
                      }}
                      placeholder="Enter password"
                      className="w-full bg-transparent text-xs font-medium text-[#1E293B] placeholder-slate-400 outline-none pr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">
                      {passwordError}
                    </span>
                  )}
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn-orange w-full py-3.5 px-4 rounded-full font-syne font-bold text-xs tracking-wide shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch to Registration */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">Don’t have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetErrors();
                      setViewMode('register');
                    }}
                    className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                  >
                    Register now
                  </button>
                </div>
              </form>
            )}

            {/* 2. REGISTRATION FORM (ONLY EMAIL & PASSWORD) */}
            {viewMode === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Email Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-white/95 border border-[#E9E4DC] p-2.5 focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all shadow-xs">
                    <Mail className="w-4 h-4 text-slate-400 ml-1 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                        if (generalError) setGeneralError(null);
                      }}
                      placeholder="name@example.com"
                      className="w-full bg-transparent text-xs font-medium text-[#1E293B] placeholder-slate-400 outline-none"
                    />
                  </div>
                  {emailError && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">
                      {emailError}
                    </span>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Password (Min. 6 characters)
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-white/95 border border-[#E9E4DC] p-2.5 focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all shadow-xs">
                    <Lock className="w-4 h-4 text-slate-400 ml-1 mr-2 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="new-password"
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (passwordError) setPasswordError(null);
                        if (generalError) setGeneralError(null);
                      }}
                      placeholder="At least 6 characters"
                      className="w-full bg-transparent text-xs font-medium text-[#1E293B] placeholder-slate-400 outline-none pr-2"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordError && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">
                      {passwordError}
                    </span>
                  )}
                </div>

                {/* Register Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn-orange w-full py-3.5 px-4 rounded-full font-syne font-bold text-xs tracking-wide shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Switch back to Login */}
                <div className="text-center pt-2">
                  <span className="text-xs text-slate-500">Already registered? </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetErrors();
                      setViewMode('login');
                    }}
                    className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                  >
                    Log in here
                  </button>
                </div>
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {viewMode === 'forgot' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Your Registered Email
                  </label>
                  <div className="relative flex items-center rounded-2xl bg-white/95 border border-[#E9E4DC] p-2.5 focus-within:ring-2 focus-within:ring-[#FF5500]/50 transition-all shadow-xs">
                    <Mail className="w-4 h-4 text-slate-400 ml-1 mr-2 shrink-0" />
                    <input
                      type="email"
                      value={email}
                      autoCapitalize="none"
                      autoCorrect="off"
                      autoComplete="email"
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                        if (generalError) setGeneralError(null);
                      }}
                      placeholder="name@example.com"
                      className="w-full bg-transparent text-xs font-medium text-[#1E293B] placeholder-slate-400 outline-none"
                    />
                  </div>
                  {emailError && (
                    <span className="text-[11px] font-medium text-red-500 mt-1 block">
                      {emailError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="clay-btn-orange w-full py-3.5 px-4 rounded-full font-syne font-bold text-xs tracking-wide shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Password Reset Link</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetErrors();
                      setViewMode('login');
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-[#FF5500] transition-colors cursor-pointer"
                  >
                    ← Back to Log In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
