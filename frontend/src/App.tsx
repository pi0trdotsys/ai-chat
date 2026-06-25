import { useState } from 'react'
import { LoginScreen } from '@/components/LoginScreen'
import { ChatWindow } from '@/components/ChatWindow'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('token')
  )

  return isAuthenticated
    ? <ChatWindow />
    : <LoginScreen onLogin={() => setIsAuthenticated(true)} />
}
