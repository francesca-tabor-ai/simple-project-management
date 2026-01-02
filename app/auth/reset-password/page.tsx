'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
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
            Reset password
          </h2>
          <p className="text-gray-500">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card rounded-[20px] shadow-md border border-gray-200/50 p-8">
          <form className="space-y-5" onSubmit={handleResetPassword}>
            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-[12px] text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3 rounded-[12px] text-sm">
                Password reset link sent! Check your email.
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

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 bg-primary text-white font-semibold rounded-[14px] hover:bg-primary-hover hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        </div>

        {/* Back to sign in */}
        <p className="text-center mt-6 text-gray-600">
          Remember your password?{' '}
          <Link 
            href="/auth/login" 
            className="text-primary hover:text-primary-hover font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
