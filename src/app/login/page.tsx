'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/lib/auth-store';
import {
  Stethoscope,
  Shield,
  Heart,
  Building2,
  HeadphonesIcon,
  UserCheck,
  Pill,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const ROLES = [
  {
    role: 'patient',
    label: 'Patient',
    description: 'Book appointments, view prescriptions & health records',
    icon: Heart,
    color: 'from-emerald-500 to-teal-500',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderHover: 'hover:border-emerald-400',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    description: 'Manage patients, prescriptions, schedules & earnings',
    icon: Stethoscope,
    color: 'from-teal-500 to-cyan-500',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
    borderHover: 'hover:border-teal-400',
    textColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    role: 'receptionist',
    label: 'Receptionist',
    description: 'Handle walk-ins, manage bookings & patient queue',
    icon: HeadphonesIcon,
    color: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50 dark:bg-pink-950/30',
    borderHover: 'hover:border-pink-400',
    textColor: 'text-pink-600 dark:text-pink-400',
  },
  {
    role: 'hospital',
    label: 'Hospital',
    description: 'Manage doctors, hospital appointments & inquiries',
    icon: Building2,
    color: 'from-amber-500 to-orange-500',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
    borderHover: 'hover:border-amber-400',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    role: 'assistant',
    label: 'Assistant',
    description: 'Help doctor manage patients, appointments & follow-ups',
    icon: UserCheck,
    color: 'from-violet-500 to-purple-500',
    bgLight: 'bg-violet-50 dark:bg-violet-950/30',
    borderHover: 'hover:border-violet-400',
    textColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    role: 'pharmacist',
    label: 'Pharmacist',
    description: 'Manage medicines & view prescriptions',
    icon: Pill,
    color: 'from-orange-500 to-red-500',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
    borderHover: 'hover:border-orange-400',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    role: 'admin',
    label: 'Admin',
    description: 'Full platform control — users, settings & analytics',
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    bgLight: 'bg-red-50 dark:bg-red-950/30',
    borderHover: 'hover:border-red-400',
    textColor: 'text-red-600 dark:text-red-400',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const handleRoleClick = async (role: string) => {
    setLoading(role);
    try {
      const res = await fetch('/api/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        console.error('Dev login failed:', await res.text());
        return;
      }
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        window.location.href = `/dashboard/${role}`;
      }
    } catch (err) {
      console.error('Dev login error:', err);
    } finally {
      setLoading(null);
    }
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

      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex mb-5"
          >
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-teal-500/30">
              <Stethoscope className="w-10 h-10 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Doctorooms
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
            Select a role to explore the dashboard
          </p>
          <span className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
            Dev Mode — Auth Disabled
          </span>
        </motion.div>

        {/* Role Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {ROLES.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: 'easeOut' }}
                onClick={() => handleRoleClick(item.role)}
                className={`group relative flex flex-col items-start gap-3 p-5 rounded-xl border-2 border-transparent ${item.borderHover} bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/20 transition-all duration-300 cursor-pointer text-left`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                    {item.label}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="mt-auto pt-2 flex items-center gap-1 text-sm font-medium text-gray-400 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  {loading === item.role ? (
                    <span className="flex items-center gap-1">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Entering...
                    </span>
                  ) : (
                    <>
                      Enter Dashboard
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>

                {/* Hover gradient border effect */}
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </motion.button>
            );
          })}
        </div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8"
        >
          Authentication is disabled for development. Click any role to access its dashboard.
        </motion.p>
      </div>
    </div>
  );
}
