import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-auth'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(req, 'doctor')
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { suggestionIds, customSuggestions } = body

    // Verify prescription ownership
    const prescription = await db.prescription.findUnique({
      where: { id },
      select: { id: true, doctorId: true },
    })
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 })
    }

    const doctor = await db.doctor.findUnique({
      where: { id: prescription.doctorId, userId: user.id },
      select: { id: true },
    })
    if (!doctor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete existing suggestions
    await db.pSuggestion.deleteMany({ where: { prescriptionId: id } })

    const toCreate: Array<{
      prescriptionId: string
      question: string
      questionEn: string
      suggestions: string
      suggestionsEn: string
      createdById: string
    }> = []

    // Process linked suggestions - fetch master data
    if (Array.isArray(suggestionIds) && suggestionIds.length > 0) {
      const masterSuggestions = await db.suggestionsMaster.findMany({
        where: { id: { in: suggestionIds } },
        include: {
          question: {
            select: { question: true, questionEn: true },
          },
        },
      })

      for (const ms of masterSuggestions) {
        toCreate.push({
          prescriptionId: id,
          question: ms.question.question,
          questionEn: ms.question.questionEn,
          suggestions: ms.suggestions,
          suggestionsEn: ms.suggestionsEn,
          createdById: user.id,
        })
      }
    }

    // Process custom suggestions
    if (Array.isArray(customSuggestions) && customSuggestions.length > 0) {
      for (const cs of customSuggestions) {
        toCreate.push({
          prescriptionId: id,
          question: String(cs.question || ''),
          questionEn: String(cs.questionEn || ''),
          suggestions: String(cs.suggestions || ''),
          suggestionsEn: String(cs.suggestionsEn || ''),
          createdById: user.id,
        })
      }
    }

    if (toCreate.length > 0) {
      await db.pSuggestion.createMany({ data: toCreate })
    }

    const savedSuggestions = await db.pSuggestion.findMany({
      where: { prescriptionId: id },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ suggestions: savedSuggestions })
  } catch (error) {
    console.error('Save suggestions error:', error)
    return NextResponse.json({ error: 'Failed to save suggestions' }, { status: 500 })
  }
}
