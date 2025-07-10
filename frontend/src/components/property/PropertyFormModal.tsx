import React, { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import Modal from '../ui/modal'
import LocationInput from '../ui/location-input'
import TeamSelector from '../ui/team-selector'
import { useAuth } from '../../contexts/AuthContext'
import { ChevronDown, ChevronUp, Camera, Wifi } from 'lucide-react'

interface Property {
  id: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  cidade: string
  bairro: string | null
  numero_placa: string | null
  crpm: string
  batalhao: string
  cia: string | null
  equipe: string | null
  owner_name: string
  owner_phone: string | null
  owner_rg: string | null
  has_wifi: boolean
  wifi_password: string | null
  has_cameras: boolean
  cameras_count: number
  residents_count: number | null
  activity: string | null
  bou: string | null
  observations: string | null
  contact_name: string | null
  contact_phone: string | null
  contact_observations: string | null
  property_type: 'rural' | 'urban' | 'mixed'
  cadastro_date: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface PropertyFormModalProps {
  isOpen: boolean
  onClose: () => void
  editingProperty: Property | null
  onSubmit: (formData: any) => Promise<void>
}

const PropertyFormModal: React.FC<PropertyFormModalProps> = ({
  isOpen,
  onClose,
  editingProperty,
  onSubmit
}) => {
  const { userProfile } = useAuth()
  
  // Mobile-first accordion states
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: false,
    owner: false,
    military: false,
    infrastructure: false,
    additional: false
  })
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    latitude: '',
    longitude: '',
    cidade: '',
    bairro: '',
    numero_placa: '',
    crpm: userProfile?.crpm || '',
    batalhao: userProfile?.batalhao || '',
    cia: '',
    equipe: '',
    owner_name: '',
    owner_phone: '',
    owner_rg: '',
    has_wifi: false,
    wifi_password: '',
    has_cameras: false,
    cameras_count: 0,
    residents_count: '',
    activity: '',
    bou: '',
    observations: '',
    contact_name: '',
    contact_phone: '',
    contact_observations: '',
    property_type: 'rural' as 'rural',
    cadastro_date: new Date().toISOString().split('T')[0]
  })

  // Initialize form data when editing property changes
  useEffect(() => {
    if (editingProperty) {
      setFormData({
        name: editingProperty.name,
        description: editingProperty.description || '',
        latitude: editingProperty.latitude.toString(),
        longitude: editingProperty.longitude.toString(),
        cidade: editingProperty.cidade || '',
        bairro: editingProperty.bairro || '',
        numero_placa: editingProperty.numero_placa || '',
        crpm: editingProperty.crpm || '',
        batalhao: editingProperty.batalhao || '',
        cia: editingProperty.cia || '',
        equipe: editingProperty.equipe || '',
        owner_name: editingProperty.owner_name || '',
        owner_phone: editingProperty.owner_phone || '',
        owner_rg: editingProperty.owner_rg || '',
        has_wifi: editingProperty.has_wifi || false,
        wifi_password: editingProperty.wifi_password || '',
        has_cameras: editingProperty.has_cameras || false,
        cameras_count: editingProperty.cameras_count || 0,
        residents_count: editingProperty.residents_count?.toString() || '',
        activity: editingProperty.activity || '',
        bou: editingProperty.bou || '',
        observations: editingProperty.observations || '',
        contact_name: editingProperty.contact_name || '',
        contact_phone: editingProperty.contact_phone || '',
        contact_observations: editingProperty.contact_observations || '',
        property_type: editingProperty.property_type,
        cadastro_date: editingProperty.cadastro_date || new Date().toISOString().split('T')[0]
      })
    } else {
      // Reset form for new property
      setFormData({
        name: '',
        description: '',
        latitude: '',
        longitude: '',
        cidade: '',
        bairro: '',
        numero_placa: '',
        crpm: userProfile?.crpm || '',
        batalhao: userProfile?.batalhao || '',
        cia: userProfile?.cia || '',
        equipe: userProfile?.equipe || '',
        owner_name: '',
        owner_phone: '',
        owner_rg: '',
        has_wifi: false,
        wifi_password: '',
        has_cameras: false,
        cameras_count: 0,
        residents_count: '',
        activity: '',
        bou: '',
        observations: '',
        contact_name: '',
        contact_phone: '',
        contact_observations: '',
        property_type: 'rural',
        cadastro_date: new Date().toISOString().split('T')[0]
      })
    }
  }, [editingProperty, userProfile])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const SectionHeader = ({ 
    title, 
    section, 
    required = false 
  }: { 
    title: string
    section: keyof typeof expandedSections
    required?: boolean 
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg font-medium text-gray-900">{title}</span>
        {required && <span className="text-red-500 text-sm">*</span>}
      </div>
      {expandedSections[section] ? 
        <ChevronUp className="h-5 w-5 text-gray-500" /> : 
        <ChevronDown className="h-5 w-5 text-gray-500" />
      }
    </button>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProperty ? 'Editar Propriedade' : 'Nova Propriedade'}
      size="full"
    >
      <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
        
        {/* Seção: Informações Básicas */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Informações Básicas" section="basic" required />
          {expandedSections.basic && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Nome da Propriedade *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="h-12 text-base"
                  placeholder="Ex: Fazenda São José"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Data de Cadastro *
                </label>
                <Input
                  type="date"
                  value={formData.cadastro_date}
                  onChange={(e) => setFormData({...formData, cadastro_date: e.target.value})}
                  required
                  className="h-12 text-base"
                />
              </div>

            </div>
          )}
        </div>

        {/* Seção: Localização */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Localização" section="location" required />
          {expandedSections.location && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Cidade *
                  </label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                    required
                    className="h-12 text-base"
                    placeholder="Ex: Curitiba"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Bairro
                  </label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({...formData, bairro: e.target.value})}
                    className="h-12 text-base"
                    placeholder="Ex: Centro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Número da Placa
                  </label>
                  <Input
                    value={formData.numero_placa}
                    onChange={(e) => setFormData({...formData, numero_placa: e.target.value})}
                    className="h-12 text-base"
                    placeholder="Ex: 123"
                  />
                </div>
              </div>

              <div className="mt-4">
                <LocationInput
                  latitude={parseFloat(formData.latitude) || -25.4284}
                  longitude={parseFloat(formData.longitude) || -49.2733}
                  onLocationChange={(lat, lng) => {
                    setFormData({
                      ...formData,
                      latitude: lat.toString(),
                      longitude: lng.toString()
                    })
                  }}
                  label="Coordenadas Geográficas *"
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Seção: Informações do Proprietário */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Proprietário" section="owner" required />
          {expandedSections.owner && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Nome do Proprietário *
                </label>
                <Input
                  value={formData.owner_name}
                  onChange={(e) => setFormData({...formData, owner_name: e.target.value})}
                  required
                  className="h-12 text-base"
                  placeholder="Ex: João Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Telefone
                </label>
                <Input
                  value={formData.owner_phone}
                  onChange={(e) => setFormData({...formData, owner_phone: e.target.value})}
                  className="h-12 text-base"
                  placeholder="(41) 99999-9999"
                  type="tel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  RG
                </label>
                <Input
                  value={formData.owner_rg}
                  onChange={(e) => setFormData({...formData, owner_rg: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: 12.345.678-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Seção: Equipe */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Equipe" section="military" />
          {expandedSections.military && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    CRPM
                  </label>
                  <Input
                    value={formData.crpm}
                    onChange={(e) => setFormData({...formData, crpm: e.target.value})}
                    disabled
                    className="h-12 text-base bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Batalhão
                  </label>
                  <Input
                    value={formData.batalhao}
                    onChange={(e) => setFormData({...formData, batalhao: e.target.value})}
                    disabled
                    className="h-12 text-base bg-gray-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Preenchido automaticamente</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Companhia
                  </label>
                  <select
                    value={formData.cia}
                    onChange={(e) => setFormData({...formData, cia: e.target.value})}
                    className="w-full h-12 p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
                  >
                    <option value="">Selecione a Companhia</option>
                    <option value="1ª CIA">1ª CIA</option>
                    <option value="2ª CIA">2ª CIA</option>
                    <option value="3ª CIA">3ª CIA</option>
                    <option value="4ª CIA">4ª CIA</option>
                    <option value="5ª CIA">5ª CIA</option>
                    <option value="Coordenadoria">Coordenadoria</option>
                  </select>
                  <p className="text-xs text-blue-600 mt-1">
                    ✓ Preenchido com sua companhia ({userProfile?.cia || 'Não definida'}) - pode ser alterado se necessário
                  </p>
                </div>
                
                <div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <TeamSelector
                      batalhao={formData.batalhao}
                      selectedTeam={formData.equipe}
                      onTeamChange={(team) => setFormData({...formData, equipe: team})}
                    />
                    <p className="text-xs text-blue-600 mt-2">
                      ✓ Preenchido com sua equipe ({userProfile?.equipe || 'Não definida'}) - pode ser alterado se necessário
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção: Infraestrutura */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Infraestrutura" section="infrastructure" />
          {expandedSections.infrastructure && (
            <div className="p-4 space-y-4">
              {/* WiFi Section */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="has_wifi"
                    checked={formData.has_wifi}
                    onChange={(e) => setFormData({...formData, has_wifi: e.target.checked})}
                    className="h-5 w-5 rounded"
                  />
                  <label htmlFor="has_wifi" className="flex items-center text-base font-medium text-green-800">
                    <Wifi className="h-5 w-5 mr-2" />
                    Possui WiFi
                  </label>
                </div>
                
                {formData.has_wifi && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-green-700">
                      Senha do WiFi
                    </label>
                    <Input
                      value={formData.wifi_password}
                      onChange={(e) => setFormData({...formData, wifi_password: e.target.value})}
                      className="h-12 text-base"
                      placeholder="Senha da rede WiFi"
                      type="password"
                    />
                  </div>
                )}
              </div>

              {/* Cameras Section */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <input
                    type="checkbox"
                    id="has_cameras"
                    checked={formData.has_cameras}
                    onChange={(e) => setFormData({...formData, has_cameras: e.target.checked})}
                    className="h-5 w-5 rounded"
                  />
                  <label htmlFor="has_cameras" className="flex items-center text-base font-medium text-blue-800">
                    <Camera className="h-5 w-5 mr-2" />
                    Possui Câmeras
                  </label>
                </div>
                
                {formData.has_cameras && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-blue-700">
                      Quantidade de Câmeras
                    </label>
                    <Input
                      type="number"
                      value={formData.cameras_count}
                      onChange={(e) => setFormData({...formData, cameras_count: parseInt(e.target.value) || 0})}
                      className="h-12 text-base"
                      min="1"
                      placeholder="Ex: 4"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Seção: Informações Adicionais */}
        <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
          <SectionHeader title="Informações Adicionais" section="additional" />
          {expandedSections.additional && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Número de Moradores
                </label>
                <Input
                  type="number"
                  value={formData.residents_count}
                  onChange={(e) => setFormData({...formData, residents_count: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: 4"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Atividade Principal
                </label>
                <Input
                  value={formData.activity}
                  onChange={(e) => setFormData({...formData, activity: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: Agricultura, Pecuária, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  BOU (Boletim de Ocorrência)
                </label>
                <Input
                  value={formData.bou}
                  onChange={(e) => setFormData({...formData, bou: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: 2024000123"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Observações
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({...formData, observations: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px]"
                  placeholder="Observações importantes sobre a propriedade..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Contato Adicional - Nome
                </label>
                <Input
                  value={formData.contact_name}
                  onChange={(e) => setFormData({...formData, contact_name: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: Maria Silva (caseiro)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Contato Adicional - Telefone
                </label>
                <Input
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({...formData, contact_phone: e.target.value})}
                  className="h-12 text-base"
                  placeholder="(41) 99999-9999"
                  type="tel"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Observações do Contato
                </label>
                <Input
                  value={formData.contact_observations}
                  onChange={(e) => setFormData({...formData, contact_observations: e.target.value})}
                  className="h-12 text-base"
                  placeholder="Ex: Ligar após 18h"
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile-Optimized Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 text-base font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
            >
              {editingProperty ? 'Salvar Alterações' : 'Criar Propriedade'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default PropertyFormModal