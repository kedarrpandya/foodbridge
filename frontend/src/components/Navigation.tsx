import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function Navigation() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center space-x-8">
                  <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700 flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="leafGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'#22c55e'}} />
                          <stop offset="100%" style={{stopColor:'#16a34a'}} />
                        </linearGradient>
                        <linearGradient id="heartGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'#f59e0b'}} />
                          <stop offset="100%" style={{stopColor:'#d97706'}} />
                        </linearGradient>
                      </defs>
                      <path d="M12 8c-3 0-5 2-5 5 0 2 1 3.5 2.5 4.5C11 19 13 20 16 20c0-3-1-5-2.5-6.5C12 12 12 10 12 8z" fill="url(#leafGradientNav)"/>
                      <path d="M20.5 10c-1.5-1.5-4-1.5-5.5 0l-1 1-1-1c-1.5-1.5-4-1.5-5.5 0-1.5 1.5-1.5 4 0 5.5l6.5 6.5 6.5-6.5c1.5-1.5 1.5-4 0-5.5z" fill="url(#heartGradientNav)" transform="translate(6,4) scale(0.7)"/>
                      <circle cx="22" cy="12" r="1.5" fill="#22c55e" opacity="0.8"/>
                      <circle cx="24" cy="16" r="1" fill="#f59e0b" opacity="0.8"/>
                      <circle cx="21" cy="20" r="1.2" fill="#ef4444" opacity="0.8"/>
                    </svg>
                    FoodBridge
                  </Link>
            
                   <div className="hidden md:flex space-x-6">
                     <Link 
                       to="/browse" 
                       className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                     >
                       Browse Food
                     </Link>
              <Link 
                to="/donor" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Donate Food
              </Link>
              <Link 
                to="/analytics" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Analytics
              </Link>
              {isAuthenticated && (
                <Link 
                  to="/dashboard" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-green-700">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.name}
                  </span>
                </div>
                
                <div className="relative group">
                  <button className="flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Account
                    </Link>
                    <div className="border-t border-gray-100"></div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth?mode=login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth?mode=register"
                  className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
               <div className="md:hidden border-t border-gray-200 py-2">
                 <div className="flex flex-col space-y-1">
                   <Link 
                     to="/browse" 
                     className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                   >
                     Browse Food
                   </Link>
            <Link 
              to="/donor" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Donate Food
            </Link>
            <Link 
              to="/analytics" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              Analytics
            </Link>
            {isAuthenticated && (
              <Link 
                to="/dashboard" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
