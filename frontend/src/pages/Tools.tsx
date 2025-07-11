import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Link, Settings, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface ContactConfig {
  id: string
  city: string
  batalhao: string
  cia: string
  equipe?: string
  whatsapp_number: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface FormData {
  city: string
  batalhao: string
  cia: string
  equipe: string
  whatsapp_number: string
  is_active: boolean
}

const Tools: React.FC = () => {
  const { userProfile } = useAuth()
  const [configs, setConfigs] = useState<ContactConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState<ContactConfig | null>(null)
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  const [editingCia, setEditingCia] = useState<string | null>(null)
  const [batchWhatsapp, setBatchWhatsapp] = useState('')
  const [formData, setFormData] = useState<FormData>({
    city: '',
    batalhao: '1',
    cia: '1',
    equipe: '',
    whatsapp_number: '',
    is_active: true
  })

  const isAdmin = userProfile?.role === 'admin'

  useEffect(() => {
    if (userProfile?.batalhao) {
      if (isAdmin) {
        // Admin: configurar batalhão e buscar configs
        ensureBattalionConfig().then(() => {
          fetchConfigs()
        })
      } else {
        // Outros usuários: apenas parar loading (sem dados de config)
        setLoading(false)
      }
    }
  }, [userProfile, isAdmin])

  const ensureBattalionConfig = async () => {
    try {
      const battalionSlug = getBattalionSlug()
      
      // Verificar se já existe configuração para este batalhão
      const { data: existingBattalion } = await supabase
        .from('battalion_configs')
        .select('id')
        .eq('battalion_slug', battalionSlug)
        .single()

      if (!existingBattalion) {
        // Criar configuração do batalhão se não existir
        const { error } = await supabase
          .from('battalion_configs')
          .insert([{
            battalion_number: userProfile?.batalhao || '1',
            battalion_slug: battalionSlug,
            battalion_name: `${userProfile?.batalhao}º Batalhão de Polícia Militar`,
            is_active: true
          }])

        if (error) {
          console.error('Erro ao criar configuração do batalhão:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar/criar configuração do batalhão:', error)
    }
  }

  const fetchConfigs = async () => {
    try {
      // Filtrar apenas configurações do batalhão do usuário
      const battalionSlug = getBattalionSlug()
      
      const { data, error } = await supabase
        .from('contact_configs')
        .select('*')
        .eq('battalion_slug', battalionSlug)
        .order('cia', { ascending: true })
        .order('city', { ascending: true })

      if (error) throw error
      setConfigs(data || [])
    } catch (error) {
      console.error('Erro ao buscar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const battalionSlug = getBattalionSlug()
      
      if (editingConfig) {
        // Atualizar
        const { error } = await supabase
          .from('contact_configs')
          .update({ ...formData, battalion_slug: battalionSlug })
          .eq('id', editingConfig.id)
        
        if (error) throw error
      } else {
        // Criar novo
        const { error } = await supabase
          .from('contact_configs')
          .insert([{ ...formData, battalion_slug: battalionSlug }])
        
        if (error) throw error
      }

      await fetchConfigs()
      resetForm()
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar configuração')
    }
  }

  const handleEdit = (config: ContactConfig) => {
    setEditingConfig(config)
    setFormData({
      city: config.city,
      batalhao: config.batalhao,
      cia: config.cia,
      equipe: config.equipe || '',
      whatsapp_number: config.whatsapp_number,
      is_active: config.is_active
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta configuração?')) return

    try {
      const { error } = await supabase
        .from('contact_configs')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchConfigs()
    } catch (error) {
      console.error('Erro ao excluir:', error)
      alert('Erro ao excluir configuração')
    }
  }

  const resetForm = () => {
    setFormData({
      city: '',
      batalhao: '1',
      cia: '1',
      equipe: '',
      whatsapp_number: '',
      is_active: true
    })
    setEditingConfig(null)
    setShowForm(false)
  }

  const generatePublicLink = () => {
    const baseUrl = window.location.origin
    const battalionSlug = getBattalionSlug()
    return battalionSlug ? `${baseUrl}/contato/${battalionSlug}` : `${baseUrl}/contato/2bpm`
  }

  const getBattalionSlug = () => {
    // Gerar slug baseado no batalhão do usuário
    if (userProfile?.batalhao) {
      // Extrair apenas o número do batalhão (ex: "2º BPM" → "2")
      const battalionNumber = userProfile.batalhao.match(/(\d+)/)?.[1]
      return battalionNumber ? `${battalionNumber}bpm` : '2bpm'
    }
    return '2bpm' // default para compatibilidade
  }

  const copyLink = () => {
    navigator.clipboard.writeText(generatePublicLink())
    alert('Link copiado para a área de transferência!')
  }

  const handleBatchEdit = (cia: string) => {
    const ciaConfigs = configs.filter(c => c.cia === cia)
    if (ciaConfigs.length > 0) {
      setEditingCia(cia)
      setBatchWhatsapp(ciaConfigs[0].whatsapp_number) // Pegar o número atual da cia
      setShowBatchEdit(true)
    }
  }

  const handleBatchSave = async () => {
    if (!editingCia || !batchWhatsapp.trim()) return

    try {
      const battalionSlug = getBattalionSlug()
      
      // Atualizar todos os contatos da Cia selecionada
      const { error } = await supabase
        .from('contact_configs')
        .update({ whatsapp_number: batchWhatsapp.trim() })
        .eq('battalion_slug', battalionSlug)
        .eq('cia', editingCia)

      if (error) throw error

      await fetchConfigs()
      setShowBatchEdit(false)
      setEditingCia(null)
      setBatchWhatsapp('')
      alert(`Número do WhatsApp atualizado para todas as cidades da ${editingCia}ª Cia`)
    } catch (error) {
      console.error('Erro ao atualizar em lote:', error)
      alert('Erro ao atualizar configurações em lote')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ferramentas</h1>
          <p className="text-gray-600">Gerencie ferramentas e configurações do sistema</p>
        </div>
      </div>

      {/* Gerador de Link de Contato */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Link className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Página de Contato Pública</h2>
              <p className="text-sm text-gray-600">
                Link personalizado do seu batalhão para compartilhar nas redes sociais
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.open(generatePublicLink(), '_blank')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </button>
            <button
              onClick={copyLink}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Link className="h-4 w-4 mr-2" />
              Copiar Link
            </button>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-md p-3">
          <code className="text-sm text-gray-800">{generatePublicLink()}</code>
        </div>
      </div>

      {/* Configurações de Contato - Apenas para Admins */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-gray-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Configurações de Contato</h2>
                  <p className="text-sm text-gray-600">
                    Gerencie cidades e números de WhatsApp do seu batalhão
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Configuração
              </button>
            </div>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da cidade"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Batalhão
                  </label>
                  <input
                    type="text"
                    value={formData.batalhao}
                    onChange={(e) => setFormData({ ...formData, batalhao: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cia
                  </label>
                  <select
                    value={formData.cia}
                    onChange={(e) => setFormData({ ...formData, cia: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1ª Cia</option>
                    <option value="2">2ª Cia</option>
                    <option value="3">3ª Cia</option>
                    <option value="4">4ª Cia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipe (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.equipe}
                    onChange={(e) => setFormData({ ...formData, equipe: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Alpha, Bravo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5543999999999"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Ativa
                  </label>
                </div>

                <div className="md:col-span-2 lg:col-span-3 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingConfig ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de Configurações Agrupadas por Cia */}
          <div className="space-y-6">
            {Array.from(new Set(configs.map(c => c.cia)))
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(cia => {
                const ciaConfigs = configs.filter(c => c.cia === cia)
                const whatsappNumber = ciaConfigs[0]?.whatsapp_number || ''
                
                return (
                  <div key={cia} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cia}ª Companhia
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {ciaConfigs.length} cidades
                        </span>
                        <span className="text-sm text-gray-600">
                          WhatsApp: {whatsappNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleBatchEdit(cia)}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar em Lote
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {ciaConfigs.map((config) => (
                        <div
                          key={config.id}
                          className="bg-white rounded-lg border p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">
                                {config.city}
                              </h4>
                              {config.equipe && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Equipe: {config.equipe}
                                </p>
                              )}
                              <div className="flex items-center mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  config.is_active 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {config.is_active ? 'Ativa' : 'Inativa'}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-1">
                              <button
                                onClick={() => handleEdit(config)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Editar cidade"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete(config.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Excluir cidade"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Mensagem para não-admins */}
      {!isAdmin && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Acesso Restrito
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Apenas administradores podem gerenciar as configurações de contato.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição em Lote */}
      {showBatchEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Editar {editingCia}ª Companhia em Lote
              </h3>
              <button
                onClick={() => {
                  setShowBatchEdit(false)
                  setEditingCia(null)
                  setBatchWhatsapp('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Este número será aplicado a todas as {configs.filter(c => c.cia === editingCia).length} cidades da {editingCia}ª Companhia.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número do WhatsApp
              </label>
              <input
                type="text"
                value={batchWhatsapp}
                onChange={(e) => setBatchWhatsapp(e.target.value)}
                placeholder="5543999999999"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowBatchEdit(false)
                  setEditingCia(null)
                  setBatchWhatsapp('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleBatchSave}
                disabled={!batchWhatsapp.trim()}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tools