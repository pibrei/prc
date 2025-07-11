import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { 
  Settings, 
  History, 
  Trash2, 
  AlertTriangle, 
  Search, 
  Download,
  Eye,
  Calendar,
  User,
  FileText,
  Undo2
} from 'lucide-react'

interface ImportSession {
  id: string
  import_session_id: string
  user_id: string
  user_name: string
  created_at: string
  total_properties: number
  success_count: number
  error_count: number
  status: 'completed' | 'failed' | 'undone'
  properties: ImportedProperty[]
}

interface ImportedProperty {
  id: string
  name: string
  owner_name: string
  cidade: string
  created_at: string
  deleted_at: string | null
}

const AdminTools: React.FC = () => {
  const { userProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'imports' | 'users' | 'system'>('imports')
  const [importSessions, setImportSessions] = useState<ImportSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<ImportSession[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [userFilter, setUserFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [showUndoModal, setShowUndoModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ImportSession | null>(null)
  const [undoingImport, setUndoingImport] = useState(false)

  useEffect(() => {
    if (userProfile?.role === 'admin') {
      fetchImportHistory()
    }
  }, [userProfile])

  useEffect(() => {
    filterSessions()
  }, [importSessions, searchTerm, dateFilter, userFilter])

  const fetchImportHistory = async () => {
    try {
      setLoading(true)
      
      // Buscar sessões de import com dados agregados
      const { data, error } = await supabase.rpc('get_import_history_admin')
      
      if (error) throw error
      setImportSessions(data || [])
    } catch (error) {
      console.error('Erro ao buscar histórico de imports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessionDetails = async (sessionId: string) => {
    try {
      // Buscar propriedades específicas de uma sessão (converter string para UUID)
      const { data, error } = await supabase.rpc('get_session_properties', {
        session_id: sessionId
      })
      
      if (error) throw error
      
      // Atualizar a sessão com os detalhes
      setImportSessions(prev => prev.map(session => 
        session.import_session_id === sessionId 
          ? { ...session, properties: data || [] }
          : session
      ))
    } catch (error) {
      console.error('Erro ao buscar detalhes da sessão:', error)
    }
  }

  const filterSessions = () => {
    let filtered = importSessions

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.import_session_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter).toDateString()
      filtered = filtered.filter(session =>
        new Date(session.created_at).toDateString() === filterDate
      )
    }

    // Filtro por usuário
    if (userFilter !== 'all') {
      filtered = filtered.filter(session => session.user_id === userFilter)
    }

    setFilteredSessions(filtered)
  }

  const handleUndoImport = async () => {
    if (!selectedSession) return

    try {
      setUndoingImport(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Usuário não autenticado')

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/undo-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          import_session_id: selectedSession.import_session_id
        })
      })
      
      if (!response.ok) throw new Error('Erro ao desfazer import')
      
      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Import desfeito com sucesso! ${result.undone_count} propriedades foram excluídas.`)
        setShowUndoModal(false)
        setSelectedSession(null)
        fetchImportHistory() // Recarregar lista
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
    } catch (error) {
      console.error('Erro ao desfazer import:', error)
      alert(`❌ Erro ao desfazer import: ${(error as Error).message}`)
    } finally {
      setUndoingImport(false)
    }
  }

  const toggleSessionExpansion = async (sessionId: string) => {
    if (expandedSession === sessionId) {
      setExpandedSession(null)
    } else {
      setExpandedSession(sessionId)
      const session = importSessions.find(s => s.import_session_id === sessionId)
      if (session && !session.properties?.length) {
        await fetchSessionDetails(sessionId)
      }
    }
  }

  const getStatusBadge = (session: ImportSession) => {
    const successRate = session.total_properties > 0 ? 
      (session.success_count / session.total_properties) * 100 : 0

    if (session.status === 'undone') {
      return (
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Desfeito
        </span>
      )
    } else if (successRate === 100) {
      return (
        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Sucesso Total
        </span>
      )
    } else if (successRate >= 80) {
      return (
        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Sucesso Parcial
        </span>
      )
    } else {
      return (
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
          Falha
        </span>
      )
    }
  }

  const getUniqueUsers = () => {
    const users = importSessions.reduce((acc, session) => {
      if (!acc.find(u => u.id === session.user_id)) {
        acc.push({ id: session.user_id, name: session.user_name })
      }
      return acc
    }, [] as Array<{id: string, name: string}>)
    return users
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Esta página é exclusiva para administradores.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Administração Avançada</h1>
          <p className="text-gray-600">Ferramentas exclusivas para administradores do sistema</p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-gray-500" />
          <span className="text-sm text-gray-500 font-medium">Admin Tools</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('imports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'imports'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Histórico de Imports
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled
          >
            <User className="h-4 w-4 inline mr-2" />
            Gerenciamento de Usuários
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Em breve</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            disabled
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configurações do Sistema
            <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Em breve</span>
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'imports' && (
        <div className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Filtros de Pesquisa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Buscar</label>
                  <Input
                    placeholder="Nome do usuário ou ID da sessão..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data</label>
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Usuário</label>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os usuários</option>
                    {getUniqueUsers().map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Imports */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum import encontrado</h3>
                  <p className="text-gray-600">
                    {importSessions.length === 0 
                      ? 'Ainda não há histórico de importações no sistema.'
                      : 'Tente ajustar os filtros de pesquisa.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredSessions.map((session) => (
                <Card key={session.import_session_id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header da Sessão */}
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Import por {session.user_name}
                            </h3>
                            {getStatusBadge(session)}
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(session.created_at).toLocaleString('pt-BR')}
                            </div>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              {session.total_properties} propriedades
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-600">✓ {session.success_count}</span>
                              {session.error_count > 0 && (
                                <span className="text-red-600 ml-2">✗ {session.error_count}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSessionExpansion(session.import_session_id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {expandedSession === session.import_session_id ? 'Ocultar' : 'Detalhes'}
                          </Button>
                          
                          {session.status !== 'undone' && session.success_count > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedSession(session)
                                setShowUndoModal(true)
                              }}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              Desfazer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detalhes Expandidos */}
                    {expandedSession === session.import_session_id && session.properties && (
                      <div className="p-6 bg-gray-50">
                        <h4 className="font-medium text-gray-900 mb-4">
                          Propriedades Importadas ({session.properties.length})
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {session.properties.map((property) => (
                            <div
                              key={property.id}
                              className={`p-3 rounded-lg border ${
                                property.deleted_at 
                                  ? 'bg-red-50 border-red-200' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{property.name}</span>
                                  <span className="text-gray-600 ml-2">
                                    {property.owner_name} - {property.cidade}
                                  </span>
                                </div>
                                <div className="text-sm">
                                  {property.deleted_at ? (
                                    <span className="text-red-600 font-medium">Excluída</span>
                                  ) : (
                                    <span className="text-green-600 font-medium">Ativa</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação para Desfazer Import */}
      {showUndoModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Desfazer Import
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Esta ação irá <strong>excluir permanentemente</strong> todas as {selectedSession.success_count} propriedades 
                importadas por <strong>{selectedSession.user_name}</strong> em {new Date(selectedSession.created_at).toLocaleString('pt-BR')}.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-800 font-medium text-sm">
                  ⚠️ Esta ação não pode ser desfeita. As propriedades serão marcadas como excluídas no sistema.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUndoModal(false)
                  setSelectedSession(null)
                }}
                className="flex-1"
                disabled={undoingImport}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUndoImport}
                disabled={undoingImport}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {undoingImport ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Desfazendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Confirmar Exclusão
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTools