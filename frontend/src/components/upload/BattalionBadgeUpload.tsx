import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Upload, Image as ImageIcon, Trash2, Check } from 'lucide-react';
import { normalizeBattalionFileName } from '../../utils/fileUtils';

interface BattalionBadgeUploadProps {
  onBadgeChange?: (badgeUrl: string | null) => void;
  badgeType?: 'battalion' | 'pmpr';
  title?: string;
  description?: string;
}

export const BattalionBadgeUpload: React.FC<BattalionBadgeUploadProps> = ({ 
  onBadgeChange,
  badgeType = 'battalion',
  title,
  description
}) => {
  const { userProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentBadgeUrl, setCurrentBadgeUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadCurrentBadge();
  }, [userProfile]);

  const loadCurrentBadge = async () => {
    if (badgeType === 'battalion' && !userProfile?.batalhao) return;

    try {
      const fileName = badgeType === 'pmpr' 
        ? 'pmpr.png' 
        : normalizeBattalionFileName(userProfile.batalhao!);

      const { data } = await supabase.storage
        .from('battalion-badges')
        .getPublicUrl(fileName);

      // Verificar se o arquivo existe
      const response = await fetch(data.publicUrl);
      if (response.ok) {
        setCurrentBadgeUrl(data.publicUrl);
        setPreviewUrl(data.publicUrl);
        if (onBadgeChange) {
          onBadgeChange(data.publicUrl);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar brasão atual:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (badgeType === 'battalion' && !userProfile?.batalhao) return;

    // Validações
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('O arquivo deve ter no máximo 5MB');
      return;
    }

    try {
      setUploading(true);

      // Criar preview local
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload do arquivo
      const fileName = badgeType === 'pmpr' 
        ? 'pmpr.png' 
        : normalizeBattalionFileName(userProfile.batalhao!);
      
      const { error: uploadError } = await supabase.storage
        .from('battalion-badges')
        .upload(fileName, file, {
          upsert: true, // Substitui se já existir
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = await supabase.storage
        .from('battalion-badges')
        .getPublicUrl(fileName);

      setCurrentBadgeUrl(urlData.publicUrl);
      
      if (onBadgeChange) {
        onBadgeChange(urlData.publicUrl);
      }

      alert('Brasão uploaded com sucesso!');

    } catch (error: any) {
      console.error('Erro no upload:', error);
      alert('Erro ao fazer upload: ' + error.message);
      setPreviewUrl(currentBadgeUrl); // Restaurar preview anterior
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveBadge = async () => {
    if (badgeType === 'battalion' && !userProfile?.batalhao) return;
    if (!currentBadgeUrl) return;

    const confirmMessage = badgeType === 'pmpr' 
      ? 'Tem certeza que deseja remover o brasão da PMPR?' 
      : 'Tem certeza que deseja remover o brasão do batalhão?';
    
    if (!confirm(confirmMessage)) return;

    try {
      setUploading(true);

      const fileName = badgeType === 'pmpr' 
        ? 'pmpr.png' 
        : normalizeBattalionFileName(userProfile.batalhao!);
      
      const { error } = await supabase.storage
        .from('battalion-badges')
        .remove([fileName]);

      if (error) throw error;

      setCurrentBadgeUrl(null);
      setPreviewUrl(null);
      
      if (onBadgeChange) {
        onBadgeChange(null);
      }

      alert('Brasão removido com sucesso!');

    } catch (error: any) {
      console.error('Erro ao remover brasão:', error);
      alert('Erro ao remover brasão: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Verificar permissões - apenas admin pode gerenciar brasões
  if (userProfile?.role !== 'admin') {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>Apenas administradores podem gerenciar brasões dos batalhões</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">
            {title || (badgeType === 'pmpr' ? 'Brasão da PMPR' : `Brasão do ${userProfile?.batalhao}`)}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {description || (badgeType === 'pmpr' 
              ? 'Faça upload do brasão oficial da PMPR para usar nos relatórios'
              : 'Faça upload do brasão oficial do batalhão para usar nos relatórios'
            )}
          </p>
        </div>

        {/* Preview */}
        <div className="flex justify-center">
          <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview do brasão"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs text-gray-500">Nenhum brasão</p>
              </div>
            )}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 justify-center">
          <label htmlFor="badge-upload" className="cursor-pointer">
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Selecionar Arquivo'}
            </div>
          </label>
          
          {currentBadgeUrl && (
            <Button
              onClick={handleRemoveBadge}
              disabled={uploading}
              variant="outline"
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover
            </Button>
          )}
        </div>

        {/* Input File Oculto */}
        <input
          id="badge-upload"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Status */}
        {currentBadgeUrl && !uploading && (
          <div className="flex items-center justify-center text-sm text-green-600">
            <Check className="h-4 w-4 mr-1" />
            Brasão configurado
          </div>
        )}

        {/* Instruções */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>Formatos aceitos: PNG, JPG, JPEG, SVG</p>
          <p>Tamanho máximo: 5MB</p>
          <p>Recomendado: 200x200px ou maior, fundo transparente</p>
        </div>
      </div>
    </Card>
  );
};