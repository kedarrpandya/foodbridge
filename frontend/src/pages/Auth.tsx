import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import { useAuth } from '../store/auth'

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login'
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode)
    setSearchParams({ mode: newMode })
  }

  const handleLoginSuccess = () => {
    navigate('/dashboard')
  }

  const handleRegisterSuccess = () => {
    setMode('login')
    setSearchParams({ mode: 'login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 8c-3 0-5 2-5 5 0 2 1 3.5 2.5 4.5C11 19 13 20 16 20c0-3-1-5-2.5-6.5C12 12 12 10 12 8z" fill="currentColor"/>
                <path d="M20.5 10c-1.5-1.5-4-1.5-5.5 0l-1 1-1-1c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l6.5 6.5 6.5-6.5c1.5-1.5 1.5-4 0-5.5z" fill="white" transform="translate(6,4) scale(0.7)"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">FoodBridge</h1>
          </div>
          <p className="text-lg text-gray-600">Connecting surplus to need, one meal at a time</p>
        </div>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToRegister={() => handleSwitchMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleRegisterSuccess}
            onSwitchToLogin={() => handleSwitchMode('login')}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Reduce Waste</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span>Help Community</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <span>Save Environment</span>
          </div>
        </div>
      </div>
    </div>
  )
}
