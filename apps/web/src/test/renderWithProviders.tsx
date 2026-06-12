import { type ReactElement, type ReactNode } from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../lib/auth'

interface Options {
  /** Initial history entries for the MemoryRouter. */
  initialEntries?: string[]
  /**
   * Route pattern to mount `ui` under (e.g. "/benchmarks/:id"). When omitted,
   * `ui` is rendered directly. Extra routes can be supplied via `extraRoutes`.
   */
  path?: string
  /** Additional <Route> elements (e.g. navigation targets to assert against). */
  extraRoutes?: ReactNode
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries = ['/'], path, extraRoutes }: Options = {},
) {
  // A fresh client per render keeps tests isolated (no cross-test cache leak).
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={initialEntries}>
          {path ? (
            <Routes>
              <Route path={path} element={ui} />
              {extraRoutes}
            </Routes>
          ) : (
            ui
          )}
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}
