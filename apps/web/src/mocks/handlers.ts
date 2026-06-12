import { http, HttpResponse } from 'msw'
import {
  benchmarkListSchema,
  benchmarkSchema,
  companyOptionSchema,
  cohortSchema,
  diagnosticSchema,
  newBenchmarkSchema,
  pipelineStatusSchema,
  resetPasswordResponseSchema,
  sessionSchema,
  signInSchema,
  signUpSchema,
  trendsSchema,
  type Session,
} from '@workshop/shared'
import { z } from 'zod'
import {
  canonicalDiagnostic,
  canonicalTrends,
  companies,
  summarize,
} from './data'
import {
  advanceStatus,
  createBenchmark,
  getBenchmark,
  listBenchmarks,
} from './store'

function makeSession(name: string, email: string): Session {
  return {
    token: `fake-token-${email}`,
    user: {
      id: `user-${email}`,
      name,
      email,
      company: 'Solípse Tecnologia',
    },
  }
}

const json = <T>(schema: z.ZodType<T>, value: T, init?: ResponseInit) =>
  HttpResponse.json(
    schema.parse(value) as Parameters<typeof HttpResponse.json>[0],
    init,
  )

export const handlers = [
  // --- Auth (stub: accepts any credentials) ---
  http.post('/api/auth/login', async ({ request }) => {
    const body = signInSchema.parse(await request.json())
    const name = body.email.split('@')[0]
    return json(sessionSchema, makeSession(name, body.email))
  }),

  http.post('/api/auth/signup', async ({ request }) => {
    const body = signUpSchema.parse(await request.json())
    return json(sessionSchema, makeSession(body.name, body.email), { status: 201 })
  }),

  http.post('/api/auth/reset', async ({ request }) => {
    const body = await request.json()
    z.object({ email: z.email() }).parse(body)
    return json(resetPasswordResponseSchema, {
      message: 'Se o e-mail existir, enviamos um link de redefinição.',
    })
  }),

  // --- Reference data ---
  http.get('/api/companies', () =>
    json(z.array(companyOptionSchema), companies),
  ),

  // --- Benchmarks ---
  http.get('/api/benchmarks', () =>
    json(benchmarkListSchema, listBenchmarks().map(summarize)),
  ),

  http.post('/api/benchmarks', async ({ request }) => {
    const input = newBenchmarkSchema.parse(await request.json())
    const created = createBenchmark(input)
    return HttpResponse.json({ id: created.id }, { status: 201 })
  }),

  http.get('/api/benchmarks/:id', ({ params }) => {
    const benchmark = getBenchmark(params.id as string)
    if (!benchmark) return new HttpResponse(null, { status: 404 })
    return json(benchmarkSchema, benchmark)
  }),

  http.get('/api/benchmarks/:id/status', ({ params }) => {
    const status = advanceStatus(params.id as string)
    if (!status) return new HttpResponse(null, { status: 404 })
    return json(pipelineStatusSchema, status)
  }),

  http.get('/api/benchmarks/:id/cohort', ({ params }) => {
    const benchmark = getBenchmark(params.id as string)
    if (!benchmark) return new HttpResponse(null, { status: 404 })
    return json(cohortSchema, benchmark.cohort)
  }),

  http.get('/api/benchmarks/:id/diagnostic', ({ params }) => {
    const id = params.id as string
    if (!getBenchmark(id)) return new HttpResponse(null, { status: 404 })
    return json(diagnosticSchema, { ...canonicalDiagnostic, benchmarkId: id })
  }),

  http.get('/api/benchmarks/:id/trends', ({ params }) => {
    const id = params.id as string
    if (!getBenchmark(id)) return new HttpResponse(null, { status: 404 })
    return json(trendsSchema, { ...canonicalTrends, benchmarkId: id })
  }),
]
