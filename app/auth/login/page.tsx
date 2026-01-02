'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/app')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-[16px] items-center justify-center text-white font-bold text-2xl shadow-md mb-4">
            T
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-500">
            Sign in to continue to your tasks
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-[20px] shadow-md border border-gray-200/50 p-8">
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-[12px] text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-[12px] text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link 
                href="/auth/reset-password" 
                className="text-sm text-primary hover:text-primary-hover font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white font-semibold rounded-[14px] hover:bg-primary-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link 
            href="/auth/signup" 
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
