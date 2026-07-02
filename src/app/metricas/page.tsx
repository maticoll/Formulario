'use client'

import { useEffect, useState } from 'react'

// ─── Tipos (espejo de /api/explorer/metrics) ─────────────────────────────────
type GroupStats = {
  sessions: number
  completedSurvey: number
  decided: number
  decisionRate: number | null
  aligned: number
  alignmentRate: number | null
  usefulCounts: Record<string, number>
  avgCareersVisited: number
  avgCareerTimeMs: number
  medianCareerTimeMs: number
  expandedAny: number
  expandedRate: number | null
}
type StepTime = { step: string; full: Cell; reduced: Cell }
type Cell = { visits: number; avgMs: number; medianMs: number }
type TimelineItem = { step: string; careerKey: string | null; careerName: string; ms: number; meta: Record<string, unknown> | null }
type SessionDetail = {
  id: string
  createdAt: string
  variant: string | null
  name: string | null
  profileArea: string | null
  suggested: string[]
  leaning: string | null
  leaningName: string
  usefulRating: string | null
  totalMs: number
  timeline: TimelineItem[]
}
type Metrics = {
  generatedAt: string
  totals: { sessions: number; events: number; unassigned: number }
  groups: { full: GroupStats; reduced: GroupStats }
  stepTimes: StepTime[]
  sessions: SessionDetail[]
}

const STEP_LABELS: Record<string, string> = {
  landing: 'Inicio',
  open: 'Preguntas abiertas',
  test: 'Test RIASEC',
  results: 'Resultados',
  gallery: 'Galería de carreras',
  career: 'Carrera (testimonios)',
  final: 'Encuesta final',
  done: 'Gracias',
}

function fmtMs(ms: number): string {
  if (!ms) return '—'
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`
}

function fmtPct(r: number | null): string {
  return r === null ? '—' : `${Math.round(r * 100)}%`
}

export default function Metricas() {
  const [key, setKey] = useState('')
  const [data, setData] = useState<Metrics | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const url = new URL(window.location.href)
    const k = url.searchParams.get('key') || localStorage.getItem('metrics_key') || ''
    if (k) {
      setKey(k)
      load(k)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load(k: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/explorer/metrics?key=${encodeURIComponent(k)}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Error al cargar')
        setData(null)
      } else {
        localStorage.setItem('metrics_key', k)
        setData(json)
      }
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800">
        <div className="mx-auto max-w-md px-5 py-16">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">📊 Métricas del explorador</h1>
          <p className="mt-2 text-sm text-slate-500">Panel del experimento A/B (100% vs 25% de testimonios) y tiempos por pantalla.</p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && key && load(key)}
            placeholder="Clave de acceso (METRICS_KEY)"
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
          />
          <button
            onClick={() => key && load(key)}
            disabled={!key || loading}
            className="mt-4 w-full rounded-full bg-violet-600 px-8 py-3.5 font-bold text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {loading ? 'Cargando…' : 'Ver métricas'}
          </button>
          {error && <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>}
        </div>
      </main>
    )
  }

  const g = data.groups
  const csvBase = `/api/explorer/metrics?key=${encodeURIComponent(key)}&format=csv`

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-3xl px-5 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">📊 Métricas del explorador</h1>
          <button onClick={() => load(key)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">
            ↻ Actualizar
          </button>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {data.totals.sessions} sesiones · {data.totals.events} eventos de pantalla
          {data.totals.unassigned > 0 && ` · ${data.totals.unassigned} sesiones pre-experimento (excluidas de la comparativa)`}
        </p>

        {/* Comparativa de grupos */}
        <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">Experimento A/B</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Métrica</th>
                <th className="px-4 py-3">Grupo 100%</th>
                <th className="px-4 py-3">Grupo 25%</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-2.5 [&_tr]:border-b [&_tr]:border-slate-50">
              <tr><td className="font-semibold">Sesiones</td><td>{g.full.sessions}</td><td>{g.reduced.sessions}</td></tr>
              <tr><td className="font-semibold">Completaron la encuesta final</td><td>{g.full.completedSurvey}</td><td>{g.reduced.completedSurvey}</td></tr>
              <tr><td className="font-semibold">Tiempo en testimonios (promedio)</td><td>{fmtMs(g.full.avgCareerTimeMs)}</td><td>{fmtMs(g.reduced.avgCareerTimeMs)}</td></tr>
              <tr><td className="font-semibold">Tiempo en testimonios (mediana)</td><td>{fmtMs(g.full.medianCareerTimeMs)}</td><td>{fmtMs(g.reduced.medianCareerTimeMs)}</td></tr>
              <tr><td className="font-semibold">Carreras exploradas (promedio)</td><td>{g.full.avgCareersVisited}</td><td>{g.reduced.avgCareersVisited}</td></tr>
              <tr><td className="font-semibold">Expandieron testimonios</td><td>{fmtPct(g.full.expandedRate)}</td><td>{fmtPct(g.reduced.expandedRate)}</td></tr>
              <tr><td className="font-semibold">Eligieron una carrera</td><td>{fmtPct(g.full.decisionRate)} ({g.full.decided})</td><td>{fmtPct(g.reduced.decisionRate)} ({g.reduced.decided})</td></tr>
              <tr><td className="font-semibold">Elección alineada con el test</td><td>{fmtPct(g.full.alignmentRate)} ({g.full.aligned})</td><td>{fmtPct(g.reduced.alignmentRate)} ({g.reduced.aligned})</td></tr>
              <tr>
                <td className="font-semibold">¿Te sirvió?</td>
                <td>{Object.entries(g.full.usefulCounts).map(([k2, v]) => `${k2}: ${v}`).join(' · ') || '—'}</td>
                <td>{Object.entries(g.reduced.usefulCounts).map(([k2, v]) => `${k2}: ${v}`).join(' · ') || '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tiempos por pantalla */}
        <h2 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">Tiempo por pantalla (por visita)</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Pantalla</th>
                <th className="px-4 py-3">100% — mediana (prom · visitas)</th>
                <th className="px-4 py-3">25% — mediana (prom · visitas)</th>
              </tr>
            </thead>
            <tbody className="[&_td]:px-4 [&_td]:py-2.5 [&_tr]:border-b [&_tr]:border-slate-50">
              {data.stepTimes.map((st) => (
                <tr key={st.step}>
                  <td className="font-semibold">{STEP_LABELS[st.step] ?? st.step}</td>
                  <td>{fmtMs(st.full.medianMs)} <span className="text-slate-400">({fmtMs(st.full.avgMs)} · {st.full.visits})</span></td>
                  <td>{fmtMs(st.reduced.medianMs)} <span className="text-slate-400">({fmtMs(st.reduced.avgMs)} · {st.reduced.visits})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export */}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={`${csvBase}&what=sessions`} className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700">
            ⬇ CSV de sesiones
          </a>
          <a href={`${csvBase}&what=events`} className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700">
            ⬇ CSV de eventos
          </a>
        </div>

        {/* Detalle por sesión */}
        <h2 className="mt-10 text-xs font-bold uppercase tracking-widest text-slate-400">Detalle por sesión</h2>
        <div className="mt-3 space-y-3">
          {data.sessions.map((s) => (
            <details key={s.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <summary className="cursor-pointer select-none text-sm">
                <span className={`mr-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  s.variant === 'full' ? 'bg-emerald-50 text-emerald-600'
                  : s.variant === 'reduced' ? 'bg-amber-50 text-amber-600'
                  : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.variant === 'full' ? '100%' : s.variant === 'reduced' ? '25%' : 'pre'}
                </span>
                <span className="font-bold text-slate-800">{s.name || 'Anónimo'}</span>
                <span className="text-slate-400"> · {new Date(s.createdAt).toLocaleString('es-UY')} · {fmtMs(s.totalMs)}</span>
                {s.leaning && <span className="ml-2 font-semibold text-violet-600">→ {s.leaningName}</span>}
              </summary>
              <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm text-slate-600">
                {s.profileArea && <p><b>Área sugerida:</b> {s.profileArea} · <b>Carreras sugeridas:</b> {s.suggested.join(', ') || '—'}</p>}
                {s.usefulRating && <p><b>¿Le sirvió?</b> {s.usefulRating}</p>}
                <p className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Recorrido</p>
                {s.timeline.length === 0 && <p className="text-slate-400">Sin eventos registrados.</p>}
                {s.timeline.map((t, i) => (
                  <p key={i} className="flex justify-between gap-3">
                    <span>
                      {STEP_LABELS[t.step] ?? t.step}
                      {t.careerName && <span className="text-violet-600"> — {t.careerName}</span>}
                      {t.meta && (t.meta.expanded as number) > 0 && <span className="text-slate-400"> · expandió {String(t.meta.expanded)}</span>}
                      {t.meta?.showAll === true && <span className="text-slate-400"> · vio todos</span>}
                    </span>
                    <span className="shrink-0 font-semibold">{fmtMs(t.ms)}</span>
                  </p>
                ))}
              </div>
            </details>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-400">Generado {new Date(data.generatedAt).toLocaleString('es-UY')} · Fuente de verdad: tablas explorer_sessions y screen_events en Neon.</p>
      </div>
    </main>
  )
}
