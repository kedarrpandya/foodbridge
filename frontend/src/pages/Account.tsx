import React, { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../store/auth'
import { authApi, type UserProfile } from '../lib/authApi'
import { useToast } from '../store/toast'
import { getAnalyticsSummary } from '../lib/api'

export default function Account() {
  const { token, user, updateUser } = useAuth()
  const toast = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'impact' | 'settings'>('profile')

  // Fetch dashboard data for user stats
  const { data: dashboard } = useQuery({
    queryKey: ['dashboard', user?.id],
    queryFn: () => authApi.getDashboard(token!),
    enabled: !!token,
  })

  // Fetch platform stats for impact calculation
  const { data: platformStats } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
  })

  useEffect(() => {
    const load = async () => {
      if (!token) return
      try {
        const prof = await authApi.getProfile(token)
        setProfile(prof)
        setName(prof.name)
        setPhone(prof.phone ?? '')
      } catch (e) {
        toast.add('Failed to load profile', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    try {
      const updated = await authApi.updateProfile(token, {
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
      })
      setProfile(updated)
      setPassword('')
      if (user) {
        updateUser({ ...user, name: updated.name })
      }
      toast.add('Profile updated', 'success')
    } catch (e: any) {
      toast.add(e?.response?.data?.detail || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
          <p className="mt-6 text-gray-700 font-medium text-lg">Loading your account...</p>
        </div>
      </div>
    )
  }

  const userImpactScore = dashboard ? (dashboard.user.total_claims + dashboard.user.total_donations * 2) : 0
  const memberSince = new Date(profile!.created_at)
  const daysSinceMember = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {profile?.name}'s Account
            </h1>
            <p className="text-gray-600 mt-2 text-lg">Manage your profile and view your impact</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/70 backdrop-blur-sm rounded-2xl p-1 shadow-lg border border-white/50">
            {[
              { id: 'profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { id: 'activity', label: 'Activity', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'impact', label: 'Impact', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
              { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
                <form onSubmit={onSave} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    <input
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/50"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/50"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 bg-white/50"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:transform-none"
                    disabled={saving}
                  >
                    {saving ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8.485-8.485l-2.829 2.829M5.344 5.344l2.829 2.829m8.485 8.485l-2.829-2.829M5.344 18.656l2.829-2.829" />
                        </svg>
                        Saving Changes...
                      </span>
                    ) : 'Save Changes'}
                  </button>
                </form>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Account Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Email</span>
                    <span className="font-medium text-gray-900 text-sm">{profile?.email}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Role</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">{profile?.role}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Member Since</span>
                    <span className="font-medium text-gray-900 text-sm">{memberSince.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600">Days Active</span>
                    <span className="font-bold text-blue-600">{daysSinceMember}</span>
                  </div>
                </div>
              </div>

              {dashboard && (
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Your Stats</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                      <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{dashboard.user.total_claims}</div>
                        <div className="text-sm text-gray-600">Items Claimed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{dashboard.user.total_donations}</div>
                        <div className="text-sm text-gray-600">Items Donated</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                      <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{userImpactScore}</div>
                        <div className="text-sm text-gray-600">Impact Score</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && dashboard && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Claims */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Claims</h2>
              {dashboard.claimed_items.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-500 mb-4">No items claimed yet</p>
                  <p className="text-sm text-gray-400">Start claiming food items to help reduce waste!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.claimed_items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.category} • Claimed {new Date(item.claimed_at!).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {dashboard.claimed_items.length > 5 && (
                    <div className="text-center pt-4">
                      <span className="text-sm text-gray-500">And {dashboard.claimed_items.length - 5} more items</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recent Donations */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Donations</h2>
              {dashboard.donated_items.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <p className="text-gray-500 mb-4">No items donated yet</p>
                  <p className="text-sm text-gray-400">Share your extra food to start making an impact!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboard.donated_items.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">
                          {item.category} • {item.status === 'claimed' ? 'Claimed' : 'Available'} • 
                          {new Date(item.ready_at!).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status === 'claimed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {item.status === 'claimed' ? 'Rescued' : 'Available'}
                      </div>
                    </div>
                  ))}
                  {dashboard.donated_items.length > 5 && (
                    <div className="text-center pt-4">
                      <span className="text-sm text-gray-500">And {dashboard.donated_items.length - 5} more items</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Your Community Impact</h2>
              
              {/* Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100">
                  <div className="text-4xl font-bold text-green-600 mb-2">{dashboard?.user.total_claims || 0}</div>
                  <div className="text-gray-700 font-medium">Meals Rescued</div>
                  <div className="text-xs text-gray-500 mt-1">Items you've claimed</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{dashboard?.user.total_donations || 0}</div>
                  <div className="text-gray-700 font-medium">Meals Shared</div>
                  <div className="text-xs text-gray-500 mt-1">Items you've donated</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100">
                  <div className="text-4xl font-bold text-purple-600 mb-2">{userImpactScore}</div>
                  <div className="text-gray-700 font-medium">Impact Score</div>
                  <div className="text-xs text-gray-500 mt-1">Claims + Donations × 2</div>
                </div>
              </div>

              {/* Impact Comparison */}
              {platformStats && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Community Contribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Your Claim Share</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ((dashboard?.user.total_claims || 0) / Math.max(platformStats.total_claimed, 1)) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(((dashboard?.user.total_claims || 0) / Math.max(platformStats.total_claimed, 1)) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Of all platform claims</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Your Donation Share</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, ((dashboard?.user.total_donations || 0) / Math.max(platformStats.total_items, 1)) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(((dashboard?.user.total_donations || 0) / Math.max(platformStats.total_items, 1)) * 100)}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Of all platform donations</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
              
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <h3 className="font-semibold text-yellow-800 mb-2">Notification Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-gray-700">Email notifications for new food items</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-gray-700">SMS alerts for urgent pickups</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-gray-700">Weekly impact summary</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h3 className="font-semibold text-blue-800 mb-2">Privacy Settings</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-gray-700">Show my name to other users</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-gray-700">Include me in leaderboards</span>
                    </label>
                  </div>
                </div>

                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <h3 className="font-semibold text-red-800 mb-2">Danger Zone</h3>
                  <p className="text-sm text-gray-600 mb-3">These actions cannot be undone</p>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
