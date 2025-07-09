import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  session: Session | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
  initializing: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Check for stored session synchronously on component mount
  const getInitialSession = () => {
    try {
      const storedSession = localStorage.getItem('supabase.auth.token')
      if (storedSession) {
        const sessionData = JSON.parse(storedSession)
        const expiresAt = sessionData.expires_at
        const now = Math.floor(Date.now() / 1000)
        
        if (expiresAt && now < expiresAt) {
          return sessionData
        }
      }
    } catch (error) {
      console.log('Error reading initial session:', error)
    }
    return null
  }

  const initialSession = getInitialSession()
  
  const [user, setUser] = useState<User | null>(initialSession?.user || null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(initialSession)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      console.log('Initializing authentication...')
      
      // If we already have a session from initial load, just fetch profile
      if (initialSession) {
        console.log('Using initial session, fetching profile...')
        if (initialSession.user) {
          fetchUserProfile(initialSession.user.id).catch(err => {
            console.error('Background profile fetch failed:', err)
          })
        }
      } else {
        // No initial session, clear everything
        console.log('No initial session, clearing states')
        setSession(null)
        setUser(null)
        setUserProfile(null)
      }
      
      // Clear loading states quickly
      if (isMounted) {
        console.log('Clearing loading states')
        setLoading(false)
        setInitializing(false)
      }
    }

    initializeAuth()

    // Set up auth state listener - only handle actual auth events, not page loads
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'has session' : 'no session')
        
        if (!isMounted) return
        
        // Skip initial session - we handle this manually in initializeAuth
        if (event === 'INITIAL_SESSION') {
          console.log('Skipping INITIAL_SESSION event')
          return
        }
        
        // Only handle real auth events like SIGNED_IN, SIGNED_OUT, etc.
        if (event === 'SIGNED_IN' && session) {
          console.log('User signed in, storing session')
          localStorage.setItem('supabase.auth.token', JSON.stringify(session))
          
          setSession(session)
          setUser(session.user)
          
          // Fetch profile in background
          if (session.user) {
            fetchUserProfile(session.user.id).catch(err => {
              console.error('Profile fetch failed during sign in:', err)
            })
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing session')
          localStorage.removeItem('supabase.auth.token')
          setSession(null)
          setUser(null)
          setUserProfile(null)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (userId: string) => {
    console.log('Fetching user profile for userId:', userId)
    try {
      // Add timeout to prevent hanging
      const profilePromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      )

      const result = await Promise.race([profilePromise, timeoutPromise])
      const { data, error } = result as any

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      console.log('User profile fetched successfully:', data)
      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('Attempting to sign in with email:', email)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign in response received:', { data, error })
      
      if (error) {
        console.error('Sign in error details:', error)
        throw error
      }
      
      // The onAuthStateChange listener will handle setting the session
      console.log('Sign in successful')
      return data
    } catch (err) {
      console.error('Sign in exception:', err)
      throw err
    }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    
    // Clear localStorage regardless of error
    localStorage.removeItem('supabase.auth.token')
    
    if (error) {
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    session,
    signIn,
    signOut,
    loading,
    initializing,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}