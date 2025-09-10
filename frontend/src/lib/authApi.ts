import { api } from './api'
import type { User } from '../store/auth'

export interface RegisterData {
  name: string
  email: string
  password: string
  role: string
  phone?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserProfile {
  id: number
  name: string
  email: string
  phone: string | null
  role: string
  verified: boolean
  created_at: string
  total_claims: number
  total_donations: number
}

export interface UserDashboard {
  user: UserProfile
  claimed_items: any[]
  donated_items: any[]
  recent_activity: any[]
}

export const authApi = {
  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  getProfile: async (token: string): Promise<UserProfile> => {
    const response = await api.get('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },

  getDashboard: async (token: string): Promise<UserDashboard> => {
    const response = await api.get('/auth/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },

  updateProfile: async (
    token: string,
    data: { name?: string; phone?: string; password?: string }
  ): Promise<UserProfile> => {
    const response = await api.put('/auth/me', data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  },
}

// Add token to all requests if available
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('auth-storage')
  if (authData) {
    try {
      const parsed = JSON.parse(authData)
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
      }
    } catch (e) {
      console.error('Error parsing auth data:', e)
    }
  }
  return config
})
