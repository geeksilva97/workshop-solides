import { createContext } from 'react'
import type { Session } from '@workshop/shared'

export interface AuthContextValue {
  session: Session | null
  isAuthenticated: boolean
  signIn: (session: Session) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
