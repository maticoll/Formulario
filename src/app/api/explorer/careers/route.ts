import { NextResponse } from 'next/server'
import { createDb } from '@/db'
import { respondents } from '@/db/schema'
import { AREAS, CAREERS, CAREER_KEYS, normalizeCareer } from '@/lib/careers'

export const dynamic = 'force-dynamic'

// GET /api/explorer/careers
// Devuelve las 7 carreras con su conteo real de testimonios (normalizado en vivo).
export async function GET() {
  try {
    const db = createDb()
    const rows = await db.select({ careerRaw: respondents.careerRaw }).from(respondents)

    const counts: Record<string, number> = {}
    for (const r of rows) {
      const k = normalizeCareer(r.careerRaw)
      if (k) counts[k] = (counts[k] || 0) + 1
    }

    const careers = CAREER_KEYS.map((k) => ({
      key: k,
      name: CAREERS[k].name,
      emoji: CAREERS[k].emoji,
      area: CAREERS[k].area,
      areaName: AREAS[CAREERS[k].area].name,
      count: counts[k] || 0,
    }))

    return NextResponse.json({ areas: AREAS, careers })
  } catch (e) {
    console.error('[explorer/careers]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
