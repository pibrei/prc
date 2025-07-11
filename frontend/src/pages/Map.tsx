import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/map/cluster-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { MapPin, Car, Eye, EyeOff, Filter, X, Search, Navigation, Camera, Wifi } from 'lucide-react'
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

// Componente para detectar interações do usuário no mapa
const MapInteractionDetector: React.FC<{ onUserInteraction: () => void }> = ({ onUserInteraction }) => {
  useMapEvents({
    dragstart: () => onUserInteraction(),
    zoomstart: () => onUserInteraction(),
    click: () => onUserInteraction(),
  })
  return null
}

// Componente para controlar o centro do mapa programaticamente
const MapCenterController: React.FC<{ center: [number, number] | null }> = ({ center }) => {
  const map = useMapEvents({
    moveend: () => {
      // Evento disparado quando o mapa termina de mover
      if (center) {
        const event = new CustomEvent('mapMoveComplete', { detail: { center } })
        window.dispatchEvent(event)
      }
    }
  })
  
  useEffect(() => {
    if (center && map) {
      // Detectar se é mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      if (isMobile) {
        // No mobile, usar flyTo com configurações mais agressivas
        map.flyTo(center, 16, {
          animate: true,
          duration: 2,
          easeLinearity: 0.5
        })
      } else {
        // Desktop usa setView normal
        map.setView(center, 16, {
          animate: true,
          duration: 1.5
        })
      }
    }
  }, [center, map])
  
  return null
}

// Componente de marcador controlável
const ControlledMarker: React.FC<{
  property: Property
  icon: L.DivIcon
  shouldOpenPopup: boolean
  onPopupOpen?: () => void
}> = ({ property, icon, shouldOpenPopup, onPopupOpen }) => {
  const markerRef = useRef<L.Marker>(null)

  useEffect(() => {
    if (shouldOpenPopup && markerRef.current) {
      // Detectar se é mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      
      const openPopup = () => {
        if (markerRef.current) {
          try {
            markerRef.current.openPopup()
            onPopupOpen?.()
          } catch (error) {
            console.error('Erro ao abrir popup:', error)
          }
        }
      }
      
      if (isMobile) {
        // Em mobile, aguardar o mapa terminar de mover
        const handleMapMoveComplete = (event: CustomEvent) => {
          const { center } = event.detail
          const propertyPosition = [property.latitude, property.longitude]
          
          // Verificar se o centro do mapa está próximo à propriedade
          const lat1 = center[0], lng1 = center[1]
          const lat2 = propertyPosition[0], lng2 = propertyPosition[1]
          const distance = Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2))
          
          if (distance < 0.001) { // Muito próximo
            setTimeout(openPopup, 500)
          }
        }
        
        window.addEventListener('mapMoveComplete', handleMapMoveComplete as EventListener)
        
        // Fallback timeout
        const fallbackTimer = setTimeout(openPopup, 3000)
        
        return () => {
          window.removeEventListener('mapMoveComplete', handleMapMoveComplete as EventListener)
          clearTimeout(fallbackTimer)
        }
      } else {
        // Desktop usa delay simples
        const timer = setTimeout(openPopup, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [shouldOpenPopup, onPopupOpen, property.name, property.latitude, property.longitude])

  return (
    <Marker
      ref={markerRef}
      position={[property.latitude, property.longitude]}
      icon={icon}
    >
      <Popup maxWidth={300} minWidth={250}>
        <div className="p-3 space-y-3">
          {/* Header */}
          <div className="border-b pb-2">
            <h3 className="font-bold text-lg text-gray-900">{property.name}</h3>
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <MapPin className="h-3 w-3 mr-1" />
              {property.cidade}{property.bairro ? `, ${property.bairro}` : ''}
            </div>
          </div>
          
          {/* Property Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-500">TIPO:</span>
              <span className="text-xs font-bold capitalize">{property.property_type}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-500">PROPRIETÁRIO:</span>
              <span className="text-xs font-bold">{property.owner_name}</span>
            </div>
            
            {property.owner_phone && (
              <div className="flex justify-between">
                <span className="text-xs font-medium text-gray-500">TELEFONE:</span>
                <a href={`tel:${property.owner_phone}`} className="text-xs font-bold text-blue-600 hover:underline">
                  {property.owner_phone}
                </a>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-xs font-medium text-gray-500">COORDENADAS:</span>
              <span className="text-xs font-mono">{property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}</span>
            </div>
          </div>
          
          {/* Infrastructure Icons */}
          {(property.has_cameras || property.has_wifi) && (
            <div className="flex space-x-2 pt-2 border-t">
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
          )}
          
          {/* Action Buttons */}
          <div className="pt-3 border-t space-y-2">
            <button
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}&travelmode=driving`;
                window.open(url, '_blank');
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Abrir no Google Maps
            </button>
            
            <button
              onClick={async () => {
                try {
                  const shareData = {
                    title: property.name,
                    text: `${property.name} - ${property.cidade}${property.bairro ? `, ${property.bairro}` : ''}`,
                    url: `https://www.google.com/maps/place/${property.latitude},${property.longitude}`
                  };
                  
                  // Check if Web Share API is supported and available
                  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                    await navigator.share(shareData);
                  } else if (navigator.clipboard && navigator.clipboard.writeText) {
                    // Fallback to clipboard API
                    const textToShare = `${property.name}: https://www.google.com/maps/place/${property.latitude},${property.longitude}`;
                    await navigator.clipboard.writeText(textToShare);
                    alert('Link copiado para a área de transferência!');
                  } else {
                    // Final fallback - create a temporary input element
                    const textToShare = `${property.name}: https://www.google.com/maps/place/${property.latitude},${property.longitude}`;
                    const tempInput = document.createElement('input');
                    tempInput.value = textToShare;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    tempInput.setSelectionRange(0, 99999); // For mobile devices
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    alert('Link copiado para a área de transferência!');
                  }
                } catch (error) {
                  console.log('Erro ao compartilhar:', error);
                  // Fallback quando tudo mais falha
                  const textToShare = `${property.name}: https://www.google.com/maps/place/${property.latitude},${property.longitude}`;
                  try {
                    const tempInput = document.createElement('input');
                    tempInput.value = textToShare;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    tempInput.setSelectionRange(0, 99999);
                    document.execCommand('copy');
                    document.body.removeChild(tempInput);
                    alert('Link copiado para a área de transferência!');
                  } catch (fallbackError) {
                    console.log('Fallback também falhou:', fallbackError);
                    alert(`Link: https://www.google.com/maps/place/${property.latitude},${property.longitude}`);
                  }
                }
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Compartilhar Localização
            </button>
          </div>
          
          {/* Additional Contact Info */}
          {(property.contact_name || property.contact_phone) && (
            <div className="pt-3 border-t space-y-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Contato Adicional</div>
              {property.contact_name && (
                <div className="text-xs text-gray-700">{property.contact_name}</div>
              )}
              {property.contact_phone && (
                <a href={`tel:${property.contact_phone}`} className="text-xs text-blue-600 hover:underline">
                  {property.contact_phone}
                </a>
              )}
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
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

  // Estado para controlar o centro inicial do mapa (só define uma vez)
  const [initialMapCenter, setInitialMapCenter] = useState<[number, number]>([-25.4284, -49.2733])
  const [isInitialCenterSet, setIsInitialCenterSet] = useState(false)
  const [manualMapCenter, setManualMapCenter] = useState<[number, number] | null>(null)
  const [userHasInteracted, setUserHasInteracted] = useState(false)
  const [forceOpenPopup, setForceOpenPopup] = useState<string | null>(null)
  const [selectedPropertyForMobile, setSelectedPropertyForMobile] = useState<Property | null>(null)

  // Definir centro inicial apenas uma vez quando a localização estiver disponível
  useEffect(() => {
    if (userLocation && hasLocationPermission && !isInitialCenterSet && !userHasInteracted) {
      setInitialMapCenter([userLocation.lat, userLocation.lng])
      setIsInitialCenterSet(true)
    }
  }, [userLocation, hasLocationPermission, isInitialCenterSet, userHasInteracted])

  // Centro final do mapa (prioridade: manual > inicial)
  const finalMapCenter = manualMapCenter || initialMapCenter

  // Memoizar fetchMapData para evitar recriações desnecessárias
  const fetchMapData = useCallback(async () => {
    try {
      // Se não há filtros definidos, não carregar nada
      if (!selectedBatalhao && !selectedCia) {
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
          query = query.eq('batalhao', selectedBatalhao)
        }
        if (selectedCia) {
          query = query.eq('cia', selectedCia)
        }

        const { data, error } = await query

        if (error) throw error

        if (data && data.length > 0) {
          allProperties = [...allProperties, ...data]
          from += pageSize
        } else {
          break
        }
      }

      setProperties(allProperties)

      // Fetch vehicles
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)

      if (vehiclesError) throw vehiclesError
      setVehicles(vehiclesData || [])
      
    } catch (error) {
      console.error('Erro ao buscar dados do mapa:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedBatalhao, selectedCia])

  // Definir filtros padrão baseados no perfil do usuário
  useEffect(() => {
    if (userProfile) {
      setSelectedBatalhao(userProfile.batalhao || '')
      setSelectedCia(userProfile.cia || '')
    }
  }, [userProfile])

  // Carregamento quando os filtros mudarem
  useEffect(() => {
    if (selectedBatalhao !== undefined && selectedCia !== undefined) {
      fetchMapData()
    }
  }, [fetchMapData, selectedBatalhao, selectedCia])

  // Effect to handle URL parameters for property selection - otimizado
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const propertyId = urlParams.get('property')
    const lat = urlParams.get('lat')
    const lng = urlParams.get('lng')
    
    if (propertyId && lat && lng && properties.length > 0) {
      const property = properties.find(p => p.id === propertyId)
      if (property && selectedProperty?.id !== propertyId) {
        setSelectedProperty(property)
        setManualMapCenter([parseFloat(lat), parseFloat(lng)])
        setSearchTerm(property.name)
        
        // Clear URL parameters after processing
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [properties, selectedProperty?.id])


  // Filter functions - memoizadas para performance
  const getFilteredProperties = useMemo(() => {
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
  }, [properties, propertyTypeFilter, camerasFilter, wifiFilter, crpmFilter, battalionFilter])

  const getFilteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      if (vehicleStatusFilter !== 'all' && vehicle.status !== vehicleStatusFilter) return false
      return true
    })
  }, [vehicles, vehicleStatusFilter])

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
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    setSelectedProperty(property)
    setManualMapCenter([property.latitude, property.longitude])
    setUserHasInteracted(true)
    setShowSearchResults(false)
    setSearchTerm(property.name)
    setForceOpenPopup(property.id)
    
    // Mobile precisa de mais tempo
    const cleanupDelay = isMobile ? 4000 : 2000
    
    // Limpar o forceOpenPopup após um tempo para evitar loops
    setTimeout(() => setForceOpenPopup(null), cleanupDelay)
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
    <div className="space-y-4 pb-20 lg:pb-0">
      {/* Mobile-First Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Mapa Interativo</h1>
          <p className="text-sm text-muted-foreground">
            {getFilteredProperties.length} propriedades • {getFilteredVehicles.length} veículos
          </p>
        </div>
      </div>

      {/* Mobile-Optimized Area Filter */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Área de Visualização</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="bg-white px-3 py-1 rounded-full border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedBatalhao || 'Todos os Batalhões'}
              </span>
            </div>
            
            {selectedCia && (
              <div className="bg-white px-3 py-1 rounded-full border border-green-200">
                <span className="text-sm font-medium text-green-700">
                  {selectedCia}
                </span>
              </div>
            )}
            
            {userProfile && (selectedBatalhao !== userProfile.batalhao || selectedCia !== userProfile.cia) && (
              <div className="bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                <span className="text-xs font-medium text-orange-700">
                  Filtro personalizado
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="space-y-4">
            {/* Mobile Control Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="h-14 flex flex-col items-center justify-center text-xs"
              >
                <Filter className="h-4 w-4 mb-1" />
                Filtros
              </Button>
              
              <Button
                variant={showProperties ? "default" : "outline"}
                onClick={() => setShowProperties(!showProperties)}
                className="h-14 flex flex-col items-center justify-center text-xs"
              >
                <div className="flex items-center mb-1">
                  {showProperties ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <MapPin className="h-3 w-3 ml-1" />
                </div>
                <span>Props ({getFilteredProperties.length})</span>
              </Button>
              
              <Button
                variant={showVehicles ? "default" : "outline"}
                onClick={() => setShowVehicles(!showVehicles)}
                className="h-14 flex flex-col items-center justify-center text-xs"
              >
                <div className="flex items-center mb-1">
                  {showVehicles ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  <Car className="h-3 w-3 ml-1" />
                </div>
                <span>Veíc ({getFilteredVehicles.length})</span>
              </Button>
            </div>
            
            {/* Mobile-Optimized Search Bar */}
            <div className="relative">
              <div className="space-y-2">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar propriedade..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full h-12 pl-12 pr-12 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {selectedProperty && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setManualMapCenter([selectedProperty.latitude, selectedProperty.longitude])
                      setUserHasInteracted(true)
                    }}
                    className="w-full h-12 flex items-center justify-center text-sm"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Centralizar no Mapa
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
        <CardContent className="p-0 sm:p-6">
          {/* Mobile-Optimized Map Container */}
          <div className="h-[60vh] sm:h-96 w-full rounded-lg overflow-hidden">
            <MapContainer
              center={finalMapCenter}
              zoom={isInitialCenterSet ? 14 : 10}
              style={{ height: '100%', width: '100%' }}
              zoomControl={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
              dragging={true}
            >
              {/* Detector de interações do usuário */}
              <MapInteractionDetector onUserInteraction={() => setUserHasInteracted(true)} />
              
              {/* Controlador do centro do mapa */}
              <MapCenterController center={manualMapCenter} />
              
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
                {showProperties && getFilteredProperties.map((property) => (
                  <ControlledMarker
                    key={property.id}
                    property={property}
                    icon={createPropertyIcon(property)}
                    shouldOpenPopup={forceOpenPopup === property.id}
                    onPopupOpen={() => setForceOpenPopup(null)}
                  />
                ))}

                {showVehicles && getFilteredVehicles.map((vehicle) => (
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
                <span className="text-xs sm:text-sm font-medium">{getFilteredProperties.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Com Câmeras:</span>
                <span className="text-xs sm:text-sm font-medium text-red-600">
                  {getFilteredProperties.filter(p => p.has_cameras).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Veículos Ativos:</span>
                <span className="text-xs sm:text-sm font-medium text-red-600">
                  {getFilteredVehicles.filter(v => v.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Veículos Resolvidos:</span>
                <span className="text-xs sm:text-sm font-medium text-green-600">
                  {getFilteredVehicles.filter(v => v.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs sm:text-sm">Falsos Alarmes:</span>
                <span className="text-xs sm:text-sm font-medium text-gray-600">
                  {getFilteredVehicles.filter(v => v.status === 'false_alarm').length}
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