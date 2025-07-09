import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { Search, Filter, Download, Activity, User, Calendar } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  user_id: string | null
  user_email: string | null
  action: string
  table_name: string
  record_id: string | null
  changes: any
  ip_address: string | null
  user_agent: string | null
}

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [tableFilter, setTableFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  useEffect(() => {
    let filtered = logs.filter(log =>
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.action.includes(actionFilter.toUpperCase()))
    }

    if (tableFilter !== 'all') {
      filtered = filtered.filter(log => log.table_name === tableFilter)
    }

    if (dateFilter) {
      const filterDate = new Date(dateFilter)
      filtered = filtered.filter(log => {
        const logDate = new Date(log.timestamp)
        return logDate.toDateString() === filterDate.toDateString()
      })
    }

    setFilteredLogs(filtered)
  }, [logs, searchTerm, actionFilter, tableFilter, dateFilter])

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1000)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    if (action.includes('CREATED')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATED')) return 'bg-yellow-100 text-yellow-800'
    if (action.includes('DELETED')) return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getActionText = (action: string) => {
    if (action.includes('CREATED')) return 'Criado'
    if (action.includes('UPDATED')) return 'Atualizado'
    if (action.includes('DELETED')) return 'Excluído'
    return action
  }

  const getTableText = (tableName: string) => {
    switch (tableName) {
      case 'users': return 'Usuários'
      case 'properties': return 'Propriedades'
      case 'vehicles': return 'Veículos'
      default: return tableName
    }
  }

  const exportLogs = () => {
    const csvContent = [
      ['Data/Hora', 'Usuário', 'Ação', 'Tabela', 'ID do Registro'],
      ...filteredLogs.map(log => [
        new Date(log.timestamp).toLocaleString(),
        log.user_email || 'Sistema',
        log.action,
        getTableText(log.table_name),
        log.record_id || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatChanges = (changes: any) => {
    if (!changes) return null
    
    try {
      const parsed = typeof changes === 'string' ? JSON.parse(changes) : changes
      return (
        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
          <details>
            <summary className="cursor-pointer font-medium">Ver alterações</summary>
            <pre className="mt-1 whitespace-pre-wrap">{JSON.stringify(parsed, null, 2)}</pre>
          </details>
        </div>
      )
    } catch {
      return null
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
          <p className="text-muted-foreground">
            Monitore todas as ações realizadas no sistema
          </p>
        </div>
        <Button onClick={exportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Pesquisar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="all">Todas as Ações</option>
              <option value="created">Criações</option>
              <option value="updated">Atualizações</option>
              <option value="deleted">Exclusões</option>
            </select>

            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="all">Todas as Tabelas</option>
              <option value="users">Usuários</option>
              <option value="properties">Propriedades</option>
              <option value="vehicles">Veículos</option>
            </select>

            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="p-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <Card key={log.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Activity className="h-4 w-4 text-gray-500" />
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                      {getActionText(log.action)}
                    </span>
                    <span className="text-sm font-medium">{getTableText(log.table_name)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        <span className="font-medium">Usuário:</span> {log.user_email || 'Sistema'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        <span className="font-medium">Data:</span> {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {log.record_id && (
                      <div>
                        <span className="font-medium">ID do Registro:</span> {log.record_id}
                      </div>
                    )}
                  </div>

                  {log.changes && formatChanges(log.changes)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum log de auditoria encontrado</p>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            Mostrando {filteredLogs.length} de {logs.length} logs
          </p>
        </div>
      )}
    </div>
  )
}

export default AuditLogs