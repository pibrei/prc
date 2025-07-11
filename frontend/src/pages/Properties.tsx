import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Search, Camera, Wifi, Upload, MapPin, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PropertyFormModal from '../components/property/PropertyFormModal'

interface Property {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  cidade: string
  bairro: string | null
  numero_placa: string | null
  solicitou_placa: boolean
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
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasSearched, setHasSearched] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Estados para filtros de visualização
  const [selectedBatalhao, setSelectedBatalhao] = useState('')
  const [selectedCia, setSelectedCia] = useState('')

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
        .is('deleted_at', null)
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
        .is('deleted_at', null)
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

  const handleSubmit = async (formData: any) => {
    try {
      if (editingProperty) {
        // Para edição, usar update direto
        const propertyData = {
          name: formData.name,
          description: formData.description || null,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          cidade: formData.cidade,
          bairro: formData.bairro || null,
          numero_placa: formData.numero_placa || null,
          solicitou_placa: formData.solicitou_placa,
          crpm: formData.crpm,
          batalhao: formData.batalhao,
          cia: formData.cia || null,
          equipe: formData.equipe || null,
          owner_name: formData.owner_name,
          owner_phone: formData.owner_phone || null,
          owner_rg: formData.owner_rg || null,
          has_wifi: formData.has_wifi,
          wifi_password: formData.wifi_password || null,
          has_cameras: formData.has_cameras,
          cameras_count: parseInt(formData.cameras_count.toString()) || 0,
          residents_count: formData.residents_count ? parseInt(formData.residents_count.toString()) : null,
          activity: formData.activity || null,
          bou: formData.bou || null,
          observations: formData.observations || null,
          contact_name: formData.contact_name || null,
          contact_phone: formData.contact_phone || null,
          contact_observations: formData.contact_observations || null,
          property_type: formData.property_type,
          cadastro_date: formData.cadastro_date
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
            property_solicitou_placa: formData.solicitou_placa,
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

      setShowFormModal(false)
      setEditingProperty(null)
      
      // Mostrar mensagem de sucesso
      if (!editingProperty) {
        setSuccessMessage('Propriedade cadastrada com sucesso!')
        setTimeout(() => setSuccessMessage(''), 5000) // Remove após 5 segundos
      } else {
        setSuccessMessage('Propriedade atualizada com sucesso!')
        setTimeout(() => setSuccessMessage(''), 5000) // Remove após 5 segundos
      }
      
      fetchProperties()
    } catch (error) {
      console.error('Erro ao salvar propriedade:', error)
      alert('Erro ao salvar propriedade: ' + (error as Error).message)
    }
  }

  const handleEdit = (property: Property) => {
    setEditingProperty(property)
    setShowFormModal(true)
  }

  const handleCloseModal = () => {
    setShowFormModal(false)
    setEditingProperty(null)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta propriedade?')) {
      try {
        // Verificar se o usuário está autenticado
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          alert('Erro: Usuário não autenticado. Faça login novamente.')
          return
        }

        console.log('🔍 Debug delete - Property ID:', id)
        console.log('🔍 Debug delete - User Role:', userProfile?.role)

        // Usar Edge Function para exclusão (mesmo padrão dos usuários)
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-property`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            propertyId: id
          })
        })
        
        const responseText = await response.text()
        console.log('Delete response status:', response.status)
        console.log('Delete response text:', responseText)
        
        if (!response.ok) {
          let errorMessage = 'Erro ao excluir propriedade'
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorMessage
          } catch (e) {
            errorMessage = responseText || errorMessage
          }
          throw new Error(errorMessage)
        }

        console.log('✅ Delete successful via Edge Function')
        setSuccessMessage('Propriedade excluída com sucesso!')
        setTimeout(() => setSuccessMessage(''), 5000)
        fetchProperties()
      } catch (error) {
        console.error('Erro ao excluir propriedade:', error)
        alert(`Erro ao excluir propriedade: ${(error as Error).message}`)
      }
    }
  }


  const canDelete = userProfile?.role === 'admin'

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-4 lg:space-y-6 pb-20 lg:pb-0">
      {/* Mensagem de Sucesso */}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-green-600 text-xl">✅</span>
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage('')}
            className="text-green-600 hover:text-green-800 font-bold text-lg"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile-First Header */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Propriedades</h1>
          <p className="text-sm text-muted-foreground">
            {hasSearched ? `${filteredProperties.length} encontradas` : `${filteredProperties.length} na sua área`}
          </p>
        </div>
        
        {/* Mobile Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button 
            onClick={() => setShowFormModal(true)} 
            className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-6 w-6 mr-2" />
            ➕ Nova Propriedade
          </Button>
          
          {(userProfile?.role === 'admin' || userProfile?.role === 'team_leader') && (
            <Button 
              onClick={() => navigate('/properties/import-single')} 
              variant="outline"
              className="w-full h-12 bg-green-50 hover:bg-green-100 border-green-200"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Filters */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Batalhão
              </label>
              <select
                value={selectedBatalhao}
                onChange={(e) => setSelectedBatalhao(e.target.value)}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos os Batalhões</option>
                <option value="1º BPM">1º BPM</option>
                <option value="2º BPM">2º BPM</option>
                <option value="3º BPM">3º BPM</option>
                <option value="4º BPM">4º BPM</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                Companhia
              </label>
              <select
                value={selectedCia}
                onChange={(e) => setSelectedCia(e.target.value)}
                className="w-full h-12 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas as CIAs</option>
                <option value="1ª CIA">1ª CIA</option>
                <option value="2ª CIA">2ª CIA</option>
                <option value="3ª CIA">3ª CIA</option>
                <option value="4ª CIA">4ª CIA</option>
                <option value="5ª CIA">5ª CIA</option>
              </select>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <strong>Área padrão:</strong> {userProfile?.batalhao} - {userProfile?.cia}
          </div>
        </div>
      </Card>

      {/* Mobile-First Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Pesquisar propriedades..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-12 pl-12 pr-4 text-base border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
      </div>


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

      {/* Mobile-Optimized Property Cards */}
      <div className="space-y-4">
        {filteredProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-0">
              {/* Header with Title and Icons */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{property.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {property.cidade}{property.bairro && `, ${property.bairro}`}
                    </div>
                  </div>
                  
                  {/* Status Icons */}
                  <div className="flex space-x-2">
                    {property.has_cameras && (
                      <div className="flex items-center bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                        <Camera className="h-3 w-3 mr-1" />
                        {property.cameras_count}
                      </div>
                    )}
                    {property.has_wifi && (
                      <div className="flex items-center bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        <Wifi className="h-3 w-3 mr-1" />
                        WiFi
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Main Content */}
              <div className="p-4 space-y-4">
                {/* Property Owner */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Proprietário</div>
                  <div className="font-medium text-gray-900">{property.owner_name}</div>
                  {property.owner_phone && (
                    <div className="text-sm text-gray-600 mt-1">
                      <a href={`tel:${property.owner_phone}`} className="text-blue-600 hover:underline">
                        {property.owner_phone}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* Property Details Grid - Simplified */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Cadastro</div>
                    <div className="font-medium">{property.cadastro_date ? new Date(property.cadastro_date).toLocaleDateString('pt-BR') : 'N/A'}</div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coordenadas</div>
                    <div className="font-medium text-xs">{property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}</div>
                  </div>
                </div>
                
                {/* Observations */}
                {property.observations && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">Observações</div>
                    <div className="text-sm text-yellow-800">{property.observations}</div>
                  </div>
                )}
              </div>
              
              {/* Mobile Action Buttons */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/map?property=${property.id}&lat=${property.latitude}&lng=${property.longitude}`)}
                    className="h-12 flex flex-col items-center justify-center text-xs"
                  >
                    <MapPin className="h-4 w-4 mb-1" />
                    Ver no Mapa
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => handleEdit(property)}
                    className="h-12 flex flex-col items-center justify-center text-xs"
                  >
                    <Edit className="h-4 w-4 mb-1" />
                    Editar
                  </Button>
                  
                  {canDelete && (
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(property.id)}
                      className="h-12 flex flex-col items-center justify-center text-xs text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4 mb-1" />
                      Excluir
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

      {/* Property Form Modal */}
      <PropertyFormModal
        isOpen={showFormModal}
        onClose={handleCloseModal}
        editingProperty={editingProperty}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

export default Properties