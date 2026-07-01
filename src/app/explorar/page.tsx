'use client'

import { useState } from 'react'
import { DIGEST_QUESTIONS } from '@/lib/digests'

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
type Testimonial = { stage: string; items: { label: string; a: string }[] }
type CareerDetail = {
  key: string
  name: string
  emoji: string
  area: AreaKey
  count: number
  summary: Block[]
  testimonials: Testimonial[]
}

// ─── Contenido estático ──────────────────────────────────────────────────────
const OPEN_QUESTIONS = [
  '¿Ya pensaste en qué querés hacer cuando termines el liceo? Contá lo que tengas, aunque sea difuso.',
  '¿Consideraste alguna carrera en particular? ¿Cuál (o cuáles)?',
  '¿Qué es lo que más te importa a la hora de elegir? (que te guste, la plata, la salida laboral, ayudar a otros...)',
]

type TestOpt = { em: string; t: string; a: AreaKey }
const TEST: { q: string; opts: TestOpt[] }[] = [
  { q: 'Elegí el plan que más te tienta:', opts: [
    { em: '💻', t: 'Entender cómo funciona una app o una máquina por dentro', a: 'tecnologia' },
    { em: '📈', t: 'Montar un emprendimiento y hacerlo crecer', a: 'negocios' },
    { em: '🎬', t: 'Crear contenido que la gente quiera compartir', a: 'comunicacion' },
    { em: '🩺', t: 'Estar en contacto con gente y ayudarla', a: 'salud' },
  ]},
  { q: '¿Qué te da más satisfacción?', opts: [
    { em: '🧩', t: 'Resolver un problema difícil, paso a paso', a: 'tecnologia' },
    { em: '🤝', t: 'Cerrar un buen trato o negociar algo', a: 'negocios' },
    { em: '✨', t: 'Que algo que hiciste emocione o convenza a alguien', a: 'comunicacion' },
    { em: '💚', t: 'Ver que alguien está mejor gracias a vos', a: 'salud' },
  ]},
  { q: 'En el liceo, lo que más disfrutás es…', opts: [
    { em: '🔢', t: 'Los números, la lógica, resolver', a: 'tecnologia' },
    { em: '🗂️', t: 'Los proyectos donde hay que organizar y decidir', a: 'negocios' },
    { em: '✍️', t: 'Escribir, debatir, presentar', a: 'comunicacion' },
    { em: '🧬', t: 'Biología y entender cómo funciona la gente', a: 'salud' },
  ]},
  { q: 'Si tuvieras que laburar 8 horas, preferirías…', opts: [
    { em: '⌨️', t: 'Frente a una compu construyendo algo', a: 'tecnologia' },
    { em: '📊', t: 'En reuniones, planificando y moviendo el negocio', a: 'negocios' },
    { em: '🎨', t: 'Produciendo ideas, campañas y contenido', a: 'comunicacion' },
    { em: '🫂', t: 'Con personas, cara a cara', a: 'salud' },
  ]},
  { q: 'Te sentís más orgulloso cuando…', opts: [
    { em: '✅', t: 'Algo que armaste funciona sin errores', a: 'tecnologia' },
    { em: '💰', t: 'Un proyecto tuyo da resultados o plata', a: 'negocios' },
    { em: '📣', t: 'Tu mensaje llegó y la gente reaccionó', a: 'comunicacion' },
    { em: '🌱', t: 'Ayudaste a alguien a estar mejor', a: 'salud' },
  ]},
  { q: '¿Qué elogio te gusta más recibir?', opts: [
    { em: '🧠', t: '“Sos un genio resolviendo esto”', a: 'tecnologia' },
    { em: '💡', t: '“Tenés cabeza para los negocios”', a: 'negocios' },
    { em: '🎙️', t: '“Te expresás increíble”', a: 'comunicacion' },
    { em: '❤️', t: '“Se nota que te importa la gente”', a: 'salud' },
  ]},
  { q: 'Un problema del mundo que te gustaría atacar:', opts: [
    { em: '🤖', t: 'Hacer la tecnología más útil y accesible', a: 'tecnologia' },
    { em: '🏢', t: 'Crear empresas y generar trabajo', a: 'negocios' },
    { em: '📰', t: 'Mejorar cómo se comunica la información', a: 'comunicacion' },
    { em: '🏥', t: 'Cuidar la salud y el bienestar de las personas', a: 'salud' },
  ]},
  { q: '¿Con qué frase te identificás más?', opts: [
    { em: '🔧', t: '“Me encanta armar y desarmar cosas para entenderlas”', a: 'tecnologia' },
    { em: '🚀', t: '“Siempre estoy pensando en la próxima oportunidad”', a: 'negocios' },
    { em: '💬', t: '“Tengo mil ideas y quiero contarlas”', a: 'comunicacion' },
    { em: '🤗', t: '“Me gusta acompañar y cuidar a los demás”', a: 'salud' },
  ]},
]

const AREA_ORDER: AreaKey[] = ['tecnologia', 'negocios', 'comunicacion', 'salud']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Step = 'landing' | 'open' | 'test' | 'results' | 'gallery' | 'career' | 'final' | 'done'

// ─── Componente principal ────────────────────────────────────────────────────
export default function Explorar() {
  const [step, setStep] = useState<Step>('landing')
  const [name, setName] = useState('')
  const [open, setOpen] = useState(['', '', ''])
  const [qi, setQi] = useState(0)
  const [answers, setAnswers] = useState<AreaKey[]>([])
  const [area, setArea] = useState<AreaKey | null>(null)
  const [careersData, setCareersData] = useState<CareersResponse | null>(null)
  const [career, setCareer] = useState<CareerDetail | null>(null)
  const [showAllTestimonials, setShowAllTestimonials] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [useful, setUseful] = useState('')
  const [leaning, setLeaning] = useState('')
  const [loading, setLoading] = useState(false)

  const go = (s: Step) => {
    setStep(s)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── acciones ──
  async function startFromOpen() {
    // crear sesión (no bloquea si falla la DB)
    try {
      const res = await fetch('/api/explorer/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, preAnswers: { q1: open[0], q2: open[1], q3: open[2] } }),
      })
      if (res.ok) setSessionId((await res.json()).id)
    } catch { /* seguimos igual */ }
    setQi(0)
    setAnswers([])
    go('test')
  }

  function answerTest(a: AreaKey) {
    const next = [...answers]
    next[qi] = a
    setAnswers(next)
    if (qi < TEST.length - 1) {
      setQi(qi + 1)
    } else {
      finishTest(next)
    }
  }

  async function finishTest(all: AreaKey[]) {
    const score: Record<AreaKey, number> = { tecnologia: 0, negocios: 0, comunicacion: 0, salud: 0 }
    all.forEach((a) => (score[a] += 1))
    let top: AreaKey = 'negocios'
    let max = -1
    for (const k of AREA_ORDER) {
      if (score[k] > max) { max = score[k]; top = k }
    }
    setArea(top)
    await loadCareers()
    // guardar resultado del test
    if (sessionId) {
      const suggested = careersData?.areas[top]?.careers ?? []
      fetch('/api/explorer/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, profileArea: top, suggestedCareers: suggested }),
      }).catch(() => {})
    }
    go('results')
  }

  async function loadCareers() {
    if (careersData) return
    try {
      const res = await fetch('/api/explorer/careers')
      if (res.ok) setCareersData(await res.json())
    } catch { /* noop */ }
  }

  async function openCareer(key: string) {
    setLoading(true)
    setShowAllTestimonials(false)
    try {
      const res = await fetch(`/api/explorer/career?key=${key}`)
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
    if (sessionId) {
      fetch('/api/explorer/session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId, usefulRating: useful, leaning }),
      }).catch(() => {})
    }
    go('done')
  }

  // ── render ──
  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 to-white text-slate-800">
      <div className="mx-auto w-full max-w-xl px-5 py-6 pb-24">
        <button onClick={() => go('landing')} className="flex items-center gap-2 font-extrabold tracking-tight text-slate-900">
          <span className="h-3 w-3 rounded-full bg-orange-400 ring-4 ring-orange-100" />
          Posta
          <span className="ml-1 text-xs font-medium text-slate-400">lo que ningún folleto te cuenta</span>
        </button>

        <div className="mt-6">
          {step === 'landing' && <Landing name={name} setName={setName} onStart={() => go('open')} onGallery={async () => { await loadCareers(); go('gallery') }} />}
          {step === 'open' && <OpenQuestions open={open} setOpen={setOpen} onNext={startFromOpen} />}
          {step === 'test' && <TestView qi={qi} onAnswer={answerTest} onBack={() => (qi > 0 ? setQi(qi - 1) : go('open'))} />}
          {step === 'results' && area && careersData && (
            <Results name={name} area={area} data={careersData} onPick={openCareer} onFinish={() => go('final')} loading={loading} />
          )}
          {step === 'gallery' && careersData && (
            <Gallery data={careersData} onPick={openCareer} loading={loading} />
          )}
          {step === 'career' && career && (
            <CareerView
              c={career}
              showAll={showAllTestimonials}
              setShowAll={setShowAllTestimonials}
              onBack={() => go(area ? 'results' : 'gallery')}
              onFinish={() => go('final')}
            />
          )}
          {step === 'final' && careersData && (
            <FinalSurvey
              careers={careersData.careers}
              useful={useful}
              setUseful={setUseful}
              leaning={leaning}
              setLeaning={setLeaning}
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

function OpenQuestions({ open, setOpen, onNext }: { open: string[]; setOpen: (v: string[]) => void; onNext: () => void }) {
  return (
    <div>
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

function TestView({ qi, onAnswer, onBack }: { qi: number; onAnswer: (a: AreaKey) => void; onBack: () => void }) {
  const item = TEST[qi]
  return (
    <div>
      <div className="text-sm font-semibold text-slate-400">Pregunta {qi + 1} de {TEST.length}</div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-400 transition-all duration-300" style={{ width: `${(qi / TEST.length) * 100}%` }} />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">{item.q}</h2>
      <div className="mt-5 grid gap-3">
        {item.opts.map((o, i) => (
          <button key={i} onClick={() => onAnswer(o.a)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-md">
            <span className="text-2xl">{o.em}</span>
            <span>{o.t}</span>
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

function Results({ name, area, data, onPick, onFinish, loading }: { name: string; area: AreaKey; data: CareersResponse; onPick: (k: string) => void; onFinish: () => void; loading: boolean }) {
  const areaInfo = data.areas[area]
  const featuredKeys = areaInfo?.careers ?? []
  const featured = data.careers.filter((c) => featuredKeys.includes(c.key))
  const rest = data.careers.filter((c) => !featuredKeys.includes(c.key))
  return (
    <div>
      <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-400">
        {name ? `${name}, tu área sugerida es` : 'Tu área sugerida es'}
      </p>
      <h2 className="mt-3 flex items-center justify-center gap-3 text-center text-3xl font-extrabold tracking-tight text-slate-900">
        <span className="text-4xl">{areaInfo?.emoji}</span> {areaInfo?.name}
      </h2>
      <p className="mx-auto mt-4 max-w-md rounded-2xl bg-violet-50 p-4 text-center text-sm text-slate-600 ring-1 ring-violet-100">
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

function Gallery({ data, onPick, loading }: { data: CareersResponse; onPick: (k: string) => void; loading: boolean }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Carreras disponibles</h2>
      <p className="mt-1 text-sm text-slate-500">Elegí una para leer lo que cuentan los estudiantes reales.</p>
      {loading && <p className="mt-6 text-center text-sm text-slate-400">Cargando…</p>}
      <div className="mt-5 grid gap-3">
        {data.careers.map((c) => <CareerCard key={c.key} c={c} onPick={onPick} />)}
      </div>
    </div>
  )
}

function CareerView({ c, showAll, setShowAll, onBack, onFinish }: { c: CareerDetail; showAll: boolean; setShowAll: (v: boolean) => void; onBack: () => void; onFinish: () => void }) {
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
              <div key={i} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold text-violet-500">Estudiante de {c.name} · {t.stage}</p>
                <div className="mt-2 space-y-2.5">
                  {t.items.slice(0, 3).map((it, j) => (
                    <div key={j}>
                      {it.label && <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{it.label}</p>}
                      <p className="text-sm leading-relaxed text-slate-600">“{it.a}”</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {!showAll && c.testimonials.length > 5 && (
            <button onClick={() => setShowAll(true)} className="mt-4 w-full rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50">
              Ver los otros {c.testimonials.length - 5} testimonios
            </button>
          )}
        </>
      )}

      <button onClick={onFinish} className="mt-8 w-full rounded-full bg-violet-600 px-8 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700">
        Terminar y darnos tu opinión
      </button>
    </div>
  )
}

function FinalSurvey({ careers, useful, setUseful, leaning, setLeaning, onSubmit }: {
  careers: CareerListItem[]
  useful: string; setUseful: (v: string) => void
  leaning: string; setLeaning: (v: string) => void
  onSubmit: () => void
}) {
  const usefulOpts = ['¡Sí, un montón!', 'Más o menos', 'La verdad que no']
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Una última cosa 🙌</h2>
      <p className="mt-2 text-sm text-slate-500">Tu respuesta nos ayuda a mejorar. Son 10 segundos.</p>

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
