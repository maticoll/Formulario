import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { createDb } from '@/db'
import { explorerSessions } from '@/db/schema'

export const dynamic = 'force-dynamic'

// POST /api/explorer/session  → crea la sesión con el nombre y las preguntas abiertas.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = createDb()
    const [row] = await db
      .insert(explorerSessions)
      .values({
        name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null,
        preAnswers: body.preAnswers ?? null,
      })
      .returning({ id: explorerSessions.id })
    return NextResponse.json({ id: row.id })
  } catch (e) {
    console.error('[explorer/session POST]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PATCH /api/explorer/session → actualiza con el resultado del test y la encuesta final.
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id) return NextResponse.json({ error: 'Falta id de sesión' }, { status: 400 })

    const patch: Record<string, unknown> = { updatedAt: new Date() }
    if (body.profileArea !== undefined) patch.profileArea = body.profileArea
    if (body.suggestedCareers !== undefined) patch.suggestedCareers = body.suggestedCareers
    if (body.usefulRating !== undefined) patch.usefulRating = body.usefulRating
    if (body.leaning !== undefined) patch.leaning = body.leaning

    const db = createDb()
    await db.update(explorerSessions).set(patch).where(eq(explorerSessions.id, body.id))
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[explorer/session PATCH]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
