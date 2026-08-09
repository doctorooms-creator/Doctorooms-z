import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/api-auth'

const DEFAULT_SETTINGS = {
  emailNotifications: true,
  bookingReminders: true,
  marketingEmails: false,
}

// GET — Fetch patient settings
export async function GET(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { settingsJson: true },
    })

    let settings = { ...DEFAULT_SETTINGS }
    if (userData?.settingsJson) {
      try {
        const parsed = JSON.parse(userData.settingsJson)
        settings = { ...DEFAULT_SETTINGS, ...parsed }
      } catch {
        // Ignore parse errors, use defaults
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get patient settings error:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT — Update patient settings
export async function PUT(req: NextRequest) {
  try {
    const user = await requireRole(req, 'patient')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { emailNotifications, bookingReminders, marketingEmails } = body

    // Validate: all values must be booleans if provided
    const updates: Record<string, unknown> = {}
    if (typeof emailNotifications === 'boolean') updates.emailNotifications = emailNotifications
    if (typeof bookingReminders === 'boolean') updates.bookingReminders = bookingReminders
    if (typeof marketingEmails === 'boolean') updates.marketingEmails = marketingEmails

    // Merge with existing settings
    const userData = await db.user.findUnique({
      where: { id: user.id },
      select: { settingsJson: true },
    })

    let current = { ...DEFAULT_SETTINGS }
    if (userData?.settingsJson) {
      try {
        const parsed = JSON.parse(userData.settingsJson)
        current = { ...DEFAULT_SETTINGS, ...parsed }
      } catch {
        // Ignore parse errors
      }
    }

    const merged = { ...current, ...updates }

    await db.user.update({
      where: { id: user.id },
      data: { settingsJson: JSON.stringify(merged) },
    })

    return NextResponse.json({ settings: merged })
  } catch (error) {
    console.error('Update patient settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
