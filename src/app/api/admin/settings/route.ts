import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import fs from 'fs'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'download', 'admin-settings.json')

const DEFAULT_SETTINGS = {
  general: {
    siteName: 'Doctorooms',
    email: 'admin@doctorooms.com',
    phone: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
  },
  appointments: {
    defaultDuration: 30,
    dailyLimit: 50,
    autoApprove: false,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    reminderTime: '30',
    realtimeEnabled: true,
    soundEnabled: true,
    desktopNotifications: true,
  },
  appearance: {
    primaryColor: '#0d9488',
    darkMode: 'system',
    sidebarPosition: 'left',
  },
  hospitalInfo: {
    hospitalName: '',
    hospitalAddress: '',
    hospitalPhone: '',
    hospitalEmail: '',
    hospitalLogo: '',
    hospitalGstNo: '',
    hospitalRegNo: '',
  },
  regional: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    currencySymbol: '₹',
    country: 'India',
    language: 'en',
  },
  billing: {
    defaultTaxPercent: 0,
    autoGenerateBillNo: true,
    billPrefix: 'BILL-',
    showDiscountField: true,
    paymentTerms: 'Due on Discharge',
  },
  lab: {
    defaultTatHours: 24,
    autoVerifyNormalResults: false,
    reportHeaderNote: '',
    reportFooterNote: '',
  },
}

function readSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch {
    // File corrupt or unreadable, return defaults
  }
  return DEFAULT_SETTINGS
}

function writeSettings(settings: unknown) {
  const dir = path.dirname(SETTINGS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8')
}

// Allowed keys per section for input validation
const ALLOWED_KEYS: Record<string, string[]> = {
  general: ['siteName', 'email', 'phone', 'timezone', 'currency'],
  appointments: ['defaultDuration', 'dailyLimit', 'autoApprove'],
  notifications: ['emailEnabled', 'smsEnabled', 'pushEnabled', 'reminderTime', 'realtimeEnabled', 'soundEnabled', 'desktopNotifications'],
  appearance: ['primaryColor', 'darkMode', 'sidebarPosition'],
  hospitalInfo: ['hospitalName', 'hospitalAddress', 'hospitalPhone', 'hospitalEmail', 'hospitalLogo', 'hospitalGstNo', 'hospitalRegNo'],
  regional: ['dateFormat', 'timeFormat', 'currencySymbol', 'country', 'language'],
  billing: ['defaultTaxPercent', 'autoGenerateBillNo', 'billPrefix', 'showDiscountField', 'paymentTerms'],
  lab: ['defaultTatHours', 'autoVerifyNormalResults', 'reportHeaderNote', 'reportFooterNote'],
}

const MAX_STRING_LENGTH = 500

function sanitizeString(value: unknown): string {
  if (typeof value === 'string') {
    return value.trim().slice(0, MAX_STRING_LENGTH)
  }
  return String(value).trim().slice(0, MAX_STRING_LENGTH)
}

function validateSettings(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Invalid settings payload')
  }

  const validated: Record<string, unknown> = {}

  for (const [section, keys] of Object.entries(ALLOWED_KEYS)) {
    const sectionData = (body as Record<string, unknown>)[section]
    if (sectionData && typeof sectionData === 'object' && !Array.isArray(sectionData)) {
      const cleanSection: Record<string, unknown> = {}
      for (const key of keys) {
        if (key in sectionData) {
          const val = (sectionData as Record<string, unknown>)[key]
          if (typeof val === 'string') {
            cleanSection[key] = sanitizeString(val)
          } else if (typeof val === 'number' || typeof val === 'boolean') {
            cleanSection[key] = val
          }
        }
      }
      validated[section] = cleanSection
    }
  }

  return validated
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const settings = readSettings()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(request, 'admin')
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const validated = validateSettings(body)
    writeSettings(validated)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save settings error:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
