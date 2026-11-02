import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api, getApiErrorMessage } from '../../lib/api'
import type { CurrentUser } from '../../lib/types'

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await api.get<CurrentUser>('/auth/me')
      setUser(response.data)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCurrentUser()
    const onExpired = () => {
      queryClient.clear()
      setUser(null)
      setIsLoading(false)
    }
    window.addEventListener('backup-manager:session-expired', onExpired)
    return () => window.removeEventListener('backup-manager:session-expired', onExpired)
  }, [loadCurrentUser, queryClient])

  const login = useCallback(async (username: string, password: string) => {
    await api.post('/auth/login', { username, password })
    try {
      const response = await api.get<CurrentUser>('/auth/me')
      setUser(response.data)
    } catch (error) {
      setUser(null)
      throw new Error(getApiErrorMessage(error, 'Não foi possível carregar seu usuário.'))
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      queryClient.clear()
      setUser(null)
    }
  }, [queryClient])

  const value = useMemo(() => ({ user, isLoading, login, logout }), [user, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa ser utilizado dentro de AuthProvider.')
  return context
}
