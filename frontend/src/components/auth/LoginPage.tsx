import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clearStorageAndReload = () => {
    // Clear all localStorage
    localStorage.clear()
    // Clear sessionStorage
    sessionStorage.clear()
    // Reload the page
    window.location.reload()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('Starting login process...')
      
      // Use the signIn function from AuthContext
      await signIn(email, password)
      
      console.log('Login completed successfully')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            Sistema de Patrulha Rural
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Senha
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Sua senha"
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearStorageAndReload}
            >
              Limpar Cache e Recarregar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage