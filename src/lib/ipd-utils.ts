/**
 * IPD Admission number generation utility
 * Format: IPD-YYYY-NNNNNN (e.g., IPD-2026-000001)
 */

import { db } from '@/lib/db'

export async function generateIpdAdmissionNo(hospitalId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `IPD-${year}-`

  const lastAdmission = await db.ipdAdmission.findFirst({
    where: {
      hospitalId,
      admissionNo: { startsWith: prefix },
    },
    orderBy: { admissionNo: 'desc' },
    select: { admissionNo: true },
  })

  let nextNum = 1
  if (lastAdmission?.admissionNo) {
    const numPart = lastAdmission.admissionNo.replace(prefix, '')
    nextNum = parseInt(numPart, 10) + 1
  }

  return `${prefix}${String(nextNum).padStart(6, '0')}`
}

/** Get current shift based on time of day */
export function getCurrentShift(): 'Morning' | 'Evening' | 'Night' {
  const hour = new Date().getHours()
  if (hour >= 7 && hour < 14) return 'Morning'
  if (hour >= 14 && hour < 21) return 'Evening'
  return 'Night'
}

/** Vital sign danger thresholds for alerts */
export const VITAL_THRESHOLDS = {
  spo2: { critical: 90, warning: 94 },
  bpSystolic: { criticalLow: 90, criticalHigh: 180, warningHigh: 160 },
  bpDiastolic: { criticalHigh: 120, warningHigh: 100 },
  pulse: { criticalLow: 50, criticalHigh: 130, warningHigh: 110 },
  temperature: { warningHigh: 102.2 }, // °F
  respiratoryRate: { criticalLow: 10, criticalHigh: 30 },
} as const

export type VitalAlertLevel = 'critical' | 'high' | 'medium' | 'normal'

export interface VitalAlert {
  parameter: string
  level: VitalAlertLevel
  message: string
  value: number
}

/** Check vitals against thresholds and return alerts */
export function checkVitalAlerts(vitals: {
  spo2?: number
  bpSystolic?: number
  bpDiastolic?: number
  pulse?: number
  temperature?: number
  respiratoryRate?: number
}): VitalAlert[] {
  const alerts: VitalAlert[] = []
  const T = VITAL_THRESHOLDS

  if (vitals.spo2 && vitals.spo2 < T.spo2.critical) {
    alerts.push({ parameter: 'SpO2', level: 'critical', message: `SpO2 critically low: ${vitals.spo2}%`, value: vitals.spo2 })
  } else if (vitals.spo2 && vitals.spo2 < T.spo2.warning) {
    alerts.push({ parameter: 'SpO2', level: 'high', message: `SpO2 low: ${vitals.spo2}%`, value: vitals.spo2 })
  }

  if (vitals.bpSystolic) {
    if (vitals.bpSystolic < T.bpSystolic.criticalLow) {
      alerts.push({ parameter: 'BP', level: 'critical', message: `BP critically low: ${vitals.bpSystolic}/${vitals.bpDiastolic || 0}`, value: vitals.bpSystolic })
    } else if (vitals.bpSystolic > T.bpSystolic.criticalHigh) {
      alerts.push({ parameter: 'BP', level: 'critical', message: `BP critically high: ${vitals.bpSystolic}/${vitals.bpDiastolic || 0}`, value: vitals.bpSystolic })
    } else if (vitals.bpSystolic > T.bpSystolic.warningHigh) {
      alerts.push({ parameter: 'BP', level: 'high', message: `BP high: ${vitals.bpSystolic}/${vitals.bpDiastolic || 0}`, value: vitals.bpSystolic })
    }
  }

  if (vitals.pulse) {
    if (vitals.pulse < T.pulse.criticalLow) {
      alerts.push({ parameter: 'Pulse', level: 'critical', message: `Bradycardia: ${vitals.pulse} bpm`, value: vitals.pulse })
    } else if (vitals.pulse > T.pulse.criticalHigh) {
      alerts.push({ parameter: 'Pulse', level: 'critical', message: `Tachycardia: ${vitals.pulse} bpm`, value: vitals.pulse })
    } else if (vitals.pulse > T.pulse.warningHigh) {
      alerts.push({ parameter: 'Pulse', level: 'high', message: `Pulse elevated: ${vitals.pulse} bpm`, value: vitals.pulse })
    }
  }

  if (vitals.temperature && vitals.temperature > T.temperature.warningHigh) {
    alerts.push({ parameter: 'Temperature', level: 'high', message: `High fever: ${vitals.temperature}°F`, value: vitals.temperature })
  }

  if (vitals.respiratoryRate) {
    if (vitals.respiratoryRate < T.respiratoryRate.criticalLow) {
      alerts.push({ parameter: 'RR', level: 'critical', message: `Respiratory rate critically low: ${vitals.respiratoryRate}/min`, value: vitals.respiratoryRate })
    } else if (vitals.respiratoryRate > T.respiratoryRate.criticalHigh) {
      alerts.push({ parameter: 'RR', level: 'high', message: `Respiratory distress: ${vitals.respiratoryRate}/min`, value: vitals.respiratoryRate })
    }
  }

  return alerts
}

/** Medicine route options */
export const MEDICINE_ROUTES = ['Oral', 'IV', 'IM', 'SC', 'Topical', 'PR', 'Nebulization', 'Inhalation'] as const

/** Frequency options with descriptions */
export const FREQUENCY_OPTIONS = [
  { value: 'STAT', label: 'STAT', desc: 'Immediately' },
  { value: 'OD', label: 'OD', desc: 'Once daily' },
  { value: 'BD', label: 'BD', desc: 'Twice daily' },
  { value: 'TDS', label: 'TDS', desc: 'Three times daily' },
  { value: 'QID', label: 'QID', desc: 'Four times daily' },
  { value: 'Q4H', label: 'Q4H', desc: 'Every 4 hours' },
  { value: 'Q6H', label: 'Q6H', desc: 'Every 6 hours' },
  { value: 'Q8H', label: 'Q8H', desc: 'Every 8 hours' },
  { value: 'HS', label: 'HS', desc: 'At bedtime' },
  { value: 'SOS', label: 'SOS/PRN', desc: 'As needed' },
] as const

/** Medicine administration status options */
export const ADMIN_STATUS = {
  Pending: { label: 'Pending', color: 'amber' },
  Given: { label: 'Given', color: 'emerald' },
  Missed: { label: 'Missed', color: 'red' },
  Refused: { label: 'Refused', color: 'orange' },
  Skipped: { label: 'Skipped', color: 'slate' },
  NotAvailable: { label: 'Not Available', color: 'red' },
} as const

/** Sample type options */
export const SAMPLE_TYPES = ['Blood', 'Urine', 'Sputum', 'CSF', 'Swab', 'Stool', 'Other'] as const

/** Sample collection status flow */
export const SAMPLE_STATUS_FLOW = ['Ordered', 'Collected', 'SentToLab', 'Reported', 'Filed'] as const