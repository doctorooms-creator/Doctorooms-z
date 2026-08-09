'use client'

import { motion } from 'framer-motion'
import {
  Heart,
  Target,
  Eye,
  Award,
  Users,
  Stethoscope,
  ShieldCheck,
  Clock,
  Headphones,
  Globe,
  UserCheck,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PublicLayout } from '@/components/layout/public-layout'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const stats = [
  { label: 'Active Doctors', value: '500+', icon: Stethoscope, color: 'text-teal-600 dark:text-teal-400' },
  { label: 'Hospitals', value: '150+', icon: Heart, color: 'text-rose-600 dark:text-rose-400' },
  { label: 'Happy Patients', value: '50K+', icon: Users, color: 'text-amber-600 dark:text-amber-400' },
  { label: 'Appointments', value: '100K+', icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400' },
]

const team = [
  { name: 'Dr. Rajesh Sharma', role: 'Founder & CEO', color: 'from-teal-400 to-teal-600' },
  { name: 'Dr. Priya Patel', role: 'Chief Medical Officer', color: 'from-emerald-400 to-emerald-600' },
  { name: 'Amit Verma', role: 'Chief Technology Officer', color: 'from-cyan-400 to-cyan-600' },
  { name: 'Dr. Sneha Reddy', role: 'Head of Operations', color: 'from-amber-400 to-amber-600' },
  { name: 'Vikram Singh', role: 'VP of Partnerships', color: 'from-violet-400 to-violet-600' },
  { name: 'Dr. Ananya Gupta', role: 'Head of Research', color: 'from-rose-400 to-rose-600' },
]

const whyChooseUs = [
  {
    icon: ShieldCheck,
    title: 'Verified Doctors',
    description: 'Every doctor on our platform is thoroughly verified with credentials checked and validated.',
  },
  {
    icon: Clock,
    title: 'Easy Scheduling',
    description: 'Book appointments in seconds with our intuitive scheduling system and real-time availability.',
  },
  {
    icon: Headphones,
    title: '24/7 Support',
    description: 'Our dedicated support team is available round the clock to assist you with any queries.',
  },
  {
    icon: Globe,
    title: 'Pan-India Coverage',
    description: 'Access healthcare professionals from every corner of India, across all specializations.',
  },
  {
    icon: UserCheck,
    title: 'Personalized Care',
    description: 'Get matched with doctors who specialize in your specific health needs and conditions.',
  },
  {
    icon: Award,
    title: 'Quality Assurance',
    description: 'We maintain the highest standards of healthcare quality with regular audits and feedback.',
  },
]

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <span>
      {value.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function AboutPage() {
  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-40 w-40 rounded-full bg-white" />
          <div className="absolute bottom-10 right-10 h-60 w-60 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 h-24 w-24 rounded-full bg-white" />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              About <span className="text-teal-200">Doctorooms</span>
            </h1>
            <p className="text-lg md:text-xl text-teal-100 leading-relaxed max-w-2xl mx-auto">
              We are on a mission to make quality healthcare accessible to everyone. Doctorooms
              connects patients with verified doctors, simplifying the way India accesses medical care.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="container mx-auto px-4 py-16">
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div variants={fadeIn}>
            <Card className="h-full border-t-4 border-t-teal-500">
              <CardContent className="p-6 md:p-8">
                <div className="h-14 w-14 rounded-xl bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4">
                  <Target className="h-7 w-7 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To democratize healthcare access by bridging the gap between patients and qualified
                  medical professionals through innovative technology and compassionate service.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card className="h-full border-t-4 border-t-emerald-500">
              <CardContent className="p-6 md:p-8">
                <div className="h-14 w-14 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mb-4">
                  <Eye className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become India&apos;s most trusted healthcare platform where every individual can
                  find the right doctor, at the right time, with a seamless and transparent experience.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card className="h-full border-t-4 border-t-amber-500">
              <CardContent className="p-6 md:p-8">
                <div className="h-14 w-14 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center mb-4">
                  <Heart className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Our Values</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trust, transparency, and patient-centricity drive everything we do. We believe in
                  empowering patients with information and choices for better health outcomes.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      <Separator className="container mx-auto" />

      {/* Statistics Counter */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={fadeIn}>
              <div className="text-center">
                <stat.icon className={`h-8 w-8 ${stat.color} mx-auto mb-3`} />
                <p className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  <AnimatedCounter value={parseInt(stat.value.replace(/[^0-9]/g, ''), 10)} suffix={stat.value.replace(/[0-9]/g, '')} />
                </p>
                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Separator className="container mx-auto" />

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div {...fadeIn} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Meet Our Team</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The passionate people behind Doctorooms who work tirelessly to improve healthcare access.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {team.map((member) => (
            <motion.div key={member.name} variants={fadeIn}>
              <Card className="group hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-6">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarFallback
                      className={`bg-gradient-to-br ${member.color} text-white text-xl font-bold`}
                    >
                      {member.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mb-1">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <Separator className="container mx-auto" />

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 py-16">
        <motion.div {...fadeIn} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Why Choose Doctorooms</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            We go above and beyond to ensure the best healthcare experience for you and your family.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {whyChooseUs.map((item) => (
            <motion.div key={item.title} variants={fadeIn}>
              <Card className="h-full group hover:shadow-md hover:border-l-teal-500 hover:border-l-4 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-4 group-hover:bg-teal-100 dark:group-hover:bg-teal-950/50 transition-colors">
                    <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-semibold text-base mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </PublicLayout>
  )
}
