'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Stethoscope,
  UserCog,
  Heart,
  Building2,
  HeadphonesIcon,
  UserCheck,
  Pill,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ROLES = [
  { value: 'doctor', label: 'Doctor', icon: UserCog, gradient: 'from-teal-500 to-teal-600', desc: 'Medical practitioner' },
  { value: 'patient', label: 'Patient', icon: Heart, gradient: 'from-emerald-500 to-emerald-600', desc: 'Health seeker' },
  { value: 'hospital', label: 'Hospital', icon: Building2, gradient: 'from-amber-500 to-amber-600', desc: 'Healthcare facility' },
  { value: 'receptionist', label: 'Receptionist', icon: HeadphonesIcon, gradient: 'from-pink-500 to-pink-600', desc: 'Front desk staff' },
  { value: 'assistant', label: 'Assistant', icon: UserCheck, gradient: 'from-violet-500 to-violet-600', desc: 'Doctor assistant' },
  { value: 'pharmacist', label: 'Pharmacist', icon: Pill, gradient: 'from-orange-500 to-orange-600', desc: 'Pharmacy professional' },
];

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  segments: boolean[];
} {
  let score = 0;
  if (password.length >= 6) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Weak', color: 'bg-red-500', segments: [true, false, false, false] },
    { label: 'Fair', color: 'bg-amber-500', segments: [true, true, false, false] },
    { label: 'Good', color: 'bg-teal-500', segments: [true, true, true, false] },
    { label: 'Strong', color: 'bg-emerald-500', segments: [true, true, true, true] },
  ];

  return { score, ...levels[score] };
}

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

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobileNo: '',
    gender: 'Male',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const goNext = () => {
    if (step === 0 && !selectedRole) {
      toast.error('Please select a role');
      return;
    }
    if (step === 1) {
      if (!form.name || !form.email || !form.mobileNo) {
        toast.error('Please fill in all required fields');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
    }
    if (step === 2) {
      if (!form.password || !form.confirmPassword) {
        toast.error('Please fill in both password fields');
        return;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      if (!termsAccepted) {
        toast.error('Please accept the terms and conditions');
        return;
      }
      return;
    }
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: selectedRole }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message);
        return;
      }
      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Select Role', 'Your Details', 'Set Password'];

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dense dot pattern background */}
      <div
        className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950/20" />

      <div className="relative z-10 w-full max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/30">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Create Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Join Doctorooms healthcare network
          </p>
        </motion.div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={step >= i ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${
                    step > i
                      ? 'bg-teal-500 text-white'
                      : step === i
                      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {step > i ? <Check className="h-4 w-4" /> : i + 1}
                </motion.div>
                <span className="text-[10px] mt-1 text-muted-foreground hidden sm:block">
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div
                  className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                    step > i ? 'bg-teal-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-xl shadow-teal-900/5 dark:shadow-teal-900/20">
          <CardContent className="p-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {/* Step 0: Role Selection */}
              {step === 0 && (
                <motion.div
                  key="role"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-semibold">Choose Your Role</h2>
                    <p className="text-sm text-muted-foreground">
                      Select how you&apos;ll use Doctorooms
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ROLES.map((role, i) => {
                      const Icon = role.icon;
                      const isSelected = selectedRole === role.value;
                      return (
                        <motion.button
                          key={role.value}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          type="button"
                          onClick={() => setSelectedRole(role.value)}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer group ${
                            isSelected
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-md'
                              : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 dark:hover:border-teal-700'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="role-selected"
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center"
                            >
                              <Check className="w-3 h-3 text-white" />
                            </motion.div>
                          )}
                          <div
                            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-sm`}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {role.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {role.desc}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Step 1: Personal Details */}
              {step === 1 && (
                <motion.div
                  key="details"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold">Your Details</h2>
                    <p className="text-sm text-muted-foreground">
                      Tell us about yourself
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        Full Name <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="John Doe"
                          className="pl-10"
                          value={form.name}
                          onChange={(e) => updateField('name', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reg-email">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-10"
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="mobile">
                        Mobile Number <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="mobile"
                          placeholder="9876543210"
                          className="pl-10"
                          value={form.mobileNo}
                          onChange={(e) => updateField('mobileNo', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={form.gender}
                        onValueChange={(val) => updateField('gender', val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Password */}
              {step === 2 && (
                <motion.div
                  key="password"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="text-center mb-2">
                    <h2 className="text-lg font-semibold">Set Password</h2>
                    <p className="text-sm text-muted-foreground">
                      Create a strong password for your account
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Min 6 characters"
                          className="pl-10 pr-10"
                          value={form.password}
                          onChange={(e) => updateField('password', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {/* Strength bar */}
                      {form.password && (
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            {strength.segments.map((filled, i) => (
                              <div
                                key={i}
                                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                                  filled ? strength.color : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            ))}
                          </div>
                          <p className={`text-xs font-medium ${
                            strength.score <= 1 ? 'text-red-500' : strength.score === 2 ? 'text-amber-500' : 'text-teal-500'
                          }`}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-password"
                          type={showConfirm ? 'text' : 'password'}
                          placeholder="Re-enter password"
                          className="pl-10 pr-10"
                          value={form.confirmPassword}
                          onChange={(e) => updateField('confirmPassword', e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {form.confirmPassword && form.password !== form.confirmPassword && (
                        <p className="text-xs text-red-500">Passwords do not match</p>
                      )}
                    </div>

                    {/* Terms */}
                    <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-950/20 p-3">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          id="terms"
                          checked={termsAccepted}
                          onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                          className="mt-0.5"
                        />
                        <Label htmlFor="terms" className="text-xs font-normal leading-relaxed cursor-pointer">
                          I agree to the{' '}
                          <span className="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer">
                            Terms of Service
                          </span>{' '}
                          and{' '}
                          <span className="text-teal-600 dark:text-teal-400 font-medium hover:underline cursor-pointer">
                            Privacy Policy
                          </span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="flex-1 cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {step < 2 ? (
                <Button
                  type="button"
                  onClick={goNext}
                  className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 relative overflow-hidden bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer"
                >
                  {/* Shimmer effect */}
                  <span className="absolute inset-0 overflow-hidden">
                    <span className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </span>
                  <span className="relative flex items-center">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </span>
                </Button>
              )}
            </div>

            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style dangerouslySetInnerHTML={{ __html: "@keyframes shimmer { 100% { transform: translateX(100%); } }" }} />
    </div>
  );
}
