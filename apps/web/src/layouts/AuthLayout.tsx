import { Outlet } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'

export function AuthLayout() {
  return (
    <div className="grid min-h-full lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-primary p-12 text-on-primary lg:flex">
        <Logo withWordmark={false} />
        <div className="max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight">
            Benchmarking de RH com inteligência de dados.
          </h2>
          <p className="mt-4 text-on-primary/80">
            Compare seus indicadores com um cohort de empresas pares,
            anonimizado e com k-anonimato garantido.
          </p>
        </div>
        <p className="text-sm text-on-primary/70">
          © 2026 Solides Run · Benchmark de RH
        </p>
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-on-primary/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-on-primary/10" />
      </aside>

      {/* Form column */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
