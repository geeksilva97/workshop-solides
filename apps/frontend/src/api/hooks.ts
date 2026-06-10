import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client.ts';
import { saveSession } from '../lib/session.ts';

export const queryKeys = {
  benchmarks: ['benchmarks'] as const,
  benchmark: (id: string) => ['benchmark', id] as const,
};

export function useBenchmarks() {
  return useQuery({ queryKey: queryKeys.benchmarks, queryFn: api.listBenchmarks });
}

export function useBenchmark(id: string) {
  return useQuery({
    queryKey: queryKeys.benchmark(id),
    queryFn: () => api.getBenchmark(id),
    enabled: Boolean(id),
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      api.login(email, password),
    onSuccess: (data) => saveSession({ token: data.token, empresa: data.empresa }),
  });
}

export function useCreateBenchmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createBenchmark,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.benchmarks }),
  });
}
