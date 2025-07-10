import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Search, Camera, Wifi, Upload, Package, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LocationInput from '../components/ui/location-input'
import TeamSelector from '../components/ui/team-selector'

interface Property {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  cidade: string
  bairro: string | null
  numero_placa: string | null
  crpm: string
  batalhao: string
  cia: string | null
  equipe: string | null
  owner_name: string
  owner_phone: string | null
  owner_rg: string | null
  has_wifi: boolean
  wifi_password: string | null
  has_cameras: boolean
  cameras_count: number
  residents_count: number | null
  activity: string | null
  bou: string | null
  observations: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_observations: string | null
  property_type: 'rural' | 'urban' | 'mixed'
  cadastro_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

const Properties: React.FC = () => {
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [properties, setProperties] = useState<Property[]>([])
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  
  // Estados para filtros de visualização
  const [selectedBatalhao, setSelectedBatalhao] = useState('')
  const [selectedCia, setSelectedCia] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    cidade: '',
    bairro: '',
    numero_placa: '',
    crpm: '',
    batalhao: '',
    cia: '',
    equipe: '',
    owner_name: '',
    owner_phone: '',
    owner_rg: '',
    has_wifi: false,
    wifi_password: '',
    has_cameras: false,
    cameras_count: 0,
    residents_count: '',
    activity: '',
    bou: '',
    observations: '',
    contact_name: '',
    contact_phone: '',
    contact_observations: '',
    property_type: 'rural' as 'rural' | 'urban' | 'mixed',
    cadastro_date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (userProfile) {
      // Definir filtros padrão baseados no perfil do usuário
      setSelectedBatalhao(userProfile.batalhao || '')
      setSelectedCia(userProfile.cia || '')
    }
  }, [userProfile])

  // Carregamento quando os filtros mudarem
  useEffect(() => {
    if (selectedBatalhao !== undefined && selectedCia !== undefined) {
      if (hasSearched) {
        fetchAllProperties()
      } else {
        fetchPropertiesLimited()
      }
    }
  }, [selectedBatalhao, selectedCia, hasSearched])

  // Auto-preenchimento com dados do usuário logado
  useEffect(() => {
    if (userProfile && !editingProperty) {
      setFormData(prev => ({
        ...prev,
        crpm: userProfile.crpm || '',
        batalhao: userProfile.batalhao || ''
      }))
    }
  }, [userProfile, editingProperty])

  useEffect(() => {
    if (searchTerm.trim()) {
      setHasSearched(true)
      // Se há busca, carrega todas as propriedades para filtrar
      if (properties.length <= 5) {
        fetchAllProperties()
      }
      const filtered = properties.filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.bairro?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.owner_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredProperties(filtered)
    } else {
      setHasSearched(false)
      // Se não há busca, mostra apenas as primeiras 5
      setFilteredProperties(properties.slice(0, 5))
    }
  }, [properties, searchTerm])

  const fetchPropertiesLimited = async () => {
    try {
      console.log('🏢 Fetching limited properties with filters:', { selectedBatalhao, selectedCia })
      
      // Se não há filtros definidos, não carregar nada
      if (!selectedBatalhao && !selectedCia) {
        console.log('⚠️ Nenhum filtro definido - aguardando configuração')
        setLoading(false)
        return
      }
      
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      // Filtrar por batalhão e CIA selecionados (padrão do usuário)
      if (selectedBatalhao) {
        console.log('📍 Aplicando filtro batalhao:', selectedBatalhao)
        query = query.eq('batalhao', selectedBatalhao)
      }
      if (selectedCia) {
        console.log('🏢 Aplicando filtro cia:', selectedCia)
        query = query.eq('cia', selectedCia)
      }

      const { data, error } = await query.limit(5)

      if (error) throw error
      setProperties(data || [])
      setFilteredProperties(data || [])
    } catch (error) {
      console.error('Erro ao buscar propriedades:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllProperties = async () => {
    try {
      console.log('🏢 Fetching all properties with filters:', { selectedBatalhao, selectedCia })
      
      // Se não há filtros definidos, não carregar nada
      if (!selectedBatalhao && !selectedCia) {
        console.log('⚠️ Nenhum filtro definido - aguardando configuração')
        return
      }
      
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false })

      // Filtrar por batalhão e CIA selecionados (padrão do usuário)
      if (selectedBatalhao) {
        console.log('📍 Aplicando filtro batalhao:', selectedBatalhao)
        query = query.eq('batalhao', selectedBatalhao)
      }
      if (selectedCia) {
        console.log('🏢 Aplicando filtro cia:', selectedCia)
        query = query.eq('cia', selectedCia)
      }

      const { data, error } = await query

      if (error) throw error
      setProperties(data || [])
    } catch (error) {
      console.error('Erro ao buscar todas as propriedades:', error)
    }
  }

  const fetchProperties = fetchAllProperties

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProperty) {
        // Para edição, usar update direto
        const propertyData = {
          ...formData,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          cameras_count: parseInt(formData.cameras_count.toString()) || 0,
          residents_count: formData.residents_count ? parseInt(formData.residents_count.toString()) : null
        }

        const { error } = await supabase
          .from('properties')
          .update(propertyData)
          .eq('id', editingProperty.id)

        if (error) throw error
      } else {
        // Para criação, usar função RPC
        const { data, error } = await supabase
          .rpc('create_property_profile', {
            property_name: formData.name,
            property_latitude: parseFloat(formData.latitude),
            property_longitude: parseFloat(formData.longitude),
            property_cidade: formData.cidade,
            property_batalhao: formData.batalhao,
            property_crpm: formData.crpm,
            property_owner_name: formData.owner_name,
            property_created_by: userProfile?.id,
            property_description: formData.description || null,
            property_bairro: formData.bairro || null,
            property_numero_placa: formData.numero_placa || null,
            property_cia: formData.cia || null,
            property_equipe: formData.equipe || null,
            property_owner_phone: formData.owner_phone || null,
            property_owner_rg: formData.owner_rg || null,
            property_has_wifi: formData.has_wifi,
            property_wifi_password: formData.wifi_password || null,
            property_has_cameras: formData.has_cameras,
            property_cameras_count: parseInt(formData.cameras_count.toString()) || 0,
            property_residents_count: formData.residents_count ? parseInt(formData.residents_count.toString()) : null,
            property_activity: formData.activity || null,
            property_bou: formData.bou || null,
            property_observations: formData.observations || null,
            property_contact_name: formData.contact_name || null,
            property_contact_phone: formData.contact_phone || null,
            property_contact_observations: formData.contact_observations || null,
            property_type: formData.property_type,
            property_cadastro_date: formData.cadastro_date
          })

        if (error) throw error
        
        if (data && data.length > 0 && !data[0].success) {
          throw new Error(data[0].message)
        }
      }

      setShowForm(false)
      setEditingProperty(null)
      resetForm()
      fetchProperties()
    } catch (error) {
      console.error('Erro ao salvar propriedade:', error)
      alert('Erro ao salvar propriedade: ' + (error as Error).message)
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      description: property.description || '',
      latitude: property.latitude.toString(),
      longitude: property.longitude.toString(),
      cidade: property.cidade || '',
      bairro: property.bairro || '',
      numero_placa: property.numero_placa || '',
      crpm: property.crpm || '',
      batalhao: property.batalhao || '',
      cia: property.cia || '',
      equipe: property.equipe || '',
      owner_name: property.owner_name || '',
      owner_phone: property.owner_phone || '',
      owner_rg: property.owner_rg || '',
      has_wifi: property.has_wifi || false,
      wifi_password: property.wifi_password || '',
      has_cameras: property.has_cameras || false,
      cameras_count: property.cameras_count || 0,
      residents_count: property.residents_count?.toString() || '',
      activity: property.activity || '',
      bou: property.bou || '',
      observations: property.observations || '',
      contact_name: property.contact_name || '',
      contact_phone: property.contact_phone || '',
      contact_observations: property.contact_observations || '',
      property_type: property.property_type,
      cadastro_date: property.cadastro_date || new Date().toISOString().split('T')[0]
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta propriedade?')) {
      try {
        const { error } = await supabase
          .from('properties')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchProperties()
      } catch (error) {
        console.error('Erro ao excluir propriedade:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      latitude: '',
      longitude: '',
      cidade: '',
      bairro: '',
      numero_placa: '',
      crpm: userProfile?.crpm || '',
      batalhao: userProfile?.batalhao || '',
      cia: '',
      equipe: '',
      owner_name: '',
      owner_phone: '',
      owner_rg: '',
      has_wifi: false,
      wifi_password: '',
      has_cameras: false,
      cameras_count: 0,
      residents_count: '',
      activity: '',
      bou: '',
      observations: '',
      contact_name: '',
      contact_phone: '',
      contact_observations: '',
      property_type: 'rural',
      cadastro_date: new Date().toISOString().split('T')[0]
    })
  }

  const canDelete = userProfile?.role === 'admin'

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl lg:text-3xl font-bold tracking-tight">Propriedades</h1>
          <p className="text-sm lg:text-base text-muted-foreground">
            Gerencie as propriedades cadastradas no sistema
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nova Propriedade
          </Button>
          {(userProfile?.role === 'admin' || userProfile?.role === 'team_leader') && (
            <>
              <Button 
                onClick={() => navigate('/properties/import-single')} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button 
                onClick={() => navigate('/properties/import-batch')} 
                variant="outline"
                className="w-full sm:w-auto bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Package className="h-4 w-4 mr-2" />
                Importar em Lotes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Filtros de Visualização */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Visualizar por:
            </label>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Batalhão:
              </label>
              <select
                value={selectedBatalhao}
                onChange={(e) => setSelectedBatalhao(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-32"
              >
                <option value="">Todos os Batalhões</option>
                <option value="1º BPM">1º BPM</option>
                <option value="2º BPM">2º BPM</option>
                <option value="3º BPM">3º BPM</option>
                <option value="4º BPM">4º BPM</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-600 whitespace-nowrap">
                CIA:
              </label>
              <select
                value={selectedCia}
                onChange={(e) => setSelectedCia(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm min-w-32"
              >
                <option value="">Todas as CIAs</option>
                <option value="1ª CIA">1ª CIA</option>
                <option value="2ª CIA">2ª CIA</option>
                <option value="3ª CIA">3ª CIA</option>
                <option value="4ª CIA">4ª CIA</option>
                <option value="5ª CIA">5ª CIA</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 flex items-center">
              Padrão: {userProfile?.batalhao} - {userProfile?.cia}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-gray-400" />
        <Input
          placeholder="Pesquisar propriedades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção: Informações da Propriedade */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Informações da Propriedade</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome da Propriedade *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Data de Cadastro *</label>
                    <Input
                      type="date"
                      value={formData.cadastro_date}
                      onChange={(e) => setFormData({...formData, cadastro_date: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Cidade *</label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Bairro</label>
                    <Input
                      value={formData.bairro}
                      onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Número da Placa</label>
                    <Input
                      value={formData.numero_placa}
                      onChange={(e) => setFormData({...formData, numero_placa: e.target.value})}
                    />
                  </div>
                </div>


                <div className="mt-4">
                  <LocationInput
                    latitude={parseFloat(formData.latitude) || -25.4284}
                    longitude={parseFloat(formData.longitude) || -49.2733}
                    onLocationChange={(lat, lng) => {
                      setFormData({
                        ...formData,
                        latitude: lat.toString(),
                        longitude: lng.toString()
                      })
                    }}
                    label="Coordenadas Geográficas"
                    required
                  />
                </div>
              </div>

              {/* Seção: Informações do Proprietário */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Informações do Proprietário</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Proprietário *</label>
                    <Input
                      value={formData.owner_name}
                      onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <Input
                      value={formData.owner_phone}
                      onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">RG</label>
                    <Input
                      value={formData.owner_rg}
                      onChange={(e) => setFormData({...formData, owner_rg: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Responsabilidade Militar */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Responsabilidade Militar</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">CRPM</label>
                    <Input
                      value={formData.crpm}
                      onChange={(e) => setFormData({...formData, crpm: e.target.value})}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Batalhão</label>
                    <Input
                      value={formData.batalhao}
                      onChange={(e) => setFormData({...formData, batalhao: e.target.value})}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Companhia</label>
                    <select
                      value={formData.cia}
                      onChange={(e) => setFormData({...formData, cia: e.target.value})}
                      className="w-full p-2 border rounded-md"
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
                  <div>
                    <TeamSelector
                      batalhao={formData.batalhao}
                      selectedTeam={formData.equipe}
                      onTeamChange={(team) => setFormData({...formData, equipe: team})}
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Infraestrutura */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Infraestrutura</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has_wifi"
                      checked={formData.has_wifi}
                      onChange={(e) => setFormData({...formData, has_wifi: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="has_wifi" className="text-sm font-medium flex items-center">
                      <Wifi className="h-4 w-4 mr-1" />
                      Possui WiFi
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has_cameras"
                      checked={formData.has_cameras}
                      onChange={(e) => setFormData({...formData, has_cameras: e.target.checked})}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="has_cameras" className="text-sm font-medium flex items-center">
                      <Camera className="h-4 w-4 mr-1" />
                      Possui Câmeras de Segurança
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {formData.has_wifi && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Senha do WiFi</label>
                      <Input
                        type="password"
                        value={formData.wifi_password}
                        onChange={(e) => setFormData({...formData, wifi_password: e.target.value})}
                      />
                    </div>
                  )}
                  {formData.has_cameras && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Quantidade de Câmeras</label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.cameras_count}
                        onChange={(e) => setFormData({...formData, cameras_count: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantidade de Moradores</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.residents_count}
                      onChange={(e) => setFormData({...formData, residents_count: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Atividade Desenvolvida</label>
                    <Input
                      value={formData.activity}
                      onChange={(e) => setFormData({...formData, activity: e.target.value})}
                      placeholder="Ex: Agricultura, Pecuária, Comércio"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Informações Extras */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Informações Extras</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">BOU (Opcional)</label>
                    <Input
                      value={formData.bou}
                      onChange={(e) => setFormData({...formData, bou: e.target.value})}
                      placeholder="Boletim de Ocorrência Unificado"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Descrição/Observações</label>
                    <textarea
                      value={formData.observations}
                      onChange={(e) => setFormData({...formData, observations: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Observações adicionais sobre a propriedade"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Contato (Opcional) */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-medium mb-4">Contato Adicional (Opcional)</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Nome do Contato</label>
                    <Input
                      value={formData.contact_name}
                      onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Telefone</label>
                    <Input
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Observação</label>
                    <textarea
                      value={formData.contact_observations || ''}
                      onChange={(e) => setFormData({...formData, contact_observations: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Observações sobre o contato adicional"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProperty(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProperty ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Mensagem informativa */}
      {!hasSearched && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-600">
              <p className="mb-2">📋 Exibindo apenas as 5 propriedades mais recentes</p>
              <p className="text-sm">Use a busca acima para encontrar propriedades específicas ou visualizar mais resultados</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearched && filteredProperties.length === 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="text-center text-gray-600">
              <p>🔍 Nenhuma propriedade encontrada para "{searchTerm}"</p>
              <p className="text-sm mt-1">Tente ajustar os termos de busca</p>
            </div>
          </CardContent>
        </Card>
      )}

      {hasSearched && filteredProperties.length > 0 && (
        <div className="mb-4 text-sm text-gray-600 text-center">
          ✅ {filteredProperties.length} propriedade(s) encontrada(s) para "{searchTerm}"
        </div>
      )}

      <div className="grid gap-4">
        {filteredProperties.map((property) => (
          <Card key={property.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{property.name}</h3>
                    {property.has_cameras && (
                      <span className="flex items-center text-blue-600">
                        <Camera className="h-4 w-4 mr-1" />
                        <span className="text-xs">Câmeras</span>
                      </span>
                    )}
                    {property.has_wifi && (
                      <span className="flex items-center text-green-600">
                        <Wifi className="h-4 w-4 mr-1" />
                        <span className="text-xs">WiFi</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Localização:</span> {property.cidade}
                      {property.bairro && `, ${property.bairro}`}
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {property.property_type}
                    </div>
                    <div>
                      <span className="font-medium">Proprietário:</span> {property.owner_name}
                    </div>
                    {property.owner_phone && (
                      <div>
                        <span className="font-medium">Tel. Proprietário:</span> {property.owner_phone}
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Data Cadastro:</span> {property.cadastro_date ? new Date(property.cadastro_date).toLocaleDateString('pt-BR') : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Coordenadas:</span> {property.latitude}, {property.longitude}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm mb-3">
                    <div>
                      <span className="font-medium">Responsável:</span> {property.batalhao}
                      {property.cia && ` - ${property.cia}`}
                      {property.equipe && ` - ${property.equipe}`}
                    </div>
                  </div>

                  {(property.has_cameras || property.residents_count || property.activity) && (
                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                      {property.has_cameras && (
                        <div>
                          <span className="font-medium">Câmeras:</span> {property.cameras_count}
                        </div>
                      )}
                      {property.residents_count && (
                        <div>
                          <span className="font-medium">Moradores:</span> {property.residents_count}
                        </div>
                      )}
                      {property.activity && (
                        <div>
                          <span className="font-medium">Atividade:</span> {property.activity}
                        </div>
                      )}
                    </div>
                  )}

                  {property.observations && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      <span className="font-medium">Observações:</span> {property.observations}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/map?property=${property.id}&lat=${property.latitude}&lng=${property.longitude}`)}
                    title="Ver no Mapa"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(property)}
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(property.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProperties.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhuma propriedade encontrada</p>
        </div>
      )}
    </div>
  )
}

export default Properties