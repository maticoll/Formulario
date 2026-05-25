import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500'] })

export const metadata: Metadata = {
  title: 'Formulario Vocacional · Uruguay',
  description:
    'Investigación sobre orientación vocacional en Uruguay. Compartí tu experiencia universitaria.',
}

export const viewport: Viewport = {
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} bg-white text-neutral-900 antialiased`}>
        {children}
      </body>
    </html>
  )
}
