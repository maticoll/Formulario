import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/db'
import { screenEvents } from '@/db/schema'

export const dynamic = 'force-dynamic'

const VALID_STEPS = new Set(['landing', 'open', 'test', 'results', 'gallery', 'career', 'final', 'done'])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Tope por visita: una pantalla abierta más de 30 min es una pestaña olvidada,
// no lectura real (el cliente además pausa cuando la pestaña queda oculta).
const MAX_DURATION_MS = 30 * 60 * 1000

// POST /api/explorer/track — registra una visita a pantalla (tiempo incluido).
// Acepta un evento o un array de eventos (el cliente bufferea los previos a
// tener sessionId y puede mandar el último con sendBeacon al cerrar).
export async function POST(req: NextRequest) {
  try {
    // sendBeacon puede llegar sin content-type application/json: parseamos el texto.
    const body = JSON.parse(await req.text())
    const events = Array.isArray(body) ? body : [body]

    const rows = []
    for (const e of events) {
      if (!e || typeof e.sessionId !== 'string' || !UUID_RE.test(e.sessionId) || !VALID_STEPS.has(e.step)) continue
      const duration = Number(e.durationMs)
      if (!Number.isFinite(duration) || duration < 0) continue
      const enteredAt = new Date(e.enteredAt)
      if (isNaN(enteredAt.getTime())) continue
      rows.push({
        sessionId: e.sessionId,
        step: e.step as string,
        careerKey: typeof e.careerKey === 'string' ? e.careerKey : null,
        enteredAt,
        durationMs: Math.min(Math.round(duration), MAX_DURATION_MS),
        meta: e.meta && typeof e.meta === 'object' ? e.meta : null,
      })
    }
    if (rows.length === 0) return NextResponse.json({ ok: true, saved: 0 })

    const db = createDb()
    await db.insert(screenEvents).values(rows)
    return NextResponse.json({ ok: true, saved: rows.length })
  } catch (e) {
    console.error('[explorer/track]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
