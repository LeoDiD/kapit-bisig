'use client'

import React, { useState } from 'react'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle login logic here
    console.log({ email, password, rememberMe })
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
          <div className="absolute inset-0 bg-gradient-to-br from-green-800/80 via-green-700/70 to-green-600/60"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <h1 className="text-5xl font-extrabold mb-2">
            <span className="text-white">Kapit-</span>
            <span className="text-yellow-400">Bisig</span>
          </h1>
          <p className="text-xl font-semibold mb-12 leading-relaxed max-w-md">
            AI-Powered Household Relief<br />
            Distribution and Tracking Platform<br />
            for Local Government Units
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <FeatureCard
              title="Precise"
              description="Data Driven aid Delivery"
              color="bg-green-600/80"
            />
            <FeatureCard
              title="Equitable"
              description="Fairness Through AI Prioritization"
              color="bg-green-600/80"
            />
            <FeatureCard
              title="Transparent"
              description="Blockchain-verified relief Tracking"
              color="bg-yellow-500/90"
            />
            <FeatureCard
              title="Resilient"
              description="Strengthening LGU disaster response"
              color="bg-green-600/80"
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 bg-white"
                  required
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
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 bg-white"
                  required
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
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember" className="ml-2 text-sm text-gray-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="/forgot-password" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Sign in
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
    <div className={`${color} backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:scale-105 transition-transform cursor-default`}>
      <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-white/90 leading-relaxed">{description}</p>
    </div>
  )
}
