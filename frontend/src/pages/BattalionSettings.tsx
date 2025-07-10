import React from 'react';
import { BattalionBadgeUpload } from '../components/upload/BattalionBadgeUpload';
import { Card } from '../components/ui/card';
import { Settings, Shield } from 'lucide-react';

const BattalionSettings: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Configurações do Batalhão
        </h1>
        <p className="text-gray-600">
          Gerencie as configurações e recursos visuais do seu batalhão
        </p>
      </div>

      <div className="grid gap-6">
        {/* Seção de Brasão PMPR */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Brasão da PMPR
          </h2>
          <p className="text-gray-600 mb-6">
            Configure o brasão oficial da Polícia Militar do Paraná que será usado nos relatórios PDF.
          </p>
          
          <BattalionBadgeUpload 
            badgeType="pmpr"
            title="Brasão da PMPR"
            description="Faça upload do brasão oficial da PMPR para usar nos relatórios"
          />
        </Card>

        {/* Seção de Brasão do Batalhão */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Brasão do Batalhão
          </h2>
          <p className="text-gray-600 mb-6">
            Configure o brasão oficial do batalhão que será usado nos relatórios PDF e documentos oficiais.
          </p>
          
          <BattalionBadgeUpload 
            badgeType="battalion"
          />
        </Card>

        {/* Seção de Informações (futuras expansões) */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Batalhão</h2>
          <div className="text-gray-500 text-center py-8">
            <p>Configurações adicionais estarão disponíveis em futuras atualizações</p>
            <ul className="list-disc list-inside mt-4 space-y-1 text-sm">
              <li>Dados de contato oficial</li>
              <li>Endereço da sede</li>
              <li>Configurações de relatórios</li>
              <li>Templates personalizados</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BattalionSettings;