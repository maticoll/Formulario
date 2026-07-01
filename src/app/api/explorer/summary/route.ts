import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { respondents, responses, careerSummaries } from '@/db/schema'
import { CAREERS, normalizeCareer, type CareerKey } from '@/lib/careers'
import { DIGEST_QUESTIONS } from '@/lib/digests'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Qué preguntas crudas alimentan cada pregunta del resumen (qi 0..5).
const SOURCE_KEYS: string[][] = [
  ['b4_q1'],            // día a día
  ['b3_q1', 'b3_q3'],   // sorpresa / expectativa vs realidad
  ['b4_q4'],            // lo más difícil
  ['b4_q3'],            // salida laboral
  ['b4_q2'],            // habilidades
  ['b5_q1', 'b5_q2'],   // consejo + ¿eligió bien?
]

const SYSTEM_PROMPT = `Sos un editor que resume testimonios reales de estudiantes universitarios para adolescentes de 15 a 20 años que están eligiendo qué estudiar.

Reglas:
- Tono cercano, claro y honesto (tratá de "vos"). Nada de lenguaje corporativo ni de folleto. Evitá el "cringe": no fuerces jerga adolescente.
- MUY IMPORTANTE: preservá las verdades filosas, las advertencias y las opiniones negativas o encontradas. No promedies todo hasta dejar un puré neutro. Lo más valioso suele ser lo que NADIE dice en un folleto.
- Si hay varias posturas distintas, agrupá por similitud: "un grupo de estudiantes dice tal cosa; otro grupo dice tal otra".
- Si hay pocas respuestas o dicen lo mismo, usá un solo párrafo (label vacío "").
- No inventes datos que no estén en las respuestas. Si para una pregunta no hay respuestas, devolvé un grupo honesto diciendo que no dejaron comentarios sobre eso.
- Escribí en español rioplatense.`

// POST /api/explorer/summary?key=admin
// Genera el resumen por carrera con Anthropic y lo cachea en career_summaries.
// Sin ANTHROPIC_API_KEY responde 501 (el explorador sigue usando el fallback de lib/digests).
export async function POST(req: NextRequest) {
  try {
    const key = req.nextUrl.searchParams.get('key') as CareerKey | null
    if (!key || !CAREERS[key]) {
      return NextResponse.json({ error: 'Carrera no válida' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'ANTHROPIC_API_KEY no configurada. El explorador usa los resúmenes de src/lib/digests.ts como fallback. Configurá la key para generar con IA.',
        },
        { status: 501 }
      )
    }

    const db = createDb()

    // Juntar respuestas de la carrera, por pregunta y contando estudiantes.
    const rows = await db
      .select({ careerRaw: respondents.careerRaw, rid: responses.respondentId, qk: responses.questionKey, a: responses.rawAnswer })
      .from(responses)
      .leftJoin(respondents, eq(responses.respondentId, respondents.id))

    const answersByKey: Record<string, string[]> = {}
    const studentIds = new Set<string>()
    for (const r of rows) {
      if (!r.careerRaw || normalizeCareer(r.careerRaw) !== key) continue
      if (r.rid) studentIds.add(r.rid)
      const a = r.a?.trim()
      if (a && r.qk) (answersByKey[r.qk] ||= []).push(a)
    }

    // Construir el material por pregunta del resumen.
    const material = DIGEST_QUESTIONS.map((dq, qi) => {
      const answers = SOURCE_KEYS[qi].flatMap((k) => answersByKey[k] || [])
      const list = answers.length
        ? answers.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
        : '  (sin respuestas)'
      return `PREGUNTA ${qi} — ${dq.q}\n${list}`
    }).join('\n\n')

    const userPrompt = `Carrera: ${CAREERS[key].name}
Cantidad de estudiantes que respondieron: ${studentIds.size}

Abajo están las respuestas reales agrupadas por cada una de las 6 preguntas del resumen.
Generá un resumen para cada una.

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma (sin texto adicional, sin markdown):
[
  { "qi": 0, "groups": [ { "label": "Un grupo", "text": "..." }, { "label": "Otro grupo", "text": "..." } ] },
  { "qi": 1, "groups": [ { "label": "", "text": "..." } ] },
  ... (qi 0 a 5, en orden)
]

MATERIAL:
${material}`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!resp.ok) {
      const detail = await resp.text()
      console.error('[explorer/summary] Anthropic error', resp.status, detail)
      return NextResponse.json({ error: 'Error llamando a la IA', status: resp.status }, { status: 502 })
    }

    const data = await resp.json()
    const text: string = data?.content?.[0]?.text ?? ''
    const jsonStart = text.indexOf('[')
    const jsonEnd = text.lastIndexOf(']')
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: 'La IA no devolvió JSON válido', raw: text.slice(0, 500) }, { status: 502 })
    }
    const summary = JSON.parse(text.slice(jsonStart, jsonEnd + 1))

    // Guardar/actualizar en la caché.
    await db
      .insert(careerSummaries)
      .values({ careerKey: key, summary, model: 'claude-sonnet-5', responsesCount: studentIds.size })
      .onConflictDoUpdate({
        target: careerSummaries.careerKey,
        set: { summary, model: 'claude-sonnet-5', responsesCount: studentIds.size, generatedAt: new Date() },
      })

    return NextResponse.json({ ok: true, key, students: studentIds.size, summary })
  } catch (e) {
    console.error('[explorer/summary]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
