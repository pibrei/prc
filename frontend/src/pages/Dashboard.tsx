import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { supabase } from '../lib/supabase'
import { MapPin, Car, Users, Activity } from 'lucide-react'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    properties: 0,
    vehicles: 0,
    activeVehicles: 0,
    users: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [propertiesResult, vehiclesResult, activeVehiclesResult, usersResult] = await Promise.all([
        supabase.from('properties').select('id', { count: 'exact' }),
        supabase.from('vehicles').select('id', { count: 'exact' }),
        supabase.from('vehicles').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('users').select('id', { count: 'exact' })
      ])

      setStats({
        properties: propertiesResult.count || 0,
        vehicles: vehiclesResult.count || 0,
        activeVehicles: activeVehiclesResult.count || 0,
        users: usersResult.count || 0
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de patrulha rural
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Propriedades Cadastradas
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.properties}</div>
            <p className="text-xs text-muted-foreground">
              Total de propriedades monitoradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Veículos Registrados
            </CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vehicles}</div>
            <p className="text-xs text-muted-foreground">
              Total de veículos suspeitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Casos Ativos
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVehicles}</div>
            <p className="text-xs text-muted-foreground">
              Veículos com status ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuários do Sistema
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users}</div>
            <p className="text-xs text-muted-foreground">
              Total de usuários cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Nova propriedade cadastrada</p>
                  <p className="text-xs text-muted-foreground">Há 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Veículo suspeito reportado</p>
                  <p className="text-xs text-muted-foreground">Há 4 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="text-sm font-medium">Novo usuário adicionado</p>
                  <p className="text-xs text-muted-foreground">Há 6 horas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <a href="/properties" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <span className="font-medium">Cadastrar Propriedade</span>
                </div>
              </a>
              <a href="/vehicles" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <Car className="h-5 w-5 text-red-500" />
                  <span className="font-medium">Reportar Veículo</span>
                </div>
              </a>
              <a href="/map" className="block p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <span className="font-medium">Visualizar Mapa</span>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard