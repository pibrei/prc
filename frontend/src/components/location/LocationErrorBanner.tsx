import React, { useState } from 'react'
import { useGeolocation } from '../../contexts/GeolocationContext'
import { Button } from '../ui/button'
import { AlertCircle, X, RefreshCw } from 'lucide-react'

const LocationErrorBanner: React.FC = () => {
  const { 
    locationError, 
    requestLocationPermission, 
    isLocationLoading 
  } = useGeolocation()
  
  const [dismissed, setDismissed] = useState(false)

  // Não mostrar se não há erro ou foi dispensado
  if (!locationError || dismissed) {
    return null
  }

  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded-r-lg">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Erro de Localização
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {locationError}
            </p>
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <Button
                onClick={requestLocationPermission}
                disabled={isLocationLoading}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isLocationLoading ? 'Tentando novamente...' : 'Tentar Novamente'}
              </Button>
              <Button
                onClick={() => setDismissed(true)}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                Dispensar
              </Button>
            </div>
          </div>
        </div>
        <Button
          onClick={() => setDismissed(true)}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:bg-red-100 p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

export default LocationErrorBanner