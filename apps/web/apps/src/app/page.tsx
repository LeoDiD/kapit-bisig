import React from 'react'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-4">
          Kapit-Bisig
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to Kapit-Bisig Web Application
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Login
          </a>
          <a
            href="/register"
            className="px-6 py-3 border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
          >
            Register
          </a>
        </div>
      </div>
    </main>
  )
}
