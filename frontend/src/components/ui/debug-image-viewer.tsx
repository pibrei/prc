import React from 'react'

interface DebugImageViewerProps {
  imageUrl: string
  alt: string
  className?: string
  title?: string
}

const DebugImageViewer: React.FC<DebugImageViewerProps> = ({
  imageUrl,
  alt,
  className = '',
  title
}) => {
  console.log('DebugImageViewer renderizado com:', { imageUrl, alt, title })

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('CLICK DETECTADO!')
    console.log('Event:', e)
    console.log('Image URL:', imageUrl)
    
    // Múltiplas tentativas de abrir a imagem
    try {
      // Tentativa 1: Alert simples
      alert(`Clique detectado! URL: ${imageUrl}`)
      
      // Tentativa 2: Window.open
      const newWindow = window.open(imageUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
      console.log('Window.open resultado:', newWindow)
      
      // Tentativa 3: Criar elemento temporário
      const tempDiv = document.createElement('div')
      tempDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.9);
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      `
      
      const img = document.createElement('img')
      img.src = imageUrl
      img.style.cssText = 'max-width: 90%; max-height: 90%; object-fit: contain;'
      
      tempDiv.appendChild(img)
      tempDiv.onclick = () => document.body.removeChild(tempDiv)
      
      document.body.appendChild(tempDiv)
      
    } catch (error) {
      console.error('Erro ao abrir imagem:', error)
      alert('Erro ao abrir imagem: ' + error)
    }
  }

  const handleMouseEnter = () => {
    console.log('Mouse enter detectado')
  }

  const handleMouseLeave = () => {
    console.log('Mouse leave detectado')
  }

  console.log('Renderizando imagem com URL:', imageUrl)

  return (
    <div 
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <img
        src={imageUrl}
        alt={alt}
        className={`cursor-pointer hover:scale-105 transition-transform border-2 border-red-500 ${className}`}
        onClick={handleClick}
        onMouseDown={(e) => console.log('Mouse down:', e)}
        onMouseUp={(e) => console.log('Mouse up:', e)}
        style={{ 
          pointerEvents: 'auto',
          userSelect: 'none',
          touchAction: 'manipulation'
        }}
        onError={(e) => {
          console.error('Erro ao carregar imagem:', e)
          alert('Erro ao carregar imagem!')
        }}
      />
      <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center pointer-events-none">
        <span className="text-white text-xs font-bold bg-black bg-opacity-75 px-2 py-1 rounded">
          DEBUG: CLIQUE AQUI!
        </span>
      </div>
    </div>
  )
}

export default DebugImageViewer