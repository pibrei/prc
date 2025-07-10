import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/map/cluster-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { MapPin, Car, Eye, EyeOff, Filter, X, Search, Navigation } from 'lucide-react'
import { useGeolocation } from '../contexts/GeolocationContext'
import { useAuth } from '../contexts/AuthContext'

// Fix for default markers (icons imported for future use)

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #3B82F6; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
  className: 'custom-marker'
})

// VehicleIcon removed - using dynamic icon creation function instead

interface Property {
  id: string
  name: string
  latitude: number
  longitude: number
  contact_name: string | null
  contact_phone: string | null
  contact_observations: string | null
  property_type: string
  has_cameras: boolean
  cameras_count: number
  has_wifi: boolean
  owner_name: string
  owner_phone: string | null
  crpm: string
  batalhao: string
  cia: string | null
  equipe: string | null
  cidade: string
  bairro: string | null
}

interface Vehicle {
  id: string
  license_plate: string
  make: string | null
  model: string | null
  color: string | null
  suspicious_activity: string | null
  location_spotted: string | null
  latitude: number | null
  longitude: number | null
  status: string
  spotted_at: string
}

const Map: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [showProperties, setShowProperties] = useState(true)
  const [showVehicles, setShowVehicles] = useState(true)
  const [loading, setLoading] = useState(true)
  const { userLocation, hasLocationPermission } = useGeolocation()
  const { userProfile } = useAuth()
  
  // Estados para filtros de visualização por perfil do usuário
  const [selectedBatalhao, setSelectedBatalhao] = useState('')
  const [selectedCia, setSelectedCia] = useState('')
  
  // Filter states
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all')
  const [camerasFilter, setCamerasFilter] = useState<string>('all')
  const [wifiFilter, setWifiFilter] = useState<string>('all')
  const [crpmFilter, setCrpmFilter] = useState<string>('all')
  const [battalionFilter, setBattalionFilter] = useState<string>('all')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  
  // Search states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [searchResults, setSearchResults] = useState<Property[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Usar localização do usuário se disponível, senão usar Curitiba como padrão
  const getMapCenter = (): [number, number] => {
    if (userLocation && hasLocationPermission) {
      return [userLocation.lat, userLocation.lng]
    }
    return [-25.4284, -49.2733] // Curitiba, PR
  }

  const [mapCenter, setMapCenter] = useState<[number, number]>(getMapCenter())

  // Atualizar centro do mapa quando a localização do usuário estiver disponível
  useEffect(() => {
    if (userLocation && hasLocationPermission) {
      setMapCenter([userLocation.lat, userLocation.lng])
    }
  }, [userLocation, hasLocationPermission])

  // Definir filtros padrão baseados no perfil do usuário
  useEffect(() => {
    if (userProfile) {
      console.log('👤 Perfil do usuário:', userProfile)
      console.log('🏢 Definindo filtros:', { batalhao: userProfile.batalhao, cia: userProfile.cia })
      setSelectedBatalhao(userProfile.batalhao || '')
      setSelectedCia(userProfile.cia || '')
    }
  }, [userProfile])

  // Carregamento quando os filtros mudarem
  useEffect(() => {
    if (selectedBatalhao !== undefined && selectedCia !== undefined) {
      fetchMapData()
    }
  }, [selectedBatalhao, selectedCia])

  // Effect to handle URL parameters for property selection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const propertyId = urlParams.get('property')
    const lat = urlParams.get('lat')
    const lng = urlParams.get('lng')
    
    if (propertyId && lat && lng && properties.length > 0) {
      const property = properties.find(p => p.id === propertyId)
      if (property) {
        setSelectedProperty(property)
        setMapCenter([parseFloat(lat), parseFloat(lng)])
        setSearchTerm(property.name)
        
        // Clear URL parameters after processing
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [properties])

  const fetchMapData = async () => {
    try {
      console.log('🗺️ Fetching properties for map with filters...')
      console.log('🔍 Filtros aplicados:', { selectedBatalhao, selectedCia })
      
      // Se não há filtros definidos, não carregar nada
      if (!selectedBatalhao && !selectedCia) {
        console.log('⚠️ Nenhum filtro definido - aguardando configuração')
        return
      }
      
      // Buscar propriedades com filtros baseados no perfil do usuário
      let allProperties: Property[] = []
      let from = 0
      const pageSize = 1000
      
      while (true) {
        let query = supabase
          .from('properties')
          .select('*')
          .range(from, from + pageSize - 1)
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
        
        if (data && data.length > 0) {
          allProperties = [...allProperties, ...data]
          console.log(`📊 Loaded ${allProperties.length} properties so far`)
          
          if (data.length < pageSize) {
            // Última página
            break
          }
          from += pageSize
        } else {
          break
        }
      }

      // Buscar veículos
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .limit(5000)

      if (vehiclesError) throw vehiclesError

      console.log(`✅ Map data loaded: ${allProperties.length} properties, ${vehicles?.length || 0} vehicles`)
      
      setProperties(allProperties)
      setVehicles(vehicles || [])
    } catch (error) {
      console.error('Erro ao buscar dados do mapa:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const getFilteredProperties = () => {
    return properties.filter(property => {
      if (propertyTypeFilter !== 'all' && property.property_type !== propertyTypeFilter) return false
      if (camerasFilter === 'with_cameras' && !property.has_cameras) return false
      if (camerasFilter === 'without_cameras' && property.has_cameras) return false
      if (wifiFilter === 'with_wifi' && !property.has_wifi) return false
      if (wifiFilter === 'without_wifi' && property.has_wifi) return false
      if (crpmFilter !== 'all' && property.crpm !== crpmFilter) return false
      if (battalionFilter !== 'all' && property.batalhao !== battalionFilter) return false
      return true
    })
  }

  const getFilteredVehicles = () => {
    return vehicles.filter(vehicle => {
      if (vehicleStatusFilter !== 'all' && vehicle.status !== vehicleStatusFilter) return false
      return true
    })
  }

  const getUniqueValues = (array: any[], key: string) => {
    return [...new Set(array.map(item => item[key]).filter(Boolean))].sort()
  }

  // Search functions
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.trim()) {
      const results = properties.filter(property =>
        property.name.toLowerCase().includes(term.toLowerCase()) ||
        property.owner_name.toLowerCase().includes(term.toLowerCase()) ||
        property.cidade.toLowerCase().includes(term.toLowerCase()) ||
        property.bairro?.toLowerCase().includes(term.toLowerCase())
      )
      setSearchResults(results)
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
      setSelectedProperty(null)
    }
  }

  const selectProperty = (property: Property) => {
    setSelectedProperty(property)
    setMapCenter([property.latitude, property.longitude])
    setShowSearchResults(false)
    setSearchTerm(property.name)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setSearchResults([])
    setShowSearchResults(false)
    setSelectedProperty(null)
  }

  const clearAllFilters = () => {
    // Resetar filtros para os valores padrão do usuário
    setSelectedBatalhao(userProfile?.batalhao || '')
    setSelectedCia(userProfile?.cia || '')
    setPropertyTypeFilter('all')
    setCamerasFilter('all')
    setWifiFilter('all')
    setCrpmFilter('all')
    setBattalionFilter('all')
    setVehicleStatusFilter('all')
  }

  const getVehicleStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#EF4444'
      case 'resolved': return '#10B981'
      case 'false_alarm': return '#6B7280'
      default: return '#6B7280'
    }
  }

  const createVehicleIcon = (status: string) => {
    const color = getVehicleStatusColor(status)
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
          <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
        </svg>
      </div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 25],
      popupAnchor: [0, -25],
      className: 'custom-marker'
    })
  }

  const createPropertyIcon = (property: Property) => {
    const isSelected = selectedProperty?.id === property.id
    const baseColor = property.has_cameras ? '#DC2626' : '#3B82F6' // Red for cameras, blue for regular
    const color = isSelected ? '#F59E0B' : baseColor // Gold for selected
    const icon = property.has_cameras ? 'camera' : 'location'
    const size = isSelected ? 35 : 25 // Larger for selected
    
    let iconSvg = ''
    if (icon === 'camera') {
      iconSvg = `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                 <circle cx="12" cy="13" r="3"/>`
    } else {
      iconSvg = `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                 <circle cx="12" cy="10" r="3"/>`
    }
    
    const borderStyle = isSelected ? '3px solid #F59E0B' : '2px solid white'
    const shadowStyle = isSelected ? 'box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);' : ''
    
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: ${borderStyle}; display: flex; align-items: center; justify-content: center; ${shadowStyle}">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          ${iconSvg}
        </svg>
      </div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
      className: 'custom-marker'
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando mapa...</div>
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      <div className="px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Mapa</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Visualize propriedades e veículos suspeitos no mapa
        </p>
      </div>

      {/* Filtros de Visualização por Perfil */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">
              Visualizando propriedades de:
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 text-sm">
            <span className="font-medium text-blue-600">
              {selectedBatalhao || 'Todos os Batalhões'}
            </span>
            {selectedCia && (
              <>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="font-medium text-green-600">
                  {selectedCia}
                </span>
              </>
            )}
            {userProfile && (selectedBatalhao !== userProfile.batalhao || selectedCia !== userProfile.cia) && (
              <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                Filtro personalizado
              </span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
              <CardTitle className="text-lg sm:text-xl">Mapa Interativo</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-xs sm:text-sm"
                >
                  <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Filtros</span>
                  <span className="sm:hidden">Filtros</span>
                </Button>
                <Button
                  variant={showProperties ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowProperties(!showProperties)}
                  className="text-xs sm:text-sm"
                >
                  {showProperties ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Propriedades ({getFilteredProperties().length})</span>
                  <span className="sm:hidden">Props ({getFilteredProperties().length})</span>
                </Button>
                <Button
                  variant={showVehicles ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowVehicles(!showVehicles)}
                  className="text-xs sm:text-sm"
                >
                  {showVehicles ? <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" /> : <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />}
                  <Car className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Veículos ({getFilteredVehicles().length})</span>
                  <span className="sm:hidden">Veíc ({getFilteredVehicles().length})</span>
                </Button>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar propriedade..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {selectedProperty && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMapCenter([selectedProperty.latitude, selectedProperty.longitude])}
                    className="flex items-center justify-center space-x-1 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-3"
                  >
                    <Navigation className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Centralizar</span>
                    <span className="sm:hidden">Centro</span>
                  </Button>
                )}
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto z-[9999]">
                  {searchResults.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => selectProperty(property)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{property.name}</p>
                          <p className="text-sm text-gray-600">Proprietário: {property.owner_name}</p>
                          <p className="text-xs text-gray-500">{property.cidade}{property.bairro && `, ${property.bairro}`}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {property.has_cameras && (
                            <span className="text-blue-600 text-xs">📷</span>
                          )}
                          {property.has_wifi && (
                            <span className="text-green-600 text-xs">📶</span>
                          )}
                          <MapPin className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* No Results Message */}
              {showSearchResults && searchResults.length === 0 && searchTerm.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 z-[9999]">
                  <p className="text-gray-500 text-center">Nenhuma propriedade encontrada para "{searchTerm}"</p>
                </div>
              )}
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-base sm:text-lg font-medium">Filtros</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-xs sm:text-sm"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="hidden sm:inline">Limpar Filtros</span>
                  <span className="sm:hidden">Limpar</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Batalhão</label>
                  <select
                    value={selectedBatalhao}
                    onChange={(e) => setSelectedBatalhao(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="">Todos os Batalhões</option>
                    <option value="1º BPM">1º BPM</option>
                    <option value="2º BPM">2º BPM</option>
                    <option value="3º BPM">3º BPM</option>
                    <option value="4º BPM">4º BPM</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">CIA</label>
                  <select
                    value={selectedCia}
                    onChange={(e) => setSelectedCia(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="">Todas as CIAs</option>
                    <option value="1ª CIA">1ª CIA</option>
                    <option value="2ª CIA">2ª CIA</option>
                    <option value="3ª CIA">3ª CIA</option>
                    <option value="4ª CIA">4ª CIA</option>
                    <option value="5ª CIA">5ª CIA</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="rural">Rural</option>
                    <option value="urban">Urbana</option>
                    <option value="mixed">Mista</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Câmeras</label>
                  <select
                    value={camerasFilter}
                    onChange={(e) => setCamerasFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="with_cameras">Com Câmeras</option>
                    <option value="without_cameras">Sem Câmeras</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">WiFi</label>
                  <select
                    value={wifiFilter}
                    onChange={(e) => setWifiFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="with_wifi">Com WiFi</option>
                    <option value="without_wifi">Sem WiFi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">CRPM</label>
                  <select
                    value={crpmFilter}
                    onChange={(e) => setCrpmFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    {getUniqueValues(properties, 'crpm').map((crpm) => (
                      <option key={crpm} value={crpm}>{crpm}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Batalhão</label>
                  <select
                    value={battalionFilter}
                    onChange={(e) => setBattalionFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    {getUniqueValues(properties, 'batalhao').map((batalhao) => (
                      <option key={batalhao} value={batalhao}>{batalhao}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1">Status Veículo</label>
                  <select
                    value={vehicleStatusFilter}
                    onChange={(e) => setVehicleStatusFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-xs sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Ativo</option>
                    <option value="resolved">Resolvido</option>
                    <option value="false_alarm">Falso Alarme</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <div className="h-80 sm:h-96 w-full">
            <MapContainer
              center={mapCenter}
              zoom={userLocation && hasLocationPermission ? 14 : 10}
              style={{ height: '100%', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              <MarkerClusterGroup
                chunkedLoading
                maxClusterRadius={50}
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                zoomToBoundsOnClick={true}
                iconCreateFunction={(cluster) => {
                  const childCount = cluster.getChildCount();
                  let c = ' marker-cluster-';
                  if (childCount < 10) {
                    c += 'small';
                  } else if (childCount < 50) {
                    c += 'medium';
                  } else {
                    c += 'large';
                  }
                  
                  return new L.DivIcon({
                    html: `<div><span>${childCount}</span></div>`,
                    className: 'marker-cluster' + c,
                    iconSize: new L.Point(40, 40)
                  });
                }}
              >
                {showProperties && getFilteredProperties().map((property) => (
                  <Marker
                    key={property.id}
                    position={[property.latitude, property.longitude]}
                    icon={createPropertyIcon(property)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold">{property.name}</h3>
                        <p className="text-sm text-gray-600">{property.cidade}{property.bairro ? `, ${property.bairro}` : ''}</p>
                        <p className="text-xs text-gray-500">Tipo: {property.property_type}</p>
                        <p className="text-xs text-gray-500">Proprietário: {property.owner_name}</p>
                        {property.owner_phone && (
                          <p className="text-xs text-gray-500">Tel. Proprietário: {property.owner_phone}</p>
                        )}
                        <p className="text-xs text-gray-500">Responsável: {property.batalhao}</p>
                        {property.cia && (
                          <p className="text-xs text-gray-500">CIA: {property.cia}</p>
                        )}
                        {property.equipe && (
                          <p className="text-xs text-gray-500">Equipe: {property.equipe}</p>
                        )}
                        {property.has_cameras && (
                          <p className="text-xs text-red-600">🎥 Câmeras: {property.cameras_count}</p>
                        )}
                        {property.has_wifi && (
                          <p className="text-xs text-green-600">📶 WiFi disponível</p>
                        )}
                        {property.contact_name && (
                          <p className="text-xs text-gray-500">Contato Adicional: {property.contact_name}</p>
                        )}
                        {property.contact_phone && (
                          <p className="text-xs text-gray-500">Tel. Contato: {property.contact_phone}</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {showVehicles && getFilteredVehicles().map((vehicle) => (
                  <Marker
                    key={vehicle.id}
                    position={[vehicle.latitude!, vehicle.longitude!]}
                    icon={createVehicleIcon(vehicle.status)}
                  >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-semibold">Veículo: {vehicle.license_plate}</h3>
                      <div className="space-y-1 text-sm">
                        {vehicle.make && (
                          <p><span className="font-medium">Marca:</span> {vehicle.make}</p>
                        )}
                        {vehicle.model && (
                          <p><span className="font-medium">Modelo:</span> {vehicle.model}</p>
                        )}
                        {vehicle.color && (
                          <p><span className="font-medium">Cor:</span> {vehicle.color}</p>
                        )}
                        <p><span className="font-medium">Status:</span> {vehicle.status}</p>
                        {vehicle.location_spotted && (
                          <p><span className="font-medium">Local:</span> {vehicle.location_spotted}</p>
                        )}
                        <p><span className="font-medium">Data:</span> {new Date(vehicle.spotted_at).toLocaleDateString()}</p>
                        {vehicle.suspicious_activity && (
                          <p><span className="font-medium">Atividade:</span> {vehicle.suspicious_activity}</p>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">Propriedades</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-600 rounded-full"></div>
                <span className="text-xs sm:text-sm">Propriedades com Câmeras</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">Veículos Ativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">Veículos Resolvidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-500 rounded-full"></div>
                <span className="text-xs sm:text-sm">Falsos Alarmes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Propriedades:</span>
                <span className="text-xs sm:text-sm font-medium">{getFilteredProperties().length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Com Câmeras:</span>
                <span className="text-xs sm:text-sm font-medium text-red-600">
                  {getFilteredProperties().filter(p => p.has_cameras).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Veículos Ativos:</span>
                <span className="text-xs sm:text-sm font-medium text-red-600">
                  {getFilteredVehicles().filter(v => v.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Veículos Resolvidos:</span>
                <span className="text-xs sm:text-sm font-medium text-green-600">
                  {getFilteredVehicles().filter(v => v.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Falsos Alarmes:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {getFilteredVehicles().filter(v => v.status === 'false_alarm').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Map