import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAnalyticsSummary } from '../lib/api'
import { useAuth } from '../store/auth'
import StorytellingScroll from '../components/StorytellingScroll'

export default function Home() {
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  // Fetch platform stats for homepage
  const { data: stats } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: getAnalyticsSummary,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-blue-600 to-primary-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0">
          <svg className="absolute bottom-0 w-full h-20 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" fill="currentColor" opacity="0.3"></path>
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-3 mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
              <svg className="w-5 h-5 text-green-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <span className="text-sm font-medium">Smart Food Redistribution</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Bridge the Gap Between 
              <span className="block text-green-300">Surplus and Need</span>
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Connect with your community to share excess food, reduce waste, and fight hunger through intelligent matching and real-time coordination
            </p>
            
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/auth?mode=register')}
                  className="group relative bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                  <span className="relative">Get Started Today</span>
                </button>
                <button
                  onClick={() => navigate('/auth?mode=login')}
                  className="group border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-all duration-200 backdrop-blur-sm"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/browse')}
                  className="group relative bg-white text-primary-600 px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <span className="relative">Browse Food</span>
                </button>
                <button
                  onClick={() => navigate('/donor')}
                  className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-primary-600 transition-all duration-200 backdrop-blur-sm"
                >
                  Donate Food
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Stats Section */}
      <div className="relative bg-white py-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-3xl font-bold text-green-600 mb-2 group-hover:scale-110 transition-transform">40%</div>
              <div className="text-gray-700 font-medium mb-2">of food is wasted globally</div>
              <div className="text-xs text-gray-500">
                Source: <a href="https://www.unep.org/resources/publication/food-waste-index-report-2024" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-medium">UNEP Food Waste Index 2024</a>
              </div>
            </div>
            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-3xl font-bold text-blue-600 mb-2 group-hover:scale-110 transition-transform">828M</div>
              <div className="text-gray-700 font-medium mb-2">people face hunger worldwide</div>
              <div className="text-xs text-gray-500">
                Source: <a href="https://www.fao.org/publications/sofi/2023/en/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">FAO SOFI 2023</a>
              </div>
            </div>
            <div className="group text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className="text-3xl font-bold text-orange-600 mb-2 group-hover:scale-110 transition-transform">100%</div>
              <div className="text-gray-700 font-medium mb-2">impact when we work together</div>
              <div className="text-xs text-gray-500">Community impact metric</div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats & Live Data Section */}
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Live Platform Stats */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Platform Impact</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Real-time data showing our community's impact on reducing food waste
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 7a2 2 0 012-2h10a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total_items}</div>
                  <div className="text-gray-600 font-medium">Total Items Listed</div>
                </div>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.total_claimed}</div>
                  <div className="text-gray-600 font-medium">Items Rescued</div>
                </div>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stats.donors + stats.recipients}</div>
                  <div className="text-gray-600 font-medium">Community Members</div>
                </div>
              </div>
              
              <div className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{Math.round(stats.claim_rate * 100)}%</div>
                  <div className="text-gray-600 font-medium">Success Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Call to Action Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Make a Difference?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Join thousands of community members who are reducing food waste and fighting hunger through smart redistribution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/browse')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Available Food
              </button>
              <button
                onClick={() => navigate('/donor')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Share Your Food
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Storytelling Section */}
      <StorytellingScroll />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #cbd5e1, #94a3b8);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #94a3b8, #64748b);
        }
      `}</style>
    </div>
  )
}


