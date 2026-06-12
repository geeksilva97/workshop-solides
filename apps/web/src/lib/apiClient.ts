import type { z } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Resolve relative paths to absolute so the request works both in the browser
// (Vite proxies /api) and under jsdom/undici in tests (which rejects relative URLs).
function resolveUrl(path: string): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
  return new URL(path, base).toString()
}

async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(resolveUrl(url), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    throw new ApiError(res.status, `Falha na requisição (${res.status})`)
  }

  return schema.parse(await res.json())
}

export const api = {
  get: <T>(url: string, schema: z.ZodType<T>) => request(url, schema),
  post: <T>(url: string, schema: z.ZodType<T>, body?: unknown) =>
    request(url, schema, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
}
