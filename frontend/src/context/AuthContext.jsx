import { createContext, useContext, useState, useEffect } from 'react'
import { getMe } from '../utils/authApi'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('reco_token')
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((res) => setUser(res.data.user))
      .catch(() => {
        localStorage.removeItem('reco_token')
        localStorage.removeItem('reco_user')
      })
      .finally(() => setLoading(false))
  }, [])

  function login(token, userData) {
    localStorage.setItem('reco_token', token)
    localStorage.setItem('reco_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('reco_token')
    localStorage.removeItem('reco_user')
    setUser(null)
  }

  function updateUser(userData) {
    setUser(userData)
    localStorage.setItem('reco_user', JSON.stringify(userData))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}