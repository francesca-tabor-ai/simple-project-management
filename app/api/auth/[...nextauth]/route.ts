import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/nextauth'

// Force Node.js runtime (required for NextAuth)
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

