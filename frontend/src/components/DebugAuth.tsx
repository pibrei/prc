import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const DebugAuth: React.FC = () => {
  const [status, setStatus] = useState('Testing connection...')
  
  useEffect(() => {
    const checkAuth = async () => {
      console.log('=== DEBUG AUTH ===')
      console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
      console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
      
      try {
        // Test 1: Direct API call
        console.log('Testing direct API call...')
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        })
        console.log('API Response status:', response.status)
        setStatus(`API Status: ${response.status}`)
        
        // Test 2: Supabase client
        console.log('Testing Supabase client...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('Session:', session)
        console.log('Session Error:', error)
        
        if (error) {
          setStatus(`Error: ${error.message}`)
        } else {
          setStatus(session ? 'Logged in' : 'Not logged in')
        }
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          console.log('User Profile:', profile)
          console.log('Profile Error:', profileError)
        }
      } catch (err) {
        console.error('Debug Error:', err)
        setStatus(`Error: ${err.message}`)
      }
    }
    
    checkAuth()
  }, [])
  
  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '10px' }}>
      <h3>Debug Info (check console)</h3>
      <p>Supabase URL: {import.meta.env.VITE_SUPABASE_URL}</p>
      <p>Key exists: {!!import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
      <p>Status: {status}</p>
    </div>
  )
}

export default DebugAuth