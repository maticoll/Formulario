// ─────────────────────────────────────────────────────────────────────────────
// Carreras + áreas + normalización.
// Fuente única de verdad para el explorador. Mapea el texto libre de
// `career_raw` (39 variantes distintas) a 7 carreras normalizadas.
// ─────────────────────────────────────────────────────────────────────────────

export type AreaKey = 'tecnologia' | 'negocios' | 'comunicacion' | 'salud'

export type CareerKey =
  | 'admin'
  | 'sistemas'
  | 'negocios-digitales'
  | 'comunicacion'
  | 'finanzas'
  | 'medicina'
  | 'psicomotricidad'

export const AREAS: Record<AreaKey, { name: string; emoji: string; careers: CareerKey[] }> = {
  tecnologia: { name: 'Tecnología', emoji: '💻', careers: ['sistemas'] },
  negocios: { name: 'Negocios y Gestión', emoji: '📈', careers: ['admin', 'negocios-digitales', 'finanzas'] },
  comunicacion: { name: 'Comunicación y Creatividad', emoji: '🎬', careers: ['comunicacion'] },
  salud: { name: 'Salud y Personas', emoji: '🩺', careers: ['medicina', 'psicomotricidad'] },
}

export const CAREERS: Record<CareerKey, { name: string; area: AreaKey; emoji: string }> = {
  admin: { name: 'Administración / Empresas', area: 'negocios', emoji: '📊' },
  sistemas: { name: 'Sistemas / Informática', area: 'tecnologia', emoji: '💻' },
  'negocios-digitales': { name: 'Negocios Digitales', area: 'negocios', emoji: '🚀' },
  comunicacion: { name: 'Comunicación', area: 'comunicacion', emoji: '🎬' },
  finanzas: { name: 'Finanzas', area: 'negocios', emoji: '💸' },
  medicina: { name: 'Medicina', area: 'salud', emoji: '🩺' },
  psicomotricidad: { name: 'Psicomotricidad', area: 'salud', emoji: '🤸' },
}

export const CAREER_KEYS = Object.keys(CAREERS) as CareerKey[]

/**
 * Normaliza el texto libre de una carrera a una de las 7 claves conocidas.
 * Devuelve null si no matchea ninguna de las carreras que tenemos cargadas.
 * El orden importa: "negocios digitales" se chequea antes que "admin".
 */
export function normalizeCareer(raw: string | null | undefined): CareerKey | null {
  if (!raw) return null
  const x = raw
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // saca tildes (combining marks)

  if (/negocios? digital/.test(x)) return 'negocios-digitales'
  if (/sistema|informatic/.test(x)) return 'sistemas'
  if (/admin|gerencia|direccion de empresa/.test(x)) return 'admin'
  if (/finanz/.test(x)) return 'finanzas'
  if (/comunicac/.test(x)) return 'comunicacion'
  if (/psicomotric/.test(x)) return 'psicomotricidad'
  if (/medicin/.test(x)) return 'medicina'
  return null
}
