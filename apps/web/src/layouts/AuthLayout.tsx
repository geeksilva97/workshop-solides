import { Outlet } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Logo } from '../components/ui/Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="w-full max-w-md">
        <Card className="px-8 py-10">
          <div className="mb-8 flex justify-center">
            <Logo stacked />
          </div>
          <Outlet />
        </Card>
      </div>
      <p className="text-center text-xs text-body">
        © 2026 Solides Run. Benchmarking de RH com inteligência de dados.
      </p>
    </div>
  )
}
