import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import * as cognitoService from '@/services/cognitoService'
import { decodeJwt } from '@/utils/jwt'
import { STORAGE_KEYS } from '@/utils/constants'
import { setUnauthorizedListener } from '@/api/client'
import type { Role } from '@/constants/roles'
import type { User } from '@/types'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (
    email: string,
    password: string,
    attributes: { name: string; role: Role },
  ) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function persistTokens(tokens: cognitoService.CognitoAuthResult): void {
  localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken)
  localStorage.setItem(STORAGE_KEYS.ID_TOKEN, tokens.idToken)
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken)
}

function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.ID_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
}

function userFromIdToken(idToken: string): User | null {
  const claims = decodeJwt(idToken)
  if (!claims) return null

  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name ?? claims.email,
    role: (claims['custom:role'] as Role) ?? 'CUSTOMER',
    createdAt: new Date().toISOString(),
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const logout = useCallback(() => {
    cognitoService.signOut()
    clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    setUnauthorizedListener(logout)
    return () => setUnauthorizedListener(null)
  }, [logout])

  useEffect(() => {
    let isMounted = true

    cognitoService
      .getCurrentSession()
      .then((tokens) => {
        if (!isMounted) return
        if (tokens) {
          persistTokens(tokens)
          setUser(userFromIdToken(tokens.idToken))
        }
      })
      .catch(() => {
        clearTokens()
      })
      .finally(() => {
        if (isMounted) setIsInitializing(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await cognitoService.signIn(email, password)
    persistTokens(tokens)
    const nextUser = userFromIdToken(tokens.idToken)
    setUser(nextUser)
    if (!nextUser) throw new Error('Unable to parse user from session')
    return nextUser
  }, [])

  const signup = useCallback(
    async (email: string, password: string, attributes: { name: string; role: Role }) => {
      await cognitoService.signUp(email, password, {
        email,
        name: attributes.name,
        'custom:role': attributes.role,
      })
    },
    [],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isInitializing,
      login,
      signup,
      logout,
    }),
    [user, isInitializing, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
