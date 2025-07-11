import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import pmprLogo from '../assets/pmpr.png'
import prcLogo from '../assets/prc.png'

interface ContactConfig {
  id: string
  city: string
  batalhao: string
  cia: string
  equipe?: string
  whatsapp_number: string
}

interface FormData {
  nome: string
  bairro: string
  cidade: string
}

const ContactPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [configs, setConfigs] = useState<ContactConfig[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    bairro: '',
    cidade: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [battalionInfo, setBattalionInfo] = useState<{name: string; slug: string} | null>(null)

  useEffect(() => {
    if (slug) {
      fetchConfigs()
    } else {
      setError('Código do batalhão não encontrado na URL')
      setLoading(false)
    }
  }, [slug])

  const fetchConfigs = async () => {
    try {
      // Usar a Edge Function do Supabase com slug
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const url = `${supabaseUrl}/functions/v1/contact-configs?slug=${slug}`
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'apikey': supabaseAnonKey
        }
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Batalhão não encontrado')
        }
        if (response.status === 401) {
          throw new Error('Erro de autenticação na função')
        }
        throw new Error(`Erro ao buscar configurações (${response.status})`)
      }
      
      const data = await response.json()
      setConfigs(data.configs || [])
      setBattalionInfo(data.battalion || null)
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const handleCityChange = (city: string) => {
    setSelectedCity(city)
    setFormData({ ...formData, cidade: city })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const config = configs.find(c => c.city === selectedCity)
    if (!config) return

    const mensagem = `Olá, meu nome é ${formData.nome}, sou da cidade de ${formData.cidade}, bairro ${formData.bairro}, e gostaria de solicitar uma visita da patrulha rural.`
    const url = `https://wa.me/${config.whatsapp_number}?text=${encodeURIComponent(mensagem)}`
    window.open(url, '_blank')
  }

  // Agrupar cidades por Cia
  const groupedConfigs = configs.reduce((acc, config) => {
    const ciaKey = `${config.cia}ª Cia`
    if (!acc[ciaKey]) {
      acc[ciaKey] = []
    }
    acc[ciaKey].push(config)
    return acc
  }, {} as Record<string, ContactConfig[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 md:h-24 md:w-24 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm md:text-base">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-red-100 flex items-center justify-center px-4">
        <div className="max-w-sm md:max-w-md mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center border border-red-100">
          <div className="text-red-500 text-5xl md:text-6xl mb-4 animate-pulse">⚠️</div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">Ops! Algo deu errado</h1>
          <p className="text-gray-600 mb-4 text-sm md:text-base leading-relaxed">{error}</p>
          <div className="bg-gray-50 rounded-lg p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-500 leading-relaxed">
              Verifique se o link está correto ou entre em contato com o batalhão responsável.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 md:py-12 px-4 md:px-6">
      <div className="max-w-lg mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200/50 backdrop-blur-sm">
        {/* Header institucional */}
        <div className="bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 px-6 md:px-8 py-8 md:py-12 text-center relative overflow-hidden">
          {/* Pattern profissional */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.02)_25%,rgba(255,255,255,.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.02)_75%)] bg-[length:20px_20px]"></div>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/3 rounded-full -translate-y-20 translate-x-20"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/3 rounded-full translate-y-16 -translate-x-16"></div>
          
          <div className="relative z-10">
            {/* Brasões oficiais */}
            <div className="flex justify-center items-center space-x-6 md:space-x-8 mb-8 md:mb-10">
              <div className="transform hover:scale-105 transition-all duration-300 hover:brightness-110">
                <img 
                  src={pmprLogo} 
                  alt="Polícia Militar do Paraná" 
                  className="w-24 h-28 md:w-32 md:h-36 object-contain drop-shadow-2xl"
                />
              </div>
              <div className="transform hover:scale-105 transition-all duration-300 hover:brightness-110">
                <img 
                  src={prcLogo} 
                  alt="Patrulha Rural Comunitária" 
                  className="w-44 h-32 md:w-56 md:h-40 object-contain drop-shadow-2xl"
                />
              </div>
            </div>
            
            <div className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <h1 className="text-white text-xl md:text-2xl font-light tracking-wide">
                  Sistema de Contato
                </h1>
                <h2 className="text-amber-300 text-2xl md:text-3xl font-bold tracking-tight">
                  PATRULHA RURAL
                </h2>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 md:px-6 md:py-4 border border-white/20 shadow-lg">
                <p className="text-slate-100 text-sm md:text-base font-medium">
                  {battalionInfo?.name || 'Batalhão de Polícia Militar do Paraná'}
                </p>
              </div>
              
              <p className="text-slate-200 text-sm md:text-base leading-relaxed max-w-sm mx-auto">
                Selecione seu município para estabelecer contato direto com nossa equipe de patrulhamento rural
              </p>
            </div>
          </div>
        </div>

        {/* Área de seleção */}
        <div className="p-6 md:p-8 space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-slate-800 text-lg md:text-xl font-semibold">
              Solicitar Atendimento
            </h3>
            <p className="text-slate-600 text-sm md:text-base">
              Preencha os dados abaixo para estabelecer contato
            </p>
          </div>
          
          {/* Seleção de cidade */}
          <div className="space-y-4">
            <label htmlFor="cidade" className="block text-base md:text-lg font-medium text-slate-700 flex items-center gap-3">
              <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm">📍</span>
              Município de Atendimento
            </label>
            <select
              id="cidade"
              value={selectedCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full px-5 py-4 md:py-5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 transition-all duration-300 text-base md:text-lg bg-slate-50 hover:bg-white font-medium shadow-sm"
              aria-label="Selecione sua cidade"
            >
              <option value="" className="text-slate-500">
                Selecione seu município...
              </option>
              {Object.entries(groupedConfigs).map(([cia, configs]) => (
                <optgroup key={cia} label={cia} className="font-semibold bg-slate-100">
                  {configs.map((config) => (
                    <option key={config.id} value={config.city} className="py-2 font-normal">
                      {config.city}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedCity && (
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg">
              <div className="text-center mb-6 space-y-2">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📝</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-slate-800">
                  Dados para Contato
                </h3>
                <p className="text-slate-600 text-sm md:text-base">
                  Informe seus dados para que possamos atendê-lo adequadamente
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="nome" className="block text-base md:text-lg font-medium text-slate-700 flex items-center gap-3">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">👤</span>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                    placeholder="Digite seu nome completo"
                    className="w-full px-5 py-4 md:py-5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-600 transition-all duration-300 text-base md:text-lg bg-white font-medium shadow-sm"
                  />
                </div>

                <div className="space-y-3">
                  <label htmlFor="bairro" className="block text-base md:text-lg font-medium text-slate-700 flex items-center gap-3">
                    <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-sm">🏘️</span>
                    Bairro ou Localidade
                  </label>
                  <input
                    type="text"
                    id="bairro"
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    required
                    placeholder="Digite seu bairro ou região"
                    className="w-full px-5 py-4 md:py-5 border-2 border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-600 transition-all duration-300 text-base md:text-lg bg-white font-medium shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 via-green-700 to-green-800 hover:from-green-700 hover:via-green-800 hover:to-green-900 text-white py-5 md:py-6 px-8 rounded-2xl font-bold text-base md:text-lg focus:outline-none focus:ring-4 focus:ring-green-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl flex items-center justify-center gap-4"
                >
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">💬</span>
                  </span>
                  Iniciar Conversa no WhatsApp
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-sm">🚁</span>
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-6 md:px-8 py-6 text-center border-t border-slate-200">
          <div className="flex items-center justify-center">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
              <span className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xs">🔒</span>
              </span>
              Conexão Protegida
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage