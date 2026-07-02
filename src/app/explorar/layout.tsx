import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rumbo · Elegí qué estudiar, sin humo',
  description:
    'La verdad de cada carrera, contada por quienes ya la viven. Testimonios reales de estudiantes y egresados: lo bueno, lo difícil y lo que nadie te avisa.',
}

export default function ExplorarLayout({ children }: { children: React.ReactNode }) {
  return children
}
