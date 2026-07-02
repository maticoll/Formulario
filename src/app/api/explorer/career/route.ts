import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { respondents, responses, careerSummaries, explorerSessions } from '@/db/schema'
import { CAREERS, normalizeCareer, type CareerKey } from '@/lib/careers'
import { DIGESTS, TESTIMONIAL_QUESTION_KEYS, SURVEY_QUESTION_LABELS } from '@/lib/digests'
import { pickDeterministicSubset, reducedCount } from '@/lib/experiment'

export const dynamic = 'force-dynamic'

// GET /api/explorer/career?key=admin&session=<id>
// Detalle de una carrera: resumen (IA cacheada o fallback) + testimonios anonimizados.
// Si la sesión pertenece al grupo 'reduced' del experimento, devuelve solo el 25%
// de los testimonios (subconjunto determinístico por sesión). El resumen va
// completo para ambos grupos.
export async function GET(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key') as CareerKey | null
    if (!key || !CAREERS[key]) {
      return NextResponse.json({ error: 'Carrera no válida' }, { status: 400 })
    }
    const sessionId = req.nextUrl.searchParams.get('session')

    const db = createDb()

    // Variante del experimento (default 'full' si no hay sesión o falla el lookup).
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
    // Orden estable por id de respondent: requisito para que el subconjunto
    // del grupo 'reduced' sea siempre el mismo dentro de una sesión.
    let testimonials = Array.from(byResp.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, r]) => ({
        stage: r.stage,
        items: TESTIMONIAL_QUESTION_KEYS
          .filter((qk) => r.answers[qk] && r.answers[qk].length > 8)
          .map((qk) => ({ k: qk, label: SURVEY_QUESTION_LABELS[qk] || '', a: r.answers[qk] })),
      }))
      .filter((t) => t.items.length > 0)

    if (variant === 'reduced' && sessionId) {
      testimonials = pickDeterministicSubset(
        testimonials,
        reducedCount(testimonials.length),
        `${sessionId}:${key}`
      )
    }

    return NextResponse.json({
      key,
      name: CAREERS[key].name,
      emoji: CAREERS[key].emoji,
      area: CAREERS[key].area,
      // El conteo refleja lo que este usuario realmente ve.
      count: testimonials.length,
      summary,
      summarySource,
      testimonials,
    })
  } catch (e) {
    console.error('[explorer/career]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
