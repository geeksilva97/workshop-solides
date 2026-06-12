import type { z } from 'zod'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// The current session token, kept in sync by the AuthProvider. Sent as a bearer
// token so the backend can validate the session on every protected request.
let authToken: string | null = null
export function setAuthToken(token: string | null): void {
  authToken = token
}

// Invoked when the API rejects a request with 401 — lets the app sign the user
// out and bounce them to /login instead of showing a broken screen.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler
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
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  })

  if (res.status === 401) {
    onUnauthorized?.()
    throw new ApiError(401, 'Sessão expirada')
  }

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
