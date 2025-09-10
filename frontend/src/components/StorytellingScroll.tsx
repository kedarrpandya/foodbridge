import React, { useEffect, useState, useRef } from 'react'

export default function StorytellingScroll() {
  const [currentStory, setCurrentStory] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const stories = [
    {
      title: "The Problem",
      content: "Every year, 40% of food is wasted while 828 million people go hungry.",
      visual: "waste",
      color: "from-red-500 to-orange-500"
    },
    {
      title: "The Gap", 
      content: "Surplus food exists everywhere - restaurants, stores, homes - but doesn't reach those who need it.",
      visual: "gap",
      color: "from-yellow-500 to-amber-500"
    },
    {
      title: "Our Solution",
      content: "FoodBridge connects food donors with recipients through smart matching and real-time coordination.",
      visual: "bridge",
      color: "from-blue-500 to-indigo-500"
    },
    {
      title: "The Impact",
      content: "Together, we're building a sustainable food system where nothing goes to waste and everyone is fed.",
      visual: "impact",
      color: "from-green-500 to-emerald-500"
    }
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.3 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isVisible, stories.length])

  const handleStoryClick = (index: number) => {
    setCurrentStory(index)
  }

  return (
    <div ref={containerRef} className="py-16 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Why FoodBridge Exists</h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            The story behind our mission to eliminate food waste and hunger
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Story Content */}
          <div className="order-2 lg:order-1">
            <div className="space-y-6">
              {/* Story Navigation */}
              <div className="flex gap-3 mb-8">
                {stories.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleStoryClick(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      currentStory === index
                        ? 'bg-white scale-125'
                        : 'bg-white/30 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>

              {/* Story Text */}
              <div className="min-h-[200px]">
                <div
                  key={currentStory}
                  className="animate-[fadeIn_0.6s_ease-in-out]"
                >
                  <h3 className={`text-3xl font-bold mb-4 bg-gradient-to-r ${stories[currentStory].color} bg-clip-text text-transparent`}>
                    {stories[currentStory].title}
                  </h3>
                  <p className="text-xl leading-relaxed text-blue-100">
                    {stories[currentStory].content}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className={`h-2 rounded-full bg-gradient-to-r ${stories[currentStory].color} transition-all duration-300`}
                  style={{ width: `${((currentStory + 1) / stories.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Interactive Visual */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative w-80 h-80">
              {/* Background Circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20"></div>
              
              {/* Story Visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                {stories[currentStory].visual === 'waste' && (
                  <div className="animate-[slideIn_0.6s_ease-out] text-center">
                    <svg className="w-24 h-24 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <div className="text-red-300 font-bold text-lg">40% Food Waste</div>
                  </div>
                )}
                
                {stories[currentStory].visual === 'gap' && (
                  <div className="animate-[slideIn_0.6s_ease-out] flex items-center gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="text-yellow-300 text-sm">Surplus</div>
                    </div>
                    <div className="text-white text-2xl animate-pulse">⚡</div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-2">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="text-red-300 text-sm">Need</div>
                    </div>
                  </div>
                )}
                
                {stories[currentStory].visual === 'bridge' && (
                  <div className="animate-[slideIn_0.6s_ease-out] text-center">
                    <div className="relative">
                      <svg className="w-32 h-20 mx-auto text-blue-400" viewBox="0 0 120 60" fill="none">
                        <path d="M10 45 Q30 25 60 35 Q90 25 110 45" stroke="currentColor" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="40" r="3" fill="currentColor" />
                        <circle cx="60" cy="32" r="4" fill="currentColor" />
                        <circle cx="100" cy="40" r="3" fill="currentColor" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                    <div className="text-blue-300 font-bold text-lg mt-2">Smart Matching</div>
                  </div>
                )}
                
                {stories[currentStory].visual === 'impact' && (
                  <div className="animate-[slideIn_0.6s_ease-out] text-center">
                    <div className="relative">
                      <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
                      <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
                    </div>
                    <div className="text-green-300 font-bold text-lg">Community Impact</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <p className="text-blue-200 text-lg mb-6">
            Ready to be part of the solution?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center gap-2 bg-white text-gray-900 px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Food
            </button>
            <button className="inline-flex items-center gap-2 border-2 border-white text-white px-6 py-3 rounded-xl font-semibold hover:bg-white hover:text-gray-900 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Share Food
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.8) rotate(-10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
    </div>
  )
}
