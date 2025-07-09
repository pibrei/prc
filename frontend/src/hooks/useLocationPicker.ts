import { useState, useCallback } from 'react'

interface LocationPickerState {
  isOpen: boolean
  latitude: number
  longitude: number
  onConfirm?: (lat: number, lng: number) => void
}

export const useLocationPicker = () => {
  const [state, setState] = useState<LocationPickerState>({
    isOpen: false,
    latitude: -25.4284, // Default to Curitiba
    longitude: -49.2733,
    onConfirm: undefined
  })

  const openPicker = useCallback((
    initialLat: number = -25.4284,
    initialLng: number = -49.2733,
    onConfirm?: (lat: number, lng: number) => void
  ) => {
    setState({
      isOpen: true,
      latitude: initialLat,
      longitude: initialLng,
      onConfirm
    })
  }, [])

  const closePicker = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }))
  }, [])

  const handleConfirm = useCallback((lat: number, lng: number) => {
    state.onConfirm?.(lat, lng)
    closePicker()
  }, [state.onConfirm, closePicker])

  const handleLocationChange = useCallback((lat: number, lng: number) => {
    setState(prev => ({ ...prev, latitude: lat, longitude: lng }))
  }, [])

  return {
    isOpen: state.isOpen,
    latitude: state.latitude,
    longitude: state.longitude,
    openPicker,
    closePicker,
    handleConfirm,
    handleLocationChange
  }
}