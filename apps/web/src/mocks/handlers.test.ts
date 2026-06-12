import { describe, expect, it } from 'vitest'
import {
  benchmarkListSchema,
  benchmarkSchema,
  cohortSchema,
  diagnosticSchema,
  pipelineStatusSchema,
  sessionSchema,
  trendsSchema,
} from '@workshop/shared'

// Match the origin MSW resolves relative handler paths against (jsdom's location).
const url = (path: string) => `${window.location.origin}${path}`

describe('mock API contracts', () => {
  it('POST /api/auth/login returns a valid session', async () => {
    const res = await fetch(url('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ana@empresa.com', password: 'secret123' }),
    })
    expect(res.status).toBe(200)
    const session = sessionSchema.parse(await res.json())
    expect(session.token).toContain('ana@empresa.com')
  })

  it('GET /api/benchmarks returns valid summaries', async () => {
    const res = await fetch(url('/api/benchmarks'))
    const list = benchmarkListSchema.parse(await res.json())
    expect(list.length).toBeGreaterThan(0)
  })

  it('GET /api/benchmarks/:id returns the four KPIs', async () => {
    const benchmark = benchmarkSchema.parse(
      await (await fetch(url('/api/benchmarks/bm-001'))).json(),
    )
    expect(benchmark.kpis).toHaveLength(4)
  })

  it('cohort, diagnostic and trends payloads validate', async () => {
    cohortSchema.parse(
      await (await fetch(url('/api/benchmarks/bm-001/cohort'))).json(),
    )
    diagnosticSchema.parse(
      await (await fetch(url('/api/benchmarks/bm-001/diagnostic'))).json(),
    )
    trendsSchema.parse(
      await (await fetch(url('/api/benchmarks/bm-001/trends'))).json(),
    )
  })

  it('status pipeline advances to done across polls', async () => {
    const input = {
      companyId: 'solipse',
      filters: { setor: 'Tecnologia', porte: '100–500', regiao: 'Sudeste' },
      indicators: ['turnover_voluntario'],
    }
    const created = await (
      await fetch(url('/api/benchmarks'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
    ).json()

    let done = false
    let guard = 0
    while (!done && guard < 20) {
      const status = pipelineStatusSchema.parse(
        await (await fetch(url(`/api/benchmarks/${created.id}/status`))).json(),
      )
      done = status.done
      guard += 1
    }
    expect(done).toBe(true)
  })
})
