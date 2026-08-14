'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Thermometer,
  Heart,
  Wind,
  Droplets,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { VITAL_THRESHOLDS } from '@/lib/ipd-utils'
import { format, parseISO, differenceInHours, isSameDay } from 'date-fns'

// ============ TYPES ============

interface VitalRecord {
  id: string
  temperature: number
  pulse: number
  spo2: number
  bpSystolic: number
  bpDiastolic: number
  respiratoryRate: number
  inputMl: number
  urineMl: number
  outputMl: number
  patientStatus: string
  ventilatorOn: boolean
  oxygenLiters: number
  infusionPump: string
  rbs: number | null
  remarks: string
  recordedAt: string
  recordedByName?: string
}

interface VitalTrendChartsProps {
  vitals: VitalRecord[]
}

// ============ CHART CONSTANTS ============

const CHART_HEIGHT = 140
const CHART_PADDING = { top: 8, right: 12, bottom: 28, left: 40 }
const CHART_INNER_W = 400
const CHART_INNER_H = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom

// Severity colors
const COLORS = {
  normal: '#14b8a6',    // teal-500
  warning: '#f59e0b',   // amber-500
  critical: '#ef4444',  // red-500
  line: '#14b8a6',
  gridLine: 'hsl(var(--border))',
  label: 'hsl(var(--muted-foreground))',
  bg: 'hsl(var(--card))',
  normalFill: 'hsl(var(--muted))',
}

const DARK_COLORS = {
  normal: '#2dd4bf',    // teal-400
  warning: '#fbbf24',   // amber-400
  critical: '#f87171',  // red-400
  line: '#2dd4bf',
  gridLine: 'hsl(var(--border))',
  label: 'hsl(var(--muted-foreground))',
  bg: 'hsl(var(--card))',
  normalFill: 'hsl(0 0% 20% / 0.3)',
}

// ============ HELPERS ============

function getSeverityColor(value: number, thresholds: { normalLow?: number; normalHigh: number; criticalLow?: number; criticalHigh?: number }) {
  if (thresholds.criticalHigh !== undefined && value >= thresholds.criticalHigh) return COLORS.critical
  if (thresholds.criticalLow !== undefined && value <= thresholds.criticalLow) return COLORS.critical
  if (thresholds.normalHigh !== undefined && value >= thresholds.normalHigh) return COLORS.warning
  if (thresholds.normalLow !== undefined && value <= thresholds.normalLow) return COLORS.warning
  return COLORS.normal
}

function getTimeLabel(dateStr: string, allDates: string[]): string {
  const d = parseISO(dateStr)
  const spansMultipleDays = allDates.some((s) => !isSameDay(parseISO(s), parseISO(allDates[0])))
  if (spansMultipleDays) {
    return format(d, 'dd/MM HH:mm')
  }
  return format(d, 'HH:mm')
}

function pickLabelStep(count: number): number {
  if (count <= 6) return 1
  if (count <= 12) return 2
  if (count <= 20) return 3
  return Math.ceil(count / 8)
}

function getMinMax(values: number[], pad: number = 0.1): { min: number; max: number } {
  if (values.length === 0) return { min: 0, max: 100 }
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)
  const range = rawMax - rawMin || 1
  return {
    min: Math.floor((rawMin - range * pad) * 2) / 2,
    max: Math.ceil((rawMax + range * pad) * 2) / 2,
  }
}

function toSvgX(index: number, total: number): number {
  if (total <= 1) return CHART_PADDING.left + CHART_INNER_W / 2
  return CHART_PADDING.left + (index / (total - 1)) * CHART_INNER_W
}

function toSvgY(value: number, min: number, max: number): number {
  if (max === min) return CHART_PADDING.top + CHART_INNER_H / 2
  return CHART_PADDING.top + CHART_INNER_H - ((value - min) / (max - min)) * CHART_INNER_H
}

// ============ SVG CHART COMPONENTS ============

interface SingleLineChartProps {
  data: { time: string; value: number }[]
  normalLow?: number
  normalHigh: number
  criticalLow?: number
  criticalHigh?: number
  yMin?: number
  yMax?: number
  unit: string
  lineColor: string
  gradientId: string
  feverLine?: number
  redZoneBelow?: number
}

function SingleLineChart({
  data,
  normalLow,
  normalHigh,
  criticalLow,
  criticalHigh,
  yMin: forcedYMin,
  yMax: forcedYMax,
  unit,
  lineColor,
  gradientId,
  feverLine,
  redZoneBelow,
}: SingleLineChartProps) {
  const values = data.map((d) => d.value).filter((v) => v > 0)
  const { min, max } = forcedYMin !== undefined && forcedYMax !== undefined
    ? { min: forcedYMin, max: forcedYMax }
    : getMinMax(values, 0.15)

  const allDates = data.map((d) => d.time)
  const labelStep = pickLabelStep(data.length)

  return (
    <svg viewBox={`0 0 ${CHART_PADDING.left + CHART_INNER_W + CHART_PADDING.right} ${CHART_HEIGHT}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const val = min + ((max - min) / 4) * i
        const y = toSvgY(val, min, max)
        return (
          <g key={i}>
            <line x1={CHART_PADDING.left} y1={y} x2={CHART_PADDING.left + CHART_INNER_W} y2={y} stroke={COLORS.gridLine} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={CHART_PADDING.left - 4} y={y + 3} textAnchor="end" fill={COLORS.label} fontSize={7}>
              {Math.round(val)}
            </text>
          </g>
        )
      })}

      {/* Red zone below critical */}
      {redZoneBelow !== undefined && (
        <rect
          x={CHART_PADDING.left}
          y={toSvgY(redZoneBelow, min, max)}
          width={CHART_INNER_W}
          height={toSvgY(min, min, max) - toSvgY(redZoneBelow, min, max)}
          fill="#ef4444" opacity={0.07} rx={2}
        />
      )}

      {/* Normal range shading */}
      {normalLow !== undefined && (
        <rect
          x={CHART_PADDING.left}
          y={toSvgY(normalHigh, min, max)}
          width={CHART_INNER_W}
          height={toSvgY(normalLow, min, max) - toSvgY(normalHigh, min, max)}
          fill={COLORS.normal} opacity={0.06} rx={2}
        />
      )}

      {/* Critical high line */}
      {criticalHigh !== undefined && (
        <line
          x1={CHART_PADDING.left} y1={toSvgY(criticalHigh, min, max)}
          x2={CHART_PADDING.left + CHART_INNER_W} y2={toSvgY(criticalHigh, min, max)}
          stroke={COLORS.critical} strokeWidth={1} strokeDasharray="6,3" opacity={0.7}
        />
      )}

      {/* Critical low line */}
      {criticalLow !== undefined && (
        <line
          x1={CHART_PADDING.left} y1={toSvgY(criticalLow, min, max)}
          x2={CHART_PADDING.left + CHART_INNER_W} y2={toSvgY(criticalLow, min, max)}
          stroke={COLORS.critical} strokeWidth={1} strokeDasharray="6,3" opacity={0.7}
        />
      )}

      {/* Fever line */}
      {feverLine !== undefined && (
        <line
          x1={CHART_PADDING.left} y1={toSvgY(feverLine, min, max)}
          x2={CHART_PADDING.left + CHART_INNER_W} y2={toSvgY(feverLine, min, max)}
          stroke={COLORS.warning} strokeWidth={1} strokeDasharray="4,4" opacity={0.7}
        />
      )}

      {/* Area fill under line */}
      {data.length >= 2 && (
        <polygon
          points={
            data
              .map((d, i) => `${toSvgX(i, data.length)},${toSvgY(d.value, min, max)}`)
              .join(' ') +
            ` ${toSvgX(data.length - 1, data.length)},${toSvgY(min, min, max)}` +
            ` ${toSvgX(0, data.length)},${toSvgY(min, min, max)}`
          }
          fill={`url(#${gradientId})`}
        />
      )}

      {/* Line */}
      {data.length >= 2 && (
        <polyline
          points={data.map((d, i) => `${toSvgX(i, data.length)},${toSvgY(d.value, min, max)}`).join(' ')}
          fill="none" stroke={lineColor} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
        />
      )}

      {/* Data points */}
      {data.map((d, i) => {
        const color = getSeverityColor(d.value, {
          normalLow,
          normalHigh,
          criticalLow,
          criticalHigh,
        })
        return (
          <circle
            key={i}
            cx={toSvgX(i, data.length)}
            cy={toSvgY(d.value, min, max)}
            r={data.length <= 12 ? 3.5 : 2.5}
            fill={color}
            stroke="hsl(var(--card))"
            strokeWidth={1.5}
          />
        )
      })}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % labelStep === 0 ? (
          <text
            key={`lbl-${i}`}
            x={toSvgX(i, data.length)}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fill={COLORS.label}
            fontSize={6.5}
          >
            {getTimeLabel(d.time, allDates)}
          </text>
        ) : null
      )}
    </svg>
  )
}

// ============ BP DUAL LINE CHART ============

interface BPChartProps {
  data: { time: string; systolic: number; diastolic: number }[]
}

function BPChart({ data }: BPChartProps) {
  const sysVals = data.map((d) => d.systolic).filter((v) => v > 0)
  const diaVals = data.map((d) => d.diastolic).filter((v) => v > 0)
  const allVals = [...sysVals, ...diaVals]
  const { min, max } = getMinMax(allVals, 0.12)
  const yMin = Math.min(min, 50)
  const yMax = Math.max(max, 200)

  const allDates = data.map((d) => d.time)
  const labelStep = pickLabelStep(data.length)

  return (
    <svg viewBox={`0 0 ${CHART_PADDING.left + CHART_INNER_W + CHART_PADDING.right} ${CHART_HEIGHT}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bp-sys-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.normal} stopOpacity={0.2} />
          <stop offset="100%" stopColor={COLORS.normal} stopOpacity={0.01} />
        </linearGradient>
        <linearGradient id="bp-dia-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.01} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => {
        const val = yMin + ((yMax - yMin) / 4) * i
        const y = toSvgY(val, yMin, yMax)
        return (
          <g key={i}>
            <line x1={CHART_PADDING.left} y1={y} x2={CHART_PADDING.left + CHART_INNER_W} y2={y} stroke={COLORS.gridLine} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={CHART_PADDING.left - 4} y={y + 3} textAnchor="end" fill={COLORS.label} fontSize={7}>
              {Math.round(val)}
            </text>
          </g>
        )
      })}

      {/* Normal range shading: 90-140 systolic, 60-90 diastolic */}
      <rect
        x={CHART_PADDING.left}
        y={toSvgY(140, yMin, yMax)}
        width={CHART_INNER_W}
        height={toSvgY(60, yMin, yMax) - toSvgY(140, yMin, yMax)}
        fill={COLORS.normal} opacity={0.06} rx={2}
      />

      {/* Critical high systolic 180 */}
      <line
        x1={CHART_PADDING.left} y1={toSvgY(180, yMin, yMax)}
        x2={CHART_PADDING.left + CHART_INNER_W} y2={toSvgY(180, yMin, yMax)}
        stroke={COLORS.critical} strokeWidth={1} strokeDasharray="6,3" opacity={0.7}
      />
      <text x={CHART_PADDING.left + CHART_INNER_W + 2} y={toSvgY(180, yMin, yMax) + 3} fill={COLORS.critical} fontSize={6}>180</text>

      {/* Critical low 90 */}
      <line
        x1={CHART_PADDING.left} y1={toSvgY(90, yMin, yMax)}
        x2={CHART_PADDING.left + CHART_INNER_W} y2={toSvgY(90, yMin, yMax)}
        stroke={COLORS.critical} strokeWidth={1} strokeDasharray="6,3" opacity={0.7}
      />
      <text x={CHART_PADDING.left + CHART_INNER_W + 2} y={toSvgY(90, yMin, yMax) + 3} fill={COLORS.critical} fontSize={6}>90</text>

      {/* Systolic area fill */}
      {data.length >= 2 && (
        <polygon
          points={
            data.map((d, i) => `${toSvgX(i, data.length)},${toSvgY(d.systolic, yMin, yMax)}`).join(' ') +
            ` ${toSvgX(data.length - 1, data.length)},${toSvgY(yMin, yMin, yMax)}` +
            ` ${toSvgX(0, data.length)},${toSvgY(yMin, yMin, yMax)}`
          }
          fill="url(#bp-sys-grad)"
        />
      )}

      {/* Systolic line */}
      {data.length >= 2 && (
        <polyline
          points={data.map((d, i) => `${toSvgX(i, data.length)},${toSvgY(d.systolic, yMin, yMax)}`).join(' ')}
          fill="none" stroke={COLORS.normal} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
        />
      )}

      {/* Diastolic line */}
      {data.length >= 2 && (
        <polyline
          points={data.map((d, i) => `${toSvgX(i, data.length)},${toSvgY(d.diastolic, yMin, yMax)}`).join(' ')}
          fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="6,3"
        />
      )}

      {/* Systolic points */}
      {data.map((d, i) => {
        const color = getSeverityColor(d.systolic, {
          normalLow: 90, normalHigh: 140, criticalLow: 90, criticalHigh: 180,
        })
        return (
          <circle
            key={`sys-${i}`}
            cx={toSvgX(i, data.length)}
            cy={toSvgY(d.systolic, yMin, yMax)}
            r={data.length <= 12 ? 3.5 : 2.5}
            fill={color}
            stroke="hsl(var(--card))"
            strokeWidth={1.5}
          />
        )
      })}

      {/* Diastolic points */}
      {data.map((d, i) => {
        const color = getSeverityColor(d.diastolic, {
          normalHigh: 90, criticalHigh: 120,
        })
        return (
          <circle
            key={`dia-${i}`}
            cx={toSvgX(i, data.length)}
            cy={toSvgY(d.diastolic, yMin, yMax)}
            r={data.length <= 12 ? 3 : 2}
            fill={color}
            stroke="hsl(var(--card))"
            strokeWidth={1.5}
          />
        )
      })}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % labelStep === 0 ? (
          <text
            key={`lbl-${i}`}
            x={toSvgX(i, data.length)}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fill={COLORS.label}
            fontSize={6.5}
          >
            {getTimeLabel(d.time, allDates)}
          </text>
        ) : null
      )}

      {/* Legend */}
      <circle cx={CHART_PADDING.left + 4} cy={CHART_PADDING.top + 2} r={3} fill={COLORS.normal} />
      <text x={CHART_PADDING.left + 10} y={CHART_PADDING.top + 5} fill={COLORS.label} fontSize={7}>Systolic</text>
      <line x1={CHART_PADDING.left + 48} y1={CHART_PADDING.top + 2} x2={CHART_PADDING.left + 60} y2={CHART_PADDING.top + 2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4,2" />
      <text x={CHART_PADDING.left + 64} y={CHART_PADDING.top + 5} fill={COLORS.label} fontSize={7}>Diastolic</text>
    </svg>
  )
}

// ============ INPUT/OUTPUT BAR CHART ============

interface IOData {
  time: string
  input: number
  urine: number
  otherOutput: number
}

function IOBarChart({ data }: { data: IOData[] }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.input, d.urine, d.otherOutput)), 100)
  const yMax = Math.ceil(maxVal * 1.2 / 50) * 50

  const allDates = data.map((d) => d.time)
  const labelStep = pickLabelStep(data.length)

  return (
    <svg viewBox={`0 0 ${CHART_PADDING.left + CHART_INNER_W + CHART_PADDING.right} ${CHART_HEIGHT}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {Array.from({ length: 4 }).map((_, i) => {
        const val = (yMax / 3) * i
        const y = toSvgY(val, 0, yMax)
        return (
          <g key={i}>
            <line x1={CHART_PADDING.left} y1={y} x2={CHART_PADDING.left + CHART_INNER_W} y2={y} stroke={COLORS.gridLine} strokeWidth={0.5} strokeDasharray="3,3" />
            <text x={CHART_PADDING.left - 4} y={y + 3} textAnchor="end" fill={COLORS.label} fontSize={7}>
              {Math.round(val)}ml
            </text>
          </g>
        )
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barGroupWidth = Math.max(12, Math.min(40, CHART_INNER_W / data.length - 4))
        const barWidth = Math.max(3, barGroupWidth / 3 - 1)
        const cx = toSvgX(i, data.length)
        const x0 = cx - barGroupWidth / 2

        const inputH = (d.input / yMax) * CHART_INNER_H
        const urineH = (d.urine / yMax) * CHART_INNER_H
        const otherH = (d.otherOutput / yMax) * CHART_INNER_H
        const baseY = CHART_PADDING.top + CHART_INNER_H

        return (
          <g key={i}>
            {/* Input bar - green */}
            {d.input > 0 && (
              <rect
                x={x0} y={baseY - inputH} width={barWidth} height={inputH}
                fill="#22c55e" opacity={0.8} rx={1}
              />
            )}
            {/* Urine bar - amber */}
            {d.urine > 0 && (
              <rect
                x={x0 + barWidth + 1} y={baseY - urineH} width={barWidth} height={urineH}
                fill="#f59e0b" opacity={0.8} rx={1}
              />
            )}
            {/* Other output bar - red */}
            {d.otherOutput > 0 && (
              <rect
                x={x0 + (barWidth + 1) * 2} y={baseY - otherH} width={barWidth} height={otherH}
                fill="#ef4444" opacity={0.7} rx={1}
              />
            )}
          </g>
        )
      })}

      {/* X-axis labels */}
      {data.map((d, i) =>
        i % labelStep === 0 ? (
          <text
            key={`lbl-${i}`}
            x={toSvgX(i, data.length)}
            y={CHART_HEIGHT - 6}
            textAnchor="middle"
            fill={COLORS.label}
            fontSize={6.5}
          >
            {getTimeLabel(d.time, allDates)}
          </text>
        ) : null
      )}

      {/* Legend */}
      <rect x={CHART_PADDING.left + 4} y={CHART_PADDING.top} width={8} height={6} fill="#22c55e" opacity={0.8} rx={1} />
      <text x={CHART_PADDING.left + 15} y={CHART_PADDING.top + 6} fill={COLORS.label} fontSize={7}>Input</text>
      <rect x={CHART_PADDING.left + 44} y={CHART_PADDING.top} width={8} height={6} fill="#f59e0b" opacity={0.8} rx={1} />
      <text x={CHART_PADDING.left + 55} y={CHART_PADDING.top + 6} fill={COLORS.label} fontSize={7}>Urine</text>
      <rect x={CHART_PADDING.left + 88} y={CHART_PADDING.top} width={8} height={6} fill="#ef4444" opacity={0.7} rx={1} />
      <text x={CHART_PADDING.left + 99} y={CHART_PADDING.top + 6} fill={COLORS.label} fontSize={7}>Output</text>
    </svg>
  )
}

// ============ STATUS INDICATOR ============

function TrendIndicator({ current, previous }: { current: number; previous?: number }) {
  if (!previous || previous === current) {
    return <Minus className="h-3 w-3 text-muted-foreground" />
  }
  if (current > previous) {
    return <ArrowUp className="h-3 w-3 text-amber-500" />
  }
  return <ArrowDown className="h-3 w-3 text-teal-500" />
}

// ============ CHART CARD WRAPPER ============

interface ChartCardProps {
  title: string
  icon: React.ReactNode
  latestValue: string
  latestRaw?: number
  prevRaw?: number
  minVal?: string
  maxVal?: string
  status: 'normal' | 'warning' | 'critical'
  children: React.ReactNode
  delay?: number
  className?: string
}

function ChartCard({ title, icon, latestValue, latestRaw, prevRaw, minVal, maxVal, status, children, delay = 0, className }: ChartCardProps) {
  const statusBadge = {
    normal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay * 0.08, duration: 0.35, ease: 'easeOut' }}
    >
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {latestRaw !== undefined && prevRaw !== undefined && (
              <TrendIndicator current={latestRaw} previous={prevRaw} />
            )}
            <Badge className={cn('text-xs', statusBadge[status])}>
              {latestValue}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {(minVal || maxVal) && (
            <div className="mb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
              {minVal && <span>Min: <strong className="text-foreground">{minVal}</strong></span>}
              {maxVal && <span>Max: <strong className="text-foreground">{maxVal}</strong></span>}
            </div>
          )}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ============ MAIN COMPONENT ============

export default function VitalTrendCharts({ vitals }: VitalTrendChartsProps) {
  const chartData = useMemo(() => {
    // Sort ascending by time
    const sorted = [...vitals].sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())

    // Take last 24 entries for chart readability
    const recent = sorted.slice(-24)

    // BP data
    const bpData = recent
      .filter((v) => v.bpSystolic > 0 && v.bpDiastolic > 0)
      .map((v) => ({ time: v.recordedAt, systolic: v.bpSystolic, diastolic: v.bpDiastolic }))

    // Pulse data
    const pulseData = recent
      .filter((v) => v.pulse > 0)
      .map((v) => ({ time: v.recordedAt, value: v.pulse }))

    // SpO2 data
    const spo2Data = recent
      .filter((v) => v.spo2 > 0)
      .map((v) => ({ time: v.recordedAt, value: v.spo2 }))

    // Temperature data
    const tempData = recent
      .filter((v) => v.temperature > 0)
      .map((v) => ({ time: v.recordedAt, value: v.temperature }))

    // I/O data
    const ioData = recent
      .filter((v) => v.inputMl > 0 || v.urineMl > 0 || v.outputMl > 0)
      .map((v) => ({
        time: v.recordedAt,
        input: v.inputMl,
        urine: v.urineMl,
        otherOutput: Math.max(0, v.outputMl - v.urineMl),
      }))

    // Latest values
    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null

    // Min/Max calculations
    const bpSysVals = sorted.filter((v) => v.bpSystolic > 0).map((v) => v.bpSystolic)
    const bpDiaVals = sorted.filter((v) => v.bpDiastolic > 0).map((v) => v.bpDiastolic)
    const pulseVals = sorted.filter((v) => v.pulse > 0).map((v) => v.pulse)
    const spo2Vals = sorted.filter((v) => v.spo2 > 0).map((v) => v.spo2)
    const tempVals = sorted.filter((v) => v.temperature > 0).map((v) => v.temperature)

    return {
      bpData,
      pulseData,
      spo2Data,
      tempData,
      ioData,
      latest,
      prev,
      stats: {
        bpSysMin: bpSysVals.length > 0 ? Math.min(...bpSysVals) : undefined,
        bpSysMax: bpSysVals.length > 0 ? Math.max(...bpSysVals) : undefined,
        bpDiaMin: bpDiaVals.length > 0 ? Math.min(...bpDiaVals) : undefined,
        bpDiaMax: bpDiaVals.length > 0 ? Math.max(...bpDiaVals) : undefined,
        pulseMin: pulseVals.length > 0 ? Math.min(...pulseVals) : undefined,
        pulseMax: pulseVals.length > 0 ? Math.max(...pulseVals) : undefined,
        spo2Min: spo2Vals.length > 0 ? Math.min(...spo2Vals) : undefined,
        spo2Max: spo2Vals.length > 0 ? Math.max(...spo2Vals) : undefined,
        tempMin: tempVals.length > 0 ? Math.min(...tempVals) : undefined,
        tempMax: tempVals.length > 0 ? Math.max(...tempVals) : undefined,
      },
      hasData: sorted.length >= 2,
    }
  }, [vitals])

  if (!chartData.hasData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Activity className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">At least 2 vital records are needed to display trend charts.</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Record vitals a few times to see trends.</p>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const { latest, prev, stats, bpData, pulseData, spo2Data, tempData, ioData } = chartData

  // Helper to determine status
  const bpStatus = (() => {
    if (!latest) return 'normal'
    const T = VITAL_THRESHOLDS
    if (latest.bpSystolic < T.bpSystolic.criticalLow || latest.bpSystolic > T.bpSystolic.criticalHigh) return 'critical'
    if (latest.bpSystolic > T.bpSystolic.warningHigh) return 'warning'
    return 'normal'
  })()

  const pulseStatus = (() => {
    if (!latest) return 'normal'
    const T = VITAL_THRESHOLDS
    if (latest.pulse < T.pulse.criticalLow || latest.pulse > T.pulse.criticalHigh) return 'critical'
    if (latest.pulse > T.pulse.warningHigh) return 'warning'
    return 'normal'
  })()

  const spo2Status = (() => {
    if (!latest) return 'normal'
    const T = VITAL_THRESHOLDS
    if (latest.spo2 < T.spo2.critical) return 'critical'
    if (latest.spo2 < T.spo2.warning) return 'warning'
    return 'normal'
  })()

  const tempStatus = (() => {
    if (!latest) return 'normal'
    const T = VITAL_THRESHOLDS
    if (latest.temperature > T.temperature.warningHigh) return 'warning'
    return 'normal'
  })()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <TrendingUp className="h-4 w-4 text-teal-500" />
        <h3 className="text-sm font-semibold">Vital Trends</h3>
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          Last {chartData.ioData.length} readings
        </Badge>
      </div>

      {/* 2-column grid on desktop, 1-column on mobile */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* BP Chart */}
        <ChartCard
          title="Blood Pressure"
          icon={<Droplets className="h-4 w-4 text-teal-500" />}
          latestValue={latest ? `${latest.bpSystolic}/${latest.bpDiastolic} mmHg` : '—'}
          latestRaw={latest?.bpSystolic}
          prevRaw={prev?.bpSystolic}
          minVal={stats.bpSysMin !== undefined ? `${stats.bpSysMin}/${stats.bpDiaMin}` : undefined}
          maxVal={stats.bpSysMax !== undefined ? `${stats.bpSysMax}/${stats.bpDiaMax}` : undefined}
          status={bpStatus}
          delay={0}
        >
          {bpData.length >= 2 ? (
            <BPChart data={bpData} />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Not enough BP data</p>
          )}
        </ChartCard>

        {/* Pulse Chart */}
        <ChartCard
          title="Pulse Rate"
          icon={<Heart className="h-4 w-4 text-rose-500" />}
          latestValue={latest ? `${latest.pulse} bpm` : '—'}
          latestRaw={latest?.pulse}
          prevRaw={prev?.pulse}
          minVal={stats.pulseMin !== undefined ? `${stats.pulseMin} bpm` : undefined}
          maxVal={stats.pulseMax !== undefined ? `${stats.pulseMax} bpm` : undefined}
          status={pulseStatus}
          delay={1}
        >
          {pulseData.length >= 2 ? (
            <SingleLineChart
              data={pulseData}
              normalLow={60}
              normalHigh={100}
              criticalLow={50}
              criticalHigh={130}
              unit="bpm"
              lineColor="#f43f5e"
              gradientId="pulse-grad"
            />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Not enough pulse data</p>
          )}
        </ChartCard>

        {/* SpO2 Chart */}
        <ChartCard
          title="SpO2"
          icon={<Wind className="h-4 w-4 text-sky-500" />}
          latestValue={latest ? `${latest.spo2}%` : '—'}
          latestRaw={latest?.spo2}
          prevRaw={prev?.spo2}
          minVal={stats.spo2Min !== undefined ? `${stats.spo2Min}%` : undefined}
          maxVal={stats.spo2Max !== undefined ? `${stats.spo2Max}%` : undefined}
          status={spo2Status}
          delay={2}
        >
          {spo2Data.length >= 2 ? (
            <SingleLineChart
              data={spo2Data}
              normalLow={94}
              normalHigh={100}
              criticalLow={90}
              redZoneBelow={90}
              unit="%"
              lineColor="#0ea5e9"
              gradientId="spo2-grad"
            />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Not enough SpO2 data</p>
          )}
        </ChartCard>

        {/* Temperature Chart */}
        <ChartCard
          title="Temperature"
          icon={<Thermometer className="h-4 w-4 text-amber-500" />}
          latestValue={latest ? `${latest.temperature}°F` : '—'}
          latestRaw={latest?.temperature}
          prevRaw={prev?.temperature}
          minVal={stats.tempMin !== undefined ? `${stats.tempMin}°F` : undefined}
          maxVal={stats.tempMax !== undefined ? `${stats.tempMax}°F` : undefined}
          status={tempStatus}
          delay={3}
        >
          {tempData.length >= 2 ? (
            <SingleLineChart
              data={tempData}
              normalLow={97}
              normalHigh={99.5}
              feverLine={102.2}
              unit="°F"
              lineColor="#f59e0b"
              gradientId="temp-grad"
            />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Not enough temperature data</p>
          )}
        </ChartCard>

        {/* Input/Output Chart - spans full width */}
        <ChartCard
          title="Fluid Input / Output"
          icon={<Droplets className="h-4 w-4 text-emerald-500" />}
          latestValue={latest ? `I: ${latest.inputMl}ml / U: ${latest.urineMl}ml` : '—'}
          status="normal"
          delay={4}
          className="md:col-span-2"
        >
          {ioData.length >= 2 ? (
            <IOBarChart data={ioData} />
          ) : (
            <p className="py-6 text-center text-xs text-muted-foreground">Not enough I/O data</p>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
