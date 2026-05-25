'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────

type UniversityType = 'publica' | 'privada' | 'otra' | ''

interface FormData {
  // Step 0
  name: string
  // Block 1
  career: string
  universityName: string
  universityType: UniversityType
  yearStage: string
  // Block 2
  b2_q1: string
  b2_q2: string
  b2_q3: string
  // Block 3
  b3_q1: string
  b3_q2: string
  b3_q3: string
  // Block 4
  b4_q1: string
  b4_q2: string
  b4_q3: string
  b4_q4: string
  // Block 5
  b5_q1: string
  b5_q2: string
}

const EMPTY: FormData = {
  name: '',
  career: '',
  universityName: '',
  universityType: '',
  yearStage: '',
  b2_q1: '',
  b2_q2: '',
  b2_q3: '',
  b3_q1: '',
  b3_q2: '',
  b3_q3: '',
  b4_q1: '',
  b4_q2: '',
  b4_q3: '',
  b4_q4: '',
  b5_q1: '',
  b5_q2: '',
}

const TOTAL_STEPS = 6

// ─── Sub-components ──────────────────────────────────────────────────────────

type SetFn = (key: keyof FormData) => (val: string) => void
type StepProps = { form: FormData; set: SetFn }

function BlockHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-10">
      <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">{label}</p>
      <h2 className="text-2xl font-light text-neutral-900 leading-snug">{title}</h2>
    </div>
  )
}

function Question({
  question,
  value,
  onChange,
}: {
  question: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="mb-10">
      <p className="text-neutral-700 text-base leading-relaxed mb-4">{question}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full border-b border-neutral-150 focus:border-neutral-500 outline-none resize-none text-neutral-600 text-sm leading-relaxed bg-transparent pb-3 transition-colors duration-200 placeholder:text-neutral-300"
        placeholder="Escribí tu respuesta acá..."
      />
    </div>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="mb-8">
      <p className="text-neutral-700 text-base leading-relaxed mb-3">{label}</p>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-neutral-150 focus:border-neutral-500 outline-none text-neutral-600 text-sm bg-transparent pb-3 transition-colors duration-200 placeholder:text-neutral-300"
      />
    </div>
  )
}

// ─── Step Components ─────────────────────────────────────────────────────────

function StepIntro({ form, set }: StepProps) {
  return (
    <div>
      <div className="mb-12">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-6">
          Investigación vocacional · Uruguay
        </p>
        <p className="text-neutral-500 text-sm leading-loose">
          Este formulario es parte de una investigación sobre orientación vocacional en Uruguay.
          Las respuestas son anónimas. No hay respuestas correctas —{' '}
          <span className="text-neutral-700">nos interesa tu experiencia real, sin filtros.</span>
        </p>
      </div>

      <div className="mb-4">
        <p className="text-neutral-700 text-base mb-4">¿Cómo te llamás?</p>
        <input
          type="text"
          value={form.name}
          onChange={(e) => set('name')(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          className="w-full border-b border-neutral-200 focus:border-neutral-900 outline-none text-2xl font-light pb-4 placeholder:text-neutral-200 bg-transparent transition-colors duration-200"
        />
      </div>
    </div>
  )
}

function StepBlock1({ form, set }: StepProps) {
  return (
    <div>
      <BlockHeader label="Bloque 1" title="Contexto" />

      <TextInput
        label="¿Qué carrera estudiás?"
        value={form.career}
        onChange={set('career')}
        placeholder="Ej: Ingeniería en Sistemas"
      />

      <TextInput
        label="¿En qué institución?"
        value={form.universityName}
        onChange={set('universityName')}
        placeholder="Ej: UDELAR, ORT, UCU..."
      />

      <div className="mb-8">
        <p className="text-neutral-700 text-base mb-4">Tipo de institución</p>
        <div className="flex gap-8">
          {(
            [
              { value: 'publica', label: 'Pública' },
              { value: 'privada', label: 'Privada' },
              { value: 'otra', label: 'Otra' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('universityType')(opt.value)}
              className={`text-sm pb-1.5 border-b-2 transition-all duration-200 ${
                form.universityType === opt.value
                  ? 'border-neutral-900 text-neutral-900 font-medium'
                  : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <TextInput
        label="¿En qué año o etapa de la carrera estás?"
        value={form.yearStage}
        onChange={set('yearStage')}
        placeholder="Ej: 3er año, egresada/o, cursando tesis..."
      />
    </div>
  )
}

function StepBlock2({ form, set }: StepProps) {
  return (
    <div>
      <BlockHeader label="Bloque 2" title="Cómo elegiste" />
      <Question
        question="¿Cómo llegaste a elegir esa carrera? Contanos el proceso con tus palabras."
        value={form.b2_q1}
        onChange={set('b2_q1')}
      />
      <Question
        question="¿Qué otras opciones consideraste antes de decidirte? ¿Por qué las descartaste?"
        value={form.b2_q2}
        onChange={set('b2_q2')}
      />
      <Question
        question="¿Quiénes o qué influyeron más en tu decisión?"
        value={form.b2_q3}
        onChange={set('b2_q3')}
      />
    </div>
  )
}

function StepBlock3({ form, set }: StepProps) {
  return (
    <div>
      <BlockHeader label="Bloque 3" title="Lo que no sabías" />
      <Question
        question="Antes de empezar, ¿qué creías que iba a ser la carrera? ¿En qué se parecía o diferenciaba de lo que encontraste?"
        value={form.b3_q1}
        onChange={set('b3_q1')}
      />
      <Question
        question="¿Qué información concreta te hubiera cambiado la decisión, o te hubiera hecho elegir con más seguridad?"
        value={form.b3_q2}
        onChange={set('b3_q2')}
      />
      <Question
        question="¿Hubo algo que te sorprendió — positiva o negativamente — cuando ya estabas adentro?"
        value={form.b3_q3}
        onChange={set('b3_q3')}
      />
    </div>
  )
}

function StepBlock4({ form, set }: StepProps) {
  return (
    <div>
      <BlockHeader label="Bloque 4" title="El día a día real" />
      <Question
        question="Describí cómo es una semana típica en tu carrera: materias, carga horaria, cómo se estudia, qué se hace."
        value={form.b4_q1}
        onChange={set('b4_q1')}
      />
      <Question
        question="¿Qué habilidades o características personales creés que son necesarias para que a alguien le vaya bien en tu carrera?"
        value={form.b4_q2}
        onChange={set('b4_q2')}
      />
      <Question
        question="¿De qué trabajan o pueden trabajar quienes estudian tu carrera? ¿Eso lo sabías antes de entrar?"
        value={form.b4_q3}
        onChange={set('b4_q3')}
      />
      <Question
        question="¿Qué es lo más difícil de la carrera que nadie te avisó?"
        value={form.b4_q4}
        onChange={set('b4_q4')}
      />
    </div>
  )
}

function StepBlock5({ form, set }: StepProps) {
  return (
    <div>
      <BlockHeader label="Bloque 5" title="Reflexión honesta" />
      <Question
        question="Si pudieras hablarle a alguien que está pensando en estudiar tu carrera, ¿qué le dirías que ningún folleto o charla te dice?"
        value={form.b5_q1}
        onChange={set('b5_q1')}
      />
      <Question
        question="Hoy, ¿sentís que elegiste bien? ¿Por qué?"
        value={form.b5_q2}
        onChange={set('b5_q2')}
      />
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Page() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const set: SetFn = (key) => (val) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const canContinue = () => {
    if (step === 0) return form.name.trim().length > 0
    if (step === 1)
      return (
        form.career.trim().length > 0 &&
        form.universityName.trim().length > 0 &&
        form.universityType !== '' &&
        form.yearStage.trim().length > 0
      )
    return true
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1)
  }

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al enviar')
      router.push('/gracias')
    } catch {
      alert('Ocurrió un error al enviar. Por favor intentá de nuevo.')
      setSubmitting(false)
    }
  }

  const isLastStep = step === TOTAL_STEPS - 1

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Barra de progreso fija */}
      <div className="fixed top-0 left-0 right-0 z-10 bg-white pt-safe pb-3">
        <div className="max-w-xl md:max-w-2xl mx-auto px-6">
          <div className="flex gap-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={`h-px flex-1 transition-all duration-500 ${
                  i <= step ? 'bg-neutral-900' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>
          <p className="text-right text-xs text-neutral-300 mt-2">
            {step + 1} / {TOTAL_STEPS}
          </p>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 max-w-xl md:max-w-2xl mx-auto w-full px-6 md:px-8 pt-20 pb-36">
        {step === 0 && <StepIntro form={form} set={set} />}
        {step === 1 && <StepBlock1 form={form} set={set} />}
        {step === 2 && <StepBlock2 form={form} set={set} />}
        {step === 3 && <StepBlock3 form={form} set={set} />}
        {step === 4 && <StepBlock4 form={form} set={set} />}
        {step === 5 && <StepBlock5 form={form} set={set} />}
      </div>

      {/* Navegación fija abajo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100">
        <div className="max-w-xl md:max-w-2xl mx-auto px-6 md:px-8 pt-4 pb-safe flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={step === 0}
            className="min-h-[44px] text-sm text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-0 disabled:pointer-events-none px-2"
          >
            ← Anterior
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="min-h-[44px] text-sm px-7 py-3 bg-neutral-900 text-white rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-40"
            >
              {submitting ? 'Enviando...' : 'Enviar respuestas'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canContinue()}
              className="min-h-[44px] text-sm px-7 py-3 bg-neutral-900 text-white rounded-full hover:bg-neutral-700 transition-colors disabled:opacity-30"
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
