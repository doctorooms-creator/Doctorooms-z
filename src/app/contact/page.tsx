'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { PublicLayout } from '@/components/layout/public-layout'

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
}

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } },
}

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    details: 'support@doctorooms.com',
    subtitle: 'We reply within 24 hours',
    color: 'bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400',
  },
  {
    icon: Phone,
    title: 'Call Us',
    details: '+91 98765 43210',
    subtitle: 'Mon-Sat, 9 AM - 8 PM',
    color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: MapPin,
    title: 'Visit Us',
    details: '123 Healthcare Avenue, Sector 15',
    subtitle: 'Gurugram, Haryana 122001, India',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
  },
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Please fill in name, email, and message')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit')
      }
      toast.success('Your message has been sent successfully!')
      setSubmitted(true)
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      {/* Hero Banner */}
      <section className="bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <motion.div {...fadeIn} className="max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Contact Us</h1>
            <p className="text-teal-100 text-lg">
              Have a question or need help? We&apos;d love to hear from you.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Contact Form */}
          <motion.div {...fadeIn} className="lg:col-span-2">
            <Card>
              <CardContent className="p-6 md:p-8">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="h-16 w-16 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-8 w-8 text-teal-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground mb-6">
                      Thank you for reaching out. We&apos;ll get back to you within 24 hours.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setSubmitted(false)}
                      className="border-teal-200 text-teal-700 hover:bg-teal-50"
                    >
                      Send Another Message
                    </Button>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">Send us a Message</h2>
                        <p className="text-sm text-muted-foreground">Fill in the form below and we'll respond promptly</p>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="name">
                            Name <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="name"
                            name="name"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            Email <span className="text-rose-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={handleChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            name="subject"
                            placeholder="What is this about?"
                            value={formData.subject}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">
                          Message <span className="text-rose-500">*</span>
                        </Label>
                        <Textarea
                          id="message"
                          name="message"
                          placeholder="Tell us more about your inquiry..."
                          rows={5}
                          value={formData.message}
                          onChange={handleChange}
                          required
                          className="resize-none"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white h-11 px-8"
                      >
                        {submitting ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </div>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Contact Info Cards */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-4"
            >
              {contactInfo.map((info) => (
                <motion.div key={info.title} variants={fadeIn}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-lg ${info.color} flex items-center justify-center shrink-0`}>
                        <info.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-0.5">{info.title}</h4>
                        <p className="text-sm font-medium">{info.details}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{info.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Office Hours */}
            <motion.div {...fadeIn} transition={{ delay: 0.3 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-teal-500" />
                    <h4 className="font-semibold text-sm">Office Hours</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monday - Friday</span>
                      <span className="font-medium">9:00 AM - 8:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Saturday</span>
                      <span className="font-medium">9:00 AM - 5:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Sunday</span>
                      <span className="font-medium text-rose-500">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map Placeholder */}
            <motion.div {...fadeIn} transition={{ delay: 0.4 }}>
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 flex flex-col items-center justify-center gap-2">
                  <MapPin className="h-8 w-8 text-teal-400" />
                  <p className="text-sm text-muted-foreground font-medium">Map View</p>
                  <p className="text-xs text-muted-foreground">Gurugram, Haryana</p>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </PublicLayout>
  )
}
