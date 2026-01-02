'use client'

// Client-side session provider wrapper for NextAuth
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'
import { type ReactNode } from 'react'

export default function SessionProvider({ children }: { children: ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}

