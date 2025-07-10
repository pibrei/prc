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

    // Para mobile, usar um maximumAge maior para evitar atualizações constantes
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = { lat: latitude, lng: longitude }
        
        // Verificar se a localização mudou significativamente (mais de 100 metros)
        if (userLocation) {
          const distance = calculateDistance(userLocation, newLocation)
          if (distance < 0.1) { // Menos de 100 metros, não atualizar
            return
          }
        }
        
        setUserLocation(newLocation)
        console.log('Localização atualizada:', latitude, longitude)
      },
      (error) => {
        console.error('Erro no monitoramento de localização:', error)
        // Não definir erro aqui para não interferir na experiência do usuário
      },
      {
        enableHighAccuracy: !isMobile, // Menos precisão no mobile para economizar bateria
        timeout: 30000,
        maximumAge: isMobile ? 300000 : 60000 // 5 minutos no mobile, 1 minuto no desktop
      }
    )

    setWatchId(id)
  }

  // Função para calcular distância entre duas coordenadas em km
  const calculateDistance = (pos1: { lat: number; lng: number }, pos2: { lat: number; lng: number }) => {
    const R = 6371 // Raio da Terra em km
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
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