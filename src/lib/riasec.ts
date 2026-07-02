// ─────────────────────────────────────────────────────────────────────────────
// Test vocacional corto basado en el modelo RIASEC de Holland
// (Realista, Investigador, Artístico, Social, Emprendedor, Convencional).
// Es el marco del Test de Holland; los ítems siguen el estilo "¿cuánto te
// gustaría esta actividad?" de los inventarios de Kuder y Belarmino, pero
// elegidos para que sean concretos y "polarizantes" (que gusten mucho a un
// perfil y poco a otros) → discriminan mejor que actividades genéricas.
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

// 12 ítems (2 por tipo), intercalados y bien concretos para que discriminen.
export const TEST: TestItem[] = [
  { activity: 'Quedarte enganchado horas hasta encontrarle la vuelta a un problema difícil.', type: 'I' },
  { activity: 'Convencer a un grupo de sumarse a una idea tuya y ponerte al frente.', type: 'E' },
  { activity: 'Diseñar, editar un video o componer algo con tu propio estilo, sin reglas.', type: 'A' },
  { activity: 'Explicarle un tema a alguien con paciencia hasta que le caiga la ficha.', type: 'S' },
  { activity: 'Ordenar un montón de datos desprolijos en una planilla clara y prolija.', type: 'C' },
  { activity: 'Desarmar un aparato para ver cómo funciona por dentro y volver a armarlo.', type: 'R' },
  { activity: 'Leer sobre cómo funciona el cuerpo humano, el universo o un fenómeno raro.', type: 'I' },
  { activity: 'Armar un pequeño negocio o revender algo para generar tu propia plata.', type: 'E' },
  { activity: 'Escribir una historia, dibujar o sacar fotos para expresar una idea.', type: 'A' },
  { activity: 'Bancar y darle una mano a alguien que la está pasando mal.', type: 'S' },
  { activity: 'Llevar las cuentas de algo y que cada número cierre perfecto.', type: 'C' },
  { activity: 'Pasar la tarde arreglando o construyendo algo con herramientas.', type: 'R' },
]

// Likert forzada de 4 puntos: sin opción neutra, cada respuesta inclina
// hacia un "sí" o un "no".
export const SCALE: { label: string; emoji: string; value: number }[] = [
  { label: '¡Me copa!', emoji: '😍', value: 3 },
  { label: 'Me gusta', emoji: '🙂', value: 2 },
  { label: 'No mucho', emoji: '😕', value: 1 },
  { label: 'Nah', emoji: '🙅', value: 0 },
]

export type Profile = {
  riasec: Record<RiasecType, number>
  top: RiasecType[]
  area: AreaKey
  areaScores: Record<AreaKey, number>
}

const AREA_ORDER: AreaKey[] = ['tecnologia', 'negocios', 'comunicacion', 'salud']

// Convierte los puntajes por ítem (0-3) en un perfil RIASEC + área sugerida.
export function computeProfile(scores: number[]): Profile {
  const riasec: Record<RiasecType, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 }
  TEST.forEach((item, i) => {
    riasec[item.type] += scores[i] ?? 0
  })

  // Scoring IPSATIVO: cada área se mide por cuánto SOBRESALE cada tipo respecto
  // del promedio de la propia persona. Así el resultado depende de tus intereses
  // relativos y no de si respondés todo alto o todo bajo. Además cada área pesa
  // lo mismo (promedio de 2 tipos), para que no haya una que gane "de fábrica".
  const mean = RIASEC_TYPES.reduce((sum, t) => sum + riasec[t], 0) / RIASEC_TYPES.length
  const dev = (t: RiasecType) => riasec[t] - mean

  const areaScores: Record<AreaKey, number> = {
    tecnologia: (dev('I') + dev('R')) / 2,
    negocios: (dev('E') + dev('C')) / 2,
    comunicacion: (dev('A') + dev('E')) / 2,
    salud: (dev('S') + dev('I')) / 2,
  }

  let area: AreaKey = 'tecnologia'
  let max = -Infinity
  for (const a of AREA_ORDER) {
    if (areaScores[a] > max) {
      max = areaScores[a]
      area = a
    }
  }

  const top = [...RIASEC_TYPES].sort((a, b) => riasec[b] - riasec[a]).slice(0, 2)

  return { riasec, top, area, areaScores }
}
