'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Users,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ── Types ──────────────────────────────────────────────────────────────────

interface EarningsData {
  totalEarnings: number
  totalConsultations: number
  averagePerConsultation: number
  todayEarnings: number
  todayConsultations: number
  earningsByDay: {
    date: string
    label: string
    earnings: number
    consultations: number
  }[]
  recentTransactions: {
    id: string
    appointmentNo: string
    patientName: string
    appointmentCharge: number
    bookingDate: string
    disease: string
  }[]
}

type Period = 'week' | 'month' | 'year'

// ── Helpers ──────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string): string {
  try {
    return format(new Date(dateStr), 'dd MMM yyyy')
  } catch {
    return dateStr
  }
}

// ── Animation Variants ───────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' },
  }),
}

const barVariants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scaleY: 1,
    transition: { delay: i * 0.03, duration: 0.3, ease: 'easeOut' },
  }),
}

// ── Component ─────────────────────────────────────────────────────────────

export default function DoctorEarningsPage() {
  const [period, setPeriod] = useState<Period>('month')

  const { data, isLoading, isError } = useQuery<EarningsData>({
    queryKey: ['doctor-earnings', period],
    queryFn: () =>
      fetch(`/api/dashboard/doctor/earnings?period=${period}`).then((r) => {
        if (!r.ok) throw new Error('Failed to fetch')
        return r.json()
      }),
  })

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your consultation revenue</p>
          </div>
        </div>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-10 w-10 mb-3 text-destructive" />
            <p className="text-sm font-medium">Failed to load earnings data</p>
            <p className="text-xs mt-1">Please try again later</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Find insights
  const peakDay = data?.earningsByDay?.reduce(
    (max, d) => (d.earnings > max.earnings ? d : max),
    { date: '', label: '', earnings: 0, consultations: 0 }
  )
  const busiestDay = data?.earningsByDay?.reduce(
    (max, d) => (d.consultations > max.consultations ? d : max),
    { date: '', label: '', earnings: 0, consultations: 0 }
  )

  const maxEarnings = Math.max(...(data?.earningsByDay?.map((d) => d.earnings) || [1]), 1)

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Header + Period Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
            <p className="text-sm text-muted-foreground">Track your consultation revenue</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
            {([
              { key: 'week' as Period, label: 'This Week' },
              { key: 'month' as Period, label: 'This Month' },
              { key: 'year' as Period, label: 'This Year' },
            ]).map((p) => (
              <Button
                key={p.key}
                size="sm"
                variant={period === p.key ? 'default' : 'ghost'}
                onClick={() => setPeriod(p.key)}
                className="text-xs font-medium rounded-md px-3"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
                  </div>
                  <div className="mt-3 h-8 w-24 animate-pulse rounded bg-muted" />
                  <div className="mt-1 h-4 w-28 animate-pulse rounded bg-muted" />
                </div>
              ))
            : [
                {
                  title: 'Total Earnings',
                  value: formatCurrency(data?.totalEarnings ?? 0),
                  icon: IndianRupee,
                  gradient: 'from-emerald-500 to-emerald-600',
                  iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
                  iconColor: 'text-emerald-600 dark:text-emerald-400',
                  trend: data?.todayEarnings
                    ? { value: Math.round(((data?.todayEarnings || 0) / Math.max(data?.totalEarnings, 1)) * 100), label: 'today' }
                    : undefined,
                  isPositive: true,
                },
                {
                  title: 'Total Consultations',
                  value: String(data?.totalConsultations ?? 0),
                  icon: Users,
                  gradient: 'from-teal-500 to-teal-600',
                  iconBg: 'bg-teal-100 dark:bg-teal-900/50',
                  iconColor: 'text-teal-600 dark:text-teal-400',
                  trend: data?.todayConsultations
                    ? { value: data.todayConsultations, label: 'today' }
                    : undefined,
                  isPositive: true,
                },
                {
                  title: 'Avg. Per Consultation',
                  value: formatCurrency(data?.averagePerConsultation ?? 0),
                  icon: BarChart3,
                  gradient: 'from-amber-500 to-amber-600',
                  iconBg: 'bg-amber-100 dark:bg-amber-900/50',
                  iconColor: 'text-amber-600 dark:text-amber-400',
                },
                {
                  title: "Today's Earnings",
                  value: formatCurrency(data?.todayEarnings ?? 0),
                  icon: TrendingUp,
                  gradient: 'from-violet-500 to-violet-600',
                  iconBg: 'bg-violet-100 dark:bg-violet-900/50',
                  iconColor: 'text-violet-600 dark:text-violet-400',
                  subtitle: `${data?.todayConsultations ?? 0} consultations`,
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -2 }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-lg"
                >
                  <div
                    className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r ${card.gradient}`}
                  />
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                      {card.subtitle && (
                        <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                      )}
                      {card.trend && (
                        <div className="flex items-center gap-1">
                          {card.isPositive ? (
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                          )}
                          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {card.trend.value}
                          </span>
                          <span className="text-xs text-muted-foreground">{card.trend.label}</span>
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}
                    >
                      <card.icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
        </div>

        {/* Chart + Insights */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                Daily Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-end gap-2 h-64">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 animate-pulse rounded-t-md bg-muted"
                      style={{ height: `${30 + Math.random() * 60}%` }}
                    />
                  ))}
                </div>
              ) : !data?.earningsByDay?.length ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <BarChart3 className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">No earnings data for this period</p>
                </div>
              ) : (
                <div className="h-64">
                  <div className="flex items-end gap-[3px] h-52">
                    {data.earningsByDay.map((day, i) => {
                      const heightPct =
                        maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0
                      return (
                        <Tooltip key={day.date}>
                          <TooltipTrigger asChild>
                            <motion.div
                              custom={i}
                              variants={barVariants}
                              initial="hidden"
                              animate="visible"
                              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
                            >
                              <div
                                className="w-full rounded-t-sm bg-gradient-to-t from-teal-600 to-teal-400 hover:from-teal-700 hover:to-teal-500 transition-colors cursor-pointer"
                                style={{
                                  height: `${Math.max(heightPct, 2)}%`,
                                }}
                              />
                            <span className="text-[9px] text-muted-foreground mt-1 truncate w-full text-center hidden sm:block">
                              {day.label}
                            </span>
                            <span className="text-[8px] text-muted-foreground mt-0.5 truncate w-full text-center sm:hidden">
                              {day.label.slice(0, 2)}
                            </span>
                            </motion.div>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-semibold">{formatDate(day.date)}</p>
                            <p>{formatCurrency(day.earnings)}</p>
                            <p className="text-muted-foreground">
                              {day.consultations} consultation{day.consultations !== 1 ? 's' : ''}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-500" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                      <div className="h-8 w-full animate-pulse rounded-lg bg-muted" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Peak Earning Day */}
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                      Peak Earning Day
                    </div>
                    {peakDay && peakDay.earnings > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(peakDay.earnings)}
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {formatDate(peakDay.date)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No earnings this period</p>
                    )}
                  </div>

                  {/* Busiest Day */}
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <Flame className="h-3.5 w-3.5 text-amber-500" />
                      Busiest Day
                    </div>
                    {busiestDay && busiestDay.consultations > 0 ? (
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                          {busiestDay.consultations} consult.
                        </span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {formatDate(busiestDay.date)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No consultations this period</p>
                    )}
                  </div>

                  {/* Today Summary */}
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <Clock className="h-3.5 w-3.5 text-violet-500" />
                      Today&apos;s Summary
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-sm font-semibold">{formatCurrency(data?.todayEarnings ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Consultations</p>
                        <p className="text-sm font-semibold">{data?.todayConsultations ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Period Summary */}
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                      <Calendar className="h-3.5 w-3.5 text-teal-500" />
                      Period Summary
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Revenue</p>
                        <p className="text-sm font-semibold">{formatCurrency(data?.totalEarnings ?? 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Consultations</p>
                        <p className="text-sm font-semibold">{data?.totalConsultations ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-16 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-6 w-20 animate-pulse rounded-full bg-muted ml-auto" />
                  </div>
                ))}
              </div>
            ) : !data?.recentTransactions?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <IndianRupee className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm font-medium">No transactions yet</p>
                <p className="text-xs mt-1">Completed consultations will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Appointment #</TableHead>
                      <TableHead className="text-xs">Patient</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">Disease</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                      <TableHead className="text-xs text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentTransactions.map((tx, i) => (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="text-xs font-mono py-3">
                          {tx.appointmentNo || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium py-3">
                          {tx.patientName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell py-3">
                          {tx.disease || '—'}
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 text-right py-3">
                          {formatCurrency(tx.appointmentCharge)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden md:table-cell py-3">
                          {formatDate(tx.bookingDate)}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 hover:bg-emerald-100 text-[10px] px-2 py-0">
                            Completed
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
