import React, { useState, useCallback } from 'react'
import { Button } from './button'
import { supabase } from '../../lib/supabase'
import { Camera, Upload, X, Image } from 'lucide-react'

interface PhotoUploadProps {
  currentPhotoUrl?: string | null
  onPhotoUploaded: (url: string) => void
  onPhotoRemoved: () => void
  vehicleId?: string
  disabled?: boolean
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  currentPhotoUrl,
  onPhotoUploaded,
  onPhotoRemoved,
  vehicleId,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null)

  // Aggressive image compression function
  const compressImage = useCallback((file: File, maxWidth: number = 800, quality: number = 0.4): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = document.createElement('img')

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        const { width, height } = img
        const ratio = Math.min(maxWidth / width, maxWidth / height)
        const newWidth = Math.round(width * ratio)
        const newHeight = Math.round(height * ratio)

        // Set canvas dimensions
        canvas.width = newWidth
        canvas.height = newHeight

        // Draw and compress image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)
        
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }, [])

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    // Check file size (before compression)
    if (file.size > 50 * 1024 * 1024) { // 50MB max before compression
      alert('Arquivo muito grande. Máximo 50MB.')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Compress the image aggressively
      const compressedBlob = await compressImage(file, 800, 0.4)
      
      if (!compressedBlob) {
        throw new Error('Erro ao comprimir imagem')
      }

      // Create compressed file
      const compressedFile = new File([compressedBlob], file.name, {
        type: 'image/jpeg',
        lastModified: Date.now()
      })

      console.log(`Imagem comprimida: ${file.size} bytes → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% redução)`)

      // Generate unique filename
      const fileExt = 'jpg' // Always save as JPG after compression
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`
      const filePath = `${fileName}`

      setUploadProgress(50)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('vehicle-photos')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      setUploadProgress(90)

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('vehicle-photos')
        .getPublicUrl(data.path)

      const publicUrl = publicUrlData.publicUrl

      setPreviewUrl(publicUrl)
      onPhotoUploaded(publicUrl)

      setUploadProgress(100)
      
      setTimeout(() => {
        setUploading(false)
        setUploadProgress(0)
      }, 500)

    } catch (error) {
      console.error('Erro no upload:', error)
      alert(`Erro ao fazer upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setUploading(false)
      setUploadProgress(0)
    }

    // Reset input
    event.target.value = ''
  }, [compressImage, onPhotoUploaded])

  const handleRemovePhoto = useCallback(async () => {
    if (!currentPhotoUrl) return

    try {
      // Extract file path from URL
      const url = new URL(currentPhotoUrl)
      const filePath = url.pathname.split('/').pop()

      if (filePath) {
        // Delete from storage
        const { error } = await supabase.storage
          .from('vehicle-photos')
          .remove([filePath])

        if (error) {
          console.warn('Erro ao remover arquivo do storage:', error)
        }
      }

      setPreviewUrl(null)
      onPhotoRemoved()
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      alert('Erro ao remover foto')
    }
  }, [currentPhotoUrl, onPhotoRemoved])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">
        Foto do Veículo
      </label>

      {/* Preview Area */}
      {previewUrl && (
        <div className="relative inline-block">
          <img
            src={previewUrl}
            alt="Preview do veículo"
            className="w-32 h-32 object-cover rounded-lg border border-gray-300"
            onError={(e) => {
              console.error('Erro ao carregar imagem:', e)
              setPreviewUrl(null)
            }}
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              title="Remover foto"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Upload Controls */}
      {!disabled && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
              <div
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} flex space-x-2`}
              >
                {uploading ? (
                  <Upload className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span>{uploading ? 'Carregando...' : 'Selecionar Foto'}</span>
              </div>
            </label>
          </div>

          {uploading && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <p className="text-xs text-gray-500">
            Formatos aceitos: JPG, PNG, WebP. A imagem será comprimida automaticamente para otimizar o armazenamento.
          </p>
        </div>
      )}

      {/* Placeholder when no photo */}
      {!previewUrl && (
        <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">Sem foto</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoUpload