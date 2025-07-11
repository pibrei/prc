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
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const initializeAuth = async () => {
      console.log('Initializing authentication...')
      
      try {
        // Get current session from Supabase (handles persistence automatically)
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
        }
        
        if (isMounted && session) {
          console.log('Found existing session')
          setSession(session)
          setUser(session.user)
          
          // Fetch user profile
          if (session.user) {
            fetchUserProfile(session.user.id).catch(err => {
              console.error('Profile fetch failed:', err)
            })
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
          setInitializing(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state listener for all auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'has session' : 'no session')
        
        if (!isMounted) return
        
        if (session) {
          setSession(session)
          setUser(session.user)
          
          // Fetch profile for new sessions
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            fetchUserProfile(session.user.id).catch(err => {
              console.error('Profile fetch failed during auth change:', err)
            })
          }
        } else {
          // No session - user is signed out
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
    
    if (error) {
      throw error
    }
    
    // Clear states immediately (onAuthStateChange will also handle this)
    setSession(null)
    setUser(null)
    setUserProfile(null)
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