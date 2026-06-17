"use client"
import { useState, useEffect, createContext, useContext } from "react"
import { getUser, getMe, login as apiLogin, logout as apiLogout } from "@/lib/auth"

interface AuthUser {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = getUser()
    if (stored) {
      getMe()
        .then((u) => setUser(u))
        .catch(() => {
          localStorage.removeItem("token")
          localStorage.removeItem("user")
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password)
    setUser(data.user)
  }

  const logout = () => {
    setUser(null)
    apiLogout()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
