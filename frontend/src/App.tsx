import { useState } from 'react'
import { LoginScreen } from '@/components/LoginScreen'
import { ChatWindow } from '@/components/ChatWindow'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  )

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsAuthenticated(false)
  }

  return isAuthenticated
    ? <ChatWindow onLogout={handleLogout} />
    : <LoginScreen onLogin={() => setIsAuthenticated(true)} />
}
