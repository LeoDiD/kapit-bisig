'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await api.login(email, password)
      
      if (response.success && response.data) {
        const { user, token } = response.data
        
        // Check if user role is allowed for web app (Admin or Staff only)
        if (user.role === 'Volunteer') {
          setError('Volunteer accounts can only access the mobile app. Please use the Kapit-Bisig mobile application.')
          return
        }
        
        // Store token
        localStorage.setItem('authToken', token)
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(user))
        
        // If remember me, store in a more persistent way
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        } else {
          localStorage.removeItem('rememberMe')
        }
        
        // Redirect to dashboard
        router.push('/dashboard')
      } else {
        setError(response.message || 'Login failed. Please check your credentials.')
      }
    } catch (err: unknown) {
      console.error('Login error:', err)
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      
      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else if (error.message) {
        setError(error.message)
      } else {
        setError('An error occurred. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background with gradient overlay */}
        <div className="absolute inset-0">
          {/* Background image */}
          <div className="absolute inset-0 bg-[url('/images/picW.png')] bg-cover bg-center"></div>
          {/* Green overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#226538]/90 via-[#226538]/80 to-[#226538]/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 text-white h-full w-full">
          <h1 className="text-5xl font-extrabold mb-2">
            <span className="text-white">Kapit-</span>
            <span className="text-[#ECC323]">Bisig</span>
          </h1>
          <p className="text-xl font-light mb-12 leading-relaxed max-w-md">
            AI-Powered Household Relief<br />
            Distribution and Tracking Platform<br />
            for Local Government Units
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md w-full">
            <FeatureCard
              title="Precise"
              description="Data Driven aid Delivery"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Equitable"
              description="Fairness Through AI Prioritization"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Transparent"
              description="Blockchain-verified relief Tracking"
              color="bg-[#226538]/90"
            />
            <FeatureCard
              title="Resilient"
              description="Strengthening LGU disaster response"
              color="bg-[#226538]/90"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/logoW.png"
              alt="Kapit-Bisig Logo"
              width={280}
              height={100}
              priority
            />
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back!</h1>
            <p className="text-gray-600 text-sm font-medium">Enter your credentials to access the relief system</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@lgu.gov.ph"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] transition-colors text-gray-900 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#226538] focus:border-[#226538] transition-colors text-gray-900 bg-white disabled:opacity-60 disabled:cursor-not-allowed"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#226538] focus:ring-[#226538] border-gray-300 rounded cursor-pointer accent-[#226538]"
                  disabled={isLoading}
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-[#ECC323] hover:text-yellow-600 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#226538] hover:bg-[#1b502d] text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#226538] focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Feature Card Component
function FeatureCard({ 
  title, 
  description, 
  color 
}: { 
  title: string
  description: string
  color: string 
}) {
  return (
    <div className={`${color} backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform cursor-default shadow-lg`}>
      {/* UPDATED: Title is now Yellow (#ECC323) */}
      <h3 className="text-lg font-bold text-[#ECC323] mb-1">{title}</h3>
      {/* UPDATED: Description reverted to White/90 */}
      <p className="text-xs text-white/90 leading-relaxed">{description}</p>
    </div>
  )
}