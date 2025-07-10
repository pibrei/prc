import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import prcLogo from '../../assets/prc.png'

const LoginPage: React.FC = () => {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

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
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-950 via-green-900 to-teal-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating particles */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-emerald-400/30 rounded-full animate-pulse"></div>
        <div className="absolute top-32 right-20 w-1 h-1 bg-green-400/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-32 w-3 h-3 bg-teal-400/20 rounded-full animate-bounce"></div>
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-emerald-300/30 rounded-full animate-pulse"></div>
        
        {/* Dynamic gradient overlay following mouse */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-10 transition-all duration-1000 ease-out pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)',
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        />
      </div>

      {/* Geometric patterns */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 min-h-screen">
        <div className="w-full max-w-md">
          {/* Glassmorphism Card */}
          <Card className="relative backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <CardHeader className="text-center pb-8 pt-10">
              {/* Logo with glow effect */}
              <div className="flex justify-center mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full blur-xl opacity-20 scale-110"></div>
                <img 
                  src={prcLogo} 
                  alt="Logo PRC - Patrulha Rural Comunitária" 
                  className="relative h-32 w-auto drop-shadow-2xl filter brightness-110 hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Animated Title */}
              <CardTitle className="text-3xl font-black text-white leading-tight mb-2 tracking-wide">
                <span className="bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                  PATRULHA RURAL COMUNITÁRIA
                </span>
              </CardTitle>
            </CardHeader>
            
            <CardContent className="px-8 pb-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-100/90 mb-2">
                    Email
                  </label>
                  <div className="relative group">
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="seu.email@pm.pr.gov.br"
                      className="h-14 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-emerald-100/90 mb-2">
                    Senha
                  </label>
                  <div className="relative group">
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Digite sua senha"
                      className="h-14 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                {error && (
                  <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm animate-shake">
                    {error}
                  </div>
                )}
                
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-base shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-emerald-500/25 border border-emerald-400/30 backdrop-blur-sm relative overflow-hidden group"
                  disabled={loading}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-white/70 border-t-white rounded-full animate-spin mr-3"></div>
                        Entrando...
                      </div>
                    ) : (
                      'Entrar no Sistema'
                    )}
                  </span>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Modern Footer */}
      <footer className="relative z-10 py-8 px-4 text-center">
        <div className="max-w-md mx-auto backdrop-blur-sm bg-black/20 rounded-2xl px-6 py-4 border border-white/10">
          <p className="text-emerald-100/80 text-xs leading-relaxed font-medium">
            Este não é um sistema oficial da Polícia Militar do Paraná.
            <br />
            <span className="text-emerald-200/90">Sistema desenvolvido por um patrulheiro para facilitar a organização de informações.</span>
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage