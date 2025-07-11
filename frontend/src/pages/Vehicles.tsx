import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Search, MapPin } from 'lucide-react'
import LocationInput from '../components/ui/location-input'
import PhotoUpload from '../components/ui/photo-upload'
import CitySelector from '../components/ui/city-selector'
import SimpleImageViewer from '../components/ui/simple-image-viewer'

interface Vehicle {
  id: string
  license_plate: string
  make: string | null
  model: string | null
  color: string | null
  year: number | null
  description: string | null
  suspicious_activity: string | null
  location_spotted: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
  spotted_at: string
  photo_url: string | null
  status: 'active' | 'resolved' | 'false_alarm'
  created_by: string
  created_at: string
  updated_at: string
}

const Vehicles: React.FC = () => {
  const { userProfile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    license_plate: '',
    make: '',
    model: '',
    color: '',
    year: '',
    description: '',
    suspicious_activity: '',
    location_spotted: '',
    city: '',
    latitude: '',
    longitude: '',
    photo_url: '',
    status: 'active' as 'active' | 'resolved' | 'false_alarm'
  })

  useEffect(() => {
    fetchVehicles()
  }, [])

  useEffect(() => {
    let filtered = vehicles.filter(vehicle =>
      vehicle.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.location_spotted?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.city?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (statusFilter !== 'all') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter)
    }

    setFilteredVehicles(filtered)
  }, [vehicles, searchTerm, statusFilter])

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('spotted_at', { ascending: false })

      if (error) throw error
      setVehicles(data || [])
    } catch (error) {
      console.error('Erro ao buscar veículos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const vehicleData = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        photo_url: formData.photo_url || null,
        created_by: userProfile?.id
      }

      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleData)
          .eq('id', editingVehicle.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert([vehicleData])

        if (error) throw error
      }

      setShowForm(false)
      setEditingVehicle(null)
      resetForm()
      fetchVehicles()
    } catch (error) {
      console.error('Erro ao salvar veículo:', error)
    }
  }

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      license_plate: vehicle.license_plate,
      make: vehicle.make || '',
      model: vehicle.model || '',
      color: vehicle.color || '',
      year: vehicle.year?.toString() || '',
      description: vehicle.description || '',
      suspicious_activity: vehicle.suspicious_activity || '',
      location_spotted: vehicle.location_spotted || '',
      city: vehicle.city || '',
      latitude: vehicle.latitude?.toString() || '',
      longitude: vehicle.longitude?.toString() || '',
      photo_url: vehicle.photo_url || '',
      status: vehicle.status
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        const { error } = await supabase
          .from('vehicles')
          .delete()
          .eq('id', id)

        if (error) throw error
        fetchVehicles()
      } catch (error) {
        console.error('Erro ao excluir veículo:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      license_plate: '',
      make: '',
      model: '',
      color: '',
      year: '',
      description: '',
      suspicious_activity: '',
      location_spotted: '',
      city: '',
      latitude: '',
      longitude: '',
      photo_url: '',
      status: 'active'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'false_alarm': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'resolved': return 'Resolvido'
      case 'false_alarm': return 'Falso Alarme'
      default: return status
    }
  }

  const canDelete = userProfile?.role === 'admin'

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Veículos Suspeitos</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie veículos suspeitos reportados
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Reportar Veículo
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar veículos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos os Status</option>
          <option value="active">Ativo</option>
          <option value="resolved">Resolvido</option>
          <option value="false_alarm">Falso Alarme</option>
        </select>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingVehicle ? 'Editar Veículo' : 'Reportar Veículo Suspeito'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Placa *</label>
                  <Input
                    value={formData.license_plate}
                    onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="active">Ativo</option>
                    <option value="resolved">Resolvido</option>
                    <option value="false_alarm">Falso Alarme</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Marca</label>
                  <Input
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Modelo</label>
                  <Input
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ano</label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cor</label>
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Local Avistado</label>
                  <Input
                    value={formData.location_spotted}
                    onChange={(e) => setFormData({...formData, location_spotted: e.target.value})}
                    placeholder="Ex: Rua das Flores, 123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cidade</label>
                <CitySelector
                  value={formData.city}
                  onChange={(city) => setFormData({...formData, city})}
                  placeholder="Digite ou selecione a cidade onde foi avistado"
                />
              </div>

              <LocationInput
                latitude={formData.latitude ? parseFloat(formData.latitude) : undefined}
                longitude={formData.longitude ? parseFloat(formData.longitude) : undefined}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat.toString(),
                    longitude: lng.toString()
                  })
                }}
                label="Localização onde foi avistado (opcional)"
                placeholder="Clique para selecionar onde o veículo foi avistado"
              />

              <div>
                <label className="block text-sm font-medium mb-1">Atividade Suspeita</label>
                <textarea
                  value={formData.suspicious_activity}
                  onChange={(e) => setFormData({...formData, suspicious_activity: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descrição Adicional</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
              </div>

              {/* Photo Upload */}
              <PhotoUpload
                currentPhotoUrl={formData.photo_url}
                onPhotoUploaded={(url) => setFormData({...formData, photo_url: url})}
                onPhotoRemoved={() => setFormData({...formData, photo_url: ''})}
                vehicleId={editingVehicle?.id}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingVehicle(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingVehicle ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredVehicles.map((vehicle) => (
          <Card key={vehicle.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{vehicle.license_plate}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                      {getStatusText(vehicle.status)}
                    </span>
                  </div>
                  
                  <div className="flex space-x-6">
                    {/* Vehicle Photo */}
                    <div className="flex-shrink-0">
                      {vehicle.photo_url ? (
                        <SimpleImageViewer
                          imageUrl={vehicle.photo_url}
                          alt={`Veículo ${vehicle.license_plate}`}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                          title={`Veículo ${vehicle.license_plate} - ${vehicle.make ? `${vehicle.make} ${vehicle.model}` : 'Sem marca/modelo'}`}
                        />
                      ) : (
                        <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                          <span className="text-xs text-gray-500 text-center">Sem foto</span>
                        </div>
                      )}
                    </div>

                    {/* Vehicle Information */}
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        {vehicle.make && (
                          <div>
                            <span className="font-medium">Marca:</span> {vehicle.make}
                          </div>
                        )}
                        {vehicle.model && (
                          <div>
                            <span className="font-medium">Modelo:</span> {vehicle.model}
                          </div>
                        )}
                        {vehicle.color && (
                          <div>
                            <span className="font-medium">Cor:</span> {vehicle.color}
                          </div>
                        )}
                        {vehicle.year && (
                          <div>
                            <span className="font-medium">Ano:</span> {vehicle.year}
                          </div>
                        )}
                        {vehicle.location_spotted && (
                          <div>
                            <span className="font-medium">Local:</span> {vehicle.location_spotted}
                          </div>
                        )}
                        {vehicle.city && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-gray-500" />
                            <span className="font-medium">Cidade:</span> 
                            <span>{vehicle.city}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Data:</span> {new Date(vehicle.spotted_at).toLocaleDateString()}
                        </div>
                      </div>

                      {vehicle.suspicious_activity && (
                        <div className="mb-2">
                          <span className="font-medium text-sm">Atividade Suspeita:</span>
                          <p className="text-sm text-gray-600">{vehicle.suspicious_activity}</p>
                        </div>
                      )}

                      {vehicle.description && (
                        <div className="mb-2">
                          <span className="font-medium text-sm">Descrição:</span>
                          <p className="text-sm text-gray-600">{vehicle.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(vehicle)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {canDelete && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(vehicle.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum veículo encontrado</p>
        </div>
      )}
    </div>
  )
}

export default Vehicles