'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Stethoscope,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Shield,
  UserCog,
  Heart,
  Building2,
  HeadphonesIcon,
  UserCheck,
  Pill,
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
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';

const DEMO_CREDENTIALS = [
  { email: 'admin@doctorooms.com', password: 'admin123', role: 'Admin', icon: Shield, color: 'border-red-400 bg-red-50 dark:bg-red-950/30' },
  { email: 'rajesh@doctorooms.com', password: 'doctor123', role: 'Doctor', icon: UserCog, color: 'border-teal-400 bg-teal-50 dark:bg-teal-950/30' },
  { email: 'rahul@doctorooms.com', password: 'patient123', role: 'Patient', icon: Heart, color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' },
  { email: 'city@doctorooms.com', password: 'hospital123', role: 'Hospital', icon: Building2, color: 'border-amber-400 bg-amber-50 dark:bg-amber-950/30' },
  { email: 'meera@doctorooms.com', password: 'receptionist123', role: 'Receptionist', icon: HeadphonesIcon, color: 'border-pink-400 bg-pink-50 dark:bg-pink-950/30' },
  { email: 'vikram@doctorooms.com', password: 'assistant123', role: 'Assistant', icon: UserCheck, color: 'border-violet-400 bg-violet-50 dark:bg-violet-950/30' },
  { email: 'kavita@doctorooms.com', password: 'pharmacist123', role: 'Pharmacist', icon: Pill, color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/30' },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.message || 'Invalid credentials');
        setLoading(false);
        return;
      }
      // Store user in Zustand (memory) + redirect
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push(`/dashboard/${data.user.role}`);
    } catch {
      toast.error('Network error. Please try again.');
      setLoading(false);
    }
  };

  const fillCredentials = (cred: (typeof DEMO_CREDENTIALS)[number]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    toast.info(`Filled credentials for ${cred.role}`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, #0d9488 1px, transparent 1px)',
          backgroundSize: '16px 16px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/60 dark:from-gray-950 dark:via-gray-900 dark:to-teal-950/20" />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-col items-center text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <Stethoscope className="w-14 h-14 text-white" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">Doctorooms</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-sm">
            Your Health, Our Priority. Access quality healthcare with seamless appointment management.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            {[{ num: '500+', label: 'Doctors' }, { num: '50K+', label: 'Patients' }, { num: '100+', label: 'Hospitals' }].map((stat) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>
                <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{stat.num}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md mx-auto"
        >
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="lg:hidden flex justify-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/30">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </motion.div>

          <Card className="border-0 shadow-xl shadow-teal-900/5 dark:shadow-teal-900/20">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">Sign in to your Doctorooms account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={0} className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@doctorooms.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                </motion.div>
                <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={1} className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="pl-10 pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>
                <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={2} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                    <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                  </div>
                  <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 hover:underline">Forgot password?</Link>
                </motion.div>
                <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={3}>
                  <Button type="submit" className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-600/25 cursor-pointer" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Signing in...</span>
                    ) : (
                      <span className="flex items-center gap-2"><LogIn className="h-4 w-4" />Sign In</span>
                    )}
                  </Button>
                </motion.div>
              </form>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Don&apos;t have an account?{' '}<Link href="/register" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium hover:underline">Create account</Link></p>
              </div>
            </CardContent>
          </Card>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-6">
            <p className="text-xs text-center text-muted-foreground mb-3 font-medium uppercase tracking-wider">Demo Credentials — Click to fill</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_CREDENTIALS.map((cred, i) => {
                const Icon = cred.icon;
                return (
                  <motion.button key={cred.role} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 + i * 0.05 }}
                    onClick={() => fillCredentials(cred)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border-l-4 ${cred.color} hover:shadow-md transition-all duration-200 cursor-pointer text-left group`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-teal-600 dark:group-hover:text-teal-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{cred.role}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{cred.email}</div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
