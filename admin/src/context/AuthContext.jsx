import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, onUnauthorized, tokenStore } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const signOut = useCallback(() => {
    tokenStore.clear()
    setUser(null)
  }, [])

  // Restore the session from a stored token on first paint.
  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }

    api
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false))
  }, [])

  // A 401 from any request drops the session immediately rather than leaving a dead UI.
  useEffect(() => onUnauthorized(() => setUser(null)), [])

  const signIn = useCallback(async (email, password) => {
    const response = await api.login(email, password)
    tokenStore.set(response.token)
    setUser(response.user)
    return response.user
  }, [])

  const value = useMemo(() => {
    const permissions = user?.permissions ?? []
    const can = (permission) => permissions.includes('*') || permissions.includes(permission)

    return { user, loading, signIn, signOut, can }
  }, [user, loading, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}
