// NextAuth configuration for Google OAuth
import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { env } from '@/lib/env'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // Request offline access to get refresh token
          access_type: 'offline',
          prompt: 'consent',
          scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/calendar.events',
          ].join(' '),
        },
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, account }) {
      // Persist OAuth tokens to JWT
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      return token
    },
    
    async session({ session, token }) {
      // Add tokens to session (server-side only)
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.expiresAt = token.expiresAt as number
      }
      return session
    },
  },
  
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  
  secret: env.NEXTAUTH_SECRET,
}

