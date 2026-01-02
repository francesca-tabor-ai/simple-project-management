'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignOutButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-[12px] hover:bg-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
    >
      {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}
