import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import '../components/map/cluster-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { supabase } from '../lib/supabase'
import { MapPin, Car, Eye, EyeOff, Filter, X } from 'lucide-react'
import { useGeolocation } from '../contexts/GeolocationContext'

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
  
  // Filter states
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>('all')
  const [camerasFilter, setCamerasFilter] = useState<string>('all')
  const [wifiFilter, setWifiFilter] = useState<string>('all')
  const [crpmFilter, setCrpmFilter] = useState<string>('all')
  const [battalionFilter, setBattalionFilter] = useState<string>('all')
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

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

  useEffect(() => {
    fetchMapData()
  }, [])

  const fetchMapData = async () => {
    try {
      const [propertiesResult, vehiclesResult] = await Promise.all([
        supabase.from('properties').select('*'),
        supabase.from('vehicles').select('*').not('latitude', 'is', null).not('longitude', 'is', null)
      ])

      if (propertiesResult.error) throw propertiesResult.error
      if (vehiclesResult.error) throw vehiclesResult.error

      setProperties(propertiesResult.data || [])
      setVehicles(vehiclesResult.data || [])
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

  const clearAllFilters = () => {
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
    const color = property.has_cameras ? '#DC2626' : '#3B82F6' // Red for cameras, blue for regular
    const icon = property.has_cameras ? 'camera' : 'location'
    
    let iconSvg = ''
    if (icon === 'camera') {
      iconSvg = `<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
                 <circle cx="12" cy="13" r="3"/>`
    } else {
      iconSvg = `<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                 <circle cx="12" cy="10" r="3"/>`
    }
    
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          ${iconSvg}
        </svg>
      </div>`,
      iconSize: [25, 25],
      iconAnchor: [12, 25],
      popupAnchor: [0, -25],
      className: 'custom-marker'
    })
  }

  if (loading) {
    return <div className="flex justify-center items-center h-96">Carregando mapa...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa</h1>
        <p className="text-muted-foreground">
          Visualize propriedades e veículos suspeitos no mapa
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Mapa Interativo</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              <Button
                variant={showProperties ? "default" : "outline"}
                size="sm"
                onClick={() => setShowProperties(!showProperties)}
              >
                {showProperties ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                <MapPin className="h-4 w-4 mr-1" />
                Propriedades ({getFilteredProperties().length})
              </Button>
              <Button
                variant={showVehicles ? "default" : "outline"}
                size="sm"
                onClick={() => setShowVehicles(!showVehicles)}
              >
                {showVehicles ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
                <Car className="h-4 w-4 mr-1" />
                Veículos ({getFilteredVehicles().length})
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filtros</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Filtros
                </Button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo de Propriedade</label>
                  <select
                    value={propertyTypeFilter}
                    onChange={(e) => setPropertyTypeFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="rural">Rural</option>
                    <option value="urban">Urbana</option>
                    <option value="mixed">Mista</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Câmeras</label>
                  <select
                    value={camerasFilter}
                    onChange={(e) => setCamerasFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="with_cameras">Com Câmeras</option>
                    <option value="without_cameras">Sem Câmeras</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">WiFi</label>
                  <select
                    value={wifiFilter}
                    onChange={(e) => setWifiFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="with_wifi">Com WiFi</option>
                    <option value="without_wifi">Sem WiFi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">CRPM</label>
                  <select
                    value={crpmFilter}
                    onChange={(e) => setCrpmFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    {getUniqueValues(properties, 'crpm').map((crpm) => (
                      <option key={crpm} value={crpm}>{crpm}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Batalhão</label>
                  <select
                    value={battalionFilter}
                    onChange={(e) => setBattalionFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    {getUniqueValues(properties, 'batalhao').map((batalhao) => (
                      <option key={batalhao} value={batalhao}>{batalhao}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status do Veículo</label>
                  <select
                    value={vehicleStatusFilter}
                    onChange={(e) => setVehicleStatusFilter(e.target.value)}
                    className="w-full p-2 border rounded-md text-sm"
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
        <CardContent>
          <div className="h-96 w-full">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Propriedades</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span className="text-sm">Propriedades com Câmeras</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-sm">Veículos Ativos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm">Veículos Resolvidos</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span className="text-sm">Falsos Alarmes</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Propriedades:</span>
                <span className="text-sm font-medium">{getFilteredProperties().length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Com Câmeras:</span>
                <span className="text-sm font-medium text-red-600">
                  {getFilteredProperties().filter(p => p.has_cameras).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Veículos Ativos:</span>
                <span className="text-sm font-medium text-red-600">
                  {getFilteredVehicles().filter(v => v.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Veículos Resolvidos:</span>
                <span className="text-sm font-medium text-green-600">
                  {getFilteredVehicles().filter(v => v.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Falsos Alarmes:</span>
                <span className="text-sm font-medium text-gray-600">
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