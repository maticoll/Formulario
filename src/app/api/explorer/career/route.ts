import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { respondents, responses, careerSummaries } from '@/db/schema'
import { CAREERS, normalizeCareer, type CareerKey } from '@/lib/careers'
import { DIGESTS, TESTIMONIAL_QUESTION_KEYS, SURVEY_QUESTION_LABELS } from '@/lib/digests'

export const dynamic = 'force-dynamic'

// GET /api/explorer/career?key=admin
// Detalle de una carrera: resumen (IA cacheada o fallback) + testimonios anonimizados.
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key') as CareerKey | null
    if (!key || !CAREERS[key]) {
      return NextResponse.json({ error: 'Carrera no válida' }, { status: 400 })
    }

    const db = createDb()

    // Resumen: primero la caché de IA; si no hay, el fallback pre-generado.
    let summary: unknown = DIGESTS[key]
    let summarySource: 'ia' | 'fallback' = 'fallback'
    try {
      const cached = await db
        .select()
        .from(careerSummaries)
        .where(eq(careerSummaries.careerKey, key))
      if (cached.length && cached[0].summary) {
        summary = cached[0].summary
        summarySource = 'ia'
      }
    } catch {
      // La tabla career_summaries puede no existir aún: usamos el fallback.
    }

    // Testimonios: traemos respondents + responses y filtramos por carrera normalizada.
    const rows = await db
      .select({ respondent: respondents, response: responses })
      .from(respondents)
      .leftJoin(responses, eq(responses.respondentId, respondents.id))

    const byResp = new Map<string, { stage: string; answers: Record<string, string> }>()
    for (const row of rows) {
      if (normalizeCareer(row.respondent.careerRaw) !== key) continue
      const id = row.respondent.id
      if (!byResp.has(id)) byResp.set(id, { stage: row.respondent.yearStage, answers: {} })
      const ans = row.response?.rawAnswer?.trim()
      if (row.response && ans) {
        byResp.get(id)!.answers[row.response.questionKey] = ans
      }
    }

    // Anonimizado: solo etapa (año) + respuestas. Nunca el nombre.
    const testimonials = Array.from(byResp.values())
      .map((r) => ({
        stage: r.stage,
        items: TESTIMONIAL_QUESTION_KEYS
          .filter((qk) => r.answers[qk] && r.answers[qk].length > 8)
          .map((qk) => ({ k: qk, label: SURVEY_QUESTION_LABELS[qk] || '', a: r.answers[qk] })),
      }))
      .filter((t) => t.items.length > 0)

    return NextResponse.json({
      key,
      name: CAREERS[key].name,
      emoji: CAREERS[key].emoji,
      area: CAREERS[key].area,
      count: byResp.size,
      summary,
      summarySource,
      testimonials,
    })
  } catch (e) {
    console.error('[explorer/career]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
