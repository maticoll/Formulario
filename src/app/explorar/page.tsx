'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { DIGEST_QUESTIONS } from '@/lib/digests'
import { TEST, SCALE, RIASEC_LABELS, computeProfile, type RiasecType } from '@/lib/riasec'

// ─── Tipos de datos que vienen de la API ─────────────────────────────────────
type AreaKey = 'tecnologia' | 'negocios' | 'comunicacion' | 'salud'
type CareerListItem = {
  key: string
  name: string
  emoji: string
  area: AreaKey
  areaName: string
  count: number
}
type AreasMap = Record<AreaKey, { name: string; emoji: string; careers: string[] }>
type CareersResponse = { areas: AreasMap; careers: CareerListItem[] }
type Group = { label: string; text: string }
type Block = { qi: number; groups: Group[] }
type TestimonialItem = { k?: string; label: string; a: string }
type Testimonial = { stage: string; items: TestimonialItem[] }
type CareerDetail = {
  key: string
  name: string
  emoji: string
  area: AreaKey
  count: number
  summary: Block[]
  testimonials: Testimonial[]
}

// ─── Preguntas abiertas iniciales ────────────────────────────────────────────
const OPEN_QUESTIONS = [
  '¿Ya pensaste en qué querés hacer cuando termines el liceo? Contá lo que tengas, aunque sea difuso.',
  '¿Consideraste alguna carrera en particular? ¿Cuál (o cuáles)?',
  '¿Qué es lo que más te importa a la hora de elegir? (que te guste, la plata, la salida laboral, ayudar a otros...)',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Step = 'landing' | 'open' | 'test' | 'results' | 'gallery' | 'career' | 'final' | 'done'

// Evento de tiempo en pantalla (se persiste en screen_events).
type TrackEvent = {
  sessionId?: string
  step: Step
  careerKey: string | null
  enteredAt: string
  durationMs: number
  meta?: Record<string, unknown>
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Explorar() {
  const [step, setStep] = useState<Step>('landing')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(['', '', ''])
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [area, setArea] = useState<AreaKey | null>(null)
  const [profileTop, setProfileTop] = useState<RiasecType[]>([])
  const [careersData, setCareersData] = useState<CareersResponse | null>(null)
  const [career, setCareer] = useState<CareerDetail | null>(null)
  const [showAllTestimonials, setShowAllTestimonials] = useState(false)
  const [useful, setUseful] = useState('')
  const [leaning, setLeaning] = useState('')
  const [loading, setLoading] = useState(false)
  const [beforeFinal, setBeforeFinal] = useState<Step>('results')

  const go = (s: Step) => {
    setStep(s)
    if (typeof window !== 'undefined') {
      window.history.pushState({ step: s }, '')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const goFinal = (from: Step) => {
    setBeforeFinal(from)
    go('final')
  }

  // ── sesión (creada al salir de la landing, por cualquiera de los dos caminos) ──
  const sessionIdRef = useRef<string | null>(null)
  const sessionPromiseRef = useRef<Promise<string | null> | null>(null)

  function ensureSession(): Promise<string | null> {
    if (sessionIdRef.current) return Promise.resolve(sessionIdRef.current)
    if (!sessionPromiseRef.current) {
      sessionPromiseRef.current = (async () => {
        try {
          const res = await fetch('/api/explorer/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          })
          if (res.ok) {
            const d = await res.json()
            sessionIdRef.current = d.id
            return d.id as string
          }
        } catch { /* seguimos sin sesión: la app funciona igual */ }
        sessionPromiseRef.current = null
        return null
      })()
    }
    return sessionPromiseRef.current
  }

  // ── métricas de tiempo por pantalla ──
  // Cronómetro de la pantalla actual. Se pausa cuando la pestaña queda oculta
  // (celular en segundo plano) para no inflar los tiempos.
  const screenRef = useRef<{
    step: Step
    careerKey: string | null
    enteredAt: number
    hiddenSince: number | null
    hiddenMs: number
    meta: Record<string, unknown>
  }>({ step: 'landing', careerKey: null, enteredAt: Date.now(), hiddenSince: null, hiddenMs: 0, meta: {} })
  // Eventos ocurridos antes de tener sessionId (ej: tiempo en la landing).
  const pendingEventsRef = useRef<TrackEvent[]>([])

  const sendEvents = (events: TrackEvent[], useBeacon = false) => {
    if (events.length === 0) return
    const payload = JSON.stringify(events)
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon('/api/explorer/track', new Blob([payload], { type: 'application/json' }))
    } else {
      fetch('/api/explorer/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {})
    }
  }

  const closeScreen = (useBeacon = false) => {
    const s = screenRef.current
    const now = Date.now()
    const hidden = s.hiddenMs + (s.hiddenSince ? now - s.hiddenSince : 0)
    const ev: TrackEvent = {
      step: s.step,
      careerKey: s.careerKey,
      enteredAt: new Date(s.enteredAt).toISOString(),
      durationMs: Math.max(0, now - s.enteredAt - hidden),
      meta: Object.keys(s.meta).length ? s.meta : undefined,
    }
    const sid = sessionIdRef.current
    if (sid) {
      const buffered = pendingEventsRef.current.splice(0)
      sendEvents([...buffered, ev].map((e) => ({ ...e, sessionId: sid })), useBeacon)
    } else {
      pendingEventsRef.current.push(ev)
    }
  }

  const openScreen = (s: Step, careerKey: string | null) => {
    screenRef.current = {
      step: s,
      careerKey,
      enteredAt: Date.now(),
      hiddenSince: typeof document !== 'undefined' && document.visibilityState === 'hidden' ? Date.now() : null,
      hiddenMs: 0,
      meta: {},
    }
  }

  // Interacciones dentro de la pantalla actual (van en el meta del evento).
  const noteMeta = (k: 'expand' | 'showAll') => {
    const m = screenRef.current.meta
    if (k === 'expand') m.expanded = ((m.expanded as number) || 0) + 1
    if (k === 'showAll') m.showAll = true
  }

  // Cambio de pantalla → cerramos el evento anterior y abrimos el nuevo.
  const trackedRef = useRef<{ step: Step; careerKey: string | null }>({ step: 'landing', careerKey: null })
  useEffect(() => {
    const currentCareer = step === 'career' ? (career?.key ?? null) : null
    if (trackedRef.current.step === step && trackedRef.current.careerKey === currentCareer) return
    closeScreen()
    openScreen(step, currentCareer)
    trackedRef.current = { step, careerKey: currentCareer }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, career])

  // Pausa por pestaña oculta + último evento al cerrar/abandonar la página.
  useEffect(() => {
    const onVisibility = () => {
      const s = screenRef.current
      if (document.visibilityState === 'hidden') {
        s.hiddenSince = Date.now()
      } else if (s.hiddenSince) {
        s.hiddenMs += Date.now() - s.hiddenSince
        s.hiddenSince = null
      }
    }
    const onPageHide = () => {
      closeScreen(true)
      // Si vuelve (bfcache), arranca una visita nueva a la misma pantalla.
      openScreen(screenRef.current.step, screenRef.current.careerKey)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Semilla del historial: el paso inicial queda registrado para poder volver.
  useEffect(() => {
    window.history.replaceState({ step: 'landing' }, '')
  }, [])

  // Botones atrás/adelante del navegador (clave en celulares: el swipe-back
  // no debe sacar al estudiante de la app perdiendo todo su progreso).
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const s = (e.state?.step ?? null) as Step | null
      if (!s) return
      // Pasos que dependen de datos en memoria: si faltan, caemos a un paso seguro.
      if (s === 'career' && !career) return setStep(careersData ? 'gallery' : 'landing')
      if (s === 'results' && (!area || !careersData)) return setStep('landing')
      if ((s === 'gallery' || s === 'final') && !careersData) return setStep('landing')
      setStep(s)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [career, careersData, area])

  // ── acciones ──
  async function startFromOpen() {
    const sid = await ensureSession()
    if (sid) {
      fetch('/api/explorer/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sid, name, preAnswers: { q1: open[0], q2: open[1], q3: open[2] } }),
      }).catch(() => {})
    }
    setQi(0)
    setAnswers([])
    go('test')
  }

  function answerTest(value: number) {
    const next = [...answers]
    next[qi] = value
    setAnswers(next)
    if (qi < TEST.length - 1) {
      setQi(qi + 1)
    } else {
      finishTest(next)
    }
  }

  async function finishTest(all: number[]) {
    const p = computeProfile(all)
    setArea(p.area)
    setProfileTop(p.top)
    const data = await loadCareers()
    const suggested = data?.areas[p.area]?.careers ?? []
    const sid = sessionIdRef.current
    if (sid) {
      fetch('/api/explorer/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sid,
          profileArea: p.area,
          suggestedCareers: { careers: suggested, riasec: p.riasec, top: p.top },
        }),
      }).catch(() => {})
    }
    go('results')
  }

  async function loadCareers(): Promise<CareersResponse | null> {
    if (careersData) return careersData
    try {
      // La sesión define el grupo del experimento: los conteos de testimonios
      // que devuelven las tarjetas dependen de ella.
      const sid = await ensureSession()
      const res = await fetch(`/api/explorer/careers${sid ? `?session=${sid}` : ''}`)
      if (res.ok) {
        const d: CareersResponse = await res.json()
        setCareersData(d)
        return d
      }
    } catch { /* noop */ }
    return null
  }

  async function openCareer(key: string) {
    setLoading(true)
    setShowAllTestimonials(false)
    try {
      const sid = await ensureSession()
      const res = await fetch(`/api/explorer/career?key=${key}${sid ? `&session=${sid}` : ''}`)
      if (res.ok) {
        const data: CareerDetail = await res.json()
        data.testimonials = shuffle(data.testimonials)
        setCareer(data)
        go('career')
      }
    } catch { /* noop */ } finally {
      setLoading(false)
    }
  }

  async function submitFinal() {
    const sid = sessionIdRef.current
    if (sid) {
      fetch('/api/explorer/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sid, usefulRating: useful, leaning }),
      }).catch(() => {})
    }
    go('done')
  }

  // ── render ──
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-white text-slate-800">
      <div className="mx-auto w-full max-w-xl px-5 py-6 pb-24">
        <button onClick={() => go('landing')} className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Rumbo"
            width={1054}
            height={355}
            priority
            className="h-10 w-auto rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-100"
          />
          <span className="text-xs font-medium text-slate-400">lo que ningún folleto te cuenta</span>
        </button>

        <div className="mt-6">
          {step === 'landing' && <Landing name={name} setName={setName} onStart={() => { ensureSession(); go('open') }} onGallery={async () => { await loadCareers(); go('gallery') }} />}
          {step === 'open' && <OpenQuestions open={open} setOpen={setOpen} onNext={startFromOpen} onBack={() => go('landing')} />}
          {step === 'test' && <TestView qi={qi} onAnswer={answerTest} onBack={() => (qi > 0 ? setQi(qi - 1) : go('open'))} />}
          {step === 'results' && area && careersData && (
            <Results
              name={name}
              area={area}
              profileTop={profileTop}
              data={careersData}
              onPick={openCareer}
              onRetake={() => { setQi(0); setAnswers([]); go('test') }}
              onFinish={() => goFinal('results')}
              loading={loading}
            />
          )}
          {step === 'gallery' && careersData && (
            <Gallery data={careersData} onPick={openCareer} onBack={() => go('landing')} loading={loading} />
          )}
          {step === 'career' && career && (
            <CareerView
              c={career}
              showAll={showAllTestimonials}
              setShowAll={(v) => { if (v) noteMeta('showAll'); setShowAllTestimonials(v) }}
              onExpandTestimonial={() => noteMeta('expand')}
              onBack={() => go(area ? 'results' : 'gallery')}
              onFinish={() => goFinal('career')}
            />
          )}
          {step === 'final' && careersData && (
            <FinalSurvey
              careers={careersData.careers}
              useful={useful}
              setUseful={setUseful}
              leaning={leaning}
              setLeaning={setLeaning}
              onBack={() => go(beforeFinal)}
              onSubmit={submitFinal}
            />
          )}
          {step === 'done' && <Done name={name} />}
        </div>
      </div>
    </main>
  )
}

// ─── Sub-vistas ──────────────────────────────────────────────────────────────

function Landing({ name, setName, onStart, onGallery }: { name: string; setName: (v: string) => void; onStart: () => void; onGallery: () => void }) {
  return (
    <div className="pt-4 text-center">
      <span className="inline-block rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-amber-700">
        Elegí qué estudiar, sin humo
      </span>
      <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl">
        La verdad de tu carrera, contada por{' '}
        <span className="bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">quienes ya la viven</span>.
      </h1>
      <p className="mx-auto mt-4 max-w-md text-slate-600">
        Nada de folletos ni charlas de venta. Testimonios reales de estudiantes y egresados: lo bueno, lo difícil y lo que nadie te avisa.
      </p>

      <div className="mx-auto mt-7 max-w-xs text-left">
        <label className="mb-2 block text-sm font-semibold text-slate-600">¿Cómo te llamás? (opcional)</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
        />
      </div>

      <button onClick={onStart} className="mt-6 inline-flex items-center gap-2 rounded-full bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        Empezar → 2 min
      </button>
      <button onClick={onGallery} className="mt-4 block w-full text-sm font-semibold text-slate-400 hover:text-slate-600">
        o explorá las carreras directamente
      </button>

      <div className="mt-10 grid gap-3 text-left">
        <Feature ic="🎧" t="Voces reales" d="Estudiantes que ya cursaron o se recibieron, no una web institucional." />
        <Feature ic="🫢" t="Lo que no te dicen" d="Lo más difícil, las sorpresas y de qué se labura en serio." />
        <Feature ic="🧭" t="Una brújula, no un veredicto" d="El test te sugiere por dónde empezar. La decisión, tuya." />
      </div>
    </div>
  )
}

function Feature({ ic, t, d }: { ic: string; t: string; d: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <span className="text-2xl">{ic}</span>
      <div>
        <h4 className="font-bold text-slate-800">{t}</h4>
        <p className="text-sm text-slate-500">{d}</p>
      </div>
    </div>
  )
}

function OpenQuestions({ open, setOpen, onNext, onBack }: { open: string[]; setOpen: (v: string[]) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-800">← Volver al inicio</button>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Antes de arrancar</p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">Contanos por dónde venís</h2>
      <p className="mt-2 text-sm text-slate-500">No hay respuestas correctas. Podés saltear las que quieras.</p>

      <div className="mt-6 space-y-6">
        {OPEN_QUESTIONS.map((q, i) => (
          <div key={i}>
            <label className="mb-2 block text-[15px] font-medium text-slate-700">{q}</label>
            <textarea
              value={open[i]}
              onChange={(e) => { const n = [...open]; n[i] = e.target.value; setOpen(n) }}
              rows={3}
              placeholder="Escribí lo que quieras..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
            />
          </div>
        ))}
      </div>

      <button onClick={onNext} className="mt-8 w-full rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        Ir al test →
      </button>
    </div>
  )
}

function TestView({ qi, onAnswer, onBack }: { qi: number; onAnswer: (value: number) => void; onBack: () => void }) {
  const item = TEST[qi]
  return (
    <div>
      <div className="text-sm font-semibold text-slate-400">{qi + 1} de {TEST.length}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400 transition-all duration-300" style={{ width: `${(qi / TEST.length) * 100}%` }} />
      </div>
      <p className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400">¿Qué tanto te copa?</p>
      <h2 className="mt-2 text-2xl font-extrabold leading-snug tracking-tight text-slate-900">{item.activity}</h2>
      <div className="mt-6 grid gap-3">
        {SCALE.map((s) => (
          <button key={s.value} onClick={() => onAnswer(s.value)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
            <span className="text-2xl">{s.emoji}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>
      <button onClick={onBack} className="mt-6 text-sm font-semibold text-slate-400 hover:text-slate-600">← Atrás</button>
    </div>
  )
}

function CareerCard({ c, featured, onPick }: { c: CareerListItem; featured?: boolean; onPick: (k: string) => void }) {
  return (
    <button
      onClick={() => onPick(c.key)}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
        featured ? 'border-violet-200 bg-gradient-to-r from-violet-50 to-orange-50' : 'border-slate-200 bg-white'
      }`}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white text-2xl shadow-sm">{c.emoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold text-slate-800">{c.name}</span>
        <span className="block text-xs text-slate-400">{c.areaName}</span>
        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${c.count >= 5 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
          {c.count} {c.count === 1 ? 'testimonio' : 'testimonios'}
        </span>
      </span>
      <span className="text-slate-300">→</span>
    </button>
  )
}

function Results({ name, area, profileTop, data, onPick, onRetake, onFinish, loading }: { name: string; area: AreaKey; profileTop: RiasecType[]; data: CareersResponse; onPick: (k: string) => void; onRetake: () => void; onFinish: () => void; loading: boolean }) {
  const areaInfo = data.areas[area]
  const featuredKeys = areaInfo?.careers ?? []
  const featured = data.careers.filter((c) => featuredKeys.includes(c.key))
  const rest = data.careers.filter((c) => !featuredKeys.includes(c.key))
  return (
    <div>
      <button onClick={onRetake} className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-800">← Rehacer el test</button>
      <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">
        {name ? `${name}, tu perfil da para` : 'Tu perfil da para'}
      </p>
      <h2 className="mt-3 flex items-center justify-center gap-3 text-center text-3xl font-extrabold tracking-tight text-slate-900">
        <span className="text-4xl">{areaInfo?.emoji}</span> {areaInfo?.name}
      </h2>

      {profileTop.length > 0 && (
        <div className="mt-5">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">Tu perfil de intereses</p>
          <div className="mt-3 grid gap-2">
            {profileTop.map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                <span className="text-2xl">{RIASEC_LABELS[t].emoji}</span>
                <div>
                  <p className="font-bold text-slate-800">{RIASEC_LABELS[t].name}</p>
                  <p className="text-sm text-slate-500">{RIASEC_LABELS[t].blurb}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mx-auto mt-5 max-w-md rounded-2xl bg-violet-50 p-4 text-center text-sm text-slate-600 ring-1 ring-violet-100">
        Es una <b>sugerencia para arrancar a explorar</b>, no un destino escrito en piedra. Metete, escuchá a los que ya están adentro y decidí vos.
      </p>

      {loading && <p className="mt-6 text-center text-sm text-slate-400">Cargando…</p>}

      <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">Carreras de tu área con testimonios</h3>
      <div className="mt-3 grid gap-3">
        {featured.map((c) => <CareerCard key={c.key} c={c} featured onPick={onPick} />)}
      </div>

      <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">Todas las carreras</h3>
      <div className="mt-3 grid gap-3">
        {rest.map((c) => <CareerCard key={c.key} c={c} onPick={onPick} />)}
      </div>

      <button onClick={onFinish} className="mt-8 w-full rounded-full border border-slate-200 bg-white px-8 py-3.5 font-bold text-slate-600 transition hover:bg-slate-50">
        Terminar y darnos tu opinión
      </button>
    </div>
  )
}

function Gallery({ data, onPick, onBack, loading }: { data: CareersResponse; onPick: (k: string) => void; onBack: () => void; loading: boolean }) {
  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-800">← Volver al inicio</button>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Carreras disponibles</h2>
      <p className="mt-1 text-sm text-slate-500">Elegí una para leer lo que cuentan los estudiantes reales.</p>
      {loading && <p className="mt-6 text-center text-sm text-slate-400">Cargando…</p>}
      <div className="mt-5 grid gap-3">
        {data.careers.map((c) => <CareerCard key={c.key} c={c} onPick={onPick} />)}
      </div>
    </div>
  )
}

function CareerView({ c, showAll, setShowAll, onExpandTestimonial, onBack, onFinish }: { c: CareerDetail; showAll: boolean; setShowAll: (v: boolean) => void; onExpandTestimonial: () => void; onBack: () => void; onFinish: () => void }) {
  const visible = showAll ? c.testimonials : c.testimonials.slice(0, 5)
  return (
    <div>
      <button onClick={onBack} className="text-sm font-semibold text-slate-500 hover:text-slate-800">← Volver</button>

      <div className="mt-3 rounded-3xl bg-gradient-to-br from-violet-100 to-orange-50 p-6 ring-1 ring-violet-100">
        <span className="text-4xl">{c.emoji}</span>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900">{c.name}</h2>
        <p className="mt-2 text-sm text-slate-600">
          🎧 Basado en <b>{c.count}</b> {c.count === 1 ? 'testimonio real' : 'testimonios reales'} de estudiantes que ya la cursaron o se recibieron.
        </p>
      </div>

      {/* Resumen ejecutivo (IA / fallback) */}
      <div className="mt-6 space-y-4">
        {c.summary.map((block) => {
          const dq = DIGEST_QUESTIONS[block.qi]
          if (!dq) return null
          return (
            <div key={block.qi} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <h3 className="font-extrabold text-slate-900"><span className="mr-2">{dq.emoji}</span>{dq.q}</h3>
              <div className="mt-3 space-y-3">
                {block.groups.map((g, i) => (
                  <div key={i}>
                    {g.label && <p className="text-[11px] font-bold uppercase tracking-wide text-orange-500">{g.label}</p>}
                    <p className="text-[15px] leading-relaxed text-slate-600">{g.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Testimonios crudos */}
      {visible.length > 0 && (
        <>
          <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-slate-400">En sus propias palabras</h3>
          <div className="mt-3 space-y-3">
            {visible.map((t, i) => (
              <TestimonialCard key={i} t={t} careerName={c.name} onExpand={onExpandTestimonial} />
            ))}
          </div>
          {!showAll && c.testimonials.length > 5 && (
            <button onClick={() => setShowAll(true)} className="mt-4 w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              Ver los otros {c.testimonials.length - 5} testimonios
            </button>
          )}
        </>
      )}

      <div className="mt-8 grid gap-3">
        <button onClick={onBack} className="w-full rounded-full border border-slate-200 bg-white px-8 py-3.5 font-bold text-slate-600 transition hover:bg-slate-50">
          ← Explorar otras carreras
        </button>
        <button onClick={onFinish} className="w-full rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
          Terminar y darnos tu opinión
        </button>
      </div>
    </div>
  )
}

function TestimonialCard({ t, careerName, onExpand }: { t: Testimonial; careerName: string; onExpand: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const toggle = () => {
    if (!expanded) onExpand()
    setExpanded(!expanded)
  }
  const items = expanded ? t.items : t.items.slice(0, 3)
  const hidden = t.items.length - 3
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-violet-500">Estudiante de {careerName} · {t.stage}</p>
      <div className="mt-2 space-y-2.5">
        {items.map((it, j) =>
          it.k === 'b5_q1' ? (
            <div key={j} className="rounded-xl bg-orange-50 p-3 ring-1 ring-orange-100">
              <p className="text-[11px] font-bold uppercase tracking-wide text-orange-600">🎤 Su recomendación</p>
              <p className="mt-1 text-sm font-medium leading-relaxed text-slate-700">“{it.a}”</p>
            </div>
          ) : (
            <div key={j}>
              {it.label && <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{it.label}</p>}
              <p className="text-sm leading-relaxed text-slate-600">“{it.a}”</p>
            </div>
          )
        )}
      </div>
      {hidden > 0 && (
        <button onClick={toggle} className="mt-3 text-sm font-bold text-violet-600 hover:text-violet-800">
          {expanded ? 'Ver menos' : `Leer el testimonio completo (${hidden} ${hidden === 1 ? 'respuesta' : 'respuestas'} más)`}
        </button>
      )}
    </div>
  )
}

function FinalSurvey({ careers, useful, setUseful, leaning, setLeaning, onBack, onSubmit }: {
  careers: CareerListItem[]
  useful: string; setUseful: (v: string) => void
  leaning: string; setLeaning: (v: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const usefulOpts = ['¡Sí, un montón!', 'Más o menos', 'La verdad que no']
  return (
    <div>
      <button onClick={onBack} className="mb-4 text-sm font-semibold text-slate-500 hover:text-slate-800">← Quiero seguir explorando</button>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Una última cosa 🙌</h2>
      <p className="mt-2 text-sm text-slate-500">Tu respuesta nos ayuda a mejorar. Son 10 segundos. Si querés, después podés volver a mirar más testimonios.</p>

      <div className="mt-6">
        <p className="text-[15px] font-semibold text-slate-700">¿Te sirvió la información que te mostramos?</p>
        <div className="mt-3 grid gap-2">
          {usefulOpts.map((o) => (
            <button key={o} onClick={() => setUseful(o)} className={`rounded-2xl border px-4 py-3 text-left font-medium transition ${useful === o ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'}`}>
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7">
        <p className="text-[15px] font-semibold text-slate-700">Después de leer todo, ¿por qué carrera te inclinás más?</p>
        <div className="mt-3 grid gap-2">
          {careers.map((c) => (
            <button key={c.key} onClick={() => setLeaning(c.key)} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left font-medium transition ${leaning === c.key ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'}`}>
              <span>{c.emoji}</span> {c.name}
            </button>
          ))}
          <button onClick={() => setLeaning('ninguna')} className={`rounded-2xl border px-4 py-3 text-left font-medium transition ${leaning === 'ninguna' ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200'}`}>
            Ninguna / Todavía no sé
          </button>
        </div>
      </div>

      <button onClick={onSubmit} disabled={!useful && !leaning} className="mt-8 w-full rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-40">
        Enviar
      </button>
    </div>
  )
}

function Done({ name }: { name: string }) {
  return (
    <div className="py-10 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">
        {name ? `¡Gracias, ${name}!` : '¡Gracias!'}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-slate-600">
        Ojalá te haya servido para ver tus opciones con un poco más de claridad. El próximo paso: hablá con alguien que estudie lo que te copó. 💜
      </p>
    </div>
  )
}
