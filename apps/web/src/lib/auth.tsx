import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { Session } from '@workshop/shared'
import { AuthContext, type AuthContextValue } from './authContext'
import { setAuthToken, setUnauthorizedHandler } from './apiClient'
import { useAuth } from './useAuth'

const STORAGE_KEY = 'solides-run.session'

// Use window.localStorage explicitly: under Node's experimental global
// localStorage (Node 25+) the bare `localStorage` can shadow jsdom's in tests.
const storage = (): Storage | null =>
  typeof window !== 'undefined' ? window.localStorage : null

function loadSession(): Session | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Prime the api client with the stored token before any child query fires.
  const [session, setSession] = useState<Session | null>(() => {
    const stored = loadSession()
    setAuthToken(stored?.token ?? null)
    return stored
  })

  const signIn = useCallback((next: Session) => {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(next))
    setAuthToken(next.token)
    setSession(next)
  }, [])

  const signOut = useCallback(() => {
    storage()?.removeItem(STORAGE_KEY)
    setAuthToken(null)
    setSession(null)
  }, [])

  // Sign out (and bounce to /login) whenever the API reports an expired session.
  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => setUnauthorizedHandler(null)
  }, [signOut])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      signIn,
      signOut,
    }),
    [session, signIn, signOut],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}

/** Route guard: redirects to /login when there is no session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
