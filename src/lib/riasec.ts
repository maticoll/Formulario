// ─────────────────────────────────────────────────────────────────────────────
// Test vocacional corto basado en el modelo RIASEC de Holland
// (Realista, Investigador, Artístico, Social, Emprendedor, Convencional).
// Es el marco del Test de Holland; los ítems siguen el estilo "¿cuánto te
// gustaría esta actividad?" de los inventarios de Kuder y Belarmino.
// 12 ítems (2 por tipo) → perfil RIASEC → área → carreras.
// ─────────────────────────────────────────────────────────────────────────────

import type { AreaKey } from './careers'

export type RiasecType = 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

export const RIASEC_TYPES: RiasecType[] = ['R', 'I', 'A', 'S', 'E', 'C']

export const RIASEC_LABELS: Record<RiasecType, { name: string; emoji: string; blurb: string }> = {
  R: { name: 'Realista', emoji: '🔧', blurb: 'Manos a la obra: construir, arreglar, cosas concretas.' },
  I: { name: 'Investigador', emoji: '🔬', blurb: 'Analizar, entender cómo funcionan las cosas y resolver.' },
  A: { name: 'Artístico', emoji: '🎨', blurb: 'Crear, expresar e imaginar sin fórmulas fijas.' },
  S: { name: 'Social', emoji: '🤝', blurb: 'Ayudar, enseñar y estar con la gente.' },
  E: { name: 'Emprendedor', emoji: '🚀', blurb: 'Liderar, convencer y mover proyectos o negocios.' },
  C: { name: 'Convencional', emoji: '📋', blurb: 'Orden, datos, números y procesos claros.' },
}

export type TestItem = { activity: string; type: RiasecType }

// 6 ítems: uno por tipo RIASEC. Versión express ( mínima fricción ).
export const TEST: TestItem[] = [
  { activity: 'Investigar por qué pasan las cosas y resolver un problema difícil paso a paso.', type: 'I' },
  { activity: 'Liderar un proyecto, convencer a otros o armar un emprendimiento.', type: 'E' },
  { activity: 'Crear algo tuyo: escribir, diseñar, hacer música o editar videos.', type: 'A' },
  { activity: 'Ayudar, escuchar o enseñarle algo a alguien que lo necesita.', type: 'S' },
  { activity: 'Ordenar información, llevar cuentas y trabajar con datos precisos.', type: 'C' },
  { activity: 'Arreglar o armar algo con tus manos, o trabajar con máquinas y herramientas.', type: 'R' },
]

export const SCALE: { label: string; emoji: string; value: number }[] = [
  { label: '¡Me copa!', emoji: '😍', value: 2 },
  { label: 'Más o menos', emoji: '😐', value: 1 },
  { label: 'Nah', emoji: '🙅', value: 0 },
]

export type Profile = {
  riasec: Record<RiasecType, number>
  top: RiasecType[]
  area: AreaKey
  areaScores: Record<AreaKey, number>
}

const AREA_ORDER: AreaKey[] = ['tecnologia', 'negocios', 'comunicacion', 'salud']

// Convierte los puntajes por ítem (0-2) en un perfil RIASEC + área sugerida.
export function computeProfile(scores: number[]): Profile {
  const riasec: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  TEST.forEach((item, i) => {
    riasec[item.type] += scores[i] ?? 0
  })

  const areaScores: Record<AreaKey, number> = {
    tecnologia: riasec.I + 0.5 * riasec.R,
    negocios: riasec.E + 0.8 * riasec.C,
    comunicacion: riasec.A + 0.4 * riasec.E,
    salud: riasec.S + 0.5 * riasec.I,
  }

  let area: AreaKey = 'negocios'
  let max = -1
  for (const a of AREA_ORDER) {
    if (areaScores[a] > max) {
      max = areaScores[a]
      area = a
    }
  }

  const top = [...RIASEC_TYPES].sort((a, b) => riasec[b] - riasec[a]).slice(0, 2)

  return { riasec, top, area, areaScores }
}
