import React, { createContext, useContext, useEffect, useState } from 'react'

interface GeolocationContextType {
  userLocation: { lat: number; lng: number } | null
  locationError: string | null
  isLocationLoading: boolean
  requestLocationPermission: () => Promise<void>
  hasLocationPermission: boolean
  watchId: number | null
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined)

export const useGeolocation = () => {
  const context = useContext(GeolocationContext)
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider')
  }
  return context
}

export const GeolocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const requestLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada por este navegador')
      return
    }

    setIsLocationLoading(true)
    setLocationError(null)

    try {
      // Primeiro, verificar se já temos permissão
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      
      if (permission.state === 'denied') {
        setLocationError('Permissão de localização foi negada. Habilite nas configurações do navegador.')
        setIsLocationLoading(false)
        return
      }

      // Solicitar localização atual
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          setHasLocationPermission(true)
          setLocationError(null)
          setIsLocationLoading(false)
          
          console.log('Localização obtida:', latitude, longitude)
          
          // Iniciar monitoramento contínuo da localização
          startWatchingLocation()
        },
        (error) => {
          console.error('Erro ao obter localização:', error)
          setIsLocationLoading(false)
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError('Permissão de localização foi negada')
              break
            case error.POSITION_UNAVAILABLE:
              setLocationError('Localização não disponível')
              break
            case error.TIMEOUT:
              setLocationError('Timeout ao obter localização')
              break
            default:
              setLocationError('Erro desconhecido ao obter localização')
              break
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutos
        }
      )
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      setLocationError('Erro ao solicitar permissão de localização')
      setIsLocationLoading(false)
    }
  }

  const startWatchingLocation = () => {
    if (!navigator.geolocation || watchId !== null) return

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ lat: latitude, lng: longitude })
        console.log('Localização atualizada:', latitude, longitude)
      },
      (error) => {
        console.error('Erro no monitoramento de localização:', error)
        // Não definir erro aqui para não interferir na experiência do usuário
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000 // 1 minuto
      }
    )

    setWatchId(id)
  }

  const stopWatchingLocation = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
  }

  // Solicitar permissão automaticamente ao carregar a aplicação
  useEffect(() => {
    // Verificar se já temos localização armazenada
    const storedLocation = localStorage.getItem('userLocation')
    const storedPermission = localStorage.getItem('locationPermission')

    if (storedLocation && storedPermission === 'granted') {
      try {
        const location = JSON.parse(storedLocation)
        setUserLocation(location)
        setHasLocationPermission(true)
      } catch (error) {
        console.error('Erro ao carregar localização armazenada:', error)
      }
    }

    // Solicitar permissão automaticamente
    requestLocationPermission()

    // Cleanup ao desmontar
    return () => {
      stopWatchingLocation()
    }
  }, [])

  // Armazenar localização no localStorage quando ela mudar
  useEffect(() => {
    if (userLocation) {
      localStorage.setItem('userLocation', JSON.stringify(userLocation))
      localStorage.setItem('locationPermission', 'granted')
    }
  }, [userLocation])

  const value = {
    userLocation,
    locationError,
    isLocationLoading,
    requestLocationPermission,
    hasLocationPermission,
    watchId
  }

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  )
}