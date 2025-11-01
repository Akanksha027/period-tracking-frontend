import React, { createContext, useState, useEffect, useContext } from 'react'
import { Session, User } from '@supabase/supabase-js'
import * as WebBrowser from 'expo-web-browser'
import * as Linking from 'expo-linking'
import { supabase } from '../lib/supabase'
import { initializeUser } from '../lib/api'

// Complete the web browser session on native
WebBrowser.maybeCompleteAuthSession()

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // Initialize user in database if logged in
      if (session?.user) {
        try {
          console.log('[AuthContext] Initializing user in database...')
          await initializeUser()
          console.log('[AuthContext] User initialized successfully')
        } catch (error) {
          console.error('[AuthContext] Failed to initialize user:', error)
        }
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('[AuthContext] Auth state changed:', _event)
      setSession(session)
      setUser(session?.user ?? null)
      
      // Initialize user in database when signing in
      if (session?.user && (_event === 'SIGNED_IN' || _event === 'USER_UPDATED')) {
        try {
          console.log('[AuthContext] Initializing user in database after', _event)
          await initializeUser()
          console.log('[AuthContext] User initialized successfully')
        } catch (error) {
          console.error('[AuthContext] Failed to initialize user:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    try {
      console.log('[AuthContext] Initiating Google OAuth...')
      
      // Create redirect URL - use the full deep link
      const redirectUrl = Linking.createURL('auth/callback')
      console.log('[AuthContext] Redirect URL:', redirectUrl)
      
      // Get OAuth URL from Supabase
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      })

      if (error) {
        console.error('[AuthContext] OAuth error:', error)
        throw error
      }

      if (!data?.url) {
        throw new Error('No OAuth URL returned. Make sure Google OAuth is configured in Supabase.')
      }

      console.log('[AuthContext] OAuth URL:', data.url)
      console.log('[AuthContext] Opening OAuth URL in browser...')
      
      // Open the OAuth URL in browser - it will redirect back to our app
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: true,
        }
      )
      
      console.log('[AuthContext] Browser result type:', result.type)
      console.log('[AuthContext] Browser result:', result)
      
      // The callback route will handle the session exchange
      // We just need to wait for the auth state change
      if (result.type === 'cancel') {
        console.log('[AuthContext] User cancelled Google sign-in')
        throw new Error('Sign in cancelled')
      }
      
      // If success, the callback route will handle it
      // If dismissed, check if we have a session
      if (result.type === 'dismiss') {
        // Wait a bit for potential redirect
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Check if session was created
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('[AuthContext] Session created via callback')
        } else {
          throw new Error('Sign in was cancelled or failed')
        }
      }
    } catch (error: any) {
      console.error('[AuthContext] Google sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

