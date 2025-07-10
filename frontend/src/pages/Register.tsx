import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ShieldCheck, Users, CheckCircle } from 'lucide-react'
import TeamSelector from '../components/ui/team-selector'
import prcLogo from '../assets/prc.png'

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    nome_guerra: '',
    patente: '',
    telefone: '',
    crpm: '',
    batalhao: '',
    cia: '',
    equipe: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Mapeamento dos batalhões por CRPM
  const batalhaoPorCrpm = {
    '1º CRPM': ['12º BPM', '13º BPM', '20º BPM', '23º BPM'],
    '2º CRPM': ['2º BPM', '5º BPM', '10º BPM', '15º BPM', '18º BPM', '30º BPM', '6ª CIPM', '11ª CIPM'],
    '3º CRPM': ['4º BPM', '7º BPM', '8º BPM', '11º BPM', '25º BPM', '32º BPM', '3ª CIPM', '5ª CIPM', '9ª CIPM'],
    '4º CRPM': ['1º BPM', '16º BPM', '26º BPM', '27º BPM', '8ª CIPM', '10ª CIPM'],
    '5º CRPM': ['3º BPM', '6º BPM', '14º BPM', '19º BPM', '21º BPM', '31º BPM', '12ª CIPM'],
    '6º CRPM': ['9º BPM', '17º BPM', '22º BPM', '28º BPM', '29º BPM'],
    'Coordenadoria': ['Coordenadoria']
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate required fields
    if (!formData.email || !formData.full_name || !formData.patente || !formData.crpm || !formData.batalhao || !formData.password) {
      setError('Email, nome completo, patente, CRPM, batalhão e senha são obrigatórios')
      setLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

      const response = await fetch(`${supabaseUrl}/functions/v1/register-user-public`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok) {
        setSuccess(true)
      } else {
        let errorMessage = result.error || 'Erro desconhecido'
        
        if (errorMessage.includes('already been registered')) {
          errorMessage = 'Este email já está registrado no sistema. Use um email diferente.'
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Email inválido. Verifique o formato do email.'
        }
        
        setError(errorMessage)
      }
    } catch (err) {
      console.error('Erro ao registrar usuário:', err)
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpar batalhão quando CRPM mudar
    if (field === 'crpm') {
      setFormData(prev => ({
        ...prev,
        batalhao: ''
      }))
    }
  }

  if (success) {
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
              <pattern id="grid-success" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid-success)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            <CardHeader className="text-center pt-10 pb-8">
              <div className="mx-auto mb-6 w-20 h-20 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-emerald-400/30">
                <CheckCircle className="w-10 h-10 text-emerald-300" />
              </div>
              <CardTitle className="text-3xl font-black text-white leading-tight">
                <span className="bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                  Cadastro Enviado!
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 px-8 pb-10">
              <p className="text-emerald-100/90 text-base leading-relaxed">
                Seu cadastro foi enviado com sucesso e está aguardando aprovação.
              </p>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-base shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-emerald-500/25 border border-emerald-400/30 backdrop-blur-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">Ir para Login</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}</style>
      </div>
    )
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
        <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-teal-300/40 rounded-full animate-ping"></div>
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-emerald-400/20 rounded-full animate-bounce"></div>
        
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

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 py-8">
        <Card className="w-full max-w-2xl mx-auto backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          
          <CardHeader className="text-center pt-10 pb-8">
            {/* Logo with glow effect */}
            <div className="flex justify-center mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full blur-xl opacity-20 scale-110"></div>
              <img 
                src={prcLogo} 
                alt="Logo PRC - Patrulha Rural Comunitária" 
                className="relative h-24 w-auto drop-shadow-2xl filter brightness-110 hover:scale-105 transition-transform duration-300"
              />
            </div>
            
            <CardTitle className="text-3xl font-black text-white leading-tight mb-2 tracking-wide">
              <span className="bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent">
                PATRULHA RURAL COMUNITÁRIA
              </span>
            </CardTitle>
            <p className="text-emerald-200/90 text-sm font-semibold tracking-wider">
              Cadastro para Policiais Militares
            </p>
          </CardHeader>
          
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-semibold text-emerald-100/90">Email *</label>
                  <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="seu.email@pm.pr.gov.br"
                      className="h-12 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-emerald-200/60">Email particular ou institucional</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-semibold text-emerald-100/90">Nome Completo *</label>
                  <div className="relative group">
                    <Input
                      id="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      required
                      placeholder="João Silva"
                      className="h-12 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-semibold text-emerald-100/90">Senha *</label>
                  <div className="relative group">
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="Mínimo 6 caracteres"
                      className="h-12 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  <p className="text-xs text-emerald-200/60">Senha para acesso ao sistema (mínimo 6 caracteres)</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="nome_guerra" className="text-sm font-semibold text-emerald-100/90">Nome de Guerra</label>
                  <div className="relative group">
                    <Input
                      id="nome_guerra"
                      type="text"
                      value={formData.nome_guerra}
                      onChange={(e) => handleInputChange('nome_guerra', e.target.value)}
                      placeholder="Silva"
                      className="h-12 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="patente" className="text-sm font-semibold text-emerald-100/90">Patente *</label>
                  <select
                    id="patente"
                    value={formData.patente}
                    onChange={(e) => handleInputChange('patente', e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-white/10 border-2 border-emerald-400/30 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <option value="" className="text-gray-900">Selecione a Patente</option>
                    <option value="Sd." className="text-gray-900">Sd. (Soldado)</option>
                    <option value="Cb." className="text-gray-900">Cb. (Cabo)</option>
                    <option value="Sgt." className="text-gray-900">Sgt. (Sargento)</option>
                    <option value="Asp." className="text-gray-900">Asp. (Aspirante)</option>
                    <option value="Ten." className="text-gray-900">Ten. (Tenente)</option>
                    <option value="Maj." className="text-gray-900">Maj. (Major)</option>
                    <option value="Cap." className="text-gray-900">Cap. (Capitão)</option>
                    <option value="TC." className="text-gray-900">TC. (Tenente Coronel)</option>
                    <option value="Cel." className="text-gray-900">Cel. (Coronel)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="telefone" className="text-sm font-semibold text-emerald-100/90">Telefone</label>
                  <div className="relative group">
                    <Input
                      id="telefone"
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange('telefone', e.target.value)}
                      placeholder="(41) 99999-9999"
                      className="h-12 bg-white/10 border-2 border-emerald-400/30 focus:border-emerald-400 focus:ring-emerald-400/50 text-white placeholder:text-emerald-200/50 text-base backdrop-blur-sm transition-all duration-300 group-hover:bg-white/15"
                    />
                    <div className="absolute inset-0 rounded-md bg-gradient-to-r from-emerald-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="crpm" className="text-sm font-semibold text-emerald-100/90">CRPM *</label>
                  <select
                    id="crpm"
                    value={formData.crpm}
                    onChange={(e) => handleInputChange('crpm', e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-white/10 border-2 border-emerald-400/30 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <option value="" className="text-gray-900">Selecione o CRPM</option>
                    <option value="1º CRPM" className="text-gray-900">1º CRPM - Curitiba</option>
                    <option value="2º CRPM" className="text-gray-900">2º CRPM - Londrina</option>
                    <option value="3º CRPM" className="text-gray-900">3º CRPM - Maringá</option>
                    <option value="4º CRPM" className="text-gray-900">4º CRPM - Ponta Grossa</option>
                    <option value="5º CRPM" className="text-gray-900">5º CRPM - Cascavel</option>
                    <option value="6º CRPM" className="text-gray-900">6º CRPM - São José dos Pinhais</option>
                    <option value="Coordenadoria" className="text-gray-900">Coordenadoria</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="batalhao" className="text-sm font-semibold text-emerald-100/90">Batalhão *</label>
                  <select
                    id="batalhao"
                    value={formData.batalhao}
                    onChange={(e) => handleInputChange('batalhao', e.target.value)}
                    disabled={!formData.crpm}
                    required
                    className="w-full h-12 px-4 bg-white/10 border-2 border-emerald-400/30 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15 disabled:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="" className="text-gray-900">Selecione o batalhão</option>
                    {formData.crpm && batalhaoPorCrpm[formData.crpm as keyof typeof batalhaoPorCrpm]?.map(batalhao => (
                      <option key={batalhao} value={batalhao} className="text-gray-900">{batalhao}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="cia" className="text-sm font-semibold text-emerald-100/90">Companhia</label>
                  <select
                    id="cia"
                    value={formData.cia}
                    onChange={(e) => handleInputChange('cia', e.target.value)}
                    className="w-full h-12 px-4 bg-white/10 border-2 border-emerald-400/30 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <option value="" className="text-gray-900">Selecione a Companhia</option>
                    <option value="1ª CIA" className="text-gray-900">1ª CIA</option>
                    <option value="2ª CIA" className="text-gray-900">2ª CIA</option>
                    <option value="3ª CIA" className="text-gray-900">3ª CIA</option>
                    <option value="4ª CIA" className="text-gray-900">4ª CIA</option>
                    <option value="5ª CIA" className="text-gray-900">5ª CIA</option>
                    <option value="Coordenadoria" className="text-gray-900">Coordenadoria</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-emerald-100/90 mb-2">Equipe</div>
                  <div className="bg-white/10 border-2 border-emerald-400/30 rounded-md p-3 backdrop-blur-sm">
                    <TeamSelector
                      batalhao={formData.batalhao}
                      selectedTeam={formData.equipe}
                      onTeamChange={(team) => handleInputChange('equipe', team)}
                    />
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-500/20 border border-red-400/50 text-red-200 px-4 py-3 rounded-lg text-sm backdrop-blur-sm animate-shake">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold text-base shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-emerald-500/25 border border-emerald-400/30 backdrop-blur-sm relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10">
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/70 border-t-white rounded-full animate-spin mr-3"></div>
                      Enviando...
                    </div>
                  ) : (
                    'Solicitar Cadastro'
                  )}
                </span>
              </Button>
              
              <div className="text-center text-sm text-emerald-200/70">
                <p>
                  Já tem uma conta? <a href="/" className="text-emerald-300 hover:text-emerald-200 underline decoration-emerald-400/50 hover:decoration-emerald-300 transition-colors duration-200">Fazer login</a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Modern Footer */}
      <footer className="relative z-10 py-6 px-4 text-center">
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

export default Register