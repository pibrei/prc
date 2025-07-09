import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Input } from './input'
import { Plus, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

interface TeamSelectorProps {
  batalhao: string
  selectedTeam: string
  onTeamChange: (team: string) => void
  disabled?: boolean
}

interface TeamOption {
  equipe_name: string
  created_by: string
  created_at: string
}

const TeamSelector: React.FC<TeamSelectorProps> = ({
  batalhao,
  selectedTeam,
  onTeamChange,
  disabled = false
}) => {
  const { userProfile } = useAuth()
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customTeam, setCustomTeam] = useState('')
  const [loading, setLoading] = useState(false)
  const [addingTeam, setAddingTeam] = useState(false)

  useEffect(() => {
    if (batalhao) {
      fetchTeams()
    }
  }, [batalhao])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_teams_by_battalion', { battalion_name: batalhao })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Erro ao buscar equipes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomTeam = async () => {
    if (!customTeam.trim() || !userProfile?.id) return

    setAddingTeam(true)
    try {
      const { data, error } = await supabase
        .rpc('add_team_to_battalion', {
          battalion_name: batalhao,
          team_name: customTeam.trim(),
          user_id: userProfile.id
        })

      if (error) throw error

      if (data && data.length > 0 && data[0].success) {
        // Atualizar lista de equipes
        await fetchTeams()
        
        // Selecionar a nova equipe
        onTeamChange(customTeam.trim())
        
        // Resetar estado
        setCustomTeam('')
        setShowCustomInput(false)
      } else {
        alert(data[0]?.message || 'Erro ao adicionar equipe')
      }
    } catch (error) {
      console.error('Erro ao adicionar equipe:', error)
      alert('Erro ao adicionar equipe')
    } finally {
      setAddingTeam(false)
    }
  }

  const handleCancelCustom = () => {
    setCustomTeam('')
    setShowCustomInput(false)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Equipe</label>
        <div className="w-full p-2 border rounded-md text-gray-500">
          Carregando equipes...
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Equipe</label>
      
      {!showCustomInput ? (
        <div className="space-y-2">
          <select
            value={selectedTeam}
            onChange={(e) => onTeamChange(e.target.value)}
            disabled={disabled || !batalhao}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Selecione uma equipe</option>
            {teams.map((team) => (
              <option key={team.equipe_name} value={team.equipe_name}>
                {team.equipe_name}
              </option>
            ))}
          </select>
          
          {!disabled && batalhao && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Equipe
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={customTeam}
              onChange={(e) => setCustomTeam(e.target.value)}
              placeholder="Nome da nova equipe"
              disabled={addingTeam}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomTeam()
                }
              }}
            />
            <Button
              type="button"
              onClick={handleAddCustomTeam}
              disabled={!customTeam.trim() || addingTeam}
              size="sm"
            >
              <Check className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelCustom}
            disabled={addingTeam}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      )}
      
      {!batalhao && (
        <p className="text-xs text-gray-500">
          Selecione um batalhão primeiro para ver as equipes disponíveis
        </p>
      )}
    </div>
  )
}

export default TeamSelector