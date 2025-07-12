import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { MapPin, Navigation } from 'lucide-react'
import { useGeolocation } from '../../contexts/GeolocationContext'

interface LocationPickerProps {
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
  onConfirm: (lat: number, lng: number) => void
  onCancel: () => void
}

// Custom marker icon
const markerIcon = new Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

// Component to handle map clicks
const LocationMarker: React.FC<{
  position: [number, number]
  onLocationChange: (lat: number, lng: number) => void
}> = ({ position, onLocationChange }) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng
      onLocationChange(lat, lng)
    }
  })

  return <Marker position={position} icon={markerIcon} />
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLat = -25.4284,
  initialLng = -49.2733,
  onLocationChange,
  onConfirm,
  onCancel
}) => {
  const { userLocation, hasLocationPermission } = useGeolocation()
  
  // Usar localização do usuário se disponível, senão usar posição inicial
  const getInitialPosition = (): [number, number] => {
    if (userLocation && hasLocationPermission) {
      return [userLocation.lat, userLocation.lng]
    }
    return [initialLat, initialLng]
  }

  const [position, setPosition] = useState<[number, number]>(getInitialPosition())
  const [manualLat, setManualLat] = useState(() => {
    const pos = getInitialPosition()
    return pos[0].toString()
  })
  const [manualLng, setManualLng] = useState(() => {
    const pos = getInitialPosition()
    return pos[1].toString()
  })
  const [loading, setLoading] = useState(false)

  // Atualizar posição quando a localização do usuário estiver disponível
  useEffect(() => {
    if (userLocation && hasLocationPermission) {
      const newPosition: [number, number] = [userLocation.lat, userLocation.lng]
      setPosition(newPosition)
      setManualLat(userLocation.lat.toString())
      setManualLng(userLocation.lng.toString())
      // Notificar o componente pai sobre a nova localização
      onLocationChange(userLocation.lat, userLocation.lng)
    }
  }, [userLocation, hasLocationPermission, onLocationChange])

  useEffect(() => {
    setPosition([initialLat, initialLng])
    setManualLat(initialLat.toString())
    setManualLng(initialLng.toString())
  }, [initialLat, initialLng])

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition([lat, lng])
    setManualLat(lat.toFixed(6))
    setManualLng(lng.toFixed(6))
    // Atualizar o formulário em tempo real
    onLocationChange(lat, lng)
  }

  const handleManualCoordinates = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      handleLocationChange(lat, lng)
    }
  }

  const getCurrentLocation = () => {
    if (userLocation && hasLocationPermission) {
      // Usar localização já disponível
      handleLocationChange(userLocation.lat, userLocation.lng)
    } else {
      // Tentar obter localização se não estiver disponível
      setLoading(true)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords
            handleLocationChange(latitude, longitude)
            setLoading(false)
          },
          (error) => {
            console.error('Error getting location:', error)
            setLoading(false)
          }
        )
      } else {
        alert('Geolocalização não é suportada por este navegador.')
        setLoading(false)
      }
    }
  }


  const handleConfirm = () => {
    onConfirm(position[0], position[1])
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5" />
          Seleção de Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* GPS Location */}
        <div className="space-y-2">
          <Button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            variant={userLocation && hasLocationPermission ? "default" : "outline"}
            size="sm"
            className="w-full"
          >
            <Navigation className="w-4 h-4 mr-2" />
            {loading ? 'Obtendo...' : 
             userLocation && hasLocationPermission ? 'Usar minha localização atual' : 'Usar minha localização'}
          </Button>
        </div>

        {/* Manual Coordinates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Latitude</label>
            <Input
              type="number"
              step="0.000001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="Ex: -25.4284"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Longitude</label>
            <Input
              type="number"
              step="0.000001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="Ex: -49.2733"
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium sm:invisible">Aplicar</label>
            <Button
              type="button"
              onClick={handleManualCoordinates}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Aplicar
            </Button>
          </div>
        </div>

        {/* Map */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Toque no mapa para selecionar a localização
          </label>
          <div className="h-64 sm:h-96 w-full border rounded-lg overflow-hidden">
            <MapContainer
              center={position}
              zoom={13}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={position}
                onLocationChange={handleLocationChange}
              />
            </MapContainer>
          </div>
        </div>

        {/* Coordinates Display */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Coordenadas selecionadas:</strong>
          </p>
          <p className="text-sm font-mono text-gray-800">
            {position[0].toFixed(6)}, {position[1].toFixed(6)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} className="w-full sm:w-auto">
            Confirmar Localização
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default LocationPicker