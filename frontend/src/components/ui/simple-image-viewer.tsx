import React, { useState } from 'react'

interface SimpleImageViewerProps {
  imageUrl: string
  alt: string
  className?: string
  title?: string
}

const SimpleImageViewer: React.FC<SimpleImageViewerProps> = ({
  imageUrl,
  alt,
  className = '',
  title
}) => {
  const [showFullscreen, setShowFullscreen] = useState(false)
  
  const handleImageClick = () => {
    setShowFullscreen(true)
  }

  const handleClose = () => {
    setShowFullscreen(false)
  }

  return (
    <>
      {/* Thumbnail */}
      <div 
        className="relative group cursor-pointer"
        onClick={handleImageClick}
        onMouseDown={(e) => e.preventDefault()}
        style={{ 
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
        }}
      >
        <img
          src={imageUrl}
          alt={alt}
          className={`hover:scale-105 transition-transform pointer-events-none ${className}`}
          onError={(e) => {
            console.error('Erro ao carregar imagem:', e)
            e.currentTarget.style.display = 'none'
          }}
          draggable={false}
        />
        <div 
          className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none"
        >
          <span className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold bg-black bg-opacity-50 px-2 py-1 rounded">
            Clique para ampliar
          </span>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center cursor-pointer"
          style={{ zIndex: 10000 }}
          onClick={handleClose}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] p-4">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute -top-2 -right-2 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-all z-10"
              aria-label="Fechar"
            >
              ✕
            </button>
            
            {title && (
              <div className="text-white text-lg font-medium mb-4 text-center drop-shadow-lg">
                {title}
              </div>
            )}
            <img
              src={imageUrl}
              alt={alt}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="text-white text-sm text-center mt-4 opacity-75 drop-shadow">
              Clique fora da imagem ou no ✕ para fechar
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SimpleImageViewer