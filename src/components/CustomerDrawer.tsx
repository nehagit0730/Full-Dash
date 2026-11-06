import React, { useState, useEffect } from 'react';
import { Customer, Product, Order } from '../types';
import { getWishlistProductTitle } from '../utils/mediaUtils';
import { parseOrderTime } from '../utils';
import { 
  X, User, LogIn, Heart, MapPin, Package, ShoppingBag, 
  Plus, Trash2, Eye, ShieldCheck, Sparkles, Smile, ArrowRight,
  Truck, Check, Clock, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SubscriptionIcon from './SubscriptionIcon';
import { signInWithGoogle } from '../lib/auth';
import { isProcessing, dispatchStage, dispatchLabel } from '../lib/orderStatus';
import { useRecaptcha } from '../hooks/useRecaptcha';

interface CustomerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  loggedInCustomer: Customer | null;
  onLogin: (customer: Customer) => void;
  onLogout: () => void;
  onUpdateWishlist: (productId: string, action: 'add' | 'remove') => void;
  onAddToCart: (product: Product, quantity: number) => void;
  allProducts: Product[];
  orders: Order[];
  onAddAddress: (address: string) => void;
  onRemoveAddress: (index: number) => void;
  onOpenCart: () => void;
  initialTab?: 'orders' | 'addresses' | 'wishlist';
  onNavigateToPortal?: () => void;
}

export default function CustomerDrawer({
  isOpen,
  onClose,
  customers,
  loggedInCustomer,
  onLogin,
  onLogout,
  onUpdateWishlist,
  onAddToCart,
  allProducts,
  orders,
  onAddAddress,
  onRemoveAddress,
  onOpenCart,
  initialTab = 'orders',
  onNavigateToPortal
}: CustomerDrawerProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'wishlist'>(initialTab);

  const { executeRecaptcha } = useRecaptcha();

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'reset' | 'verify'>('login');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState('');
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleDirectGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await signInWithGoogle();
      if (res && res.customer) {
        localStorage.setItem('ps_logged_in_customer', JSON.stringify(res.customer));
        onLogin(res.customer);
        setSuccessMsg(`Signed in as ${res.customer.name || res.customer.email}!`);
      }
    } catch (err: any) {
      console.warn('[Google Auth Error]', err);
      if (err?.message?.includes('closed') || err?.message?.includes('cancelled')) {
        setErrorMsg('Google Sign-In was closed or cancelled. Please try again.');
      } else if (err?.message?.includes('blocked')) {
        setErrorMsg('Sign-In popup was blocked by browser. Please allow popups for this site.');
      } else {
        setErrorMsg(err?.message || 'Google Sign-In could not be completed.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  // Addresses States
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newStreetAddress, setNewStreetAddress] = useState('');

  // Expandable Order details Accordion
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (authMode === 'forgot') {
      if (!emailInput.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsSubmitting(true);
      try {
        const recaptchaToken = await executeRecaptcha('customer_forgot_password');
        const response = await fetch('/api/customers/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailInput.toLowerCase().trim(), recaptchaToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to send reset link.');
        setSuccessMsg('Password reset link & code dispatched to your email address via Resend!');
        setAuthMode('reset');
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'reset') {
      if (!emailInput.trim() || !resetTokenInput.trim() || !passwordInput) {
        setErrorMsg('Please fill in your email, reset code/token, and new password.');
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      setIsSubmitting(true);
      try {
        const recaptchaToken = await executeRecaptcha('customer_reset_password');
        const response = await fetch('/api/customers/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: resetTokenInput.trim(),
            email: emailInput.toLowerCase().trim(),
            newPassword: passwordInput,
            recaptchaToken
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Password reset failed.');
        setSuccessMsg('Password successfully reset! You can now log in.');
        setAuthMode('login');
        setPasswordInput('');
        setConfirmPasswordInput('');
        setResetTokenInput('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'verify') {
      if (!emailInput.trim() || !verificationCodeInput.trim()) {
        setErrorMsg('Please enter your email and the 6-digit verification code.');
        return;
      }
      setIsSubmitting(true);
      try {
        const response = await fetch('/api/customers/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailInput.toLowerCase().trim(),
            code: verificationCodeInput.trim()
          })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Email verification failed.');
        
        if (data.customer) {
          onLogin(data.customer);
          setSuccessMsg('Email address verified successfully!');
        } else {
          setSuccessMsg('Email verified successfully! Please log in.');
          setAuthMode('login');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Server connection error.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (authMode === 'signup') {
      if (!nameInput.trim()) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (!phoneInput.trim()) {
        setErrorMsg('Mobile phone number is required.');
        return;
      }
    }
    if (!emailInput.trim()) {
      setErrorMsg('Please enter your email.');
      return;
    }
    if (!passwordInput) {
      setErrorMsg('Please enter your password.');
      return;
    }
    if (authMode === 'signup' && passwordInput !== confirmPasswordInput) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);

    try {
      const email = emailInput.toLowerCase().trim();
      if (authMode === 'signup') {
        const recaptchaToken = await executeRecaptcha('customer_signup');
        const response = await fetch('/api/customers/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameInput.trim(), email, phone: phoneInput.trim(), password: passwordInput, recaptchaToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Registration failed.');

        // Request 6-digit email verification code via Resend
        await fetch('/api/customers/request-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: nameInput.trim() })
        }).catch(e => console.warn('Verification code send error:', e));

        setSuccessMsg(`Account created! A 6-digit verification code has been sent to ${email}.`);
        setAuthMode('verify');
      } else {
        const recaptchaToken = await executeRecaptcha('customer_login');
        const response = await fetch('/api/customers/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: passwordInput, recaptchaToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Authentication failed.');

        onLogin(data.customer);
        setErrorMsg('');
        setEmailInput('');
        setPasswordInput('');
        setNameInput('');
        setConfirmPasswordInput('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Server connection error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const myOrders = (loggedInCustomer && loggedInCustomer.email)
    ? orders
        .filter(o => o && o.customerEmail && o.customerEmail.toLowerCase() === (loggedInCustomer.email || '').toLowerCase())
        .sort((a, b) => parseOrderTime(b) - parseOrderTime(a))
    : [];

  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreetAddress.trim()) return;
    onAddAddress(newStreetAddress.trim());
    setNewStreetAddress('');
    setShowAddressForm(false);
  };

  const handleQuickLogin = async (cust: Customer) => {
    setEmailInput(cust.email);
    setPasswordInput('password123');
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const recaptchaToken = await executeRecaptcha('customer_login');
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cust.email, password: 'password123', recaptchaToken })
      });

      const data = await response.json();
      if (response.ok) {
        onLogin(data.customer);
        setErrorMsg('');
        setEmailInput('');
        setPasswordInput('');
      } else {
        // Fallback to local state if server has any issue or doesn't have seed
        onLogin(cust);
      }
    } catch {
      onLogin(cust);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Dark backdrop blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs cursor-pointer"
            onClick={onClose}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Slide-in customer drawer panel */}
            <motion.div 
              id="customer-drawer-panel" 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-screen max-w-md bg-white flex flex-col h-full shadow-2xl border-l border-slate-200 relative z-10"
            >
              {/* Header */}
              <div className="px-5 py-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-indigo-600 animate-pulse" />
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                    {loggedInCustomer ? 'Customer Account' : 'Customer Account Login'}
                  </h2>
                </div>
                
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Close Account Workspace"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body content */}
              <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
                {!loggedInCustomer ? (
                  /* GUEST LOGIN PANEL */
                  <div className="p-6 flex flex-col justify-between h-full space-y-6">
                    <div className="space-y-5">
                      <div className="bg-gradient-to-r from-emerald-50 to-indigo-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                        <Smile className="h-8 w-8 text-indigo-600 mx-auto" />
                        <h3 className="font-extrabold text-[#0D0F12] text-[13px] uppercase mt-1">Unlock Member Perks!</h3>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-semibold font-sans">
                          Sign in or register an account to manage addresses, monitor order delivery status, and save your curated wishlist flavors instantly.
                        </p>
                      </div>

                      {/* Mode Toggle Switcher */}
                      {(authMode === 'login' || authMode === 'signup') && (
                        <div className="space-y-3">
                          {/* Google Sign In Button */}
                          <button
                            type="button"
                            onClick={handleDirectGoogleSignIn}
                            disabled={isGoogleLoading || isSubmitting}
                            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 border border-slate-250 text-slate-800 font-bold text-xs py-3 px-4 rounded-xl shadow-2xs transition-all cursor-pointer hover:border-slate-350 disabled:opacity-50"
                          >
                            {isGoogleLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin text-slate-600" />
                            ) : (
                              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                              </svg>
                            )}
                            <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
                          </button>

                          <div className="relative flex items-center justify-center my-2">
                            <div className="border-t border-slate-200 w-full"></div>
                            <span className="bg-white px-2 text-[9px] font-bold uppercase tracking-wider text-slate-400 shrink-0">OR EMAIL</span>
                            <div className="border-t border-slate-200 w-full"></div>
                          </div>

                          <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl w-full">
                            <button
                              type="button"
                              onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                              className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                                authMode === 'login'
                                  ? 'bg-white text-slate-900 shadow-3xs'
                                  : 'text-slate-500 hover:text-slate-850'
                              }`}
                            >
                              Sign In
                            </button>
                            <button
                              type="button"
                              onClick={() => { setAuthMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                              className={`py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer text-center ${
                                authMode === 'signup'
                                  ? 'bg-white text-slate-900 shadow-3xs'
                                  : 'text-slate-500 hover:text-slate-850'
                              }`}
                            >
                              Create Account
                            </button>
                          </div>
                        </div>
                      )}

                      {(authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
                        <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl">
                          <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                            {authMode === 'forgot' ? 'Forgot Password' : authMode === 'reset' ? 'Reset Password' : 'Verify Email Address'}
                          </span>
                          <button
                            type="button"
                            onClick={() => { setAuthMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
                            className="text-[9.5px] font-bold uppercase text-indigo-600 hover:text-indigo-800"
                          >
                            ← Back to Sign In
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {authMode === 'signup' && (
                          <>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                placeholder="Kayla Canty"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                Mobile / Phone Number <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="tel"
                                placeholder="+44 7700 900077"
                                value={phoneInput}
                                onChange={(e) => setPhoneInput(e.target.value)}
                                className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                                required
                              />
                            </div>
                          </>
                        )}

                        {(authMode === 'login' || authMode === 'signup' || authMode === 'forgot' || authMode === 'reset' || authMode === 'verify') && (
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              placeholder="kayla.canty@yahoo.com"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              required
                            />
                          </div>
                        )}

                        {authMode === 'verify' && (
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              6-Digit Verification Code
                            </label>
                            <input
                              type="text"
                              placeholder="Enter 6-digit code"
                              value={verificationCodeInput}
                              onChange={(e) => setVerificationCodeInput(e.target.value)}
                              className="w-full text-sm font-mono font-bold tracking-widest border border-indigo-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/50 text-center text-slate-900"
                              required
                            />
                            <p className="text-[9.5px] text-slate-400 mt-1">Check your Gmail / email inbox for the 6-digit confirmation code.</p>
                          </div>
                        )}

                        {authMode === 'reset' && (
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              Reset Token / Code
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. A3F8B2C1"
                              value={resetTokenInput}
                              onChange={(e) => setResetTokenInput(e.target.value)}
                              className="w-full text-xs font-mono font-bold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              required
                            />
                          </div>
                        )}

                        {(authMode === 'login' || authMode === 'signup' || authMode === 'reset') && (
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                {authMode === 'reset' ? 'New Password' : 'Password'}
                              </label>
                              {authMode === 'login' && (
                                <button
                                  type="button"
                                  onClick={() => { setAuthMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                                  className="text-[9.5px] font-extrabold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                                >
                                  Forgot Password?
                                </button>
                              )}
                            </div>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              required
                            />
                          </div>
                        )}

                        {(authMode === 'signup' || authMode === 'reset') && (
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                              Confirm {authMode === 'reset' ? 'New Password' : 'Password'}
                            </label>
                            <input
                              type="password"
                              placeholder="••••••••"
                              value={confirmPasswordInput}
                              onChange={(e) => setConfirmPasswordInput(e.target.value)}
                              className="w-full text-xs font-semibold border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
                              required
                            />
                          </div>
                        )}

                        {successMsg && (
                          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-[11px] font-semibold">
                            {successMsg}
                          </div>
                        )}

                        {errorMsg && (
                          <p className="text-[11px] text-red-500 font-semibold">{errorMsg}</p>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-[#1e293b] hover:bg-[#0f172a] disabled:bg-slate-300 text-white font-black text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <>
                              <LogIn className="h-4 w-4 animate-spin" /> 
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <LogIn className="h-4 w-4" /> 
                              <span>
                                {authMode === 'login' 
                                  ? 'Sign In' 
                                  : authMode === 'signup' 
                                  ? 'Create Account' 
                                  : authMode === 'forgot' 
                                  ? 'Send Password Reset Email' 
                                  : authMode === 'reset' 
                                  ? 'Update Password' 
                                  : 'Verify Email'}
                              </span>
                            </>
                          )}
                        </button>

                        {authMode === 'forgot' && (
                          <p className="text-center text-[10px] text-slate-400">
                            Already have a reset code?{' '}
                            <button
                              type="button"
                              onClick={() => { setAuthMode('reset'); setErrorMsg(''); }}
                              className="text-indigo-600 font-bold hover:underline"
                            >
                              Enter reset code
                            </button>
                          </p>
                        )}
                      </form>
                    </div>
                  </div>
                ) : (
                  /* LOGGED IN ACCOUNT WORKSPACE PANEL */
                  <div className="flex flex-col h-full">
                    {/* Customer Account Summary Header Card */}
                    <div className="p-4 bg-slate-900 text-white flex flex-col gap-3 shrink-0 rounded-b-xl border-t border-slate-800 shadow-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] text-indigo-300 font-extrabold uppercase tracking-widest">Logged In Member</span>
                          <h3 className="font-extrabold text-sm text-white mt-0.5">{loggedInCustomer.name}</h3>
                          <span className="font-mono text-[9.5px] text-slate-400 block mt-0.5">{loggedInCustomer.email}</span>
                        </div>
                        <button
                          onClick={onLogout}
                          className="text-[9.5px] bg-red-950/50 hover:bg-red-900 border border-red-800/60 hover:border-red-650 text-red-300 font-bold py-1 px-2.5 rounded-lg cursor-pointer transition-all"
                        >
                          Sign Out
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center">
                        <div className="bg-slate-800/40 p-2 rounded-lg">
                          <span className="text-[8px] uppercase tracking-wide text-slate-400 block font-bold">Plan status</span>
                          <span className="text-[10px] font-extrabold text-indigo-400 block mt-0.5 truncate">{loggedInCustomer.subscriptionStatus}</span>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-lg">
                          <span className="text-[8px] uppercase tracking-wide text-slate-400 block font-bold">Total orders</span>
                          <span className="text-[10px] font-extrabold text-white block mt-0.5">{loggedInCustomer.ordersCount} sessions</span>
                        </div>
                        <div className="bg-slate-800/40 p-2 rounded-lg">
                          <span className="text-[8px] uppercase tracking-wide text-slate-400 block font-bold">Total Spent</span>
                          <span className="text-[10px] font-extrabold text-emerald-400 block mt-0.5">£{(Number((loggedInCustomer as any).totalSpent ?? loggedInCustomer.amountSpent ?? 0)).toFixed(2)}</span>
                        </div>
                      </div>

                      {onNavigateToPortal && (
                        <button
                          onClick={onNavigateToPortal}
                          className="w-full bg-[#dfa047] hover:bg-[#c98e3b] text-[#071d37] font-black text-xs uppercase tracking-widest py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-transparent hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <span>Open Customer Portal</span>
                          <ArrowRight className="h-4 w-4 animate-bounce-right" />
                        </button>
                      )}
                    </div>

                    {/* Navigation Tabs for the Account drawer */}
                    <div className="flex border-b border-slate-150 bg-slate-50 p-1 gap-1 shrink-0 overflow-x-auto">
                      <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 min-w-[75px] py-2 text-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                          activeTab === 'orders' 
                            ? 'bg-white text-indigo-650 shadow-xs border border-slate-200' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <Package className="h-3 w-3 inline-block mr-1 -mt-0.5 text-slate-500" />
                        Orders ({myOrders.length})
                      </button>
                      <button
                        onClick={() => setActiveTab('addresses')}
                        className={`flex-1 min-w-[75px] py-2 text-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                          activeTab === 'addresses' 
                            ? 'bg-white text-indigo-650 shadow-xs border border-slate-200' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <MapPin className="h-3 w-3 inline-block mr-1 -mt-0.5 text-slate-500" />
                        Addresses
                      </button>
                      <button
                        onClick={() => setActiveTab('wishlist')}
                        className={`flex-1 min-w-[75px] py-2 text-center text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                          activeTab === 'wishlist' 
                            ? 'bg-white text-indigo-650 shadow-xs border border-slate-200' 
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <Heart className="h-3 w-3 inline-block mr-1 -mt-0.5 text-slate-500" />
                        Wishlist
                      </button>
                    </div>

                    {/* Tab contents */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      
                      {/* 1. ORDERS TAB */}
                      {activeTab === 'orders' && (
                        <div className="space-y-3">
                          {myOrders.length === 0 ? (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <Package className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">No Orders Found</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[200px] mx-auto">Place your first order and track its dispatch here instantly.</p>
                            </div>
                          ) : (
                            myOrders.map((order) => {
                              const isExpanded = expandedOrderId === order.id;
                              const isSubOrder = Boolean(
                                order.isSubscription || 
                                (Array.isArray(order.tags) && order.tags.some(t => t && t.toLowerCase().includes('subscription'))) ||
                                (Array.isArray(order.items) && order.items.some((i: any) => 
                                  i && (
                                    i.isSubscription || 
                                    i.vendor === 'Subscription Pack' || 
                                    (i.productTitle && (i.productTitle.toLowerCase().includes('subscription') || i.productTitle.toLowerCase().includes('plan') || i.productTitle.toLowerCase().includes('pack')))
                                  )
                                ))
                              );

                              return (
                                <div 
                                  key={order.id} 
                                  className={`rounded-2xl p-3.5 transition-all shadow-3xs border ${
                                    isSubOrder
                                      ? 'bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/50 border-indigo-200/90 hover:border-indigo-300 shadow-xs ring-1 ring-indigo-500/10'
                                      : 'bg-white border-slate-200/95 hover:border-slate-300'
                                  }`}
                                >
                                  {/* Order Header Summary Row */}
                                  <div className="flex justify-between items-center gap-2">
                                    <div className="space-y-0.5">
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="font-extrabold text-xs text-slate-900">{order.id}</span>
                                        <span className={`text-[8.5px] font-black uppercase py-0.5 px-2 rounded-full leading-none shrink-0 ${
                                          dispatchStage(order.fulfillmentStatus) === 'exception'
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : isProcessing(order.fulfillmentStatus)
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        }`}>
                                          {dispatchLabel(order.fulfillmentStatus)}
                                        </span>
                                        {isSubOrder && (
                                          <span className="text-[8.5px] font-black uppercase py-0.5 px-2 rounded-full leading-none shrink-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-2xs flex items-center gap-1">
                                            <RefreshCw className="h-2.5 w-2.5 text-amber-300 animate-spin-slow" />
                                            Subscription Order
                                          </span>
                                        )}
                                        {Array.isArray(order.tags) && order.tags.includes('Withdrawal Requested') && (
                                          <span className="text-[8.5px] font-black uppercase py-0.5 px-2 rounded-full leading-none shrink-0 bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                            Withdrawal Requested
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[9.5px] text-slate-400 font-mono">{order.date}</p>
                                    </div>

                                    <div className="text-right space-y-1">
                                      <div className="text-xs font-black text-slate-900">£{(Number(order.total || 0)).toFixed(2)}</div>
                                      <button
                                        onClick={() => toggleOrderExpand(order.id)}
                                        className="text-[9.5px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest flex items-center gap-0.5 cursor-pointer ml-auto"
                                      >
                                        <Eye className="h-3 w-3" />
                                        <span>{isExpanded ? 'Hide' : 'Details'}</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Expandable Order Detail Inner Accordion */}
                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pt-3.5 mt-3.5 border-t border-slate-100 space-y-3 test-xs">
                                          {/* Delivery details metadata */}
                                          <div className="space-y-1 text-[10.5px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 font-medium">
                                            <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block">Fulfillment Details</span>
                                            <p className="text-slate-700 leading-tight">📍 Courier: {order.destination}</p>
                                            <p className="text-slate-500 leading-none mt-1">🚚 Delivery Type: {order.deliveryMethod}</p>
                                          </div>

                                          {/* Direct Shipment Status Timeline (Real-time tracking) */}
                                          <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-3 shadow-3xs">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                                              <Truck className="h-3 w-3 text-indigo-600 animate-pulse" />
                                              Live Delivery Tracker
                                            </span>

                                            <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-250">
                                              {(() => {
                                                const stage = dispatchStage(order.fulfillmentStatus);
                                                const isUnfulfilled = stage === 'processing';
                                                const isFulfilled = stage === 'dispatched';
                                                const isDelivered = stage === 'delivered';

                                                const steps = [
                                                  {
                                                    label: 'Placed',
                                                    active: true,
                                                    completed: true,
                                                    date: order.date,
                                                    desc: 'Order received and payment confirmed.'
                                                  },
                                                  {
                                                    label: 'Processing',
                                                    active: isUnfulfilled,
                                                    completed: !isUnfulfilled,
                                                    date: isUnfulfilled ? 'Current step' : 'Prepared',
                                                    desc: 'Personalization & custom packaging.'
                                                  },
                                                  {
                                                    label: 'Dispatched',
                                                    active: isFulfilled,
                                                    completed: isDelivered,
                                                    date: isUnfulfilled ? 'Pending' : (isFulfilled ? 'Dispatched' : 'Departed hub'),
                                                    desc: 'Handed over to postal carrier.'
                                                  },
                                                  {
                                                    label: 'Delivered',
                                                    active: isDelivered,
                                                    completed: isDelivered,
                                                    date: isDelivered ? 'Handed over' : 'Pending',
                                                    desc: 'Safely delivered at destination.'
                                                  }
                                                ];

                                                return steps.map((step, sIdx) => (
                                                  <div key={sIdx} className="relative text-left">
                                                    <div className={`absolute -left-[18.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 transition-all flex items-center justify-center ${
                                                      step.completed
                                                        ? 'bg-indigo-600 border-indigo-600'
                                                        : step.active
                                                        ? 'bg-amber-500 border-amber-500 animate-pulse'
                                                        : 'bg-white border-slate-300'
                                                    }`} />
                                                    <div className="leading-tight">
                                                      <span className={`text-[10px] font-black uppercase tracking-wider block ${
                                                        step.completed ? 'text-indigo-950' : step.active ? 'text-amber-600' : 'text-slate-400'
                                                      }`}>
                                                        {step.label}
                                                      </span>
                                                      <p className="text-[9px] text-slate-500 leading-normal">{step.desc}</p>
                                                      <span className="text-[8.5px] font-mono text-slate-400 font-semibold mt-0.5 block">{step.date}</span>
                                                    </div>
                                                  </div>
                                                ));
                                              })()}
                                            </div>
                                          </div>

                                          {/* Items List inside accordion */}
                                          <div className="space-y-2">
                                            <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 block">Custom Products ({order.items.reduce((acc, i) => acc + i.quantity, 0)})</span>
                                            <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden bg-slate-50/50">
                                              {order.items.map((item, id) => {
                                                const matchingProduct = allProducts.find(p => p.id === item.productId);
                                                return (
                                                  <div key={id} className="p-2 flex gap-2.5 items-center justify-between text-[11px] leading-tight bg-white">
                                                    <div className="flex gap-2 items-center min-w-0">
                                                      {item.productId && (item.productId.startsWith('sub-pack-') || item.productId.includes('sub-pack')) ? (
                                                        <SubscriptionIcon planName={item.productTitle} className="!w-8 !h-8 rounded-lg" />
                                                      ) : (
                                                        <img 
                                                          src={matchingProduct?.image || item.image} 
                                                          className="w-8 h-8 rounded-lg object-contain border border-slate-150 bg-slate-50 shrink-0" 
                                                          alt="" 
                                                          referrerPolicy="no-referrer"
                                                        />
                                                      )}
                                                      <div className="min-w-0">
                                                        <p className="font-bold text-slate-800">{item.productTitle}</p>
                                                        <p className="text-slate-400 text-[9.5px] font-mono whitespace-nowrap">Qty: {item.quantity} × £{(Number(item.price || 0)).toFixed(2)}</p>
                                                      </div>
                                                    </div>
                                                    <span className="font-bold text-slate-900 shrink-0 select-none">£{(Number((item.price || 0) * (item.quantity || 1))).toFixed(2)}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          </div>

                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}

                      {/* 2. ADDRESSES TAB */}
                      {activeTab === 'addresses' && (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center bg-slate-50/80 p-3 rounded-xl border border-slate-150 shrink-0">
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide">Saved delivery points</span>
                            <button
                              onClick={() => setShowAddressForm(!showAddressForm)}
                              className="text-[10px] text-indigo-650 hover:text-indigo-850 font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>{showAddressForm ? 'Cancel' : 'Add New'}</span>
                            </button>
                          </div>

                          {showAddressForm && (
                            <form 
                              onSubmit={handleAddAddressSubmit} 
                              className="bg-indigo-50/30 p-3.5 rounded-xl border border-indigo-150/50 space-y-2.5 animate-fadeIn"
                            >
                              <h4 className="text-[9.5px] font-black uppercase tracking-widest text-[#1e293b]">Enter Shipping Address</h4>
                              <input
                                type="text"
                                placeholder="e.g. 52 Wardour St, London, W1D 4JD, United Kingdom"
                                value={newStreetAddress}
                                onChange={(e) => setNewStreetAddress(e.target.value)}
                                className="w-full text-xs font-semibold border border-slate-200 p-2.5 rounded-xl bg-white focus:ring-1 focus:ring-indigo-650"
                                required
                              />
                              <div className="flex justify-end gap-1.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => setShowAddressForm(false)}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1 px-3 rounded-lg text-[9.5px] uppercase cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="bg-[#1e293b] hover:bg-[#0f172a] text-white font-black py-1 px-3.5 rounded-lg text-[9.5px] uppercase tracking-wider cursor-pointer"
                                >
                                  Save Address
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="space-y-2">
                            {loggedInCustomer.addresses.length === 0 ? (
                              <p className="text-[11px] text-slate-400 text-center py-4">No registered addresses found. Add one above!</p>
                            ) : (
                              loggedInCustomer.addresses.map((address, idx) => (
                                <div 
                                  key={idx} 
                                  className="bg-white border border-slate-200/90 hover:border-slate-350 p-3.5 rounded-2xl relative transition-all flex justify-between gap-3 items-start"
                                >
                                  <div className="space-y-1">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded leading-none">
                                      {idx === 0 ? 'Primary Address' : 'Secondary Address'}
                                    </span>
                                    <p className="text-[11px] font-semibold text-slate-700 leading-relaxed pt-1 pr-6">{address}</p>
                                  </div>

                                  {idx > 0 && (
                                    <button
                                      onClick={() => onRemoveAddress(idx)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                                      title="Delete shipping address"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* 3. WISHLIST TAB */}
                      {activeTab === 'wishlist' && (
                        <div className="space-y-3">
                          {(!loggedInCustomer?.wishlist || !Array.isArray(loggedInCustomer.wishlist) || loggedInCustomer.wishlist.length === 0) ? (
                            <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                              <Heart className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Empty Wishlist</p>
                              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed max-w-[200px] mx-auto">Click the hearts on our product lists to save your favorite flavors here!</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-2.5">
                              {(loggedInCustomer.wishlist || []).map((productId, wIdx) => {
                                const pidStr = String(productId || '').trim().toLowerCase();
                                const prod = allProducts.find(p => p && (
                                  String(p.id || '').toLowerCase() === pidStr || 
                                  (p.slug && String(p.slug).toLowerCase() === pidStr) || 
                                  (p.title && String(p.title).toLowerCase() === pidStr) ||
                                  (p.concreteVariantId && String(p.concreteVariantId).toLowerCase() === pidStr) ||
                                  (p.concreteVariants && p.concreteVariants.some(v => v && ((v.id && String(v.id || '').toLowerCase() === pidStr) || (v.name && String(v.name || '').toLowerCase() === pidStr))))
                                ));
                                if (!prod) return null;
                                const displayTitle = getWishlistProductTitle(prod, String(productId));

                                return (
                                  <div 
                                    key={`cd-wish-${prod.id}-${wIdx}`} 
                                    className="bg-white border border-slate-200 p-3 rounded-2xl flex gap-3 items-center justify-between"
                                  >
                                    <div className="flex gap-2.5 items-center min-w-0">
                                      <img 
                                        src={prod.image} 
                                        className="w-10 h-10 object-contain tracking-wide border border-slate-100 bg-slate-50 shrink-0 rounded-xl" 
                                        alt="" 
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="min-w-0">
                                        <p className="text-[9.5px] text-slate-400 uppercase font-black tracking-wider leading-none">{prod.vendor}</p>
                                        <p className="font-bold text-slate-800 text-[11px] truncate mt-0.5 leading-tight" title={displayTitle}>{displayTitle}</p>
                                        <p className="text-xs text-indigo-700 font-extrabold mt-0.5">£{(Number(prod.price || 0)).toFixed(2)}</p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-1 items-end shrink-0">
                                      <button
                                        onClick={() => {
                                          onAddToCart(prod, 1);
                                          onClose(); // Auto close the customer drawer to focus on cart selection
                                          setTimeout(() => {
                                            onOpenCart();
                                          }, 350);
                                        }}
                                        className="text-[9px] font-black uppercase bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-2 rounded-lg flex items-center gap-0.5 transition-colors cursor-pointer select-none"
                                      >
                                        <Plus className="h-2.5 w-2.5" /> Bag
                                      </button>
                                      
                                      <button
                                        onClick={() => onUpdateWishlist(String(productId), 'remove')}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                        title="Remove item"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Footer Checkout Indicator badge */}
              <div className="p-4 border-t border-slate-150 bg-slate-50/80 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold select-none">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pouch Supply End-to-End SSL Authenticated Session</span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}
