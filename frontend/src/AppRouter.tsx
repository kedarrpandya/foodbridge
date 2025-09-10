import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Browse from './pages/Browse'
import Donor from './pages/Donor'
import Recipient from './pages/Recipient'
import Volunteer from './pages/Volunteer'
import Admin from './pages/Admin'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Account from './pages/Account'
import Navigation from './components/Navigation'
import ToastHost from './components/ToastHost'
import { useAuth } from './store/auth'
import Analytics from './pages/Analytics'

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/auth?mode=login" replace />
  }
  
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/donor" element={<Donor />} />
            <Route path="/recipient" element={<Recipient />} />
            <Route path="/volunteer" element={<Volunteer />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } 
            />
            {/* Redirect old routes */}
            <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
            <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
          </Routes>
        </main>
        <ToastHost />
      </div>
    </BrowserRouter>
  )
}


