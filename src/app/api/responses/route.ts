import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/db'
import { respondents, responses } from '@/db/schema'
import { eq, ilike, and, SQL } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const career = searchParams.get('career')
    const type = searchParams.get('type') // 'publica' | 'privada' | 'otra'

    const db = createDb()

    const conditions: SQL[] = []
    if (career) conditions.push(ilike(respondents.careerRaw, `%${career}%`))
    if (type) conditions.push(eq(respondents.universityType, type))

    const rows = await db
      .select({
        respondent: respondents,
        response: responses,
      })
      .from(respondents)
      .leftJoin(responses, eq(responses.respondentId, respondents.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(respondents.createdAt)

    // Agrupar por respondent
    const grouped = new Map<
      string,
      {
        id: string
        name: string
        career: string
        careerNormalized: string | null
        universityName: string
        universityType: string
        yearStage: string
        createdAt: Date
        responses: Record<
          string,
          { raw: string; enriched: string | null }
        >
      }
    >()

    for (const row of rows) {
      const r = row.respondent
      if (!grouped.has(r.id)) {
        grouped.set(r.id, {
          id: r.id,
          name: r.name,
          career: r.careerRaw,
          careerNormalized: r.careerNormalized,
          universityName: r.universityName,
          universityType: r.universityType,
          yearStage: r.yearStage,
          createdAt: r.createdAt,
          responses: {},
        })
      }

      if (row.response) {
        const entry = grouped.get(r.id)!
        entry.responses[row.response.questionKey] = {
          raw: row.response.rawAnswer,
          enriched: row.response.enrichedAnswer,
        }
      }
    }

    return NextResponse.json(Array.from(grouped.values()))
  } catch (error) {
    console.error('[responses]', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
