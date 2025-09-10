import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { authApi } from '../lib/authApi'
import { useNavigate } from 'react-router-dom'
import SmartImage from '../components/SmartImage'

export default function Dashboard() {
  const { user, token, logout } = useAuth()
  const navigate = useNavigate()

  const { data: dashboard, isLoading, error } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => authApi.getDashboard(token!),
    enabled: !!token,
    staleTime: 30_000,
  })

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm">Gathering your latest activity</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Dashboard</h3>
          <p className="text-red-600 mb-6">Failed to load dashboard data</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Page Header - Integrated with main navigation */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage your food sharing activities</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-600">Items Claimed</div>
                <div className="text-3xl font-bold text-gray-900">{dashboard?.user.total_claims || 0}</div>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-600">Items Donated</div>
                <div className="text-3xl font-bold text-gray-900">{dashboard?.user.total_donations || 0}</div>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-sm font-semibold text-gray-600">Impact Score</div>
                <div className="text-3xl font-bold text-gray-900">
                  {(dashboard?.user.total_claims || 0) + (dashboard?.user.total_donations || 0) * 2}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Claimed Items */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your Claims</h3>
              <p className="text-sm text-gray-600">Food items you've claimed</p>
            </div>
            <div className="p-6">
              {dashboard?.claimed_items.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">No claims yet</h4>
                  <p className="text-sm text-gray-500 mb-4">Start claiming food items to help reduce waste!</p>
                  <button
                    onClick={() => navigate('/')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Browse Available Food
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard?.claimed_items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {item.photo_url ? (
                          <SmartImage
                            src={item.photo_url}
                            alt={item.title}
                            containerClassName="w-12 h-12"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                        <p className="text-sm text-gray-500">{item.organization?.name}</p>
                        <p className="text-xs text-gray-400">
                          Claimed {formatDate(item.claimed_at)}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dashboard && dashboard.claimed_items.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {dashboard.claimed_items.length - 3} more...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Donated Items */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Your Donations</h3>
              <p className="text-sm text-gray-600">Food items you've shared</p>
            </div>
            <div className="p-6">
              {dashboard?.donated_items.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">No donations yet</h4>
                  <p className="text-sm text-gray-500 mb-4">Share your extra food to help others and reduce waste!</p>
                  <button
                    onClick={() => navigate('/donor')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
                  >
                    Donate Food
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard?.donated_items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {item.photo_url ? (
                          <SmartImage
                            src={item.photo_url}
                            alt={item.title}
                            containerClassName="w-12 h-12"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{item.title}</h4>
                        <p className="text-sm text-gray-500">
                          {item.claimed_by_name ? `Claimed by ${item.claimed_by_name}` : 'Available'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {item.ready_at ? `Ready ${formatDate(item.ready_at)}` : 'No pickup time set'}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.status === 'listed' ? 'bg-green-100 text-green-800' :
                          item.status === 'claimed' ? 'bg-yellow-100 text-yellow-800' :
                          item.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dashboard && dashboard.donated_items.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">
                      And {dashboard.donated_items.length - 3} more...
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <p className="text-sm text-gray-600">Your latest actions</p>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {dashboard.recent_activity.slice(0, 5).map((activity, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== dashboard.recent_activity.slice(0, 5).length - 1 && (
                          <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.type === 'claim' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                              {activity.type === 'claim' ? (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm text-gray-900">
                                {activity.message}
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {activity.timestamp ? formatDate(activity.timestamp) : 'Recently'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
