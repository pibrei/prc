import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<string[]>([])
  
  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }
  
  const testConnection = async () => {
    setStatus([])
    addStatus('Starting connection test...')
    
    try {
      // Test 1: Check if Supabase URL is accessible
      addStatus('Testing Supabase URL...')
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        }
      })
      addStatus(`API Response: ${response.status} ${response.statusText}`)
      
      // Test 2: Test auth endpoint
      addStatus('Testing auth endpoint...')
      const authTest = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/health`, {
        method: 'GET'
      })
      addStatus(`Auth Health: ${authTest.status}`)
      
      // Test 3: Get current session
      addStatus('Getting current session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        addStatus(`Session Error: ${sessionError.message}`)
      } else {
        addStatus(`Session: ${session ? 'Active' : 'None'}`)
      }
      
      // Test 4: Try to query users table
      addStatus('Testing database connection...')
      const { data, error: dbError } = await supabase
        .from('users')
        .select('count')
        .limit(1)
      
      if (dbError) {
        addStatus(`DB Error: ${dbError.message}`)
      } else {
        addStatus('Database connection: OK')
      }
      
    } catch (err: any) {
      addStatus(`Error: ${err.message}`)
    }
  }
  
  const testLogin = async () => {
    addStatus('Testing login with moreira@prc2bpm.live...')
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'moreira@prc2bpm.live',
        password: 'Madeowned1,'
      })
      
      if (error) {
        addStatus(`Login Error: ${error.message}`)
        addStatus(`Error Code: ${error.code}`)
        addStatus(`Error Status: ${error.status}`)
      } else {
        addStatus('Login Success!')
        addStatus(`User ID: ${data.user?.id}`)
      }
    } catch (err: any) {
      addStatus(`Exception: ${err.message}`)
    }
  }
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: 'white', 
      padding: '20px', 
      border: '1px solid #ccc',
      borderRadius: '8px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h3>Connection Test</h3>
      <button onClick={testConnection} style={{ marginRight: '10px' }}>Test Connection</button>
      <button onClick={testLogin}>Test Login</button>
      <div style={{ marginTop: '10px', fontSize: '12px', fontFamily: 'monospace' }}>
        {status.map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </div>
    </div>
  )
}

export default TestConnection