import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { explorerSessions } from '@/db/schema'
import { CAREERS, CAREER_KEYS, AREAS, type CareerKey } from '@/lib/careers'
import { RIASEC_LABELS, RIASEC_TYPES, type RiasecType } from '@/lib/riasec'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Forma cacheada en explorer_sessions.ai_recommendation.
type AiRecommendation = {
  careers: CareerKey[]
  text: string
  area: string
  model: string
  generatedAt: string
}

const MODEL = 'claude-haiku-4-5'

const SYSTEM_PROMPT = `Sos un orientador vocacional que le habla a un adolescente uruguayo de 15 a 20 años que acaba de hacer un test de intereses.

Reglas:
- Tono cercano y honesto, de "vos". Nada de lenguaje de folleto ni de autoayuda. Sin "cringe".
- Recomendá 1 o 2 carreras DE LA LISTA que te paso (usá exactamente sus claves). No inventes carreras.
- Explicá en 2 o 3 frases POR QUÉ, conectando con lo que la persona escribió y con su perfil del test. Si sus respuestas abiertas ya mencionan una carrera de la lista, tenelo muy en cuenta.
- Es una sugerencia para explorar, no un veredicto: que el texto lo refleje.
- Escribí en español rioplatense.`

// POST /api/explorer/recommendation
// Recomendación personalizada con IA a partir de las respuestas abiertas de la
// sesión + el perfil RIASEC. Complementa (no reemplaza) al cálculo del test.
// Cacheada por sesión: solo se regenera si cambió el área del perfil.
// Sin ANTHROPIC_API_KEY responde 501 y el cliente simplemente no muestra la tarjeta.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const sessionId: string | undefined = body?.sessionId
    const profile = body?.profile as
      | { riasec: Record<RiasecType, number>; top: RiasecType[]; area: string }
      | undefined
    if (!sessionId || !profile?.area || !profile?.riasec) {
      return NextResponse.json({ error: 'Faltan sessionId o profile' }, { status: 400 })
    }

    const db = createDb()
    const [session] = await db
      .select()
      .from(explorerSessions)
      .where(eq(explorerSessions.id, sessionId))
    if (!session) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    const cached = session.aiRecommendation as AiRecommendation | null
    if (cached?.careers?.length && cached.area === profile.area) {
      return NextResponse.json({ careers: cached.careers, text: cached.text, cached: true })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY no configurada' }, { status: 501 })
    }

    const pre = (session.preAnswers ?? {}) as Record<string, string>
    const openAnswers = [
      ['¿Ya pensaste en qué querés hacer cuando termines el liceo?', pre.q1],
      ['¿Consideraste alguna carrera en particular?', pre.q2],
      ['¿Qué es lo que más te importa a la hora de elegir?', pre.q3],
    ]
      .map(([q, a]) => `- ${q}\n  ${a?.trim() || '(no respondió)'}`)
      .join('\n')

    const careersList = CAREER_KEYS.map(
      (k) => `- ${k}: ${CAREERS[k].name} (área: ${AREAS[CAREERS[k].area].name})`
    ).join('\n')
    const riasecScores = RIASEC_TYPES.map(
      (t) => `${RIASEC_LABELS[t].name}: ${profile.riasec[t] ?? 0}`
    ).join(', ')
    const topNames = (profile.top ?? []).map((t) => RIASEC_LABELS[t]?.name).filter(Boolean).join(' y ')

    const userPrompt = `CARRERAS DISPONIBLES (clave: nombre):
${careersList}

LO QUE ESCRIBIÓ ANTES DE EMPEZAR:
${openAnswers}

PERFIL DEL TEST RIASEC:
Puntajes: ${riasecScores}
Tipos dominantes: ${topNames || '(sin datos)'}
Área sugerida por el test: ${profile.area}

Devolvé EXCLUSIVAMENTE un JSON válido con esta forma (sin texto adicional, sin markdown):
{ "careers": ["clave1"], "text": "explicación de 2-3 frases" }
"careers" debe tener 1 o 2 claves exactas de la lista.`

    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!resp.ok) {
      const detail = await resp.text()
      console.error('[explorer/recommendation] Anthropic error', resp.status, detail)
      return NextResponse.json({ error: 'Error llamando a la IA' }, { status: 502 })
    }

    const data = await resp.json()
    const text: string = data?.content?.[0]?.text ?? ''
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart === -1 || jsonEnd === -1) {
      return NextResponse.json({ error: 'La IA no devolvió JSON válido' }, { status: 502 })
    }
    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as { careers?: string[]; text?: string }

    const careers = (parsed.careers ?? [])
      .filter((k): k is CareerKey => k in CAREERS)
      .slice(0, 2)
    if (!careers.length || !parsed.text?.trim()) {
      return NextResponse.json({ error: 'Respuesta de la IA incompleta' }, { status: 502 })
    }

    const recommendation: AiRecommendation = {
      careers,
      text: parsed.text.trim(),
      area: profile.area,
      model: MODEL,
      generatedAt: new Date().toISOString(),
    }
    await db
      .update(explorerSessions)
      .set({ aiRecommendation: recommendation, updatedAt: new Date() })
      .where(eq(explorerSessions.id, sessionId))

    return NextResponse.json({ careers, text: recommendation.text })
  } catch (e) {
    console.error('[explorer/recommendation]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
