import React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ImageModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  alt: string
  title?: string
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  alt,
  title
}) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="relative max-w-4xl max-h-[90vh] mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Fechar modal"
        >
          <X className="h-8 w-8" />
        </button>

        {/* Title */}
        {title && (
          <div className="absolute -top-10 left-0 text-white text-lg font-medium">
            {title}
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={alt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Instructions */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-75">
          Clique fora da imagem ou pressione ESC para fechar
        </div>
      </div>
    </div>
  )

  // Render modal using portal to escape any container constraints
  return createPortal(modalContent, document.body)
}

export default ImageModal