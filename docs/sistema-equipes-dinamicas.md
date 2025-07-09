# Sistema de Equipes Dinâmicas - Documentação Técnica

## Visão Geral

O Sistema de Equipes Dinâmicas permite que usuários criem e gerenciem equipes personalizadas por batalhão, proporcionando flexibilidade organizacional adaptada às necessidades específicas de cada unidade militar.

## Arquitetura

### Banco de Dados

#### Tabela team_options
```sql
CREATE TABLE team_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batalhao TEXT NOT NULL,
    equipe_name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(batalhao, equipe_name)
);
```

#### Políticas RLS
```sql
-- Usuários podem ver equipes do seu batalhão
CREATE POLICY "Users can view teams from their battalion" ON team_options
    FOR SELECT USING (batalhao = (SELECT batalhao FROM users WHERE id = auth.uid()));

-- Usuários podem inserir equipes para seu batalhão
CREATE POLICY "Users can insert teams for their battalion" ON team_options
    FOR INSERT WITH CHECK (batalhao = (SELECT batalhao FROM users WHERE id = auth.uid()));
```

### Funções RPC

#### get_teams_by_battalion
```sql
CREATE OR REPLACE FUNCTION get_teams_by_battalion(battalion_name TEXT)
RETURNS TABLE(equipe_name TEXT, created_by UUID, created_at TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Alpha'::TEXT as equipe_name,
        NULL::UUID as created_by,
        NULL::TIMESTAMP WITH TIME ZONE as created_at
    UNION ALL
    SELECT 'Bravo'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE
    UNION ALL
    SELECT 'Charlie'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE
    UNION ALL
    SELECT 'Delta'::TEXT, NULL::UUID, NULL::TIMESTAMP WITH TIME ZONE
    UNION ALL
    SELECT 
        t.equipe_name,
        t.created_by,
        t.created_at
    FROM team_options t
    WHERE t.batalhao = battalion_name
    ORDER BY equipe_name;
END;
$$;
```

#### add_team_to_battalion
```sql
CREATE OR REPLACE FUNCTION add_team_to_battalion(
    battalion_name TEXT,
    team_name TEXT,
    user_id UUID
) RETURNS JSON[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON[];
BEGIN
    -- Verificar se o usuário tem permissão (mesmo batalhão)
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND batalhao = battalion_name
    ) THEN
        result := ARRAY[json_build_object(
            'success', false,
            'message', 'Usuário não tem permissão para adicionar equipe a este batalhão'
        )];
        RETURN result;
    END IF;
    
    -- Verificar se a equipe já existe
    IF EXISTS (
        SELECT 1 FROM team_options 
        WHERE batalhao = battalion_name AND equipe_name = team_name
    ) THEN
        result := ARRAY[json_build_object(
            'success', false,
            'message', 'Esta equipe já existe para este batalhão'
        )];
        RETURN result;
    END IF;
    
    -- Verificar se não é uma equipe padrão
    IF team_name IN ('Alpha', 'Bravo', 'Charlie', 'Delta') THEN
        result := ARRAY[json_build_object(
            'success', false,
            'message', 'Não é possível adicionar equipes com nomes padrão'
        )];
        RETURN result;
    END IF;
    
    -- Inserir nova equipe
    INSERT INTO team_options (batalhao, equipe_name, created_by)
    VALUES (battalion_name, team_name, user_id);
    
    result := ARRAY[json_build_object(
        'success', true,
        'message', 'Equipe adicionada com sucesso'
    )];
    
    RETURN result;
END;
$$;
```

## Componente TeamSelector

### Interface
```typescript
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
```

### Funcionalidades

#### 1. Carregamento Dinâmico
- Carrega equipes baseadas no batalhão selecionado
- Combina equipes padrão com personalizadas
- Atualização automática quando batalhão muda

#### 2. Adição de Equipes
- Interface para adicionar novas equipes
- Validação de nomes duplicados
- Persistência no banco de dados

#### 3. Estados de Interface
- Loading durante carregamento
- Disabled quando necessário
- Feedback visual para ações

### Implementação

```typescript
const TeamSelector: React.FC<TeamSelectorProps> = ({
  batalhao,
  selectedTeam,
  onTeamChange,
  disabled = false
}) => {
  const [teams, setTeams] = useState<TeamOption[]>([])
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customTeam, setCustomTeam] = useState('')
  const [loading, setLoading] = useState(false)

  // Carrega equipes quando batalhão muda
  useEffect(() => {
    if (batalhao) {
      fetchTeams()
    }
  }, [batalhao])

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .rpc('get_teams_by_battalion', { battalion_name: batalhao })
    
    if (!error) {
      setTeams(data || [])
    }
  }

  const handleAddCustomTeam = async () => {
    const { data, error } = await supabase
      .rpc('add_team_to_battalion', {
        battalion_name: batalhao,
        team_name: customTeam.trim(),
        user_id: userProfile.id
      })
    
    if (!error && data[0].success) {
      await fetchTeams()
      onTeamChange(customTeam.trim())
      setCustomTeam('')
      setShowCustomInput(false)
    }
  }

  // Renderização do componente...
}
```

## Integração com Sistema

### 1. Páginas Integradas
- **Properties.tsx**: Seleção de equipe responsável
- **Users.tsx**: Definição de equipe do usuário
- **Register.tsx**: Seleção de equipe no cadastro

### 2. Padrão de Uso
```typescript
<TeamSelector
  batalhao={formData.batalhao}
  selectedTeam={formData.equipe}
  onTeamChange={(team) => setFormData({...formData, equipe: team})}
/>
```

### 3. Validação
- Batalhão deve estar selecionado antes de mostrar equipes
- Verificação de permissões no backend
- Prevenção de duplicatas

## Equipes Padrão

### Sistema Base
Toda instalação inclui 4 equipes padrão:
- **Alpha**: Equipe principal
- **Bravo**: Equipe secundária
- **Charlie**: Equipe de apoio
- **Delta**: Equipe especial

### Características
- Sempre disponíveis para todos os batalhões
- Não podem ser removidas
- Não podem ser duplicadas como personalizadas
- Ordenação alfabética com personalizadas

## Funcionalidades Avançadas

### 1. Busca e Filtros
- Busca por nome da equipe
- Filtros por batalhão
- Ordenação automática

### 2. Auditoria
- Registro de quem criou cada equipe
- Timestamp de criação
- Rastreamento de modificações

### 3. Validação de Dados
- Nomes únicos por batalhão
- Sanitização de input
- Verificação de permissões

## Performance

### 1. Otimizações
- Cache local de equipes carregadas
- Debounce em operações de busca
- Lazy loading quando necessário

### 2. Consultas Eficientes
- UNION de equipes padrão e personalizadas
- Índices apropriados na tabela
- Consultas otimizadas por batalhão

## Segurança

### 1. Controle de Acesso
- RLS policies por batalhão
- Verificação de permissões nas funções
- Isolamento de dados entre unidades

### 2. Validação
- Sanitização de inputs
- Verificação de duplicatas
- Prevenção de ataques

## Manutenção

### 1. Limpeza de Dados
- Remoção de equipes órfãs
- Verificação de consistência
- Backup regular

### 2. Monitoramento
- Logs de criação de equipes
- Métricas de uso
- Alertas de problemas

## Troubleshooting

### 1. Problemas Comuns
- **Equipes não carregam**: Verificar se batalhão está selecionado
- **Erro ao adicionar**: Verificar permissões e duplicatas
- **Interface travada**: Verificar loading states

### 2. Soluções
- Reload de equipes forçado
- Verificação de conectividade
- Validação de dados de entrada

---

*Documentação atualizada em: $(date)*
*Sistema de Equipes Dinâmicas v1.0.0*
*Integração: Propriedades, Usuários, Registro*