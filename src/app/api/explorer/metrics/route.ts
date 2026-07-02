import { NextRequest, NextResponse } from 'next/server'
import { createDb } from '@/db'
import { explorerSessions, screenEvents } from '@/db/schema'
import { CAREERS, type CareerKey } from '@/lib/careers'

export const dynamic = 'force-dynamic'

// GET /api/explorer/metrics?key=...                → agregados + detalle por sesión (JSON)
// GET /api/explorer/metrics?key=...&format=csv&what=sessions|events → export CSV
//
// Protegido con METRICS_KEY (variable de entorno). Las sesiones sin variante
// (anteriores al experimento) se reportan aparte y no entran en la comparativa.

type SessionRow = typeof explorerSessions.$inferSelect
type EventRow = typeof screenEvents.$inferSelect

function median(values: number[]): number {
  if (values.length === 0) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2)
}

function avg(values: number[]): number {
  return values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function csvResponse(rows: unknown[][], filename: string): NextResponse {
  const body = rows.map((r) => r.map(csvCell).join(',')).join('\r\n')
  // BOM para que Excel abra el UTF-8 con acentos bien.
  return new NextResponse('﻿' + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}

function careerName(key: string | null): string {
  if (!key) return ''
  if (key === 'ninguna') return 'Ninguna / Todavía no sé'
  return CAREERS[key as CareerKey]?.name ?? key
}

function suggestedList(s: SessionRow): string[] {
  const sc = s.suggestedCareers as { careers?: string[] } | null
  return Array.isArray(sc?.careers) ? sc.careers : []
}

function groupStats(sessions: SessionRow[], eventsBySession: Map<string, EventRow[]>) {
  const decided = sessions.filter((s) => s.leaning && s.leaning !== 'ninguna')
  const answered = sessions.filter((s) => s.leaning)
  const aligned = decided.filter((s) => suggestedList(s).includes(s.leaning!))

  const usefulCounts: Record<string, number> = {}
  for (const s of sessions) {
    if (s.usefulRating) usefulCounts[s.usefulRating] = (usefulCounts[s.usefulRating] || 0) + 1
  }

  const careerTimePerSession: number[] = []
  const careersVisitedPerSession: number[] = []
  let expandedAny = 0
  for (const s of sessions) {
    const evs = eventsBySession.get(s.id) ?? []
    const careerEvs = evs.filter((e) => e.step === 'career')
    careerTimePerSession.push(careerEvs.reduce((a, e) => a + e.durationMs, 0))
    careersVisitedPerSession.push(new Set(careerEvs.map((e) => e.careerKey).filter(Boolean)).size)
    const expanded = careerEvs.some((e) => {
      const m = e.meta as { expanded?: number; showAll?: boolean } | null
      return (m?.expanded ?? 0) > 0 || m?.showAll === true
    })
    if (expanded) expandedAny++
  }

  return {
    sessions: sessions.length,
    completedSurvey: answered.length,
    decided: decided.length,
    decisionRate: answered.length ? decided.length / answered.length : null,
    aligned: aligned.length,
    alignmentRate: decided.length ? aligned.length / decided.length : null,
    usefulCounts,
    avgCareersVisited: careersVisitedPerSession.length
      ? Math.round(avg(careersVisitedPerSession) * 10) / 10
      : 0,
    avgCareerTimeMs: avg(careerTimePerSession),
    medianCareerTimeMs: median(careerTimePerSession),
    expandedAny,
    expandedRate: sessions.length ? expandedAny / sessions.length : null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const configured = process.env.METRICS_KEY
    if (!configured) {
      return NextResponse.json(
        { error: 'Configurá la variable de entorno METRICS_KEY para habilitar las métricas.' },
        { status: 503 }
      )
    }
    if (req.nextUrl.searchParams.get('key') !== configured) {
      return NextResponse.json({ error: 'Clave incorrecta' }, { status: 401 })
    }

    const db = createDb()
    const sessions = await db.select().from(explorerSessions)
    const events = await db.select().from(screenEvents)

    const format = req.nextUrl.searchParams.get('format')
    const what = req.nextUrl.searchParams.get('what')

    const eventsBySession = new Map<string, EventRow[]>()
    for (const e of events) {
      if (!eventsBySession.has(e.sessionId)) eventsBySession.set(e.sessionId, [])
      eventsBySession.get(e.sessionId)!.push(e)
    }
    for (const list of eventsBySession.values()) {
      list.sort((a, b) => a.enteredAt.getTime() - b.enteredAt.getTime())
    }

    if (format === 'csv' && what === 'events') {
      const rows: unknown[][] = [
        ['session_id', 'variant', 'step', 'career_key', 'career_name', 'entered_at', 'duration_ms', 'duration_s', 'meta'],
      ]
      const variantById = new Map(sessions.map((s) => [s.id, s.variant]))
      for (const e of events) {
        rows.push([
          e.sessionId,
          variantById.get(e.sessionId) ?? '',
          e.step,
          e.careerKey ?? '',
          careerName(e.careerKey),
          e.enteredAt.toISOString(),
          e.durationMs,
          Math.round(e.durationMs / 100) / 10,
          e.meta ? JSON.stringify(e.meta) : '',
        ])
      }
      return csvResponse(rows, 'screen_events.csv')
    }

    if (format === 'csv') {
      const rows: unknown[][] = [
        ['id', 'created_at', 'variant', 'name', 'profile_area', 'suggested_careers', 'leaning', 'leaning_name', 'useful_rating', 'total_ms', 'career_ms', 'careers_visited'],
      ]
      for (const s of sessions) {
        const evs = eventsBySession.get(s.id) ?? []
        const careerEvs = evs.filter((e) => e.step === 'career')
        rows.push([
          s.id,
          s.createdAt.toISOString(),
          s.variant ?? 'pre-experimento',
          s.name ?? '',
          s.profileArea ?? '',
          suggestedList(s).join(' | '),
          s.leaning ?? '',
          careerName(s.leaning),
          s.usefulRating ?? '',
          evs.reduce((a, e) => a + e.durationMs, 0),
          careerEvs.reduce((a, e) => a + e.durationMs, 0),
          new Set(careerEvs.map((e) => e.careerKey).filter(Boolean)).size,
        ])
      }
      return csvResponse(rows, 'explorer_sessions.csv')
    }

    // ── JSON de agregados ──
    const full = sessions.filter((s) => s.variant === 'full')
    const reduced = sessions.filter((s) => s.variant === 'reduced')
    const unassigned = sessions.filter((s) => !s.variant)

    const steps = ['landing', 'open', 'test', 'results', 'gallery', 'career', 'final', 'done']
    const variantById = new Map(sessions.map((s) => [s.id, s.variant]))
    const stepTimes = steps.map((step) => {
      const perGroup = (variant: string) => {
        const durs = events
          .filter((e) => e.step === step && variantById.get(e.sessionId) === variant)
          .map((e) => e.durationMs)
        return { visits: durs.length, avgMs: avg(durs), medianMs: median(durs) }
      }
      return { step, full: perGroup('full'), reduced: perGroup('reduced') }
    })

    const sessionDetail = sessions
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((s) => {
        const evs = eventsBySession.get(s.id) ?? []
        return {
          id: s.id,
          createdAt: s.createdAt.toISOString(),
          variant: s.variant,
          name: s.name,
          profileArea: s.profileArea,
          suggested: suggestedList(s),
          leaning: s.leaning,
          leaningName: careerName(s.leaning),
          usefulRating: s.usefulRating,
          totalMs: evs.reduce((a, e) => a + e.durationMs, 0),
          timeline: evs.map((e) => ({
            step: e.step,
            careerKey: e.careerKey,
            careerName: careerName(e.careerKey),
            ms: e.durationMs,
            meta: e.meta,
          })),
        }
      })

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totals: { sessions: sessions.length, events: events.length, unassigned: unassigned.length },
      groups: {
        full: groupStats(full, eventsBySession),
        reduced: groupStats(reduced, eventsBySession),
      },
      stepTimes,
      sessions: sessionDetail,
    })
  } catch (e) {
    console.error('[explorer/metrics]', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
