import React, { useState } from 'react'
import { Button } from './button'
import { Input } from './input'
import { MapPin } from 'lucide-react'
import LocationPickerModal from '../map/LocationPickerModal'
import { useLocationPicker } from '../../hooks/useLocationPicker'

interface LocationInputProps {
  latitude: number
  longitude: number
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
  const [manualLat, setManualLat] = useState(latitude.toString())
  const [manualLng, setManualLng] = useState(longitude.toString())
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
    openPicker(latitude, longitude, (lat, lng) => {
      onLocationChange(lat, lng)
      setManualLat(lat.toString())
      setManualLng(lng.toString())
    })
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
        <div className="flex gap-2">
          <Input
            value={latitude && longitude ? formatCoordinates(latitude, longitude) : ''}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className="flex-1 text-sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenPicker}
            disabled={disabled}
            className="shrink-0 px-3"
          >
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline sm:ml-2">Selecionar</span>
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