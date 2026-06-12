import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './app/router'
import { AuthProvider } from './lib/auth'
import { queryClient } from './lib/queryClient'

// MSW is opt-in: by default the app talks to the real API (Vite proxies /api
// to the Fastify backend on :3000). Set VITE_ENABLE_MSW=true to run the UI
// against in-browser mocks instead (e.g. for design work without a backend).
async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MSW !== 'true') return
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
})
