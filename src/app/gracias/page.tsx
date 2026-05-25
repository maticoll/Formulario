import Link from 'next/link'

export default function Gracias() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <p className="text-xs uppercase tracking-widest text-neutral-400 mb-6">
          Investigación vocacional · Uruguay
        </p>

        <h1 className="text-3xl font-light text-neutral-900 mb-5 leading-snug">
          Gracias por compartir tu experiencia.
        </h1>

        <p className="text-neutral-500 text-sm leading-loose mb-10">
          Tu respuesta va a ayudar a que chicos de todo el país puedan elegir su carrera
          con más información real. Eso vale mucho.
        </p>

        <div className="h-px bg-neutral-100 mb-10" />

        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          ← Volver al inicio
        </Link>
      </div>
    </main>
  )
}
