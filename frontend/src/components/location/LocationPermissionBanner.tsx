import React, { useState } from 'react'
import { useGeolocation } from '../../contexts/GeolocationContext'
import { Button } from '../ui/button'
import { MapPin, X, AlertCircle } from 'lucide-react'

const LocationPermissionBanner: React.FC = () => {
  const { 
    userLocation, 
    locationError, 
    isLocationLoading, 
    requestLocationPermission, 
    hasLocationPermission 
  } = useGeolocation()
  
  const [dismissed, setDismissed] = useState(false)

  // Não mostrar se já tem permissão, foi dispensado, ou há erro
  if (hasLocationPermission || dismissed || locationError) {
    return null
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800">
              Permissão de Localização
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              Para melhor experiência, permita o acesso à sua localização. Isso ajudará a 
              centralizar o mapa na sua área de trabalho.
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={requestLocationPermission}
                disabled={isLocationLoading}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLocationLoading ? 'Obtendo localização...' : 'Permitir Localização'}
              </Button>
              <Button
                onClick={() => setDismissed(true)}
                variant="outline"
                size="sm"
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setDismissed(true)}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:bg-blue-100 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default LocationPermissionBanner