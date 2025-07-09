import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import LocationPicker from './LocationPicker'

interface LocationPickerModalProps {
  isOpen: boolean
  onClose: () => void
  initialLat?: number
  initialLng?: number
  onLocationChange: (lat: number, lng: number) => void
  onConfirm: (lat: number, lng: number) => void
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  onLocationChange,
  onConfirm
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Localização</DialogTitle>
        </DialogHeader>
        
        <LocationPicker
          initialLat={initialLat}
          initialLng={initialLng}
          onLocationChange={onLocationChange}
          onConfirm={onConfirm}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  )
}

export default LocationPickerModal