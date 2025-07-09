import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Edit, Trash2, Search, Shield, Users as UsersIcon } from 'lucide-react'
import TeamSelector from '../components/ui/team-selector'

interface User {
  id: string
  email: string
  role: 'standard_user' | 'team_leader' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  full_name: string
  nome_guerra: string | null
  patente: string | null
  telefone: string | null
  crpm: string | null
  batalhao: string | null
  cia: string | null
  equipe: string | null
  badge_number: string | null
  department: string | null
  created_at: string
  updated_at: string
}

const Users: React.FC = () => {
  const { userProfile } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [crpmFilter, setCrpmFilter] = useState<string>('all')
  const [batalhaoFilter, setBatalhaoFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Mapeamento dos batalhões por CRPM
  const batalhaoPorCrpm = {
    '1º CRPM': ['12º BPM', '13º BPM', '20º BPM', '23º BPM'],
    '2º CRPM': ['2º BPM', '5º BPM', '10º BPM', '15º BPM', '18º BPM', '30º BPM', '6ª CIPM', '11ª CIPM'],
    '3º CRPM': ['4º BPM', '7º BPM', '8º BPM', '11º BPM', '25º BPM', '32º BPM', '3ª CIPM', '5ª CIPM', '9ª CIPM'],
    '4º CRPM': ['1º BPM', '16º BPM', '26º BPM', '27º BPM', '8ª CIPM', '10ª CIPM'],
    '5º CRPM': ['3º BPM', '6º BPM', '14º BPM', '19º BPM', '21º BPM', '31º BPM', '12ª CIPM'],
    '6º CRPM': ['9º BPM', '17º BPM', '22º BPM', '28º BPM', '29º BPM'],
    'Coordenadoria': ['Coordenadoria']
  }

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    nome_guerra: '',
    patente: '',
    telefone: '',
    crpm: '',
    batalhao: '',
    cia: '',
    equipe: '',
    role: 'standard_user' as 'standard_user' | 'team_leader' | 'admin',
    password: ''
  })
  
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdUserData, setCreatedUserData] = useState<{name: string, email: string, password: string} | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve')
  const [approvalResults, setApprovalResults] = useState<any[]>([])
  const [processingApproval, setProcessingApproval] = useState(false)

  // Função para gerar senha simples
  const generateSimplePassword = () => {
    const adjectives = ['Azul', 'Verde', 'Rapido', 'Forte', 'Novo']
    const nouns = ['Gato', 'Casa', 'Carro', 'Sol', 'Mar']
    const numbers = Math.floor(Math.random() * 99) + 1
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    
    return `${adjective}${noun}${numbers}`
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.nome_guerra?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.patente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.crpm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.batalhao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.equipe?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (crpmFilter !== 'all') {
      filtered = filtered.filter(user => user.crpm === crpmFilter)
    }

    if (batalhaoFilter !== 'all') {
      filtered = filtered.filter(user => user.batalhao === batalhaoFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, crpmFilter, batalhaoFilter, statusFilter])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update({
            email: formData.email,
            full_name: formData.full_name,
            nome_guerra: formData.nome_guerra,
            patente: formData.patente,
            telefone: formData.telefone,
            crpm: formData.crpm,
            batalhao: formData.batalhao,
            cia: formData.cia,
            equipe: formData.equipe,
            role: formData.role,
            badge_number: null,
            department: null
          })
          .eq('id', editingUser.id)

        if (error) throw error
      } else {
        // For new users, create using Edge Function
        const passwordToUse = formData.password || generateSimplePassword()
        
        console.log('Creating user with password:', passwordToUse)
        
        // Get the current session token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Sessão não encontrada')
        }
        
        // Call Edge Function to create user
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            email: formData.email,
            password: passwordToUse,
            full_name: formData.full_name,
            nome_guerra: formData.nome_guerra,
            patente: formData.patente,
            telefone: formData.telefone,
            crpm: formData.crpm,
            batalhao: formData.batalhao,
            cia: formData.cia,
            equipe: formData.equipe,
            role: formData.role
          })
        })
        
        const responseText = await response.text()
        console.log('Response status:', response.status)
        console.log('Response text:', responseText)
        
        if (!response.ok) {
          let errorMessage = 'Erro ao criar usuário'
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorMessage
            
            // Traduzir mensagens comuns para português
            if (errorMessage.includes('already been registered')) {
              errorMessage = 'Este email já está registrado no sistema. Use um email diferente.'
            } else if (errorMessage.includes('permission denied')) {
              errorMessage = 'Erro de permissão no sistema. Verifique se você tem privilégios de administrador.'
            }
          } catch (e) {
            errorMessage = responseText || errorMessage
          }
          throw new Error(errorMessage)
        }
        
        const createResult = JSON.parse(responseText)
        console.log('Resultado da edge function:', createResult)
        
        if (!createResult.success) {
          throw new Error(createResult.error || 'Erro ao criar usuário')
        }
        
        // Mostrar modal de sucesso com dados do usuário
        setCreatedUserData({
          name: formData.full_name,
          email: formData.email,
          password: passwordToUse
        })
        setShowSuccessModal(true)
      }

      setShowForm(false)
      setEditingUser(null)
      resetForm()
      fetchUsers()
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      
      // Verifica se é erro de email duplicado
      if (error instanceof Error && error.message.includes('já está registrado')) {
        alert(`❌ Email já existe!\n\n${error.message}\n\nTente usar um email diferente.`)
      } else {
        alert(`❌ Erro ao salvar usuário\n\n${error instanceof Error ? error.message : 'Verifique os dados e tente novamente.'}`)
      }
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      full_name: user.full_name,
      nome_guerra: user.nome_guerra || '',
      patente: user.patente || '',
      telefone: user.telefone || '',
      crpm: user.crpm || '',
      batalhao: user.batalhao || '',
      cia: user.cia || '',
      equipe: user.equipe || '',
      role: user.role,
      password: '' // Não mostra senha existente por segurança
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          throw new Error('Sessão não encontrada')
        }
        
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseKey
          },
          body: JSON.stringify({
            user_id: id
          })
        })
        
        const responseText = await response.text()
        console.log('Delete response status:', response.status)
        console.log('Delete response text:', responseText)
        
        if (!response.ok) {
          let errorMessage = 'Erro ao excluir usuário'
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorMessage
            
            if (errorMessage.includes('cannot delete your own account')) {
              errorMessage = 'Você não pode excluir sua própria conta.'
            } else if (errorMessage.includes('Admin access required')) {
              errorMessage = 'Acesso de administrador necessário para excluir usuários.'
            }
          } catch (e) {
            errorMessage = responseText || errorMessage
          }
          throw new Error(errorMessage)
        }
        
        const deleteResult = JSON.parse(responseText)
        console.log('Delete result:', deleteResult)
        
        if (deleteResult.success) {
          alert('✅ Usuário excluído com sucesso!')
          fetchUsers()
        } else {
          throw new Error(deleteResult.error || 'Erro ao excluir usuário')
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error)
        alert(`❌ Erro ao excluir usuário\n\n${error instanceof Error ? error.message : 'Verifique sua conexão e tente novamente.'}`)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      full_name: '',
      nome_guerra: '',
      patente: '',
      telefone: '',
      crpm: '',
      batalhao: '',
      cia: '',
      equipe: '',
      role: 'standard_user',
      password: ''
    })
  }

  const handleApproveUsers = async (userIds: string[], action: 'approve' | 'reject') => {
    setProcessingApproval(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Sessão não encontrada')
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/approve-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          user_ids: userIds,
          action: action,
          batch: userIds.length > 1
        })
      })
      
      const responseText = await response.text()
      console.log('Approval response status:', response.status)
      console.log('Approval response text:', responseText)
      
      if (!response.ok) {
        let errorMessage = `Erro ao ${action === 'approve' ? 'aprovar' : 'rejeitar'} usuários`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          errorMessage = responseText || errorMessage
        }
        throw new Error(errorMessage)
      }
      
      const result = JSON.parse(responseText)
      console.log('Approval result:', result)
      
      if (result.success) {
        setApprovalResults(result.results || [])
        setShowApprovalModal(true)
        setSelectedUsers([])
        fetchUsers()
      } else {
        throw new Error(result.error || 'Erro na operação')
      }
    } catch (error) {
      console.error('Erro na aprovação:', error)
      alert(`❌ Erro na operação\n\n${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setProcessingApproval(false)
    }
  }

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = (users: User[]) => {
    const pendingUsers = users.filter(u => u.status === 'pending')
    if (selectedUsers.length === pendingUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(pendingUsers.map(u => u.id))
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'team_leader': return 'bg-yellow-100 text-yellow-800'
      case 'standard_user': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'team_leader': return 'Comandante de Equipe'
      case 'standard_user': return 'Usuário Padrão'
      default: return role
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'team_leader': return <UsersIcon className="h-4 w-4" />
      case 'standard_user': return <UsersIcon className="h-4 w-4" />
      default: return <UsersIcon className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'approved': return 'Aprovado'
      case 'rejected': return 'Rejeitado'
      default: return status
    }
  }

  const canDelete = userProfile?.role === 'admin'
  const canEditRole = userProfile?.role === 'admin'

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários do sistema
          </p>
        </div>
        {canEditRole && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar usuários..."
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
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
        <select
          value={crpmFilter}
          onChange={(e) => {
            setCrpmFilter(e.target.value)
            setBatalhaoFilter('all')
          }}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos os CRPMs</option>
          <option value="1º CRPM">1º CRPM</option>
          <option value="2º CRPM">2º CRPM</option>
          <option value="3º CRPM">3º CRPM</option>
          <option value="4º CRPM">4º CRPM</option>
          <option value="5º CRPM">5º CRPM</option>
          <option value="6º CRPM">6º CRPM</option>
          <option value="Coordenadoria">Coordenadoria</option>
        </select>
        <select
          value={batalhaoFilter}
          onChange={(e) => setBatalhaoFilter(e.target.value)}
          className="p-2 border rounded-md"
          disabled={crpmFilter === 'all'}
        >
          <option value="all">Todos os Batalhões</option>
          {crpmFilter !== 'all' && batalhaoPorCrpm[crpmFilter as keyof typeof batalhaoPorCrpm]?.map(batalhao => (
            <option key={batalhao} value={batalhao}>{batalhao}</option>
          ))}
        </select>
      </div>

      {/* Botões de aprovação em massa */}
      {canEditRole && statusFilter === 'pending' && filteredUsers.filter(u => u.status === 'pending').length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedUsers.length === filteredUsers.filter(u => u.status === 'pending').length}
                onChange={() => handleSelectAll(filteredUsers)}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium">
                Selecionar todos ({filteredUsers.filter(u => u.status === 'pending').length} pendentes)
              </span>
            </label>
            {selectedUsers.length > 0 && (
              <span className="text-sm text-blue-600">
                {selectedUsers.length} usuário(s) selecionado(s)
              </span>
            )}
          </div>
          
          {selectedUsers.length > 0 && (
            <div className="flex space-x-2">
              <Button
                onClick={() => handleApproveUsers(selectedUsers, 'approve')}
                disabled={processingApproval}
                className="bg-green-600 hover:bg-green-700"
              >
                {processingApproval ? 'Processando...' : 'Aprovar Selecionados'}
              </Button>
              <Button
                onClick={() => handleApproveUsers(selectedUsers, 'reject')}
                disabled={processingApproval}
                variant="destructive"
              >
                {processingApproval ? 'Processando...' : 'Rejeitar Selecionados'}
              </Button>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dados Pessoais */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Completo *</label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Patente</label>
                  <select
                    value={formData.patente}
                    onChange={(e) => setFormData({...formData, patente: e.target.value})}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Selecione a Patente</option>
                    <option value="Sd.">Sd. (Soldado)</option>
                    <option value="Cb.">Cb. (Cabo)</option>
                    <option value="Sgt.">Sgt. (Sargento)</option>
                    <option value="Asp.">Asp. (Aspirante)</option>
                    <option value="Ten.">Ten. (Tenente)</option>
                    <option value="Maj.">Maj. (Major)</option>
                    <option value="Cap.">Cap. (Capitão)</option>
                    <option value="TC.">TC. (Tenente Coronel)</option>
                    <option value="Cel.">Cel. (Coronel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome de Guerra</label>
                  <Input
                    value={formData.nome_guerra}
                    onChange={(e) => setFormData({...formData, nome_guerra: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefone</label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Função</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value as any})}
                    className="w-full p-2 border rounded-md"
                    disabled={!canEditRole}
                  >
                    <option value="standard_user">Usuário Padrão</option>
                    <option value="team_leader">Comandante de Equipe</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Senha</label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Deixe em branco para gerar senha automaticamente"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Se não informar uma senha, será gerada automaticamente uma senha simples
                  </p>
                </div>
              )}


              {/* Organização Militar */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3">Organização Militar</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">CRPM</label>
                    <select
                      value={formData.crpm}
                      onChange={(e) => setFormData({...formData, crpm: e.target.value, batalhao: ''})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione o CRPM</option>
                      <option value="1º CRPM">1º CRPM - Curitiba</option>
                      <option value="2º CRPM">2º CRPM - Londrina</option>
                      <option value="3º CRPM">3º CRPM - Maringá</option>
                      <option value="4º CRPM">4º CRPM - Ponta Grossa</option>
                      <option value="5º CRPM">5º CRPM - Cascavel</option>
                      <option value="6º CRPM">6º CRPM - São José dos Pinhais</option>
                      <option value="Coordenadoria">Coordenadoria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Batalhão</label>
                    <select
                      value={formData.batalhao}
                      onChange={(e) => setFormData({...formData, batalhao: e.target.value})}
                      className="w-full p-2 border rounded-md"
                      disabled={!formData.crpm}
                    >
                      <option value="">Selecione o Batalhão</option>
                      {formData.crpm && batalhaoPorCrpm[formData.crpm as keyof typeof batalhaoPorCrpm]?.map(batalhao => (
                        <option key={batalhao} value={batalhao}>{batalhao}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Companhia</label>
                    <select
                      value={formData.cia}
                      onChange={(e) => setFormData({...formData, cia: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione a Companhia</option>
                      <option value="1ª CIA">1ª CIA</option>
                      <option value="2ª CIA">2ª CIA</option>
                      <option value="3ª CIA">3ª CIA</option>
                      <option value="4ª CIA">4ª CIA</option>
                      <option value="5ª CIA">5ª CIA</option>
                      <option value="Coordenadoria">Coordenadoria</option>
                    </select>
                  </div>
                  <div>
                    <TeamSelector
                      batalhao={formData.batalhao}
                      selectedTeam={formData.equipe}
                      onTeamChange={(team) => setFormData({...formData, equipe: team})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingUser(null)
                    resetForm()
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {statusFilter === 'pending' && user.status === 'pending' && canEditRole && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    )}
                    {getRoleIcon(user.role)}
                    <h3 className="text-lg font-semibold">{user.full_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                      {getStatusText(user.status)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {user.email}
                    </div>
                    <div>
                      <span className="font-medium">Criado em:</span> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                    {user.nome_guerra && (
                      <div>
                        <span className="font-medium">Nome de Guerra:</span> {user.nome_guerra}
                      </div>
                    )}
                    {user.patente && (
                      <div>
                        <span className="font-medium">Patente:</span> {user.patente}
                      </div>
                    )}
                    {user.telefone && (
                      <div>
                        <span className="font-medium">Telefone:</span> {user.telefone}
                      </div>
                    )}
                    {user.crpm && (
                      <div>
                        <span className="font-medium">CRPM:</span> {user.crpm}
                      </div>
                    )}
                    {user.batalhao && (
                      <div>
                        <span className="font-medium">Batalhão:</span> {user.batalhao}
                      </div>
                    )}
                    {user.cia && (
                      <div>
                        <span className="font-medium">Companhia:</span> {user.cia}
                      </div>
                    )}
                    {user.equipe && (
                      <div>
                        <span className="font-medium">Equipe:</span> {user.equipe}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  {user.status === 'pending' && canEditRole && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUsers([user.id], 'approve')}
                        disabled={processingApproval}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApproveUsers([user.id], 'reject')}
                        disabled={processingApproval}
                        variant="destructive"
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {user.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDelete && user.id !== userProfile?.id && user.status === 'approved' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Modal de Sucesso */}
      {showSuccessModal && createdUserData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Usuário Criado com Sucesso!
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                <div className="space-y-2">
                  <div>
                    <strong>Nome:</strong> {createdUserData.name}
                  </div>
                  <div>
                    <strong>Email:</strong> {createdUserData.email}
                  </div>
                  <div>
                    <strong>Senha:</strong> {createdUserData.password}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Copie essas informações e envie para o usuário. Ele poderá alterar a senha no primeiro acesso.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={() => {
                    const text = `Nome: ${createdUserData.name}\nEmail: ${createdUserData.email}\nSenha: ${createdUserData.password}`;
                    navigator.clipboard.writeText(text);
                    alert('Dados copiados para a área de transferência!');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  Copiar Dados
                </Button>
                <Button
                  onClick={() => {
                    setShowSuccessModal(false);
                    setCreatedUserData(null);
                  }}
                  className="flex-1"
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resultados da Aprovação */}
      {showApprovalModal && approvalResults.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Operação Concluída com Sucesso!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {approvalResults.length} usuário(s) processado(s)
              </p>
            </div>
            
            <div className="space-y-4">
              {approvalResults.map((result, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{result.email}</p>
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-medium ${result.status === 'approved' ? 'text-green-600' : 'text-red-600'}`}>
                          {result.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </p>
                    </div>
                  </div>
                  {result.status === 'approved' && result.password && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                      <p className="text-sm font-medium text-blue-800">Senha gerada:</p>
                      <p className="text-sm font-mono text-blue-900">{result.password}</p>
                      <p className="text-xs text-blue-600 mt-1">
                        Envie esta senha para o usuário por email ou outro meio seguro.
                      </p>
                    </div>
                  )}
                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                      <p className="text-sm text-red-800">{result.error}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => {
                  setShowApprovalModal(false);
                  setApprovalResults([]);
                }}
                className="px-8"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users