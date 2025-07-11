import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { MapPin } from 'lucide-react'
import LocationPickerModal from '../map/LocationPickerModal'
import { useLocationPicker } from '../../hooks/useLocationPicker'

interface LocationInputProps {
  latitude?: number
  longitude?: number
  onLocationChange: (lat: number, lng: number) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

const LocationInput: React.FC<LocationInputProps> = ({
  latitude,
  longitude,
  onLocationChange,
  label = "Localização",
  placeholder = "Clique para selecionar no mapa",
  required = false,
  disabled = false
}) => {
  const [manualLat, setManualLat] = useState(latitude?.toString() || '')
  const [manualLng, setManualLng] = useState(longitude?.toString() || '')
  const [showManualInput, setShowManualInput] = useState(false)
  
  const {
    isOpen,
    latitude: pickerLat,
    longitude: pickerLng,
    openPicker,
    closePicker,
    handleConfirm,
    handleLocationChange
  } = useLocationPicker()

  const handleOpenPicker = () => {
    // Use provided coordinates or default to Curitiba if none provided
    const defaultLat = latitude || -25.4284
    const defaultLng = longitude || -49.2733
    openPicker(
      defaultLat, 
      defaultLng, 
      // onConfirm callback
      (lat, lng) => {
        onLocationChange(lat, lng)
        setManualLat(lat.toString())
        setManualLng(lng.toString())
      },
      // onLocationChange callback (tempo real)
      (lat, lng) => {
        onLocationChange(lat, lng)
        setManualLat(lat.toString())
        setManualLng(lng.toString())
      }
    )
  }

  const handleManualSubmit = () => {
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    
    if (!isNaN(lat) && !isNaN(lng)) {
      onLocationChange(lat, lng)
      setShowManualInput(false)
    }
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {/* Main input display */}
        <div className="space-y-3">
          <Input
            value={latitude && longitude ? formatCoordinates(latitude, longitude) : ''}
            placeholder="Coordenadas serão preenchidas após coleta"
            readOnly
            disabled={disabled}
            className="w-full h-12 text-base text-center"
          />
          
          {/* Botão GPS destacado e chamativo */}
          <Button
            type="button"
            onClick={handleOpenPicker}
            disabled={disabled}
            className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-bold text-base shadow-lg transform hover:scale-[1.02] transition-all duration-200"
          >
            <MapPin className="w-6 h-6 mr-3 animate-pulse" />
            <div className="flex flex-col items-start">
              <span className="text-white">📍 Coletar Coordenadas GPS</span>
              <span className="text-green-100 text-sm font-normal">Toque aqui para marcar a localização</span>
            </div>
          </Button>
        </div>

        {/* Manual input toggle */}
        {!disabled && (
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <button
              type="button"
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-sm text-blue-600 hover:text-blue-800 text-left"
            >
              {showManualInput ? 'Ocultar' : 'Inserir coordenadas manualmente'}
            </button>
            
            {latitude && longitude && (
              <span className="text-xs sm:text-sm text-gray-500 font-mono">
                {formatCoordinates(latitude, longitude)}
              </span>
            )}
          </div>
        )}

        {/* Manual input fields */}
        {showManualInput && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              type="number"
              step="0.000001"
              placeholder="Latitude"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="text-sm"
            />
            <Input
              type="number"
              step="0.000001"
              placeholder="Longitude"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleManualSubmit}
              className="w-full sm:w-auto"
            >
              Aplicar
            </Button>
          </div>
        )}
      </div>

      {/* Location Picker Modal */}
      <LocationPickerModal
        isOpen={isOpen}
        onClose={closePicker}
        initialLat={pickerLat}
        initialLng={pickerLng}
        onLocationChange={handleLocationChange}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default LocationInput