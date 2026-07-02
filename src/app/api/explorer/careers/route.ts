import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { respondents, explorerSessions } from '@/db/schema'
import { AREAS, CAREERS, CAREER_KEYS, normalizeCareer } from '@/lib/careers'
import { reducedCount } from '@/lib/experiment'

export const dynamic = 'force-dynamic'

// GET /api/explorer/careers?session=<id>
// Devuelve las 7 carreras con su conteo de testimonios (normalizado en vivo).
// Para sesiones del grupo 'reduced', el conteo refleja el 25% que ese usuario
// va a ver, para que la tarjeta y el detalle sean coherentes.
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session')
    const db = createDb()

    let variant: string | null = null
    if (sessionId) {
      try {
        const [s] = await db
          .select({ variant: explorerSessions.variant })
          .from(explorerSessions)
          .where(eq(explorerSessions.id, sessionId))
        variant = s?.variant ?? null
      } catch { /* seguimos como 'full' */ }
    }

    const rows = await db.select({ careerRaw: respondents.careerRaw }).from(respondents)

    const counts: Record<string, number> = {}
    for (const r of rows) {
      const k = normalizeCareer(r.careerRaw)
      if (k) counts[k] = (counts[k] || 0) + 1
    }

    const careers = CAREER_KEYS.map((k) => {
      const full = counts[k] || 0
      return {
        key: k,
        name: CAREERS[k].name,
        emoji: CAREERS[k].emoji,
        area: CAREERS[k].area,
        areaName: AREAS[CAREERS[k].area].name,
        count: variant === 'reduced' ? reducedCount(full) : full,
      }
    })

    return NextResponse.json({ areas: AREAS, careers })
  } catch (e) {
    console.error('[explorer/careers]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
