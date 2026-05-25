import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

export function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL no está configurada. Conectá Neon en el dashboard de Vercel.')
  }
  return drizzle(neon(url), { schema })
}
