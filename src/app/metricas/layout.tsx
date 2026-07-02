import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Métricas · Rumbo',
  description: 'Panel del experimento A/B y tiempos por pantalla de Rumbo.',
  robots: { index: false, follow: false },
}

export default function MetricasLayout({ children }: { children: React.ReactNode }) {
  return children
}
