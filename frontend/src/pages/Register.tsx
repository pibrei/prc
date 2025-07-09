import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { ShieldCheck, Users, CheckCircle } from 'lucide-react'
import TeamSelector from '../components/ui/team-selector'

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              Cadastro Enviado!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Seu cadastro foi enviado com sucesso e está aguardando aprovação.
            </p>
            <p className="text-sm text-gray-500">
              Você receberá um email com suas credenciais assim que um administrador aprovar seu cadastro.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Sistema de Patrulha Rural
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Cadastro para Policiais Militares
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                  placeholder="seu.email@pm.pr.gov.br"
                />
                <p className="text-xs text-gray-500">Email particular ou institucional</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="full_name" className="text-sm font-medium text-gray-700">Nome Completo *</label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  required
                  placeholder="João Silva"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">Senha *</label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
                <p className="text-xs text-gray-500">Senha para acesso ao sistema (mínimo 6 caracteres)</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="nome_guerra" className="text-sm font-medium text-gray-700">Nome de Guerra</label>
                <Input
                  id="nome_guerra"
                  type="text"
                  value={formData.nome_guerra}
                  onChange={(e) => handleInputChange('nome_guerra', e.target.value)}
                  placeholder="Silva"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="patente" className="text-sm font-medium text-gray-700">Patente *</label>
                <select
                  id="patente"
                  value={formData.patente}
                  onChange={(e) => handleInputChange('patente', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a Patente</option>
                  <option value="Sd.">Sd. (Soldado)</option>
                  <option value="Cb.">Cb. (Cabo)</option>
                  <option value="Sgt.">Sgt. (Sargento)</option>
                  <option value="Asp.">Asp. (Aspirante)</option>
                  <option value="Ten.">Ten. (Tenente)</option>
                  <option value="Maj.">Maj. (Major)</option>
                  <option value="Cap.">Cap. (Capitão)</option>
                  <option value="TC.">TC. (Tenente Coronel)</option>
                  <option value="Cel.">Cel. (Coronel)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-medium text-gray-700">Telefone</label>
                <Input
                  id="telefone"
                  type="tel"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                  placeholder="(41) 99999-9999"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="crpm" className="text-sm font-medium text-gray-700">CRPM *</label>
                <select
                  id="crpm"
                  value={formData.crpm}
                  onChange={(e) => handleInputChange('crpm', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione o CRPM</option>
                  <option value="1º CRPM">1º CRPM - Curitiba</option>
                  <option value="2º CRPM">2º CRPM - Londrina</option>
                  <option value="3º CRPM">3º CRPM - Maringá</option>
                  <option value="4º CRPM">4º CRPM - Ponta Grossa</option>
                  <option value="5º CRPM">5º CRPM - Cascavel</option>
                  <option value="6º CRPM">6º CRPM - São José dos Pinhais</option>
                  <option value="Coordenadoria">Coordenadoria</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="batalhao" className="text-sm font-medium text-gray-700">Batalhão *</label>
                <select
                  id="batalhao"
                  value={formData.batalhao}
                  onChange={(e) => handleInputChange('batalhao', e.target.value)}
                  disabled={!formData.crpm}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Selecione o batalhão</option>
                  {formData.crpm && batalhaoPorCrpm[formData.crpm as keyof typeof batalhaoPorCrpm]?.map(batalhao => (
                    <option key={batalhao} value={batalhao}>{batalhao}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="cia" className="text-sm font-medium text-gray-700">Companhia</label>
                <select
                  id="cia"
                  value={formData.cia}
                  onChange={(e) => handleInputChange('cia', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione a Companhia</option>
                  <option value="1ª CIA">1ª CIA</option>
                  <option value="2ª CIA">2ª CIA</option>
                  <option value="3ª CIA">3ª CIA</option>
                  <option value="4ª CIA">4ª CIA</option>
                  <option value="5ª CIA">5ª CIA</option>
                  <option value="Coordenadoria">Coordenadoria</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <TeamSelector
                  batalhao={formData.batalhao}
                  selectedTeam={formData.equipe}
                  onTeamChange={(team) => handleInputChange('equipe', team)}
                />
              </div>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Enviando...' : 'Solicitar Cadastro'}
            </Button>
            
            <div className="text-center text-sm text-gray-500">
              <p>
                Já tem uma conta? <a href="/" className="text-blue-600 hover:underline">Fazer login</a>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default Register