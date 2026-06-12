import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  benchmarkListSchema,
  benchmarkSchema,
  cohortSchema,
  companyOptionSchema,
  diagnosticSchema,
  newBenchmarkSchema,
  pipelineStatusSchema,
  trendsSchema,
  type NewBenchmarkInput,
} from '@workshop/shared'
import { z } from 'zod'
import { api } from '../../lib/apiClient'

export const benchmarkKeys = {
  all: ['benchmarks'] as const,
  detail: (id: string) => ['benchmark', id] as const,
  status: (id: string) => ['benchmark', id, 'status'] as const,
  cohort: (id: string) => ['benchmark', id, 'cohort'] as const,
  diagnostic: (id: string) => ['benchmark', id, 'diagnostic'] as const,
  trends: (id: string) => ['benchmark', id, 'trends'] as const,
}

export function useCompanies() {
  return useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/api/companies', z.array(companyOptionSchema)),
  })
}

export function useBenchmarks() {
  return useQuery({
    queryKey: benchmarkKeys.all,
    queryFn: () => api.get('/api/benchmarks', benchmarkListSchema),
  })
}

export function useBenchmark(id: string) {
  return useQuery({
    queryKey: benchmarkKeys.detail(id),
    queryFn: () => api.get(`/api/benchmarks/${id}`, benchmarkSchema),
  })
}

const createdSchema = z.object({ id: z.string() })

export function useCreateBenchmark() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NewBenchmarkInput) =>
      api.post('/api/benchmarks', createdSchema, newBenchmarkSchema.parse(input)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: benchmarkKeys.all })
    },
  })
}

/** Polls the pipeline status until it reports done. */
export function useBenchmarkStatus(id: string) {
  return useQuery({
    queryKey: benchmarkKeys.status(id),
    queryFn: () => api.get(`/api/benchmarks/${id}/status`, pipelineStatusSchema),
    refetchInterval: (query) => (query.state.data?.done ? false : 700),
  })
}

export function useCohort(id: string) {
  return useQuery({
    queryKey: benchmarkKeys.cohort(id),
    queryFn: () => api.get(`/api/benchmarks/${id}/cohort`, cohortSchema),
  })
}

export function useDiagnostic(id: string) {
  return useQuery({
    queryKey: benchmarkKeys.diagnostic(id),
    queryFn: () => api.get(`/api/benchmarks/${id}/diagnostic`, diagnosticSchema),
  })
}

export function useTrends(id: string) {
  return useQuery({
    queryKey: benchmarkKeys.trends(id),
    queryFn: () => api.get(`/api/benchmarks/${id}/trends`, trendsSchema),
  })
}
