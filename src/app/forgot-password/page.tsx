'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
  ShieldCheck,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

function getPasswordChecks(password: string) {
  return [
    { label: 'At least 6 characters', met: password.length >= 6 },
    { label: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=new password, 3=success
  const [direction, setDirection] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [serverOtp, setServerOtp] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checks = getPasswordChecks(password);

  const startTimer = useCallback(() => {
    setResendTimer(45);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      setServerOtp(data.otp);
      toast.success(`OTP sent! (Demo: ${data.otp})`);
      startTimer();
      setDirection(1);
      setStep(1);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      toast.success('OTP verified!');
      setDirection(1);
      setStep(2);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      setServerOtp(data.otp);
      setOtp('');
      toast.success(`New OTP sent! (Demo: ${data.otp})`);
      startTimer();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      toast.success('Password reset successfully!');
      setDirection(1);
      setStep(3);
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const stepLabels = ['Email', 'Verify OTP', 'New Password'];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950/20" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 py-8">
        {/* Lock illustration */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-4 relative"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/30">
              {step === 3 ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
              ) : (
                <Lock className="w-10 h-10 text-white" />
              )}
            </div>
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.4], opacity: [0.4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 w-20 h-20 rounded-2xl border-2 border-teal-500"
            />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {step === 3 ? 'Password Reset!' : 'Forgot Password?'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {step === 0 && "No worries, we'll send you a reset code"}
            {step === 1 && 'Enter the 6-digit code sent to your email'}
            {step === 2 && 'Create a new strong password'}
            {step === 3 && 'Your password has been updated successfully'}
          </p>
        </motion.div>

        {/* Step indicator */}
        {step < 3 && (
          <div className="flex items-center justify-center mb-6">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                      step > i
                        ? 'bg-teal-500 text-white'
                        : step === i
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step > i ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className="text-[10px] mt-1 text-muted-foreground hidden sm:block">
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`w-12 sm:w-16 h-0.5 mx-2 transition-colors duration-300 ${
                      step > i ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <Card className="border-0 shadow-xl shadow-teal-900/5 dark:shadow-teal-900/20">
          <CardContent className="p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 0: Email */}
              {step === 0 && (
                <motion.div
                  key="email-step"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="fp-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fp-email"
                        type="email"
                        placeholder="you@doctorooms.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleSendOtp}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Send Reset Code
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step 1: OTP */}
              {step === 1 && (
                <motion.div
                  key="otp-step"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Code sent to <span className="font-medium text-foreground">{email}</span>
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={(value) => setOtp(value)}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {/* Resend */}
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        {resendTimer > 0 ? (
                          <>
                            Resend code in{' '}
                            <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">
                              {resendTimer}s
                            </span>
                          </>
                        ) : (
                          <button
                            onClick={handleResend}
                            className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium hover:underline cursor-pointer"
                          >
                            Resend code
                          </button>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={goBack}
                      className="flex-1 cursor-pointer"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleVerifyOtp}
                      disabled={loading || otp.length !== 6}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Verifying...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Verify
                        </span>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: New Password */}
              {step === 2 && (
                <motion.div
                  key="password-step"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          className="pl-10 pr-10"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-new-password">Confirm Password</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-new-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          className="pl-10 pr-10"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword && password !== confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>

                    {/* Password requirements checklist */}
                    {password && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-1.5 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Password requirements:
                        </p>
                        {checks.map((check) => (
                          <div
                            key={check.label}
                            className={`flex items-center gap-2 text-xs transition-colors ${
                              check.met ? 'text-teal-600 dark:text-teal-400' : 'text-muted-foreground'
                            }`}
                          >
                            <Check
                              className={`h-3 w-3 ${
                                check.met
                                  ? 'text-teal-600 dark:text-teal-400'
                                  : 'text-gray-300 dark:text-gray-600'
                              }`}
                            />
                            {check.label}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  <Button
                    onClick={handleResetPassword}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Resetting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Reset Password
                      </span>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 3 && (
                <motion.div
                  key="success-step"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="text-center space-y-4 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-teal-500/30"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 12 }}
                    >
                      <Check className="w-8 h-8 text-white" strokeWidth={3} />
                    </motion.div>
                  </motion.div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Password Updated!
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      You can now sign in with your new password.
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25"
                  >
                    <Link href="/login">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Back to Sign In
                    </Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Back to login */}
        {step < 3 && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link
                href="/login"
                className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
